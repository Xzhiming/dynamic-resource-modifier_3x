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
exports.BatchRenameService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const fs_utils_1 = require("../lib/fs-utils");
const path_filter_1 = require("../lib/path-filter");
const filename_ref_replace_1 = require("./filename-ref-replace");
/**
 * 批量文件重命名（含 .meta 跟随）。
 */
class BatchRenameService {
    static computeRename(oldName, rule, index) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const extIdx = oldName.lastIndexOf('.');
        const stem = extIdx >= 0 ? oldName.slice(0, extIdx) : oldName;
        const ext = extIdx >= 0 ? oldName.slice(extIdx) : '';
        const p = rule.params || {};
        let newStem = stem;
        switch (rule.mode) {
            case 'replace': {
                const from = String((_a = p.from) !== null && _a !== void 0 ? _a : '');
                if (!from)
                    return oldName;
                if (p.ignoreCase) {
                    const re = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
                    newStem = stem.replace(re, String((_b = p.to) !== null && _b !== void 0 ? _b : ''));
                }
                else {
                    newStem = stem.split(from).join(String((_c = p.to) !== null && _c !== void 0 ? _c : ''));
                }
                break;
            }
            case 'prefix':
                newStem = String((_d = p.text) !== null && _d !== void 0 ? _d : '') + stem;
                break;
            case 'suffix':
                newStem = stem + String((_e = p.text) !== null && _e !== void 0 ? _e : '');
                break;
            case 'sequence': {
                const base = String((_f = p.base) !== null && _f !== void 0 ? _f : 'asset_');
                const start = Number.isFinite(+p.start) ? +p.start : 1;
                const pad = Number.isFinite(+p.pad) ? +p.pad : 3;
                const n = String(start + index).padStart(pad, '0');
                newStem = p.keepOriginal ? `${base}${n}_${stem}` : `${base}${n}`;
                break;
            }
            case 'regex': {
                try {
                    const re = new RegExp(String((_g = p.pattern) !== null && _g !== void 0 ? _g : ''), String((_h = p.flags) !== null && _h !== void 0 ? _h : ''));
                    newStem = stem.replace(re, String((_j = p.replace) !== null && _j !== void 0 ? _j : ''));
                }
                catch {
                    return oldName;
                }
                break;
            }
            default:
                return oldName;
        }
        return newStem + ext;
    }
    static buildExtFilter(extFilter) {
        if (!extFilter)
            return null;
        const exts = String(extFilter)
            .split(/[,\s]+/)
            .filter(Boolean)
            .map((e) => (e.startsWith('.') ? e.toLowerCase() : '.' + e.toLowerCase()));
        if (!exts.length)
            return null;
        return (p) => exts.includes(path.extname(p).toLowerCase());
    }
    static collectRenameTargets(rootDir, rule) {
        const extFilt = BatchRenameService.buildExtFilter(rule.extFilter);
        const pathF = (0, path_filter_1.buildPathFilter)({
            includePatternsStr: rule.pathIncludePatterns,
            excludePatternsStr: rule.pathExcludePatterns,
            skipExtStr: rule.pathSkipExt,
            skipExtEnabled: rule.pathSkipExtEnabled,
        });
        const filter = (p) => {
            if (fs_utils_1.FsUtils.isMetaFile(p))
                return false;
            const rel = (0, path_filter_1.relativePosix)(rootDir, p);
            if (!(0, path_filter_1.pathPassesGlobFilter)(rel, pathF))
                return false;
            if (pathF.skipByExt(p))
                return false;
            if (extFilt && !extFilt(p))
                return false;
            return true;
        };
        const files = fs_utils_1.FsUtils.walk(rootDir, { recursive: !!rule.recursive, filter });
        return files.map((fullPath, index) => {
            const dir = path.dirname(fullPath);
            const oldName = path.basename(fullPath);
            const newName = BatchRenameService.computeRename(oldName, rule, index);
            return {
                oldPath: fullPath,
                newPath: path.join(dir, newName),
                oldName,
                newName,
                changed: oldName !== newName,
            };
        });
    }
    static renameFileWithMeta(oldPath, newPath) {
        if (oldPath === newPath)
            return { skipped: true };
        const caseOnly = oldPath.toLowerCase() === newPath.toLowerCase();
        if (!caseOnly && fs.existsSync(newPath)) {
            throw new Error(`目标已存在: ${newPath}`);
        }
        const doRename = (from, to) => {
            if (caseOnly) {
                const tmp = from + '.mrm_tmp_' + Date.now() + '_' + Math.floor(Math.random() * 1e6);
                fs.renameSync(from, tmp);
                fs.renameSync(tmp, to);
            }
            else {
                fs.renameSync(from, to);
            }
        };
        doRename(oldPath, newPath);
        const oldMeta = fs_utils_1.FsUtils.metaOf(oldPath);
        const newMeta = fs_utils_1.FsUtils.metaOf(newPath);
        if (fs_utils_1.FsUtils.isFile(oldMeta))
            doRename(oldMeta, newMeta);
        return { ok: true };
    }
    static batchRenameFiles(rootDir, rule, projectAssetsRoot) {
        if (!fs_utils_1.FsUtils.isDir(rootDir))
            throw new Error(`目录不存在: ${rootDir}`);
        const plan = BatchRenameService.collectRenameTargets(rootDir, rule).filter((x) => x.changed);
        const seen = new Map();
        for (const item of plan) {
            const key = item.newPath.toLowerCase();
            if (seen.has(key)) {
                throw new Error(`重命名冲突（多个源 → 同一目标）: ${item.newPath}`);
            }
            seen.set(key, item);
        }
        validateFilenameRefMapFromPlan(plan, rule, projectAssetsRoot);
        const results = { total: plan.length, success: 0, failed: 0, errors: [], details: [] };
        for (const item of plan) {
            try {
                BatchRenameService.renameFileWithMeta(item.oldPath, item.newPath);
                results.success++;
                results.details.push({ ok: true, from: item.oldPath, to: item.newPath });
            }
            catch (err) {
                results.failed++;
                const message = String(err instanceof Error ? err.message : err);
                results.errors.push({ path: item.oldPath, message });
                results.details.push({ ok: false, from: item.oldPath, to: item.newPath, message });
            }
        }
        if (rule.updateFilenameReferences !== false && projectAssetsRoot && results.success > 0) {
            const basenameMap = buildBasenameRefMapFromDetails(results.details);
            if (Object.keys(basenameMap).length) {
                const ref = (0, filename_ref_replace_1.replaceFilenameReferencesInAssets)(projectAssetsRoot, basenameMap, rule);
                results.refFiles = ref.refFiles;
                results.refHits = ref.refHits;
                results.refChangedDetails = ref.refChangedDetails;
            }
        }
        return results;
    }
}
exports.BatchRenameService = BatchRenameService;
function validateFilenameRefMapFromPlan(plan, rule, projectAssetsRoot) {
    if (rule.updateFilenameReferences === false || !projectAssetsRoot)
        return;
    const m = {};
    for (const item of plan) {
        if (item.oldName === item.newName)
            continue;
        if (m[item.oldName] != null && m[item.oldName] !== item.newName) {
            throw new Error('同步「文件名.扩展名」引用时，同一批内每个旧文件名只能对应一个新名。' +
                ` 冲突: 「${item.oldName}」->「${m[item.oldName]}」与「${item.newName}」。请分次重命名或取消勾选「同步替换其它文件中的文件名引用」。`);
        }
        m[item.oldName] = item.newName;
    }
}
function buildBasenameRefMapFromDetails(details) {
    const m = {};
    for (const d of details) {
        if (d.ok !== true || !d.from || !d.to)
            continue;
        const oldB = path.basename(d.from);
        const newB = path.basename(d.to);
        if (oldB === newB)
            continue;
        m[oldB] = newB;
    }
    return m;
}
//# sourceMappingURL=batch-rename.js.map