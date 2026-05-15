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
exports.UuidModifier = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const fs_utils_1 = require("../lib/fs-utils");
const uuid_crypto_1 = require("../lib/uuid-crypto");
const uuid_salt_1 = require("./uuid-salt");
const path_filter_1 = require("../lib/path-filter");
const TEXT_EXTS = new Set([
    '.scene',
    '.prefab',
    /** AnimationClip 关键帧动画片段（UUID 引用常出现在此） */
    '.anim',
    /** Marionette 动画图（3.4+），内含状态机与对 clip 的 UUID 引用 */
    '.animationgraph',
    '.material',
    '.mtl',
    '.fire',
    '.json',
    '.asset',
    '.meta',
    '.effect',
    '.chunk',
    '.gltf',
    '.plist',
    '.fnt',
]);
/**
 * UUID 扫描、替换与 .meta 修改。
 */
class UuidModifier {
    /** 判定 `.meta` 是否对应 Cocos 文件夹资源：去掉 `.meta` 后路径为目录。 */
    static isDirectoryMetaFile(metaPath) {
        const assetPath = metaPath.endsWith('.meta') ? metaPath.slice(0, -'.meta'.length) : metaPath;
        return fs_utils_1.FsUtils.isDir(assetPath);
    }
    /**
     * Cocos 在 image 等资源的 `subMetas` 内用键名 `6c48a`（texture）、`f9941`（sprite-frame），
     * 子资源 `uuid` 规范为 `主资源UUID@键名`。若改为独立随机 v4，`.anim` / 部分引用仍指向旧子 UUID，会报 The asset is missing。
     */
    static isCocosImageCompositeSubKey(subKey) {
        return subKey === '6c48a' || subKey === 'f9941';
    }
    static collectAllUuids(assetsRoot) {
        const set = new Set();
        const metas = fs_utils_1.FsUtils.walk(assetsRoot, { filter: fs_utils_1.FsUtils.isMetaFile });
        for (const m of metas) {
            const j = fs_utils_1.FsUtils.readJsonSafe(m);
            if (!j)
                continue;
            if (typeof j.uuid === 'string')
                set.add(j.uuid);
            if (j.subMetas && typeof j.subMetas === 'object') {
                const sm = j.subMetas;
                for (const k of Object.keys(sm)) {
                    const s = sm[k];
                    if (s && typeof s.uuid === 'string')
                        set.add(s.uuid);
                }
            }
        }
        return set;
    }
    static genUniqueRandomUuid(usedSet) {
        for (let i = 0; i < 64; i++) {
            const u = uuid_crypto_1.UuidCrypto.newUuid();
            if (!usedSet.has(u)) {
                usedSet.add(u);
                return u;
            }
        }
        throw new Error('无法生成唯一 UUID（碰撞次数过多）');
    }
    static genUniqueSaltUuid(masterSalt, oldUuid, usedSet) {
        const compact = uuid_crypto_1.UuidCrypto.compactUuid32(oldUuid);
        if (!compact) {
            return UuidModifier.genUniqueRandomUuid(usedSet);
        }
        for (let c = 0; c < 65536; c++) {
            const u = uuid_crypto_1.UuidCrypto.uuidFromMasterSalt(masterSalt, compact, c);
            if (!usedSet.has(u)) {
                usedSet.add(u);
                return u;
            }
        }
        throw new Error('无法生成唯一盐派生 UUID（碰撞尝试次数过多）');
    }
    /**
     * 动画相关资源：除 `path.extname` 与 TEXT_EXTS 外，再按路径后缀显式判定，
     * 避免个别路径下扩展名解析与引擎资源命名不一致时漏扫。
     */
    static isAnimationUuidRefPath(p) {
        const q = p.toLowerCase().replace(/\\/g, '/');
        return q.endsWith('.anim') || q.endsWith('.animationgraph');
    }
    /** 与 `replaceUuidInProject` 等引用扫描相同：可参与文本改写的资源文件。 */
    static isTextLikeAssetFile(p) {
        return UuidModifier.isProbablyTextFile(p);
    }
    static isProbablyTextFile(p) {
        if (UuidModifier.isAnimationUuidRefPath(p))
            return true;
        const ext = path.extname(p).toLowerCase();
        if (TEXT_EXTS.has(ext))
            return true;
        try {
            const fd = fs.openSync(p, 'r');
            const buf = Buffer.alloc(4096);
            const n = fs.readSync(fd, buf, 0, 4096, 0);
            fs.closeSync(fd);
            for (let i = 0; i < n; i++) {
                const b = buf[i];
                if (b === 0)
                    return false;
                if (b < 9 || (b > 13 && b < 32 && b !== 27))
                    return false;
            }
            return true;
        }
        catch {
            return false;
        }
    }
    static replaceUuidInProject(assetsRoot, mapping, options = {}) {
        /** 同时替换无连字符 32 位 hex，与带连字符 v4 串（场景等文件中两种形态均可能出现） */
        const fullMapping = { ...mapping };
        for (const [o, n] of Object.entries(mapping)) {
            const co = uuid_crypto_1.UuidCrypto.compactUuid32(o);
            const cn = uuid_crypto_1.UuidCrypto.compactUuid32(n);
            if (co && cn)
                fullMapping[co] = cn;
        }
        /** 图集/纹理子资源在 prefab 等中常写作 `主资源UUID@f9941` / `@6c48a`，需成对替换，否则父 UUID 已变而引用未变会 missing */
        const CC_SUB_COMPOSITE_KEYS = ['6c48a', 'f9941'];
        const dashedV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        for (const [o, n] of Object.entries(mapping)) {
            if (o.includes('@') || !dashedV4.test(o))
                continue;
            for (const sk of CC_SUB_COMPOSITE_KEYS) {
                const ckey = `${o}@${sk}`;
                if (fullMapping[ckey] === undefined)
                    fullMapping[ckey] = `${n}@${sk}`;
                const co = uuid_crypto_1.UuidCrypto.compactUuid32(o);
                const cn = uuid_crypto_1.UuidCrypto.compactUuid32(n);
                if (co && cn) {
                    const c2 = `${co}@${sk}`;
                    if (fullMapping[c2] === undefined)
                        fullMapping[c2] = `${cn}@${sk}`;
                }
            }
        }
        const oldKeys = Object.keys(fullMapping);
        if (!oldKeys.length)
            return { filesChanged: 0, replacements: 0, changedDetails: [] };
        const keyList = oldKeys.sort((a, b) => b.length - a.length);
        let filesChanged = 0;
        let replacements = 0;
        const changedDetails = [];
        const roots = [assetsRoot];
        const extraRoots = options.extraRoots || [];
        for (const r of extraRoots)
            if (r && fs_utils_1.FsUtils.isDir(r))
                roots.push(r);
        const pathF = (0, path_filter_1.buildPathFilter)({
            includePatternsStr: options.pathIncludePatterns,
            excludePatternsStr: options.pathExcludePatterns,
            skipExtStr: options.pathSkipExt,
            skipExtEnabled: options.pathSkipExtEnabled,
        });
        const normAssetsRoot = path.normalize(assetsRoot).toLowerCase();
        const files = [];
        for (const r of roots) {
            if (!fs_utils_1.FsUtils.isDir(r))
                continue;
            const isPrimaryAssets = path.normalize(r).toLowerCase() === normAssetsRoot;
            files.push(...fs_utils_1.FsUtils.walk(r, {
                filter: (p) => {
                    if (!UuidModifier.isProbablyTextFile(p))
                        return false;
                    const rel = (0, path_filter_1.relativePosix)(r, p);
                    if (!(0, path_filter_1.pathPassesGlobFilter)(rel, pathF))
                        return false;
                    // settings / profiles 内多为 .json，必须替换其中 UUID；后缀排除仅针对 assets
                    if (isPrimaryAssets && pathF.skipByExt(p))
                        return false;
                    return true;
                },
            }));
        }
        for (const f of files) {
            let text;
            try {
                text = fs.readFileSync(f, 'utf8');
            }
            catch {
                continue;
            }
            let changed = false;
            let localReplacements = 0;
            for (const oldU of keyList) {
                if (!text.includes(oldU))
                    continue;
                const newU = fullMapping[oldU];
                const parts = text.split(oldU);
                localReplacements += parts.length - 1;
                text = parts.join(newU);
                changed = true;
            }
            if (changed) {
                fs.writeFileSync(f, text, 'utf8');
                filesChanged++;
                replacements += localReplacements;
                changedDetails.push({ path: f, hits: localReplacements });
            }
        }
        return { filesChanged, replacements, changedDetails };
    }
    static modifyUuid(assetsRoot, target, scope, options = {}) {
        var _a;
        if (!fs_utils_1.FsUtils.isDir(assetsRoot))
            throw new Error(`assets 目录不存在: ${assetsRoot}`);
        let targetMetas = [];
        if (scope === 'single') {
            const meta = fs_utils_1.FsUtils.isMetaFile(target) ? target : fs_utils_1.FsUtils.metaOf(target);
            if (!fs_utils_1.FsUtils.isFile(meta))
                throw new Error(`.meta 不存在: ${meta}`);
            targetMetas = [meta];
        }
        else if (scope === 'dir-flat' || scope === 'dir-all') {
            if (!fs_utils_1.FsUtils.isDir(target))
                throw new Error(`目标不是目录: ${target}`);
            const recursive = scope === 'dir-all';
            const pathF = (0, path_filter_1.buildPathFilter)({
                includePatternsStr: options.pathIncludePatterns,
                excludePatternsStr: options.pathExcludePatterns,
                skipExtStr: options.pathSkipExt,
                skipExtEnabled: options.pathSkipExtEnabled,
            });
            targetMetas = fs_utils_1.FsUtils.walk(target, {
                recursive,
                filter: (fullPath) => {
                    if (!fs_utils_1.FsUtils.isMetaFile(fullPath))
                        return false;
                    const assetPath = fullPath.endsWith('.meta') ? fullPath.slice(0, -'.meta'.length) : fullPath;
                    const rel = (0, path_filter_1.relativePosix)(target, assetPath);
                    if (!(0, path_filter_1.pathPassesGlobFilter)(rel, pathF))
                        return false;
                    if (pathF.skipByExt(assetPath))
                        return false;
                    return true;
                },
            });
        }
        else {
            throw new Error(`未知 scope: ${scope}`);
        }
        const includeDirUuids = options.includeDirectoryUuids === true;
        if (scope === 'single') {
            const meta0 = targetMetas[0];
            if (!includeDirUuids && UuidModifier.isDirectoryMetaFile(meta0)) {
                throw new Error('目标为文件夹资源，若需修改其 UUID 请勾选「更改目录 UUID」');
            }
        }
        else {
            targetMetas = targetMetas.filter((m) => includeDirUuids || !UuidModifier.isDirectoryMetaFile(m));
        }
        if (!targetMetas.length) {
            return { total: 0, success: 0, failed: 0, errors: [], refFiles: 0, refHits: 0, details: [], uuidMapping: {} };
        }
        const uuidGenMode = (_a = options.uuidGenMode) !== null && _a !== void 0 ? _a : 'random-v4';
        if (uuidGenMode === 'salt-v4' && targetMetas.length > 1) {
            targetMetas = [...targetMetas].sort((a, b) => path.normalize(a).replace(/\\/g, '/').localeCompare(path.normalize(b).replace(/\\/g, '/')));
        }
        const projectRoot = (options.projectRoot || path.dirname(assetsRoot)).trim();
        let masterSalt = null;
        if (uuidGenMode === 'salt-v4') {
            const s = options.salt || {};
            const merge = s.mergeObfuscateSecrets !== false;
            masterSalt = (0, uuid_salt_1.computeUuidMasterSalt)({
                projectRoot,
                panel: {
                    saltCerPath: s.saltCerPath || '',
                    saltProductName: s.saltProductName || '',
                    saltAppVersion: s.saltAppVersion || '',
                    saltBuildNonce: s.saltBuildNonce || '',
                    saltBuildNonceRandom: s.saltBuildNonceRandom,
                    saltPlatformType: s.saltPlatformType || '',
                    saltProductUuid: s.saltProductUuid || '',
                },
                mergeObfuscateSecrets: merge,
            });
            if (!masterSalt) {
                throw new Error((0, uuid_salt_1.explainUuidSaltUnavailable)(projectRoot, {
                    saltCerPath: s.saltCerPath || '',
                    saltProductName: s.saltProductName || '',
                    saltAppVersion: s.saltAppVersion || '',
                    saltBuildNonce: s.saltBuildNonce || '',
                    saltBuildNonceRandom: s.saltBuildNonceRandom,
                    saltPlatformType: s.saltPlatformType || '',
                    saltProductUuid: s.saltProductUuid || '',
                }, merge));
            }
            console.log(`[dynamic-resource-modifier] UUID 主盐模式 saltId=${(0, uuid_salt_1.formatMasterSaltId)(masterSalt)}（与 confuse-co 对账用 8 位 hex）`);
        }
        const used = UuidModifier.collectAllUuids(assetsRoot);
        const mapping = {};
        const results = {
            total: targetMetas.length,
            success: 0,
            failed: 0,
            errors: [],
            details: [],
            refFiles: 0,
            refHits: 0,
        };
        for (const meta of targetMetas) {
            const j = fs_utils_1.FsUtils.readJsonSafe(meta);
            if (!j) {
                results.failed++;
                results.errors.push({ path: meta, message: '解析 .meta 失败' });
                continue;
            }
            try {
                const uuidChanges = [];
                if (typeof j.uuid === 'string') {
                    const oldMain = j.uuid;
                    const newU = masterSalt != null
                        ? UuidModifier.genUniqueSaltUuid(masterSalt, oldMain, used)
                        : UuidModifier.genUniqueRandomUuid(used);
                    mapping[oldMain] = newU;
                    j.uuid = newU;
                    uuidChanges.push({ oldUuid: oldMain, newUuid: newU });
                }
                if (j.subMetas && typeof j.subMetas === 'object') {
                    const sm = j.subMetas;
                    const subKeys = Object.keys(sm);
                    if (masterSalt != null)
                        subKeys.sort();
                    const mainForComposite = typeof j.uuid === 'string' ? j.uuid : null;
                    for (const k of subKeys) {
                        const sub = sm[k];
                        if (sub && typeof sub.uuid === 'string') {
                            const oldSub = sub.uuid;
                            let newSub;
                            if (mainForComposite && UuidModifier.isCocosImageCompositeSubKey(k)) {
                                newSub = `${mainForComposite}@${k}`;
                            }
                            else {
                                newSub =
                                    masterSalt != null
                                        ? UuidModifier.genUniqueSaltUuid(masterSalt, oldSub, used)
                                        : UuidModifier.genUniqueRandomUuid(used);
                            }
                            if (newSub === oldSub)
                                continue;
                            mapping[oldSub] = newSub;
                            sub.uuid = newSub;
                            if (!used.has(newSub))
                                used.add(newSub);
                            uuidChanges.push({ oldUuid: oldSub, newUuid: newSub });
                        }
                    }
                }
                const jsonContent = JSON.stringify(j, null, 2);
                fs_utils_1.FsUtils.writeJson(meta, j);
                results.success++;
                results.details.push({ ok: true, meta, uuidChanges, jsonContent });
            }
            catch (err) {
                results.failed++;
                results.errors.push({ path: meta, message: String(err instanceof Error ? err.message : err) });
            }
        }
        results.uuidMapping = { ...mapping };
        let refStats = {
            filesChanged: 0,
            replacements: 0,
            changedDetails: [],
        };
        if (options.updateReferences !== false && Object.keys(mapping).length) {
            refStats = UuidModifier.replaceUuidInProject(assetsRoot, mapping, {
                extraRoots: options.extraRoots,
                pathIncludePatterns: options.pathIncludePatterns,
                pathExcludePatterns: options.pathExcludePatterns,
                pathSkipExt: options.pathSkipExt,
                pathSkipExtEnabled: options.pathSkipExtEnabled,
            });
        }
        results.refFiles = refStats.filesChanged;
        results.refHits = refStats.replacements;
        results.refChangedDetails = refStats.changedDetails;
        return results;
    }
}
exports.UuidModifier = UuidModifier;
//# sourceMappingURL=uuid-modifier.js.map