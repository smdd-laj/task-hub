import { connectHost } from "@openchamber/sdk"
import { applyHostReady } from "@openchamber/sdk/ui"

const host = connectHost()
const el = (id) => document.getElementById(id)

const DEFAULT_ROOT = "~/.task-hub/tasks"
const FILE_TASKS = "~/.task-hub/tasks.json"
const FILE_SETTINGS = "~/.task-hub/settings.json"
const FILE_REPOS = "~/.task-hub/repos.json"
const KEY_SELECTED = "taskhub.selected"
const AUTO_KEY = "taskhub.auto"
const AUTO_MS = 1500
// 与 rules/task-collab.md 第八节同一套预算，面板只负责把它可视化。
const FILE_BUDGET = {
  "HEAD.md": 8 * 1024,
  "SUMMARY.md": 40 * 1024,
  "RUNBOOK.md": 30 * 1024,
  progress: 40 * 1024
}

const DICT = {
  en: {
    tasks: "Tasks", auto: "Auto", on: "On", newTask: "New", refresh: "Refresh",
    refreshSizes: "Re-read file sizes",
    search: "Search tasks", sort: "Sort", manual: "Manual", name: "Name", members: "Sessions",
    none: "No tasks yet", noMatch: "No matching tasks", pick: "Pick a task on the left",
    you: "You", edit: "Edit", addSession: "Add session", delete: "Delete", confirm: "Click again",
    progress: "Progress folder", copyPath: "Copy path", copyDone: "Path copied",
    external: "external", unreadable: "External folder: the panel records and copies the path but does not read its files.",
    readFail: "Cannot read folder",
    running: "running", runningChild: "subagent", waiting: "waiting for answer", idle: "idle", statusWaiting: "waiting", statusRunning: "running", failed: "failed", unknown: "—",
    lastTurn: "last", done: "done", noFolder: "no folder",
    roleMain: "main", roleHelper: "helper", roleNone: "unset", actions: "Actions",
    setMain: "Make main", setHelper: "Make helper",
    fillHelpers: "Fill helpers", overCap: "over 3", noCoord: "No coordinator set", copyId: "Copy id", copyShort: "Double-click to copy the full session id", alias: "Display name", setAlias: "Rename", tidyTitles: "Tidy titles", saving: "Saving...", makeCoord: "Create coordinator", hintMakeCoord: "Register this folder as a project and create a coordinator session", coordRetry: "Open the task and click Create coordinator to retry", coordRetrying: "Coordinator creation is being retried in the background",
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
    runsOf: (a, b) => (b > 0 ? a + "/" + b : String(a)),
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
    convergePrompt: (title, dir, name, kind) =>
      kind === "progress"
        ? "Your progress file " + dir + "/progress/" + name + " is over budget. Compress only your own file: move the earliest half to " + dir + "/archive/" + name + "-<YYYY-MM>.md, keep the latest half plus the pointer line at the top, never drop items that are still open, never turn an undecided judgement into a conclusion. Reply in one line: lines moved and lines kept. Do not touch other sessions progress, HEAD, SUMMARY or DECISIONS."
        : "Task \"" + title + "\": " + dir + "/" + name + " is over budget. Shrink it per rules/task-collab.md section 8: keep only what is still current, move the older half to " + dir + "/archive/" + name + "-<YYYY-MM>.md, keep the pointer line at the top, never drop settled conclusions or their sources. Reply in one line: what changed and how many lines remain.",
    newSession: "New session", newSessionTitle: "Session name", newSessionRole: "Role", noDirectory: "This group has no absolute path to create in", sessionCreated: "Session created", creating: "Creating", firstMessage: "First message", sendNow: "Create and send", sent: "Sent", sendFailed: "Session created, first message was not sent",
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
      "2. Archive SUMMARY.md yourself when it exceeds 300 lines. For a progress-<id>.md over 400 lines, tell the session that owns it to compress and archive its own file; never rewrite another session's progress. Before archiving, lift reusable operating knowledge into RUNBOOK.md across seven buckets: deployment chain (repo to branch to pipeline to domain, rollback point), environment, git (baseline, worktree, merge order, conflicts), simulator or device runs, build, verification, pitfalls.\n" +
      "3. Tidy: move finished deliverables scattered in the task folder (test package, design, DMS draft, config change log, checklists, pending replies, message drafts) into " + dir + "/deliverables/. Move only what is clearly a deliverable; list the uncertain ones for me. Delete nothing.\n" +
      "4. Report: one line on which files changed, how many lines were archived, and HEAD in three sentences; list anything that needs my decision separately.\n\n" +
      "Credentials: write where they live, never their value. Do not touch business code, do not commit, push or merge.",
    patrol: "Run a patrol",
    foldAll: "Collapse sessions",
    foldOpen: "Expand sessions",
    phase_active: "Active",
    phase_done: "Done",
    phase_dropped: "Dropped",
    phaseEmpty: "Nothing on this tab",
    phaseMoved: "Moved",
    patrolPrompt: (title, dir) =>
      "Run one patrol round for task \"" + title + "\" as the coordinator. Read C:\\Users\\HUAWEI\\.task-hub\\tasks.json and " + dir + ", then HEAD.md, SUMMARY.md, RUNBOOK.md and DECISIONS.md, plus only the last three sections of the progress files that changed this round. Sort every member into running / can-advance / needs-user / done. Send only the can-advance ones a four-part message (new info / one checkable action / stop condition / which file to write, with 【回话】 and returnResult). Append sourced conclusions to SUMMARY.md. Ask me only on hard boundaries (production change, deleting data, merging master or release, messaging outside systems); settle wording and implementation choices from the records yourself and say what you decided. Move loose deliverables into deliverables/ before you report. Report every member as \"name + full session id\".",
    summarize: "Ask coordinator", summaryQueued: "Switched to the coordinator, prompt is in its chat box",
    summaryPrompt: (title, dir) =>
      "Summarize task \"" + title + "\" now. Read " + dir + "/SUMMARY.md and every progress-*.md, then answer in six parts: 1) one-line status, 2) done, 3) in progress, 4) blocked / waiting on whom, 5) pitfalls hit so far with where they live, 6) next three actions. Append settled conclusions to SUMMARY.md with their source; leave open items in the progress files.",
    titlePrompt: (title, dir) =>
      "Tidy the session names for task \"" + title + "\". Read tasks.json and " + dir + ", then for every member set alias to \"<short project> - <what it is doing now>\": take the short project name from its worktree or directory (for example 微服务, 收银后端, goframe, cashier, H5), and describe the current concrete job from the newest progress file rather than the opening greeting. Rename the session itself with session_rename when you are sure; skip when the evidence is thin and list those instead. Write the result back to tasks.json and report each change as old -> new with the reason.",
    coord: "coordinator", coordGroup: "coordinator here", coordShort: "C",
    setCoord: "Make coordinator", clearCoord: "Unset coordinator",
    execCoord: "A session under an execution branch cannot be the coordinator",
    compose: "To chat box", composed: "Added to the chat box, send it yourself",
    remove: "Remove", open: "Open this session", gone: "Session not found",
    save: "Save", cancel: "Cancel", title: "Task name", goal: "What it is", accept: "Done when",
    folder: "Progress folder", folderHint: "Home paths (~/...) are readable. Other paths are recorded only.",
    must: "Name, what it is and done-when are required",
    created: "Task created", updated: "Saved", added: "Session added", already: "Already in this task",
    coordPrefix: "Coordinator \u00b7 ", coordCreated: "coordinator session created", coordFailed: "coordinator session failed:",
    addTo: "Add to", close: "Close", searchSessions: "Search sessions",
    noSessions: "No sessions found", loading: "Loading", noPeers: "No session yet",
    newFolder: "Folder", thisSession: "this session"
  },
  zh: {
    tasks: "任务", auto: "自动", on: "开", newTask: "新建", refresh: "刷新",
    refreshSizes: "重读文件体积",
    search: "搜索任务", sort: "排序", manual: "手动", name: "名称", members: "会话数",
    none: "还没有任务", noMatch: "没有匹配的任务", pick: "左边选一件任务",
    you: "你在里面", edit: "编辑", addSession: "加会话", delete: "删除", confirm: "再点删除",
    progress: "进度目录", copyPath: "复制路径", copyDone: "路径已复制",
    external: "外部", unreadable: "外部目录：面板只记录和复制路径，不读取里面的文件。", readFail: "读不到目录",
    running: "运行中", runningChild: "子代理", waiting: "待回答", idle: "空闲", statusWaiting: "待回答", statusRunning: "运行中", failed: "失败", unknown: "—",
    lastTurn: "上轮", done: "完成", noFolder: "无目录",
    roleMain: "主线", roleHelper: "辅助", roleNone: "未标", actions: "操作",
    setMain: "设为主线", setHelper: "设为辅助",
    fillHelpers: "补充看板会话", overCap: "超过三个", noCoord: "这件任务还没设协调会话", copyId: "复制会话 id", copyShort: "双击复制完整会话 id", alias: "显示名", setAlias: "改标题", tidyTitles: "让协调整理标题", saving: "保存中…", makeCoord: "建协调会话", hintMakeCoord: "把目录注册成项目并建一个协调会话", coordRetry: "打开任务点「建协调会话」可重试", coordRetrying: "协调会话正在后台补建，稍等",
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
    runsOf: (a, b) => (b > 0 ? a + "/" + b : String(a)),
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
    convergePrompt: (title, dir, name, kind) =>
      kind === "progress"
        ? "你这份 progress 已超预算：" + dir + "/progress/" + name + "。只压缩你自己的文件：把最早一半移进 " + dir + "/archive/" + name + "-<YYYY-MM>.md，正文留最近一半并保留顶部指针行；未闭环的项不许删，没定的判断不许写成结论。压完回一行：移了多少行、还剩多少行。不要动别人的 progress，也不改 HEAD / SUMMARY / DECISIONS。"
        : "任务「" + title + "」的 " + dir + "/" + name + " 已超预算。按 rules/task-collab.md 第八节收敛：只留当前有效内容，把较早的一半移进 " + dir + "/archive/" + name + "-<YYYY-MM>.md，正文保留顶部指针行；已定结论与出处不许丢。压完回一行：改了什么、现在剩多少行。",
    newSession: "新会话", newSessionTitle: "会话名", newSessionRole: "角色", noDirectory: "这一组拿不到绝对路径，不能建会话", sessionCreated: "已建会话", creating: "创建中", firstMessage: "初始消息", sendNow: "建会话并发送", sent: "已发出", sendFailed: "会话已建，首条消息没发出去",
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
      "1. 汇总：读 " + dir + "/HEAD.md、SUMMARY.md、RUNBOOK.md 和最近变化的 progress-*.md，把 HEAD.md 覆盖写成当前状态（≤160 行：状态 / 正在做 / 卡在哪 / 下一步 / 出处），不追加。\n" +
      "2. 归档：SUMMARY.md 超过 300 行由你归档；某份 progress-<id>.md 超过 400 行的，通知写它的那个会话自己压缩归档，你不代改别人的 progress。归档前把可复用的操作知识提到 RUNBOOK.md，按七类扫：部署链条（仓→分支→流水线→域名，回滚点）、环境、git（基线/worktree/合并顺序/冲突）、模拟运行（模拟器/APK/设备号/登录）、构建、验证、踩坑。\n" +
      "3. 整理：把散在任务目录里的成品（提测资料、方案、DMS 工单草稿、配置变更记录、清单、待发回复、沟通文本）移进 " + dir + "/deliverables/；只移动明确是成品的，拿不准的列出来问我，不删任何文件。\n" +
      "4. 回报：一行说清改了哪些文件、归档了多少行、HEAD 现在的三句话；需要我拍板的单独列。\n\n" +
      "凭据只写位置不写值；不要动业务代码，不要提交、推送、合并。",
    patrol: "让协调巡检",
    foldAll: "一键收起",
    foldOpen: "一键展开",
    phase_active: "进行中",
    phase_done: "已完成",
    phase_dropped: "已废弃",
    phaseEmpty: "这个页签里还没有任务",
    phaseMoved: "已归到这个页签",
    patrolPrompt: (title, dir) =>
      "现在按信箱调度跑一轮巡检任务「" + title + "」。先读 C:\\Users\\HUAWEI\\.task-hub\\tasks.json 和 " + dir + "，再读 HEAD.md / SUMMARY.md / RUNBOOK.md / DECISIONS.md，以及本轮有变化的 progress 的最后三段。对每个成员分在跑 / 可推进 / 等你定 / 已完成；只给可推进的发一条四段式消息（新信息 / 一个可验收动作 / 停止条件 / 写回路径，带【回话】和 returnResult）；有出处的结论写进 SUMMARY.md；命中硬边界（生产改动、删数据、合并 master 或 release、对外发消息）才问我，口径与实现选择按记录自己定并写明依据。顺手把散落在目录里的成品移进 deliverables/。成员一律报「名称 + 完整 session id」。",
    summarize: "让协调总结", summaryQueued: "已切到协调会话，提示词在它的输入框里",
    summaryPrompt: (title, dir) =>
      "现在总结任务「" + title + "」。先读 " + dir + "/SUMMARY.md 和所有 progress-*.md，然后按六段回答：1) 一句话现状 2) 已完成 3) 进行中 4) 卡住的地方与在等谁 5) 已经踩过的坑及各自位置 6) 接下来三步。把已定的结论带出处追加进 SUMMARY.md，未定的留在各 progress 文件里。",
    titlePrompt: (title, dir) =>
      "整理任务「" + title + "」下所有会话的名字。先读 tasks.json 和 " + dir + "。对每个成员，把 alias 设成「项目简称 - 现在在做什么」：项目简称取它所在 worktree 或目录名（例如 微服务、收银后端、goframe、cashier、H5），具体任务从最新的 progress 文件里看，不要照抄标题开头那句问候。有把握时用 session_rename 把会话本体也改成同样的名字；证据不足的跳过并在回报里列出来。改完写回 tasks.json，并把每处改动以「旧名 → 新名（依据）」列给我。",
    coord: "协调", coordGroup: "协调所在", coordShort: "协",
    setCoord: "标识协调会话", clearCoord: "取消协调",
    execCoord: "执行目录里的会话不能当协调",
    compose: "放入聊天框", composed: "已放入聊天框，确认后自己发送",
    remove: "移除", open: "打开这个会话", gone: "会话不存在",
    save: "保存", cancel: "取消", title: "任务名", goal: "做什么", accept: "验收是什么",
    folder: "进度目录", folderHint: "家目录（~/…）可读；其他路径只记录，不读内容。",
    must: "任务名、做什么、验收都要填",
    created: "已建任务", updated: "已保存", added: "已加会话", already: "这一方已经在里面",
    coordPrefix: "协调 \u00b7 ", coordCreated: "协调会话已建", coordFailed: "协调会话没建成：",
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
  newFor: null, newTitle: "", newText: "", newDir: "", newRole: "helper", newBusy: false, newCreated: "", saveBusy: false, coordBusy: false, filesOpen: false,
  schedules: new Map(), scheduleFor: null, scheduleForm: null,
  deleting: null, deleteTimer: 0, dragId: null, dragTaskId: null,
  labels: {}, phase: "active"
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
function refreshBadge() {
  let waiting = 0
  for (const id of S.ids) {
    const task = S.tasks.get(id)
    if (task) waiting += taskStatus(task).waiting
  }
  if (typeof host.setBadge === "function") host.setBadge(waiting || null).catch(() => {})
}

function tickStates() {
  for (const item of S.stateNodes) renderState(item.el, item.member)
  for (const item of S.groupNodes) paintGroupState(item.el, item.list)
  paintTaskDots()
}

/* 任务列表的圆点不在会话状态节点里，每秒单独刷，避免整列重建。 */
function paintTaskDots() {
  const box = el("list")
  if (!box) return
  for (const item of box.querySelectorAll(".item[data-task]")) {
    const task = S.tasks.get(item.dataset.task)
    const dot = item.querySelector(".dot")
    if (!task || !dot) continue
    const status = taskStatus(task)
    dot.className = "dot " + status.kind
    dot.title =
      status.kind === "wait"
        ? t("statusWaiting") + " " + status.waiting
        : status.kind === "run"
          ? t("statusRunning") + " " + status.running
          : t("idle")
  }
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

async function readRepoLabels() {
  const value = await readJson(FILE_REPOS, { repos: [] })
  const map = {}
  for (const repo of value.repos || []) {
    if (!repo || !repo.label) continue
    if (repo.alias) map[String(repo.alias)] = String(repo.label)
    if (repo.path) map[normPath(repo.path)] = String(repo.label)
  }
  return map
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

async function listNames(dir, pattern) {
  try {
    const listing = await host.listDir(dir)
    return (listing.entries || [])
      .filter((entry) => entry.kind === "file" && pattern.test(entry.name))
      .map((entry) => entry.name)
      .sort()
  } catch {
    return []
  }
}

// 2026-11-04 修：progress 已收进 progress/ 子目录，README 退休；
// 旧结构（文件还在根下）保留回退，迁移中的任务不至于看不到文件。
async function progressFiles(task) {
  const dir = (task.progressDir || "").replace(/\/+$/, "")
  const files = [
    { group: "core", name: "HEAD.md", path: dir + "/HEAD.md", budget: FILE_BUDGET["HEAD.md"] },
    { group: "core", name: "SUMMARY.md", path: dir + "/SUMMARY.md", budget: FILE_BUDGET["SUMMARY.md"] },
    { group: "core", name: "RUNBOOK.md", path: dir + "/RUNBOOK.md", budget: FILE_BUDGET["RUNBOOK.md"] },
    { group: "core", name: "DECISIONS.md", path: dir + "/DECISIONS.md", budget: 0 }
  ]
  let base = dir + "/progress"
  let names = await listNames(base, /^progress-.*\.md$/)
  if (!names.length) {
    base = dir
    names = await listNames(base, /^progress-.*\.md$/)
  }
  for (const name of names) {
    files.push({ group: "progress", name, path: base + "/" + name, budget: FILE_BUDGET.progress })
  }
  files.push({ group: "dir", name: "deliverables/", path: dir + "/deliverables" })
  files.push({ group: "dir", name: "archive/", path: dir + "/archive" })
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

function headText(task) {
  const lines = [
    "# " + (task.title || task.id) + " \u00b7 \u5f53\u524d\u72b6\u6001",
    "",
    "> \u6bcf\u8f6e\u8986\u76d6\u5199\uff0c\u4e0d\u8ffd\u52a0\u3002",
    "",
    "## \u72b6\u6001",
    "",
    "## \u6b63\u5728\u505a",
    "",
    "## \u5361\u5728\u54ea",
    "",
    "## \u4e0b\u4e00\u6b65",
    "",
    "## \u51fa\u5904"
  ]
  return lines.join("\n") + "\n"
}

async function ensureFolder(task, force) {
  if (!readable(task)) return
  const dir = task.progressDir.replace(/\/+$/, "")
  // README 已退休：不再生成，否则每次打开详情都会把移走的文件写回来。
  const head = dir + "/HEAD.md"
  if (force || !(await statPath(head))) {
    await host.writeFile(head, headText(task)).catch(() => {})
  }
  const summary = dir + "/SUMMARY.md"
  if (!(await statPath(summary))) {
    await host.writeFile(summary, "# " + (task.title || task.id) + " · 汇总\n\n只写已定结论。\n\n").catch(() => {})
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
let liveCache = { at: 0, key: "", map: null, timing: null }
const LIVE_CACHE_MS = 10000

function watchedDirs() {
  const dirs = []
  const add = (value) => {
    const dir = normPath(value)
    if (dir && !dirs.includes(dir)) dirs.push(dir)
  }
  for (const task of S.tasks.values()) {
    add(task.progressDir)
    for (const member of task.members || []) add(member.directory)
    for (const repo of (task.board && task.board.repos) || []) {
      add(repo.root)
      if (repo.baseline) add(repo.baseline.path)
      for (const slot of repo.longLived || []) add(slot.path)
      for (const row of repo.parallels || []) add(row.path)
    }
  }
  return dirs
}

function projectWatched(project, dirs) {
  const dir = normPath(project.directory || project.path || "")
  if (!dir) return false
  return dirs.some((item) => item === dir || item.startsWith(dir + "/") || dir.startsWith(item + "/"))
}

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
  const dirs = watchedDirs()
  for (const project of projects) {
    if (!projectWatched(project, dirs)) continue
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

async function panelTiming(line) {
  const path = "~/.task-hub/panel-timing.log"
  try {
    const prev = await host.readFile(path).catch(() => ({ content: "" }))
    const kept = String((prev && prev.content) || "").split(/\r?\n/).filter(Boolean).slice(-240)
    kept.push(new Date().toISOString() + " " + line)
    await host.writeFile(path, kept.join("\n") + "\n")
  } catch {}
}

async function collectLive(force) {
  const key = watchedDirs().join("|")
  if (!force && liveCache.map && liveCache.key === key && Date.now() - liveCache.at < LIVE_CACHE_MS) {
    return { map: liveCache.map, timing: Object.assign({}, liveCache.timing, { cached: 1 }) }
  }
  const started = performance.now()
  const map = new Map()
  const snapshot = await host.listProjects().catch(() => null)
  const all = snapshot && Array.isArray(snapshot.projects) ? snapshot.projects : []
  const dirs = watchedDirs()
  const projects = all.filter((project) => projectWatched(project, dirs))
  const listedAt = performance.now()
  let sessions = 0
  const slow = []
  for (const project of projects) {
    const t0 = performance.now()
    const sessionsSnapshot = await host.listSessions(project.id).catch(() => null)
    const ms = Math.round(performance.now() - t0)
    const list = sessionsSnapshot && Array.isArray(sessionsSnapshot.sessions) ? sessionsSnapshot.sessions : []
    sessions += list.length
    if (ms >= 80) slow.push((project.name || project.directory || project.id) + " " + ms + "ms/" + list.length)
    for (const session of list) {
      map.set(session.id, {
        activity: session.activity || "unknown",
        title: session.title || "",
        directory: session.directory || project.directory || "",
        parentId: session.parentId || null
      })
    }
  }
  slow.sort((a, b) => Number(b.split(" ")[1]) - Number(a.split(" ")[1]))
  const timing = {
    projects: all.length,
    asked: projects.length,
    sessions,
    listProjectsMs: Math.round(listedAt - started),
    listSessionsMs: Math.round(performance.now() - listedAt),
    slow: slow.slice(0, 5),
    cached: 0
  }
  liveCache = { at: Date.now(), key, map, timing }
  return { map, timing }
}

function liveOf(member) {
  return S.live.get(member.sessionId) || null
}

function stateOf(member) {
  // 2026-11-05：宿主报「等提问/等授权」时优先显示等待，不能被服务端的 running 盖掉。
  const live = liveOf(member)
  if (live && (live.activity === "waiting-permission" || live.activity === "waiting-question")) return "waiting"
  // 宿主的 activity 是实时的。状态服务只认 busy/idle，思考阶段 busy 还没写上，
  // 会把正在思考的会话报成空闲，所以不能让它盖掉宿主已经给出的 running。
  if (live && (live.activity === "running" || live.activity === "retrying")) return "running"
  const svc = S.service.get(member.sessionId)
  if (svc) {
    if (svc.running) return "running"
    if (svc.lastMs) return "done"
    return "idle"
  }
  if (!live) return "unknown"
  if (live.activity === "idle") {
    if (S.busy.has(member.sessionId)) return "running-child"
    return "idle"
  }
  return "unknown"
}

// 一件任务的状态：有人等回答 > 有人在跑 > 空闲。
function taskStatus(task) {
  let waiting = 0
  let running = 0
  for (const member of task.members || []) {
    const live = liveOf(member)
    if (live && (live.activity === "waiting-permission" || live.activity === "waiting-question")) waiting++
    else if (stateOf(member) === "running" || stateOf(member) === "running-child") running++
  }
  if (waiting) return { kind: "wait", waiting, running }
  if (running) return { kind: "run", waiting, running }
  return { kind: "idle", waiting, running }
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

/** 面板打包的 SDK 没有请求超时；宿主不回答时会永远挂住，自己兜一层。 */
function withTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const error = new Error(label + " timeout")
      error.code = "TIMEOUT"
      reject(error)
    }, ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      }
    )
  })
}

/** 建会话没有宿主 API，走本地服务；服务已带 exec: opencode 权限。 */
async function createSessionRequest(directory, title, agent) {
  if (typeof host.serviceRequest !== "function") return { id: "", error: "no-service-api" }
  try {
    const res = await withTimeout(
      host.serviceRequest({
        method: "GET",
        path: "/createSession",
        query: { directory, title, agent }
      }),
      30000,
      "createSession"
    )
    const text = typeof res?.body === "string" ? res.body : ""
    const data = text ? JSON.parse(text) : null
    if (data && data.sessionId) return { id: String(data.sessionId), error: "" }
    return { id: "", error: (data && data.error) || "empty" }
  } catch (error) {
    return { id: "", error: String((error && error.code) || (error && error.message) || "ERR") }
  }
}

/* 首条消息不走 query：宿主代理会丢 POST body，长文本也会撞上 query 长度。
   面板能写 ~/.task-hub，先落文件，再让服务读文件送进会话。 */
async function sendFirstMessage(sessionId, text) {
  const body = String(text || "").trim()
  if (!body) return { ok: true, skipped: true }
  if (typeof host.writeFile !== "function" || typeof host.serviceRequest !== "function") return { ok: false, error: "no-service-api" }
  const name = "seed-" + sessionId.slice(4, 16) + ".txt"
  try {
    await host.writeFile("~/.task-hub/" + name, body.slice(0, 8000))
    const res = await withTimeout(
      host.serviceRequest({ method: "GET", path: "/sendFile", query: { sessionId, name } }),
      30000,
      "sendFile"
    )
    const raw = typeof res?.body === "string" ? res.body : ""
    const data = raw ? JSON.parse(raw) : null
    if (res && res.status && res.status >= 400) return { ok: false, error: (data && data.error) || String(res.status) }
    if (data && data.ok) return { ok: true }
    return { ok: false, error: (data && data.error) || "empty" }
  } catch (error) {
    return { ok: false, error: String((error && error.code) || (error && error.message) || "ERR") }
  }
}

async function loadSchedules() {
  if (typeof host.serviceRequest !== "function") return
  try {
    const res = await host.serviceRequest({ method: "GET", path: "/schedules" })
    const text = typeof res?.body === "string" ? res.body : ""
    const data = text ? JSON.parse(text) : null
    S.schedules = new Map()
    for (const s of (data && data.schedules) || []) S.schedules.set(s.taskId, s)
  } catch {}
}

async function saveSchedule(task) {
  const form = S.scheduleForm
  if (!form) return
  if (!task.coordinator) {
    toast(t("noCoord"), "error")
    return
  }
  if (executionIds(task).has(task.coordinator)) {
    toast(t("execCoord"), "error")
    return
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
    })
    S.scheduleFor = null
    S.scheduleForm = null
    await loadSchedules()
    render()
    toast(t("scheduleSaved"), "success")
  } catch (error) {
    toast(String((error && error.code) || "ERR"), "error")
  }
}

async function removeSchedule(task) {
  try {
    await host.serviceRequest({ method: "DELETE", path: "/schedules", query: { taskId: task.id } })
    S.scheduleFor = null
    S.scheduleForm = null
    await loadSchedules()
    render()
    toast(t("scheduleRemoved"), "success")
  } catch (error) {
    toast(String((error && error.code) || "ERR"), "error")
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
  const started = performance.now()
  try {
    S.settings = await readSettings()
    S.labels = await readRepoLabels()
    const list = await readTasks()
    const jsonMs = Math.round(performance.now() - started)
    S.ids = list.map((task) => task.id)
    S.tasks = new Map(list.map((task) => [task.id, task]))
    const hadLive = S.live && S.live.size > 0
    const key = JSON.stringify({ labels: S.labels, tasks: list.map((task) => [task.id, task.title, task.status || "active", task.progressDir, task.coordinator, task.board || null, (task.members || []).map((m) => [m.sessionId, m.title])]) })
    if (key !== S.lastKey) {
      S.lastKey = key
      render()
    }
    const live = await collectLive(force)
    S.live = live.map
    void loadSchedules()
    recomputeBusy()
    void subscribeLive()

    const wanted = new Set()
    for (const task of S.tasks.values()) {
      for (const member of task.members || []) wanted.add(member.sessionId)
    }
    const svcStarted = performance.now()
    const svc = await serviceStates([...wanted], force)
    const svcMs = Math.round(performance.now() - svcStarted)
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
        if (!(current.activity === "running" || current.activity === "retrying" || current.activity === "waiting-permission" || current.activity === "waiting-question")) {
          current.activity = state && state.running ? "running" : "idle"
        }
        S.live.set(id, current)
      }
    }
    el("status").textContent = (svc.error ? "svc:" + svc.error + " · " : "") +
      "加载 " + Math.round(performance.now() - started) + "ms"
    const timing = live.timing
    void panelTiming(
      "load force=" + (force ? 1 : 0) +
      " json=" + jsonMs +
      " projects=" + timing.projects +
      " asked=" + timing.asked +
      " cached=" + (timing.cached || 0) +
      " sessions=" + timing.sessions +
      " listProjects=" + timing.listProjectsMs +
      " listSessions=" + timing.listSessionsMs +
      " service=" + svcMs +
      " members=" + wanted.size +
      " total=" + Math.round(performance.now() - started) +
      (timing.slow.length ? " slow=" + timing.slow.join(",") : "")
    )
    tickStates()
    if (!hadLive) void renderDetail()
  } catch (error) {
    el("status").textContent = (error && error.code) || "ERR"
    void panelTiming("load error " + String((error && error.message) || error))
  }
}

