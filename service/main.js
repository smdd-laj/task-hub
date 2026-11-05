/**
 * Task Hub 状态服务。
 *
 * 主路径：订阅 OpenChamber 的全局事件流，按事件维护每个会话在不在跑。
 * 备路径：事件流断开超过 30 秒，退回用 opencode CLI 快照轮询。
 *
 * 宿主的 listSessions 对 worktree 目录会给 unknown，所以不用它。
 *
 * 契约（GUEST_SERVICES.md）：只听 127.0.0.1:OPENCHAMBER_SERVICE_PORT，
 * 每个请求带 Authorization: Bearer OPENCHAMBER_SERVICE_TOKEN，GET /health 就绪。
 */
import http from "node:http"
import { readFileSync, writeFileSync, appendFileSync, mkdirSync, existsSync, renameSync } from "node:fs"
import { homedir } from "node:os"
import { join, dirname } from "node:path"
import { execFile } from "node:child_process"

const PORT = Number(process.env.OPENCHAMBER_SERVICE_PORT || 0)
const TOKEN = process.env.OPENCHAMBER_SERVICE_TOKEN || ""

const CACHE_MS = 1000
const STREAM_STALE_MS = 30000
const CLI_POLL_MS = 4000

const LOG_DIR = join(homedir(), ".task-hub")
const LOG_FILE = join(LOG_DIR, "service.log")
const SCHEDULES_FILE = join(LOG_DIR, "schedules.json")
const OPENCHAMBER_SETTINGS = join(homedir(), ".config", "openchamber", "settings.json")
const TASKS_ROOT = join(homedir(), ".task-hub", "tasks")

function log(line) {
  try {
    mkdirSync(LOG_DIR, { recursive: true })
    appendFileSync(LOG_FILE, `${new Date().toISOString()} ${line}\n`)
  } catch {}
}

// 2026-11-05：服务静默退出会让面板的 serviceRequest 一直挂着；先把死因落盘。
process.on("uncaughtException", (error) => {
  log(`uncaughtException ${String((error && error.stack) || error).slice(0, 1500)}`)
  process.exit(1)
})
process.on("unhandledRejection", (reason) => {
  log(`unhandledRejection ${String((reason && reason.stack) || reason).slice(0, 1500)}`)
})

/** sessionID -> { running, since, lastMs, updatedAt } */
const states = new Map()
let lastEventAt = 0
let streamOk = false
let cliAt = 0
let cliInflight = null

/* ---------------- host endpoint ---------------- */

function hostEndpoint() {
  const home = process.env.OPENCHAMBER_DATA_DIR || join(homedir(), ".config", "openchamber")
  let port = 0
  let token = ""
  try {
    const settings = JSON.parse(readFileSync(join(home, "settings.json"), "utf8"))
    port = Number(settings.desktopLocalPort) || 0
    token = String(settings.desktopLocalClientToken || "")
  } catch {}
  if (!port) port = 57123
  return { port, token }
}

/* ---------------- event stream ---------------- */

function noteRunning(id, at) {
  const current = states.get(id) || { running: false, since: 0, lastMs: 0, updatedAt: 0 }
  current.running = true
  current.since = current.since && current.running ? current.since : at
  if (!current.since) current.since = at
  states.set(id, current)
}

function noteIdle(id, at, durationMs) {
  const current = states.get(id) || { running: false, since: 0, lastMs: 0, updatedAt: 0 }
  const start = current.since || 0
  current.running = false
  current.lastMs = Number(durationMs) || (start ? Math.max(0, at - start) : current.lastMs || 0)
  current.since = 0
  states.set(id, current)
}

