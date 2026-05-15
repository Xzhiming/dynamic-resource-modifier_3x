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
exports.replaceFilenameReferencesInAssets = replaceFilenameReferencesInAssets;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const fs_utils_1 = require("../lib/fs-utils");
const uuid_modifier_1 = require("../uuid/uuid-modifier");
const path_filter_1 = require("../lib/path-filter");
/**
 * 在 `assets` 下可解析文本中，将旧文件名整串（含扩展名）替换为新文件名。规则与 UUID 引用替换中的路径 / 跳过后缀一致（路径相对 `assets`）。
 */
function replaceFilenameReferencesInAssets(assetsRoot, oldNameToNewName, rule) {
    const keys = Object.keys(oldNameToNewName);
    if (!keys.length || !fs_utils_1.FsUtils.isDir(assetsRoot)) {
        return { refFiles: 0, refHits: 0, refChangedDetails: [] };
    }
    const fullMapping = {};
    for (const k of keys) {
        const n = oldNameToNewName[k];
        if (k !== n)
            fullMapping[k] = n;
    }
    const sortedKeys = Object.keys(fullMapping).sort((a, b) => b.length - a.length);
    if (!sortedKeys.length) {
        return { refFiles: 0, refHits: 0, refChangedDetails: [] };
    }
    const pathF = (0, path_filter_1.buildPathFilter)({
        includePatternsStr: rule.pathIncludePatterns,
        excludePatternsStr: rule.pathExcludePatterns,
        skipExtStr: rule.pathSkipExt,
        skipExtEnabled: rule.pathSkipExtEnabled,
    });
    const normRoot = path.normalize(assetsRoot).toLowerCase();
    const list = fs_utils_1.FsUtils.walk(assetsRoot, {
        filter: (p) => {
            if (!uuid_modifier_1.UuidModifier.isTextLikeAssetFile(p))
                return false;
            const rel = (0, path_filter_1.relativePosix)(assetsRoot, p);
            if (!(0, path_filter_1.pathPassesGlobFilter)(rel, pathF))
                return false;
            if (path.normalize(assetsRoot).toLowerCase() === normRoot && pathF.skipByExt(p))
                return false;
            return true;
        },
    });
    let filesChanged = 0;
    let replacements = 0;
    const refChangedDetails = [];
    for (const f of list) {
        let text;
        try {
            text = fs.readFileSync(f, 'utf8');
        }
        catch {
            continue;
        }
        let changed = false;
        let local = 0;
        for (const oldName of sortedKeys) {
            if (!text.includes(oldName))
                continue;
            const newName = fullMapping[oldName];
            const parts = text.split(oldName);
            local += parts.length - 1;
            text = parts.join(newName);
            changed = true;
        }
        if (changed) {
            try {
                fs.writeFileSync(f, text, 'utf8');
            }
            catch {
                continue;
            }
            filesChanged++;
            replacements += local;
            refChangedDetails.push({ path: f, hits: local });
        }
    }
    return { refFiles: filesChanged, refHits: replacements, refChangedDetails };
}
//# sourceMappingURL=filename-ref-replace.js.map