async function persist(task) {
  task.updatedAt = Date.now()
  if (!S.ids.includes(task.id)) S.ids.push(task.id)
  S.tasks.set(task.id, task)
  await writeTasks(S.ids.map((id) => S.tasks.get(id)).filter(Boolean))
}

async function removeTask(id) {
  const task = S.tasks.get(id)
  const archived = task ? await archiveTaskDir(task) : { error: "no-task" }
  S.ids = S.ids.filter((x) => x !== id)
  S.tasks.delete(id)
  await writeTasks(S.ids.map((taskId) => S.tasks.get(taskId)).filter(Boolean))
  if (S.selected === id) S.selected = null
  if (task) {
    toast(
      archived.path ? t("deletedMoved") : t("deletedKept") + " " + String(archived.error || ""),
      archived.path ? "success" : "warn"
    )
  }
}

function taskPhase(task) {
  return task && (task.status === "done" || task.status === "dropped") ? task.status : "active"
}

function phaseCount(phase) {
  return S.ids.map((id) => S.tasks.get(id)).filter((task) => task && taskPhase(task) === phase).length
}

async function setPhase(task, phase) {
  if (taskPhase(task) === phase) return
  task.status = phase
  await persist(task)
  toast(t("phase_" + phase), "success")
  render()
}

