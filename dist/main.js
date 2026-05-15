"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const mod = __importStar(require("./resource-modifier"));
const mrm_i18n_1 = require("./panels/mrm-i18n");
/** 须与 package.json 的 name 一致，用于 Panel / Message */
const PKG_ID = 'dynamic-resource-modifier_3x';
const LOG_TAG = 'dynamic-resource-modifier';
/** 扩展根目录（main 在 dist/ 下，上一级为插件根） */
function getPluginRoot() {
    return path.join(__dirname, '..');
}
function getLogDir() {
    return path.join(getPluginRoot(), 'log');
}
function localDateStr(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}
function localTimeStr(d = new Date()) {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
}
/** 详情日志中单段 JSON/文本最大长度，避免极大 .meta 撑爆日志 */
const DETAIL_LOG_MAX_CHARS = 16000;
function truncateForLog(s, max) {
    if (s.length <= max)
        return s;
    return `${s.slice(0, max)}\n... [已截断，原文 ${s.length} 字符]`;
}
function writeOperationDetailLog(sectionTitle, body) {
    try {
        const dir = getLogDir();
        fs.mkdirSync(dir, { recursive: true });
        const fileName = `detail-${localDateStr()}.log`;
        const filePath = path.join(dir, fileName);
        const now = new Date();
        const sep = '\n' + '='.repeat(64) + '\n';
        const head = `[${localDateStr(now)} ${localTimeStr(now)}] ${sectionTitle}`;
        fs.appendFileSync(filePath, `${sep}${head}\n${body}\n`, 'utf8');
    }
    catch (e) {
        err('写入详情日志失败: ' + String(e instanceof Error ? e.message : e));
    }
}
function formatBatchRenameDetail(targetDir, res) {
    var _a, _b, _c;
    const lines = [];
    lines.push(`目标目录: ${targetDir}`);
    lines.push(`统计: 成功 ${res.success} / 失败 ${res.failed} / 计划 ${res.total}`);
    if (res.refFiles != null && res.refHits != null) {
        lines.push(`其它文件内文件名引用替换: ${res.refFiles} 个文件 / ${res.refHits} 处`);
    }
    lines.push('');
    lines.push('--- 每个文件（含同名 .meta 若存在则一并改名）---');
    const details = res.details;
    for (const d of details) {
        lines.push(`自: ${(_a = d.from) !== null && _a !== void 0 ? _a : ''}`);
        lines.push(`至: ${(_b = d.to) !== null && _b !== void 0 ? _b : ''}`);
        if (d.ok === false)
            lines.push(`错误: ${(_c = d.message) !== null && _c !== void 0 ? _c : ''}`);
        lines.push('');
    }
    if (res.refChangedDetails && res.refChangedDetails.length) {
        lines.push('--- 其它文件内「文件名.扩展名」引用替换（摘要）---');
        for (const ref of res.refChangedDetails) {
            lines.push(`文件: ${ref.path}`);
            lines.push(`  替换处数: ${ref.hits}`);
            lines.push('');
        }
    }
    if (res.errors.length) {
        lines.push('--- 错误列表 ---');
        for (const e of res.errors) {
            lines.push(`${e.path}: ${e.message}`);
        }
    }
    return lines.join('\n');
}
function formatFolderRenameDetail(targetDir, newName, r) {
    const lines = [
        `原目录: ${targetDir}`,
        `新目录名: ${newName}`,
        `结果: ${r.skipped ? '跳过（同名）' : r.newDir ? `已重命名为 → ${r.newDir}` : JSON.stringify(r)}`,
    ];
    if (r.newDir) {
        lines.push('');
        lines.push(`写入说明: 目录及目录 .meta 已随路径迁移。`);
    }
    return lines.join('\n');
}
function formatUuidDetail(res) {
    var _a;
    const lines = [];
    lines.push(`统计: 成功 ${res.success} / 失败 ${res.failed} / 目标 .meta 数 ${res.total}`);
    lines.push(`引用替换: ${res.refFiles} 个文件 / ${res.refHits} 处`);
    lines.push('');
    if (res.uuidMapping && Object.keys(res.uuidMapping).length) {
        lines.push('--- UUID 映射（旧 -> 新）---');
        for (const [oldU, newU] of Object.entries(res.uuidMapping)) {
            lines.push(`  ${oldU} -> ${newU}`);
        }
        lines.push('');
    }
    lines.push('--- 目标 .meta（写入后的 JSON 内容）---');
    const details = res.details;
    for (const d of details) {
        if (!d.meta)
            continue;
        lines.push(`文件: ${d.meta}`);
        if ((_a = d.uuidChanges) === null || _a === void 0 ? void 0 : _a.length) {
            for (const c of d.uuidChanges) {
                lines.push(`  UUID: ${c.oldUuid} -> ${c.newUuid}`);
            }
        }
        if (typeof d.jsonContent === 'string') {
            lines.push('内容:');
            lines.push(truncateForLog(d.jsonContent, DETAIL_LOG_MAX_CHARS));
        }
        lines.push('');
    }
    if (res.refChangedDetails && res.refChangedDetails.length) {
        lines.push('--- 项目内引用替换（文本文件，内容为全文件替换 UUID 串后的结果）---');
        for (const ref of res.refChangedDetails) {
            lines.push(`文件: ${ref.path}`);
            lines.push(`  本文件内替换次数: ${ref.hits}`);
            lines.push('');
        }
    }
    if (res.errors.length) {
        lines.push('--- 错误 ---');
        for (const e of res.errors) {
            lines.push(`${e.path}: ${e.message}`);
        }
    }
    return lines.join('\n');
}
function formatMd5Detail(res) {
    var _a;
    const lines = [];
    lines.push(`统计: 成功 ${res.success} / 失败 ${res.failed} / 共 ${res.total}`);
    lines.push('');
    for (const d of res.details) {
        lines.push(`文件: ${d.file}`);
        lines.push(`  MD5: ${d.md5Before} -> ${(_a = d.md5After) !== null && _a !== void 0 ? _a : '(未计)'}`);
        if (d.ver)
            lines.push(`  .meta ver: ${d.ver.oldVer} -> ${d.ver.newVer}`);
        if (d.touch)
            lines.push(`  touch: ${JSON.stringify(d.touch)}`);
        lines.push('');
    }
    if (res.errors.length) {
        lines.push('--- 错误 ---');
        for (const e of res.errors) {
            lines.push(`${e.path}: ${e.message}`);
        }
    }
    return lines.join('\n');
}
function getProjectAssetsPath() {
    try {
        const proj = Editor.Project.path;
        return path.join(proj, 'assets');
    }
    catch {
        return '';
    }
}
function getProjectExtraScanRoots() {
    try {
        const proj = Editor.Project.path;
        return [path.join(proj, 'settings'), path.join(proj, 'profiles')];
    }
    catch {
        return [];
    }
}
function sameProjectPath(a, b) {
    const x = path.normalize(a).replace(/\\/g, '/').toLowerCase();
    const y = path.normalize(b).replace(/\\/g, '/').toLowerCase();
    return x === y;
}
function log(msg) {
    console.log(`[${LOG_TAG}] ${msg}`);
}
function warn(msg) {
    console.warn(`[${LOG_TAG}] ${msg}`);
}
function err(msg) {
    console.error(`[${LOG_TAG}] ${msg}`);
}
async function refreshAssetDB(urlOrUuid) {
    try {
        await Editor.Message.request('asset-db', 'refresh-asset', urlOrUuid || 'db://assets');
    }
    catch (e) {
        warn('refresh-asset 失败: ' + (e instanceof Error ? e.message : String(e)));
    }
}
/** 整库/批量改 UUID 后重导入，使子资源 UUID 与 library 一致，缓解 The asset is missing。可能较慢。 */
async function reimportEntireAssets() {
    try {
        log('正在 reimport-asset db://assets（请稍候）…');
        await Editor.Message.request('asset-db', 'reimport-asset', 'db://assets');
    }
    catch (e) {
        warn('reimport-asset 失败: ' + (e instanceof Error ? e.message : String(e)));
    }
}
exports.methods = {
    async openPanel() {
        // 与官方文档一致：仅 default 面板时传扩展名即可，勿用 `${name}.default`
        Editor.Panel.open(PKG_ID);
    },
    /**
     * 将面板「执行结果」追加写入插件根目录 log/（按日滚动 result-YYYY-MM-DD.log）
     */
    appendResultLog(payload) {
        try {
            const line = (payload && typeof payload.line === 'string' ? payload.line : '').replace(/\r\n/g, '\n').trim();
            if (!line)
                return { ok: true };
            const dir = getLogDir();
            fs.mkdirSync(dir, { recursive: true });
            const fileName = `result-${localDateStr()}.log`;
            const filePath = path.join(dir, fileName);
            const now = new Date();
            const header = `[${localDateStr(now)} ${localTimeStr(now)}] `;
            fs.appendFileSync(filePath, header + line.replace(/\n/g, '\n' + ' '.repeat(header.length)) + '\n', 'utf8');
            return { ok: true, path: filePath };
        }
        catch (e) {
            const message = String(e instanceof Error ? e.message : e);
            err('写入执行结果日志失败: ' + message);
            return { ok: false, message };
        }
    },
    async pickDirectory() {
        try {
            const r = await Editor.Dialog.select({
                title: (0, mrm_i18n_1.mrmTMsg)((0, mrm_i18n_1.mrmLoad)(), 'pickDir'),
                type: 'directory',
                path: getProjectAssetsPath(),
            });
            if (r && r.filePaths && r.filePaths.length) {
                return { ok: true, path: r.filePaths[0] };
            }
            return { ok: false };
        }
        catch (e) {
            return { ok: false, message: String(e instanceof Error ? e.message : e) };
        }
    },
    async getDefaultDirectory() {
        return { ok: true, path: getProjectAssetsPath() };
    },
    /**
     * 与编辑器 **当前** 界面语言一致，供面板在无法访问 `Editor.I18n` 时选择 zh/en 资源（勿依赖 OS `navigator`）。
     */
    getMrmLocale() {
        const e = (0, mrm_i18n_1.mrmReadEditorI18nIsZh)();
        return { ok: true, zh: e === true };
    },
    async previewBatchRename(payload) {
        try {
            const { targetDir, rule } = payload || {};
            const dir = targetDir || getProjectAssetsPath();
            const list = mod.collectRenameTargets(dir, rule || { mode: 'replace' });
            const changed = list.filter((x) => x.changed);
            const limited = changed.slice(0, 200);
            return {
                ok: true,
                total: list.length,
                changed: changed.length,
                preview: limited,
                truncated: changed.length > limited.length,
            };
        }
        catch (e) {
            return { ok: false, message: String(e instanceof Error ? e.message : e) };
        }
    },
    async runBatchRename(payload) {
        try {
            const { targetDir, rule } = payload || {};
            const dir = targetDir || getProjectAssetsPath();
            const assets = getProjectAssetsPath();
            log(`批量改名开始: ${dir}`);
            const res = mod.batchRenameFiles(dir, rule || { mode: 'replace' }, assets);
            const refLog = res.refFiles != null && res.refHits != null
                ? `；文件名引用 ${res.refFiles} 文件 / ${res.refHits} 处`
                : '';
            log(`批量改名完成: 成功 ${res.success} / 失败 ${res.failed} / 共 ${res.total}${refLog}`);
            writeOperationDetailLog('批量修改资源名称', formatBatchRenameDetail(dir, res));
            await refreshAssetDB();
            return { ok: true, result: res };
        }
        catch (e) {
            const msg = String(e instanceof Error ? e.message : e);
            err('批量改名失败: ' + msg);
            writeOperationDetailLog('批量修改资源名称 [失败]', msg);
            return { ok: false, message: msg };
        }
    },
    async runFolderRename(payload) {
        try {
            const { targetDir, newName } = payload || {};
            if (!targetDir || !newName)
                throw new Error('目标目录或新名称为空');
            log(`目录改名: ${targetDir} -> ${newName}`);
            const r = mod.renameFolder(targetDir, newName);
            writeOperationDetailLog('修改资源目录名称', formatFolderRenameDetail(targetDir, newName, r));
            await refreshAssetDB();
            return { ok: true, result: r };
        }
        catch (e) {
            const msg = String(e instanceof Error ? e.message : e);
            err('目录改名失败: ' + msg);
            writeOperationDetailLog('修改资源目录名称 [失败]', msg);
            return { ok: false, message: msg };
        }
    },
    async runUuidModify(payload) {
        try {
            const { target, scope, updateReferences, includeSettingsProfiles, uuidGenMode, mergeObfuscateSecrets, saltCerPath, saltProductName, saltAppVersion, saltBuildNonce, saltBuildNonceRandom, saltPlatformType, saltProductUuid, pathIncludePatterns, pathExcludePatterns, pathSkipExt, pathSkipExtEnabled, includeDirectoryUuids, } = payload || {};
            if (!target)
                throw new Error('目标为空');
            const assetsRoot = getProjectAssetsPath();
            const includeSP = includeSettingsProfiles !== false;
            const extraRoots = includeSP ? getProjectExtraScanRoots() : [];
            let projectRoot = '';
            try {
                projectRoot = Editor.Project.path;
            }
            catch {
                projectRoot = '';
            }
            if ((scope || 'single') === 'dir-all' && assetsRoot && sameProjectPath(assetsRoot, target)) {
                warn('正在对整库 assets 做「目录下递归全部」UUID 修改，引用范围：' +
                    (includeSP ? 'assets + settings + profiles' : '仅 assets') +
                    '。请务必已备份。');
                warn('全库改 UUID 后：若仍出现 The asset ... is missing，请关闭项目后删除工程根下 library/ 与 temp/ 再打开，或使用菜单「资源」→ 重新导入资源 以刷新缓存。');
            }
            const genMode = (uuidGenMode || 'random-v4');
            const includeDirUuids = includeDirectoryUuids === true;
            log(`UUID 修改: mode=${genMode}, scope=${scope}, target=${target}, updateRefs=${updateReferences !== false}, 更改目录UUID=${includeDirUuids}, extraRoots=${extraRoots.length ? extraRoots.join(';') : '(无，仅 assets)'}`);
            const res = mod.modifyUuid(assetsRoot, target, (scope || 'single'), {
                updateReferences: updateReferences !== false,
                extraRoots,
                uuidGenMode: genMode,
                projectRoot: projectRoot || undefined,
                includeDirectoryUuids: includeDirUuids,
                salt: genMode === 'salt-v4'
                    ? {
                        saltCerPath: saltCerPath || '',
                        saltProductName: saltProductName || '',
                        saltAppVersion: saltAppVersion || '',
                        saltBuildNonce: saltBuildNonce || '',
                        saltBuildNonceRandom: saltBuildNonceRandom === true,
                        saltPlatformType: saltPlatformType || '',
                        saltProductUuid: saltProductUuid || '',
                        mergeObfuscateSecrets: mergeObfuscateSecrets !== false,
                    }
                    : undefined,
                pathIncludePatterns,
                pathExcludePatterns,
                pathSkipExt,
                pathSkipExtEnabled,
            });
            log(`UUID 修改完成: 成功 ${res.success} / 失败 ${res.failed}；引用替换 ${res.refFiles} 文件 / ${res.refHits} 处`);
            const scopeLine = (includeSP
                ? '引用扫描根目录: assets、settings、profiles 下的可解析文本'
                : '引用扫描根目录: 仅项目 assets（未扫 settings / profiles）') + '\n\n';
            writeOperationDetailLog('修改资源 UUID', scopeLine + formatUuidDetail(res));
            await refreshAssetDB();
            const sc = (scope || 'single');
            if (res.success > 0 && (sc === 'dir-all' || sc === 'dir-flat')) {
                await reimportEntireAssets();
            }
            return { ok: true, result: res };
        }
        catch (e) {
            const msg = String(e instanceof Error ? e.message : e);
            err('UUID 修改失败: ' + msg);
            writeOperationDetailLog('修改资源 UUID [失败]', msg);
            return { ok: false, message: msg };
        }
    },
    async runMd5Modify(payload) {
        try {
            const { target, scope, mode, extFilter } = payload || {};
            if (!target)
                throw new Error('目标为空');
            log(`MD5 修改: scope=${scope}, mode=${mode}, target=${target}`);
            const res = mod.modifyMd5(target, (scope || 'single'), mode || 'both', { extFilter });
            log(`MD5 修改完成: 成功 ${res.success} / 失败 ${res.failed} / 共 ${res.total}`);
            writeOperationDetailLog('修改资源 MD5', formatMd5Detail(res));
            await refreshAssetDB();
            return { ok: true, result: res };
        }
        catch (e) {
            const msg = String(e instanceof Error ? e.message : e);
            err('MD5 修改失败: ' + msg);
            writeOperationDetailLog('修改资源 MD5 [失败]', msg);
            return { ok: false, message: msg };
        }
    },
};
exports.load = function () {
    log('插件已启用');
};
exports.unload = function () {
    log('插件已卸载');
};
//# sourceMappingURL=main.js.map