import { connectHost } from "@openchamber/sdk"
import { applyHostReady } from "@openchamber/sdk/ui"

const host = connectHost()
const el = (id) => document.getElementById(id)

const DEFAULT_ROOT = "~/.task-hub"
const FILE_TASKS = "~/.task-hub/tasks.json"
const FILE_SETTINGS = "~/.task-hub/settings.json"
const KEY_SELECTED = "taskhub.selected"
const AUTO_MS = 3000

const DICT = {
  en: {
    tasks: "Tasks", auto: "Auto", on: "On", newTask: "New", refresh: "Refresh",
    search: "Search tasks", sort: "Sort", manual: "Manual", name: "Name", members: "Sessions",
    none: "No tasks yet", noMatch: "No matching tasks", pick: "Pick a task on the left",
    you: "You", edit: "Edit", addSession: "Add session", delete: "Delete", confirm: "Click again",
    progress: "Progress folder", copyPath: "Copy path", copyDone: "Path copied",
    external: "external", unreadable: "Outside readable range", readFail: "Cannot read folder",
    running: "running", waiting: "waiting", idle: "idle", failed: "failed", unknown: "—",
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
    external: "外部", unreadable: "不在可读范围", readFail: "读不到目录",
    running: "运行中", waiting: "等待", idle: "空闲", failed: "失败", unknown: "—",
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
  live: new Map(), loc: "en", auto: 0, mounted: false,
  formMode: "create", formId: null, pickQ: "", pickRows: [], pickProjects: 0,
  deleting: null, deleteTimer: 0, dragId: null
}

const t = (key) => (DICT[S.loc] && DICT[S.loc][key]) || DICT.en[key] || key

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
        directory: session.directory || project.directory || ""
      })
    }
  }
  return map
}

function liveOf(member) {
  return S.live.get(member.sessionId) || null
}

function stateOf(member) {
  const live = liveOf(member)
  if (!live) return "unknown"
  if (live.activity === "running" || live.activity === "retrying") return "running"
  if (live.activity === "waiting-permission" || live.activity === "waiting-question") return "waiting"
  if (live.activity === "idle") return "idle"
  return "unknown"
}

function stateLabel(state) {
  if (state === "running") return "\u25cc " + t("running")
  if (state === "waiting") return "\u25d4 " + t("waiting")
  if (state === "failed") return "\u2715 " + t("failed")
  if (state === "idle") return "\u00b7 " + t("idle")
  return "\u00b7 " + t("unknown")
}

/* ---------------- data ---------------- */

async function loadAll() {
  try {
    S.settings = await readSettings()
    const list = await readTasks()
    S.ids = list.map((task) => task.id)
    S.tasks = new Map(list.map((task) => [task.id, task]))
    S.live = await collectLive()
    el("status").textContent = ""
    render()
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
  nameBtn.textContent = (live && live.title) || member.title || member.sessionId.slice(-6)
  if (!live) {
    nameBtn.disabled = true
    nameBtn.title = t("gone")
  } else {
    nameBtn.title = t("open")
    nameBtn.onclick = async () => {
      try {
        await host.openSession(member.sessionId)
      } catch (error) {
        toast(String((error && error.code) || "ERR"), "error")
      }
    }
  }
  title.appendChild(nameBtn)
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
  state.dataset.state = stateOf(member)
  state.textContent = stateLabel(stateOf(member))

  const actions = document.createElement("span")
  actions.className = "row-actions"
  actions.append(
    button(t("compose"), "primary", async () => {
      try {
        await host.compose({ text: composeText(task, member), mode: "replace" })
        toast(t("composed"), "success")
      } catch (error) {
        toast(String((error && error.code) || "ERR"), "error")
      }
    }),
    button(t("remove"), "", () => void dropMember(task, member.sessionId))
  )

  row.append(handle, info, state, actions)
  return row
}

async function renderDetail() {
  const box = el("detail")
  box.replaceChildren()
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
  const del = button(S.deleting === task.id ? t("confirm") : t("delete"), S.deleting === task.id ? "danger" : "", () => {
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
  headActions.append(
    button(t("edit"), "", () => openForm("edit", task)),
    button(t("addSession"), "", () => void openPicker(task)),
    del
  )
  head.appendChild(headActions)
  box.appendChild(head)

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
  const grid = document.createElement("div")
  grid.className = "members"
  for (const member of members) grid.appendChild(memberRow(task, member))
  box.appendChild(grid)
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

function composeText(task, member) {
  const suffix = member.sessionId.slice(-6)
  if (S.loc === "zh") {
    return "加进「" + (task.title || task.id) + "」，进度目录：" + task.progressDir +
      "（你的文件：progress-" + suffix + ".md）。"
  }
  return "Add to \"" + (task.title || task.id) + "\"; progress folder: " + task.progressDir +
    " (your file: progress-" + suffix + ".md)."
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

function toggleAuto() {
  const btn = el("auto")
  if (S.auto) {
    clearInterval(S.auto)
    S.auto = 0
    btn.classList.remove("active")
    btn.textContent = t("auto")
    return
  }
  S.auto = setInterval(() => void autoTick(), AUTO_MS)
  btn.classList.add("active")
  btn.textContent = t("auto") + " \u00b7 " + t("on")
  void autoTick()
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
  el("auto").textContent = S.auto ? t("auto") + " \u00b7 " + t("on") : t("auto")
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
  el("refresh").onclick = () => void loadAll()
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
})