function handleEvent(event) {
  const type = event && event.type
  const data = (event && event.data) || {}
  const id = data.sessionID
  const at = Number(event.created) || Date.now()
  lastEventAt = Date.now()

  if (type === "server.connected") {
    streamOk = true
    return
  }
  if (!id) return

  const current = states.get(id) || { running: false, since: 0, lastMs: 0, updatedAt: 0 }
  current.updatedAt = at

  if (type === "session.execution.started" || type === "session.step.started" || type === "session.text.started") {
    if (!current.running) {
      current.running = true
      current.since = Number(data.started) || at
    }
  } else if (type === "session.execution.succeeded" || type === "session.execution.failed" || type === "session.execution.interrupted") {
    const started = current.since
    const ended = Number(data.endedAt) || at
    current.running = false
    current.lastMs = Number(data.durationMs) || (started ? Math.max(0, ended - started) : current.lastMs)
    current.since = 0
  } else if (type === "session.step.ended") {
    // 一步结束不等于整轮结束；只有明确没有后续事件时才靠超时回落。
    current.updatedAt = at
  } else if (type === "session.usage.updated") {
    const tokens = data.tokens
    if (tokens && typeof tokens === "object") current.tokens = tokens
  }

  states.set(id, current)
}

async function followStream() {
  const { port, token } = hostEndpoint()
  const url = `http://127.0.0.1:${port}/api/global/event`
  const headers = { Accept: "text/event-stream" }
  if (token) headers.Authorization = `Bearer ${token}`

  try {
    const res = await fetch(url, { headers })
    log(`stream ${url} status=${res.status} token=${token ? "yes" : "no"}`)
    if (!res.ok || !res.body) {
      streamOk = false
      setTimeout(() => void followStream(), 5000)
      return
    }
    streamOk = true
    lastEventAt = Date.now()
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const parts = buffer.split("\n\n")
      buffer = parts.pop() || ""
      for (const chunk of parts) {
        const line = chunk.split("\n").find((l) => l.startsWith("data:"))
        if (!line) continue
        try {
          handleEvent(JSON.parse(line.slice(5).trim()))
        } catch {}
      }
    }
    streamOk = false
  } catch {
    streamOk = false
    log("stream error")
  }
  setTimeout(() => void followStream(), 3000)
}

function streamAlive() {
  return streamOk && Date.now() - lastEventAt < STREAM_STALE_MS
}

/* ---------------- CLI fallback ---------------- */

function cli(args, timeout = 12000) {
  return new Promise((resolve) => {
    execFile(
      "opencode",
      args,
      { timeout, windowsHide: true, maxBuffer: 16 * 1024 * 1024 },
      (error, stdout) => resolve(error ? null : stdout)
    )
  })
}

/** 建会话要能区分「成功」「参数错」「引擎不可用」，cli() 只回 stdout 或 null，不够用。 */
function cliRaw(args, timeout = 30000) {
  return new Promise((resolve) => {
    execFile(
      "opencode",
      args,
      { timeout, windowsHide: true, maxBuffer: 16 * 1024 * 1024 },
      (error, stdout, stderr) => {
        resolve({
          ok: !error,
          text: String(stdout || ""),
          err: String(stderr || ""),
          message: error ? String(error.message || "") : ""
        })
      }
    )
  })
}

function readBody(req, limit = 256 * 1024) {
  return new Promise((resolve) => {
    let size = 0
    let tooBig = false
    const chunks = []
    let settled = false
    const done = (value) => {
      if (settled) return
      settled = true
      resolve(value)
    }
    req.on("data", (chunk) => {
      size += chunk.length
      // 超限只停止累积、继续读到 end：先 destroy 会让客户端收不到 400。
      if (size > limit) {
        tooBig = true
        return
      }
      chunks.push(chunk)
    })
    req.on("end", () => done(tooBig ? null : Buffer.concat(chunks).toString("utf8")))
    // 中途断开时 end 不一定来，兜底收尾，避免处理函数永久挂住。
    req.on("close", () => done(null))
    req.on("error", () => done(null))
  })
}

