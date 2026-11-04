import { connectHost } from "@openchamber/sdk"
import { applyHostReady } from "@openchamber/sdk/ui"

const host = connectHost()
const el = (id) => document.getElementById(id)

const DEFAULT_ROOT = "~/.task-hub"
const FILE_TASKS = "~/.task-hub/tasks.json"
const FILE_SETTINGS = "~/.task-hub/settings.json"
const KEY_SELECTED = "taskhub.selected"
const AUTO_KEY = "taskhub.auto"
const AUTO_MS = 1500

const DICT = {
  en: {
    tasks: "Tasks", auto: "Auto", on: "On", newTask: "New", refresh: "Refresh",
    search: "Search tasks", sort: "Sort", manual: "Manual", name: "Name", members: "Sessions",
    none: "No tasks yet", noMatch: "No matching tasks", pick: "Pick a task on the left",
    you: "You", edit: "Edit", addSession: "Add session", delete: "Delete", confirm: "Click again",
    progress: "Progress folder", copyPath: "Copy path", copyDone: "Path copied",
    external: "external", unreadable: "External folder: the panel records and copies the path but does not read its files.",
    readFail: "Cannot read folder",
    running: "running", runningChild: "subagent", waiting: "waiting", idle: "idle", failed: "failed", unknown: "—",
    lastTurn: "last", done: "done", noFolder: "no folder",
    roleMain: "main", roleHelper: "helper", roleNone: "unset", actions: "Actions",
    setMain: "Make main", setHelper: "Make helper",
    fillHelpers: "Fill helpers", overCap: "over 3", noCoord: "No coordinator set", copyId: "Copy id", alias: "Display name", setAlias: "Rename", tidyTitles: "Tidy titles",
    newSession: "New session", newSessionTitle: "Session name", newSessionRole: "Role", noDirectory: "This group has no absolute path to create in", sessionCreated: "Session created", creating: "Creating",
    orphan: "Created but not saved to the roster",
    fillPrompt: (title, dir, member) =>
      "For task \"" + title + "\" add helper sessions for the worktree of \"" + member + "\". Read " + dir + " first. " +
      "Keep each worktree to at most three sessions: one main line plus up to two helpers for small jobs such as reading code, checking a fact, or a quick question. " +
      "If that worktree has no helper yet, create one with session.create in the same directory, give it a title naming the worktree and the purpose, and send one short first message: task name, progress folder, its own progress-<last 6 of its id>.md, and what to do. " +
      "Register it in tasks.json members with role: \"helper\" and log it in that worktree's .dispatch.json. If it already has three, say which ones to merge or close instead. Start every message with your own role (main or helper).",
    settle: "Collect and tidy",
    settleQueued: "Switched to the coordinator, the tidy-up brief is in its chat box",
    settlePrompt: (title, dir) =>
      "Tidy task \"" + title + "\" now, following rules/task-collab.md section 8, and report only after all four steps.\n\n" +
      "1. Summarize: read " + dir + "/HEAD.md, SUMMARY.md, RUNBOOK.md and the recently changed progress-*.md; overwrite HEAD.md with the current state (<=40 lines: state / doing / blocked / next / sources). Do not append.\n" +
      "2. Archive: when SUMMARY.md exceeds 300 lines or a progress-<id>.md exceeds 400 lines, move the earliest half to " + dir + "/archive/<name>-<YYYY-MM>.md, keep the latest half plus the pointer line at the top. Before archiving, lift any reusable operating knowledge (start commands, environment addresses, config ids, pitfalls) into RUNBOOK.md.\n" +
      "3. Tidy: move finished deliverables scattered in the task folder (test package, design, DMS draft, config change log, checklists, pending replies, message drafts) into " + dir + "/deliverables/. Move only what is clearly a deliverable; list the uncertain ones for me. Delete nothing.\n" +
      "4. Report: one line on which files changed, how many lines were archived, and HEAD in three sentences; list anything that needs my decision separately.\n\n" +
      "Credentials: write where they live, never their value. Do not touch business code, do not commit, push or merge.",
    patrol: "Run a patrol",
    patrolPrompt: (title, dir) =>
      "Run one patrol round for task \"" + title + "\" as the coordinator. Read C:\\Users\\HUAWEI\\.task-hub\\tasks.json and " + dir + ", then SUMMARY.md and the progress-*.md that changed this round. Sort every member into running / can-advance / needs-user / done. Send only the can-advance ones a four-part message (new info / one checkable action / stop condition / which file to write, with 【回话】 and returnResult). Append sourced conclusions to SUMMARY.md. Ask me only on hard boundaries (production change, deleting data, merging master or release, messaging outside systems); settle wording and implementation choices from the records yourself and say what you decided. Report every member as \"name + full session id\".",
    summarize: "Ask coordinator", jumpCoord: "Open coordinator", summaryQueued: "Switched to the coordinator, prompt is in its chat box",
    summaryPrompt: (title, dir) =>
      "Summarize task \"" + title + "\" now. Read " + dir + "/SUMMARY.md and every progress-*.md, then answer in six parts: 1) one-line status, 2) done, 3) in progress, 4) blocked / waiting on whom, 5) pitfalls hit so far with where they live, 6) next three actions. Append settled conclusions to SUMMARY.md with their source; leave open items in the progress files.",
    titlePrompt: (title, dir) =>
      "Tidy the session names for task \"" + title + "\". Read tasks.json and " + dir + ", then for every member set alias to \"<short project> - <what it is doing now>\": take the short project name from its worktree or directory (for example 微服务, 收银后端, goframe, cashier, H5), and describe the current concrete job from the newest progress file rather than the opening greeting. Rename the session itself with session_rename when you are sure; skip when the evidence is thin and list those instead. Write the result back to tasks.json and report each change as old -> new with the reason.",
    coord: "coordinator", coordGroup: "coordinator here", setCoord: "Make coordinator", clearCoord: "Unset coordinator",
    compose: "To chat box", composed: "Added to the chat box, send it yourself",
    remove: "Remove", open: "Open this session", gone: "Session not found",
    save: "Save", cancel: "Cancel", title: "Task name", goal: "What it is", accept: "Done when",
    folder: "Progress folder", folderHint: "Home paths (~/...) are readable. Other paths are recorded only.",
    must: "Name, what it is and done-when are required",
    created: "Task created", updated: "Saved", added: "Session added", already: "Already in this task",
    addTo: "Add to", close: "Close", searchSessions: "Search sessions",
    noSessions: "No sessions found", loading: "Loading", noPeers: "No session yet",
    newFolder: "Folder", thisSession: "this session"
  },
  zh: {
    tasks: "任务", auto: "自动", on: "开", newTask: "新建", refresh: "刷新",
    search: "搜索任务", sort: "排序", manual: "手动", name: "名称", members: "会话数",
    none: "还没有任务", noMatch: "没有匹配的任务", pick: "左边选一件任务",
    you: "你在里面", edit: "编辑", addSession: "加会话", delete: "删除", confirm: "再点删除",
    progress: "进度目录", copyPath: "复制路径", copyDone: "路径已复制",
    external: "外部", unreadable: "外部目录：面板只记录和复制路径，不读取里面的文件。", readFail: "读不到目录",
    running: "运行中", runningChild: "子代理", waiting: "等待", idle: "空闲", failed: "失败", unknown: "—",
    lastTurn: "上轮", done: "完成", noFolder: "无目录",
    roleMain: "主线", roleHelper: "辅助", roleNone: "未标", actions: "操作",
    setMain: "设为主线", setHelper: "设为辅助",
    fillHelpers: "补充看板会话", overCap: "超过三个", noCoord: "这件任务还没设协调会话", copyId: "复制会话 id", alias: "显示名", setAlias: "改标题", tidyTitles: "让协调整理标题",
    newSession: "新会话", newSessionTitle: "会话名", newSessionRole: "角色", noDirectory: "这一组拿不到绝对路径，不能建会话", sessionCreated: "已建会话", creating: "创建中",
    orphan: "会话已建，但没写进名册",
    fillPrompt: (title, dir, member) =>
      "针对任务「" + title + "」，给「" + member + "」所在的 worktree 补充辅助会话。先读 " + dir + "。" +
      "每个 worktree 最多三个会话：一个主线推进会话，另有至多两个辅助会话，专门做查代码、核事实、小问询这类小活。" +
      "如果那个 worktree 还没有辅助会话，用 session.create 在它的同目录建一个：标题写明 worktree 名和用途；首条消息只写四样——任务名、进度目录、它自己的 progress-<id后6位>.md、要它做什么。" +
      "建完写进 tasks.json 的 members，带 role: \"helper\"，并在该 worktree 的 .dispatch.json 记一行。已经满三个的，说明哪些该合并或结束，不要再加。" +
      "你发出的每条消息第一行写明自己的角色（主线或辅助）。",
    settle: "让协调收拢",
    settleQueued: "已切到协调会话，收拢指令在它的输入框里",
    settlePrompt: (title, dir) =>
      "现在对任务「" + title + "」做一次收拢，按 rules/task-collab.md 第八节执行，四步做完再回报。\n\n" +
      "1. 汇总：读 " + dir + "/HEAD.md、SUMMARY.md、RUNBOOK.md 和最近变化的 progress-*.md，把 HEAD.md 覆盖写成当前状态（≤40 行：状态 / 正在做 / 卡在哪 / 下一步 / 出处），不追加。\n" +
      "2. 归档：SUMMARY.md 超过 300 行、某份 progress-<id>.md 超过 400 行，就把最早一半移到 " + dir + "/archive/<原文件名>-<YYYY-MM>.md，正文留最近一半并保留顶部指针行；归档前先把里面可复用的操作知识（启动命令、环境地址、配置 id、踩过的坑）提到 RUNBOOK.md。\n" +
      "3. 整理：把散在任务目录里的成品（提测资料、方案、DMS 工单草稿、配置变更记录、清单、待发回复、沟通文本）移进 " + dir + "/deliverables/；只移动明确是成品的，拿不准的列出来问我，不删任何文件。\n" +
      "4. 回报：一行说清改了哪些文件、归档了多少行、HEAD 现在的三句话；需要我拍板的单独列。\n\n" +
      "凭据只写位置不写值；不要动业务代码，不要提交、推送、合并。",
    patrol: "让协调巡检",
    patrolPrompt: (title, dir) =>
      "现在按信箱调度跑一轮巡检任务「" + title + "」。先读 C:\\Users\\HUAWEI\\.task-hub\\tasks.json 和 " + dir + "，再读 SUMMARY.md 与本轮有变化的 progress-*.md。对每个成员分在跑 / 可推进 / 等你定 / 已完成；只给可推进的发一条四段式消息（新信息 / 一个可验收动作 / 停止条件 / 写回路径，带【回话】和 returnResult）；有出处的结论写进 SUMMARY.md；命中硬边界（生产改动、删数据、合并 master 或 release、对外发消息）才问我，口径与实现选择按记录自己定并写明依据。成员一律报「名称 + 完整 session id」。",
    summarize: "让协调总结", jumpCoord: "跳到协调", summaryQueued: "已切到协调会话，提示词在它的输入框里",
    summaryPrompt: (title, dir) =>
      "现在总结任务「" + title + "」。先读 " + dir + "/SUMMARY.md 和所有 progress-*.md，然后按六段回答：1) 一句话现状 2) 已完成 3) 进行中 4) 卡住的地方与在等谁 5) 已经踩过的坑及各自位置 6) 接下来三步。把已定的结论带出处追加进 SUMMARY.md，未定的留在各 progress 文件里。",
    titlePrompt: (title, dir) =>
      "整理任务「" + title + "」下所有会话的名字。先读 tasks.json 和 " + dir + "。对每个成员，把 alias 设成「项目简称 - 现在在做什么」：项目简称取它所在 worktree 或目录名（例如 微服务、收银后端、goframe、cashier、H5），具体任务从最新的 progress 文件里看，不要照抄标题开头那句问候。有把握时用 session_rename 把会话本体也改成同样的名字；证据不足的跳过并在回报里列出来。改完写回 tasks.json，并把每处改动以「旧名 → 新名（依据）」列给我。",
    coord: "协调", coordGroup: "协调所在", setCoord: "标识协调会话", clearCoord: "取消协调",
    compose: "放入聊天框", composed: "已放入聊天框，确认后自己发送",
    remove: "移除", open: "打开这个会话", gone: "会话不存在",
    save: "保存", cancel: "取消", title: "任务名", goal: "做什么", accept: "验收是什么",
    folder: "进度目录", folderHint: "家目录（~/…）可读；其他路径只记录，不读内容。",
    must: "任务名、做什么、验收都要填",
    created: "已建任务", updated: "已保存", added: "已加会话", already: "这一方已经在里面",
    addTo: "加进", close: "关闭", searchSessions: "搜索会话",
    noSessions: "没读到会话", loading: "读取中", noPeers: "还没有协作方",
    newFolder: "目录", thisSession: "本会话"
  }
}

