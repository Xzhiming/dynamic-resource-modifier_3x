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
exports.UuidCrypto = void 0;
const crypto = __importStar(require("crypto"));
/**
 * v4 UUID 生成与主盐派生（见 `uuid-salt.ts` 主盐算法）。
 */
class UuidCrypto {
    static newUuid() {
        const b = crypto.randomBytes(16);
        UuidCrypto.applyV4Variant(b);
        return UuidCrypto.bufferToUuid(b);
    }
    /** 去连字符后的 32 位 hex；非法则返回 null */
    static compactUuid32(uuid) {
        const s = uuid.replace(/-/g, '').toLowerCase();
        if (!/^[0-9a-f]{32}$/.test(s))
            return null;
        return s;
    }
    /**
     * 由 32 字节主盐 + 旧 UUID + 碰撞计数派生标准形态 v4 UUID（位与 random v4 一致）。
     */
    static uuidFromMasterSalt(masterSalt, oldUuidCompact32, counter) {
        const h = crypto
            .createHash('sha256')
            .update(masterSalt)
            .update('\0')
            .update('dynamic-resource-modifier/uuid-salt/v1')
            .update('\0')
            .update(oldUuidCompact32)
            .update('\0')
            .update(String(counter))
            .digest();
        const b = Buffer.alloc(16);
        h.copy(b, 0, 0, 16);
        UuidCrypto.applyV4Variant(b);
        return UuidCrypto.bufferToUuid(b);
    }
    static applyV4Variant(b) {
        b[6] = (b[6] & 0x0f) | 0x40;
        b[8] = (b[8] & 0x3f) | 0x80;
    }
    static bufferToUuid(b) {
        const h = b.toString('hex');
        return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
    }
}
exports.UuidCrypto = UuidCrypto;
//# sourceMappingURL=uuid-crypto.js.map