function phaseBar(task) {
  const row = document.createElement("div")
  row.className = "phasebar"
  for (const phase of ["active", "done", "dropped"]) {
    row.appendChild(button(t("phase_" + phase), taskPhase(task) === phase ? "primary" : "", () => void setPhase(task, phase)))
  }
  return row
}

function renderTabs() {
  const box = el("tabs")
  if (!box) return
  box.replaceChildren()
  for (const phase of ["active", "done", "dropped"]) {
    const tab = document.createElement("button")
    tab.type = "button"
    tab.className = "tab" + ((S.phase || "active") === phase ? " on" : "")
    tab.textContent = t("phase_" + phase) + " " + phaseCount(phase)
    tab.onclick = () => {
      S.phase = phase
      const list = visibleTasks()
      if (!list.some((task) => task.id === S.selected)) S.selected = list[0] ? list[0].id : null
      render()
    }
    box.appendChild(tab)
  }
}

function visibleTasks() {
  const text = S.query.trim().toLowerCase()
  let list = S.ids.map((id) => S.tasks.get(id)).filter(Boolean)
  list = list.filter((task) => taskPhase(task) === (S.phase || "active"))
  if (text) list = list.filter((task) => String(task.title || "").toLowerCase().includes(text))
  if (S.sort === "name") list.sort((a, b) => String(a.title || "").localeCompare(String(b.title || "")))
  if (S.sort === "members") list.sort((a, b) => (b.members || []).length - (a.members || []).length)
  return list
}