const S = {
  ids: [], tasks: new Map(), settings: { progressRoot: DEFAULT_ROOT },
  selected: null, query: "", sort: "manual", me: null, meTitle: "",
  live: new Map(), busy: new Set(), service: new Map(), subscribed: new Set(), since: new Map(), stateNodes: [], groupNodes: [], expanded: new Set(), openMenu: null, headMenu: false, renaming: null, lastKey: "", ticker: 0, loc: "en", auto: 0, mounted: false,
  formMode: "create", formId: null, pickQ: "", pickRows: [], pickProjects: 0,
  newFor: null, newTitle: "", newRole: "helper", newBusy: false, newCreated: "",
  deleting: null, deleteTimer: 0, dragId: null
}

const t = (key) => (DICT[S.loc] && DICT[S.loc][key]) || DICT.en[key] || key

function fmtElapsed(ms) {
  const total = Math.max(0, Math.round(ms / 1000))
  if (total < 60) return total + "s"
  const m = Math.floor(total / 60)
  const s = total % 60
  return m + "m" + (s ? s + "s" : "")
}

/* 运行中的会话按秒跳动：宿主只给 activity，不给起点，所以从面板第一次看到 running 开始计时。 */
function tickStates() {
  for (const item of S.stateNodes) renderState(item.el, item.member)
  for (const item of S.groupNodes) paintGroupState(item.el, item.list)
}

/* ---------------- data files ---------------- */

async function readJson(path, fallback) {
  try {
    const { content } = await host.readFile(path)
    const parsed = JSON.parse(content)
    return parsed && typeof parsed === "object" ? parsed : fallback
  } catch {
    return fallback
  }
}

