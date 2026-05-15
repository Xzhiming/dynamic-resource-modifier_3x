"use strict";
/**
 * 路径过滤：glob 风格与 confuse-co `obfuscate.ts` 中 `matchesPattern` / `shouldProcess` 一致；
 * 另支持按「后缀」排除（含 `.ts.meta` 等复合后缀）。
 */
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
exports.DEFAULT_SKIP_FILE_SUFFIXES = void 0;
exports.parseLinePatterns = parseLinePatterns;
exports.parseCommaOrNewlineList = parseCommaOrNewlineList;
exports.normalizeSuffixToken = normalizeSuffixToken;
exports.pathEndsWithAnySuffix = pathEndsWithAnySuffix;
exports.matchesPathPattern = matchesPathPattern;
exports.pathPassesGlobFilter = pathPassesGlobFilter;
exports.buildPathFilter = buildPathFilter;
exports.relativePosix = relativePosix;
const path = __importStar(require("path"));
/** 默认跳过：脚本与 JSON 等（不参与改名 / 不改 UUID / 引用替换也不触碰） */
exports.DEFAULT_SKIP_FILE_SUFFIXES = [
    'ts',
    'ts.meta',
    'js',
    'js.meta',
    'json',
    'json.meta',
];
function parseLinePatterns(s) {
    if (!s)
        return [];
    return String(s)
        .split(/\r?\n/)
        .map((x) => x.trim())
        .filter(Boolean);
}
function parseCommaOrNewlineList(s) {
    if (!s)
        return [];
    return String(s)
        .split(/[\n,]+/)
        .map((x) => x.trim())
        .filter(Boolean);
}
/** 将 `ts` / `ts.meta` 规范为 `/.ts` / `.ts.meta`（小写，带点） */
function normalizeSuffixToken(tok) {
    const t = tok.trim().toLowerCase();
    if (!t)
        return '';
    if (t.startsWith('.'))
        return t;
    return '.' + t;
}
function pathEndsWithAnySuffix(filePath, suffixesWithDot) {
    if (!suffixesWithDot.length)
        return false;
    const low = filePath.replace(/\\/g, '/').toLowerCase();
    const sorted = [...suffixesWithDot].sort((a, b) => b.length - a.length);
    for (const suf of sorted) {
        if (low.endsWith(suf))
            return true;
    }
    return false;
}
/**
 * 与 confuse-co `matchesPattern` 相同：pattern 为 glob 风格，`*` / `**` 可用。
 */
function matchesPathPattern(filePath, pattern) {
    if (!pattern || !pattern.trim())
        return false;
    const normalized = filePath.replace(/\\/g, '/');
    const p = pattern
        .trim()
        .replace(/\\/g, '/')
        .replace(/[.+^${}()|[\]]/g, '\\$&')
        .replace(/\*\*/g, '\u00b6DS\u00b6')
        .replace(/\*/g, '[^/]*')
        .replace(/\u00b6DS\u00b6/g, '.*');
    try {
        return new RegExp(`(^|/)${p}($|/)`).test(normalized);
    }
    catch {
        return normalized.includes(pattern.trim());
    }
}
function pathPassesGlobFilter(relPath, f) {
    const norm = relPath.replace(/\\/g, '/');
    for (const pattern of f.excludePatterns) {
        if (matchesPathPattern(norm, pattern))
            return false;
    }
    if (f.includePatterns.length) {
        for (const pattern of f.includePatterns) {
            if (matchesPathPattern(norm, pattern))
                return true;
        }
        return false;
    }
    return true;
}
function buildPathFilter(raw) {
    var _a;
    const includePatterns = parseLinePatterns(raw === null || raw === void 0 ? void 0 : raw.includePatternsStr);
    const excludePatterns = parseLinePatterns(raw === null || raw === void 0 ? void 0 : raw.excludePatternsStr);
    const skipEnabled = (raw === null || raw === void 0 ? void 0 : raw.skipExtEnabled) !== false;
    const skipStr = (_a = raw === null || raw === void 0 ? void 0 : raw.skipExtStr) !== null && _a !== void 0 ? _a : '';
    const parsedSkip = parseCommaOrNewlineList(skipStr).map(normalizeSuffixToken).filter(Boolean);
    const suffixes = skipEnabled ? (parsedSkip.length > 0 ? parsedSkip : exports.DEFAULT_SKIP_FILE_SUFFIXES.map(normalizeSuffixToken)) : [];
    const skipByExt = suffixes.length > 0 ? (fullPath) => pathEndsWithAnySuffix(fullPath, suffixes) : () => false;
    return { includePatterns, excludePatterns, skipByExt };
}
/** 相对 root 的路径（正斜杠）；用于 glob 匹配 */
function relativePosix(fromRoot, fullPath) {
    return path.relative(fromRoot, fullPath).replace(/\\/g, '/');
}
//# sourceMappingURL=path-filter.js.map