function currentTask() {
  const list = visibleTasks()
  return list.find((task) => task.id === S.selected) || list[0] || null
}

async function gotoSession(sessionId, options = {}) {
  try {
    await host.openSession(sessionId)
  } catch (error) {
    if (String((error && error.code) || "") !== "NO_SESSION") throw error
    // 2026-11-05：宿主只缓存当前项目的会话。跨任务打开时先让它列出目标项目，
    // 把会话灌进共享缓存，再重试一次；仍失败才把 NO_SESSION 抛出去。
    let warmed = false
    try {
      const projects = await host.listProjects()
      const projectList = Array.isArray(projects) ? projects : (projects && projects.projects) || []
      for (const project of projectList) {
        const snapshot = await host.listSessions(project.id)
        const sessionList = Array.isArray(snapshot) ? snapshot : (snapshot && snapshot.sessions) || []
        if (sessionList.some((session) => session.id === sessionId)) {
          warmed = true
          break
        }
      }
    } catch {}
    if (!warmed) throw error
    await host.openSession(sessionId)
  }
  // 巡检/收拢这类动作要在跳过去之后继续往聊天框放提示，所以默认把看板重开；
  // 点任务标题的跳转传 keepPanel: false，真正落到协调会话所在项目。
  if (options.keepPanel !== false && typeof host.openSurface === "function") {
    const open = () => host.openSurface("plugin:task-hub").catch(() => {})
    void open()
    setTimeout(() => void open(), 500)
  }
}

async function runSettle(task) {
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
}

function isMine(task) {
  return Boolean(S.me) && (task.members || []).some((member) => member.sessionId === S.me)
}

/* ---------------- render ---------------- */

function button(label, variant, onClick, hint) {
  const b = document.createElement("button")
  b.type = "button"
  b.className = "btn " + (variant || "")
  b.textContent = label
  b.onclick = onClick
  // 悬停说明：图标与短文案按钮靠它讲清作用。
  if (hint) b.title = hint
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
    empty.textContent = S.query ? t("noMatch") : t("phaseEmpty")
    box.appendChild(empty)
    return
  }
  for (const task of list) {
    const item = document.createElement("div")
    item.className = "item" + (task === currentTask() ? " on" : "")
    item.dataset.task = task.id
    item.setAttribute("role", "button")
    item.tabIndex = 0
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        item.click()
      }
    })
    if (isMine(task)) item.classList.add("mine")
    const status = taskStatus(task)
    const dot = document.createElement("span")
    dot.className = "dot " + status.kind
    dot.title =
      status.kind === "wait"
        ? t("statusWaiting") + " " + status.waiting
        : status.kind === "run"
          ? t("statusRunning") + " " + status.running
          : t("idle")
    item.appendChild(dot)
    // 任务 id 固定显示在名称下方：一件任务在多个仓库、多个会话里出现时，靠它对齐。
    const col = document.createElement("span")
    col.className = "item-col"
    const name = document.createElement("span")
    name.className = "item-name" + (task.coordinator ? " link" : "")
    name.textContent = task.title || task.id
    if (task.coordinator) name.title = t("hintJump")
    name.onclick = (event) => {
      event.stopPropagation()
      // 先切换任务，再跳协调会话；跳转后不重开看板，落到会话所在项目。
      S.selected = task.id
      S.deleting = null
      S.newFor = null
      render()
      if (!task.coordinator) {
        toast(t("noCoord"), "error")
        return
      }
      void gotoSession(task.coordinator, { keepPanel: false }).catch((error) =>
        toast(String((error && error.code) || "ERR"), "error")
      )
    }
    const idTag = document.createElement("span")
    idTag.className = "item-id"
    idTag.textContent = task.id
    col.append(name, idTag)
    const meta = document.createElement("span")
    meta.className = "item-meta"
    meta.textContent = String((task.members || []).length)
    if (status.kind === "wait") {
      const waitTag = document.createElement("span")
      waitTag.className = "tag wait"
      waitTag.textContent = t("statusWaiting")
      item.appendChild(waitTag)
    }
    item.appendChild(col)
    // 2026-11-05：跳协调会话改为点标题，列表项不再放「协」按钮。
    item.appendChild(meta)
    item.onclick = () => {
      S.selected = task.id
      S.deleting = null
      // 表单属于某件任务的某个分组；换任务就收掉，免得挂到同名分组上。
      S.newFor = null
      render()
    }
    // 拖动排序：拖动时自动切回手动排序，否则按名称/成员数排序会把顺序盖掉。
    item.draggable = true
    item.addEventListener("dragstart", (event) => {
      S.dragTaskId = task.id
      S.sort = "manual"
      if (event.dataTransfer) event.dataTransfer.effectAllowed = "move"
    })
    item.addEventListener("dragend", () => {
      S.dragTaskId = null
      for (const node of box.querySelectorAll(".drop-target")) node.classList.remove("drop-target")
    })
    item.addEventListener("dragover", (event) => {
      if (!S.dragTaskId || S.dragTaskId === task.id) return
      event.preventDefault()
      item.classList.add("drop-target")
    })
    item.addEventListener("dragleave", () => item.classList.remove("drop-target"))
    item.addEventListener("drop", (event) => {
      event.preventDefault()
      item.classList.remove("drop-target")
      const from = S.dragTaskId
      S.dragTaskId = null
      if (from && from !== task.id) void reorderTasks(from, task.id)
    })
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
  const dir = live && live.directory ? live.directory.split(/[\\/]/).filter(Boolean).pop() : member.directory
  if (dir) {
    sub.appendChild(document.createTextNode(dir))
    sub.appendChild(document.createTextNode(" \u00b7 "))
  }
  const code = document.createElement("span")
  code.className = "sid"
  code.textContent = member.sessionId.slice(-6)
  code.title = t("copyShort")
  code.ondblclick = async (event) => {
    event.stopPropagation()
    event.preventDefault()
    try {
      await host.writeClipboard(member.sessionId)
      toast(t("copyDone"), "success")
    } catch (error) {
      toast(String((error && error.code) || "ERR"), "error")
    }
  }
  sub.appendChild(code)
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
      ...(executionIds(task).has(member.sessionId) && !isCoord ? [] : [
        button(isCoord ? t("clearCoord") : t("setCoord"), "accent", () => void setCoordinator(task, isCoord ? null : member.sessionId))
      ]),
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
  const text = document.createElement("textarea")
  text.className = "rename"
  text.rows = 3
  text.placeholder = t("firstMessage")
  text.value = S.newText
  text.oninput = () => {
    S.newText = text.value
  }
  const roleMain = button(t("roleMain"), S.newRole === "main" ? "primary" : "", () => {
    S.newRole = "main"
    void renderDetail()
  })
  const roleHelper = button(t("roleHelper"), S.newRole === "helper" ? "primary" : "", () => {
    S.newRole = "helper"
    void renderDetail()
  })
  const create = button(S.newBusy ? t("creating") : (String(S.newText || "").trim() ? t("sendNow") : t("newSession")), "primary", () => void submitNewSession(task, key, list))
  create.disabled = S.newBusy
  const cancel = button(t("cancel"), "", () => {
    if (S.newBusy) return
    S.newFor = null
    void renderDetail()
  })
  cancel.disabled = S.newBusy
  box.append(input, text, roleMain, roleHelper, create, cancel)
  setTimeout(() => input.focus(), 0)
  return box
}

