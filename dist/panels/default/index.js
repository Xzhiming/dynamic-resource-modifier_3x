"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = exports.$ = exports.style = exports.template = void 0;
exports.ready = ready;
exports.close = close;
const fs_1 = require("fs");
const path_1 = require("path");
const mrm_i18n_1 = require("../mrm-i18n");
/** 须与 package.json 的 name 一致（Editor.Message.request 首参） */
const PKG = 'dynamic-resource-modifier_3x';
/** 编译输出在 dist/panels/default/，静态资源仍在扩展根目录 static/ */
const STATIC_DIR = (0, path_1.join)(__dirname, '../../../static');
const PKG_JSON = (0, path_1.join)(__dirname, '../../../package.json');
let gI18n = null;
function mMsg(k) {
    return (0, mrm_i18n_1.mrmTMsg)(gI18n || { panel: {}, msg: {} }, k);
}
function mMsgSub(k, repl) {
    return (0, mrm_i18n_1.mrmTMsgSub)(gI18n || { panel: {}, msg: {} }, k, repl);
}
exports.template = (0, fs_1.readFileSync)((0, path_1.join)(STATIC_DIR, 'default.html'), 'utf8');
exports.style = (0, fs_1.readFileSync)((0, path_1.join)(STATIC_DIR, 'default.css'), 'utf8');
exports.$ = {
    statusMsg: '#status-msg',
    panelVersion: '#panel-version',
    commonDir: '#common-dir',
    btnPickCommonDir: '#btn-pick-common-dir',
    btnResetCommonDir: '#btn-reset-common-dir',
    mrmPathInclude: '#mrm-path-include',
    mrmPathExclude: '#mrm-path-exclude',
    mrmPathSkipExt: '#mrm-path-skip-ext',
    mrmSkipExtEnabled: '#mrm-skip-ext-enabled',
    rnMode: '#rn-mode',
    rnReplaceFrom: '#rn-replace-from',
    rnReplaceTo: '#rn-replace-to',
    rnReplaceIgnoreCase: '#rn-replace-ignore-case',
    rnPrefixText: '#rn-prefix-text',
    rnSuffixText: '#rn-suffix-text',
    rnSeqBase: '#rn-seq-base',
    rnSeqStart: '#rn-seq-start',
    rnSeqPad: '#rn-seq-pad',
    rnSeqKeep: '#rn-seq-keep',
    rnRegexPattern: '#rn-regex-pattern',
    rnRegexFlags: '#rn-regex-flags',
    rnRegexReplace: '#rn-regex-replace',
    rnExtFilter: '#rn-ext-filter',
    rnRecursive: '#rn-recursive',
    rnSyncFilenameRefs: '#rn-sync-filename-refs',
    btnRnPreview: '#btn-rn-preview',
    btnRnRun: '#btn-rn-run',
    rnPreviewBox: '#rn-preview-box',
    frNewName: '#fr-new-name',
    btnFrRun: '#btn-fr-run',
    uuidScope: '#uuid-scope',
    uuidGenMode: '#uuid-gen-mode',
    uuidSaltFields: '#uuid-salt-fields',
    uuidSaltCer: '#uuid-salt-cer',
    uuidSaltProduct: '#uuid-salt-product',
    uuidSaltVersion: '#uuid-salt-version',
    uuidSaltPlatform: '#uuid-salt-platform',
    uuidSaltProductUuid: '#uuid-salt-product-uuid',
    uuidSaltNonce: '#uuid-salt-nonce',
    uuidSaltNonceLabel: '#uuid-salt-nonce-label',
    uuidSaltNonceRandom: '#uuid-salt-nonce-random',
    uuidMergeSecrets: '#uuid-merge-secrets',
    btnUuidPickCer: '#btn-uuid-pick-cer',
    uuidTarget: '#uuid-target',
    btnUuidPickFile: '#btn-uuid-pick-file',
    btnUuidPickDir: '#btn-uuid-pick-dir',
    uuidUpdateRefs: '#uuid-update-refs',
    uuidIncludeDirUuid: '#uuid-include-dir-uuid',
    uuidIncludeSp: '#uuid-include-sp',
    btnUuidRun: '#btn-uuid-run',
    md5Scope: '#md5-scope',
    md5Mode: '#md5-mode',
    md5ExtFilter: '#md5-ext-filter',
    md5Target: '#md5-target',
    btnMd5PickFile: '#btn-md5-pick-file',
    btnMd5PickDir: '#btn-md5-pick-dir',
    btnMd5Run: '#btn-md5-run',
    resultBox: '#result-box',
    btnClearResult: '#btn-clear-result',
    mrmPanel: '#mrm-panel',
    panelTitle: '#panel-title',
};
function getVal(el) {
    var _a;
    return el ? String((_a = el.value) !== null && _a !== void 0 ? _a : '') : '';
}
function setVal(el, v) {
    if (el)
        el.value = v !== null && v !== void 0 ? v : '';
}
/** Creator ui-input 内部多为 Shadow 内原生 input；长路径需右对齐并滚到最右侧显示 */
function getNativeInput(el) {
    if (!el)
        return null;
    const he = el;
    if (he.shadowRoot) {
        const inp = he.shadowRoot.querySelector('input');
        if (inp)
            return inp;
    }
    return el instanceof HTMLInputElement ? el : null;
}
function syncPathTailView(el) {
    const inp = getNativeInput(el);
    if (!inp)
        return;
    inp.style.textAlign = 'right';
    inp.style.direction = 'ltr';
    const scrollEnd = () => {
        const max = Math.max(0, inp.scrollWidth - inp.clientWidth);
        inp.scrollLeft = max;
    };
    requestAnimationFrame(() => requestAnimationFrame(scrollEnd));
}
function setPathVal(el, v) {
    setVal(el, v);
    syncPathTailView(el !== null && el !== void 0 ? el : null);
}
function bindPathTailInput(el) {
    if (!el)
        return;
    const sync = () => syncPathTailView(el);
    sync();
    queueMicrotask(sync);
    if (typeof customElements !== 'undefined' && customElements.whenDefined) {
        void customElements.whenDefined('ui-input').then(sync);
    }
    requestAnimationFrame(() => requestAnimationFrame(sync));
    el.addEventListener('input', sync);
    el.addEventListener('change', sync);
    el.addEventListener('focus', sync);
    if (typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(() => sync());
        ro.observe(el);
    }
}
function getNum(el) {
    return el ? parseFloat(String(el.value)) || 0 : 0;
}
function getCheck(el) {
    if (!el)
        return false;
    const v = el.value;
    if (typeof v === 'boolean')
        return v;
    if (typeof v === 'number')
        return v === 1;
    if (v === 'true' || v === '1')
        return true;
    if (v === 'false' || v === '0')
        return false;
    const he = el;
    if (he.shadowRoot) {
        const si = he.shadowRoot.querySelector('input[type="checkbox"]') ||
            he.shadowRoot.querySelector('input');
        if (si && 'checked' in si)
            return si.checked;
    }
    const qi = typeof el.querySelector === 'function' ? el.querySelector('input') : null;
    if (qi && 'checked' in qi)
        return qi.checked;
    return el.hasAttribute('checked');
}
/** 「随机 hex」勾选时灰化并禁用「构建随机数」手动输入 */
function setBuildNonceManualMuted(panel, muted) {
    const label = panel.$.uuidSaltNonceLabel;
    const inp = panel.$.uuidSaltNonce;
    if (label) {
        if (muted)
            label.classList.add('mrm-control-muted');
        else
            label.classList.remove('mrm-control-muted');
    }
    if (inp) {
        if (muted)
            inp.classList.add('mrm-control-muted');
        else
            inp.classList.remove('mrm-control-muted');
        try {
            inp.disabled = muted;
        }
        catch {
            /* */
        }
        try {
            if (muted)
                inp.setAttribute('disabled', '');
            else
                inp.removeAttribute('disabled');
        }
        catch {
            /* */
        }
        const ni = getNativeInput(inp);
        if (ni) {
            ni.disabled = muted;
            try {
                if (muted)
                    ni.setAttribute('disabled', '');
                else
                    ni.removeAttribute('disabled');
            }
            catch {
                /* */
            }
        }
    }
}
async function reqMsg(name, ...args) {
    return (await Editor.Message.request(PKG, name, ...args));
}
/** 执行结果 HTML → 纯文本，供写入插件 log */
function htmlToPlainLine(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return (tmp.innerText || tmp.textContent || '').replace(/\r\n/g, '\n').trim();
}
exports.methods = {
    showStatus(msg, type = 'info') {
        const el = this.$.statusMsg;
        if (!el)
            return;
        el.textContent = msg;
        el.className = 'status-msg ' + type;
        clearTimeout(this._statusTimer);
        this._statusTimer = setTimeout(() => {
            el.textContent = '';
            el.className = 'status-msg';
        }, 4000);
    },
    appendResult(html) {
        const box = this.$.resultBox;
        if (!box)
            return;
        if (box.textContent === mMsg('resultEmpty'))
            box.innerHTML = '';
        const div = document.createElement('div');
        div.innerHTML = html;
        box.appendChild(div);
        box.scrollTop = box.scrollHeight;
        const plain = htmlToPlainLine(html);
        if (plain) {
            void reqMsg('append-result-log', { line: plain }).catch(() => { });
        }
    },
    escapeHtml(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    },
    currentRule() {
        const refEl = this.$.rnSyncFilenameRefs;
        const mode = getVal(this.$.rnMode) || 'replace';
        const params = {};
        switch (mode) {
            case 'replace':
                params.from = getVal(this.$.rnReplaceFrom);
                params.to = getVal(this.$.rnReplaceTo);
                params.ignoreCase = getCheck(this.$.rnReplaceIgnoreCase);
                break;
            case 'prefix':
                params.text = getVal(this.$.rnPrefixText);
                break;
            case 'suffix':
                params.text = getVal(this.$.rnSuffixText);
                break;
            case 'sequence':
                params.base = getVal(this.$.rnSeqBase) || 'asset_';
                params.start = getNum(this.$.rnSeqStart);
                params.pad = getNum(this.$.rnSeqPad) || 3;
                params.keepOriginal = getCheck(this.$.rnSeqKeep);
                break;
            case 'regex':
                params.pattern = getVal(this.$.rnRegexPattern);
                params.flags = getVal(this.$.rnRegexFlags) || 'g';
                params.replace = getVal(this.$.rnRegexReplace);
                break;
        }
        return {
            mode,
            params,
            extFilter: getVal(this.$.rnExtFilter),
            recursive: getCheck(this.$.rnRecursive),
            updateFilenameReferences: refEl == null ? true : getCheck(refEl),
            ...this.pathFilterFromPanel(),
        };
    },
    pathFilterFromPanel() {
        return {
            pathIncludePatterns: getVal(this.$.mrmPathInclude),
            pathExcludePatterns: getVal(this.$.mrmPathExclude),
            pathSkipExt: getVal(this.$.mrmPathSkipExt),
            pathSkipExtEnabled: this.$.mrmSkipExtEnabled == null ? true : getCheck(this.$.mrmSkipExtEnabled),
        };
    },
    updateModeVisibility() {
        const mode = getVal(this.$.rnMode) || 'replace';
        const root = this.$.mrmPanel || document;
        root.querySelectorAll('.rn-params').forEach((el) => {
            const m = el.getAttribute('data-mode');
            if (m === mode)
                el.classList.remove('hidden');
            else
                el.classList.add('hidden');
        });
    },
    updateUuidSaltVisibility() {
        const mode = getVal(this.$.uuidGenMode) || 'random-v4';
        const box = this.$.uuidSaltFields;
        if (!box)
            return;
        if (mode === 'salt-v4')
            box.classList.remove('hidden');
        else
            box.classList.add('hidden');
        this.syncBuildNonceHexMuted();
    },
    syncBuildNonceHexMuted() {
        const mode = getVal(this.$.uuidGenMode) || 'random-v4';
        const cb = this.$.uuidSaltNonceRandom;
        const muted = mode === 'salt-v4' && cb != null && getCheck(cb);
        setBuildNonceManualMuted(this, muted);
    },
    getCommonDir() {
        const v = getVal(this.$.commonDir);
        return v || '';
    },
};
async function ready() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    try {
        const loc = await reqMsg('get-mrm-locale');
        if (loc && loc.ok === true)
            (0, mrm_i18n_1.mrmSetZhOverride)(loc.zh === true);
        else
            (0, mrm_i18n_1.mrmSetZhOverride)(null);
    }
    catch {
        (0, mrm_i18n_1.mrmSetZhOverride)(null);
    }
    gI18n = (0, mrm_i18n_1.mrmLoad)();
    const headTitle = this.$.panelTitle;
    if (headTitle)
        headTitle.textContent = (0, mrm_i18n_1.mrmHeaderTitle)(gI18n);
    (0, mrm_i18n_1.mrmApplyDom)(gI18n, this.$.mrmPanel);
    if (this.$.resultBox)
        this.$.resultBox.textContent = mMsg('resultEmpty');
    try {
        const pkg = JSON.parse((0, fs_1.readFileSync)(PKG_JSON, 'utf8'));
        setVal(this.$.panelVersion, null);
        const pv = this.$.panelVersion;
        if (pv)
            pv.textContent = 'v' + (pkg.version || '1.0.0');
    }
    catch {
        /* 静默 */
    }
    try {
        const r = await reqMsg('get-default-directory');
        if (r && r.ok && r.path)
            setPathVal(this.$.commonDir, String(r.path));
    }
    catch {
        /* 静默 */
    }
    if (this.$.rnRecursive)
        this.$.rnRecursive.value = true;
    if (this.$.rnSyncFilenameRefs)
        this.$.rnSyncFilenameRefs.value = true;
    if (this.$.uuidUpdateRefs)
        this.$.uuidUpdateRefs.value = true;
    if (this.$.uuidIncludeSp)
        this.$.uuidIncludeSp.value = true;
    if (this.$.uuidMergeSecrets)
        this.$.uuidMergeSecrets.value = true;
    if (this.$.mrmSkipExtEnabled)
        this.$.mrmSkipExtEnabled.value = true;
    setVal(this.$.rnMode, 'replace');
    setVal(this.$.uuidScope, 'single');
    setVal(this.$.uuidGenMode, 'random-v4');
    setVal(this.$.md5Scope, 'single');
    setVal(this.$.md5Mode, 'both');
    bindPathTailInput(this.$.commonDir);
    bindPathTailInput(this.$.uuidTarget);
    bindPathTailInput(this.$.md5Target);
    bindPathTailInput(this.$.uuidSaltCer);
    const rnModeEl = this.$.rnMode;
    if (rnModeEl) {
        const onChange = () => this.updateModeVisibility();
        rnModeEl.addEventListener('change', onChange);
        rnModeEl.addEventListener('confirm', onChange);
    }
    this.updateModeVisibility();
    const uuidGenEl = this.$.uuidGenMode;
    if (uuidGenEl) {
        const onUuidMode = () => this.updateUuidSaltVisibility();
        uuidGenEl.addEventListener('change', onUuidMode);
        uuidGenEl.addEventListener('confirm', onUuidMode);
    }
    this.updateUuidSaltVisibility();
    const nonceRandEl = this.$.uuidSaltNonceRandom;
    if (nonceRandEl) {
        const onNonceRand = () => this.syncBuildNonceHexMuted();
        nonceRandEl.addEventListener('change', onNonceRand);
        nonceRandEl.addEventListener('confirm', onNonceRand);
    }
    this.syncBuildNonceHexMuted();
    (_a = this.$.btnPickCommonDir) === null || _a === void 0 ? void 0 : _a.addEventListener('click', async () => {
        const r = await reqMsg('pick-directory');
        if (r && r.ok && r.path) {
            setPathVal(this.$.commonDir, String(r.path));
            this.showStatus(mMsg('pickDirOk'), 'success');
        }
    });
    (_b = this.$.btnResetCommonDir) === null || _b === void 0 ? void 0 : _b.addEventListener('click', async () => {
        var _a;
        const r = await reqMsg('get-default-directory');
        if (r && r.ok)
            setPathVal(this.$.commonDir, String((_a = r.path) !== null && _a !== void 0 ? _a : ''));
    });
    (_c = this.$.btnRnPreview) === null || _c === void 0 ? void 0 : _c.addEventListener('click', async () => {
        const rule = this.currentRule();
        const targetDir = this.getCommonDir();
        const r = await reqMsg('preview-batch-rename', { targetDir, rule });
        const box = this.$.rnPreviewBox;
        if (!box)
            return;
        box.classList.remove('hidden');
        if (!r || !r.ok) {
            box.innerHTML = `<span class="err">${mMsg('previewErrPrefix')}${this.escapeHtml(r && r.message)}</span>`;
            this.showStatus(mMsg('previewFailed'), 'error');
            return;
        }
        const truncPart = r.truncated ? mMsg('previewTrunc') : mMsg('previewEmptyTrunc');
        const pr = r;
        const head = mMsgSub('previewHead', { total: pr.total, changed: pr.changed, trunc: truncPart });
        const preview = pr.preview;
        const lines = preview
            .map((x) => `<span class="info">${this.escapeHtml(x.oldName)}</span> → <span class="ok">${this.escapeHtml(x.newName)}</span>`)
            .join('\n');
        box.innerHTML = head + '\n\n' + lines;
        this.showStatus(mMsgSub('previewOk', { a: pr.changed, b: pr.total }), 'success');
    });
    (_d = this.$.btnRnRun) === null || _d === void 0 ? void 0 : _d.addEventListener('click', async () => {
        const rule = this.currentRule();
        const targetDir = this.getCommonDir();
        const r = await reqMsg('run-batch-rename', { targetDir, rule });
        if (!r || !r.ok) {
            this.appendResult(`<span class="err">${mMsg('batchErrPrefix')}${this.escapeHtml(r && r.message)}</span>`);
            this.showStatus(mMsg('batchFailed'), 'error');
            return;
        }
        const res = r.result;
        this.appendResult(`<span class="ok">${mMsg('batchOkStatus')}</span>${mMsg('resultLineSep')}` +
            mMsgSub('batchResultDetail', { success: res.success, failed: res.failed, total: res.total }) +
            (res.refFiles != null && res.refHits != null && res.refFiles > 0
                ? '\n' + mMsgSub('batchRefLine', { a: res.refFiles, b: res.refHits })
                : '') +
            (res.errors.length
                ? '\n' +
                    res.errors
                        .slice(0, 20)
                        .map((e) => `<span class="err">  · ${this.escapeHtml(e.path)}: ${this.escapeHtml(e.message)}</span>`)
                        .join('\n')
                : ''));
        this.showStatus(mMsg('batchOkStatus'), 'success');
    });
    (_e = this.$.btnFrRun) === null || _e === void 0 ? void 0 : _e.addEventListener('click', async () => {
        const targetDir = this.getCommonDir();
        const newName = getVal(this.$.frNewName).trim();
        if (!newName) {
            this.showStatus(mMsg('folderNeedName'), 'error');
            return;
        }
        const r = await reqMsg('run-folder-rename', { targetDir, newName });
        if (!r || !r.ok) {
            this.appendResult(`<span class="err">${mMsg('folderErrPrefix')}${this.escapeHtml(r && r.message)}</span>`);
            this.showStatus(mMsg('folderFailed'), 'error');
            return;
        }
        const result = r.result;
        const newPath = result && result.newDir;
        if (newPath)
            setPathVal(this.$.commonDir, newPath);
        this.appendResult(`<span class="ok">${mMsg('folderOkStatus')}</span>${mMsg('resultLineSep')}${this.escapeHtml(newPath || mMsg('folderSame'))}`);
        this.showStatus(mMsg('folderOkStatus'), 'success');
    });
    (_f = this.$.btnUuidPickFile) === null || _f === void 0 ? void 0 : _f.addEventListener('click', async () => {
        try {
            const r = await Editor.Dialog.select({
                title: mMsg('pickFile'),
                type: 'file',
                path: this.getCommonDir(),
            });
            if (r && r.filePaths && r.filePaths.length)
                setPathVal(this.$.uuidTarget, r.filePaths[0]);
        }
        catch (e) {
            this.showStatus(mMsg('pickFail') + (e instanceof Error ? e.message : String(e)), 'error');
        }
    });
    (_g = this.$.btnUuidPickDir) === null || _g === void 0 ? void 0 : _g.addEventListener('click', async () => {
        const r = await reqMsg('pick-directory');
        if (r && r.ok && r.path)
            setPathVal(this.$.uuidTarget, String(r.path));
    });
    (_h = this.$.btnUuidPickCer) === null || _h === void 0 ? void 0 : _h.addEventListener('click', async () => {
        try {
            const r = await Editor.Dialog.select({
                title: mMsg('pickCer'),
                type: 'file',
                path: this.getCommonDir(),
            });
            if (r && r.filePaths && r.filePaths.length)
                setPathVal(this.$.uuidSaltCer, r.filePaths[0]);
        }
        catch (e) {
            this.showStatus(mMsg('pickFail') + (e instanceof Error ? e.message : String(e)), 'error');
        }
    });
    (_j = this.$.btnUuidRun) === null || _j === void 0 ? void 0 : _j.addEventListener('click', async () => {
        const target = getVal(this.$.uuidTarget);
        const scope = getVal(this.$.uuidScope) || 'single';
        const uuidGenMode = getVal(this.$.uuidGenMode) || 'random-v4';
        const updateReferences = getCheck(this.$.uuidUpdateRefs);
        const includeDirectoryUuids = getCheck(this.$.uuidIncludeDirUuid);
        const includeSettingsProfiles = this.$.uuidIncludeSp == null ? true : getCheck(this.$.uuidIncludeSp);
        const mergeObfuscateSecrets = this.$.uuidMergeSecrets == null ? true : getCheck(this.$.uuidMergeSecrets);
        if (!target) {
            this.showStatus(mMsg('needTarget'), 'error');
            return;
        }
        const r = await reqMsg('run-uuid-modify', {
            target,
            scope,
            uuidGenMode,
            updateReferences,
            includeDirectoryUuids,
            includeSettingsProfiles,
            mergeObfuscateSecrets,
            saltCerPath: getVal(this.$.uuidSaltCer),
            saltProductName: getVal(this.$.uuidSaltProduct),
            saltAppVersion: getVal(this.$.uuidSaltVersion),
            saltPlatformType: getVal(this.$.uuidSaltPlatform),
            saltProductUuid: getVal(this.$.uuidSaltProductUuid),
            saltBuildNonce: getVal(this.$.uuidSaltNonce),
            saltBuildNonceRandom: getCheck(this.$.uuidSaltNonceRandom),
            ...this.pathFilterFromPanel(),
        });
        if (!r || !r.ok) {
            this.appendResult(`<span class="err">${mMsg('uuidErrPrefix')}${this.escapeHtml(r && r.message)}</span>`);
            this.showStatus(mMsg('uuidFailed'), 'error');
            return;
        }
        const res = r.result;
        this.appendResult(`<span class="ok">${mMsg('uuidOk')}</span>${mMsg('resultLineSep')}` +
            mMsgSub('uuidOkDetail', {
                a: res.success,
                b: res.failed,
                c: res.refFiles || 0,
                d: res.refHits || 0,
            }) +
            (res.errors && res.errors.length
                ? '\n' +
                    res.errors
                        .slice(0, 20)
                        .map((e) => `<span class="err">  · ${this.escapeHtml(e.path)}: ${this.escapeHtml(e.message)}</span>`)
                        .join('\n')
                : ''));
        this.showStatus(mMsg('uuidOk'), 'success');
    });
    (_k = this.$.btnMd5PickFile) === null || _k === void 0 ? void 0 : _k.addEventListener('click', async () => {
        try {
            const r = await Editor.Dialog.select({
                title: mMsg('pickFile'),
                type: 'file',
                path: this.getCommonDir(),
            });
            if (r && r.filePaths && r.filePaths.length)
                setPathVal(this.$.md5Target, r.filePaths[0]);
        }
        catch (e) {
            this.showStatus(mMsg('pickFail') + (e instanceof Error ? e.message : String(e)), 'error');
        }
    });
    (_l = this.$.btnMd5PickDir) === null || _l === void 0 ? void 0 : _l.addEventListener('click', async () => {
        const r = await reqMsg('pick-directory');
        if (r && r.ok && r.path)
            setPathVal(this.$.md5Target, String(r.path));
    });
    (_m = this.$.btnMd5Run) === null || _m === void 0 ? void 0 : _m.addEventListener('click', async () => {
        const target = getVal(this.$.md5Target);
        const scope = getVal(this.$.md5Scope) || 'single';
        const mode = getVal(this.$.md5Mode) || 'both';
        const extFilter = getVal(this.$.md5ExtFilter);
        if (!target) {
            this.showStatus(mMsg('needTarget'), 'error');
            return;
        }
        const r = await reqMsg('run-md5-modify', { target, scope, mode, extFilter });
        if (!r || !r.ok) {
            this.appendResult(`<span class="err">${mMsg('md5ErrPrefix')}${this.escapeHtml(r && r.message)}</span>`);
            this.showStatus(mMsg('md5Failed'), 'error');
            return;
        }
        const res = r.result;
        this.appendResult(`<span class="ok">${mMsg('md5Ok')}</span>${mMsg('resultLineSep')}` +
            mMsgSub('md5Detail', { a: res.success, b: res.failed, c: res.total }) +
            (res.details && res.details.length
                ? '\n' +
                    res.details
                        .slice(0, 10)
                        .map((d) => { var _a, _b; return `<span class="info">  · ${this.escapeHtml(d.file)}: ${this.escapeHtml((_a = d.md5Before) === null || _a === void 0 ? void 0 : _a.slice(0, 8))} → ${this.escapeHtml((_b = d.md5After) === null || _b === void 0 ? void 0 : _b.slice(0, 8))}</span>`; })
                        .join('\n')
                : ''));
        this.showStatus(mMsg('md5Ok'), 'success');
    });
    (_o = this.$.btnClearResult) === null || _o === void 0 ? void 0 : _o.addEventListener('click', () => {
        if (this.$.resultBox)
            this.$.resultBox.textContent = mMsg('resultEmpty');
    });
}
function close() {
    /* 无需保存 */
}
//# sourceMappingURL=index.js.map