/**
 * dsh-tdai-memory — browser half.
 *
 * A configuration page inside the sidebar Plugins page: edits `tdai-memory`
 * settings namespace (data dir, extraction LLM, embeddings, capture/extract/
 * recall switches, tools) through the settings scope transport plus nested
 * `settings.mutate` ops. TdaiCore is built at startup, so changes apply
 * after a restart (noted in the UI).
 *
 * Hand-written ModuleLoader bundle — no build step required.
 */
window.__ModuleLoader__.load({
  id: "dsh-tdai-memory",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    var react = require("react");
    var h = react.createElement;

    // ── CSS (theme tokens) ────────────────────────────────────────────────
    var CSS = ".__tm_root{max-width:640px;display:flex;flex-direction:column;gap:10px}" +
      ".__tm_group{font-size:13px;font-weight:700;color:var(--dsw-alias-label-primary);border-bottom:1px solid var(--dsw-alias-border-l2);padding-bottom:4px;margin:6px 0 2px}" +
      ".__tm_field{display:flex;flex-direction:column;gap:4px}" +
      ".__tm_label{font-size:12px;font-weight:600;color:var(--dsw-alias-label-primary);display:flex;align-items:center;gap:6px}" +
      ".__tm_override{font-size:10px;color:var(--dsw-alias-state-business-primary);border:1px solid var(--dsw-alias-border-l2);border-radius:4px;padding:0 4px}" +
      ".__tm_hint{font-size:11px;color:var(--dsw-alias-label-tertiary)}" +
      ".__tm_input{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);font:inherit;color:var(--dsw-alias-label-primary);border-radius:8px;padding:6px 10px;font-size:13px;box-sizing:border-box;width:100%}" +
      ".__tm_row{display:flex;align-items:center;gap:8px}" +
      ".__tm_check{accent-color:var(--dsw-alias-state-business-primary)}" +
      ".__tm_actions{display:flex;gap:8px;align-items:center;margin-top:4px}" +
      ".__tm_btn{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);border-radius:8px;padding:6px 14px;font:inherit;font-size:13px;cursor:pointer}" +
      ".__tm_btn:hover:not(:disabled){border-color:var(--dsw-alias-state-business-primary)}" +
      ".__tm_btn:disabled{opacity:.5;cursor:default}" +
      ".__tm_btnPrimary{border-color:var(--dsw-alias-state-business-primary, #3964fe);background:var(--dsw-alias-state-business-primary, #3964fe);color:#fff}" +
      ".__tm_status{font-size:12px;color:var(--dsw-alias-label-tertiary)}" +
      ".__tm_error{font-size:12px;color:var(--dsw-alias-state-error-primary)}" +
      ".__tm_unavailable{font-size:13px;color:var(--dsw-alias-label-tertiary)}";
    // Scoped flat controls retain native keyboard and form behavior.
    CSS += `
.dsh-flat.__tm_root{width:100%;max-width:720px;gap:14px;font-size:13px;line-height:1.65;color:var(--dsw-alias-label-primary);--flat-accent:var(--dsw-alias-state-business-primary,#3964fe);--flat-border:var(--dsw-alias-border-l2,#dce2eb)}
.dsh-flat.__tm_root *{box-sizing:border-box;min-width:0}
.dsh-flat.__tm_root p{margin:0}
.dsh-flat.__tm_root label[class$="_field"]{gap:7px}
.dsh-flat.__tm_root [class$="_label"]{font-size:13px;font-weight:500}
.dsh-flat.__tm_root [class$="_hint"]{font-size:12px;line-height:1.65}
.dsh-flat.__tm_root input:not([type=checkbox]),.dsh-flat.__tm_root select,.dsh-flat.__tm_root textarea{width:100%;border:1px solid var(--flat-border);border-radius:6px;background:var(--dsw-alias-bg-layer-3);color:inherit;font:inherit;padding:9px 12px;min-height:40px;box-shadow:none;transition:border-color .15s}
.dsh-flat.__tm_root input:hover:not(:disabled),.dsh-flat.__tm_root select:hover:not(:disabled),.dsh-flat.__tm_root textarea:hover:not(:disabled){border-color:var(--dsw-alias-label-tertiary)}
.dsh-flat.__tm_root select{appearance:none;padding-right:34px;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='m2 2 4 4 4-4' fill='none' stroke='%23778091' stroke-width='1.5'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center}
.dsh-flat.__tm_root input[type=checkbox]{appearance:none;flex:none;width:30px;height:18px;margin:0;border:1px solid var(--flat-border);border-radius:12px;background:var(--dsw-alias-bg-layer-2);position:relative;cursor:pointer;transition:background .15s,border-color .15s}
.dsh-flat.__tm_root input[type=checkbox]::before{content:"";position:absolute;left:2px;top:2px;width:12px;height:12px;border-radius:50%;background:var(--dsw-alias-label-secondary);transition:transform .15s}
.dsh-flat.__tm_root input[type=checkbox]:checked{background:var(--flat-accent);border-color:var(--flat-accent)}
.dsh-flat.__tm_root input[type=checkbox]:checked::before{transform:translateX(12px);background:#fff}
.dsh-flat.__tm_root :is(input,select,textarea,button,summary,a):focus-visible{outline:2px solid var(--flat-accent);outline-offset:3px}
.dsh-flat.__tm_root :is(input,select,textarea,button):disabled{opacity:.5;cursor:default}
.dsh-flat.__tm_root [class$="_actions"]{flex-wrap:wrap;gap:10px;margin-top:4px;padding-top:16px;border-top:1px solid var(--flat-border)}
.dsh-flat.__tm_root details{border-top:1px solid var(--flat-border);padding:0}
.dsh-flat.__tm_root summary{list-style:none;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 0;font-size:13px;font-weight:500;cursor:pointer;color:var(--dsw-alias-label-secondary)}
.dsh-flat.__tm_root summary::-webkit-details-marker{display:none}
.dsh-flat.__tm_root summary::after{content:"+";font-size:18px;font-weight:400;flex:none}
.dsh-flat.__tm_root details[open]>summary::after{content:"−"}
.dsh-flat.__tm_root details>div{padding-bottom:18px}
.dsh-flat.__tm_root .__tm_group{border:0;font-weight:600;font-size:14px;margin:8px 0 0;padding:0}
@media(prefers-reduced-motion:reduce){.dsh-flat.__tm_root *,.dsh-flat.__tm_root input[type=checkbox]::before{transition:none}}
.dsh-flat.__tm_root button{border-radius:6px;min-height:34px;padding:7px 14px;font:inherit;font-size:12px;box-shadow:none}
.dsh-flat.__tm_root :is(h2,h3){margin:0;font-size:14px;font-weight:600}
`;
    var tagId = "dsh-tdai-memory/main.css";
    if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
      var tag = document.createElement("style");
      tag.dataset.plugin = "dsh-tdai-memory";
      tag.dataset.pluginCss = tagId;
      tag.textContent = CSS;
      document.head.appendChild(tag);
    }

    // ── locale ────────────────────────────────────────────────────────────
    var NS = "tdaiMemory";
    var inject = ["slots", "locale", "configForms"];
    var zh = {
      nav: "记忆",
      mode: "记忆模式",
      modeAuto: "自动记忆（推荐）",
      modeSearch: "仅搜索已有记忆",
      modePaused: "暂停记忆功能",
      modeCustom: "自定义组合",
      modeHint: "自动：捕获、提取、召回和搜索全部开启；仅搜索：不记录新对话、不自动注入记忆；暂停：四项全部关闭。选择后点击保存。",
      advanced: "高级设置：独立开关、存储与请求参数",
      setupHint: "填写提取模型和向量模型的连接信息，再保存。已有自定义设置会保留；密钥留空不修改。",
      intro: "记录对话、整理长期记忆，并在相关对话中自动召回。保存后请重启 DSH 生效；密钥只写不读。",
      groupData: "数据",
      groupLlm: "记忆整理模型",
      groupEmbedding: "向量检索模型",
      groupCapture: "捕获",
      groupExtraction: "提取",
      groupRecall: "召回",
      groupTools: "工具",
      fieldDataDir: "数据目录（空 = ~/.memory-tencentdb/memory-tdai）",
      fieldLlmBaseUrl: "Base URL",
      fieldLlmApiKey: "API Key",
      fieldLlmModel: "模型",
      fieldLlmMaxTokens: "最大输出 Tokens",
      fieldLlmTimeoutMs: "超时（毫秒）",
      fieldLlmSendSessionHeader: "发送会话标识头（x-opencode-session）",
      fieldLlmSessionHeaderName: "会话标识头名称",
      fieldLlmSessionId: "固定会话 ID（留空 = 自动持久化）",
      hintLlmSendSessionHeader: "OpenCode Go 等网关要求每个 LLM 请求带稳定的会话标识；请求不带可能报错（2026-09-06 起）。值：优先用固定 ID，否则在数据目录生成持久 ID（重启不变）。",
      hintLlmSessionId: "后台抽取请求的固定会话标识；留空则自动生成并持久化到数据目录的 session-id 文件。",
      fieldEmbeddingBaseUrl: "Base URL",
      fieldEmbeddingApiKey: "API Key",
      fieldEmbeddingModel: "模型",
      fieldEmbeddingDimensions: "向量维度",
      fieldEmbeddingSendDimensions: "请求带 dimensions 参数",
      fieldCaptureEnabled: "捕获对话（L0）",
      fieldExtractionEnabled: "结构化提取（L1）",
      fieldExtractionEnableDedup: "冲突检测（额外 LLM 调用）",
      fieldRecallEnabled: "召回注入",
      fieldRecallMaxResults: "最大召回条数",
      fieldRecallScoreThreshold: "相似度阈值",
      fieldRecallTimeoutMs: "召回超时（毫秒）",
      fieldToolsEnabled: "注册搜索工具（tdai_memory_search / tdai_conversation_search）",
      secretHint: "留空保持当前密钥。",
      save: "保存",
      reset: "恢复默认",
      saved: "已保存（重启后生效）",
      saving: "保存中…",
      error: "保存失败",
      notApplied: "写入未生效，请检查配置后重试",
      unavailable: "设置命名空间不可用（服务端未注册 tdai-memory 命名空间？）",
      overridden: "已覆盖",
      loading: "加载中…"
    };
    var en = {
      nav: "Memory",
      mode: "Memory mode",
      modeAuto: "Automatic memory (recommended)",
      modeSearch: "Search existing memory only",
      modePaused: "Pause memory features",
      modeCustom: "Custom combination",
      modeHint: "Automatic enables capture, extraction, recall and search. Search only records no new conversations and injects no memory. Pause disables all four. Click Save to apply your selection.",
      advanced: "Advanced: individual switches, storage and request options",
      setupHint: "Enter the extraction and embedding connections, then save. Existing custom settings are preserved; blank keys stay unchanged.",
      intro: "Record conversations, organize long-term memory and recall it in relevant chats. Restart DSH after saving to apply changes; keys are write-only.",
      groupData: "Data",
      groupLlm: "Memory extraction model",
      groupEmbedding: "Memory search embeddings",
      groupCapture: "Capture",
      groupExtraction: "Extraction",
      groupRecall: "Recall",
      groupTools: "Tools",
      fieldDataDir: "Data dir (empty = ~/.memory-tencentdb/memory-tdai)",
      fieldLlmBaseUrl: "Base URL",
      fieldLlmApiKey: "API Key",
      fieldLlmModel: "Model",
      fieldLlmMaxTokens: "Max output tokens",
      fieldLlmTimeoutMs: "Timeout (ms)",
      fieldLlmSendSessionHeader: "Send session-id header (x-opencode-session)",
      fieldLlmSessionHeaderName: "Session-id header name",
      fieldLlmSessionId: "Fixed session id (empty = persistent auto)",
      hintLlmSendSessionHeader: "OpenCode Go and similar gateways require a stable session id on every LLM request; requests without it may error (from 2026-09-06). Value: the fixed id below, else a persistent per-instance id stored under the data dir.",
      hintLlmSessionId: "Fixed session id for background extraction requests; leave empty for a persistent auto id under the data dir (survives restarts).",
      fieldEmbeddingBaseUrl: "Base URL",
      fieldEmbeddingApiKey: "API Key",
      fieldEmbeddingModel: "Model",
      fieldEmbeddingDimensions: "Vector dimensions",
      fieldEmbeddingSendDimensions: "Send dimensions with requests",
      fieldCaptureEnabled: "Capture conversations (L0)",
      fieldExtractionEnabled: "Structured extraction (L1)",
      fieldExtractionEnableDedup: "Conflict detection (extra LLM call)",
      fieldRecallEnabled: "Recall injection",
      fieldRecallMaxResults: "Max recall results",
      fieldRecallScoreThreshold: "Similarity threshold",
      fieldRecallTimeoutMs: "Recall timeout (ms)",
      fieldToolsEnabled: "Register search tools (tdai_memory_search / tdai_conversation_search)",
      secretHint: "Leave blank to keep the current key.",
      save: "Save",
      reset: "Reset",
      saved: "Saved (applies after restart)",
      saving: "Saving…",
      error: "Save failed",
      notApplied: "Write did not take effect; check the configuration and retry",
      unavailable: "Settings namespace unavailable (tdai-memory namespace not registered server-side?)",
      overridden: "overridden",
      loading: "Loading…"
    };

    // ── field spec: dotted path + type + group ─────────────────────────────
    var FIELDS = [
      { path: ["dataDir"], label: "fieldDataDir", type: "text", group: "groupData" },
      { path: ["llm", "baseUrl"], label: "fieldLlmBaseUrl", type: "text", group: "groupLlm" },
      { path: ["llm", "apiKey"], label: "fieldLlmApiKey", type: "password", secret: true, group: "groupLlm" },
      { path: ["llm", "model"], label: "fieldLlmModel", type: "text", group: "groupLlm" },
      { path: ["llm", "maxTokens"], label: "fieldLlmMaxTokens", type: "number", group: "groupLlm" },
      { path: ["llm", "timeoutMs"], label: "fieldLlmTimeoutMs", type: "number", group: "groupLlm" },
      { path: ["llm", "sendSessionHeader"], label: "fieldLlmSendSessionHeader", type: "checkbox", group: "groupLlm" },
      { path: ["llm", "sessionHeaderName"], label: "fieldLlmSessionHeaderName", type: "text", group: "groupLlm" },
      { path: ["llm", "sessionId"], label: "fieldLlmSessionId", type: "text", group: "groupLlm" },
      { path: ["embedding", "baseUrl"], label: "fieldEmbeddingBaseUrl", type: "text", group: "groupEmbedding" },
      { path: ["embedding", "apiKey"], label: "fieldEmbeddingApiKey", type: "password", secret: true, group: "groupEmbedding" },
      { path: ["embedding", "model"], label: "fieldEmbeddingModel", type: "text", group: "groupEmbedding" },
      { path: ["embedding", "dimensions"], label: "fieldEmbeddingDimensions", type: "number", group: "groupEmbedding" },
      { path: ["embedding", "sendDimensions"], label: "fieldEmbeddingSendDimensions", type: "checkbox", group: "groupEmbedding" },
      { path: ["captureEnabled"], label: "fieldCaptureEnabled", type: "checkbox", group: "groupCapture" },
      { path: ["extraction", "enabled"], label: "fieldExtractionEnabled", type: "checkbox", group: "groupExtraction" },
      { path: ["extraction", "enableDedup"], label: "fieldExtractionEnableDedup", type: "checkbox", group: "groupExtraction" },
      { path: ["recall", "enabled"], label: "fieldRecallEnabled", type: "checkbox", group: "groupRecall" },
      { path: ["recall", "maxResults"], label: "fieldRecallMaxResults", type: "number", group: "groupRecall" },
      { path: ["recall", "scoreThreshold"], label: "fieldRecallScoreThreshold", type: "number", group: "groupRecall" },
      { path: ["recall", "timeoutMs"], label: "fieldRecallTimeoutMs", type: "number", group: "groupRecall" },
      { path: ["toolsEnabled"], label: "fieldToolsEnabled", type: "checkbox", group: "groupTools" }
    ];
    FIELDS.forEach(function (f) { f.key = f.path.join("."); });
    var BASIC_KEYS = ["llm.baseUrl", "llm.apiKey", "llm.model", "embedding.baseUrl", "embedding.apiKey", "embedding.model"];
    var MODE_KEYS = ["captureEnabled", "extraction.enabled", "recall.enabled", "toolsEnabled"];
    var MODES = { auto: [true, true, true, true], search: [false, false, false, true], paused: [false, false, false, false] };

    function getPath(obj, path) {
      var cur = obj;
      for (var i = 0; i < path.length; i += 1) {
        if (cur === null || cur === void 0 || typeof cur !== "object") return void 0;
        cur = cur[path[i]];
      }
      return cur;
    }

    function MemorySection(props) {
      useLocale(props.locale);
      var t = props.t;
      var scope = props.scope;
      var [snapshot, setSnapshot] = react.useState(function () { return scope.getSnapshot(); });
      var ready = snapshot.status === "ready" && snapshot.value !== void 0;
      var [draft, setDraft] = react.useState({});
      var [busy, setBusy] = react.useState(false);
      var [notice, setNotice] = react.useState(null);
      var [error, setError] = react.useState(null);

      react.useEffect(function () {
        // No refresh call: the scope's public seam has no load() — reads ride the
        // shared describe mirror, which re-reads on every Host
        // `settings/document-updated`. The guarded scope.load() that used to sit
        // here was dead code that read like a refresh that never happened.
        var alive = true;
        var sync = function () { if (alive) setSnapshot(scope.getSnapshot()); };
        var un = typeof scope.subscribe === "function" ? scope.subscribe(sync) : null;
        // The settings scope is bound once for this plugin and shared across
        // every mount of the section. Unmounting must only unsubscribe — never
        // dispose the scope, or a later remount derives from a frozen (stopped)
        // scope and shows stale values on the next describe.
        return function () { alive = false; if (un) un(); };
      }, [scope]);
      // Initialize the draft ONLY when the snapshot becomes ready — never on
      // value churn. settingsScope.getSnapshot() returns a fresh object per
      // call, so depending on snapshot.value would reset user input on every
      // render (typing appears dead).
      react.useEffect(function () {
        if (ready) setDraft({});
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [ready]);

      if (snapshot.status === "unavailable") {
        return h("p", { className: "__tm_unavailable" }, t("unavailable"));
      }
      if (!ready) return h("p", { className: "__tm_status" }, t("loading"));

      var value = snapshot.value;
      var user = snapshot.user || {};

      function fieldDraft(f) {
        if (f.secret) return draft[f.key] || "";
        if (f.type === "checkbox") return draft[f.key] !== void 0 ? draft[f.key] : Boolean(getPath(value, f.path));
        return draft[f.key] !== void 0 ? draft[f.key] : String(getPath(value, f.path) ?? "");
      }
      function setField(f, v) {
        setDraft(function (prev) { var next = Object.assign({}, prev); next[f.key] = v; return next; });
        setNotice(null);
        setError(null);
      }
      function memoryMode() {
        var flags = MODE_KEYS.map(function (key) {
          return Object.prototype.hasOwnProperty.call(draft, key) ? draft[key] : getPath(value, key.split(".")) !== false;
        });
        return Object.keys(MODES).find(function (mode) {
          return MODES[mode].every(function (flag, i) { return flag === flags[i]; });
        }) || "custom";
      }
      function setMode(mode) {
        if (!MODES[mode] || busy || !snapshot.writable) return;
        setDraft(function (prev) {
          var next = Object.assign({}, prev);
          MODE_KEYS.forEach(function (key, i) { next[key] = MODES[mode][i]; });
          return next;
        });
        setNotice(null); setError(null);
      }

      function onSave() {
        if (busy || !snapshot.writable) return;
        setBusy(true); setNotice(null); setError(null);
        var ops = [];
        for (var i = 0; i < FIELDS.length; i += 1) {
          var f = FIELDS[i];
          if (!Object.prototype.hasOwnProperty.call(draft, f.key)) continue;
          var d = fieldDraft(f);
          var current = getPath(value, f.path);
          if (f.type === "password") {
            if (!d) continue; // blank keeps the current key
            if (d === String(current ?? "")) continue;
            ops.push({ op: "set", path: f.path, value: d });
            continue;
          }
          if (f.type === "checkbox") {
            if (Boolean(d) === Boolean(current)) continue;
            ops.push({ op: "set", path: f.path, value: Boolean(d) });
            continue;
          }
          if (String(d) === String(current ?? "")) continue;
          if (String(d).trim() === "" && getPath(user, f.path) === void 0) continue;
          ops.push(String(d).trim() === "" ? { op: "unset", path: f.path } : { op: "set", path: f.path, value: f.type === "number" ? Number(d) : d });
        }
        if (ops.length === 0) { setBusy(false); setNotice({ key: "saved" }); return; }
        commit(ops);
      }

      function onReset() {
        if (busy || !snapshot.writable) return;
        setBusy(true); setNotice(null); setError(null);
        commit(FIELDS.map(function (f) { return { op: "unset", path: f.path }; }));
      }

      function commit(ops) {
        // The form owns the transport and the recovery read. A refused Host
        // write resolves false; it must not be displayed as a successful save.
        Promise.resolve().then(function () {
          return scope.mutate(ops, snapshot.revision);
        }).then(function (ok) {
          var next = scope.getSnapshot();
          setSnapshot(next);
          setBusy(false);
          if (!ok) { setError({ key: "error", detailKey: "notApplied" }); return; }
          setNotice({ key: "saved" });
          if (next.value) setDraft({});
        }).catch(function (e) {
          setBusy(false); setError({ key: "error", detail: String(e && e.message || e) });
        });
      }

      var nodes = [], advancedNodes = [];
      var lastGroups = { basic: null, advanced: null };
      // forEach callback gives each handler its own `f` — a `for (var i)`
      // loop would share one `f` across every onChange closure, so typing
      // updated the LAST field's draft and the input appeared dead.
      FIELDS.forEach(function (f) {
        var section = BASIC_KEYS.indexOf(f.key) !== -1 ? "basic" : "advanced";
        var target = section === "basic" ? nodes : advancedNodes;
        if (f.group !== lastGroups[section]) {
          lastGroups[section] = f.group;
          target.push(h("div", { key: "g" + f.group, className: "__tm_group" }, t(f.group)));
        }
        var overridden = getPath(user, f.path) !== void 0;
        if (f.type === "checkbox") {
          target.push(h("label", { key: f.path.join("."), className: "__tm_field" },
            h("span", { className: "__tm_row" },
              h("input", { className: "__tm_check", type: "checkbox", disabled: busy || !snapshot.writable, checked: Boolean(fieldDraft(f)), onChange: function (e) { setField(f, e.target.checked); } }),
              h("span", { className: "__tm_label" }, t(f.label)),
              overridden ? h("span", { className: "__tm_override" }, t("overridden")) : null
            )
          ));
          return;
        }
        target.push(h("label", { key: f.path.join("."), className: "__tm_field" },
          h("span", { className: "__tm_label" },
            t(f.label),
            overridden ? h("span", { className: "__tm_override" }, t("overridden")) : null
          ),
          h("input", {
            className: "__tm_input",
            type: f.type === "password" ? "password" : f.type === "number" ? "number" : "text",
            value: fieldDraft(f),
            disabled: busy || !snapshot.writable,
            placeholder: f.type === "password" ? (overridden ? "••••••••" : t("secretHint")) : "",
            onChange: function (e) { setField(f, e.target.value); }
          }),
          f.type === "password" ? h("span", { className: "__tm_hint" }, t("secretHint")) : null
        ));
      });

      return h("div", { className: "__tm_root dsh-flat" },
        h("p", { className: "__tm_hint", style: { margin: "0 0 4px" } }, t("intro")),
        h("label", { className: "__tm_field" },
          h("span", { className: "__tm_label" }, t("mode")),
          h("select", { className: "__tm_input", "aria-label": t("mode"), value: memoryMode(), disabled: busy || !snapshot.writable,
            onChange: function (e) { setMode(e.target.value); } },
            h("option", { value: "auto" }, t("modeAuto")), h("option", { value: "search" }, t("modeSearch")),
            h("option", { value: "paused" }, t("modePaused")), h("option", { value: "custom", disabled: true }, t("modeCustom"))),
          h("span", { className: "__tm_hint" }, t("modeHint"))),
        h("p", { className: "__tm_hint" }, t("setupHint")),
        nodes,
        h("details", null, h("summary", { style: { cursor: "pointer" } }, t("advanced")),
          h("div", { style: { display: "flex", flexDirection: "column", gap: 10, paddingTop: 12 } }, advancedNodes)),
        h("div", { className: "__tm_actions" },
          h("button", { type: "button", className: "__tm_btn __tm_btnPrimary", onClick: onSave, disabled: busy || !snapshot.writable }, t("save")),
          h("button", { type: "button", className: "__tm_btn", onClick: onReset, disabled: busy || !snapshot.writable }, t("reset")),
          notice ? h("span", { className: "__tm_status" }, messageText(t, notice)) : null,
          busy ? h("span", { className: "__tm_status" }, t("saving")) : null,
          error ? h("span", { className: "__tm_error" }, messageText(t, error)) : null
        )
      );
    }

    // ── plugin ────────────────────────────────────────────────────────────

    // Follow the host language without remounting the form or losing drafts.
    function useLocale(locale) {
      var refresh = react.useState(0)[1];
      react.useEffect(function () {
        if (!locale || typeof locale.subscribe !== "function") return;
        return locale.subscribe(function () { refresh(function (revision) { return revision + 1; }); });
      }, [locale]);
    }
    // Keep translation keys in state so feedback follows later language changes.
    function messageText(t, message) {
      if (!message) return "";
      return t(message.key) + (message.detailKey ? ": " + t(message.detailKey) : message.detail ? ": " + message.detail : "");
    }

    function apply(ctx) {
      var t = ctx.locale.bind(NS);
      ctx.effect(function () { return ctx.locale.register(NS, { zh: zh, en: en }); }, "dsh-tdai-memory: dictionaries");
      var scope = ctx.configForms.get("tdai-memory");
      ctx.slots.inject("plugins.bundle.config", function () {
        return ctx.slots.register({
          name: "plugins.bundle.config",
          key: "dsh-tdai-memory",
          locale: NS
        }, function (props) {
          return h(MemorySection, Object.assign({}, props, { scope: scope, t: t, locale: ctx.locale }));
        });
      });
    }

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  }
});