async function submitNewSession(task, key, list) {
  if (S.newBusy) return
  const dir = S.newDir || groupDirectory(list)
  if (!dir) {
    toast(t("noDirectory"), "error")
    return
  }
  const taskId = task.id
  const role = S.newRole
  const title = String(S.newTitle || "").trim() || key + " - " + t("newSession")
  const first = String(S.newText || "").trim()
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
    S.newText = ""
    S.newDir = ""
  }
  S.newCreated = ""
  const sent = await sendFirstMessage(res.id, first)
  render()
  if (!sent.ok) toast(t("sendFailed") + " \u00b7 " + String(sent.error || ""), "error")
  else toast(t("sessionCreated") + (first ? " \u00b7 " + t("sent") : "") + (stillOpen ? "" : " " + res.id), "success")
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
    S.newText = ""
    S.newDir = ""
    S.newRole = "helper"
    S.newBusy = false
    S.newCreated = ""
    S.expanded.add(key)
    void renderDetail()
  }

  row.append(toggle, add)
  return row
}

function boardRepos(task) {
  const board = task && task.board
  return board && Array.isArray(board.repos) && board.repos.length ? board.repos : null
}

function normPath(value) {
  return String(value || "").replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase()
}

function pathTail(value) {
  const parts = normPath(value).split("/").filter(Boolean)
  return parts.length ? parts[parts.length - 1] : ""
}

function memberDir(member) {
  const live = liveOf(member)
  return String((live && live.directory) || member.directory || "")
}

function treeOpen(key, openByDefault) {
  if (!S.treeSeen) S.treeSeen = new Set()
  if (!S.treeSeen.has(key)) {
    S.treeSeen.add(key)
    if (openByDefault) S.expanded.add(key)
    else S.expanded.delete(key)
  }
  return S.expanded.has(key)
}

function treeToggle(key) {
  if (S.expanded.has(key)) S.expanded.delete(key)
  else S.expanded.add(key)
  void renderDetail()
}

function treeButton(label, key, open, className, members) {
  const btn = document.createElement("button")
  btn.type = "button"
  btn.className = "tree-fold" + (className ? " " + className : "")
  const caret = document.createElement("span")
  caret.className = "caret"
  caret.textContent = open ? "\u25be" : "\u25b8"
  const name = document.createElement("span")
  name.className = "group-name"
  name.textContent = label
  btn.append(caret, name)
  // 空目录不画：没人不是「完成」。有会话才按运行中 > 待回答 > 空闲上卷。
  if (members && members.length) {
    const state = document.createElement("span")
    state.className = "state"
    paintGroupState(state, members)
    S.groupNodes.push({ el: state, list: members })
    btn.appendChild(state)
  }
  btn.onclick = () => treeToggle(key)
  return btn
}

function showBranchTip(text, anchor) {
  let tip = document.getElementById("branch-tip")
  if (!tip) {
    tip = document.createElement("div")
    tip.id = "branch-tip"
    document.body.appendChild(tip)
  }
  tip.textContent = text
  tip.hidden = false
  const rect = anchor.getBoundingClientRect()
  const width = 260
  tip.style.left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)) + "px"
  tip.style.top = (rect.bottom + 6) + "px"
}

function hideBranchTip() {
  const tip = document.getElementById("branch-tip")
  if (tip) tip.hidden = true
}

function branchMark(text) {
  const mark = document.createElement("span")
  mark.className = "qmark"
  mark.textContent = "?"
  mark.title = text
  mark.onmouseenter = () => showBranchTip(text, mark)
  mark.onmouseleave = hideBranchTip
  mark.onclick = (event) => {
    event.stopPropagation()
    event.preventDefault()
  }
  return mark
}

function repoTitle(repo) {
  const labels = S.labels || {}
  return labels[repo.key] || labels[normPath(repo.root)] || repo.name || repo.key || ""
}

function parallelPurpose(repo, dir) {
  const hit = (repo.parallels || []).find((row) => normPath(row.path) === normPath(dir))
  return (hit && hit.purpose) || "从基线拉出，做完合回基线。"
}

function treeSlot(task, title, kind, members, note, foldKey, purpose, directory) {
  const slot = document.createElement("div")
  slot.className = "tree-slot"
  const open = treeOpen(foldKey, true)
  const head = document.createElement("div")
  head.className = "tree-line"
  const fold = document.createElement("button")
  fold.type = "button"
  fold.className = "tree-fold sub"
  const caret = document.createElement("span")
  caret.className = "caret"
  caret.textContent = open ? "\u25be" : "\u25b8"
  const name = document.createElement("span")
  name.className = "group-name"
  name.textContent = title
  fold.append(caret, name)
  if (purpose) fold.appendChild(branchMark(purpose))
  if (kind) {
    const tag = document.createElement("span")
    tag.className = "tree-kind"
    tag.textContent = kind
    fold.appendChild(tag)
  }
  fold.onclick = () => treeToggle(foldKey)
  head.appendChild(fold)
  const dir = absoluteDir(directory || "")
  if (dir) head.appendChild(slotAdd(task, foldKey, title, dir))
  slot.appendChild(head)
  if (S.newFor === foldKey) slot.appendChild(newSessionEditor(task, title, members))
  if (!open) return slot
  if (note) {
    const line = document.createElement("div")
    line.className = "tree-note"
    line.textContent = note
    slot.appendChild(line)
  }
  if (!members.length) {
    const empty = document.createElement("div")
    empty.className = "tree-empty"
    empty.textContent = "还没开"
    slot.appendChild(empty)
    return slot
  }
  const grid = document.createElement("div")
  grid.className = "members"
  for (const member of members) grid.appendChild(memberRow(task, member))
  slot.appendChild(grid)
  return slot
}

function slotAdd(task, key, title, directory) {
  const add = document.createElement("button")
  add.type = "button"
  add.className = "btn accent group-add"
  add.textContent = "+"
  add.title = t("newSession") + "\u00b7 " + directory
  add.onclick = (event) => {
    event.stopPropagation()
    if (S.newBusy) return
    if (S.newCreated) {
      toast(t("orphan"), "error")
      return
    }
    S.newFor = key
    S.newTitle = title
    S.newText = ""
    S.newDir = directory
    S.newRole = "helper"
    S.newBusy = false
    S.newCreated = ""
    S.expanded.add(key)
    if (!S.treeSeen) S.treeSeen = new Set()
    S.treeSeen.add(key)
    void renderDetail()
  }
  return add
}

function arrangeBoard(task) {
  const repos = boardRepos(task)
  const slots = []
  repos.forEach((repo) => {
    ;(repo.longLived || []).forEach((slot, index) => {
      slots.push({ repo: repo.key, kind: "long", index, path: slot.path || "" })
    })
    if (repo.baseline) slots.push({ repo: repo.key, kind: "base", index: 0, path: repo.baseline.path || "" })
  })
  const tails = {}
  slots.forEach((slot) => {
    const tail = pathTail(slot.path)
    if (tail) tails[tail] = (tails[tail] || 0) + 1
  })
  const used = new Set()
  const top = []
  const placed = {}
  const parallel = {}
  function slotKey(slot) { return slot.repo + ":" + slot.kind + ":" + slot.index }
  function put(slot, member) {
    const key = slotKey(slot)
    if (!placed[key]) placed[key] = []
    placed[key].push(member)
    used.add(member)
  }
  for (const member of task.members || []) {
    const dir = normPath(memberDir(member))
    const onTask = dir.endsWith("/" + String(task.id || "").toLowerCase()) || pathTail(dir) === String(task.id || "").toLowerCase()
    if (member.sessionId === task.coordinator || onTask) {
      top.push(member)
      used.add(member)
    }
  }
  for (const member of task.members || []) {
    if (used.has(member)) continue
    const dir = normPath(memberDir(member))
    if (!dir.includes("/")) continue
    const hit = slots.find((slot) => normPath(slot.path) && normPath(slot.path) === dir)
    if (hit) put(hit, member)
  }
  for (const member of task.members || []) {
    if (used.has(member)) continue
    const dir = normPath(memberDir(member))
    if (!dir || dir.includes("/") || tails[dir] !== 1) continue
    const hit = slots.find((slot) => pathTail(slot.path) === dir)
    if (hit) put(hit, member)
  }
  for (const member of task.members || []) {
    if (used.has(member)) continue
    const dir = normPath(memberDir(member))
    if (!dir.includes("/")) continue
    const repo = repos.find((item) => {
      const root = normPath(item.root)
      return root && (dir === root || dir.startsWith(root + "/") || dir.startsWith(root + "--worktrees/"))
    })
    if (!repo) continue
    if (!parallel[repo.key]) parallel[repo.key] = new Map()
    if (!parallel[repo.key].has(dir)) parallel[repo.key].set(dir, [])
    parallel[repo.key].get(dir).push(member)
    used.add(member)
  }
  return {
    top,
    placed,
    parallel,
    rest: (task.members || []).filter((member) => !used.has(member))
  }
}