async function writeJson(path, value) {
  await host.writeFile(path, JSON.stringify(value, null, 2) + "\n")
}

async function readSettings() {
  const value = await readJson(FILE_SETTINGS, {})
  const root = typeof value.progressRoot === "string" && value.progressRoot.startsWith("~/")
    ? value.progressRoot.replace(/\/+$/, "")
    : DEFAULT_ROOT
  return { progressRoot: root }
}

async function readTasks() {
  const value = await readJson(FILE_TASKS, { version: 1, tasks: [] })
  const list = Array.isArray(value.tasks) ? value.tasks : []
  return list.filter((task) => task && typeof task.id === "string").map((task) => {
    if (!Array.isArray(task.members)) task.members = []
    return task
  })
}

async function writeTasks(list) {
  await writeJson(FILE_TASKS, { version: 1, tasks: list })
}

/* ---------------- progress folder ---------------- */

function readable(task) {
  return typeof task.progressDir === "string" && task.progressDir.startsWith("~/")
}

function progressFiles(task) {
  const dir = task.progressDir || ""
  const files = [
    { name: "README.md", path: dir + "/README.md" },
    { name: "SUMMARY.md", path: dir + "/SUMMARY.md" }
  ]
  for (const member of task.members || []) {
    const suffix = String(member.sessionId || "").slice(-6)
    if (!suffix) continue
    files.push({ name: "progress-" + suffix + ".md", path: dir + "/progress-" + suffix + ".md" })
  }
  return files
}

async function statPath(path) {
  try {
    const info = await host.stat(path)
    return info && info.kind === "file" ? info : null
  } catch {
    return null
  }
}

function readmeText(task) {
  const lines = [
    "# " + (task.title || task.id),
    "",
    "- task: " + task.id,
    "- goal: " + (task.goal || ""),
    "- done when: " + (task.acceptance || ""),
    "",
    "## Sessions"
  ]
  for (const member of task.members || []) {
    lines.push("- " + (member.title || "session") + " (" + member.sessionId + ")")
  }
  lines.push(
    "",
    "## How we write here",
    "1. Each session writes only progress-<last 6 of its id>.md: facts, current state, who owes an answer.",
    "2. Do not edit other people's files; to change a decision, write it in your own file and name them.",
    "3. SUMMARY.md holds settled conclusions only; undecided items stay in the progress files."
  )
  return lines.join("\n") + "\n"
}

async function ensureFolder(task, force) {
  if (!readable(task)) return
  const dir = task.progressDir.replace(/\/+$/, "")
  const readme = dir + "/README.md"
  if (force || !(await statPath(readme))) {
    await host.writeFile(readme, readmeText(task)).catch(() => {})
  }
  const summary = dir + "/SUMMARY.md"
  if (!(await statPath(summary))) {
    await host.writeFile(summary, "# " + (task.title || task.id) + " · summary\n\nSettled conclusions only.\n").catch(() => {})
  }
}

/* ---------------- sessions ---------------- */

function recomputeBusy() {
  const busy = new Set()
  for (const [id, info] of S.live) {
    if (info.activity !== "running" && info.activity !== "retrying") continue
    let cursor = info.parentId
    let guard = 0
    while (cursor && S.live.has(cursor) && guard < 20) {
      busy.add(cursor)
      cursor = S.live.get(cursor).parentId
      guard += 1
    }
  }
  S.busy = busy
}

function mergeSessions(sessions, projectDirectory) {
  for (const session of sessions) {
    S.live.set(session.id, {
      activity: session.activity || "unknown",
      title: session.title || "",
      directory: session.directory || projectDirectory || "",
      parentId: session.parentId || null
    })
  }
  recomputeBusy()
}

let repaintTimer = 0
function scheduleRepaint() {
  if (repaintTimer) return
  repaintTimer = setTimeout(() => {
    repaintTimer = 0
    tickStates()
  }, 120)
}

async function subscribeLive() {
  const snapshot = await host.listProjects().catch(() => null)
  const projects = snapshot && Array.isArray(snapshot.projects) ? snapshot.projects : []
  for (const project of projects) {
    if (S.subscribed.has(project.id)) continue
    S.subscribed.add(project.id)
    try {
      await host.onSessions(project.id, (snap) => {
        if (!snap || !Array.isArray(snap.sessions)) return
        mergeSessions(snap.sessions, project.directory)
        scheduleRepaint()
      })
    } catch {
      S.subscribed.delete(project.id)
    }
  }
}

async function collectLive() {
  const map = new Map()
  const snapshot = await host.listProjects().catch(() => null)
  const projects = snapshot && Array.isArray(snapshot.projects) ? snapshot.projects : []
  for (const project of projects) {
    const sessionsSnapshot = await host.listSessions(project.id).catch(() => null)
    const sessions = sessionsSnapshot && Array.isArray(sessionsSnapshot.sessions) ? sessionsSnapshot.sessions : []
    for (const session of sessions) {
      map.set(session.id, {
        activity: session.activity || "unknown",
        title: session.title || "",
        directory: session.directory || project.directory || "",
        parentId: session.parentId || null
      })
    }
  }
  return map
}

function liveOf(member) {
  return S.live.get(member.sessionId) || null
}

function stateOf(member) {
  const svc = S.service.get(member.sessionId)
  if (svc) {
    if (svc.running) return "running"
    if (svc.lastMs) return "done"
    return "idle"
  }
  const live = liveOf(member)
  if (!live) return "unknown"
  if (live.activity === "running" || live.activity === "retrying") return "running"
  if (live.activity === "waiting-permission" || live.activity === "waiting-question") return "waiting"
  if (live.activity === "idle") {
    if (S.busy.has(member.sessionId)) return "running-child"
    return "idle"
  }
  return "unknown"
}

function lastMsOf(member) {
  const svc = S.service.get(member.sessionId)
  if (svc && svc.lastMs) return svc.lastMs
  return 0
}

const STATE_ICON = { done: "\u2713", failed: "\u2715", waiting: "\u25d4", idle: "\u00b7", unknown: "\u2014" }

function renderState(el, member) {
  const state = stateOf(member)
  const elapsed = elapsedOf(member, state)
  el.dataset.state = state
  el.replaceChildren()

  const icon = document.createElement("span")
  icon.className = "state-icon"
  if (state === "running" || state === "running-child") {
    const spin = document.createElement("span")
    spin.className = "spin"
    icon.appendChild(spin)
  } else {
    icon.textContent = STATE_ICON[state] || STATE_ICON.unknown
  }

  const text = document.createElement("span")
  text.className = "state-time"
  if (state === "running" || state === "running-child") {
    text.textContent = elapsed > 0 ? fmtElapsed(elapsed) : ""
  } else if (state === "done") {
    const ms = lastMsOf(member)
    text.textContent = ms ? t("lastTurn") + " " + fmtElapsed(ms) : t("done")
  } else if (state === "idle") {
    text.textContent = t("idle")
  } else if (state === "waiting") {
    text.textContent = t("waiting")
  } else {
    text.textContent = ""
  }
  el.append(icon, text)
}

