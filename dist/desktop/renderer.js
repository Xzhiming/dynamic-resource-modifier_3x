"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PKG = 'dynamic-resource-modifier_3x';
function ensureDesktopIpcBridge() {
    const w = window;
    if (w.desktopApi && typeof w.desktopApi.callMethod === 'function')
        return;
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { ipcRenderer } = require('electron');
        w.desktopApi = {
            getState: () => ipcRenderer.invoke('desk:getState'),
            saveState: (state) => ipcRenderer.invoke('desk:saveState', state),
            pickDirectory: (opts) => ipcRenderer.invoke('desk:pickDirectory', opts),
            callMethod: (msg, args) => ipcRenderer.invoke('desk:callMethod', msg, args !== null && args !== void 0 ? args : []),
            dialogSelect: (opts) => ipcRenderer.invoke('desk:dialogSelect', opts),
            openDevTools: () => ipcRenderer.invoke('desk:openDevTools'),
        };
    }
    catch (e) {
        console.error('[MRM desktop] IPC 桥失败（需 nodeIntegration + contextIsolation=false）', e);
    }
}
function installEditorGlobals() {
    globalThis.Editor = {
        Message: {
            request: async (ext, name, ...args) => {
                if (ext !== PKG) {
                    throw new Error(`[MRM desktop] 未支持的扩展: ${ext}`);
                }
                const api = window.desktopApi;
                if (!api)
                    throw new Error('desktopApi 未就绪');
                return api.callMethod(name, args);
            },
        },
        Dialog: {
            select: async (opts) => {
                const api = window.desktopApi;
                if (!api)
                    throw new Error('desktopApi 未就绪');
                return api.dialogSelect(opts);
            },
        },
    };
}
function bindPanelContext(panelMod) {
    const $map = {};
    for (const [k, sel] of Object.entries(panelMod.$)) {
        $map[k] = document.querySelector(sel);
    }
    const ctx = { $: $map, _statusTimer: undefined };
    for (const key of Object.keys(panelMod.methods)) {
        const fn = panelMod.methods[key];
        if (typeof fn === 'function') {
            ctx[key] = fn.bind(ctx);
        }
        else {
            ctx[key] = fn;
        }
    }
    return ctx;
}
async function wireToolbar() {
    var _a, _b, _c;
    const api = window.desktopApi;
    if (!api)
        return;
    const st = await api.getState();
    const rootIn = document.getElementById('desktop-project-root');
    const localeSel = document.getElementById('desktop-locale');
    if (rootIn)
        rootIn.value = st.projectRoot || '';
    if (localeSel)
        localeSel.value = st.localeZh ? 'zh' : 'en';
    (_a = document.getElementById('desktop-save-bar')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', async () => {
        const prev = await api.getState();
        const localeZh = localeSel ? localeSel.value === 'zh' : true;
        await api.saveState({
            projectRoot: rootIn ? rootIn.value.trim() : '',
            localeZh,
        });
        if (!!prev.localeZh !== localeZh) {
            location.reload();
        }
    });
    (_b = document.getElementById('desktop-pick-project')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', async () => {
        const p = await api.pickDirectory({ title: '选择 Cocos 工程根目录' });
        if (p && rootIn)
            rootIn.value = p;
    });
    (_c = document.getElementById('desktop-devtools')) === null || _c === void 0 ? void 0 : _c.addEventListener('click', () => {
        void api.openDevTools();
    });
}
async function boot() {
    ensureDesktopIpcBridge();
    installEditorGlobals();
    await wireToolbar();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const panelMod = require('../panels/default/index.js');
    const ctx = bindPanelContext(panelMod);
    await panelMod.ready.call(ctx);
}
void boot().catch((e) => console.error('[MRM desktop] boot', e));
//# sourceMappingURL=renderer.js.map