function executionIds(task) {
  const ids = new Set()
  if (!boardRepos(task)) return ids
  const laid = arrangeBoard(task)
  for (const repo of boardRepos(task)) {
    for (const member of laid.placed[repo.key + ":base:0"] || []) ids.add(member.sessionId)
    const extras = laid.parallel[repo.key]
    if (!extras) continue
    for (const list of extras.values()) {
      for (const member of list) ids.add(member.sessionId)
    }
  }
  return ids
}

function executionFoldKeys(task) {
  const keys = []
  const repos = boardRepos(task)
  if (!repos) return keys
  const laid = arrangeBoard(task)
  for (const repo of repos) {
    keys.push("tree:" + task.id + ":exec:" + repo.key)
    keys.push("tree:" + task.id + ":slot:" + repo.key + ":base")
    const extras = laid.parallel[repo.key]
    if (extras) {
      for (const dir of extras.keys()) keys.push("tree:" + task.id + ":slot:" + repo.key + ":par:" + dir)
    }
  }
  if (laid.rest.length) keys.push("tree:" + task.id + ":rest")
  return keys
}

function toggleExecution(task) {
  const keys = executionFoldKeys(task)
  if (!S.treeSeen) S.treeSeen = new Set()
  const open = keys.some((key) => S.expanded.has(key))
  for (const key of keys) {
    S.treeSeen.add(key)
    if (open) S.expanded.delete(key)
    else S.expanded.add(key)
  }
  void renderDetail()
}

function folderMembers(laid, repo, which) {
  const list = []
  if (which !== "exec") {
    ;(repo.longLived || []).forEach((_, index) => {
      for (const member of laid.placed[repo.key + ":long:" + index] || []) list.push(member)
    })
  }
  if (which !== "long") {
    for (const member of laid.placed[repo.key + ":base:0"] || []) list.push(member)
    const extras = laid.parallel[repo.key]
    if (extras) {
      for (const members of extras.values()) {
        for (const member of members) list.push(member)
      }
    }
  }
  return list
}