function elapsedOf(member, state) {
  const running = state === "running" || state === "running-child"
  if (!running) {
    S.since.delete(member.sessionId)
    return 0
  }
  const svc = S.service.get(member.sessionId)
  if (svc && svc.since) return Math.max(0, Date.now() - svc.since)
  if (!S.since.has(member.sessionId)) S.since.set(member.sessionId, Date.now())
  return Date.now() - S.since.get(member.sessionId)
}

/* ---------------- data ---------------- */

/** 建会话没有宿主 API，走本地服务；服务已带 exec: opencode 权限。 */
async function createSessionRequest(directory, title, agent) {
  if (typeof host.serviceRequest !== "function") return { id: "", error: "no-service-api" }
  try {
    const res = await host.serviceRequest({
      method: "POST",
      path: "/createSession",
      body: { directory, title, agent }
    })
    const text = typeof res?.body === "string" ? res.body : ""
    const data = text ? JSON.parse(text) : null
    if (data && data.sessionId) return { id: String(data.sessionId), error: "" }
    return { id: "", error: (data && data.error) || "empty" }
  } catch (error) {
    return { id: "", error: String((error && error.code) || (error && error.message) || "ERR") }
  }
}

async function serviceStates(ids, force) {
  if (!ids.length) return { data: null, error: "" }
  if (typeof host.serviceRequest !== "function") return { data: null, error: "no-service-api" }
  try {
    const query = { ids: ids.join(",") }
    if (force) query.force = "1"
    const res = await host.serviceRequest({
      method: "GET",
      path: "/states",
      query
    })
    const text = typeof res?.body === "string" ? res.body : null
    if (!text) return { data: null, error: "empty" }
    return { data: JSON.parse(text), error: "" }
  } catch (error) {
    return { data: null, error: String((error && error.code) || (error && error.message) || "ERR") }
  }
}

async function loadAll(force = false) {
  try {
    S.settings = await readSettings()
    const list = await readTasks()
    S.ids = list.map((task) => task.id)
    S.tasks = new Map(list.map((task) => [task.id, task]))
    S.live = await collectLive()
    recomputeBusy()
    void subscribeLive()

    // 宿主对 worktree 目录可能给 unknown；本地服务直读会话状态作为权威值。
    const wanted = new Set()
    for (const task of S.tasks.values()) {
      for (const member of task.members || []) wanted.add(member.sessionId)
    }
    const svc = await serviceStates([...wanted], force)
    const over = svc.data ? svc.data.states : null
    S.service = new Map()
    if (over) {
      for (const [id, state] of Object.entries(over)) {
        S.service.set(id, {
          running: Boolean(state && state.running),
          lastMs: Number(state && state.lastMs) || 0,
          since: Number(state && state.since) || 0
        })
        const current = S.live.get(id) || { activity: "unknown", title: "", directory: "", parentId: null }
        current.activity = state && state.running ? "running" : "idle"
        S.live.set(id, current)
      }
    }
    el("status").textContent = svc.error ? "svc:" + svc.error : ""
    // 轮询只更新状态点，任务结构没变就不重建 DOM，避免整块重绘带来的卡顿。
    const key = JSON.stringify(list.map((task) => [task.id, task.title, task.progressDir, task.coordinator, (task.members || []).map((m) => [m.sessionId, m.title])]))
    if (key !== S.lastKey) {
      S.lastKey = key
      render()
    } else {
      tickStates()
    }
  } catch (error) {
    el("status").textContent = (error && error.code) || "ERR"
  }
}

async function persist(task) {
  task.updatedAt = Date.now()
  if (!S.ids.includes(task.id)) S.ids.push(task.id)
  S.tasks.set(task.id, task)
  await writeTasks(S.ids.map((id) => S.tasks.get(id)).filter(Boolean))
}

async function removeTask(id) {
  S.ids = S.ids.filter((x) => x !== id)
  S.tasks.delete(id)
  await writeTasks(S.ids.map((taskId) => S.tasks.get(taskId)).filter(Boolean))
  if (S.selected === id) S.selected = null
}

function visibleTasks() {
  const text = S.query.trim().toLowerCase()
  let list = S.ids.map((id) => S.tasks.get(id)).filter(Boolean)
  if (text) list = list.filter((task) => String(task.title || "").toLowerCase().includes(text))
  if (S.sort === "name") list.sort((a, b) => String(a.title || "").localeCompare(String(b.title || "")))
  if (S.sort === "members") list.sort((a, b) => (b.members || []).length - (a.members || []).length)
  return list
}

function currentTask() {
  const list = visibleTasks()
  return list.find((task) => task.id === S.selected) || list[0] || null
}

async function gotoSession(sessionId) {
  await host.openSession(sessionId)
  // 目标会话可能从没开过这块面板：切过去后立刻拉一次，再补一次，防止第一次被切换过程吞掉。
  if (typeof host.openSurface === "function") {
    const open = () => host.openSurface("plugin:task-hub").catch(() => {})
    void open()
    setTimeout(() => void open(), 500)
  }
}

function isMine(task) {
  return Boolean(S.me) && (task.members || []).some((member) => member.sessionId === S.me)
}

/* ---------------- render ---------------- */

function button(label, variant, onClick) {
  const b = document.createElement("button")
  b.type = "button"
  b.className = "btn " + (variant || "")
  b.textContent = label
  b.onclick = onClick
  return b
}

function renderList() {
  const box = el("list")
  const scroll = box.scrollTop
  box.replaceChildren()
  const list = visibleTasks()
  if (!list.length) {
    const empty = document.createElement("div")
    empty.className = "empty"
    empty.textContent = S.query ? t("noMatch") : t("none")
    box.appendChild(empty)
    return
  }
  for (const task of list) {
    const item = document.createElement("button")
    item.type = "button"
    item.className = "item" + (task === currentTask() ? " on" : "")
    if (isMine(task)) {
      const dot = document.createElement("span")
      dot.className = "dot"
      item.appendChild(dot)
    }
    const name = document.createElement("span")
    name.className = "item-name"
    name.textContent = task.title || task.id
    const meta = document.createElement("span")
    meta.className = "item-meta"
    meta.textContent = String((task.members || []).length)
    item.append(name, meta)
    item.onclick = () => {
      S.selected = task.id
      S.deleting = null
      // 表单属于某件任务的某个分组；换任务就收掉，免得挂到同名分组上。
      S.newFor = null
      render()
    }
    box.appendChild(item)
  }
  box.scrollTop = scroll
}

