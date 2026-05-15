"use strict";
/**
 * 与 confuse-co `obfuscate-salt.ts` 中 AST 构建主盐相同（v2 载荷），
 * 便于与混淆流水线共用 `.confuse-co/obfuscate-secrets.json` 与 CONFUSE_CO_CI_SECRET。
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
exports.loadObfuscateSecretsFile = loadObfuscateSecretsFile;
exports.pickSaltString = pickSaltString;
exports.pickSaltBoolean = pickSaltBoolean;
exports.resolveCerAbsolutePath = resolveCerAbsolutePath;
exports.sha256FileHex = sha256FileHex;
exports.formatMasterSaltId = formatMasterSaltId;
exports.computeUuidMasterSalt = computeUuidMasterSalt;
exports.explainUuidSaltUnavailable = explainUuidSaltUnavailable;
const crypto = __importStar(require("crypto"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const LOG = '[dynamic-resource-modifier]';
function loadObfuscateSecretsFile(projectRoot) {
    const root = (projectRoot || '').trim();
    if (!root)
        return null;
    const candidates = [
        path.join(root, '.confuse-co', 'obfuscate-secrets.json'),
        path.join(root, 'obfuscate-secrets.json'),
    ];
    for (const p of candidates) {
        if (!fs.existsSync(p))
            continue;
        try {
            const raw = fs.readFileSync(p, 'utf8');
            const data = JSON.parse(raw);
            if (!data || typeof data !== 'object' || Array.isArray(data)) {
                console.warn(`${LOG} obfuscate-secrets.json 格式无效（须为对象）: ${p}`);
                continue;
            }
            return { json: data, filePath: p };
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            console.warn(`${LOG} obfuscate-secrets.json 读取失败 (${p}): ${msg}`);
        }
    }
    return null;
}
function pickSaltString(fileVal, panelVal) {
    if (fileVal != null && String(fileVal).trim() !== '')
        return String(fileVal).trim();
    return (panelVal || '').trim();
}
function pickSaltBoolean(fileVal, panelVal) {
    if (fileVal === true || fileVal === false)
        return fileVal;
    if (typeof fileVal === 'string') {
        const s = fileVal.trim().toLowerCase();
        if (s === 'true' || s === '1' || s === 'yes')
            return true;
        if (s === 'false' || s === '0' || s === 'no')
            return false;
    }
    return panelVal;
}
function coerceBool(v, fallback) {
    if (v === true || v === 1)
        return true;
    if (v === false || v === 0)
        return false;
    if (typeof v === 'string') {
        const s = v.trim().toLowerCase();
        if (s === 'true' || s === '1' || s === 'yes')
            return true;
        if (s === 'false' || s === '0' || s === 'no' || s === '')
            return false;
    }
    return fallback;
}
function resolveCerAbsolutePath(raw, projectRoot) {
    const t = (raw || '').trim();
    if (!t)
        return null;
    const abs = path.isAbsolute(t) ? t : projectRoot ? path.join(projectRoot, t) : null;
    if (!abs || !fs.existsSync(abs))
        return null;
    try {
        if (!fs.statSync(abs).isFile())
            return null;
    }
    catch {
        return null;
    }
    return abs;
}
function sha256FileHex(filePath) {
    const buf = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(buf).digest('hex');
}
function formatMasterSaltId(masterSalt) {
    return masterSalt.subarray(0, 4).toString('hex');
}
const BUILD_NONCE_RANDOM_BYTES = 16;
function nonceMaterialOk(buildNonceRandom, nonceManual) {
    return buildNonceRandom || nonceManual.trim().length > 0;
}
function computeUuidMasterSalt(opts) {
    const merge = opts.mergeObfuscateSecrets !== false;
    const loaded = merge ? loadObfuscateSecretsFile(opts.projectRoot) : null;
    const j = loaded === null || loaded === void 0 ? void 0 : loaded.json;
    if (loaded === null || loaded === void 0 ? void 0 : loaded.filePath) {
        console.log(`${LOG} 已合并 obfuscate-secrets 盐字段: ${loaded.filePath}`);
    }
    const cerPathForResolve = pickSaltString(j === null || j === void 0 ? void 0 : j.saltCerPath, opts.panel.saltCerPath || '');
    const panelPlat = (opts.panel.saltPlatformType || '').trim() || 'h5';
    const platformType = pickSaltString(j === null || j === void 0 ? void 0 : j.saltPlatformType, panelPlat);
    const productUuid = pickSaltString(j === null || j === void 0 ? void 0 : j.saltProductUuid, opts.panel.saltProductUuid || '');
    const product = pickSaltString(j === null || j === void 0 ? void 0 : j.saltProductName, opts.panel.saltProductName || '');
    const version = pickSaltString(j === null || j === void 0 ? void 0 : j.saltAppVersion, opts.panel.saltAppVersion || '');
    const nonceManual = pickSaltString(j === null || j === void 0 ? void 0 : j.saltBuildNonce, opts.panel.saltBuildNonce || '');
    const buildNonceRandom = pickSaltBoolean(j === null || j === void 0 ? void 0 : j.saltBuildNonceRandom, coerceBool(opts.panel.saltBuildNonceRandom, false));
    const envRaw = (process.env.CONFUSE_CO_CI_SECRET || '').trim();
    const fileCi = ((j === null || j === void 0 ? void 0 : j.ciSecret) || '').trim();
    const ciRaw = envRaw || fileCi;
    const ciFingerprintHex = ciRaw
        ? crypto.createHash('sha256').update(ciRaw, 'utf8').digest('hex')
        : 'not-provided';
    const cerAbs = resolveCerAbsolutePath(cerPathForResolve, opts.projectRoot);
    let cerHex = '';
    if (cerAbs) {
        try {
            cerHex = sha256FileHex(cerAbs);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.warn(`${LOG} 无法读取证书「${cerPathForResolve}」（解析路径: ${cerAbs}）：${msg}`);
        }
    }
    if (!cerHex && !product.trim() && !version.trim() && !nonceMaterialOk(buildNonceRandom, nonceManual)) {
        return null;
    }
    const effectiveNonce = buildNonceRandom
        ? crypto.randomBytes(BUILD_NONCE_RANDOM_BYTES).toString('hex')
        : nonceManual.trim();
    const payload = [
        'confuse-co-ast-salt/v2',
        'platformType:' + platformType,
        'productUuid:' + productUuid,
        'cerSha256:' + (cerHex || '(none)'),
        'product:' + product,
        'version:' + version,
        'nonce:' + effectiveNonce,
        'ciSecretSha256:' + ciFingerprintHex,
    ].join('\n');
    return crypto.createHash('sha256').update(payload, 'utf8').digest();
}
function explainUuidSaltUnavailable(projectRoot, panel, mergeObfuscateSecrets = true) {
    const loaded = mergeObfuscateSecrets ? loadObfuscateSecretsFile(projectRoot) : null;
    const j = loaded === null || loaded === void 0 ? void 0 : loaded.json;
    const cerPathForResolve = pickSaltString(j === null || j === void 0 ? void 0 : j.saltCerPath, panel.saltCerPath || '');
    const product = pickSaltString(j === null || j === void 0 ? void 0 : j.saltProductName, panel.saltProductName || '');
    const version = pickSaltString(j === null || j === void 0 ? void 0 : j.saltAppVersion, panel.saltAppVersion || '');
    const nonceManual = pickSaltString(j === null || j === void 0 ? void 0 : j.saltBuildNonce, panel.saltBuildNonce || '');
    const buildNonceRandom = pickSaltBoolean(j === null || j === void 0 ? void 0 : j.saltBuildNonceRandom, coerceBool(panel.saltBuildNonceRandom, false));
    const lines = ['主盐模式：有效盐材料不足，无法生成与 confuse-co 一致的主盐。'];
    const rawCer = (cerPathForResolve || '').trim();
    if (!rawCer) {
        lines.push('· 证书 .cer 路径：未填写（且密钥文件中亦无）。');
    }
    else {
        const abs = resolveCerAbsolutePath(rawCer, projectRoot);
        if (!projectRoot && !path.isAbsolute(rawCer)) {
            lines.push(`· 证书路径「${rawCer}」为相对路径，但未解析到项目根。`);
        }
        else if (!abs) {
            lines.push(`· 证书路径「${rawCer}」对应文件不存在或不是普通文件。`);
        }
    }
    if (!product.trim())
        lines.push('· 产品名：未填写。');
    if (!version.trim())
        lines.push('· 应用版本：未填写。');
    if (!nonceMaterialOk(buildNonceRandom, nonceManual)) {
        lines.push('· 构建随机数：未勾选「随机 hex」且手动值为空。');
    }
    lines.push('说明：须至少满足「可读证书的 SHA-256」或「产品名 / 版本 / 构建随机数（含随机 hex）」中至少一项与 confuse-co v2 规则一致。');
    return lines.join('\n');
}
//# sourceMappingURL=uuid-salt.js.map