function renderBoard(task, box) {
  const repos = boardRepos(task)
  const laid = arrangeBoard(task)
  if (laid.top.length) {
    const key = "tree:" + task.id + ":coord"
    const open = treeOpen(key, true)
    const line = document.createElement("div")
    line.className = "tree-line"
    line.appendChild(treeButton("协调", key, open, ""))
    line.appendChild(slotAdd(task, key, "协调", absoluteDir(task.progressDir)))
    box.appendChild(line)
    if (S.newFor === key) box.appendChild(newSessionEditor(task, "协调", laid.top))
    if (open) {
      const grid = document.createElement("div")
      grid.className = "members"
      for (const member of laid.top) grid.appendChild(memberRow(task, member))
      box.appendChild(grid)
    }
  }
  for (const repo of repos) {
    const repoKey = "tree:" + task.id + ":repo:" + repo.key
    const repoOpen = treeOpen(repoKey, true)
    box.appendChild(treeButton(repoTitle(repo), repoKey, repoOpen, "", folderMembers(laid, repo, "repo")))
    if (!repoOpen) continue
    const body = document.createElement("div")
    body.className = "tree-body"
    const longKey = "tree:" + task.id + ":long:" + repo.key
    const longOpen = treeOpen(longKey, false)
    body.appendChild(treeButton("长期", longKey, longOpen, "sub long", folderMembers(laid, repo, "long")))
    if (longOpen) {
      const longBody = document.createElement("div")
      longBody.className = "tree-body"
      ;(repo.longLived || []).forEach((slot, index) => {
        const names = { main: "主检出", test: "test", develop: "develop", release: "release" }
        const title = (names[slot.kind] || slot.kind || "") + " " + (slot.branch || "")
        const members = laid.placed[repo.key + ":long:" + index] || []
        longBody.appendChild(treeSlot(task, title.trim(), "", members, slot.note || "", "tree:" + task.id + ":slot:" + repo.key + ":long:" + index, slot.purpose || slot.note || "长期目录。这个位置不随这件任务删除。", slot.path))
      })
      body.appendChild(longBody)
    }
    const execKey = "tree:" + task.id + ":exec:" + repo.key
    const execOpen = treeOpen(execKey, true)
    body.appendChild(treeButton("执行", execKey, execOpen, "sub", folderMembers(laid, repo, "exec")))
    if (execOpen) {
      const execBody = document.createElement("div")
      execBody.className = "tree-body"
      const baseline = repo.baseline || { branch: "未指定", path: "", note: "这件任务还没有指定基线" }
      const baseMembers = laid.placed[repo.key + ":base:0"] || []
      execBody.appendChild(treeSlot(task, baseline.branch || "未指定", "基线", baseMembers, baseline.note || "", "tree:" + task.id + ":slot:" + repo.key + ":base", baseline.purpose || "这件任务的基线。新分支从这里拉，做完合回这里。", baseline.path))
      const extras = laid.parallel[repo.key]
      if (extras) {
        for (const [dir, members] of extras) {
          execBody.appendChild(treeSlot(task, pathTail(dir), "并行", members, "从基线拉出，做完合回基线", "tree:" + task.id + ":slot:" + repo.key + ":par:" + dir, parallelPurpose(repo, dir), dir))
        }
      }
      body.appendChild(execBody)
    }
    box.appendChild(body)
  }
  if (laid.rest.length) {
    const key = "tree:" + task.id + ":rest"
    const open = treeOpen(key, false)
    box.appendChild(treeButton("未归入目录 " + laid.rest.length, key, open, ""))
    if (open) {
      const grid = document.createElement("div")
      grid.className = "members"
      for (const member of laid.rest) grid.appendChild(memberRow(task, member))
      box.appendChild(grid)
    }
  }
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
  const idBadge = document.createElement("span")
  idBadge.className = "tag id"
  idBadge.textContent = task.id
  idBadge.title = "任务 id（目录名 task-<id>）"
  head.appendChild(idBadge)
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
  }, t("hintDelete"))
  const moreBtn = button("\u22ef", "", () => {
    S.headMenu = !S.headMenu
    void renderDetail()
  })
  moreBtn.title = t("actions")

  if (!task.coordinator) {
    headActions.append(
      button(
        S.coordBusy ? t("creating") : t("makeCoord"),
        "accent",
        () => void ensureCoordinator(task),
        t("hintMakeCoord")
      )
    )
  }
  headActions.append(
    button(t("addSession"), "accent", () => void openPicker(task), t("hintAdd")),
    moreBtn,
    del
  )
  head.appendChild(headActions)
  box.appendChild(head)
  box.appendChild(phaseBar(task))

  if (S.headMenu) {
    const menu = document.createElement("div")
    menu.className = "headmenu"
    menu.append(
      button(t("settle"), "accent", () => void runSettle(task), t("hintSettle")),
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
      }, t("hintSummary")),
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
      }, t("hintTidyTitles")),
      button(t("edit"), "", () => openForm("edit", task), t("hintEdit")),
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
  if (boardRepos(task)) {
    renderBoard(task, box)
    return
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

// 表单默认截止：当天 22:00；已过 22:00 就顺延到明天。
function defaultUntil() {
  const d = new Date()
  d.setHours(22, 0, 0, 0)
  if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1)
  const pad = (n) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function scheduleEditor(task) {
  const form = S.scheduleForm
  const box = document.createElement("div")
  box.className = "menu schedule"

  const on = button(t("scheduleOn"), form.enabled ? "primary" : "", () => {
    form.enabled = true
    void renderDetail()
  })
  const off = button(t("scheduleOff"), !form.enabled ? "primary" : "", () => {
    form.enabled = false
    void renderDetail()
  })

  const interval = document.createElement("input")
  interval.type = "number"
  interval.min = "5"
  interval.className = "rename"
  interval.value = form.intervalMinutes
  interval.placeholder = t("interval")
  interval.title = t("interval")
  interval.oninput = () => {
    form.intervalMinutes = Number(interval.value) || 30
  }

  const runs = document.createElement("input")
  runs.type = "number"
  runs.min = "0"
  runs.className = "rename"
  runs.value = form.maxRuns
  runs.placeholder = t("maxRuns")
  runs.title = t("maxRuns")
  runs.oninput = () => {
    form.maxRuns = Number(runs.value) || 0
  }

  const until = document.createElement("input")
  until.type = "datetime-local"
  until.className = "rename"
  until.value = form.until
  until.title = t("until")
  until.oninput = () => {
    form.until = until.value
  }

  const save = button(t("save"), "primary", () => void saveSchedule(task))
  const del = button(t("delete"), "danger", () => void removeSchedule(task))
  const cancel = button(t("cancel"), "", () => {
    S.scheduleFor = null
    S.scheduleForm = null
    void renderDetail()
  })

  const field = (label, input) => {
    const wrap = document.createElement("label")
    wrap.className = "field"
    const span = document.createElement("span")
    span.textContent = label
    wrap.append(span, input)
    return wrap
  }

  box.append(on, off, field(t("interval"), interval), field(t("maxRuns"), runs), field(t("until"), until), save, del, cancel)
  return box
}

async function renderFiles(task, box) {
  // 这个块会被原地重绘（重读体积）：先把上一次挂在 box 后面的目录块摘掉，避免越叠越多。
  let sibling = box.nextElementSibling
  while (sibling && sibling.classList && sibling.classList.contains("dirs")) {
    const after = sibling.nextElementSibling
    sibling.remove()
    sibling = after
  }
  const files = await progressFiles(task)
  const rows = await Promise.all(
    files.map(async (file) => {
      if (file.group === "dir") {
        const listing = await host.listDir(file.path).catch(() => null)
        const entries = listing ? (listing.entries || []).filter((e) => e.kind === "file") : []
        return { ...file, count: entries.length, names: entries.map((e) => e.name) }
      }
      const info = await statPath(file.path)
      return { ...file, info, size: info ? info.size : 0 }
    })
  )

  box.replaceChildren()

  // 超限提示：任一文件到 80% 就在文件区顶部给一条，并直接放出收拢按钮。
  const breaches = rows
    .filter((r) => r.budget && r.size >= r.budget * 0.8)
    .sort((a, b) => b.size / b.budget - a.size / a.budget)
  if (breaches.length) {
    const worst = breaches[0]
    const pct = Math.round((worst.size / worst.budget) * 100)
    const alert = document.createElement("div")
    alert.className = "alert" + (pct >= 100 ? " bad" : "")
    const text = document.createElement("span")
    text.className = "alert-text"
    text.textContent = t("overBudget") + " \u00b7 " + worst.name + " " + pct + "%"
    alert.append(text, button(t("settle"), "accent", () => void runSettle(task), t("hintSettle")))
    box.appendChild(alert)
  }

  const makeChip = (row, label) => {
    const el = document.createElement("span")
    el.className = "file" + (row.info || row.group === "dir" ? "" : " missing")
    el.textContent = row.name + " \u00b7 " + label
    const role = t("fileRole")(row.name)
    el.title = row.path + (role ? "\n" + role : "")
    if (row.group === "dir") el.classList.add("dir")
    if (row.group === "core" || row.group === "progress") {
      const owner = row.group === "progress" ? progressOwner(task, row.name) : null
      const who = owner ? (owner.alias || owner.title || owner.sessionId.slice(-6)) : t("ownerCoord")
      const over = row.budget && row.size >= row.budget * 0.8
      const fix = document.createElement("button")
      fix.type = "button"
      fix.className = "btn tiny" + (over ? " accent" : "")
      fix.textContent = t("converge")
      fix.title = t("convergeHint")(who)
      fix.onclick = (event) => {
        event.stopPropagation()
        void convergeFile(task, row)
      }
      el.appendChild(fix)
    }
    return el
  }

  for (const row of rows.filter((r) => r.group === "core")) {
    const el = makeChip(row, row.info ? humanSize(row.size) : "\u2014")
    if (row.info) {
      el.classList.add("click")
      el.onclick = () => void openReader(row.name, row.path)
    }
    if (row.budget && row.size > 0) {
      el.appendChild(budgetBar(row.size, row.budget))
      if (row.size >= row.budget) el.classList.add("bad")
    }
    box.appendChild(el)
  }

  const progressRows = rows.filter((r) => r.group === "progress")
  if (progressRows.length) {
    const total = progressRows.reduce((a, r) => a + r.size, 0)
    const max = progressRows.reduce((a, r) => Math.max(a, r.size), 0)
    const head = document.createElement("span")
    head.className = "file click dir"
    head.textContent =
      "progress/ \u00b7 " + progressRows.length + " \u00b7 " + humanSize(total) + " \u00b7 max " + humanSize(max)
    head.title = S.filesOpen ? t("foldFiles") : t("unfoldFiles")(progressRows.length)
    head.onclick = () => {
      S.filesOpen = !S.filesOpen
      void renderDetail()
    }
    box.appendChild(head)
    if (S.filesOpen) {
      for (const row of progressRows) {
        const el = makeChip(row, row.info ? humanSize(row.size) : "\u2014")
        if (row.info) {
          el.classList.add("click")
          el.onclick = () => void openReader(row.name, row.path)
        }
        if (row.size > 0) el.appendChild(budgetBar(row.size, row.budget))
        if (row.size >= row.budget) el.classList.add("bad")
        box.appendChild(el)
      }
    } else if (progressRows.some((r) => r.size >= r.budget)) {
      head.classList.add("bad")
    }
  }

  const dirRows = rows.filter((r) => r.group === "dir")
  if (dirRows.length || boardRepos(task)) {
    const dirs = document.createElement("div")
    dirs.className = "dirs"
    const label = document.createElement("span")
    label.className = "dirs-label"
    label.textContent = t("folders")
    dirs.appendChild(label)
    for (const row of dirRows) {
      const el = makeChip(row, row.count ? row.count + " 个文件" : t("dirEmpty"))
      el.classList.add("click")
      el.onclick = () => void openReader(row.name, row.path, row.names.length ? row.names.join("\n") : t("dirEmpty"))
      dirs.appendChild(el)
    }
    if (boardRepos(task)) {
      const open = executionFoldKeys(task).some((key) => S.expanded.has(key))
      const fold = button(open ? t("foldAll") : t("foldOpen"), "", () => toggleExecution(task), "只收起或展开执行目录里的会话。协调和长期不动。")
      fold.classList.add("foldall")
      dirs.appendChild(fold)
    }
    box.after(dirs)
  }

  // 收敛/归档之后体积不会自己变：给一个就地重读的入口，不用重建整个详情。
  const again = document.createElement("button")
  again.type = "button"
  again.className = "btn tiny"
  again.textContent = "\u21bb"
  again.title = t("refreshSizes")
  again.onclick = (event) => {
    event.stopPropagation()
    void renderFiles(task, box)
  }
  box.appendChild(again)
}

function progressOwner(task, name) {
  const m = String(name).match(/^progress-([A-Za-z0-9]+)\.md$/)
  if (!m) return null
  return (task.members || []).find((x) => String(x.sessionId || "").endsWith(m[1])) || null
}

// 文件收敛：progress 归写它的会话，HEAD/SUMMARY/DECISIONS/RUNBOOK 归协调会话。
async function convergeFile(task, row) {
  const kind = row.group === "progress" ? "progress" : "core"
  const owner = kind === "progress" ? progressOwner(task, row.name) : null
  const target = kind === "progress" ? (owner && owner.sessionId) : task.coordinator
  if (!target) {
    toast(t("noOwner"), "error")
    return
  }
  try {
    await gotoSession(target)
    await host.compose({
      text: t("convergePrompt")(task.title || task.id, task.progressDir || "", row.name, kind),
      mode: "replace"
    })
    toast(t("convergeQueued"), "success")
  } catch (error) {
    toast(String((error && error.code) || "ERR"), "error")
  }
}

function budgetBar(size, budget) {
  const bar = document.createElement("span")
  bar.className = "bar"
  const ratio = budget ? size / budget : 0
  if (ratio >= 1) bar.classList.add("full")
  else if (ratio >= 0.8) bar.classList.add("warn")
  const fill = document.createElement("i")
  fill.style.width = Math.min(100, Math.round(ratio * 100)) + "%"
  bar.appendChild(fill)
  bar.title = humanSize(size) + " / " + humanSize(budget)
  return bar
}

// 读文件用 host.readFile：只显示前 200 行，全文仍在磁盘上。
async function openReader(name, path, preset) {
  const mask = document.createElement("div")
  mask.className = "reader-mask"
  const box = document.createElement("div")
  box.className = "reader"
  const head = document.createElement("div")
  head.className = "reader-head"
  const title = document.createElement("span")
  title.className = "reader-name"
  title.textContent = name
  head.appendChild(title)
  const close = button(t("readerClose"), "", () => mask.remove())
  mask.onclick = (event) => {
    if (event.target === mask) mask.remove()
  }
  const body = document.createElement("pre")
  body.className = "reader-body"
  box.append(head, body)
  mask.appendChild(box)
  document.body.appendChild(mask)

  let text = preset || ""
  if (!text) {
    try {
      const result = await host.readFile(path)
      text = String((result && result.content) || "")
    } catch (error) {
      text = String((error && error.code) || t("readFail"))
    }
  }
  const lines = text.split(/\r?\n/)
  body.textContent = lines.slice(0, 200).join("\n") || t("dirEmpty")
  if (lines.length > 200) {
    const note = document.createElement("div")
    note.className = "reader-note"
    note.textContent = t("readerTruncated") + " \u00b7 " + lines.length + " 行"
    box.appendChild(note)
  }
  const copy = button(t("readerCopy"), "accent", async () => {
    try {
      await host.writeClipboard(text)
      toast(t("copyDone"), "success")
    } catch (error) {
      toast(String((error && error.code) || "ERR"), "error")
    }
  })
  head.append(copy, close)
}

function humanSize(size) {
  if (!size) return "0"
  if (size < 1024) return size + "B"
  if (size < 1024 * 1024) return Math.round(size / 1024) + "K"
  return (size / 1024 / 1024).toFixed(1) + "M"
}

function render() {
  el("count").textContent = String(visibleTasks().length)
  renderTabs()
  renderList()
  void renderDetail()
  refreshBadge()
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

// 任务列表拖动：只改名册顺序，不动任务内容。
async function reorderTasks(fromId, toId) {
  const from = S.ids.indexOf(fromId)
  const to = S.ids.indexOf(toId)
  if (from < 0 || to < 0 || from === to) return
  S.ids.splice(from, 1)
  S.ids.splice(to, 0, fromId)
  await writeTasks(S.ids.map((id) => S.tasks.get(id)).filter(Boolean))
  render()
}

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
  if (sessionId && executionIds(task).has(sessionId)) {
    toast(t("execCoord"), "error")
    return
  }
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

// 新建任务后把它注册成 OpenChamber 项目：不注册，会话移过去就会从侧栏消失。
/** 服务端只认绝对路径：~/… 展开成家目录，斜杠统一成反斜杠。 */
function absoluteDir(dir) {
  return String(dir || "").replace(/^~/, "C:\\Users\\HUAWEI").replace(/\//g, "\\")
}

async function registerProject(task) {
  if (typeof host.serviceRequest !== "function") return { error: "no-service-api" }
  const dir = absoluteDir(task.progressDir)
  if (!dir) return { error: "bad-dir" }
  try {
    await withTimeout(
      host.serviceRequest({
        method: "GET",
        path: "/registerProject",
        // 侧栏项目名与任务 id 对得上：标题 · task-<id>。
        query: { dir, label: (task.title || task.id) + " \u00b7 " + task.id }
      }),
      8000,
      "registerProject"
    )
    return {}
  } catch (error) {
    return { error: String((error && error.code) || (error && error.message) || "ERR") }
  }
}

// 2026-11-05：协调会话用宿主 startSession 建，会话才会进宿主缓存、点标题能打开。
// 首条消息带上任务目录与建任务表单的信息，协调会话一开局就有上下文。
async function startCoordinatorSession(task) {
  if (typeof host.startSession !== "function") return { error: "no-start-session" }
  const dir = absoluteDir(task.progressDir)
  const want = dir.replace(/\\/g, "/").toLowerCase()
  // 新建任务的 settings 刚写盘，宿主的项目列表可能还没刷新：短轮询等它认到再建会话。
  let target = null
  for (let attempt = 0; attempt < 10 && !target; attempt++) {
    const projects = await host.listProjects().catch(() => null)
    const list = projects && Array.isArray(projects.projects) ? projects.projects : []
    target = list.find((project) => String(project.directory || "").replace(/\\/g, "/").toLowerCase() === want) || null
    if (!target) await new Promise((resolve) => setTimeout(resolve, 350))
  }
  if (!target) return { error: "no-project" }
  const brief = [
    "你是这件任务的协调会话。",
    "任务 id：" + task.id,
    "任务目录：" + dir,
    "标题：" + (task.title || ""),
    "做什么：" + (task.goal || ""),
    "验收：" + (task.acceptance || ""),
    "不改业务代码；要取证或动手就派给成员。",
    "",
    "先读 " + dir + "\\HEAD.md 与 SUMMARY.md，再按 rules/task-collab.md 工作。"
  ].join("\n")
  const base = {
    providerId: "task-hub",
    id: task.id,
    title: task.title || task.id,
    url: "https://task-hub.local/" + encodeURIComponent(task.id),
    projectId: target.id,
    navigation: "preserve"
  }
  try {
    let res = null
    try {
      res = await withTimeout(host.startSession({ ...base, text: brief }), 180000, "startSession")
    } catch (error) {
      // 没批 prompt 能力时，text 会被拒；退回不带首条消息，至少把会话建出来。
      if (String((error && error.code) || "") !== "NOT_GRANTED") throw error
      res = await withTimeout(host.startSession(base), 180000, "startSession")
    }
    if (res && res.sessionId) return { id: String(res.sessionId) }
    return { error: String((res && (res.failure || res.sent)) || "no-session") }
  } catch (error) {
    return { error: String((error && error.code) || (error && error.message) || "ERR") }
  }
}

// 宿主只在它自己保存设置时才重读项目列表；新建任务的项目可能要过一会儿才出现。
// 失败后后台每 5 秒补一次，最多约 3 分钟，宿主一刷新就自动建好协调会话。
const coordRetrying = new Set()

async function retryCoordinator(taskId, tries = 24) {
  if (coordRetrying.has(taskId)) return
  coordRetrying.add(taskId)
  try {
    for (let i = 0; i < tries; i++) {
      await new Promise((resolve) => setTimeout(resolve, 5000))
      const task = S.tasks.get(taskId)
      if (!task || task.coordinator) return
      const coord = await startCoordinatorSession(task)
      if (coord.id) {
        const coordTitle = t("coordPrefix") + (task.title || task.id)
        task.coordinator = coord.id
        task.members = Array.isArray(task.members) ? task.members : []
        if (!task.members.some((member) => member.sessionId === coord.id)) {
          task.members.push({ sessionId: coord.id, title: coordTitle, directory: task.id, role: "main" })
        }
        await persist(task).catch(() => {})
        render()
        toast(t("coordCreated"), "success")
        return
      }
      if (String(coord.error) !== "no-project") return
    }
  } finally {
    coordRetrying.delete(taskId)
  }
}

// 2026-11-05：协调会话没建成的任务，事后从这里补；同时补注册项目。
async function ensureCoordinator(task) {
  if (S.coordBusy) return
  if (coordRetrying.has(task.id)) {
    toast(t("coordRetrying"), "info")
    return
  }
  S.coordBusy = true
  render()
  try {
    const reg = await registerProject(task)
    const coordTitle = t("coordPrefix") + (task.title || task.id)
    const coord = await startCoordinatorSession(task)
    if (!coord.id) {
      toast(
        t("coordFailed") + " " + String(coord.error || "") + (reg.error ? " / " + reg.error : ""),
        "error"
      )
      if (String(coord.error) === "no-project") void retryCoordinator(task.id)
      return
    }
    task.coordinator = coord.id
    task.members = Array.isArray(task.members) ? task.members : []
    if (!task.members.some((m) => m.sessionId === coord.id)) {
      task.members.push({ sessionId: coord.id, title: coordTitle, directory: task.id, role: "main" })
    }
    await persist(task)
    toast(t("coordCreated"), "success")
  } finally {
    S.coordBusy = false
    render()
  }
}

// 删除任务时把目录移进 _backup；失败也不阻止从看板移除。
async function archiveTaskDir(task) {
  if (typeof host.serviceRequest !== "function") return { error: "no-service-api" }
  const dir = absoluteDir(task.progressDir)
  if (!dir) return { error: "bad-dir" }
  try {
    const res = await withTimeout(
      host.serviceRequest({
        method: "GET",
        path: "/archiveTask",
        query: { dir, id: task.id }
      }),
      10000,
      "archiveTask"
    )
    const text = typeof res?.body === "string" ? res.body : ""
    const data = text ? JSON.parse(text) : null
    if (data && data.path) return { path: String(data.path) }
    return { error: (data && data.error) || "empty" }
  } catch (error) {
    return { error: String((error && error.code) || (error && error.message) || "ERR") }
  }
}

async function submitForm() {
  const title = el("f-title").value.trim()
  const goal = el("f-goal").value.trim()
  const acceptance = el("f-accept").value.trim()
  if (!title || !goal || !acceptance) {
    toast(t("must"), "error")
    return
  }
  if (S.saveBusy) return
  const dir = el("f-dir").value.trim() || defaultDir()

  if (S.formMode === "edit" && S.formId) {
    const task = S.tasks.get(S.formId)
    if (!task) return
    S.saveBusy = true
    try {
      task.title = title
      task.goal = goal
      task.acceptance = acceptance
      task.progressDir = dir
      await persist(task)
      await ensureFolder(task, false)
    } finally {
      S.saveBusy = false
    }
    closeForm()
    render()
    toast(t("updated"), "success")
    return
  }

  // 2026-11-05：id 统一 task- 前缀，目录名与看板标识同一套。
  const id = "task-" + Date.now().toString(36).slice(-6)
  const task = {
    id,
    title,
    goal,
    acceptance,
    progressDir: dir.includes("<id>") ? dir.replace("<id>", id) : dir,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    // 2026-11-05：不把「建任务的那个会话」绑进来，任务只认自己的协调会话。
    members: []
  }
  const saveBtn = el("f-save")
  saveBtn.disabled = true
  saveBtn.textContent = t("saving")
  S.saveBusy = true
  try {
    await persist(task)
    await ensureFolder(task, true)
    await registerProject(task)
    // 建任务即建协调会话：目录落在任务目录、角色固定信箱调度，不继承当前会话上下文。
    const coordTitle = t("coordPrefix") + title
    const coord = await startCoordinatorSession(task)
    if (coord.id) {
      task.coordinator = coord.id
      task.members = [{ sessionId: coord.id, title: coordTitle, directory: task.id, role: "main" }]
      await persist(task)
      S.selected = task.id
      closeForm()
      render()
      toast(t("created") + " · " + t("coordCreated"), "success")
      return
    }
    S.selected = task.id
    closeForm()
    render()
    toast(t("created") + " · " + t("coordFailed") + " " + String(coord.error || "") + "\u3002" + t("coordRetry"), "error")
    if (String(coord.error) === "no-project") void retryCoordinator(task.id)
  } finally {
    S.saveBusy = false
    saveBtn.disabled = false
    saveBtn.textContent = t("save")
  }
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