function memberRow(task, member, index) {
  const row = document.createElement("div")
  row.className = "row"

  const handle = document.createElement("span")
  handle.className = "handle"
  handle.textContent = "\u22ee\u22ee"
  handle.draggable = true
  handle.addEventListener("dragstart", (event) => {
    S.dragId = member.sessionId
    row.classList.add("dragging")
    try {
      event.dataTransfer.effectAllowed = "move"
      event.dataTransfer.setData("text/plain", member.sessionId)
    } catch {}
  })
  handle.addEventListener("dragend", () => {
    S.dragId = null
    row.classList.remove("dragging")
    for (const node of el("detail").querySelectorAll(".drop-target")) node.classList.remove("drop-target")
  })
  row.addEventListener("dragover", (event) => {
    if (!S.dragId || S.dragId === member.sessionId) return
    event.preventDefault()
    row.classList.add("drop-target")
  })
  row.addEventListener("dragleave", () => row.classList.remove("drop-target"))
  row.addEventListener("drop", (event) => {
    event.preventDefault()
    row.classList.remove("drop-target")
    const from = S.dragId || (event.dataTransfer && event.dataTransfer.getData("text/plain"))
    void reorder(task, from, member.sessionId)
  })

  const info = document.createElement("span")
  info.className = "row-info"
  const title = document.createElement("span")
  title.className = "row-name"

  const live = liveOf(member)
  const nameBtn = document.createElement("button")
  nameBtn.type = "button"
  nameBtn.className = "link"
  nameBtn.textContent = member.alias || (live && live.title) || member.title || member.sessionId.slice(-6)
  if (!live) {
    nameBtn.disabled = true
    nameBtn.title = t("gone")
  } else {
    nameBtn.title = t("open")
    nameBtn.onclick = async () => {
      try {
        await gotoSession(member.sessionId)
      } catch (error) {
        toast(String((error && error.code) || "ERR"), "error")
      }
    }
  }
  title.appendChild(nameBtn)
  if (task.coordinator === member.sessionId) {
    const tag = document.createElement("span")
    tag.className = "tag coord"
    tag.textContent = t("coord")
    title.appendChild(tag)
  }
  const role = member.role === "main" || member.role === "helper" ? member.role : ""
  {
    const tag = document.createElement("span")
    tag.className = "tag role-" + (role || "none")
    tag.textContent = role ? t(role === "main" ? "roleMain" : "roleHelper") : t("roleNone")
    title.appendChild(tag)
  }
  if (member.sessionId === S.me) {
    const tag = document.createElement("span")
    tag.className = "tag"
    tag.textContent = t("thisSession")
    title.appendChild(tag)
  }
  if (!live) {
    const tag = document.createElement("span")
    tag.className = "tag bad"
    tag.textContent = t("gone")
    title.appendChild(tag)
  }

  const sub = document.createElement("span")
  sub.className = "row-sub"
  const parts = []
  const dir = live && live.directory ? live.directory.split(/[\\/]/).filter(Boolean).pop() : member.directory
  if (dir) parts.push(dir)
  parts.push(member.sessionId.slice(-6))
  sub.textContent = parts.join(" \u00b7 ")
  info.append(title, sub)

  const state = document.createElement("span")
  state.className = "state"
  renderState(state, member)
  S.stateNodes.push({ el: state, member })

  const actions = document.createElement("span")
  actions.className = "row-actions"
  const isCoord = task.coordinator === member.sessionId
  const roleNow = member.role === "helper" ? "helper" : "main"
  const marker = button("\u22ef", isCoord ? "primary" : "", () => {
    S.openMenu = S.openMenu === member.sessionId ? null : member.sessionId
    void renderDetail()
  })
  marker.title = t("actions")
  actions.append(marker)

  const cell = document.createElement("div")
  cell.className = "cell"
  cell.appendChild(row)
  row.append(handle, info, state, actions)

  if (S.renaming === member.sessionId) {
    const editor = document.createElement("div")
    editor.className = "menu"
    const input = document.createElement("input")
    input.type = "text"
    input.className = "rename"
    input.value = member.alias || member.title || ""
    input.placeholder = t("alias")
    const save = button(t("save"), "primary", () => void setAlias(task, member.sessionId, input.value))
    const cancel = button(t("cancel"), "", () => {
      S.renaming = null
      void renderDetail()
    })
    editor.append(input, save, cancel)
    cell.appendChild(editor)
    setTimeout(() => input.focus(), 0)
    return cell
  }

  if (S.openMenu === member.sessionId) {
    const box = document.createElement("div")
    box.className = "menu"
    box.append(
      button(t("setAlias"), "accent", () => {
        S.renaming = member.sessionId
        void renderDetail()
      }),
      button(t("copyId"), "accent", async () => {
        try {
          await host.writeClipboard(member.sessionId)
          toast(t("copyDone"), "success")
        } catch (error) {
          toast(String((error && error.code) || "ERR"), "error")
        }
      }),
      button(t("remove"), "danger", () => void dropMember(task, member.sessionId)),
      button(isCoord ? t("clearCoord") : t("setCoord"), "accent", () => void setCoordinator(task, isCoord ? null : member.sessionId)),
      button(t("setMain"), roleNow === "main" ? "primary" : "", () => void setRole(task, member.sessionId, "main")),
      button(t("setHelper"), roleNow === "helper" ? "primary" : "", () => void setRole(task, member.sessionId, "helper")),
      button(t("fillHelpers"), "accent", async () => {
        try {
          await gotoSession(member.sessionId)
          await host.compose({
            text: t("fillPrompt")(task.title || task.id, task.progressDir || "", member.title || member.sessionId.slice(-6)),
            mode: "replace"
          })
          toast(t("summaryQueued"), "success")
        } catch (error) {
          toast(String((error && error.code) || "ERR"), "error")
        }
      })
    )
    cell.appendChild(box)
  }
  return cell
}

function groupMembers(members) {
  const groups = new Map()
  for (const member of members) {
    const live = liveOf(member)
    const dir = (live && live.directory) || member.directory || ""
    const key = dir ? dir.split(/[\\/]/).filter(Boolean).pop() : t("noFolder")
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(member)
  }
  return groups
}

function groupState(list) {
  const states = list.map((member) => stateOf(member))
  if (states.includes("running") || states.includes("running-child")) return "running"
  if (states.includes("waiting")) return "waiting"
  if (states.includes("failed")) return "failed"
  if (states.every((s) => s === "done")) return "done"
  if (states.every((s) => s === "idle" || s === "done")) return "idle"
  return "unknown"
}

function paintGroupState(el, list) {
  const value = groupState(list)
  el.dataset.state = value
  el.replaceChildren()
  const icon = document.createElement("span")
  icon.className = "state-icon"
  if (value === "running" || value === "running-child") {
    const spin = document.createElement("span")
    spin.className = "spin"
    icon.appendChild(spin)
  } else {
    icon.textContent = STATE_ICON[value] || STATE_ICON.unknown
  }
  const text = document.createElement("span")
  text.className = "state-time"
  text.textContent = value === "running" || value === "running-child" ? t("running") : t(value) || ""
  el.append(icon, text)
}

/** 组内成员的绝对目录；宿主对 worktree 会给短名或 unknown，只有绝对路径能用来建会话。 */
function groupDirectory(list) {
  const dirs = []
  let opaque = 0
  for (const member of list) {
    const live = S.live.get(member.sessionId)
    const dir = String((live && live.directory) || "")
    if (/^[A-Za-z]:[\\/]/.test(dir) || dir.startsWith("/")) {
      if (!dirs.includes(dir)) dirs.push(dir)
      continue
    }
    // 会话还在、但宿主只给了短名（worktree 目录常见）：这一组的真实路径无法确定。
    if (live && dir) opaque++
  }
  // 分组键是目录末段：D:\work\cashier 与 D:\work\.worktrees\cashier 会并成一组。
  // 只有绝对路径唯一、且没有定位不了的活会话时才敢建，否则会建到错的那一层。
  return dirs.length === 1 && opaque === 0 ? dirs[0] : ""
}

