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
exports.FsUtils = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * 文件系统与 .meta / JSON 等通用辅助。
 */
class FsUtils {
    static isDir(p) {
        try {
            return fs.statSync(p).isDirectory();
        }
        catch {
            return false;
        }
    }
    static isFile(p) {
        try {
            return fs.statSync(p).isFile();
        }
        catch {
            return false;
        }
    }
    static walk(dir, opts = {}) {
        const { includeDirs = false, recursive = true, filter } = opts;
        const out = [];
        if (!FsUtils.isDir(dir))
            return out;
        for (const name of fs.readdirSync(dir)) {
            const full = path.join(dir, name);
            let st;
            try {
                st = fs.statSync(full);
            }
            catch {
                continue;
            }
            if (st.isDirectory()) {
                if (includeDirs)
                    out.push(full);
                if (recursive)
                    out.push(...FsUtils.walk(full, opts));
            }
            else if (st.isFile()) {
                if (!filter || filter(full))
                    out.push(full);
            }
        }
        return out;
    }
    static isMetaFile(p) {
        return p.endsWith('.meta');
    }
    static metaOf(p) {
        return p + '.meta';
    }
    static readJsonSafe(p) {
        try {
            return JSON.parse(fs.readFileSync(p, 'utf8'));
        }
        catch {
            return null;
        }
    }
    static writeJson(p, obj) {
        fs.writeFileSync(p, JSON.stringify(obj, null, 2), 'utf8');
    }
}
exports.FsUtils = FsUtils;
//# sourceMappingURL=fs-utils.js.map