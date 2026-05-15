"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mrmReadEditorI18nIsZh = mrmReadEditorI18nIsZh;
exports.mrmSetZhOverride = mrmSetZhOverride;
exports.mrmSetDesktopZhOverride = mrmSetDesktopZhOverride;
exports.mrmIsZhLocale = mrmIsZhLocale;
exports.mrmLoad = mrmLoad;
exports.mrmTPanel = mrmTPanel;
exports.mrmTMsg = mrmTMsg;
exports.mrmTMsgSub = mrmTMsgSub;
exports.mrmHeaderTitle = mrmHeaderTitle;
exports.mrmRefreshUiSelects = mrmRefreshUiSelects;
exports.mrmApplyDom = mrmApplyDom;
const path_1 = require("path");
/** 编译后为 dist/panels/，上两级为扩展根（与 dist/panels/default 用 ../../.. 不同） */
const I18N_DIR = (0, path_1.join)(__dirname, '../../i18n');
/**
 * 从当前 **Editor 宿主**（主进程、或面板中若可访问 `Editor`）解析界面语言，与 Cocos 菜单/扩展标题一致。
 * - 返回 `true` = 应使用 `zh.js`
 * - 返回 `false` = 应使用 `en.js`
 * - 返回 `null` = 无法从 Editor 取得（如面板内 `Editor` 无 I18n API）
 * @see https://docs.cocos.com/creator/3.8/manual/en/editor/i18n.html
 */
function mrmReadEditorI18nIsZh() {
    var _a;
    try {
        const I18n = (_a = globalThis.Editor) === null || _a === void 0 ? void 0 : _a.I18n;
        if (!I18n)
            return null;
        const raw = typeof I18n.getLanguage === 'function' ? I18n.getLanguage() : I18n.locale != null ? String(I18n.locale) : '';
        if (raw == null || !String(raw).trim())
            return null;
        return String(raw).toLowerCase().includes('zh');
    }
    catch {
        return null;
    }
}
let gMrmZhOverride = null;
/** Electron 主进程桌面版：在调用 `dist/main.js` 前设置，使主进程内 `mrmLoad()` 与对话框语言与工具栏一致 */
let gDesktopZhOverride = null;
/**
 * 由面板 `ready` 在收到主进程 `get-mrm-locale` 后设置，使面板与主进程语言一致。
 * 设 `null` 表示不覆盖，回退为 `mrmReadEditorI18nIsZh()`；仍未知时默认 **en**（避免中文 OS + 英文 CC 时误显示中文）。
 */
function mrmSetZhOverride(zh) {
    gMrmZhOverride = zh;
}
function mrmSetDesktopZhOverride(zh) {
    gDesktopZhOverride = zh;
}
/**
 * 是否使用中文 `zh.js`。
 * 顺序：面板侧覆盖 → 桌面主进程覆盖 → 当前环境能否直接读到 Editor 语言 → 默认 **en**（不再用 `navigator`：易与「英文 Cocos + 中文系统」冲突；亦不再默认可疑的 `return true`）。
 */
function mrmIsZhLocale() {
    if (gMrmZhOverride !== null)
        return gMrmZhOverride;
    if (gDesktopZhOverride !== null)
        return gDesktopZhOverride;
    const e = mrmReadEditorI18nIsZh();
    if (e !== null)
        return e;
    return false;
}
/**
 * 从 dot 路径读取嵌套字符串，找不到则返回原 key
 */
function tGet(root, path) {
    const parts = path.split('.').filter(Boolean);
    let o = root;
    for (const p of parts) {
        if (o == null || typeof o !== 'object')
            return path;
        o = o[p];
    }
    return typeof o === 'string' ? o : path;
}
function mrmLoad() {
    const file = mrmIsZhLocale() ? 'zh.js' : 'en.js';
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
        return require((0, path_1.join)(I18N_DIR, file));
    }
    catch {
        return { panel: {}, msg: {} };
    }
}
/** 相对 `panel` 的 path，如 `common.summary` */
function mrmTPanel(mod, path) {
    return tGet(mod.panel, path);
}
function mrmTMsg(mod, path) {
    return tGet(mod.msg, path);
}
/** 用 `{a}` 占位符替换为 repl */
function mrmTMsgSub(mod, path, repl) {
    let s = mrmTMsg(mod, path);
    for (const [k, v] of Object.entries(repl))
        s = s.split(`{${k}}`).join(String(v));
    return s;
}
/**
 * 顶栏标题：中文带 🪄，英文为 `title` 原文（无装饰）
 */
function mrmHeaderTitle(mod) {
    const base = typeof mod.title === 'string' && mod.title.length
        ? mod.title
        : mrmIsZhLocale()
            ? '动态资源修改器'
            : 'dynamic-resource-modifier';
    return mrmIsZhLocale() ? '🪄 ' + base : base;
}
/**
 * `ui-select` 在连接时会把 `<option>` 文案缓存到内部视图；仅改 `textContent` 不会刷新显示。
 * 在已写入最终文案后，用新节点替换选项列表以触发组件同步（不改变 `ui-select` 自身，避免破坏 `this.$`）。
 */
function mrmRefreshUiSelects(root) {
    if (!root)
        return;
    root.querySelectorAll('ui-select').forEach((node) => {
        const sel = node;
        const prev = sel.value;
        const specs = Array.from(sel.querySelectorAll('option')).map((o) => {
            var _a, _b;
            return ({
                value: (_a = o.getAttribute('value')) !== null && _a !== void 0 ? _a : '',
                text: (_b = o.textContent) !== null && _b !== void 0 ? _b : '',
            });
        });
        sel.replaceChildren();
        for (const { value, text } of specs) {
            const opt = document.createElement('option');
            opt.value = value;
            opt.textContent = text;
            sel.appendChild(opt);
        }
        if (specs.length) {
            const pick = specs.some((s) => s.value === prev) ? prev : specs[0].value;
            sel.value = pick;
        }
    });
}
/**
 * 对 `data-mrm` = 相对 `panel` 的 dot 路径；`data-mrm-html` 存在时用 innerHTML
 * `data-mrm-tt` → 设置 ui 元素 `tooltip`；`data-mrm-title` → `title` 属性
 */
function mrmApplyDom(mod, root) {
    if (!root)
        return;
    root.querySelectorAll('[data-mrm]').forEach((n) => {
        const el = n;
        const p = el.getAttribute('data-mrm');
        if (!p)
            return;
        const s = mrmTPanel(mod, p);
        if (el.hasAttribute('data-mrm-html'))
            el.innerHTML = s;
        else
            el.textContent = s;
    });
    root.querySelectorAll('[data-mrm-tt]').forEach((n) => {
        const el = n;
        const p = el.getAttribute('data-mrm-tt');
        if (p)
            el.setAttribute('tooltip', mrmTPanel(mod, p));
    });
    root.querySelectorAll('[data-mrm-title]').forEach((n) => {
        const el = n;
        const p = el.getAttribute('data-mrm-title');
        if (p)
            el.setAttribute('title', mrmTPanel(mod, p));
    });
    root.querySelectorAll('[data-mrm-ph]').forEach((n) => {
        const p = n.getAttribute('data-mrm-ph');
        if (!p)
            return;
        const s = mrmTPanel(mod, p);
        const h = n;
        h.placeholder = s;
        h.setAttribute('placeholder', s);
    });
    mrmRefreshUiSelects(root);
}
//# sourceMappingURL=mrm-i18n.js.map