function newSessionEditor(task, key, list) {
  const box = document.createElement("div")
  box.className = "menu new-session"
  // 上一次建成了但没写进名册：只给 id 和复制，不再给创建按钮，免得重复建。
  if (S.newCreated) {
    const note = document.createElement("div")
    note.className = "orphan"
    note.textContent = t("orphan") + " \u00b7 " + S.newCreated
    const copy = button(t("copyId"), "accent", async () => {
      try {
        await host.writeClipboard(S.newCreated)
        toast(t("copyDone"), "success")
      } catch (error) {
        toast(String((error && error.code) || "ERR"), "error")
      }
    })
    const close = button(t("cancel"), "", () => {
      S.newCreated = ""
      S.newFor = null
      void renderDetail()
    })
    box.append(note, copy, close)
    return box
  }
  const input = document.createElement("input")
  input.type = "text"
  input.className = "rename"
  input.placeholder = t("newSessionTitle")
  input.value = S.newTitle
  input.oninput = () => {
    S.newTitle = input.value
  }
  const roleMain = button(t("roleMain"), S.newRole === "main" ? "primary" : "", () => {
    S.newRole = "main"
    void renderDetail()
  })
  const roleHelper = button(t("roleHelper"), S.newRole === "helper" ? "primary" : "", () => {
    S.newRole = "helper"
    void renderDetail()
  })
  const create = button(S.newBusy ? t("creating") : t("newSession"), "primary", () => void submitNewSession(task, key, list))
  create.disabled = S.newBusy
  const cancel = button(t("cancel"), "", () => {
    if (S.newBusy) return
    S.newFor = null
    void renderDetail()
  })
  cancel.disabled = S.newBusy
  box.append(input, roleMain, roleHelper, create, cancel)
  setTimeout(() => input.focus(), 0)
  return box
}

async function submitNewSession(task, key, list) {
  if (S.newBusy) return
  const dir = groupDirectory(list)
  if (!dir) {
    toast(t("noDirectory"), "error")
    return
  }
  const taskId = task.id
  const role = S.newRole
  const title = String(S.newTitle || "").trim() || key + " - " + t("newSession")
  S.newBusy = true
  void renderDetail()
  const res = await createSessionRequest(dir, title, "")
  S.newBusy = false
  if (!res.id) {
    toast(String(res.error || "ERR"), "error")
    void renderDetail()
    return
  }
  // 请求在途时用户可能切了任务或取消了表单；成员仍要落到发起时那件任务上。
  const target = S.tasks.get(taskId) || task
  target.members = target.members || []
  const entry = {
    sessionId: res.id,
    title,
    directory: dir.split(/[\\/]/).filter(Boolean).pop() || key,
    role
  }
  target.members.push(entry)
  try {
    await persist(target)
  } catch (error) {
    // 写盘失败要回滚内存，否则自动刷新会用磁盘副本覆盖掉这条，看起来像「已加过」。
    // 会话本身已经在引擎里建出来了，所以把 id 留在表单里让用户复制或重试，别清掉。
    target.members = target.members.filter((m) => m.sessionId !== res.id)
    S.newCreated = res.id
    toast(t("orphan") + " \u00b7 " + String((error && error.code) || "ERR"), "error")
    void renderDetail()
    return
  }
  const stillOpen = S.newFor === key
  if (stillOpen) {
    S.newFor = null
    S.newTitle = ""
  }
  S.newCreated = ""
  render()
  toast(t("sessionCreated") + (stillOpen ? "" : " " + res.id), "success")
  if (stillOpen) await gotoSession(res.id)
}

function groupHeader(task, key, list, hasCoord) {
  const row = document.createElement("div")
  row.className = "group" + (hasCoord ? " coord" : "")
  const open = S.expanded.has(key)

  const caret = document.createElement("span")
  caret.className = "caret"
  caret.textContent = open ? "\u25be" : "\u25b8"

  const name = document.createElement("span")
  name.className = "group-name"
  name.textContent = key
  if (hasCoord) {
    const tag = document.createElement("span")
    tag.className = "tag coord"
    tag.textContent = t("coordGroup")
    name.appendChild(tag)
  }

  const count = document.createElement("span")
  count.className = "group-count"
  const mainCount = list.filter((m) => m.role !== "helper").length
  const helperCount = list.filter((m) => m.role === "helper").length
  count.textContent = `${mainCount} ${t("roleMain")} \u00b7 ${helperCount} ${t("roleHelper")}` + (list.length > 3 ? " \u00b7 " + t("overCap") : "")
  count.classList.toggle("bad", list.length > 3 || mainCount > 1)

  const state = document.createElement("span")
  state.className = "state"
  paintGroupState(state, list)
  S.groupNodes.push({ el: state, list })

  const toggle = document.createElement("button")
  toggle.type = "button"
  toggle.className = "group-toggle"
  toggle.append(caret, name, count, state)
  toggle.onclick = () => {
    if (S.expanded.has(key)) S.expanded.delete(key)
    else S.expanded.add(key)
    S.newFor = null
    void renderDetail()
  }

  // 组里没有可定位的目录时置灰：不拿短名去猜路径建会话。
  const dir = groupDirectory(list)
  const add = document.createElement("button")
  add.type = "button"
  add.className = "btn accent group-add"
  add.textContent = "+"
  add.title = dir ? t("newSession") : t("noDirectory")
  add.disabled = !dir
  add.onclick = () => {
    // 创建中再点会把 newBusy 清掉，等于放开第二次建会话。
    if (S.newBusy) return
    // 上一轮建成了但没入册：先让用户复制或关掉，不能被下一次「+」无声清掉。
    if (S.newCreated) {
      toast(t("orphan"), "error")
      return
    }
    if (!dir) {
      toast(t("noDirectory"), "error")
      return
    }
    S.newFor = key
    S.newTitle = ""
    S.newRole = "helper"
    S.newBusy = false
    S.newCreated = ""
    S.expanded.add(key)
    void renderDetail()
  }

  row.append(toggle, add)
  return row
}

