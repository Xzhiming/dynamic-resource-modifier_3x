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
exports.FolderRenameService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const fs_utils_1 = require("../lib/fs-utils");
/**
 * 目录重命名（含目录 .meta）。
 */
class FolderRenameService {
    static renameFolder(oldDir, newName) {
        if (!fs_utils_1.FsUtils.isDir(oldDir))
            throw new Error(`目录不存在: ${oldDir}`);
        const parent = path.dirname(oldDir);
        const newDir = path.join(parent, newName);
        if (oldDir === newDir)
            return { skipped: true };
        if (fs.existsSync(newDir))
            throw new Error(`目标目录已存在: ${newDir}`);
        fs.renameSync(oldDir, newDir);
        const oldMeta = fs_utils_1.FsUtils.metaOf(oldDir);
        const newMeta = fs_utils_1.FsUtils.metaOf(newDir);
        if (fs_utils_1.FsUtils.isFile(oldMeta))
            fs.renameSync(oldMeta, newMeta);
        return { ok: true, newDir };
    }
}
exports.FolderRenameService = FolderRenameService;
//# sourceMappingURL=folder-rename.js.map