function projectIdFor(dir) {
  const norm = dir.replace(/\\/g, "/")
  return "path_" + Buffer.from(norm, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

// 新建任务时把它注册成 OpenChamber 项目，否则会话移过去后侧栏看不到。
function registerProject(dir, label) {
  try {
    const settings = JSON.parse(readFileSync(OPENCHAMBER_SETTINGS, "utf8"))
    const id = projectIdFor(dir)
    const projects = Array.isArray(settings.projects) ? settings.projects : []
    const existing = projects.find((p) => p.id === id || p.path === dir)
    if (existing) {
      // 任务项目默认建出来的会话就是协调会话（2026-11-05）。
      if (existing.defaultAgent !== "信箱调度") {
        existing.defaultAgent = "信箱调度"
        settings.projects = projects
        writeFileSync(OPENCHAMBER_SETTINGS, JSON.stringify(settings, null, 2) + "\n", "utf8")
      }
      return { id, added: false }
    }
    const now = Date.now()
    projects.push({
      id,
      path: dir,
      label: label || dir.split(/[\\/]/).filter(Boolean).pop(),
      icon: "folder",
      color: "type",
      defaultAgent: "信箱调度",
      addedAt: now,
      lastOpenedAt: now,
      iconBackground: null,
      sidebarCollapsed: false
    })
    settings.projects = projects
    writeFileSync(OPENCHAMBER_SETTINGS, JSON.stringify(settings, null, 2) + "\n", "utf8")
    log(`registerProject ${dir} id=${id}`)
    return { id, added: true }
  } catch (error) {
    log(`registerProject failed ${String(error && error.message).slice(0, 160)}`)
    return { id: "", added: false, error: "write-failed" }
  }
}

/* ---------------- scheduled patrol ---------------- */

let schedules = []

function loadSchedules() {
  try {
    const data = JSON.parse(readFileSync(SCHEDULES_FILE, "utf8"))
    schedules = Array.isArray(data.schedules) ? data.schedules : []
  } catch {
    schedules = []
  }
  return schedules
}

function saveSchedules() {
  try {
    mkdirSync(LOG_DIR, { recursive: true })
    writeFileSync(SCHEDULES_FILE, JSON.stringify({ version: 1, schedules }, null, 2), "utf8")
  } catch (error) {
    log(`schedules write failed ${String(error && error.message).slice(0, 120)}`)
  }
}

function publicSchedule(s) {
  return {
    taskId: s.taskId,
    sessionId: s.sessionId,
    enabled: Boolean(s.enabled),
    intervalMinutes: Number(s.intervalMinutes) || 30,
    maxRuns: Number(s.maxRuns) || 0,
    runs: Number(s.runs) || 0,
    until: s.until || "",
    nextRunAt: Number(s.nextRunAt) || 0,
    lastRunAt: Number(s.lastRunAt) || 0,
    lastResult: s.lastResult || "",
    failures: Number(s.failures) || 0,
    stopReason: s.stopReason || ""
  }
}

async function sendPatrol(sessionId, text) {
  if (!/^ses_[A-Za-z0-9]+$/.test(sessionId) || !text) return false
  const out = await cliRaw([
    "api",
    "POST",
    `/api/session/${sessionId}/prompt`,
    "-d",
    JSON.stringify({ text, delivery: "queue" })
  ])
  if (!out.ok) log(`patrol send failed ${sessionId} ${(out.err || out.message || out.text).slice(0, 160)}`)
  return out.ok
}

async function tickSchedules() {
  loadSchedules()
  const now = Date.now()
  let changed = false
  for (const s of schedules) {
    if (!s.enabled) continue
    if (s.maxRuns > 0 && (s.runs || 0) >= s.maxRuns) {
      s.enabled = false
      s.stopReason = "maxRuns"
      changed = true
      continue
    }
    if (s.until && now > Date.parse(s.until)) {
      s.enabled = false
      s.stopReason = "until"
      changed = true
      continue
    }
    if (!s.nextRunAt) {
      s.nextRunAt = now + (s.intervalMinutes || 30) * 60000
      changed = true
      continue
    }
    if (now < s.nextRunAt) continue
    // 会话忙就跳过本轮，不排队——排队会堆出一串重复巡检。
    const state = states.get(s.sessionId)
    if (state && state.running) {
      s.nextRunAt = now + 60000
      changed = true
      continue
    }
    const ok = await sendPatrol(s.sessionId, s.text)
    s.runs = (s.runs || 0) + 1
    s.lastRunAt = now
    s.lastResult = ok ? "sent" : "failed"
    s.failures = ok ? 0 : (s.failures || 0) + 1
    if (s.failures >= 3) {
      s.enabled = false
      s.stopReason = "failures"
    }
    s.nextRunAt = now + (s.intervalMinutes || 30) * 60000
    changed = true
    log(`patrol ${ok ? "sent" : "failed"} task=${s.taskId} runs=${s.runs}`)
  }
  if (changed) saveSchedules()
}

async function cliSeed(force = false) {
  if (cliInflight) return cliInflight
  if (!force && Date.now() - cliAt < CLI_POLL_MS) return
  cliInflight = (async () => {
    const out = await cli(["api", "get", "/api/session?limit=500"])
    if (!out) return
    let rows = []
    try {
      const parsed = JSON.parse(out)
      rows = Array.isArray(parsed) ? parsed : parsed.data || []
    } catch {
      return
    }
    const now = Date.now()
    for (const session of rows) {
      const current = states.get(session.id) || { running: false, since: 0, lastMs: 0, updatedAt: 0 }
      const turn = session.metadata?.openchamber?.turn || {}
      if (!current.running) current.lastMs = current.lastMs || Number(turn.durationMs) || 0
      current.updatedAt = current.updatedAt || Number(session.time?.updated) || 0

      // 服务可能在这个会话已经跑起来之后才启动；没收到 started 事件时，用最后一条消息补判一次。
      const updated = Number(session.time?.updated) || 0
      const turnEnd = Number(turn.endedAt) || 0
      if (!current.running && updated && now - updated < 60 * 60 * 1000) {
        const msgOut = await cli(["api", "get", `/api/session/${session.id}/message?limit=1`], 8000)
        if (msgOut) {
          try {
            const parsedMsg = JSON.parse(msgOut)
            const list = Array.isArray(parsedMsg) ? parsedMsg : parsedMsg.data || []
            const last = list[list.length - 1]
            const lastAt = last ? Number((last.info || last).time?.created) || 0 : 0
            if (lastAt && turnEnd && lastAt > turnEnd) {
              current.running = true
              current.since = lastAt
            }
          } catch {}
        }
      }
      states.set(session.id, current)
    }
    cliAt = Date.now()
    const running = [...states.values()].filter((s) => s.running).length
    log(`seed sessions=${rows.length} running=${running}`)
  })().finally(() => {
    cliInflight = null
  })
  return cliInflight
}

/* ---------------- http ---------------- */

const server = http.createServer(async (req, res) => {
  const auth = req.headers.authorization || ""
  if (TOKEN && auth !== `Bearer ${TOKEN}`) {
    // 2026-11-05：宿主等不到 ready 时所有 serviceRequest 都会 20s 超时，先把鉴权失败记下来。
    log(`auth rejected path=${req.url} auth=${auth ? "present" : "missing"}`)
    res.writeHead(401, { "content-type": "application/json" })
    res.end('{"error":"unauthorized"}')
    return
  }

  const url = new URL(req.url || "/", "http://127.0.0.1")

  if (url.pathname === "/health") {
    log("health ok")
    res.writeHead(200, { "content-type": "application/json" })
    res.end('{"ok":true}')
    return
  }

  if (url.pathname === "/states") {
    const ids = (url.searchParams.get("ids") || "")
      .split(",")
      .map((id) => id.trim())
      .filter((id) => /^ses_[A-Za-z0-9]+$/.test(id))

    if (!streamAlive() && Date.now() - cliAt > CLI_POLL_MS) await cliSeed()
    // 事件流看不到的会话（服务晚启动、或错过 started）用一次快照补齐。
    if (ids.some((id) => !states.has(id)) && Date.now() - cliAt > CLI_POLL_MS) await cliSeed()
    const force = url.searchParams.get("force") === "1"
    if (force) await cliSeed(true)

    const now = Date.now()
    const out = {}
    for (const id of ids) {
      const state = states.get(id)
      if (!state) continue
      out[id] = {
        running: Boolean(state.running),
        since: state.since || 0,
        lastMs: state.lastMs || 0,
        updatedAt: state.updatedAt || 0,
        source: streamAlive() ? "stream" : "cli"
      }
    }
    res.writeHead(200, { "content-type": "application/json" })
    res.end(JSON.stringify({ at: now, stream: streamAlive(), states: out }))
    if (!Object.keys(out).length && ids.length) log(`states miss ids=${ids.join(",")}`)
    return
  }

  // 面板没有建会话能力（宿主只给 startSession，带 chip 语义），建会话统一走这里，
  // 面板拿到 id 后自己写进 tasks.json 的 members。
  // 宿主代理的 POST body 会丢（2026-11-05 实测：GET 正常、POST 必超时），所以 GET 为主，POST 兼容。
  if (url.pathname === "/createSession" && (req.method === "GET" || req.method === "POST")) {
    let directory = ""
    let title = ""
    let agent = ""
    if (req.method === "GET") {
      directory = String(url.searchParams.get("directory") || "").trim()
      title = String(url.searchParams.get("title") || "").trim()
      agent = String(url.searchParams.get("agent") || "").trim()
    } else {
      const raw = await readBody(req)
      let body = null
      try {
        body = raw ? JSON.parse(raw) : null
      } catch {
        body = null
      }
      directory = String((body && body.directory) || "").trim()
      title = String((body && body.title) || "").trim()
      agent = String((body && body.agent) || "").trim()
    }

    const segments = directory.split(/[\\/]/)
    const drivePath = /^[A-Za-z]:[\\/]/.test(directory)
    const posixPath = directory.startsWith("/")
    // 只收绝对路径，且不许 .. 回溯；路径长度也要挡住异常输入。
    if ((!drivePath && !posixPath) || segments.includes("..") || directory.length > 512) {
      res.writeHead(400, { "content-type": "application/json" })
      res.end('{"error":"bad-directory"}')
      return
    }

    const payload = { title: title || "新会话", location: { directory } }
    if (agent) payload.agent = agent
    const out = await cliRaw(["api", "POST", "/api/session", "-d", JSON.stringify(payload)])
    let sessionId = ""
    if (out.ok) {
      try {
        sessionId = String(JSON.parse(out.text).data.id || "")
      } catch {}
    }
    if (!sessionId) {
      log(`createSession failed dir=${directory} ok=${out.ok} err=${out.err.slice(0, 200)}`)
      res.writeHead(502, { "content-type": "application/json" })
      res.end(JSON.stringify({ error: "create-failed", detail: (out.err || out.message || out.text).slice(0, 400) }))
      return
    }
    log(`createSession ok dir=${directory} id=${sessionId}`)
    res.writeHead(200, { "content-type": "application/json" })
    res.end(JSON.stringify({ sessionId }))
    return
  }

  // 删除任务时把目录移进 _backup（软删除，可找回），不直接抹掉。
  if (url.pathname === "/archiveTask" && (req.method === "GET" || req.method === "POST")) {
    let dir = ""
    let id = ""
    if (req.method === "GET") {
      dir = String(url.searchParams.get("dir") || "").trim()
      id = String(url.searchParams.get("id") || "").trim()
    } else {
      const raw = await readBody(req)
      let body = null
      try {
        body = raw ? JSON.parse(raw) : null
      } catch {
        body = null
      }
      dir = String((body && body.dir) || "").trim()
      id = String((body && body.id) || "").trim()
    }
    const abs = dir ? join(dir) : ""
    if (
      !/^(task-|t_)[A-Za-z0-9_-]+$/.test(id) ||
      !abs ||
      dirname(abs).toLowerCase() !== TASKS_ROOT.toLowerCase() ||
      !existsSync(abs)
    ) {
      res.writeHead(400, { "content-type": "application/json" })
      res.end('{"error":"bad-task"}')
      return
    }
    const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
    const target = join(TASKS_ROOT, "_backup", id + "-" + stamp)
    try {
      mkdirSync(join(TASKS_ROOT, "_backup"), { recursive: true })
      renameSync(abs, target)
    } catch (error) {
      log("archiveTask failed " + id + " " + String((error && error.message) || error).slice(0, 200))
      res.writeHead(500, { "content-type": "application/json" })
      res.end(JSON.stringify({ error: "archive-failed", detail: String((error && error.message) || error).slice(0, 200) }))
      return
    }
    log("archiveTask " + id + " -> " + target)
    res.writeHead(200, { "content-type": "application/json" })
    res.end(JSON.stringify({ moved: true, path: target }))
    return
  }

  if (url.pathname === "/registerProject" && (req.method === "GET" || req.method === "POST")) {
    let dir = ""
    let label = ""
    if (req.method === "GET") {
      dir = String(url.searchParams.get("dir") || "").trim()
      label = String(url.searchParams.get("label") || "").trim()
    } else {
      const raw = await readBody(req)
      let body = null
      try {
        body = raw ? JSON.parse(raw) : null
      } catch {
        body = null
      }
      dir = String((body && body.dir) || "").trim()
      label = String((body && body.label) || "").trim()
    }
    if (!dir.startsWith(TASKS_ROOT) || dir.split(/[\\/]/).includes("..")) {
      res.writeHead(400, { "content-type": "application/json" })
      res.end('{"error":"bad-dir"}')
      return
    }
    const result = registerProject(dir, label)
    res.writeHead(result.error ? 500 : 200, { "content-type": "application/json" })
    res.end(JSON.stringify(result))
    return
  }

  if (url.pathname === "/schedules" && req.method === "GET") {
    loadSchedules()
    res.writeHead(200, { "content-type": "application/json" })
    res.end(JSON.stringify({ schedules: schedules.map(publicSchedule) }))
    return
  }

  if (url.pathname === "/schedules" && req.method === "POST") {
    const raw = await readBody(req)
    let body = null
    try {
      body = raw ? JSON.parse(raw) : null
    } catch {
      body = null
    }
    const taskId = String((body && body.taskId) || "").trim()
    const sessionId = String((body && body.sessionId) || "").trim()
    if (!/^[A-Za-z0-9_-]+$/.test(taskId) || !/^ses_[A-Za-z0-9]+$/.test(sessionId)) {
      res.writeHead(400, { "content-type": "application/json" })
      res.end('{"error":"bad-schedule"}')
      return
    }
    loadSchedules()
    let s = schedules.find((x) => x.taskId === taskId)
    if (!s) {
      s = { taskId }
      schedules.push(s)
    }
    const wasEnabled = Boolean(s.enabled)
    s.sessionId = sessionId
    s.text = String((body && body.text) || "").slice(0, 8000)
    s.intervalMinutes = Math.max(5, Math.min(720, Number(body && body.intervalMinutes) || 30))
    s.maxRuns = Math.max(0, Math.min(200, Number(body && body.maxRuns) || 0))
    s.until = String((body && body.until) || "")
    s.enabled = Boolean(body && body.enabled)
    if (!s.enabled) {
      s.stopReason = "manual"
    } else if (!wasEnabled || !s.nextRunAt) {
      s.nextRunAt = Date.now() + s.intervalMinutes * 60000
      s.stopReason = ""
      s.failures = 0
    }
    if (!s.runs) s.runs = 0
    saveSchedules()
    res.writeHead(200, { "content-type": "application/json" })
    res.end(JSON.stringify({ schedule: publicSchedule(s) }))
    return
  }

  if (url.pathname === "/schedules" && req.method === "DELETE") {
    const taskId = (url.searchParams.get("taskId") || "").trim()
    loadSchedules()
    const before = schedules.length
    schedules = schedules.filter((s) => s.taskId !== taskId)
    if (schedules.length !== before) saveSchedules()
    res.writeHead(200, { "content-type": "application/json" })
    res.end(JSON.stringify({ removed: before - schedules.length }))
    return
  }

  res.writeHead(404, { "content-type": "application/json" })
  res.end('{"error":"not-found"}')
})

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[task-hub] service on 127.0.0.1:${PORT}`)
  log(`listening port=${PORT}`)
  followStream().catch((error) => log(`stream loop failed ${String((error && error.message) || error)}`))
  cliSeed().catch((error) => log(`seed failed ${String((error && error.message) || error)}`))
  loadSchedules()
  setInterval(() => {
    tickSchedules().catch((error) => log(`schedule tick failed ${String((error && error.message) || error)}`))
  }, 30000)
  tickSchedules().catch((error) => log(`schedule tick failed ${String((error && error.message) || error)}`))
})