async function renderDetail() {
  const box = el("detail")
  box.replaceChildren()
  S.stateNodes = []
  S.groupNodes = []
  const task = currentTask()
  if (!task) {
    const empty = document.createElement("div")
    empty.className = "empty"
    empty.textContent = t("pick")
    box.appendChild(empty)
    return
  }

  const head = document.createElement("div")
  head.className = "head"
  const name = document.createElement("span")
  name.className = "head-name"
  name.textContent = task.title || task.id
  head.appendChild(name)
  if (isMine(task)) {
    const tag = document.createElement("span")
    tag.className = "tag"
    tag.textContent = t("you")
    head.appendChild(tag)
  }
  const headActions = document.createElement("span")
  headActions.className = "row-actions"
  const del = button(S.deleting === task.id ? t("confirm") : t("delete"), "danger", () => {
    if (S.deleting !== task.id) {
      S.deleting = task.id
      render()
      clearTimeout(S.deleteTimer)
      S.deleteTimer = setTimeout(() => {
        S.deleting = null
        render()
      }, 4000)
      return
    }
    clearTimeout(S.deleteTimer)
    S.deleting = null
    void removeTask(task.id).then(render)
  })
  const moreBtn = button("\u22ef", "", () => {
    S.headMenu = !S.headMenu
    void renderDetail()
  })
  moreBtn.title = t("actions")

  if (task.coordinator) {
    headActions.appendChild(
      button(t("jumpCoord"), "primary", async () => {
        try {
          await gotoSession(task.coordinator)
        } catch (error) {
          toast(String((error && error.code) || "ERR"), "error")
        }
      })
    )
  }
  headActions.append(
    button(t("addSession"), "accent", () => void openPicker(task)),
    moreBtn
  )
  head.appendChild(headActions)
  box.appendChild(head)

  if (S.headMenu) {
    const menu = document.createElement("div")
    menu.className = "headmenu"
    menu.append(
      button(t("settle"), "accent", async () => {
        if (!task.coordinator) {
          toast(t("noCoord"), "error")
          return
        }
        try {
          await gotoSession(task.coordinator)
          await host.compose({ text: t("settlePrompt")(task.title || task.id, task.progressDir || ""), mode: "replace" })
          toast(t("settleQueued"), "success")
        } catch (error) {
          toast(String((error && error.code) || "ERR"), "error")
        }
      }),
      button(t("patrol"), "accent", async () => {
        if (!task.coordinator) {
          toast(t("noCoord"), "error")
          return
        }
        try {
          await gotoSession(task.coordinator)
          await host.compose({ text: t("patrolPrompt")(task.title || task.id, task.progressDir || ""), mode: "replace" })
          toast(t("summaryQueued"), "success")
        } catch (error) {
          toast(String((error && error.code) || "ERR"), "error")
        }
      }),
      button(t("summarize"), "accent", async () => {
        if (!task.coordinator) {
          toast(t("noCoord"), "error")
          return
        }
        try {
          await gotoSession(task.coordinator)
          await host.compose({ text: t("summaryPrompt")(task.title || task.id, task.progressDir || ""), mode: "replace" })
          toast(t("summaryQueued"), "success")
        } catch (error) {
          toast(String((error && error.code) || "ERR"), "error")
        }
      }),
      button(t("tidyTitles"), "accent", async () => {
        if (!task.coordinator) {
          toast(t("noCoord"), "error")
          return
        }
        try {
          await gotoSession(task.coordinator)
          await host.compose({ text: t("titlePrompt")(task.title || task.id, task.progressDir || ""), mode: "replace" })
          toast(t("summaryQueued"), "success")
        } catch (error) {
          toast(String((error && error.code) || "ERR"), "error")
        }
      }),
      button(t("edit"), "", () => openForm("edit", task)),
      del
    )
    box.appendChild(menu)
  }

  const prow = document.createElement("div")
  prow.className = "progress"
  const plabel = document.createElement("span")
  plabel.className = "progress-label"
  plabel.textContent = t("progress")
  const ppath = document.createElement("span")
  ppath.className = "progress-path"
  ppath.textContent = task.progressDir || ""
  ppath.title = task.progressDir || ""
  prow.append(plabel, ppath)
  if (!readable(task)) {
    const tag = document.createElement("span")
    tag.className = "tag"
    tag.textContent = t("external")
    prow.appendChild(tag)
  }
  prow.append(
    button(t("copyPath"), "", async () => {
      try {
        await host.writeClipboard(task.progressDir || "")
        toast(t("copyDone"), "success")
      } catch (error) {
        toast(String((error && error.code) || "ERR"), "error")
      }
    })
  )
  box.appendChild(prow)

  const filesBox = document.createElement("div")
  filesBox.className = "files"
  box.appendChild(filesBox)
  if (!readable(task)) {
    const hint = document.createElement("div")
    hint.className = "warn"
    hint.textContent = t("unreadable")
    filesBox.appendChild(hint)
  } else {
    void renderFiles(task, filesBox)
  }

  const members = task.members || []
  if (!members.length) {
    const warn = document.createElement("div")
    warn.className = "warn"
    warn.textContent = t("noPeers")
    box.appendChild(warn)
  }
  const groups = groupMembers(members)
  const entries = [...groups.entries()].map(([key, list]) => {
    const hasCoord = Boolean(task.coordinator) && list.some((m) => m.sessionId === task.coordinator)
    const st = groupState(list)
    const rank = hasCoord ? 0 : st === "running" || st === "running-child" ? 1 : st === "waiting" ? 2 : st === "failed" ? 3 : st === "done" ? 4 : 5
    return { key, list, hasCoord, rank }
  })
  entries.sort((a, b) => a.rank - b.rank)
  if (S.expanded.size === 0 && entries.length === 1) S.expanded.add(entries[0].key)
  for (const entry of entries) {
    const ordered = [...entry.list].sort((a, b) => (b.sessionId === task.coordinator ? 1 : 0) - (a.sessionId === task.coordinator ? 1 : 0))
    box.appendChild(groupHeader(task, entry.key, entry.list, entry.hasCoord))
    if (S.newFor === entry.key) box.appendChild(newSessionEditor(task, entry.key, entry.list))
    if (!S.expanded.has(entry.key)) continue
    const grid = document.createElement("div")
    grid.className = "members"
    for (const member of ordered) grid.appendChild(memberRow(task, member))
    box.appendChild(grid)
  }
}

async function renderFiles(task, box) {
  const files = progressFiles(task)
  const rows = await Promise.all(
    files.map(async (file) => ({ ...file, info: await statPath(file.path) }))
  )
  box.replaceChildren()
  for (const row of rows) {
    const chip = document.createElement("span")
    chip.className = "file" + (row.info ? "" : " missing")
    chip.textContent = row.name + (row.info ? " \u00b7 " + humanSize(row.info.size) : " \u00b7 \u2014")
    chip.title = row.path
    box.appendChild(chip)
  }
}

function humanSize(size) {
  if (!size) return "0"
  if (size < 1024) return size + "B"
  if (size < 1024 * 1024) return Math.round(size / 1024) + "K"
  return (size / 1024 / 1024).toFixed(1) + "M"
}

function render() {
  el("count").textContent = String(visibleTasks().length)
  renderList()
  void renderDetail()
}

function toast(message, kind) {
  const box = el("toast")
  box.textContent = message
  box.className = "toast show " + (kind || "")
  clearTimeout(toast.timer)
  toast.timer = setTimeout(() => {
    box.className = "toast"
  }, 2200)
}

/* ---------------- mutations ---------------- */

async function reorder(task, fromId, toId) {
  if (!fromId || !toId || fromId === toId) return
  const members = task.members || []
  const from = members.findIndex((m) => m.sessionId === fromId)
  const to = members.findIndex((m) => m.sessionId === toId)
  if (from < 0 || to < 0) return
  const [row] = members.splice(from, 1)
  members.splice(to, 0, row)
  await persist(task)
  render()
}

async function dropMember(task, sessionId) {
  task.members = (task.members || []).filter((m) => m.sessionId !== sessionId)
  if (task.coordinator === sessionId) task.coordinator = null
  await persist(task)
  render()
}

async function setCoordinator(task, sessionId) {
  task.coordinator = sessionId
  await persist(task)
  render()
}

async function setRole(task, sessionId, role) {
  const member = (task.members || []).find((m) => m.sessionId === sessionId)
  if (!member) return
  member.role = role
  await persist(task)
  render()
}

async function setAlias(task, sessionId, value) {
  const member = (task.members || []).find((m) => m.sessionId === sessionId)
  if (!member) return
  const text = String(value || "").trim()
  if (text) member.alias = text
  else delete member.alias
  S.renaming = null
  S.openMenu = null
  await persist(task)
  render()
}

