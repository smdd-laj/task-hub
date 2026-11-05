(() => {
  // ../task-roster/node_modules/@openchamber/sdk/dist/api-version.js
  var OPENCHAMBER_SDK_CHANNEL = "openchamber.sdk";
  var OPENCHAMBER_SDK_API_VERSION = 1;

  // ../task-roster/node_modules/@openchamber/sdk/dist/scrollbar-style.js
  var GUEST_SCROLLING_ATTRIBUTE = "data-oc-scrolling";
  var GUEST_SCROLLBAR_CSS = `
:root {
  /* Quiet at rest like the app's own thumbs; hover gives a clear grab target. */
  --oc-scrollbar-thumb: color-mix(in srgb, var(--oc-muted, currentColor) 18%, transparent);
  --oc-scrollbar-thumb-hover: color-mix(in srgb, var(--oc-muted, currentColor) 36%, transparent);
  scrollbar-gutter: stable;
}
* {
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}
:hover, [${GUEST_SCROLLING_ATTRIBUTE}] {
  scrollbar-color: var(--oc-scrollbar-thumb) transparent;
}
/* Chromium's standard scrollbar properties otherwise override its pseudo-elements. */
@supports selector(::-webkit-scrollbar) {
  *, :hover, [${GUEST_SCROLLING_ATTRIBUTE}] { scrollbar-width: auto; scrollbar-color: auto; }
  ::-webkit-scrollbar { width: 6px; height: 6px; background: transparent; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 999px;
    min-width: 24px;
    min-height: 24px;
  }
  :hover::-webkit-scrollbar-thumb, [${GUEST_SCROLLING_ATTRIBUTE}]::-webkit-scrollbar-thumb { background: var(--oc-scrollbar-thumb); }
  ::-webkit-scrollbar-thumb:hover { background: var(--oc-scrollbar-thumb-hover); }
  ::-webkit-scrollbar-corner { background: transparent; }
  ::-webkit-scrollbar-button { display: none; width: 0; height: 0; }
}
@media (forced-colors: active) {
  *, :hover, [${GUEST_SCROLLING_ATTRIBUTE}] { scrollbar-color: auto; }
  ::-webkit-scrollbar-thumb, ::-webkit-scrollbar-thumb:hover { background: CanvasText; }
}
`;
  function installGuestScrollbarActivity(doc) {
    const root = doc.documentElement;
    if (root.hasAttribute("data-oc-scrollbar-activity"))
      return;
    root.setAttribute("data-oc-scrollbar-activity", "");
    const timers = /* @__PURE__ */ new WeakMap();
    doc.addEventListener("scroll", (event) => {
      const target = event.target === doc ? root : event.target;
      if (!(target instanceof Element))
        return;
      if (!target.hasAttribute("data-oc-scrolling"))
        target.setAttribute("data-oc-scrolling", "");
      const pending = timers.get(target);
      if (pending !== void 0)
        clearTimeout(pending);
      timers.set(target, setTimeout(() => {
        timers.delete(target);
        target.removeAttribute("data-oc-scrolling");
      }, 1e3));
    }, { capture: true, passive: true });
  }
  var GUEST_SCROLLBAR_SCRIPT = `(${installGuestScrollbarActivity.toString()})(document);`;

  // ../task-roster/node_modules/@openchamber/sdk/dist/workspace.js
  var GUEST_STORAGE_KEY_MAX = 128;
  var GUEST_STORAGE_VALUE_BYTES = 65536;

  // ../task-roster/node_modules/@openchamber/sdk/dist/shells.js
  var GUEST_SHELL_ID_MAX = 128;
  var GUEST_SHELL_OUTPUT_TAIL_MAX = 65536;

  // ../task-roster/node_modules/@openchamber/sdk/dist/status-controls.js
  var GUEST_STATUS_CONTROLS_MAX = 4;
  var GUEST_STATUS_CONTROL_ID = /^[a-z][a-z0-9-]{0,39}$/;
  var GUEST_STATUS_CONTROL_LABEL_MAX = 60;
  var GUEST_STATUS_CONTROL_OPTIONS_MAX = 16;
  var GUEST_STATUS_CONTROL_VALUE_MAX = 80;
  var isControlObject = (value) => Object(value) === value && !Array.isArray(value);
  var hasOnlyKeys = (value, keys) => Object.keys(value).every((key) => keys.includes(key));
  var isLabel = (value) => String(value) === value && value.length >= 1 && value.length <= GUEST_STATUS_CONTROL_LABEL_MAX;
  var isValue = (value) => String(value) === value && value.length >= 1 && value.length <= GUEST_STATUS_CONTROL_VALUE_MAX;
  var isGuestStatusControls = (controls) => {
    if (!Array.isArray(controls) || controls.length > GUEST_STATUS_CONTROLS_MAX)
      return false;
    const ids = /* @__PURE__ */ new Set();
    for (const control of controls) {
      if (!isControlObject(control) || !GUEST_STATUS_CONTROL_ID.test(control.id) || !isLabel(control.label))
        return false;
      if (control.disabled !== void 0 && control.disabled !== true && control.disabled !== false)
        return false;
      if (ids.has(control.id))
        return false;
      ids.add(control.id);
      if (control.kind === "button") {
        if (!hasOnlyKeys(control, ["kind", "id", "label", "disabled"]))
          return false;
        continue;
      }
      if (control.kind !== "select" || !hasOnlyKeys(control, ["kind", "id", "label", "value", "options", "disabled"]))
        return false;
      if (!isValue(control.value) || !Array.isArray(control.options) || control.options.length < 1 || control.options.length > GUEST_STATUS_CONTROL_OPTIONS_MAX)
        return false;
      const values = /* @__PURE__ */ new Set();
      for (const option of control.options) {
        if (!isControlObject(option) || !hasOnlyKeys(option, ["value", "label"]) || !isValue(option.value) || !isLabel(option.label) || values.has(option.value))
          return false;
        values.add(option.value);
      }
      if (!values.has(control.value))
        return false;
    }
    return true;
  };

  // ../task-roster/node_modules/@openchamber/sdk/dist/file-editor.js
  var GUEST_FILE_EDITOR_CONTENT_MAX = 2e7;
  var GUEST_FILE_EDITOR_VERSION_MAX = 256;
  var fileEditorPayloadSize = (value) => "bytes" in value ? value.bytes.byteLength : value.content.length;
  var sameFileEditorDocument = (left, right) => {
    if (left.path !== right.path || left.readOnly !== right.readOnly)
      return false;
    if (left.encoding === "text" || right.encoding === "text") {
      return left.encoding === "text" && right.encoding === "text" && left.content === right.content;
    }
    if (left.bytes.byteLength !== right.bytes.byteLength)
      return false;
    for (let index = 0; index < left.bytes.byteLength; index += 1) {
      if (left.bytes[index] !== right.bytes[index])
        return false;
    }
    return true;
  };

  // ../task-roster/node_modules/@openchamber/sdk/dist/popover.js
  var GUEST_POPOVER_ID = /^[A-Za-z0-9_-]{1,80}$/;
  var GUEST_POPOVER_COORDINATE_MAX = 1e5;
  var GUEST_POPOVER_WIDTH_MIN = 160;
  var GUEST_POPOVER_WIDTH_MAX = 640;
  var GUEST_POPOVER_HEIGHT_MIN = 48;
  var GUEST_POPOVER_HEIGHT_MAX = 480;
  var GUEST_POPOVER_DATA_MAX = 16e3;
  var GUEST_POPOVER_DATA_DEPTH_MAX = 32;
  var GUEST_POPOVER_SIDES = ["left", "right", "top", "bottom"];
  var hasBoundedJsonTree = (value, depth = 0, budget = { remaining: GUEST_POPOVER_DATA_MAX }) => {
    if (--budget.remaining < 0 || depth >= GUEST_POPOVER_DATA_DEPTH_MAX)
      return false;
    if (value === null)
      return true;
    const children = Array.isArray(value) ? value : Object(value) === value ? Object.values(value) : [];
    for (const item of children) {
      if (!hasBoundedJsonTree(item, depth + 1, budget))
        return false;
    }
    return true;
  };
  var isFiniteJson = (value) => {
    if (value === null || value === true || value === false)
      return true;
    if (Array.isArray(value))
      return Object.keys(value).every((key) => /^(0|[1-9]\d*)$/.test(key) && Number(key) < value.length) && value.every(isFiniteJson);
    if (Object(value) === value) {
      const prototype = Object.getPrototypeOf(value);
      return (prototype === null || prototype === Object.prototype) && Object.values(value).every(isFiniteJson);
    }
    return String(value) === value || Number.isFinite(value);
  };
  var isGuestPopoverRequest = (request) => {
    try {
      if (String(request.id) !== request.id || !GUEST_POPOVER_ID.test(request.id) || !Number.isFinite(request.anchor.x) || Math.abs(request.anchor.x) > GUEST_POPOVER_COORDINATE_MAX || !Number.isFinite(request.anchor.y) || Math.abs(request.anchor.y) > GUEST_POPOVER_COORDINATE_MAX || !Number.isFinite(request.anchor.width) || !Number.isFinite(request.anchor.height) || request.anchor.width <= 0 || request.anchor.height <= 0 || request.anchor.width > GUEST_POPOVER_COORDINATE_MAX || request.anchor.height > GUEST_POPOVER_COORDINATE_MAX || !Number.isInteger(request.width) || request.width < GUEST_POPOVER_WIDTH_MIN || request.width > GUEST_POPOVER_WIDTH_MAX || !Number.isInteger(request.height) || request.height < GUEST_POPOVER_HEIGHT_MIN || request.height > GUEST_POPOVER_HEIGHT_MAX || request.side !== void 0 && !GUEST_POPOVER_SIDES.includes(request.side) || request.focus !== void 0 && request.focus !== true && request.focus !== false || !hasBoundedJsonTree(request.data) || !isFiniteJson(request.data))
        return false;
      return JSON.stringify(request.data).length <= GUEST_POPOVER_DATA_MAX;
    } catch {
      return false;
    }
  };

  // ../task-roster/node_modules/@openchamber/sdk/dist/contract.js
  var GUEST_FILE_STAT_KINDS = ["file", "directory", "other", "missing"];
  var isStartSessionResult = (value) => Boolean(value && "sessionId" in value);
  var isPromptResult = (value) => Boolean(value && "sent" in value && !("sessionId" in value));
  var GUEST_COMMIT_SHA = /^[0-9a-f]{7,64}$/i;
  var isGuestCommitSha = (value) => GUEST_COMMIT_SHA.test(value);
  var GUEST_TOAST_MAX = 500;
  var GUEST_CLIPBOARD_TEXT_MAX = 32e3;
  var GUEST_COMPOSE_TEXT_MAX = 16e3;
  var GUEST_ATTACH_ID_MAX = 128;
  var GUEST_ATTACH_TITLE_MAX = 200;
  var GUEST_ATTACH_URL_MAX = 2e3;
  var GUEST_ATTACH_TEXT_MAX = 16e3;
  var GUEST_ATTACH_AUTHOR_MAX = 80;
  var GUEST_ATTACH_BRANCH_MAX = 200;
  var GUEST_ATTACH_DATA_MAX = 16e3;
  var GUEST_REQUEST_PATH_MAX = 2e3;
  var GUEST_REQUEST_TIMEOUT_MS = 2e4;
  var GUEST_FILE_PATH_MAX = 1024;
  var GUEST_FILE_CONTENT_MAX = 2e6;
  var GUEST_GENERATE_PROMPT_MAX = 64e3;
  var GUEST_GENERATE_SYSTEM_MAX = 8e3;
  var GUEST_GENERATE_OUTPUT_TOKENS_MAX = 4e3;
  var GUEST_GENERATE_TIMEOUT_MS = 96e4;
  var GUEST_GENERATE_LATE_KEEP_MS = 60 * 6e4;
  var GUEST_BADGE_MAX = 999;
  var GUEST_FRAME_HEIGHT_MAX = 1e4;
  var GUEST_RESOLVE_ERROR_MAX = 500;
  var HOST_REQUEST_ERROR_CODES = [
    "HOST_UNAVAILABLE",
    "HOST_TIMEOUT",
    "HOST_REJECTED",
    "DISCONNECTED",
    "DISABLED",
    "BAD_PATH",
    "NO_INTEGRATION",
    "NO_SERVICE",
    "SERVICE_FAILED",
    "REQUEST_FAILED",
    "RESPONSE_TOO_LARGE",
    "NO_SESSION",
    "SESSION_BUSY",
    "NOT_GRANTED",
    "NO_DIRECTORY",
    "NOT_FOUND",
    "FILE_TOO_LARGE",
    "DENIED",
    "NO_MODEL",
    "MODEL_FAILED",
    "UNSUPPORTED"
  ];
  var SERVICE_STATUS_VALUES = ["stopped", "starting", "ready", "failed"];
  var hostRequestErrorCodeSet = new Set(HOST_REQUEST_ERROR_CODES);
  var isHostRequestErrorCode = (value) => hostRequestErrorCodeSet.has(value);
  var resolveHostRequestErrorCode = (value) => value && isHostRequestErrorCode(value) ? value : "HOST_REJECTED";
  var isJsonValue = (value) => {
    if (value === void 0)
      return false;
    if (value === null || value === true || value === false)
      return true;
    if (String(value) === value)
      return true;
    if (Number(value) === value)
      return Number.isFinite(value);
    if (Array.isArray(value))
      return value.every(isJsonValue);
    if (Object(value) === value)
      return Object.values(value).every(isJsonValue);
    return false;
  };
  var isAttachData = (value) => isJsonValue(value) && JSON.stringify(value).length <= GUEST_ATTACH_DATA_MAX;
  var clampBranch = (value) => value?.trim().slice(0, GUEST_ATTACH_BRANCH_MAX) ?? "";
  var clampAttachRequest = (request) => {
    const id = request.id.trim().slice(0, GUEST_ATTACH_ID_MAX);
    const title = request.title.trim().slice(0, GUEST_ATTACH_TITLE_MAX);
    const url = request.url.trim().slice(0, GUEST_ATTACH_URL_MAX);
    const text = request.text?.trim().slice(0, GUEST_ATTACH_TEXT_MAX);
    const author = request.author?.trim().slice(0, GUEST_ATTACH_AUTHOR_MAX);
    const kind = request.kind === "pull" ? "pull" : "issue";
    const next = {
      providerId: request.providerId.trim(),
      id,
      title: title || id,
      url,
      kind
    };
    if (text) {
      next.text = text;
    }
    if (author) {
      next.author = author;
    }
    if (kind === "pull") {
      const head = clampBranch(request.branches?.head);
      const base = clampBranch(request.branches?.base);
      if (head && base) {
        next.branches = { head, base };
      }
    }
    if (isAttachData(request.data)) {
      next.data = request.data;
    }
    return next;
  };
  var clampStartSessionRequest = (request) => {
    const next = clampAttachRequest(request);
    if (request.projectId)
      next.projectId = request.projectId;
    if (request.navigation)
      next.navigation = request.navigation;
    if (request.worktree) {
      next.worktree = request.worktree;
    }
    return next;
  };
  var clampPromptRequest = (request) => {
    const next = {
      text: request.text.trim().slice(0, GUEST_COMPOSE_TEXT_MAX)
    };
    if (request.send) {
      next.send = true;
    }
    return next;
  };
  var clampBadgeCount = (count) => {
    if (count === null || !Number.isFinite(count))
      return null;
    return Math.min(GUEST_BADGE_MAX, Math.max(0, Math.round(count)));
  };
  var clampFrameHeight = (height) => {
    if (!Number.isFinite(height))
      return 0;
    return Math.min(GUEST_FRAME_HEIGHT_MAX, Math.max(0, Math.ceil(height)));
  };
  var isGuestFilePath = (value) => value.length > 0 && value.length <= GUEST_FILE_PATH_MAX && !value.includes("\0") && !value.includes("\\");
  var isGuestRequestPath = (value) => {
    if (!value.startsWith("/") || value.includes("\0") || value.includes("\\") || value.includes("://")) {
      return false;
    }
    if (value.length > GUEST_REQUEST_PATH_MAX) {
      return false;
    }
    const segments = value.split("/");
    return !segments.some((segment) => segment === "." || segment === "..");
  };
  var serviceStatusSet = new Set(SERVICE_STATUS_VALUES);
  var isServiceStatusResult = (value) => Boolean(value && "status" in value && serviceStatusSet.has(String(value.status)) && !("body" in value));
  var isGuestRequestResult = (value) => Boolean(value && "status" in value && "body" in value && Number.isInteger(value.status));
  var isFileReadResult = (value) => Boolean(value && "content" in value && String(value.content) === value.content);
  var isFileWriteResult = (value) => Boolean(value && "written" in value && value.written === true);
  var isFileListResult = (value) => Boolean(value && "entries" in value && Array.isArray(value.entries));
  var fileStatKindSet = new Set(GUEST_FILE_STAT_KINDS);
  var isFileStatResult = (value) => Boolean(value && "kind" in value && "size" in value && fileStatKindSet.has(String(value.kind)) && Number.isFinite(value.size));
  var isGenerateResult = (value) => Boolean(value && "text" in value && String(value.text) === value.text && !("status" in value));
  var HOST_PUSH_TYPES = /* @__PURE__ */ new Set([
    "workspace",
    "shells",
    "ready",
    "directory",
    "session",
    "connection",
    "settings",
    "session-lifecycle",
    "item",
    "resolve",
    "action",
    "status-control-event",
    "popover-closed",
    "file-open",
    "file-snapshot",
    "file-saved",
    "generate-late"
  ]);
  var asWireRecord = (data) => Object(data) === data ? data : null;
  var isNonEmptyString = (value) => String(value) === value && value.length > 0;
  var readResultMessage = (wire) => {
    if (!isNonEmptyString(wire.id))
      return null;
    if (wire.ok === true) {
      const message = {
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "result",
        id: wire.id,
        ok: true
      };
      if (Object(wire.payload) === wire.payload) {
        message.payload = wire.payload;
      }
      return message;
    }
    if (wire.ok === false && isNonEmptyString(wire.error)) {
      return {
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "result",
        id: wire.id,
        ok: false,
        error: wire.error,
        code: resolveHostRequestErrorCode(isNonEmptyString(wire.code) ? wire.code : void 0)
      };
    }
    return null;
  };
  var readHostMessage = (data) => {
    const wire = asWireRecord(data);
    if (!wire || wire.channel !== OPENCHAMBER_SDK_CHANNEL || wire.v !== OPENCHAMBER_SDK_API_VERSION)
      return null;
    if (wire.type === "result")
      return readResultMessage(wire);
    if (!HOST_PUSH_TYPES.has(String(wire.type)) || Object(wire.payload) !== wire.payload)
      return null;
    return wire;
  };

  // ../task-roster/node_modules/@openchamber/sdk/dist/host.js
  var isKeyEvent = (event) => "key" in event && "metaKey" in event && "ctrlKey" in event;
  var isSaveShortcut = (event) => (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === "s";
  var HostRequestError = class extends Error {
    code;
    constructor(code, message) {
      super(message);
      this.name = "HostRequestError";
      this.code = code;
    }
  };
  var rejectBadPath = () => Promise.reject(new HostRequestError("BAD_PATH", 'Request path must start with "/" and stay on the declared origin.'));
  var rejectBadFilePath = () => Promise.reject(new HostRequestError("BAD_PATH", `File path must be 1 to ${GUEST_FILE_PATH_MAX} characters without NUL or backslash.`));
  var deviceStorageScope = (options) => {
    if (options === void 0)
      return void 0;
    if (Object(options) !== options || Array.isArray(options) || options.scope !== void 0 && options.scope !== "instance" && options.scope !== "device") {
      throw new HostRequestError("HOST_REJECTED", 'Storage scope must be "instance" or "device".');
    }
    return options.scope === "device" ? "device" : void 0;
  };
  var nextId = (n) => {
    n.value += 1;
    return `oc-${n.value}`;
  };
  var connectHost = (options = {}) => {
    const target = options.target ?? ("window" in globalThis ? window : null);
    if (!target) {
      throw new HostRequestError("HOST_UNAVAILABLE", "No window. connectHost runs in a browser frame.");
    }
    const acceptSource = options.acceptSource ?? ((source) => source === target.parent);
    const requestTimeoutMs = options.requestTimeoutMs ?? GUEST_REQUEST_TIMEOUT_MS;
    const readyListeners = /* @__PURE__ */ new Set();
    const directoryListeners = /* @__PURE__ */ new Set();
    const sessionListeners = /* @__PURE__ */ new Set();
    const lifecycleListeners = /* @__PURE__ */ new Set();
    const connectionListeners = /* @__PURE__ */ new Set();
    const settingsListeners = /* @__PURE__ */ new Set();
    const itemListeners = /* @__PURE__ */ new Set();
    const statusControlListeners = /* @__PURE__ */ new Set();
    const popoverClosedListeners = /* @__PURE__ */ new Set();
    const lateGenerateListeners = /* @__PURE__ */ new Set();
    const unclaimedLateGenerate = [];
    let resolveHandler = null;
    let actionHandler = null;
    const fileOpenListeners = /* @__PURE__ */ new Set();
    const fileSavedListeners = /* @__PURE__ */ new Set();
    let fileSnapshotHandler = null;
    let lastFile = null;
    let saveShortcutInstalled = false;
    const pending = /* @__PURE__ */ new Map();
    const workspaceListeners = /* @__PURE__ */ new Map();
    const shellsListeners = /* @__PURE__ */ new Map();
    let disposed = false;
    const ids = { value: 0 };
    let lastReady = null;
    let lastLifecycle = null;
    let popoverPointerActive = false;
    let popoverFocusActive = false;
    let popoverActivityReported = null;
    const lifecycleFromSession = (session) => {
      if (!session)
        return null;
      return {
        sessionId: session.id,
        phase: session.busy ? "started" : "completed"
      };
    };
    const post = (message) => {
      target.parent.postMessage(message, "*");
    };
    const listenForLateGenerate = () => {
      if (disposed || target.parent === target || lateGenerateListeners.size === 0 || lastReady?.features?.lateGenerateResults !== true)
        return;
      post({ channel: OPENCHAMBER_SDK_CHANNEL, v: OPENCHAMBER_SDK_API_VERSION, type: "generate-late-listen" });
    };
    const emit = (listeners, value) => {
      for (const listener of listeners) {
        try {
          listener(value);
        } catch (error) {
          console.error(error);
        }
      }
    };
    const onMessage = (event) => {
      if (!(event instanceof MessageEvent))
        return;
      if (!acceptSource(event.source))
        return;
      const message = readHostMessage(event.data);
      if (!message)
        return;
      if (message.type === "workspace") {
        const listener = workspaceListeners.get(message.payload.subscriptionId);
        if (listener)
          emit([listener], message.payload.snapshot);
        return;
      }
      if (message.type === "shells") {
        const listener = shellsListeners.get(message.payload.subscriptionId);
        if (listener)
          emit([listener], message.payload.snapshot);
        return;
      }
      if (message.type === "ready") {
        lastReady = message.payload;
        lastLifecycle = lifecycleFromSession(message.payload.session);
        emit(readyListeners, message.payload);
        emit(directoryListeners, message.payload.directory);
        emit(sessionListeners, message.payload.session);
        if (lastLifecycle) {
          emit(lifecycleListeners, lastLifecycle);
        }
        emit(connectionListeners, message.payload.connection);
        emit(settingsListeners, message.payload.settings);
        emit(itemListeners, message.payload.item);
        listenForLateGenerate();
        return;
      }
      if (message.type === "generate-late") {
        if (lateGenerateListeners.size === 0)
          unclaimedLateGenerate.push(message.payload);
        else
          emit(lateGenerateListeners, message.payload);
        return;
      }
      if (message.type === "directory") {
        if (lastReady) {
          lastReady = { ...lastReady, directory: message.payload.directory };
        }
        emit(directoryListeners, message.payload.directory);
        return;
      }
      if (message.type === "session") {
        if (lastReady) {
          lastReady = { ...lastReady, session: message.payload.session };
        }
        if (!message.payload.session) {
          lastLifecycle = null;
        } else if (lastLifecycle?.sessionId !== message.payload.session.id) {
          lastLifecycle = lifecycleFromSession(message.payload.session);
        }
        emit(sessionListeners, message.payload.session);
        return;
      }
      if (message.type === "session-lifecycle") {
        lastLifecycle = message.payload;
        emit(lifecycleListeners, message.payload);
        return;
      }
      if (message.type === "connection") {
        if (lastReady) {
          lastReady = { ...lastReady, connection: message.payload.connection };
        }
        emit(connectionListeners, message.payload.connection);
        return;
      }
      if (message.type === "settings") {
        if (lastReady) {
          lastReady = { ...lastReady, settings: message.payload.settings };
        }
        emit(settingsListeners, message.payload.settings);
        return;
      }
      if (message.type === "item") {
        if (lastReady) {
          lastReady = { ...lastReady, item: message.payload.item };
        }
        emit(itemListeners, message.payload.item);
        return;
      }
      if (message.type === "status-control-event") {
        emit(statusControlListeners, message.payload);
        return;
      }
      if (message.type === "popover-closed") {
        emit(popoverClosedListeners, message.payload);
        return;
      }
      if (message.type === "action") {
        const answer = (payload) => {
          if (!disposed)
            post({
              channel: OPENCHAMBER_SDK_CHANNEL,
              v: OPENCHAMBER_SDK_API_VERSION,
              type: "action-result",
              id: message.id,
              payload
            });
        };
        const handler = actionHandler;
        if (!handler) {
          answer({ ok: false, error: "This extension does not handle background actions." });
          return;
        }
        Promise.resolve().then(() => handler(message.payload)).then(() => answer({ ok: true }), (error) => {
          const text = (error instanceof Error ? error.message : String(error)).trim();
          answer({ ok: false, error: (text || "Action failed.").slice(0, GUEST_RESOLVE_ERROR_MAX) });
        });
        return;
      }
      if (message.type === "file-open") {
        const next = message.payload;
        if (lastFile && sameFileEditorDocument(lastFile, next))
          return;
        lastFile = next;
        emit(fileOpenListeners, message.payload);
        return;
      }
      if (message.type === "file-saved") {
        emit(fileSavedListeners, message.payload.version);
        return;
      }
      if (message.type === "file-snapshot") {
        const answer = (payload) => {
          if (!disposed)
            post({
              channel: OPENCHAMBER_SDK_CHANNEL,
              v: OPENCHAMBER_SDK_API_VERSION,
              type: "file-snapshot-result",
              id: message.id,
              payload
            });
        };
        const fail = (text) => answer({ error: (text.trim() || "Could not read the edited file.").slice(0, GUEST_RESOLVE_ERROR_MAX) });
        const handler = fileSnapshotHandler;
        if (!handler) {
          fail("This extension does not edit files.");
          return;
        }
        Promise.resolve().then(() => handler(message.payload.purpose)).then((snapshot) => {
          if (fileEditorPayloadSize(snapshot) > GUEST_FILE_EDITOR_CONTENT_MAX) {
            fail(`The file is over ${GUEST_FILE_EDITOR_CONTENT_MAX} ${"bytes" in snapshot ? "bytes" : "characters"}.`);
            return;
          }
          if (snapshot.version.length > GUEST_FILE_EDITOR_VERSION_MAX) {
            fail(`The snapshot version is over ${GUEST_FILE_EDITOR_VERSION_MAX} characters.`);
            return;
          }
          answer({ snapshot: "bytes" in snapshot ? { bytes: snapshot.bytes, version: snapshot.version } : { content: snapshot.content, version: snapshot.version } });
        }, (error) => fail(error instanceof Error ? error.message : String(error)));
        return;
      }
      if (message.type === "resolve") {
        const answer = (payload) => {
          post({
            channel: OPENCHAMBER_SDK_CHANNEL,
            v: OPENCHAMBER_SDK_API_VERSION,
            type: "resolve-result",
            id: message.id,
            payload
          });
        };
        const handler = resolveHandler;
        if (!handler) {
          answer({ error: "This extension does not resolve commands." });
          return;
        }
        Promise.resolve().then(() => handler(message.payload)).then((item) => answer({ item: item ? clampAttachRequest(item) : null }), (error) => {
          const text = (error instanceof Error ? error.message : String(error)).trim();
          answer({ error: (text || "Command failed.").slice(0, GUEST_RESOLVE_ERROR_MAX) });
        });
        return;
      }
      const waiter = pending.get(message.id);
      if (!waiter)
        return;
      clearTimeout(waiter.timer);
      pending.delete(message.id);
      if (message.ok) {
        waiter.resolve(message.payload);
        return;
      }
      waiter.reject(new HostRequestError(message.code, message.error));
    };
    target.addEventListener("message", onMessage);
    post({
      channel: OPENCHAMBER_SDK_CHANNEL,
      v: OPENCHAMBER_SDK_API_VERSION,
      type: "hello"
    });
    const send = (message, timeoutMs = requestTimeoutMs) => {
      if (disposed || target.parent === target) {
        return Promise.reject(new HostRequestError("HOST_UNAVAILABLE", "No host frame. This page is not in an iframe."));
      }
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(message.id);
          reject(new HostRequestError("HOST_TIMEOUT", "Host did not answer in time."));
        }, timeoutMs);
        pending.set(message.id, { resolve, reject, timer });
        post(message);
      });
    };
    const request = (message) => send(message).then(() => void 0);
    const envelope = { channel: OPENCHAMBER_SDK_CHANNEL, v: OPENCHAMBER_SDK_API_VERSION };
    const notify = (message) => {
      if (!disposed && target.parent !== target)
        post(message);
    };
    const requestFileSave = () => notify({ ...envelope, type: "file-save" });
    const onSaveShortcut = (event) => {
      if (!isKeyEvent(event) || !isSaveShortcut(event))
        return;
      event.preventDefault();
      requestFileSave();
    };
    const onPopoverEscape = (event) => {
      if (!isKeyEvent(event) || event.key !== "Escape" || lastReady?.surface !== "popover" || !lastReady.popover)
        return;
      event.preventDefault();
      void closePopover(lastReady.popover.id, "escape").catch(() => void 0);
    };
    const reportPopoverActivity = () => {
      const popover = lastReady?.surface === "popover" ? lastReady.popover : void 0;
      if (!popover)
        return;
      const active2 = popoverPointerActive || popoverFocusActive;
      if (popoverActivityReported === active2)
        return;
      popoverActivityReported = active2;
      void setPopoverAnchorActive(popover.id, active2).catch(() => void 0);
    };
    const onPopoverPointerOver = () => {
      if (lastReady?.surface !== "popover" || popoverPointerActive)
        return;
      popoverPointerActive = true;
      reportPopoverActivity();
    };
    const onPopoverPointerOut = (event) => {
      if (lastReady?.surface !== "popover" || event.relatedTarget !== null || !popoverPointerActive)
        return;
      popoverPointerActive = false;
      reportPopoverActivity();
    };
    const onPopoverFocus = () => {
      if (lastReady?.surface !== "popover" || popoverFocusActive)
        return;
      popoverFocusActive = true;
      reportPopoverActivity();
    };
    const onPopoverBlur = () => {
      if (lastReady?.surface !== "popover" || !popoverFocusActive)
        return;
      popoverFocusActive = false;
      reportPopoverActivity();
    };
    const requireIdentity = (value, maximum = 1024) => {
      if (!value.trim() || value.length > maximum)
        throw new HostRequestError("HOST_REJECTED", `Identity must contain 1 to ${maximum} characters.`);
    };
    const readWorkspace = async (query) => {
      if (query.kind !== "projects")
        requireIdentity(query.projectId);
      const result = await send({ ...envelope, type: "workspace-read", id: nextId(ids), payload: query });
      if (!result || !("kind" in result) || !("state" in result) || result.kind !== query.kind) {
        throw new HostRequestError("HOST_REJECTED", "Host did not return workspace data.");
      }
      return result;
    };
    const subscribeWorkspace = async (query, listener) => {
      if (query.kind !== "projects")
        requireIdentity(query.projectId);
      const subscriptionId = nextId(ids);
      workspaceListeners.set(subscriptionId, listener);
      try {
        await request({ ...envelope, type: "workspace-subscribe", id: nextId(ids), payload: { subscriptionId, query } });
      } catch (error) {
        workspaceListeners.delete(subscriptionId);
        if (!disposed)
          post({ ...envelope, type: "workspace-unsubscribe", id: nextId(ids), payload: { subscriptionId } });
        throw error;
      }
      return () => {
        if (!workspaceListeners.delete(subscriptionId) || disposed)
          return;
        post({ ...envelope, type: "workspace-unsubscribe", id: nextId(ids), payload: { subscriptionId } });
      };
    };
    const subscribeShells = async (scope, listener) => {
      if (scope.kind === "session")
        requireIdentity(scope.sessionId);
      if (scope.kind === "project")
        requireIdentity(scope.projectId);
      const subscriptionId = nextId(ids);
      shellsListeners.set(subscriptionId, listener);
      try {
        await request({ ...envelope, type: "shells-subscribe", id: nextId(ids), payload: { subscriptionId, scope } });
      } catch (error) {
        shellsListeners.delete(subscriptionId);
        if (!disposed)
          post({ ...envelope, type: "shells-unsubscribe", id: nextId(ids), payload: { subscriptionId } });
        throw error;
      }
      return () => {
        if (!shellsListeners.delete(subscriptionId) || disposed)
          return;
        post({ ...envelope, type: "shells-unsubscribe", id: nextId(ids), payload: { subscriptionId } });
      };
    };
    const storage = async (payload) => {
      if ("key" in payload && (payload.key.length === 0 || payload.key.length > GUEST_STORAGE_KEY_MAX)) {
        throw new HostRequestError("HOST_REJECTED", "Storage key must contain 1 to 128 characters.");
      }
      if (payload.op === "set" && !isJsonValue(payload.value)) {
        throw new HostRequestError("HOST_REJECTED", "Storage values must be JSON.");
      }
      if (payload.op === "set" && new TextEncoder().encode(JSON.stringify(payload.value)).length > GUEST_STORAGE_VALUE_BYTES) {
        throw new HostRequestError("HOST_REJECTED", "Storage value exceeds 64 KiB.");
      }
      if (payload.scope === "device" && lastReady?.features?.deviceStorage !== true) {
        throw new HostRequestError("UNSUPPORTED", "This host does not support device storage.");
      }
      const result = await send({ ...envelope, type: "storage", id: nextId(ids), payload });
      if (!result || !("storage" in result) || result.op !== payload.op)
        throw new HostRequestError("HOST_REJECTED", "Host did not return storage data.");
      return result;
    };
    const closePopover = (id, reason) => lastReady?.features?.popovers !== true && !(lastReady?.surface === "popover" && lastReady.popover?.id === id) ? Promise.reject(new HostRequestError("UNSUPPORTED", "This host does not support popovers.")) : request({ ...envelope, type: "popover-close", id: nextId(ids), payload: reason ? { id, reason } : { id } });
    const setPopoverAnchorActive = (id, active2) => lastReady?.features?.popovers !== true && !(lastReady?.surface === "popover" && lastReady.popover?.id === id) ? Promise.reject(new HostRequestError("UNSUPPORTED", "This host does not support popovers.")) : request({ ...envelope, type: "popover-anchor", id: nextId(ids), payload: { id, active: active2 } });
    target.addEventListener("keydown", onPopoverEscape, true);
    target.addEventListener("pointerover", onPopoverPointerOver);
    target.addEventListener("pointermove", onPopoverPointerOver);
    target.addEventListener("pointerout", onPopoverPointerOut);
    target.addEventListener("focus", onPopoverFocus);
    target.addEventListener("blur", onPopoverBlur);
    return {
      onAction: (handler) => {
        actionHandler = handler;
        return () => {
          if (actionHandler === handler)
            actionHandler = null;
        };
      },
      listProjects: async () => {
        const result = await readWorkspace({ kind: "projects" });
        if (result.kind !== "projects")
          throw new HostRequestError("HOST_REJECTED", "Expected projects.");
        return result;
      },
      listWorktrees: async (projectId) => {
        const result = await readWorkspace({ kind: "worktrees", projectId });
        if (result.kind !== "worktrees")
          throw new HostRequestError("HOST_REJECTED", "Expected worktrees.");
        return result;
      },
      listSessions: async (projectId) => {
        const result = await readWorkspace({ kind: "sessions", projectId });
        if (result.kind !== "sessions")
          throw new HostRequestError("HOST_REJECTED", "Expected sessions.");
        return result;
      },
      onProjects: (listener) => subscribeWorkspace({ kind: "projects" }, (snapshot) => {
        if (snapshot.kind === "projects")
          listener(snapshot);
      }),
      onWorktrees: (projectId, listener) => subscribeWorkspace({ kind: "worktrees", projectId }, (snapshot) => {
        if (snapshot.kind === "worktrees")
          listener(snapshot);
      }),
      onSessions: (projectId, listener) => subscribeWorkspace({ kind: "sessions", projectId }, (snapshot) => {
        if (snapshot.kind === "sessions")
          listener(snapshot);
      }),
      onRunningShells: (scope, listener) => subscribeShells(scope, listener),
      readShellOutput: async (shellId, options2) => {
        requireIdentity(shellId, GUEST_SHELL_ID_MAX);
        const cursor = options2?.cursor;
        if (cursor !== void 0 && (!Number.isInteger(cursor) || cursor < 0)) {
          throw new HostRequestError("HOST_REJECTED", "Shell output cursor must be a non-negative integer.");
        }
        const tailBytes = options2?.tailBytes;
        if (tailBytes !== void 0 && (!Number.isInteger(tailBytes) || tailBytes < 1 || tailBytes > GUEST_SHELL_OUTPUT_TAIL_MAX)) {
          throw new HostRequestError("HOST_REJECTED", `Shell output tailBytes must be an integer between 1 and ${GUEST_SHELL_OUTPUT_TAIL_MAX}.`);
        }
        const result = await send({ ...envelope, type: "shell-output", id: nextId(ids), payload: { shellId, cursor, tailBytes } });
        const output = result;
        if (!output || typeof output.output !== "string" || !Number.isFinite(output.cursor)) {
          throw new HostRequestError("HOST_REJECTED", "Host did not return shell output.");
        }
        return output;
      },
      stopShell: async (shellId) => {
        requireIdentity(shellId, GUEST_SHELL_ID_MAX);
        const result = await send({ ...envelope, type: "shell-stop", id: nextId(ids), payload: { shellId } });
        if (result?.stopped !== true)
          throw new HostRequestError("HOST_REJECTED", "Host did not stop the shell.");
        return { stopped: true };
      },
      openSession: async (sessionId) => {
        requireIdentity(sessionId);
        await request({ ...envelope, type: "open-session", id: nextId(ids), payload: { sessionId } });
      },
      storage: {
        get: async (key, options2) => {
          const scope = deviceStorageScope(options2);
          const payload = { op: "get", key };
          if (scope)
            payload.scope = scope;
          const result = await storage(payload);
          return result.op === "get" && result.found ? result.value : void 0;
        },
        set: async (key, value, options2) => {
          const scope = deviceStorageScope(options2);
          const payload = { op: "set", key, value };
          if (scope)
            payload.scope = scope;
          await storage(payload);
        },
        delete: async (key, options2) => {
          const scope = deviceStorageScope(options2);
          const payload = { op: "delete", key };
          if (scope)
            payload.scope = scope;
          await storage(payload);
        },
        keys: async (options2) => {
          const scope = deviceStorageScope(options2);
          const payload = { op: "keys" };
          if (scope)
            payload.scope = scope;
          const result = await storage(payload);
          if (result.op !== "keys")
            throw new HostRequestError("HOST_REJECTED", "Expected storage keys.");
          return result.keys;
        }
      },
      onReady: (listener) => {
        readyListeners.add(listener);
        if (lastReady)
          listener(lastReady);
        return () => {
          readyListeners.delete(listener);
        };
      },
      onDirectory: (listener) => {
        directoryListeners.add(listener);
        if (lastReady)
          listener(lastReady.directory);
        return () => {
          directoryListeners.delete(listener);
        };
      },
      onSession: (listener) => {
        sessionListeners.add(listener);
        if (lastReady)
          listener(lastReady.session);
        return () => {
          sessionListeners.delete(listener);
        };
      },
      onSessionLifecycle: (listener) => {
        lifecycleListeners.add(listener);
        if (lastLifecycle)
          listener(lastLifecycle);
        return () => {
          lifecycleListeners.delete(listener);
        };
      },
      onConnection: (listener) => {
        connectionListeners.add(listener);
        if (lastReady)
          listener(lastReady.connection);
        return () => {
          connectionListeners.delete(listener);
        };
      },
      onSettings: (listener) => {
        settingsListeners.add(listener);
        if (lastReady)
          listener(lastReady.settings);
        return () => {
          settingsListeners.delete(listener);
        };
      },
      onItem: (listener) => {
        itemListeners.add(listener);
        if (lastReady)
          listener(lastReady.item);
        return () => {
          itemListeners.delete(listener);
        };
      },
      onStatusControl: (listener) => {
        statusControlListeners.add(listener);
        return () => {
          statusControlListeners.delete(listener);
        };
      },
      onPopoverClosed: (listener) => {
        popoverClosedListeners.add(listener);
        return () => {
          popoverClosedListeners.delete(listener);
        };
      },
      setStatusControls: (controls) => {
        if (lastReady?.features?.statusControls !== true) {
          return Promise.reject(new HostRequestError("UNSUPPORTED", "This host does not support status controls."));
        }
        if (!isGuestStatusControls(controls)) {
          return Promise.reject(new HostRequestError("HOST_REJECTED", "Status controls must have unique bounded ids and valid selected options."));
        }
        return request({ ...envelope, type: "status-controls", id: nextId(ids), payload: { controls } });
      },
      openPopover: (payload) => {
        if (lastReady?.features?.popovers !== true) {
          return Promise.reject(new HostRequestError("UNSUPPORTED", "This host does not support popovers."));
        }
        if (!isGuestPopoverRequest(payload)) {
          return Promise.reject(new HostRequestError("HOST_REJECTED", "Popover requests need bounded geometry and JSON data."));
        }
        return request({ ...envelope, type: "popover-open", id: nextId(ids), payload });
      },
      closePopover,
      setPopoverAnchorActive,
      onResolve: (handler) => {
        resolveHandler = handler;
        return () => {
          if (resolveHandler === handler)
            resolveHandler = null;
        };
      },
      toast: (payload) => {
        const message = payload.message.trim();
        if (!message || message.length > GUEST_TOAST_MAX) {
          return Promise.reject(new HostRequestError("HOST_REJECTED", `Toast message must contain 1 to ${GUEST_TOAST_MAX} characters.`));
        }
        if (payload.copy && payload.copy !== true && (!payload.copy.text.length || payload.copy.text.length > GUEST_CLIPBOARD_TEXT_MAX)) {
          return Promise.reject(new HostRequestError("HOST_REJECTED", `Toast copy text must contain 1 to ${GUEST_CLIPBOARD_TEXT_MAX} characters.`));
        }
        return request({
          channel: OPENCHAMBER_SDK_CHANNEL,
          v: OPENCHAMBER_SDK_API_VERSION,
          type: "toast",
          id: nextId(ids),
          payload: { ...payload, message }
        });
      },
      openUrl: (url) => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "open-url",
        id: nextId(ids),
        payload: { url }
      }),
      openCommit: (sha) => isGuestCommitSha(sha) ? request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "open-commit",
        id: nextId(ids),
        payload: { sha }
      }) : Promise.reject(new HostRequestError("HOST_REJECTED", "Commit id must be 7 to 64 hex characters.")),
      openSurface: (surfaceId) => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "open-surface",
        id: nextId(ids),
        payload: { surfaceId }
      }),
      writeClipboard: (text) => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "clipboard-write",
        id: nextId(ids),
        payload: { text }
      }),
      compose: (payload) => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "compose",
        id: nextId(ids),
        payload
      }),
      attach: (payload) => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "attach",
        id: nextId(ids),
        payload: clampAttachRequest(payload)
      }),
      startSession: async (payload) => {
        if (payload.projectId !== void 0)
          requireIdentity(payload.projectId);
        const worktree = payload.worktree;
        if (worktree && worktree !== true) {
          if (worktree.kind === "existing")
            requireIdentity(worktree.directory);
          else {
            if (worktree.name !== void 0)
              requireIdentity(worktree.name, 200);
            if (worktree.baseBranch !== void 0)
              requireIdentity(worktree.baseBranch, 200);
          }
        }
        const result = await send({
          channel: OPENCHAMBER_SDK_CHANNEL,
          v: OPENCHAMBER_SDK_API_VERSION,
          type: "start-session",
          id: nextId(ids),
          payload: clampStartSessionRequest(payload)
        }, options.requestTimeoutMs ?? 18e4);
        if (!isStartSessionResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host did not return a session.");
        }
        return result;
      },
      prompt: (payload) => send({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "prompt",
        id: nextId(ids),
        payload: clampPromptRequest(payload)
      }).then((result) => {
        if (!isPromptResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host did not return a prompt result.");
        }
        return result;
      }),
      sessionLink: (payload) => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "session-link",
        id: nextId(ids),
        payload: clampAttachRequest(payload)
      }),
      close: () => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "close",
        id: nextId(ids)
      }),
      oauthStart: () => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "oauth-start",
        id: nextId(ids)
      }),
      oauthDisconnect: () => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "oauth-disconnect",
        id: nextId(ids)
      }),
      request: (payload) => (isGuestRequestPath(payload.path) ? send({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "request",
        id: nextId(ids),
        payload
      }) : rejectBadPath()).then((result) => {
        if (!isGuestRequestResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host request result was empty.");
        }
        return result;
      }),
      serviceRequest: (payload) => (isGuestRequestPath(payload.path) ? send({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "service-request",
        id: nextId(ids),
        payload
      }) : rejectBadPath()).then((result) => {
        if (!isGuestRequestResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host service request result was empty.");
        }
        return result;
      }),
      serviceStatus: () => send({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "service-status",
        id: nextId(ids)
      }).then((result) => {
        if (!isServiceStatusResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host did not return service status.");
        }
        return result;
      }),
      readFile: (path) => (isGuestFilePath(path) ? send({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "file-read",
        id: nextId(ids),
        payload: { path }
      }) : rejectBadFilePath()).then((result) => {
        if (!isFileReadResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host did not return file content.");
        }
        return result;
      }),
      writeFile: (path, content) => {
        if (!isGuestFilePath(path)) {
          return rejectBadFilePath();
        }
        if (content.length > GUEST_FILE_CONTENT_MAX) {
          return Promise.reject(new HostRequestError("FILE_TOO_LARGE", `Content is over ${GUEST_FILE_CONTENT_MAX} characters.`));
        }
        return send({
          channel: OPENCHAMBER_SDK_CHANNEL,
          v: OPENCHAMBER_SDK_API_VERSION,
          type: "file-write",
          id: nextId(ids),
          payload: { path, content }
        }).then((result) => {
          if (!isFileWriteResult(result)) {
            throw new HostRequestError("HOST_REJECTED", "Host did not confirm the write.");
          }
          return result;
        });
      },
      listDir: (path) => (isGuestFilePath(path) ? send({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "file-list",
        id: nextId(ids),
        payload: { path }
      }) : rejectBadFilePath()).then((result) => {
        if (!isFileListResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host did not return directory entries.");
        }
        return result;
      }),
      stat: (path) => (isGuestFilePath(path) ? send({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "file-stat",
        id: nextId(ids),
        payload: { path }
      }) : rejectBadFilePath()).then((result) => {
        if (!isFileStatResult(result)) {
          throw new HostRequestError("HOST_REJECTED", "Host did not return file status.");
        }
        return result;
      }),
      generate: (input) => {
        const prompt = input.prompt.trim();
        const system = input.system?.trim();
        if (prompt.length === 0 || prompt.length > GUEST_GENERATE_PROMPT_MAX) {
          return Promise.reject(new HostRequestError("HOST_REJECTED", `Prompt must be 1 to ${GUEST_GENERATE_PROMPT_MAX} characters.`));
        }
        if (system !== void 0 && (system.length === 0 || system.length > GUEST_GENERATE_SYSTEM_MAX)) {
          return Promise.reject(new HostRequestError("HOST_REJECTED", `System prompt must be 1 to ${GUEST_GENERATE_SYSTEM_MAX} characters.`));
        }
        const maxOutputTokens = input.maxOutputTokens === void 0 ? void 0 : Math.min(GUEST_GENERATE_OUTPUT_TOKENS_MAX, Math.max(1, Math.floor(input.maxOutputTokens)));
        if (maxOutputTokens !== void 0 && !Number.isFinite(maxOutputTokens)) {
          return Promise.reject(new HostRequestError("HOST_REJECTED", "maxOutputTokens must be a number."));
        }
        const payload = { prompt };
        if (system !== void 0)
          payload.system = system;
        if (maxOutputTokens !== void 0)
          payload.maxOutputTokens = maxOutputTokens;
        return send({
          channel: OPENCHAMBER_SDK_CHANNEL,
          v: OPENCHAMBER_SDK_API_VERSION,
          type: "generate",
          id: nextId(ids),
          payload
        }, options.requestTimeoutMs ?? GUEST_GENERATE_TIMEOUT_MS).then((result) => {
          if (!isGenerateResult(result)) {
            throw new HostRequestError("HOST_REJECTED", "Host did not return generated text.");
          }
          return result;
        });
      },
      onLateGenerateResult: (listener) => {
        lateGenerateListeners.add(listener);
        for (const result of unclaimedLateGenerate.splice(0))
          emit([listener], result);
        listenForLateGenerate();
        return () => {
          lateGenerateListeners.delete(listener);
        };
      },
      setBadge: (count) => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "badge",
        id: nextId(ids),
        payload: { count: clampBadgeCount(count) }
      }),
      setHeight: (height) => request({
        channel: OPENCHAMBER_SDK_CHANNEL,
        v: OPENCHAMBER_SDK_API_VERSION,
        type: "resize",
        id: nextId(ids),
        payload: { height: clampFrameHeight(height) }
      }),
      onFileOpen: (listener) => {
        fileOpenListeners.add(listener);
        if (!saveShortcutInstalled) {
          saveShortcutInstalled = true;
          target.addEventListener("keydown", onSaveShortcut, true);
        }
        if (lastFile)
          listener(lastFile);
        return () => {
          fileOpenListeners.delete(listener);
        };
      },
      onFileSnapshot: (handler) => {
        fileSnapshotHandler = handler;
        return () => {
          if (fileSnapshotHandler === handler)
            fileSnapshotHandler = null;
        };
      },
      onFileSaved: (listener) => {
        fileSavedListeners.add(listener);
        return () => {
          fileSavedListeners.delete(listener);
        };
      },
      reportFileChange: (change) => notify({ ...envelope, type: "file-change", payload: { dirty: change.dirty, edited: change.edited } }),
      requestFileSave,
      reportFileUnsupported: () => notify({ ...envelope, type: "file-unsupported" }),
      dispose: () => {
        for (const subscriptionId of workspaceListeners.keys()) {
          post({ ...envelope, type: "workspace-unsubscribe", id: nextId(ids), payload: { subscriptionId } });
        }
        workspaceListeners.clear();
        for (const subscriptionId of shellsListeners.keys()) {
          post({ ...envelope, type: "shells-unsubscribe", id: nextId(ids), payload: { subscriptionId } });
        }
        shellsListeners.clear();
        disposed = true;
        resolveHandler = null;
        actionHandler = null;
        fileSnapshotHandler = null;
        fileOpenListeners.clear();
        fileSavedListeners.clear();
        if (saveShortcutInstalled)
          target.removeEventListener("keydown", onSaveShortcut, true);
        target.removeEventListener("message", onMessage);
        target.removeEventListener("keydown", onPopoverEscape, true);
        target.removeEventListener("pointerover", onPopoverPointerOver);
        target.removeEventListener("pointermove", onPopoverPointerOver);
        target.removeEventListener("pointerout", onPopoverPointerOut);
        target.removeEventListener("focus", onPopoverFocus);
        target.removeEventListener("blur", onPopoverBlur);
        for (const waiter of pending.values()) {
          clearTimeout(waiter.timer);
          waiter.reject(new HostRequestError("HOST_UNAVAILABLE", "Host client was disposed."));
        }
        pending.clear();
        readyListeners.clear();
        directoryListeners.clear();
        sessionListeners.clear();
        lifecycleListeners.clear();
        connectionListeners.clear();
        settingsListeners.clear();
        itemListeners.clear();
        statusControlListeners.clear();
        popoverClosedListeners.clear();
        lateGenerateListeners.clear();
        unclaimedLateGenerate.length = 0;
      }
    };
  };

  // ../task-roster/node_modules/@openchamber/sdk/dist/service-providers.js
  var BROWSER_CONTROL_ACTIONS = [
    "browser.open",
    "browser.snapshot",
    "browser.click",
    "browser.type",
    "browser.select",
    "browser.scroll",
    "browser.back",
    "browser.forward",
    "browser.inspect",
    "browser.capture",
    "browser.resize",
    "browser.close"
  ];
  var BROWSER_PROVIDER_IDLE_MS = 10 * 6e4;
  var CONTROL_ACTIONS = new Set(BROWSER_CONTROL_ACTIONS);
  var SOURCE_CONTROL_PROVIDER_IDLE_MS = 10 * 6e4;

  // ../task-roster/node_modules/@openchamber/sdk/dist/service-surface.js
  var SURFACE_CONTROLLERS = ["none", "agent", "user"];
  var CONTROLLERS = new Set(SURFACE_CONTROLLERS);

  // ../task-roster/node_modules/@openchamber/sdk/dist/ui/theme.js
  var TOKEN_VARS = [
    ["--oc-bg", "background"],
    ["--oc-elevated", "elevated"],
    ["--oc-fg", "foreground"],
    ["--oc-muted", "muted"],
    ["--oc-subtle", "subtle"],
    ["--oc-border", "border"],
    ["--oc-hover", "hover"],
    ["--oc-selection", "selection"],
    ["--oc-focus", "focus"],
    ["--oc-primary", "primary"],
    ["--oc-muted-surface", "mutedSurface"],
    ["--oc-elevated-fg", "elevatedForeground"],
    ["--oc-active", "active"],
    ["--oc-selection-fg", "selectionForeground"],
    ["--oc-primary-fg", "primaryForeground"],
    ["--oc-primary-text", "primaryText"],
    ["--oc-success-text", "successText"],
    ["--oc-warning-text", "warningText"],
    ["--oc-error-text", "errorText"],
    ["--oc-info-text", "infoText"],
    ["--oc-success", "success"],
    ["--oc-warning", "warning"],
    ["--oc-error", "error"],
    ["--oc-info", "info"],
    ["--oc-font", "font"],
    ["--oc-mono", "mono"],
    ["--oc-radius", "radius"],
    ["--surface-background", "background"],
    ["--surface-elevated", "elevated"],
    ["--surface-foreground", "foreground"],
    ["--surface-muted-foreground", "muted"],
    ["--surface-subtle", "subtle"],
    ["--interactive-border", "border"],
    ["--interactive-hover", "hover"],
    ["--interactive-selection", "selection"],
    ["--interactive-focus-ring", "focus"],
    ["--primary", "primary"],
    ["--surface-muted", "mutedSurface"],
    ["--surface-elevated-foreground", "elevatedForeground"],
    ["--interactive-active", "active"],
    ["--interactive-selection-foreground", "selectionForeground"],
    ["--primary-foreground", "primaryForeground"],
    ["--primary-text", "primaryText"],
    ["--success-text", "successText"],
    ["--warning-text", "warningText"],
    ["--error-text", "errorText"],
    ["--info-text", "infoText"],
    ["--status-success", "success"],
    ["--status-warning", "warning"],
    ["--status-error", "error"],
    ["--status-info", "info"],
    ["--font-sans", "font"],
    ["--font-mono", "mono"],
    ["--radius", "radius"]
  ];
  var SYNTAX_TOKEN_VARS = [
    ["--oc-syntax-keyword", "--syntax-keyword", "syntaxKeyword"],
    ["--oc-syntax-string", "--syntax-string", "syntaxString"],
    ["--oc-syntax-number", "--syntax-number", "syntaxNumber"],
    ["--oc-syntax-function", "--syntax-function", "syntaxFunction"],
    ["--oc-syntax-type", "--syntax-type", "syntaxType"],
    ["--oc-syntax-comment", "--syntax-comment", "syntaxComment"],
    ["--oc-syntax-variable", "--syntax-variable", "syntaxVariable"],
    ["--oc-syntax-operator", "--syntax-operator", "syntaxOperator"]
  ];
  var applyHostTheme = (theme, root) => {
    root.style.colorScheme = theme.mode;
    for (const [name, key] of TOKEN_VARS) {
      root.style.setProperty(name, theme.tokens[key]);
    }
    for (const [alias, hostName, key] of SYNTAX_TOKEN_VARS) {
      const value = theme.tokens[key] ?? "";
      root.style.setProperty(alias, value);
      root.style.setProperty(hostName, value);
    }
    root.style.setProperty("font-family", theme.tokens.font);
    root.style.setProperty("font-size", "0.875rem");
    root.style.setProperty("line-height", "1.45");
    root.style.setProperty("color", theme.tokens.foreground);
  };
  var applyHostReady = (ctx, root) => {
    applyHostTheme(ctx.theme, root);
    if (root.dataset) {
      root.dataset.ocSurface = ctx.surface;
      root.dataset.ocTheme = ctx.theme.mode;
    }
  };

  // ../task-roster/node_modules/@openchamber/sdk/dist/ui/style.js
  var OC_ALIAS = {
    "surface-background": "bg",
    "surface-elevated": "elevated",
    "surface-elevated-foreground": "elevated-fg",
    "surface-foreground": "fg",
    "surface-muted-foreground": "muted",
    "surface-muted": "muted-surface",
    "surface-subtle": "subtle",
    "interactive-border": "border",
    "interactive-hover": "hover",
    "interactive-active": "active",
    "interactive-selection": "selection",
    "interactive-selection-foreground": "selection-fg",
    "interactive-focus-ring": "focus",
    "primary": "primary",
    "primary-foreground": "primary-fg",
    "primary-text": "primary-text",
    "success-text": "success-text",
    "warning-text": "warning-text",
    "error-text": "error-text",
    "info-text": "info-text",
    "status-success": "success",
    "status-warning": "warning",
    "status-error": "error",
    "status-info": "info",
    "font-sans": "font",
    "font-mono": "mono",
    "radius": "radius"
  };
  var v = (name, fallback) => `var(--${name}, var(--oc-${OC_ALIAS[name]}, ${fallback}))`;
  var bg = v("surface-background", "transparent");
  var elevated = v("surface-elevated", "transparent");
  var elevatedFg = v("surface-elevated-foreground", "inherit");
  var fg = v("surface-foreground", "inherit");
  var muted = v("surface-muted-foreground", "gray");
  var secondary = v("surface-muted", "transparent");
  var border = v("interactive-border", "currentColor");
  var hover = v("interactive-hover", "transparent");
  var active = v("interactive-active", "transparent");
  var selection = v("interactive-selection", "transparent");
  var selectionFg = v("interactive-selection-foreground", "inherit");
  var primary = v("primary", "currentColor");
  var primaryText = v("primary-text", "inherit");
  var errorText = v("error-text", "inherit");
  var font = v("font-sans", "inherit");
  var mono = v("font-mono", "monospace");
  var radius = v("radius", "9px");
  var controlRadius = `calc(${radius} - 2px)`;
  var smallRadius = `calc(${radius} - 4px)`;
  var mix = (color, pct, base = "transparent") => `color-mix(in srgb, ${color} ${pct}%, ${base})`;
  var focusFill = `background-image: linear-gradient(${hover}, ${hover});`;
  var field = (edge) => `box-shadow: inset 0 0 0 1px ${edge}, var(--oc-sdk-field-lift);`;
  var raised = "border-color: var(--oc-sdk-edge); box-shadow: var(--oc-sdk-raised-lift);";
  var litButton = "box-shadow: var(--oc-sdk-lit);";
  var darkLift = `inset 0 1px 0 0 ${mix(fg, 1.5)}, 0 1px 1px 0 rgb(0 0 0 / 0.28), 0 2px 3px -2px rgb(0 0 0 / 0.2)`;
  var THEME_VARS = `
:root {
  --oc-sdk-edge: ${mix(fg, 10)};
  --oc-sdk-field-bg: ${elevated};
  --oc-sdk-raised-bg: ${bg};
  --oc-sdk-field-lift: inset 0 1px 2px 0 rgb(0 0 0 / 0.04);
  --oc-sdk-raised-lift: 0 1px 2px 0 rgb(0 0 0 / 0.06);
  --oc-sdk-lit: inset 0 1px 0 0 rgb(255 255 255 / 0.45), 0 1px 2px 0 rgb(0 0 0 / 0.08);
  --oc-sdk-float-edge: rgb(0 0 0 / 0.1);
  --oc-sdk-float: inset 0 1px 0 0 rgb(255 255 255 / 0.8), inset 0 0 0 1px rgb(0 0 0 / 0.04), 0 1px 2px -0.5px rgb(0 0 0 / 0.08), 0 4px 8px -2px rgb(0 0 0 / 0.08), 0 12px 20px -4px rgb(0 0 0 / 0.08);
}
:root[data-oc-theme="dark"] {
  --oc-sdk-edge: ${mix(fg, 6)};
  --oc-sdk-field-bg: ${mix(bg, 50, elevated)};
  --oc-sdk-raised-bg: ${elevated};
  --oc-sdk-field-lift: ${darkLift};
  --oc-sdk-raised-lift: ${darkLift};
  --oc-sdk-lit: inset 0 1px 0 0 ${mix(fg, 1.5)}, 0 1px 1px 0 rgb(0 0 0 / 0.28), 0 2px 3px -2px rgb(0 0 0 / 0.2);
  --oc-sdk-float-edge: rgb(0 0 0 / 0.36);
  --oc-sdk-float: inset 0 1px 0 0 rgb(255 255 255 / 0.06), inset 0 0 0 1px rgb(255 255 255 / 0.08), 0 1px 1px -0.5px rgb(0 0 0 / 0.22), 0 3px 3px -1.5px rgb(0 0 0 / 0.2), 0 6px 6px -3px rgb(0 0 0 / 0.16);
}`;
  var tone = (name) => {
    const color = v(`status-${name}`, "currentColor");
    return `
.oc-sdk[data-tone="${name}"], .oc-sdk [data-tone="${name}"] { --oc-sdk-tone: ${color}; --oc-sdk-tone-text: ${v(`${name}-text`, "inherit")}; }`;
  };
  var UI_SIZE_CSS = `
.oc-sdk { box-sizing: border-box; font-size: 0.875rem; line-height: 1.45; }
.oc-sdk *, .oc-sdk *::before, .oc-sdk *::after { box-sizing: border-box; }
/* :where() keeps the reset at zero specificity so every primitive class below overrides it. */
:where(.oc-sdk) :where(button, input, textarea), :where(button.oc-sdk, input.oc-sdk, textarea.oc-sdk) { font: inherit; color: inherit; margin: 0; }
:where(.oc-sdk) :where(button), :where(button.oc-sdk) { cursor: pointer; background: none; border: 0; padding: 0; }
.oc-sdk button:disabled, button.oc-sdk:disabled, .oc-sdk[aria-disabled="true"], .oc-sdk [aria-disabled="true"] { opacity: .5; pointer-events: none; }

.oc-sdk-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 32px; padding: 0 12px; border: 1px solid transparent; font-size: 0.875rem; font-weight: 500; line-height: 1; white-space: nowrap; }
.oc-sdk-btn[data-size="sm"] { gap: 6px; height: 28px; padding: 0 10px; font-size: 0.8125rem; }
.oc-sdk-btn[data-size="xs"] { gap: 4px; height: 24px; padding: 0 8px; font-size: 0.75rem; }
.oc-sdk-btn[data-loading="true"] { opacity: .5; pointer-events: none; }
.oc-sdk-btn > .oc-sdk-spinner-ring { width: 14px; height: 14px; }

.oc-sdk-field { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.oc-sdk-field-label { font-size: 0.8125rem; font-weight: 500; }
.oc-sdk-field-note { font-size: 0.75rem; }
.oc-sdk-input { display: block; width: 100%; min-width: 0; height: 32px; padding: 0 10px; border: 0; font-size: 0.875rem; line-height: 1.45; appearance: none; }
textarea.oc-sdk-input { height: auto; padding: 8px 10px; resize: vertical; }

.oc-sdk-search { position: relative; min-width: 0; }
.oc-sdk-search .oc-sdk-input { padding-left: 34px; padding-right: 34px; }
.oc-sdk-search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); pointer-events: none; }
.oc-sdk-search-clear { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); display: none; align-items: center; justify-content: center; width: 24px; height: 24px; }
.oc-sdk-search[data-active="true"] .oc-sdk-search-clear { display: inline-flex; }

.oc-sdk-select { position: relative; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.oc-sdk-trigger { display: inline-flex; align-items: center; gap: 6px; align-self: flex-start; width: auto; max-width: 100%; min-width: 0; height: 28px; padding: 0 10px; border: 1px solid transparent; font-size: 0.8125rem; text-align: left; }
.oc-sdk-trigger-value { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.oc-sdk-trigger-chevron { flex: 0 0 auto; }
.oc-sdk-popup { position: fixed; z-index: 50; display: flex; flex-direction: column; gap: 2px; min-width: 160px; max-width: calc(100vw - 16px); max-height: min(320px, calc(100vh - 16px)); overflow: auto; padding: 4px; border: 1px solid transparent; }
.oc-sdk-popup-search { flex: 0 0 auto; padding: 2px 2px 4px; }
.oc-sdk-popup-search .oc-sdk-input { height: 28px; font-size: 0.8125rem; }
.oc-sdk-option { display: flex; align-items: center; gap: 8px; width: 100%; padding: 6px 8px; font-size: 0.8125rem; text-align: left; }
.oc-sdk-option-label { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.oc-sdk-option-hint { flex: 0 0 auto; font-size: 0.75rem; }
.oc-sdk-option-check { flex: 0 0 auto; display: inline-flex; width: 14px; visibility: hidden; }
.oc-sdk-option[aria-selected="true"] > .oc-sdk-option-check { visibility: visible; }
.oc-sdk-popup-empty { padding: 8px; font-size: 0.8125rem; }

.oc-sdk-check { display: inline-flex; align-items: flex-start; gap: 8px; width: 100%; text-align: left; }
.oc-sdk-check-box { flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px; margin-top: 3px; border: 1px solid transparent; }
.oc-sdk-check-box > svg { display: none; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-box > svg { display: block; }
.oc-sdk-check-thumb { flex: 0 0 auto; position: relative; width: 36px; height: 20px; }
.oc-sdk-check-thumb::after { content: ""; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; }
.oc-sdk-check-text { display: flex; flex-direction: column; min-width: 0; }
.oc-sdk-check-label { font-size: 0.875rem; }
.oc-sdk-check-desc { font-size: 0.75rem; }

.oc-sdk-tabs { display: inline-flex; gap: 2px; padding: 2px; max-width: 100%; overflow: auto; }
.oc-sdk-tab { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 10px; border: 1px solid transparent; font-size: 0.8125rem; font-weight: 500; white-space: nowrap; }
.oc-sdk-tab-count { font-size: 0.75rem; font-variant-numeric: tabular-nums; }

.oc-sdk-badge { display: inline-flex; align-items: center; padding: 1px 6px; font-size: 11px; font-weight: 500; line-height: 16px; white-space: nowrap; }

.oc-sdk-list { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.oc-sdk-row { display: flex; align-items: center; gap: 8px; width: 100%; padding: 6px 8px; text-align: left; }
.oc-sdk-row-lead { flex: 0 0 auto; width: 64px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.75rem; }
.oc-sdk-row-main { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; }
.oc-sdk-row-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.oc-sdk-row-sub { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.75rem; }
.oc-sdk-row-meta { flex: 0 0 auto; font-size: 0.75rem; font-variant-numeric: tabular-nums; }
.oc-sdk-list-empty { padding: 16px 8px; text-align: center; font-size: 0.8125rem; }

.oc-sdk-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: 40px 16px; text-align: center; }
.oc-sdk-empty-title { margin: 0; font-size: 0.8125rem; font-weight: 600; }
.oc-sdk-empty-body { margin: 0; max-width: 32rem; font-size: 0.8125rem; }
.oc-sdk-empty-action { margin-top: 12px; }

@keyframes oc-sdk-spin { to { transform: rotate(360deg); } }
.oc-sdk-spinner { display: inline-flex; align-items: center; gap: 8px; font-size: 0.8125rem; }
.oc-sdk-spinner-ring { width: 16px; height: 16px; border: 2px solid transparent; animation: oc-sdk-spin .8s linear infinite; }
.oc-sdk-spinner[data-size="sm"] .oc-sdk-spinner-ring { width: 12px; height: 12px; }

.oc-sdk-banner { display: flex; align-items: flex-start; gap: 12px; padding: 8px 12px; border: 1px solid transparent; }
.oc-sdk-banner-text { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.oc-sdk-banner-title { font-size: 0.8125rem; font-weight: 500; }
.oc-sdk-banner-body { font-size: 0.8125rem; }
.oc-sdk-banner-action { flex: 0 0 auto; }

.oc-sdk-separator { display: flex; align-items: center; gap: 8px; width: 100%; margin: 8px 0; font-size: 0.75rem; }
.oc-sdk-separator::before, .oc-sdk-separator::after { content: ""; flex: 1 1 auto; height: 1px; }
.oc-sdk-separator[data-labeled="false"]::after { display: none; }
.oc-sdk-popup > .oc-sdk-separator { margin: 4px 0; }

.oc-sdk-progress { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.oc-sdk-progress-label { display: flex; justify-content: space-between; font-size: 0.75rem; font-variant-numeric: tabular-nums; }
.oc-sdk-progress-track { height: 6px; overflow: hidden; }
.oc-sdk-progress-fill { height: 100%; transform-origin: left; transition: transform 200ms ease-out; }

.oc-sdk-menu { position: relative; display: inline-flex; }

.oc-sdk-text { white-space: pre-wrap; overflow-wrap: anywhere; }
.oc-sdk-text img { display: block; max-width: 100%; margin: 8px 0; }
`;
  var GUEST_UI_LOOK_CSS = `${THEME_VARS}
.oc-sdk { color: ${fg}; font-family: ${font}; }
.oc-sdk :focus-visible, .oc-sdk:focus-visible { outline: none; }
.oc-sdk :where(button, a[href], [role="button"], [role="tab"], [role="option"]):focus-visible, button.oc-sdk:focus-visible { ${focusFill} }
.oc-sdk-mono { font-family: ${mono}; }
.oc-sdk-muted { color: ${muted}; }
${tone("success")}${tone("warning")}${tone("error")}${tone("info")}
.oc-sdk[data-tone="primary"], .oc-sdk [data-tone="primary"] { --oc-sdk-tone: ${primary}; --oc-sdk-tone-text: ${primaryText}; }

.oc-sdk-btn { border-radius: ${controlRadius}; transition: background 150ms ease-out, color 150ms ease-out; }
.oc-sdk-btn[data-size="xs"] { border-radius: ${smallRadius}; }
.oc-sdk-btn[data-variant="default"] { color: ${primaryText}; background: ${mix(primary, 10, bg)}; border-color: ${mix(primary, 12)}; ${litButton} }
.oc-sdk-btn[data-variant="default"]:hover { background: ${mix(primary, 16, bg)}; }
.oc-sdk-btn[data-variant="default"]:active { background: ${mix(primary, 22, bg)}; box-shadow: none; }
.oc-sdk-btn[data-variant="secondary"] { background: ${secondary}; color: var(--oc-fg); }
.oc-sdk-btn[data-variant="secondary"]:hover { background-image: linear-gradient(${hover}, ${hover}); }
.oc-sdk-btn[data-variant="secondary"]:active { background-image: linear-gradient(${active}, ${active}); }
.oc-sdk-btn[data-variant="outline"] { background: var(--oc-sdk-raised-bg); color: ${elevatedFg}; ${raised} }
.oc-sdk-btn[data-variant="outline"]:hover { background-image: linear-gradient(${hover}, ${hover}); }
.oc-sdk-btn[data-variant="outline"]:active { background-image: linear-gradient(${active}, ${active}); box-shadow: none; }
.oc-sdk-btn[data-variant="ghost"] { background: transparent; }
.oc-sdk-btn[data-variant="ghost"]:hover { background: ${hover}; }
.oc-sdk-btn[data-variant="ghost"]:active { background: ${active}; }
.oc-sdk-btn[data-variant="destructive"] { --oc-sdk-tone: ${v("status-error", "red")}; color: ${errorText}; background: ${mix("var(--oc-sdk-tone)", 7, bg)}; border-color: ${mix("var(--oc-sdk-tone)", 12)}; ${litButton} }
.oc-sdk-btn[data-variant="destructive"]:hover { background: ${mix("var(--oc-sdk-tone)", 9, bg)}; }
.oc-sdk-btn[data-variant="destructive"]:active { background: ${mix("var(--oc-sdk-tone)", 11, bg)}; box-shadow: none; }

.oc-sdk-field-note { color: ${muted}; }
.oc-sdk-field[data-invalid="true"] .oc-sdk-field-note { color: ${errorText}; }
.oc-sdk-input { border-radius: ${controlRadius}; background: var(--oc-sdk-field-bg); color: ${elevatedFg}; ${field("var(--oc-sdk-edge)")} transition: background 150ms ease-out; }
.oc-sdk-input::placeholder { color: ${muted}; }
.oc-sdk-input:hover:not(:focus) { background-image: linear-gradient(${hover}, ${hover}); }
.oc-sdk-input:focus, .oc-sdk-input:focus-visible { ${field(mix(fg, 26))} }
.oc-sdk-field[data-invalid="true"] .oc-sdk-input, .oc-sdk-field[data-invalid="true"] .oc-sdk-input:focus { ${field(v("status-error", "red"))} }
.oc-sdk-input[data-mono="true"] { font-family: ${mono}; }

.oc-sdk-search-icon { color: ${muted}; }
.oc-sdk-search[data-active="true"] .oc-sdk-search-icon { color: ${primary}; }
.oc-sdk-search-clear { border-radius: ${smallRadius}; color: ${muted}; }
.oc-sdk-search-clear:hover { background: ${hover}; color: ${fg}; }

.oc-sdk-trigger { border-radius: ${controlRadius}; background: var(--oc-sdk-raised-bg); color: ${elevatedFg}; ${raised} transition: background 150ms ease-out; }
.oc-sdk-trigger:hover { background-image: linear-gradient(${hover}, ${hover}); }
.oc-sdk-trigger[aria-expanded="true"] { background-image: linear-gradient(${active}, ${active}); }
.oc-sdk-trigger-value[data-empty="true"] { color: ${muted}; }
.oc-sdk-trigger-chevron { color: ${muted}; }
/* The app's dropdown light: lit top, hairline rings and a layered shadow. Its outer ring is the border, over the page like the app's. */
.oc-sdk-popup { --surface-foreground: ${elevatedFg}; border-color: var(--oc-sdk-float-edge); border-radius: 12px; background: ${elevated}; background-clip: padding-box; color: ${elevatedFg}; box-shadow: var(--oc-sdk-float); }
.oc-sdk-option { border-radius: 8px; }
.oc-sdk-option[data-active="true"] { background: ${hover}; }
/* A selected option shows a check mark in the text colour, like the app's own pickers. Options without the mark come
   from bundles built before it existed and keep the selection fill as their only sign of the choice. */
.oc-sdk-option[aria-selected="true"]:not([data-mark]) { background: ${selection}; color: ${selectionFg}; }
.oc-sdk-option-check { color: ${fg}; }
.oc-sdk-option[data-destructive="true"] { color: ${errorText}; }
.oc-sdk-option[data-destructive="true"][data-active="true"] { background: ${mix(v("status-error", "red"), 10)}; }
.oc-sdk-option-hint { color: ${muted}; }
.oc-sdk-popup-empty { color: ${muted}; }

/* Checked stays neutral: the mark carries the state, and the primary colour stays with primary actions. */
.oc-sdk-check-box { border-color: ${border}; border-radius: 4px; color: ${fg}; transition: border-color 150ms ease-out; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-box { border-color: ${mix(fg, 60, border)}; }
.oc-sdk-check-thumb { border-radius: 9999px; background: ${border}; transition: background 150ms ease-out; }
.oc-sdk-check-thumb::after { border-radius: 9999px; background: ${bg}; transition: transform 150ms ease-out; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-thumb { background: ${primary}; }
.oc-sdk-check[aria-checked="true"] .oc-sdk-check-thumb::after { transform: translateX(16px); }
.oc-sdk-check:focus-visible { box-shadow: none; }
.oc-sdk-check:focus-visible .oc-sdk-check-box, .oc-sdk-check:focus-visible .oc-sdk-check-thumb { ${focusFill} }
.oc-sdk-check-desc { color: ${muted}; }

.oc-sdk-tabs { border-radius: 10px; }
.oc-sdk-tabs[data-track="true"] { background: ${mix(fg, 4)}; box-shadow: inset 0 1px 2px 0 rgb(0 0 0 / 0.16); }
.oc-sdk-tab { border-radius: 8px; color: ${muted}; transition: color 150ms ease-out, background 150ms ease-out; }
.oc-sdk-tab:hover { color: ${fg}; }
.oc-sdk-tab[aria-selected="true"] { color: ${selectionFg}; background: ${selection}; border-color: ${border}; }
.oc-sdk-tabs[data-track="true"] .oc-sdk-tab[aria-selected="true"] { color: ${elevatedFg}; background: var(--oc-sdk-raised-bg); ${raised} }
.oc-sdk-tab-count { color: ${muted}; }

.oc-sdk-badge { border-radius: 9999px; background: ${hover}; color: ${muted}; }
.oc-sdk-badge[data-tone] { color: var(--oc-sdk-tone-text, var(--oc-sdk-tone)); background: ${mix("var(--oc-sdk-tone)", 15)}; }

.oc-sdk-row { border-radius: 6px; transition: background 120ms ease-out; }
.oc-sdk-row:hover, .oc-sdk-row[data-active="true"] { background: ${hover}; }
.oc-sdk-row[aria-selected="true"] { background: ${selection}; color: ${selectionFg}; }
.oc-sdk-row-lead { font-family: ${mono}; color: ${muted}; }
.oc-sdk-row-sub { color: ${muted}; }
.oc-sdk-row-meta { color: ${muted}; }
.oc-sdk-row[aria-selected="true"] .oc-sdk-row-lead, .oc-sdk-row[aria-selected="true"] .oc-sdk-row-sub, .oc-sdk-row[aria-selected="true"] .oc-sdk-row-meta { color: inherit; opacity: .75; }
.oc-sdk-list-empty { color: ${muted}; }

.oc-sdk-empty-body { color: ${muted}; }

.oc-sdk-spinner { color: ${muted}; }
.oc-sdk-spinner-ring { border-color: ${border}; border-top-color: ${primary}; border-radius: 9999px; }

/* Set apart by its tint alone, like the app's banners. */
.oc-sdk-banner { border-color: transparent; border-radius: 8px; background: ${mix("var(--oc-sdk-tone)", 10)}; }
.oc-sdk-banner-title { color: var(--oc-sdk-tone-text, var(--oc-sdk-tone)); }
.oc-sdk-banner-body { color: ${muted}; }

.oc-sdk-separator { color: ${muted}; }
.oc-sdk-separator::before, .oc-sdk-separator::after { background: ${mix(border, 40)}; }

.oc-sdk-progress-label { color: ${muted}; }
.oc-sdk-progress-track { border-radius: 9999px; background: ${border}; }
.oc-sdk-progress-fill { border-radius: 9999px; background: var(--oc-sdk-tone, ${primary}); }

.oc-sdk-text a { color: ${primaryText}; text-decoration: underline; text-underline-offset: 2px; }
.oc-sdk-text img { border-radius: 8px; border: 1px solid ${mix(border, 60)}; }
`;
  var UI_CSS = `
${GUEST_SCROLLBAR_CSS}
${UI_SIZE_CSS}
${GUEST_UI_LOOK_CSS}`;

  // panel/src.js
  var host = connectHost();
  var el2 = (id) => document.getElementById(id);
  var DEFAULT_ROOT = "~/.task-hub/tasks";
  var FILE_TASKS = "~/.task-hub/tasks.json";
  var FILE_SETTINGS = "~/.task-hub/settings.json";
  var AUTO_KEY = "taskhub.auto";
  var AUTO_MS = 1500;
  var FILE_BUDGET = {
    "HEAD.md": 8 * 1024,
    "SUMMARY.md": 40 * 1024,
    "RUNBOOK.md": 30 * 1024,
    progress: 40 * 1024
  };
  var DICT = {
    en: {
      tasks: "Tasks",
      auto: "Auto",
      on: "On",
      newTask: "New",
      refresh: "Refresh",
      search: "Search tasks",
      sort: "Sort",
      manual: "Manual",
      name: "Name",
      members: "Sessions",
      none: "No tasks yet",
      noMatch: "No matching tasks",
      pick: "Pick a task on the left",
      you: "You",
      edit: "Edit",
      addSession: "Add session",
      delete: "Delete",
      confirm: "Click again",
      progress: "Progress folder",
      copyPath: "Copy path",
      copyDone: "Path copied",
      external: "external",
      unreadable: "External folder: the panel records and copies the path but does not read its files.",
      readFail: "Cannot read folder",
      running: "running",
      runningChild: "subagent",
      waiting: "waiting",
      idle: "idle",
      failed: "failed",
      unknown: "—",
      lastTurn: "last",
      done: "done",
      noFolder: "no folder",
      roleMain: "main",
      roleHelper: "helper",
      roleNone: "unset",
      actions: "Actions",
      setMain: "Make main",
      setHelper: "Make helper",
      fillHelpers: "Fill helpers",
      overCap: "over 3",
      noCoord: "No coordinator set",
      copyId: "Copy id",
      alias: "Display name",
      setAlias: "Rename",
      tidyTitles: "Tidy titles",
      hintJump: "Open the coordinator session this task points to",
      hintAdd: "Create a session in this group's worktree and add it to the roster",
      hintSettle: "Overwrite HEAD, archive over-budget files, lift knowledge into RUNBOOK, sort deliverables",
      hintPatrol: "One patrol round: who runs, who can advance, who waits on you",
      hintSummary: "Ask the coordinator to read everything and answer in six parts",
      hintTidyTitles: "Rename members to project - what it is doing now",
      hintEdit: "Edit name, goal, acceptance and progress folder",
      hintDelete: "Remove this task from the roster; files stay on disk",
      overBudget: "over budget",
      foldFiles: "Show less",
      unfoldFiles: (n) => "Show " + n,
      readerTruncated: "First 200 lines only",
      readerCopy: "Copy all",
      readerClose: "Close",
      dirEmpty: "empty",
      schedule: "Scheduled patrol",
      hintSchedule: "Send the patrol brief to the coordinator on a timer, with a run cap and a stop time",
      scheduleOn: "On",
      scheduleOff: "Off",
      interval: "Every (min)",
      maxRuns: "Max runs (0 = no cap)",
      until: "Stop at",
      scheduleSaved: "Schedule saved",
      scheduleRemoved: "Schedule removed",
      scheduleStopped: "stopped",
      nextRun: (time) => "next " + time,
      runsOf: (a, b) => b > 0 ? a + "/" + b : String(a),
      converge: "Tidy",
      folders: "Folders",
      fileRole: (name) => {
        if (name === "HEAD.md") return "Current state: where things stand, overwritten every round";
        if (name === "SUMMARY.md") return "Timeline of settled conclusions";
        if (name === "RUNBOOK.md") return "How to run it: environment, start, release, build, verify, pitfalls";
        if (name === "DECISIONS.md") return "Long-lived decisions: why it is built this way";
        if (name.startsWith("progress/")) return "Each session's own process log, one file per session";
        if (name.startsWith("deliverables/")) return "Finished deliverables: test package, design, DMS draft, checklists";
        if (name.startsWith("archive/")) return "Archived history, read only";
        return "";
      },
      convergeHint: (who) => "Ask " + who + " to shrink this file",
      convergeQueued: "Switched to the owner, the tidy-up brief is in its chat box",
      noOwner: "No session owns this file",
      ownerCoord: "the coordinator",
      convergePrompt: (title, dir, name, kind) => kind === "progress" ? "Your progress file " + dir + "/progress/" + name + " is over budget. Compress only your own file: move the earliest half to " + dir + "/archive/" + name + "-<YYYY-MM>.md, keep the latest half plus the pointer line at the top, never drop items that are still open, never turn an undecided judgement into a conclusion. Reply in one line: lines moved and lines kept. Do not touch other sessions progress, HEAD, SUMMARY or DECISIONS." : 'Task "' + title + '": ' + dir + "/" + name + " is over budget. Shrink it per rules/task-collab.md section 8: keep only what is still current, move the older half to " + dir + "/archive/" + name + "-<YYYY-MM>.md, keep the pointer line at the top, never drop settled conclusions or their sources. Reply in one line: what changed and how many lines remain.",
      newSession: "New session",
      newSessionTitle: "Session name",
      newSessionRole: "Role",
      noDirectory: "This group has no absolute path to create in",
      sessionCreated: "Session created",
      creating: "Creating",
      orphan: "Created but not saved to the roster",
      fillPrompt: (title, dir, member) => 'For task "' + title + '" add helper sessions for the worktree of "' + member + '". Read ' + dir + ` first. Keep each worktree to at most three sessions: one main line plus up to two helpers for small jobs such as reading code, checking a fact, or a quick question. If that worktree has no helper yet, create one with session.create in the same directory, give it a title naming the worktree and the purpose, and send one short first message: task name, progress folder, its own progress-<last 6 of its id>.md, and what to do. Register it in tasks.json members with role: "helper" and log it in that worktree's .dispatch.json. If it already has three, say which ones to merge or close instead. Start every message with your own role (main or helper).`,
      settle: "Collect and tidy",
      settleQueued: "Switched to the coordinator, the tidy-up brief is in its chat box",
      settlePrompt: (title, dir) => 'Tidy task "' + title + '" now, following rules/task-collab.md section 8, and report only after all four steps.\n\n1. Summarize: read ' + dir + "/HEAD.md, SUMMARY.md, RUNBOOK.md and the recently changed progress-*.md; overwrite HEAD.md with the current state (<=40 lines: state / doing / blocked / next / sources). Do not append.\n2. Archive SUMMARY.md yourself when it exceeds 300 lines. For a progress-<id>.md over 400 lines, tell the session that owns it to compress and archive its own file; never rewrite another session's progress. Before archiving, lift reusable operating knowledge into RUNBOOK.md across seven buckets: deployment chain (repo to branch to pipeline to domain, rollback point), environment, git (baseline, worktree, merge order, conflicts), simulator or device runs, build, verification, pitfalls.\n3. Tidy: move finished deliverables scattered in the task folder (test package, design, DMS draft, config change log, checklists, pending replies, message drafts) into " + dir + "/deliverables/. Move only what is clearly a deliverable; list the uncertain ones for me. Delete nothing.\n4. Report: one line on which files changed, how many lines were archived, and HEAD in three sentences; list anything that needs my decision separately.\n\nCredentials: write where they live, never their value. Do not touch business code, do not commit, push or merge.",
      patrol: "Run a patrol",
      patrolPrompt: (title, dir) => 'Run one patrol round for task "' + title + '" as the coordinator. Read C:\\Users\\HUAWEI\\.task-hub\\tasks.json and ' + dir + ', then HEAD.md, SUMMARY.md, RUNBOOK.md and DECISIONS.md, plus only the last three sections of the progress files that changed this round. Sort every member into running / can-advance / needs-user / done. Send only the can-advance ones a four-part message (new info / one checkable action / stop condition / which file to write, with 【回话】 and returnResult). Append sourced conclusions to SUMMARY.md. Ask me only on hard boundaries (production change, deleting data, merging master or release, messaging outside systems); settle wording and implementation choices from the records yourself and say what you decided. Move loose deliverables into deliverables/ before you report. Report every member as "name + full session id".',
      summarize: "Ask coordinator",
      summaryQueued: "Switched to the coordinator, prompt is in its chat box",
      summaryPrompt: (title, dir) => 'Summarize task "' + title + '" now. Read ' + dir + "/SUMMARY.md and every progress-*.md, then answer in six parts: 1) one-line status, 2) done, 3) in progress, 4) blocked / waiting on whom, 5) pitfalls hit so far with where they live, 6) next three actions. Append settled conclusions to SUMMARY.md with their source; leave open items in the progress files.",
      titlePrompt: (title, dir) => 'Tidy the session names for task "' + title + '". Read tasks.json and ' + dir + ', then for every member set alias to "<short project> - <what it is doing now>": take the short project name from its worktree or directory (for example 微服务, 收银后端, goframe, cashier, H5), and describe the current concrete job from the newest progress file rather than the opening greeting. Rename the session itself with session_rename when you are sure; skip when the evidence is thin and list those instead. Write the result back to tasks.json and report each change as old -> new with the reason.',
      coord: "coordinator",
      coordGroup: "coordinator here",
      coordShort: "C",
      setCoord: "Make coordinator",
      clearCoord: "Unset coordinator",
      compose: "To chat box",
      composed: "Added to the chat box, send it yourself",
      remove: "Remove",
      open: "Open this session",
      gone: "Session not found",
      save: "Save",
      cancel: "Cancel",
      title: "Task name",
      goal: "What it is",
      accept: "Done when",
      folder: "Progress folder",
      folderHint: "Home paths (~/...) are readable. Other paths are recorded only.",
      must: "Name, what it is and done-when are required",
      created: "Task created",
      updated: "Saved",
      added: "Session added",
      already: "Already in this task",
      addTo: "Add to",
      close: "Close",
      searchSessions: "Search sessions",
      noSessions: "No sessions found",
      loading: "Loading",
      noPeers: "No session yet",
      newFolder: "Folder",
      thisSession: "this session"
    },
    zh: {
      tasks: "任务",
      auto: "自动",
      on: "开",
      newTask: "新建",
      refresh: "刷新",
      search: "搜索任务",
      sort: "排序",
      manual: "手动",
      name: "名称",
      members: "会话数",
      none: "还没有任务",
      noMatch: "没有匹配的任务",
      pick: "左边选一件任务",
      you: "你在里面",
      edit: "编辑",
      addSession: "加会话",
      delete: "删除",
      confirm: "再点删除",
      progress: "进度目录",
      copyPath: "复制路径",
      copyDone: "路径已复制",
      external: "外部",
      unreadable: "外部目录：面板只记录和复制路径，不读取里面的文件。",
      readFail: "读不到目录",
      running: "运行中",
      runningChild: "子代理",
      waiting: "等待",
      idle: "空闲",
      failed: "失败",
      unknown: "—",
      lastTurn: "上轮",
      done: "完成",
      noFolder: "无目录",
      roleMain: "主线",
      roleHelper: "辅助",
      roleNone: "未标",
      actions: "操作",
      setMain: "设为主线",
      setHelper: "设为辅助",
      fillHelpers: "补充看板会话",
      overCap: "超过三个",
      noCoord: "这件任务还没设协调会话",
      copyId: "复制会话 id",
      alias: "显示名",
      setAlias: "改标题",
      tidyTitles: "让协调整理标题",
      hintJump: "切到这件任务设定的协调会话，不带提示词",
      hintAdd: "在这个项目组的 worktree 里新建会话，并写入名册",
      hintSettle: "让协调覆盖 HEAD、归档超限文件、把操作知识提到 RUNBOOK、整理成品",
      hintPatrol: "跑一轮巡检：谁在跑、谁可推进、谁在等你",
      hintSummary: "让协调读完汇总，按六段回答并更新 SUMMARY",
      hintTidyTitles: "把成员显示名改成「项目简称 - 正在做的事」",
      hintEdit: "改任务名、目标、验收和进度目录",
      hintDelete: "从名册删除这件任务；磁盘上的文件不动",
      overBudget: "超预算",
      foldFiles: "收起",
      unfoldFiles: (n) => "展开 " + n,
      readerTruncated: "只显示前 200 行",
      readerCopy: "复制全文",
      readerClose: "关闭",
      dirEmpty: "空目录",
      schedule: "定时巡检",
      hintSchedule: "按间隔把巡检指令发进协调会话，可设次数与截止时间",
      scheduleOn: "开",
      scheduleOff: "关",
      interval: "间隔（分钟）",
      maxRuns: "最多几次（0 不限）",
      until: "截止时间",
      scheduleSaved: "定时巡检已保存",
      scheduleRemoved: "定时巡检已删除",
      scheduleStopped: "已停",
      nextRun: (time) => "下次 " + time,
      runsOf: (a, b) => b > 0 ? a + "/" + b : String(a),
      converge: "收",
      folders: "目录",
      fileRole: (name) => {
        if (name === "HEAD.md") return "当前状态：现在到哪了，每轮覆盖写";
        if (name === "SUMMARY.md") return "已定结论的时间线";
        if (name === "RUNBOOK.md") return "怎么让它跑起来：环境、启动、发布、构建、验证、坑";
        if (name === "DECISIONS.md") return "长期口径：为什么这么定";
        if (name.startsWith("progress/")) return "各会话的过程日志，一个会话一份";
        if (name.startsWith("deliverables/")) return "成品：提测资料、方案、工单草稿、清单";
        if (name.startsWith("archive/")) return "历史原文，只读";
        return "";
      },
      convergeHint: (who) => "让" + who + "收敛这个文件",
      convergeQueued: "已切到文件所属会话，收敛指令在输入框里",
      noOwner: "找不到这个文件所属的会话",
      ownerCoord: "协调会话",
      convergePrompt: (title, dir, name, kind) => kind === "progress" ? "你这份 progress 已超预算：" + dir + "/progress/" + name + "。只压缩你自己的文件：把最早一半移进 " + dir + "/archive/" + name + "-<YYYY-MM>.md，正文留最近一半并保留顶部指针行；未闭环的项不许删，没定的判断不许写成结论。压完回一行：移了多少行、还剩多少行。不要动别人的 progress，也不改 HEAD / SUMMARY / DECISIONS。" : "任务「" + title + "」的 " + dir + "/" + name + " 已超预算。按 rules/task-collab.md 第八节收敛：只留当前有效内容，把较早的一半移进 " + dir + "/archive/" + name + "-<YYYY-MM>.md，正文保留顶部指针行；已定结论与出处不许丢。压完回一行：改了什么、现在剩多少行。",
      newSession: "新会话",
      newSessionTitle: "会话名",
      newSessionRole: "角色",
      noDirectory: "这一组拿不到绝对路径，不能建会话",
      sessionCreated: "已建会话",
      creating: "创建中",
      orphan: "会话已建，但没写进名册",
      fillPrompt: (title, dir, member) => "针对任务「" + title + "」，给「" + member + "」所在的 worktree 补充辅助会话。先读 " + dir + '。每个 worktree 最多三个会话：一个主线推进会话，另有至多两个辅助会话，专门做查代码、核事实、小问询这类小活。如果那个 worktree 还没有辅助会话，用 session.create 在它的同目录建一个：标题写明 worktree 名和用途；首条消息只写四样——任务名、进度目录、它自己的 progress-<id后6位>.md、要它做什么。建完写进 tasks.json 的 members，带 role: "helper"，并在该 worktree 的 .dispatch.json 记一行。已经满三个的，说明哪些该合并或结束，不要再加。你发出的每条消息第一行写明自己的角色（主线或辅助）。',
      settle: "让协调收拢",
      settleQueued: "已切到协调会话，收拢指令在它的输入框里",
      settlePrompt: (title, dir) => "现在对任务「" + title + "」做一次收拢，按 rules/task-collab.md 第八节执行，四步做完再回报。\n\n1. 汇总：读 " + dir + "/HEAD.md、SUMMARY.md、RUNBOOK.md 和最近变化的 progress-*.md，把 HEAD.md 覆盖写成当前状态（≤160 行：状态 / 正在做 / 卡在哪 / 下一步 / 出处），不追加。\n2. 归档：SUMMARY.md 超过 300 行由你归档；某份 progress-<id>.md 超过 400 行的，通知写它的那个会话自己压缩归档，你不代改别人的 progress。归档前把可复用的操作知识提到 RUNBOOK.md，按七类扫：部署链条（仓→分支→流水线→域名，回滚点）、环境、git（基线/worktree/合并顺序/冲突）、模拟运行（模拟器/APK/设备号/登录）、构建、验证、踩坑。\n3. 整理：把散在任务目录里的成品（提测资料、方案、DMS 工单草稿、配置变更记录、清单、待发回复、沟通文本）移进 " + dir + "/deliverables/；只移动明确是成品的，拿不准的列出来问我，不删任何文件。\n4. 回报：一行说清改了哪些文件、归档了多少行、HEAD 现在的三句话；需要我拍板的单独列。\n\n凭据只写位置不写值；不要动业务代码，不要提交、推送、合并。",
      patrol: "让协调巡检",
      patrolPrompt: (title, dir) => "现在按信箱调度跑一轮巡检任务「" + title + "」。先读 C:\\Users\\HUAWEI\\.task-hub\\tasks.json 和 " + dir + "，再读 HEAD.md / SUMMARY.md / RUNBOOK.md / DECISIONS.md，以及本轮有变化的 progress 的最后三段。对每个成员分在跑 / 可推进 / 等你定 / 已完成；只给可推进的发一条四段式消息（新信息 / 一个可验收动作 / 停止条件 / 写回路径，带【回话】和 returnResult）；有出处的结论写进 SUMMARY.md；命中硬边界（生产改动、删数据、合并 master 或 release、对外发消息）才问我，口径与实现选择按记录自己定并写明依据。顺手把散落在目录里的成品移进 deliverables/。成员一律报「名称 + 完整 session id」。",
      summarize: "让协调总结",
      summaryQueued: "已切到协调会话，提示词在它的输入框里",
      summaryPrompt: (title, dir) => "现在总结任务「" + title + "」。先读 " + dir + "/SUMMARY.md 和所有 progress-*.md，然后按六段回答：1) 一句话现状 2) 已完成 3) 进行中 4) 卡住的地方与在等谁 5) 已经踩过的坑及各自位置 6) 接下来三步。把已定的结论带出处追加进 SUMMARY.md，未定的留在各 progress 文件里。",
      titlePrompt: (title, dir) => "整理任务「" + title + "」下所有会话的名字。先读 tasks.json 和 " + dir + "。对每个成员，把 alias 设成「项目简称 - 现在在做什么」：项目简称取它所在 worktree 或目录名（例如 微服务、收银后端、goframe、cashier、H5），具体任务从最新的 progress 文件里看，不要照抄标题开头那句问候。有把握时用 session_rename 把会话本体也改成同样的名字；证据不足的跳过并在回报里列出来。改完写回 tasks.json，并把每处改动以「旧名 → 新名（依据）」列给我。",
      coord: "协调",
      coordGroup: "协调所在",
      coordShort: "协",
      setCoord: "标识协调会话",
      clearCoord: "取消协调",
      compose: "放入聊天框",
      composed: "已放入聊天框，确认后自己发送",
      remove: "移除",
      open: "打开这个会话",
      gone: "会话不存在",
      save: "保存",
      cancel: "取消",
      title: "任务名",
      goal: "做什么",
      accept: "验收是什么",
      folder: "进度目录",
      folderHint: "家目录（~/…）可读；其他路径只记录，不读内容。",
      must: "任务名、做什么、验收都要填",
      created: "已建任务",
      updated: "已保存",
      added: "已加会话",
      already: "这一方已经在里面",
      addTo: "加进",
      close: "关闭",
      searchSessions: "搜索会话",
      noSessions: "没读到会话",
      loading: "读取中",
      noPeers: "还没有协作方",
      newFolder: "目录",
      thisSession: "本会话"
    }
  };
  var S = {
    ids: [],
    tasks: /* @__PURE__ */ new Map(),
    settings: { progressRoot: DEFAULT_ROOT },
    selected: null,
    query: "",
    sort: "manual",
    me: null,
    meTitle: "",
    live: /* @__PURE__ */ new Map(),
    busy: /* @__PURE__ */ new Set(),
    service: /* @__PURE__ */ new Map(),
    subscribed: /* @__PURE__ */ new Set(),
    since: /* @__PURE__ */ new Map(),
    stateNodes: [],
    groupNodes: [],
    expanded: /* @__PURE__ */ new Set(),
    openMenu: null,
    headMenu: false,
    renaming: null,
    lastKey: "",
    ticker: 0,
    loc: "en",
    auto: 0,
    mounted: false,
    formMode: "create",
    formId: null,
    pickQ: "",
    pickRows: [],
    pickProjects: 0,
    newFor: null,
    newTitle: "",
    newRole: "helper",
    newBusy: false,
    newCreated: "",
    filesOpen: false,
    schedules: /* @__PURE__ */ new Map(),
    scheduleFor: null,
    scheduleForm: null,
    deleting: null,
    deleteTimer: 0,
    dragId: null,
    dragTaskId: null
  };
  var t = (key) => DICT[S.loc] && DICT[S.loc][key] || DICT.en[key] || key;
  function fmtElapsed(ms) {
    const total = Math.max(0, Math.round(ms / 1e3));
    if (total < 60) return total + "s";
    const m = Math.floor(total / 60);
    const s = total % 60;
    return m + "m" + (s ? s + "s" : "");
  }
  function tickStates() {
    for (const item of S.stateNodes) renderState(item.el, item.member);
    for (const item of S.groupNodes) paintGroupState(item.el, item.list);
  }
  async function readJson(path, fallback) {
    try {
      const { content } = await host.readFile(path);
      const parsed = JSON.parse(content);
      return parsed && typeof parsed === "object" ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
  async function writeJson(path, value) {
    await host.writeFile(path, JSON.stringify(value, null, 2) + "\n");
  }
  async function readSettings() {
    const value = await readJson(FILE_SETTINGS, {});
    const root = typeof value.progressRoot === "string" && value.progressRoot.startsWith("~/") ? value.progressRoot.replace(/\/+$/, "") : DEFAULT_ROOT;
    return { progressRoot: root };
  }
  async function readTasks() {
    const value = await readJson(FILE_TASKS, { version: 1, tasks: [] });
    const list = Array.isArray(value.tasks) ? value.tasks : [];
    return list.filter((task) => task && typeof task.id === "string").map((task) => {
      if (!Array.isArray(task.members)) task.members = [];
      return task;
    });
  }
  async function writeTasks(list) {
    await writeJson(FILE_TASKS, { version: 1, tasks: list });
  }
  function readable(task) {
    return typeof task.progressDir === "string" && task.progressDir.startsWith("~/");
  }
  async function listNames(dir, pattern) {
    try {
      const listing = await host.listDir(dir);
      return (listing.entries || []).filter((entry) => entry.kind === "file" && pattern.test(entry.name)).map((entry) => entry.name).sort();
    } catch {
      return [];
    }
  }
  async function progressFiles(task) {
    const dir = (task.progressDir || "").replace(/\/+$/, "");
    const files = [
      { group: "core", name: "HEAD.md", path: dir + "/HEAD.md", budget: FILE_BUDGET["HEAD.md"] },
      { group: "core", name: "SUMMARY.md", path: dir + "/SUMMARY.md", budget: FILE_BUDGET["SUMMARY.md"] },
      { group: "core", name: "RUNBOOK.md", path: dir + "/RUNBOOK.md", budget: FILE_BUDGET["RUNBOOK.md"] },
      { group: "core", name: "DECISIONS.md", path: dir + "/DECISIONS.md", budget: 0 }
    ];
    let base = dir + "/progress";
    let names = await listNames(base, /^progress-.*\.md$/);
    if (!names.length) {
      base = dir;
      names = await listNames(base, /^progress-.*\.md$/);
    }
    for (const name of names) {
      files.push({ group: "progress", name, path: base + "/" + name, budget: FILE_BUDGET.progress });
    }
    files.push({ group: "dir", name: "deliverables/", path: dir + "/deliverables" });
    files.push({ group: "dir", name: "archive/", path: dir + "/archive" });
    return files;
  }
  async function statPath(path) {
    try {
      const info = await host.stat(path);
      return info && info.kind === "file" ? info : null;
    } catch {
      return null;
    }
  }
  function headText(task) {
    const lines = [
      "# " + (task.title || task.id) + " · 当前状态",
      "",
      "> 每轮覆盖写，不追加。",
      "",
      "## 状态",
      "",
      "## 正在做",
      "",
      "## 卡在哪",
      "",
      "## 下一步",
      "",
      "## 出处"
    ];
    return lines.join("\n") + "\n";
  }
  async function ensureFolder(task, force) {
    if (!readable(task)) return;
    const dir = task.progressDir.replace(/\/+$/, "");
    const head = dir + "/HEAD.md";
    if (force || !await statPath(head)) {
      await host.writeFile(head, headText(task)).catch(() => {
      });
    }
    const summary = dir + "/SUMMARY.md";
    if (!await statPath(summary)) {
      await host.writeFile(summary, "# " + (task.title || task.id) + " · 汇总\n\n只写已定结论。\n\n").catch(() => {
      });
    }
  }
  function recomputeBusy() {
    const busy = /* @__PURE__ */ new Set();
    for (const [id, info] of S.live) {
      if (info.activity !== "running" && info.activity !== "retrying") continue;
      let cursor = info.parentId;
      let guard = 0;
      while (cursor && S.live.has(cursor) && guard < 20) {
        busy.add(cursor);
        cursor = S.live.get(cursor).parentId;
        guard += 1;
      }
    }
    S.busy = busy;
  }
  function mergeSessions(sessions, projectDirectory) {
    for (const session of sessions) {
      S.live.set(session.id, {
        activity: session.activity || "unknown",
        title: session.title || "",
        directory: session.directory || projectDirectory || "",
        parentId: session.parentId || null
      });
    }
    recomputeBusy();
  }
  var repaintTimer = 0;
  function scheduleRepaint() {
    if (repaintTimer) return;
    repaintTimer = setTimeout(() => {
      repaintTimer = 0;
      tickStates();
    }, 120);
  }
  async function subscribeLive() {
    const snapshot = await host.listProjects().catch(() => null);
    const projects = snapshot && Array.isArray(snapshot.projects) ? snapshot.projects : [];
    for (const project of projects) {
      if (S.subscribed.has(project.id)) continue;
      S.subscribed.add(project.id);
      try {
        await host.onSessions(project.id, (snap) => {
          if (!snap || !Array.isArray(snap.sessions)) return;
          mergeSessions(snap.sessions, project.directory);
          scheduleRepaint();
        });
      } catch {
        S.subscribed.delete(project.id);
      }
    }
  }
  async function collectLive() {
    const map = /* @__PURE__ */ new Map();
    const snapshot = await host.listProjects().catch(() => null);
    const projects = snapshot && Array.isArray(snapshot.projects) ? snapshot.projects : [];
    for (const project of projects) {
      const sessionsSnapshot = await host.listSessions(project.id).catch(() => null);
      const sessions = sessionsSnapshot && Array.isArray(sessionsSnapshot.sessions) ? sessionsSnapshot.sessions : [];
      for (const session of sessions) {
        map.set(session.id, {
          activity: session.activity || "unknown",
          title: session.title || "",
          directory: session.directory || project.directory || "",
          parentId: session.parentId || null
        });
      }
    }
    return map;
  }
  function liveOf(member) {
    return S.live.get(member.sessionId) || null;
  }
  function stateOf(member) {
    const svc = S.service.get(member.sessionId);
    if (svc) {
      if (svc.running) return "running";
      if (svc.lastMs) return "done";
      return "idle";
    }
    const live = liveOf(member);
    if (!live) return "unknown";
    if (live.activity === "running" || live.activity === "retrying") return "running";
    if (live.activity === "waiting-permission" || live.activity === "waiting-question") return "waiting";
    if (live.activity === "idle") {
      if (S.busy.has(member.sessionId)) return "running-child";
      return "idle";
    }
    return "unknown";
  }
  function lastMsOf(member) {
    const svc = S.service.get(member.sessionId);
    if (svc && svc.lastMs) return svc.lastMs;
    return 0;
  }
  var STATE_ICON = { done: "✓", failed: "✕", waiting: "◔", idle: "·", unknown: "—" };
  function renderState(el3, member) {
    const state = stateOf(member);
    const elapsed = elapsedOf(member, state);
    el3.dataset.state = state;
    el3.replaceChildren();
    const icon2 = document.createElement("span");
    icon2.className = "state-icon";
    if (state === "running" || state === "running-child") {
      const spin = document.createElement("span");
      spin.className = "spin";
      icon2.appendChild(spin);
    } else {
      icon2.textContent = STATE_ICON[state] || STATE_ICON.unknown;
    }
    const text = document.createElement("span");
    text.className = "state-time";
    if (state === "running" || state === "running-child") {
      text.textContent = elapsed > 0 ? fmtElapsed(elapsed) : "";
    } else if (state === "done") {
      const ms = lastMsOf(member);
      text.textContent = ms ? t("lastTurn") + " " + fmtElapsed(ms) : t("done");
    } else if (state === "idle") {
      text.textContent = t("idle");
    } else if (state === "waiting") {
      text.textContent = t("waiting");
    } else {
      text.textContent = "";
    }
    el3.append(icon2, text);
  }
  function elapsedOf(member, state) {
    const running = state === "running" || state === "running-child";
    if (!running) {
      S.since.delete(member.sessionId);
      return 0;
    }
    const svc = S.service.get(member.sessionId);
    if (svc && svc.since) return Math.max(0, Date.now() - svc.since);
    if (!S.since.has(member.sessionId)) S.since.set(member.sessionId, Date.now());
    return Date.now() - S.since.get(member.sessionId);
  }
  async function createSessionRequest(directory, title, agent) {
    if (typeof host.serviceRequest !== "function") return { id: "", error: "no-service-api" };
    try {
      const res = await host.serviceRequest({
        method: "POST",
        path: "/createSession",
        body: { directory, title, agent }
      });
      const text = typeof res?.body === "string" ? res.body : "";
      const data = text ? JSON.parse(text) : null;
      if (data && data.sessionId) return { id: String(data.sessionId), error: "" };
      return { id: "", error: data && data.error || "empty" };
    } catch (error) {
      return { id: "", error: String(error && error.code || error && error.message || "ERR") };
    }
  }
  async function loadSchedules() {
    if (typeof host.serviceRequest !== "function") return;
    try {
      const res = await host.serviceRequest({ method: "GET", path: "/schedules" });
      const text = typeof res?.body === "string" ? res.body : "";
      const data = text ? JSON.parse(text) : null;
      S.schedules = /* @__PURE__ */ new Map();
      for (const s of data && data.schedules || []) S.schedules.set(s.taskId, s);
    } catch {
    }
  }
  async function saveSchedule(task) {
    const form = S.scheduleForm;
    if (!form) return;
    if (!task.coordinator) {
      toast(t("noCoord"), "error");
      return;
    }
    try {
      await host.serviceRequest({
        method: "POST",
        path: "/schedules",
        body: {
          taskId: task.id,
          sessionId: task.coordinator,
          text: t("patrolPrompt")(task.title || task.id, task.progressDir || ""),
          enabled: Boolean(form.enabled),
          intervalMinutes: Number(form.intervalMinutes) || 30,
          maxRuns: Number(form.maxRuns) || 0,
          until: form.until || ""
        }
      });
      S.scheduleFor = null;
      S.scheduleForm = null;
      await loadSchedules();
      render();
      toast(t("scheduleSaved"), "success");
    } catch (error) {
      toast(String(error && error.code || "ERR"), "error");
    }
  }
  async function removeSchedule(task) {
    try {
      await host.serviceRequest({ method: "DELETE", path: "/schedules", query: { taskId: task.id } });
      S.scheduleFor = null;
      S.scheduleForm = null;
      await loadSchedules();
      render();
      toast(t("scheduleRemoved"), "success");
    } catch (error) {
      toast(String(error && error.code || "ERR"), "error");
    }
  }
  async function serviceStates(ids, force) {
    if (!ids.length) return { data: null, error: "" };
    if (typeof host.serviceRequest !== "function") return { data: null, error: "no-service-api" };
    try {
      const query = { ids: ids.join(",") };
      if (force) query.force = "1";
      const res = await host.serviceRequest({
        method: "GET",
        path: "/states",
        query
      });
      const text = typeof res?.body === "string" ? res.body : null;
      if (!text) return { data: null, error: "empty" };
      return { data: JSON.parse(text), error: "" };
    } catch (error) {
      return { data: null, error: String(error && error.code || error && error.message || "ERR") };
    }
  }
  async function loadAll(force = false) {
    try {
      S.settings = await readSettings();
      const list = await readTasks();
      S.ids = list.map((task) => task.id);
      S.tasks = new Map(list.map((task) => [task.id, task]));
      S.live = await collectLive();
      void loadSchedules();
      recomputeBusy();
      void subscribeLive();
      const wanted = /* @__PURE__ */ new Set();
      for (const task of S.tasks.values()) {
        for (const member of task.members || []) wanted.add(member.sessionId);
      }
      const svc = await serviceStates([...wanted], force);
      const over = svc.data ? svc.data.states : null;
      S.service = /* @__PURE__ */ new Map();
      if (over) {
        for (const [id, state] of Object.entries(over)) {
          S.service.set(id, {
            running: Boolean(state && state.running),
            lastMs: Number(state && state.lastMs) || 0,
            since: Number(state && state.since) || 0
          });
          const current = S.live.get(id) || { activity: "unknown", title: "", directory: "", parentId: null };
          current.activity = state && state.running ? "running" : "idle";
          S.live.set(id, current);
        }
      }
      el2("status").textContent = svc.error ? "svc:" + svc.error : "";
      const key = JSON.stringify(list.map((task) => [task.id, task.title, task.progressDir, task.coordinator, (task.members || []).map((m) => [m.sessionId, m.title])]));
      if (key !== S.lastKey) {
        S.lastKey = key;
        render();
      } else {
        tickStates();
      }
    } catch (error) {
      el2("status").textContent = error && error.code || "ERR";
    }
  }
  async function persist(task) {
    task.updatedAt = Date.now();
    if (!S.ids.includes(task.id)) S.ids.push(task.id);
    S.tasks.set(task.id, task);
    await writeTasks(S.ids.map((id) => S.tasks.get(id)).filter(Boolean));
  }
  async function removeTask(id) {
    S.ids = S.ids.filter((x) => x !== id);
    S.tasks.delete(id);
    await writeTasks(S.ids.map((taskId) => S.tasks.get(taskId)).filter(Boolean));
    if (S.selected === id) S.selected = null;
  }
  function visibleTasks() {
    const text = S.query.trim().toLowerCase();
    let list = S.ids.map((id) => S.tasks.get(id)).filter(Boolean);
    if (text) list = list.filter((task) => String(task.title || "").toLowerCase().includes(text));
    if (S.sort === "name") list.sort((a, b) => String(a.title || "").localeCompare(String(b.title || "")));
    if (S.sort === "members") list.sort((a, b) => (b.members || []).length - (a.members || []).length);
    return list;
  }
  function currentTask() {
    const list = visibleTasks();
    return list.find((task) => task.id === S.selected) || list[0] || null;
  }
  async function gotoSession(sessionId) {
    await host.openSession(sessionId);
    if (typeof host.openSurface === "function") {
      const open = () => host.openSurface("plugin:task-hub").catch(() => {
      });
      void open();
      setTimeout(() => void open(), 500);
    }
  }
  async function runSettle(task) {
    if (!task.coordinator) {
      toast(t("noCoord"), "error");
      return;
    }
    try {
      await gotoSession(task.coordinator);
      await host.compose({ text: t("settlePrompt")(task.title || task.id, task.progressDir || ""), mode: "replace" });
      toast(t("settleQueued"), "success");
    } catch (error) {
      toast(String(error && error.code || "ERR"), "error");
    }
  }
  function isMine(task) {
    return Boolean(S.me) && (task.members || []).some((member) => member.sessionId === S.me);
  }
  function button2(label, variant, onClick, hint) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn " + (variant || "");
    b.textContent = label;
    b.onclick = onClick;
    if (hint) b.title = hint;
    return b;
  }
  function renderList() {
    const box = el2("list");
    const scroll = box.scrollTop;
    box.replaceChildren();
    const list = visibleTasks();
    if (!list.length) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = S.query ? t("noMatch") : t("none");
      box.appendChild(empty);
      return;
    }
    for (const task of list) {
      const item = document.createElement("div");
      item.className = "item" + (task === currentTask() ? " on" : "");
      item.setAttribute("role", "button");
      item.tabIndex = 0;
      item.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          item.click();
        }
      });
      if (isMine(task)) {
        const dot = document.createElement("span");
        dot.className = "dot";
        item.appendChild(dot);
      }
      const col = document.createElement("span");
      col.className = "item-col";
      const name = document.createElement("span");
      name.className = "item-name";
      name.textContent = task.title || task.id;
      const idTag = document.createElement("span");
      idTag.className = "item-id";
      idTag.textContent = task.id;
      col.append(name, idTag);
      const meta = document.createElement("span");
      meta.className = "item-meta";
      meta.textContent = String((task.members || []).length);
      item.appendChild(col);
      if (task.coordinator) {
        const jump = document.createElement("button");
        jump.type = "button";
        jump.className = "btn tiny accent";
        jump.textContent = t("coordShort");
        jump.title = t("hintJump");
        jump.onclick = (event) => {
          event.stopPropagation();
          void gotoSession(task.coordinator).catch((error) => toast(String(error && error.code || "ERR"), "error"));
        };
        item.appendChild(jump);
      }
      item.appendChild(meta);
      item.onclick = () => {
        S.selected = task.id;
        S.deleting = null;
        S.newFor = null;
        render();
      };
      item.draggable = true;
      item.addEventListener("dragstart", (event) => {
        S.dragTaskId = task.id;
        S.sort = "manual";
        if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
      });
      item.addEventListener("dragend", () => {
        S.dragTaskId = null;
        for (const node of box.querySelectorAll(".drop-target")) node.classList.remove("drop-target");
      });
      item.addEventListener("dragover", (event) => {
        if (!S.dragTaskId || S.dragTaskId === task.id) return;
        event.preventDefault();
        item.classList.add("drop-target");
      });
      item.addEventListener("dragleave", () => item.classList.remove("drop-target"));
      item.addEventListener("drop", (event) => {
        event.preventDefault();
        item.classList.remove("drop-target");
        const from = S.dragTaskId;
        S.dragTaskId = null;
        if (from && from !== task.id) void reorderTasks(from, task.id);
      });
      box.appendChild(item);
    }
    box.scrollTop = scroll;
  }
  function memberRow(task, member, index) {
    const row = document.createElement("div");
    row.className = "row";
    const handle = document.createElement("span");
    handle.className = "handle";
    handle.textContent = "⋮⋮";
    handle.draggable = true;
    handle.addEventListener("dragstart", (event) => {
      S.dragId = member.sessionId;
      row.classList.add("dragging");
      try {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", member.sessionId);
      } catch {
      }
    });
    handle.addEventListener("dragend", () => {
      S.dragId = null;
      row.classList.remove("dragging");
      for (const node of el2("detail").querySelectorAll(".drop-target")) node.classList.remove("drop-target");
    });
    row.addEventListener("dragover", (event) => {
      if (!S.dragId || S.dragId === member.sessionId) return;
      event.preventDefault();
      row.classList.add("drop-target");
    });
    row.addEventListener("dragleave", () => row.classList.remove("drop-target"));
    row.addEventListener("drop", (event) => {
      event.preventDefault();
      row.classList.remove("drop-target");
      const from = S.dragId || event.dataTransfer && event.dataTransfer.getData("text/plain");
      void reorder(task, from, member.sessionId);
    });
    const info = document.createElement("span");
    info.className = "row-info";
    const title = document.createElement("span");
    title.className = "row-name";
    const live = liveOf(member);
    const nameBtn = document.createElement("button");
    nameBtn.type = "button";
    nameBtn.className = "link";
    nameBtn.textContent = member.alias || live && live.title || member.title || member.sessionId.slice(-6);
    if (!live) {
      nameBtn.disabled = true;
      nameBtn.title = t("gone");
    } else {
      nameBtn.title = t("open");
      nameBtn.onclick = async () => {
        try {
          await gotoSession(member.sessionId);
        } catch (error) {
          toast(String(error && error.code || "ERR"), "error");
        }
      };
    }
    title.appendChild(nameBtn);
    if (task.coordinator === member.sessionId) {
      const tag = document.createElement("span");
      tag.className = "tag coord";
      tag.textContent = t("coord");
      title.appendChild(tag);
    }
    const role = member.role === "main" || member.role === "helper" ? member.role : "";
    {
      const tag = document.createElement("span");
      tag.className = "tag role-" + (role || "none");
      tag.textContent = role ? t(role === "main" ? "roleMain" : "roleHelper") : t("roleNone");
      title.appendChild(tag);
    }
    if (member.sessionId === S.me) {
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = t("thisSession");
      title.appendChild(tag);
    }
    if (!live) {
      const tag = document.createElement("span");
      tag.className = "tag bad";
      tag.textContent = t("gone");
      title.appendChild(tag);
    }
    const sub = document.createElement("span");
    sub.className = "row-sub";
    const parts = [];
    const dir = live && live.directory ? live.directory.split(/[\\/]/).filter(Boolean).pop() : member.directory;
    if (dir) parts.push(dir);
    parts.push(member.sessionId.slice(-6));
    sub.textContent = parts.join(" · ");
    info.append(title, sub);
    const state = document.createElement("span");
    state.className = "state";
    renderState(state, member);
    S.stateNodes.push({ el: state, member });
    const actions = document.createElement("span");
    actions.className = "row-actions";
    const isCoord = task.coordinator === member.sessionId;
    const roleNow = member.role === "helper" ? "helper" : "main";
    const marker = button2("⋯", isCoord ? "primary" : "", () => {
      S.openMenu = S.openMenu === member.sessionId ? null : member.sessionId;
      void renderDetail();
    });
    marker.title = t("actions");
    actions.append(marker);
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.appendChild(row);
    row.append(handle, info, state, actions);
    if (S.renaming === member.sessionId) {
      const editor = document.createElement("div");
      editor.className = "menu";
      const input = document.createElement("input");
      input.type = "text";
      input.className = "rename";
      input.value = member.alias || member.title || "";
      input.placeholder = t("alias");
      const save = button2(t("save"), "primary", () => void setAlias(task, member.sessionId, input.value));
      const cancel = button2(t("cancel"), "", () => {
        S.renaming = null;
        void renderDetail();
      });
      editor.append(input, save, cancel);
      cell.appendChild(editor);
      setTimeout(() => input.focus(), 0);
      return cell;
    }
    if (S.openMenu === member.sessionId) {
      const box = document.createElement("div");
      box.className = "menu";
      box.append(
        button2(t("setAlias"), "accent", () => {
          S.renaming = member.sessionId;
          void renderDetail();
        }),
        button2(t("copyId"), "accent", async () => {
          try {
            await host.writeClipboard(member.sessionId);
            toast(t("copyDone"), "success");
          } catch (error) {
            toast(String(error && error.code || "ERR"), "error");
          }
        }),
        button2(t("remove"), "danger", () => void dropMember(task, member.sessionId)),
        button2(isCoord ? t("clearCoord") : t("setCoord"), "accent", () => void setCoordinator(task, isCoord ? null : member.sessionId)),
        button2(t("setMain"), roleNow === "main" ? "primary" : "", () => void setRole(task, member.sessionId, "main")),
        button2(t("setHelper"), roleNow === "helper" ? "primary" : "", () => void setRole(task, member.sessionId, "helper")),
        button2(t("fillHelpers"), "accent", async () => {
          try {
            await gotoSession(member.sessionId);
            await host.compose({
              text: t("fillPrompt")(task.title || task.id, task.progressDir || "", member.title || member.sessionId.slice(-6)),
              mode: "replace"
            });
            toast(t("summaryQueued"), "success");
          } catch (error) {
            toast(String(error && error.code || "ERR"), "error");
          }
        })
      );
      cell.appendChild(box);
    }
    return cell;
  }
  function groupMembers(members) {
    const groups = /* @__PURE__ */ new Map();
    for (const member of members) {
      const live = liveOf(member);
      const dir = live && live.directory || member.directory || "";
      const key = dir ? dir.split(/[\\/]/).filter(Boolean).pop() : t("noFolder");
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(member);
    }
    return groups;
  }
  function groupState(list) {
    const states = list.map((member) => stateOf(member));
    if (states.includes("running") || states.includes("running-child")) return "running";
    if (states.includes("waiting")) return "waiting";
    if (states.includes("failed")) return "failed";
    if (states.every((s) => s === "done")) return "done";
    if (states.every((s) => s === "idle" || s === "done")) return "idle";
    return "unknown";
  }
  function paintGroupState(el3, list) {
    const value = groupState(list);
    el3.dataset.state = value;
    el3.replaceChildren();
    const icon2 = document.createElement("span");
    icon2.className = "state-icon";
    if (value === "running" || value === "running-child") {
      const spin = document.createElement("span");
      spin.className = "spin";
      icon2.appendChild(spin);
    } else {
      icon2.textContent = STATE_ICON[value] || STATE_ICON.unknown;
    }
    const text = document.createElement("span");
    text.className = "state-time";
    text.textContent = value === "running" || value === "running-child" ? t("running") : t(value) || "";
    el3.append(icon2, text);
  }
  function groupDirectory(list) {
    const dirs = [];
    let opaque = 0;
    for (const member of list) {
      const live = S.live.get(member.sessionId);
      const dir = String(live && live.directory || "");
      if (/^[A-Za-z]:[\\/]/.test(dir) || dir.startsWith("/")) {
        if (!dirs.includes(dir)) dirs.push(dir);
        continue;
      }
      if (live && dir) opaque++;
    }
    return dirs.length === 1 && opaque === 0 ? dirs[0] : "";
  }
  function newSessionEditor(task, key, list) {
    const box = document.createElement("div");
    box.className = "menu new-session";
    if (S.newCreated) {
      const note = document.createElement("div");
      note.className = "orphan";
      note.textContent = t("orphan") + " · " + S.newCreated;
      const copy = button2(t("copyId"), "accent", async () => {
        try {
          await host.writeClipboard(S.newCreated);
          toast(t("copyDone"), "success");
        } catch (error) {
          toast(String(error && error.code || "ERR"), "error");
        }
      });
      const close = button2(t("cancel"), "", () => {
        S.newCreated = "";
        S.newFor = null;
        void renderDetail();
      });
      box.append(note, copy, close);
      return box;
    }
    const input = document.createElement("input");
    input.type = "text";
    input.className = "rename";
    input.placeholder = t("newSessionTitle");
    input.value = S.newTitle;
    input.oninput = () => {
      S.newTitle = input.value;
    };
    const roleMain = button2(t("roleMain"), S.newRole === "main" ? "primary" : "", () => {
      S.newRole = "main";
      void renderDetail();
    });
    const roleHelper = button2(t("roleHelper"), S.newRole === "helper" ? "primary" : "", () => {
      S.newRole = "helper";
      void renderDetail();
    });
    const create = button2(S.newBusy ? t("creating") : t("newSession"), "primary", () => void submitNewSession(task, key, list));
    create.disabled = S.newBusy;
    const cancel = button2(t("cancel"), "", () => {
      if (S.newBusy) return;
      S.newFor = null;
      void renderDetail();
    });
    cancel.disabled = S.newBusy;
    box.append(input, roleMain, roleHelper, create, cancel);
    setTimeout(() => input.focus(), 0);
    return box;
  }
  async function submitNewSession(task, key, list) {
    if (S.newBusy) return;
    const dir = groupDirectory(list);
    if (!dir) {
      toast(t("noDirectory"), "error");
      return;
    }
    const taskId = task.id;
    const role = S.newRole;
    const title = String(S.newTitle || "").trim() || key + " - " + t("newSession");
    S.newBusy = true;
    void renderDetail();
    const res = await createSessionRequest(dir, title, "");
    S.newBusy = false;
    if (!res.id) {
      toast(String(res.error || "ERR"), "error");
      void renderDetail();
      return;
    }
    const target = S.tasks.get(taskId) || task;
    target.members = target.members || [];
    const entry = {
      sessionId: res.id,
      title,
      directory: dir.split(/[\\/]/).filter(Boolean).pop() || key,
      role
    };
    target.members.push(entry);
    try {
      await persist(target);
    } catch (error) {
      target.members = target.members.filter((m) => m.sessionId !== res.id);
      S.newCreated = res.id;
      toast(t("orphan") + " · " + String(error && error.code || "ERR"), "error");
      void renderDetail();
      return;
    }
    const stillOpen = S.newFor === key;
    if (stillOpen) {
      S.newFor = null;
      S.newTitle = "";
    }
    S.newCreated = "";
    render();
    toast(t("sessionCreated") + (stillOpen ? "" : " " + res.id), "success");
    if (stillOpen) await gotoSession(res.id);
  }
  function groupHeader(task, key, list, hasCoord) {
    const row = document.createElement("div");
    row.className = "group" + (hasCoord ? " coord" : "");
    const open = S.expanded.has(key);
    const caret = document.createElement("span");
    caret.className = "caret";
    caret.textContent = open ? "▾" : "▸";
    const name = document.createElement("span");
    name.className = "group-name";
    name.textContent = key;
    if (hasCoord) {
      const tag = document.createElement("span");
      tag.className = "tag coord";
      tag.textContent = t("coordGroup");
      name.appendChild(tag);
    }
    const count = document.createElement("span");
    count.className = "group-count";
    const mainCount = list.filter((m) => m.role !== "helper").length;
    const helperCount = list.filter((m) => m.role === "helper").length;
    count.textContent = `${mainCount} ${t("roleMain")} · ${helperCount} ${t("roleHelper")}` + (list.length > 3 ? " · " + t("overCap") : "");
    count.classList.toggle("bad", list.length > 3 || mainCount > 1);
    const state = document.createElement("span");
    state.className = "state";
    paintGroupState(state, list);
    S.groupNodes.push({ el: state, list });
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "group-toggle";
    toggle.append(caret, name, count, state);
    toggle.onclick = () => {
      if (S.expanded.has(key)) S.expanded.delete(key);
      else S.expanded.add(key);
      S.newFor = null;
      void renderDetail();
    };
    const dir = groupDirectory(list);
    const add = document.createElement("button");
    add.type = "button";
    add.className = "btn accent group-add";
    add.textContent = "+";
    add.title = dir ? t("newSession") : t("noDirectory");
    add.disabled = !dir;
    add.onclick = () => {
      if (S.newBusy) return;
      if (S.newCreated) {
        toast(t("orphan"), "error");
        return;
      }
      if (!dir) {
        toast(t("noDirectory"), "error");
        return;
      }
      S.newFor = key;
      S.newTitle = "";
      S.newRole = "helper";
      S.newBusy = false;
      S.newCreated = "";
      S.expanded.add(key);
      void renderDetail();
    };
    row.append(toggle, add);
    return row;
  }
  async function renderDetail() {
    const box = el2("detail");
    box.replaceChildren();
    S.stateNodes = [];
    S.groupNodes = [];
    const task = currentTask();
    if (!task) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = t("pick");
      box.appendChild(empty);
      return;
    }
    const head = document.createElement("div");
    head.className = "head";
    const name = document.createElement("span");
    name.className = "head-name";
    name.textContent = task.title || task.id;
    head.appendChild(name);
    const idBadge = document.createElement("span");
    idBadge.className = "tag id";
    idBadge.textContent = task.id;
    idBadge.title = "任务 id（目录名 task-<id>）";
    head.appendChild(idBadge);
    if (isMine(task)) {
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = t("you");
      head.appendChild(tag);
    }
    const headActions = document.createElement("span");
    headActions.className = "row-actions";
    const del = button2(S.deleting === task.id ? t("confirm") : t("delete"), "danger", () => {
      if (S.deleting !== task.id) {
        S.deleting = task.id;
        render();
        clearTimeout(S.deleteTimer);
        S.deleteTimer = setTimeout(() => {
          S.deleting = null;
          render();
        }, 4e3);
        return;
      }
      clearTimeout(S.deleteTimer);
      S.deleting = null;
      void removeTask(task.id).then(render);
    }, t("hintDelete"));
    const moreBtn = button2("⋯", "", () => {
      S.headMenu = !S.headMenu;
      void renderDetail();
    });
    moreBtn.title = t("actions");
    headActions.append(
      button2(t("addSession"), "accent", () => void openPicker(task), t("hintAdd")),
      moreBtn
    );
    head.appendChild(headActions);
    box.appendChild(head);
    if (S.headMenu) {
      const menu = document.createElement("div");
      menu.className = "headmenu";
      menu.append(
        button2(t("settle"), "accent", () => void runSettle(task), t("hintSettle")),
        button2(t("patrol"), "accent", async () => {
          if (!task.coordinator) {
            toast(t("noCoord"), "error");
            return;
          }
          try {
            await gotoSession(task.coordinator);
            await host.compose({ text: t("patrolPrompt")(task.title || task.id, task.progressDir || ""), mode: "replace" });
            toast(t("summaryQueued"), "success");
          } catch (error) {
            toast(String(error && error.code || "ERR"), "error");
          }
        }, t("hintPatrol")),
        button2(t("summarize"), "accent", async () => {
          if (!task.coordinator) {
            toast(t("noCoord"), "error");
            return;
          }
          try {
            await gotoSession(task.coordinator);
            await host.compose({ text: t("summaryPrompt")(task.title || task.id, task.progressDir || ""), mode: "replace" });
            toast(t("summaryQueued"), "success");
          } catch (error) {
            toast(String(error && error.code || "ERR"), "error");
          }
        }, t("hintSummary")),
        button2(t("tidyTitles"), "accent", async () => {
          if (!task.coordinator) {
            toast(t("noCoord"), "error");
            return;
          }
          try {
            await gotoSession(task.coordinator);
            await host.compose({ text: t("titlePrompt")(task.title || task.id, task.progressDir || ""), mode: "replace" });
            toast(t("summaryQueued"), "success");
          } catch (error) {
            toast(String(error && error.code || "ERR"), "error");
          }
        }, t("hintTidyTitles")),
        button2(t("schedule"), "accent", () => {
          S.scheduleFor = task.id;
          const current = S.schedules.get(task.id);
          S.scheduleForm = {
            enabled: current ? current.enabled : true,
            intervalMinutes: current ? current.intervalMinutes : 30,
            maxRuns: current ? current.maxRuns : 8,
            until: current ? current.until : defaultUntil()
          };
          void renderDetail();
        }, t("hintSchedule")),
        button2(t("edit"), "", () => openForm("edit", task), t("hintEdit")),
        del
      );
      box.appendChild(menu);
    }
    const prow = document.createElement("div");
    prow.className = "progress";
    const plabel = document.createElement("span");
    plabel.className = "progress-label";
    plabel.textContent = t("progress");
    const ppath = document.createElement("span");
    ppath.className = "progress-path";
    ppath.textContent = task.progressDir || "";
    ppath.title = task.progressDir || "";
    prow.append(plabel, ppath);
    if (!readable(task)) {
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = t("external");
      prow.appendChild(tag);
    }
    prow.append(
      button2(t("copyPath"), "", async () => {
        try {
          await host.writeClipboard(task.progressDir || "");
          toast(t("copyDone"), "success");
        } catch (error) {
          toast(String(error && error.code || "ERR"), "error");
        }
      })
    );
    box.appendChild(prow);
    const sched = S.schedules.get(task.id);
    const srow = document.createElement("div");
    srow.className = "progress";
    const slabel = document.createElement("span");
    slabel.className = "progress-label";
    slabel.textContent = t("schedule");
    srow.appendChild(slabel);
    const stext = document.createElement("span");
    stext.className = "progress-path";
    if (!sched) {
      stext.textContent = t("scheduleOff");
    } else {
      const bits = [sched.enabled ? t("scheduleOn") : t("scheduleOff")];
      bits.push(t("interval") + " " + sched.intervalMinutes);
      bits.push(t("runsOf")(sched.runs, sched.maxRuns));
      if (sched.enabled && sched.nextRunAt) {
        bits.push(t("nextRun")(new Date(sched.nextRunAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })));
      }
      if (!sched.enabled && sched.stopReason) {
        bits.push(t("scheduleStopped") + " (" + sched.stopReason + ")");
      }
      stext.textContent = bits.join(" · ");
    }
    srow.appendChild(stext);
    box.appendChild(srow);
    if (S.scheduleFor === task.id && S.scheduleForm) box.appendChild(scheduleEditor(task));
    const filesBox = document.createElement("div");
    filesBox.className = "files";
    box.appendChild(filesBox);
    if (!readable(task)) {
      const hint = document.createElement("div");
      hint.className = "warn";
      hint.textContent = t("unreadable");
      filesBox.appendChild(hint);
    } else {
      void renderFiles(task, filesBox);
    }
    const members = task.members || [];
    if (!members.length) {
      const warn = document.createElement("div");
      warn.className = "warn";
      warn.textContent = t("noPeers");
      box.appendChild(warn);
    }
    const groups = groupMembers(members);
    const entries = [...groups.entries()].map(([key, list]) => {
      const hasCoord = Boolean(task.coordinator) && list.some((m) => m.sessionId === task.coordinator);
      const st = groupState(list);
      const rank = hasCoord ? 0 : st === "running" || st === "running-child" ? 1 : st === "waiting" ? 2 : st === "failed" ? 3 : st === "done" ? 4 : 5;
      return { key, list, hasCoord, rank };
    });
    entries.sort((a, b) => a.rank - b.rank);
    if (S.expanded.size === 0 && entries.length === 1) S.expanded.add(entries[0].key);
    for (const entry of entries) {
      const ordered = [...entry.list].sort((a, b) => (b.sessionId === task.coordinator ? 1 : 0) - (a.sessionId === task.coordinator ? 1 : 0));
      box.appendChild(groupHeader(task, entry.key, entry.list, entry.hasCoord));
      if (S.newFor === entry.key) box.appendChild(newSessionEditor(task, entry.key, entry.list));
      if (!S.expanded.has(entry.key)) continue;
      const grid = document.createElement("div");
      grid.className = "members";
      for (const member of ordered) grid.appendChild(memberRow(task, member));
      box.appendChild(grid);
    }
  }
  function defaultUntil() {
    const d = /* @__PURE__ */ new Date();
    d.setHours(22, 0, 0, 0);
    if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  function scheduleEditor(task) {
    const form = S.scheduleForm;
    const box = document.createElement("div");
    box.className = "menu schedule";
    const on = button2(t("scheduleOn"), form.enabled ? "primary" : "", () => {
      form.enabled = true;
      void renderDetail();
    });
    const off = button2(t("scheduleOff"), !form.enabled ? "primary" : "", () => {
      form.enabled = false;
      void renderDetail();
    });
    const interval = document.createElement("input");
    interval.type = "number";
    interval.min = "5";
    interval.className = "rename";
    interval.value = form.intervalMinutes;
    interval.placeholder = t("interval");
    interval.title = t("interval");
    interval.oninput = () => {
      form.intervalMinutes = Number(interval.value) || 30;
    };
    const runs = document.createElement("input");
    runs.type = "number";
    runs.min = "0";
    runs.className = "rename";
    runs.value = form.maxRuns;
    runs.placeholder = t("maxRuns");
    runs.title = t("maxRuns");
    runs.oninput = () => {
      form.maxRuns = Number(runs.value) || 0;
    };
    const until = document.createElement("input");
    until.type = "datetime-local";
    until.className = "rename";
    until.value = form.until;
    until.title = t("until");
    until.oninput = () => {
      form.until = until.value;
    };
    const save = button2(t("save"), "primary", () => void saveSchedule(task));
    const del = button2(t("delete"), "danger", () => void removeSchedule(task));
    const cancel = button2(t("cancel"), "", () => {
      S.scheduleFor = null;
      S.scheduleForm = null;
      void renderDetail();
    });
    const field2 = (label, input) => {
      const wrap = document.createElement("label");
      wrap.className = "field";
      const span = document.createElement("span");
      span.textContent = label;
      wrap.append(span, input);
      return wrap;
    };
    box.append(on, off, field2(t("interval"), interval), field2(t("maxRuns"), runs), field2(t("until"), until), save, del, cancel);
    return box;
  }
  async function renderFiles(task, box) {
    const files = await progressFiles(task);
    const rows = await Promise.all(
      files.map(async (file) => {
        if (file.group === "dir") {
          const listing = await host.listDir(file.path).catch(() => null);
          const entries = listing ? (listing.entries || []).filter((e) => e.kind === "file") : [];
          return { ...file, count: entries.length, names: entries.map((e) => e.name) };
        }
        const info = await statPath(file.path);
        return { ...file, info, size: info ? info.size : 0 };
      })
    );
    box.replaceChildren();
    const breaches = rows.filter((r) => r.budget && r.size >= r.budget * 0.8).sort((a, b) => b.size / b.budget - a.size / a.budget);
    if (breaches.length) {
      const worst = breaches[0];
      const pct = Math.round(worst.size / worst.budget * 100);
      const alert = document.createElement("div");
      alert.className = "alert" + (pct >= 100 ? " bad" : "");
      const text = document.createElement("span");
      text.className = "alert-text";
      text.textContent = t("overBudget") + " · " + worst.name + " " + pct + "%";
      alert.append(text, button2(t("settle"), "accent", () => void runSettle(task), t("hintSettle")));
      box.appendChild(alert);
    }
    const makeChip = (row, label) => {
      const el3 = document.createElement("span");
      el3.className = "file" + (row.info || row.group === "dir" ? "" : " missing");
      el3.textContent = row.name + " · " + label;
      const role = t("fileRole")(row.name);
      el3.title = row.path + (role ? "\n" + role : "");
      if (row.group === "dir") el3.classList.add("dir");
      if (row.group === "core" || row.group === "progress") {
        const owner = row.group === "progress" ? progressOwner(task, row.name) : null;
        const who = owner ? owner.alias || owner.title || owner.sessionId.slice(-6) : t("ownerCoord");
        const over = row.budget && row.size >= row.budget * 0.8;
        const fix = document.createElement("button");
        fix.type = "button";
        fix.className = "btn tiny" + (over ? " accent" : "");
        fix.textContent = t("converge");
        fix.title = t("convergeHint")(who);
        fix.onclick = (event) => {
          event.stopPropagation();
          void convergeFile(task, row);
        };
        el3.appendChild(fix);
      }
      return el3;
    };
    for (const row of rows.filter((r) => r.group === "core")) {
      const el3 = makeChip(row, row.info ? humanSize(row.size) : "—");
      if (row.info) {
        el3.classList.add("click");
        el3.onclick = () => void openReader(row.name, row.path);
      }
      if (row.budget && row.size > 0) {
        el3.appendChild(budgetBar(row.size, row.budget));
        if (row.size >= row.budget) el3.classList.add("bad");
      }
      box.appendChild(el3);
    }
    const progressRows = rows.filter((r) => r.group === "progress");
    if (progressRows.length) {
      const total = progressRows.reduce((a, r) => a + r.size, 0);
      const max = progressRows.reduce((a, r) => Math.max(a, r.size), 0);
      const head = document.createElement("span");
      head.className = "file click dir";
      head.textContent = "progress/ · " + progressRows.length + " · " + humanSize(total) + " · max " + humanSize(max);
      head.title = S.filesOpen ? t("foldFiles") : t("unfoldFiles")(progressRows.length);
      head.onclick = () => {
        S.filesOpen = !S.filesOpen;
        void renderDetail();
      };
      box.appendChild(head);
      if (S.filesOpen) {
        for (const row of progressRows) {
          const el3 = makeChip(row, row.info ? humanSize(row.size) : "—");
          if (row.info) {
            el3.classList.add("click");
            el3.onclick = () => void openReader(row.name, row.path);
          }
          if (row.size > 0) el3.appendChild(budgetBar(row.size, row.budget));
          if (row.size >= row.budget) el3.classList.add("bad");
          box.appendChild(el3);
        }
      } else if (progressRows.some((r) => r.size >= r.budget)) {
        head.classList.add("bad");
      }
    }
    const dirRows = rows.filter((r) => r.group === "dir");
    if (dirRows.length) {
      const dirs = document.createElement("div");
      dirs.className = "dirs";
      const label = document.createElement("span");
      label.className = "dirs-label";
      label.textContent = t("folders");
      dirs.appendChild(label);
      for (const row of dirRows) {
        const el3 = makeChip(row, row.count ? row.count + " 个文件" : t("dirEmpty"));
        el3.classList.add("click");
        el3.onclick = () => void openReader(row.name, row.path, row.names.length ? row.names.join("\n") : t("dirEmpty"));
        dirs.appendChild(el3);
      }
      box.after(dirs);
    }
  }
  function progressOwner(task, name) {
    const m = String(name).match(/^progress-([A-Za-z0-9]+)\.md$/);
    if (!m) return null;
    return (task.members || []).find((x) => String(x.sessionId || "").endsWith(m[1])) || null;
  }
  async function convergeFile(task, row) {
    const kind = row.group === "progress" ? "progress" : "core";
    const owner = kind === "progress" ? progressOwner(task, row.name) : null;
    const target = kind === "progress" ? owner && owner.sessionId : task.coordinator;
    if (!target) {
      toast(t("noOwner"), "error");
      return;
    }
    try {
      await gotoSession(target);
      await host.compose({
        text: t("convergePrompt")(task.title || task.id, task.progressDir || "", row.name, kind),
        mode: "replace"
      });
      toast(t("convergeQueued"), "success");
    } catch (error) {
      toast(String(error && error.code || "ERR"), "error");
    }
  }
  function budgetBar(size, budget) {
    const bar = document.createElement("span");
    bar.className = "bar";
    const ratio = budget ? size / budget : 0;
    if (ratio >= 1) bar.classList.add("full");
    else if (ratio >= 0.8) bar.classList.add("warn");
    const fill = document.createElement("i");
    fill.style.width = Math.min(100, Math.round(ratio * 100)) + "%";
    bar.appendChild(fill);
    bar.title = humanSize(size) + " / " + humanSize(budget);
    return bar;
  }
  async function openReader(name, path, preset) {
    const mask = document.createElement("div");
    mask.className = "reader-mask";
    const box = document.createElement("div");
    box.className = "reader";
    const head = document.createElement("div");
    head.className = "reader-head";
    const title = document.createElement("span");
    title.className = "reader-name";
    title.textContent = name;
    head.appendChild(title);
    const close = button2(t("readerClose"), "", () => mask.remove());
    mask.onclick = (event) => {
      if (event.target === mask) mask.remove();
    };
    const body = document.createElement("pre");
    body.className = "reader-body";
    box.append(head, body);
    mask.appendChild(box);
    document.body.appendChild(mask);
    let text = preset || "";
    if (!text) {
      try {
        const result = await host.readFile(path);
        text = String(result && result.content || "");
      } catch (error) {
        text = String(error && error.code || t("readFail"));
      }
    }
    const lines = text.split(/\r?\n/);
    body.textContent = lines.slice(0, 200).join("\n") || t("dirEmpty");
    if (lines.length > 200) {
      const note = document.createElement("div");
      note.className = "reader-note";
      note.textContent = t("readerTruncated") + " · " + lines.length + " 行";
      box.appendChild(note);
    }
    const copy = button2(t("readerCopy"), "accent", async () => {
      try {
        await host.writeClipboard(text);
        toast(t("copyDone"), "success");
      } catch (error) {
        toast(String(error && error.code || "ERR"), "error");
      }
    });
    head.append(copy, close);
  }
  function humanSize(size) {
    if (!size) return "0";
    if (size < 1024) return size + "B";
    if (size < 1024 * 1024) return Math.round(size / 1024) + "K";
    return (size / 1024 / 1024).toFixed(1) + "M";
  }
  function render() {
    el2("count").textContent = String(visibleTasks().length);
    renderList();
    void renderDetail();
  }
  function toast(message, kind) {
    const box = el2("toast");
    box.textContent = message;
    box.className = "toast show " + (kind || "");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => {
      box.className = "toast";
    }, 2200);
  }
  async function reorderTasks(fromId, toId) {
    const from = S.ids.indexOf(fromId);
    const to = S.ids.indexOf(toId);
    if (from < 0 || to < 0 || from === to) return;
    S.ids.splice(from, 1);
    S.ids.splice(to, 0, fromId);
    await writeTasks(S.ids.map((id) => S.tasks.get(id)).filter(Boolean));
    render();
  }
  async function reorder(task, fromId, toId) {
    if (!fromId || !toId || fromId === toId) return;
    const members = task.members || [];
    const from = members.findIndex((m) => m.sessionId === fromId);
    const to = members.findIndex((m) => m.sessionId === toId);
    if (from < 0 || to < 0) return;
    const [row] = members.splice(from, 1);
    members.splice(to, 0, row);
    await persist(task);
    render();
  }
  async function dropMember(task, sessionId) {
    task.members = (task.members || []).filter((m) => m.sessionId !== sessionId);
    if (task.coordinator === sessionId) task.coordinator = null;
    await persist(task);
    render();
  }
  async function setCoordinator(task, sessionId) {
    task.coordinator = sessionId;
    await persist(task);
    render();
  }
  async function setRole(task, sessionId, role) {
    const member = (task.members || []).find((m) => m.sessionId === sessionId);
    if (!member) return;
    member.role = role;
    await persist(task);
    render();
  }
  async function setAlias(task, sessionId, value) {
    const member = (task.members || []).find((m) => m.sessionId === sessionId);
    if (!member) return;
    const text = String(value || "").trim();
    if (text) member.alias = text;
    else delete member.alias;
    S.renaming = null;
    S.openMenu = null;
    await persist(task);
    render();
  }
  async function addMember(task, row) {
    task.members = task.members || [];
    if (task.members.some((m) => m.sessionId === row.id)) {
      toast(t("already"), "");
      return;
    }
    task.members.push({ sessionId: row.id, title: row.title, directory: row.project });
    await persist(task);
    closePicker();
    render();
    toast(t("added"), "success");
  }
  function defaultDir() {
    const root = (S.settings.progressRoot || DEFAULT_ROOT).replace(/\/+$/, "");
    return root + "/<id>";
  }
  function openForm(mode, task) {
    S.formMode = mode;
    S.formId = task ? task.id : null;
    el2("f-heading").textContent = mode === "edit" ? t("edit") : t("newTask");
    el2("f-title").value = task ? task.title || "" : "";
    el2("f-goal").value = task ? task.goal || "" : "";
    el2("f-accept").value = task ? task.acceptance || "" : "";
    el2("f-dir").value = task ? task.progressDir || "" : defaultDir();
    el2("f-dir-hint").textContent = t("folderHint");
    el2("form").classList.add("show");
    el2("f-title").focus();
  }
  function closeForm() {
    el2("form").classList.remove("show");
  }
  async function registerProject(task) {
    if (typeof host.serviceRequest !== "function") return;
    const dir = String(task.progressDir || "").replace(/^~/, "C:\\Users\\HUAWEI").replace(/\//g, "\\");
    if (!dir) return;
    try {
      await host.serviceRequest({
        method: "POST",
        path: "/registerProject",
        // 侧栏项目名与任务 id 对得上：标题 · task-<id>。
        body: { dir, label: (task.title || task.id) + " · " + task.id }
      });
    } catch {
    }
  }
  async function submitForm() {
    const title = el2("f-title").value.trim();
    const goal = el2("f-goal").value.trim();
    const acceptance = el2("f-accept").value.trim();
    if (!title || !goal || !acceptance) {
      toast(t("must"), "error");
      return;
    }
    const dir = el2("f-dir").value.trim() || defaultDir();
    if (S.formMode === "edit" && S.formId) {
      const task2 = S.tasks.get(S.formId);
      if (!task2) return;
      task2.title = title;
      task2.goal = goal;
      task2.acceptance = acceptance;
      task2.progressDir = dir;
      await persist(task2);
      await ensureFolder(task2, false);
      closeForm();
      render();
      toast(t("updated"), "success");
      return;
    }
    const id = "task-" + Date.now().toString(36).slice(-6);
    const task = {
      id,
      title,
      goal,
      acceptance,
      progressDir: dir.includes("<id>") ? dir.replace("<id>", id) : dir,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      members: S.me ? [{ sessionId: S.me, title: S.meTitle }] : []
    };
    await persist(task);
    await ensureFolder(task, true);
    await registerProject(task);
    S.selected = task.id;
    closeForm();
    render();
    toast(t("created"), "success");
  }
  function renderPicker() {
    const box = el2("p-list");
    box.replaceChildren();
    const text = S.pickQ.trim().toLowerCase();
    const rows = S.pickRows.filter(
      (row) => !text || row.title.toLowerCase().includes(text) || row.project.toLowerCase().includes(text) || row.id.toLowerCase().includes(text)
    );
    if (!rows.length) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = t("noSessions");
      box.appendChild(empty);
      return;
    }
    for (const row of rows) {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "pick";
      const name = document.createElement("span");
      name.className = "pick-name";
      name.textContent = row.title;
      const sub = document.createElement("span");
      sub.className = "pick-sub";
      sub.textContent = row.project + " · " + row.id.slice(-6);
      item.append(name, sub);
      item.onclick = () => {
        const task = currentTask();
        if (task) void addMember(task, row);
      };
      box.appendChild(item);
    }
  }
  async function openPicker(task) {
    S.pickQ = "";
    S.pickRows = [];
    el2("p-search").value = "";
    el2("p-hint").textContent = t("addTo") + " 「" + (task.title || task.id) + "」";
    el2("p-list").textContent = t("loading");
    el2("picker").classList.add("show");
    const rows = [];
    const snapshot = await host.listProjects().catch(() => null);
    const projects = snapshot && Array.isArray(snapshot.projects) ? snapshot.projects : [];
    for (const project of projects) {
      const sessionsSnapshot = await host.listSessions(project.id).catch(() => null);
      const sessions = sessionsSnapshot && Array.isArray(sessionsSnapshot.sessions) ? sessionsSnapshot.sessions : [];
      for (const session of sessions) {
        if (session.parentId || session.archivedAt) continue;
        rows.push({
          id: session.id,
          title: session.title || session.id,
          project: project.name || project.directory || ""
        });
      }
    }
    rows.sort((a, b) => a.title.localeCompare(b.title));
    S.pickRows = rows;
    renderPicker();
  }
  function closePicker() {
    el2("picker").classList.remove("show");
  }
  async function autoTick() {
    if (document.querySelector(".sheet.show") || S.dragId) return;
    await loadAll();
  }
  function setAuto(on) {
    const btn = el2("auto");
    if (on && !S.auto) {
      S.auto = setInterval(() => void autoTick(), AUTO_MS);
      btn.classList.add("active");
      btn.textContent = t("auto");
      void autoTick();
      return;
    }
    if (!on && S.auto) {
      clearInterval(S.auto);
      S.auto = 0;
      btn.classList.remove("active");
      btn.textContent = t("auto");
    }
  }
  function toggleAuto() {
    const next = !S.auto;
    setAuto(next);
    host.storage.set(AUTO_KEY, next).catch(() => {
    });
  }
  host.onReady((ctx) => {
    applyHostReady(ctx, document.documentElement);
    document.documentElement.dataset.theme = ctx.theme.mode;
    S.loc = String(ctx.locale || "en").toLowerCase().startsWith("zh") ? "zh" : "en";
    if (ctx.session && ctx.session.id) {
      S.me = ctx.session.id;
      S.meTitle = ctx.session.title || "";
    }
    el2("app-title").textContent = t("tasks");
    el2("new").textContent = t("newTask");
    el2("refresh").textContent = t("refresh");
    el2("auto").textContent = t("auto");
    el2("search").placeholder = t("search");
    el2("sort-label").textContent = t("sort");
    el2("sort").options[0].textContent = t("manual");
    el2("sort").options[1].textContent = t("name");
    el2("sort").options[2].textContent = t("members");
    el2("f-save").textContent = t("save");
    el2("f-cancel").textContent = t("cancel");
    el2("f-title").placeholder = t("title");
    el2("f-goal").placeholder = t("goal");
    el2("f-accept").placeholder = t("accept");
    el2("p-close").textContent = t("close");
    el2("p-search").placeholder = t("searchSessions");
    el2("f-dir").placeholder = DEFAULT_ROOT + "/<id>";
    if (S.mounted) return;
    S.mounted = true;
    if (!S.ticker) S.ticker = setInterval(tickStates, 1e3);
    el2("refresh").onclick = () => void loadAll(true);
    el2("search-toggle").onclick = () => {
      const top = document.querySelector(".top");
      if (!top) return;
      top.classList.toggle("search-open");
      if (top.classList.contains("search-open")) el2("search").focus();
    };
    el2("auto").onclick = () => toggleAuto();
    el2("new").onclick = () => openForm("create", null);
    el2("f-cancel").onclick = () => closeForm();
    el2("f-save").onclick = () => void submitForm();
    el2("p-close").onclick = () => closePicker();
    el2("p-search").oninput = (event) => {
      S.pickQ = event.target.value;
      renderPicker();
    };
    el2("search").oninput = (event) => {
      S.query = event.target.value;
      render();
    };
    el2("sort").onchange = (event) => {
      S.sort = event.target.value;
      render();
    };
    void loadAll();
    void host.storage.get(AUTO_KEY).then((value) => {
      if (value === void 0 || value === true) setAuto(true);
    }).catch(() => setAuto(true));
  });
})();
