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
exports.Md5Modifier = void 0;
const crypto = __importStar(require("crypto"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const batch_rename_1 = require("../batch-rename/batch-rename");
const fs_utils_1 = require("../lib/fs-utils");
/**
 * MD5 / `.meta.ver` 与内容 touch。
 */
class Md5Modifier {
    static bumpMetaVer(metaPath) {
        var _a;
        const j = fs_utils_1.FsUtils.readJsonSafe(metaPath);
        if (!j)
            throw new Error('解析 .meta 失败');
        const oldVer = String((_a = j.ver) !== null && _a !== void 0 ? _a : '');
        const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(oldVer);
        let newVer;
        if (m) {
            newVer = `${m[1]}.${m[2]}.${+m[3] + 1}`;
        }
        else {
            newVer = (oldVer || '1.0.0') + '-' + crypto.randomBytes(3).toString('hex');
        }
        j.ver = newVer;
        fs_utils_1.FsUtils.writeJson(metaPath, j);
        return { oldVer, newVer };
    }
    static touchContentMd5(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const safeAppendBinary = new Set([
            '.png',
            '.jpg',
            '.jpeg',
            '.webp',
            '.mp3',
            '.ogg',
            '.wav',
            '.m4a',
            '.bin',
            '.dat',
        ]);
        const jsonExts = new Set(['.json']);
        const textExts = new Set(['.txt', '.xml', '.fnt', '.plist', '.effect']);
        const buf = crypto.randomBytes(4).toString('hex');
        if (jsonExts.has(ext)) {
            return { method: 'skipped-json', note: 'JSON 文件跳过内容追加，请使用 bump-meta-ver 或 both 模式' };
        }
        if (safeAppendBinary.has(ext)) {
            fs.appendFileSync(filePath, Buffer.from(buf, 'hex'));
            return {
                method: 'append-bytes',
                note: ext === '.wav' || ext === '.m4a' ? '音频追加字节可能被部分解码器忽略' : '',
            };
        }
        if (textExts.has(ext)) {
            const content = fs.readFileSync(filePath);
            fs.writeFileSync(filePath, Buffer.concat([content, Buffer.from('\n')]));
            return { method: 'append-newline', note: '文本文件追加换行' };
        }
        fs.appendFileSync(filePath, Buffer.from([0x20]));
        return { method: 'append-space', note: '未知类型，追加 0x20；请自行验证' };
    }
    static fileMd5(p) {
        const h = crypto.createHash('md5');
        h.update(fs.readFileSync(p));
        return h.digest('hex');
    }
    static modifyMd5(target, scope, mode, options = {}) {
        let files = [];
        if (scope === 'single') {
            if (!fs_utils_1.FsUtils.isFile(target))
                throw new Error(`不是文件: ${target}`);
            files = [target];
        }
        else {
            if (!fs_utils_1.FsUtils.isDir(target))
                throw new Error(`不是目录: ${target}`);
            const recursive = scope === 'dir-all';
            files = fs_utils_1.FsUtils.walk(target, {
                recursive,
                filter: (p) => !fs_utils_1.FsUtils.isMetaFile(p),
            });
        }
        const extFilt = batch_rename_1.BatchRenameService.buildExtFilter(options.extFilter);
        if (extFilt)
            files = files.filter(extFilt);
        const results = { total: files.length, success: 0, failed: 0, errors: [], details: [] };
        for (const f of files) {
            try {
                const md5Before = Md5Modifier.fileMd5(f);
                const r = { file: f, md5Before };
                if (mode === 'touch-content' || mode === 'both') {
                    const t = Md5Modifier.touchContentMd5(f);
                    r.touch = t;
                    if (t.method === 'skipped-json' && mode === 'touch-content') {
                        const meta = fs_utils_1.FsUtils.metaOf(f);
                        if (fs_utils_1.FsUtils.isFile(meta)) {
                            r.ver = Md5Modifier.bumpMetaVer(meta);
                        }
                    }
                }
                if (mode === 'bump-meta-ver' || mode === 'both') {
                    const meta = fs_utils_1.FsUtils.metaOf(f);
                    if (fs_utils_1.FsUtils.isFile(meta)) {
                        const v = Md5Modifier.bumpMetaVer(meta);
                        r.ver = v;
                    }
                }
                r.md5After = Md5Modifier.fileMd5(f);
                results.success++;
                results.details.push(r);
            }
            catch (err) {
                results.failed++;
                results.errors.push({ path: f, message: String(err instanceof Error ? err.message : err) });
            }
        }
        return results;
    }
}
exports.Md5Modifier = Md5Modifier;
//# sourceMappingURL=md5-modifier.js.map