async function addMember(task, row) {
  task.members = task.members || []
  if (task.members.some((m) => m.sessionId === row.id)) {
    toast(t("already"), "")
    return
  }
  task.members.push({ sessionId: row.id, title: row.title, directory: row.project })
  await persist(task)
  closePicker()
  render()
  toast(t("added"), "success")
}

/* ---------------- form ---------------- */

function defaultDir() {
  const root = (S.settings.progressRoot || DEFAULT_ROOT).replace(/\/+$/, "")
  return root + "/<id>"
}

function openForm(mode, task) {
  S.formMode = mode
  S.formId = task ? task.id : null
  el("f-heading").textContent = mode === "edit" ? t("edit") : t("newTask")
  el("f-title").value = task ? task.title || "" : ""
  el("f-goal").value = task ? task.goal || "" : ""
  el("f-accept").value = task ? task.acceptance || "" : ""
  el("f-dir").value = task ? task.progressDir || "" : defaultDir()
  el("f-dir-hint").textContent = t("folderHint")
  el("form").classList.add("show")
  el("f-title").focus()
}

function closeForm() {
  el("form").classList.remove("show")
}

async function submitForm() {
  const title = el("f-title").value.trim()
  const goal = el("f-goal").value.trim()
  const acceptance = el("f-accept").value.trim()
  if (!title || !goal || !acceptance) {
    toast(t("must"), "error")
    return
  }
  const dir = el("f-dir").value.trim() || defaultDir()

  if (S.formMode === "edit" && S.formId) {
    const task = S.tasks.get(S.formId)
    if (!task) return
    task.title = title
    task.goal = goal
    task.acceptance = acceptance
    task.progressDir = dir
    await persist(task)
    await ensureFolder(task, false)
    closeForm()
    render()
    toast(t("updated"), "success")
    return
  }

  const id = "t_" + Date.now().toString(36).slice(-6)
  const task = {
    id,
    title,
    goal,
    acceptance,
    progressDir: dir.includes("<id>") ? dir.replace("<id>", id) : dir,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    members: S.me ? [{ sessionId: S.me, title: S.meTitle }] : []
  }
  await persist(task)
  await ensureFolder(task, true)
  S.selected = task.id
  closeForm()
  render()
  toast(t("created"), "success")
}

/* ---------------- picker ---------------- */

function renderPicker() {
  const box = el("p-list")
  box.replaceChildren()
  const text = S.pickQ.trim().toLowerCase()
  const rows = S.pickRows.filter(
    (row) =>
      !text ||
      row.title.toLowerCase().includes(text) ||
      row.project.toLowerCase().includes(text) ||
      row.id.toLowerCase().includes(text)
  )
  if (!rows.length) {
    const empty = document.createElement("div")
    empty.className = "empty"
    empty.textContent = t("noSessions")
    box.appendChild(empty)
    return
  }
  for (const row of rows) {
    const item = document.createElement("button")
    item.type = "button"
    item.className = "pick"
    const name = document.createElement("span")
    name.className = "pick-name"
    name.textContent = row.title
    const sub = document.createElement("span")
    sub.className = "pick-sub"
    sub.textContent = row.project + " \u00b7 " + row.id.slice(-6)
    item.append(name, sub)
    item.onclick = () => {
      const task = currentTask()
      if (task) void addMember(task, row)
    }
    box.appendChild(item)
  }
}

async function openPicker(task) {
  S.pickQ = ""
  S.pickRows = []
  el("p-search").value = ""
  el("p-hint").textContent = t("addTo") + " \u300c" + (task.title || task.id) + "\u300d"
  el("p-list").textContent = t("loading")
  el("picker").classList.add("show")

  const rows = []
  const snapshot = await host.listProjects().catch(() => null)
  const projects = snapshot && Array.isArray(snapshot.projects) ? snapshot.projects : []
  for (const project of projects) {
    const sessionsSnapshot = await host.listSessions(project.id).catch(() => null)
    const sessions = sessionsSnapshot && Array.isArray(sessionsSnapshot.sessions) ? sessionsSnapshot.sessions : []
    for (const session of sessions) {
      if (session.parentId || session.archivedAt) continue
      rows.push({
        id: session.id,
        title: session.title || session.id,
        project: project.name || project.directory || ""
      })
    }
  }
  rows.sort((a, b) => a.title.localeCompare(b.title))
  S.pickRows = rows
  renderPicker()
}

function closePicker() {
  el("picker").classList.remove("show")
}

/* ---------------- boot ---------------- */

async function autoTick() {
  if (document.querySelector(".sheet.show") || S.dragId) return
  await loadAll()
}

function setAuto(on) {
  const btn = el("auto")
  if (on && !S.auto) {
    S.auto = setInterval(() => void autoTick(), AUTO_MS)
    btn.classList.add("active")
    btn.textContent = t("auto")
    void autoTick()
    return
  }
  if (!on && S.auto) {
    clearInterval(S.auto)
    S.auto = 0
    btn.classList.remove("active")
    btn.textContent = t("auto")
  }
}

function toggleAuto() {
  const next = !S.auto
  setAuto(next)
  host.storage.set(AUTO_KEY, next).catch(() => {})
}

host.onReady((ctx) => {
  applyHostReady(ctx, document.documentElement)
  document.documentElement.dataset.theme = ctx.theme.mode
  S.loc = String(ctx.locale || "en").toLowerCase().startsWith("zh") ? "zh" : "en"
  if (ctx.session && ctx.session.id) {
    S.me = ctx.session.id
    S.meTitle = ctx.session.title || ""
  }

  el("app-title").textContent = t("tasks")
  el("new").textContent = t("newTask")
  el("refresh").textContent = t("refresh")
  el("auto").textContent = t("auto")
  el("search").placeholder = t("search")
  el("sort-label").textContent = t("sort")
  el("sort").options[0].textContent = t("manual")
  el("sort").options[1].textContent = t("name")
  el("sort").options[2].textContent = t("members")
  el("f-save").textContent = t("save")
  el("f-cancel").textContent = t("cancel")
  el("f-title").placeholder = t("title")
  el("f-goal").placeholder = t("goal")
  el("f-accept").placeholder = t("accept")
  el("p-close").textContent = t("close")
  el("p-search").placeholder = t("searchSessions")
  el("f-dir").placeholder = DEFAULT_ROOT + "/<id>"

  if (S.mounted) return
  S.mounted = true
  if (!S.ticker) S.ticker = setInterval(tickStates, 1000)
  el("refresh").onclick = () => void loadAll(true)
  el("search-toggle").onclick = () => {
    const top = document.querySelector(".top")
    if (!top) return
    top.classList.toggle("search-open")
    if (top.classList.contains("search-open")) el("search").focus()
  }
  el("auto").onclick = () => toggleAuto()
  el("new").onclick = () => openForm("create", null)
  el("f-cancel").onclick = () => closeForm()
  el("f-save").onclick = () => void submitForm()
  el("p-close").onclick = () => closePicker()
  el("p-search").oninput = (event) => {
    S.pickQ = event.target.value
    renderPicker()
  }
  el("search").oninput = (event) => {
    S.query = event.target.value
    render()
  }
  el("sort").onchange = (event) => {
    S.sort = event.target.value
    render()
  }
  void loadAll()
  void host.storage
    .get(AUTO_KEY)
    .then((value) => {
      if (value === undefined || value === true) setAuto(true)
    })
    .catch(() => setAuto(true))
})
