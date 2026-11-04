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
import { readFileSync, appendFileSync, mkdirSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import { execFile } from "node:child_process"

const PORT = Number(process.env.OPENCHAMBER_SERVICE_PORT || 0)
const TOKEN = process.env.OPENCHAMBER_SERVICE_TOKEN || ""

const CACHE_MS = 1000
const STREAM_STALE_MS = 30000
const CLI_POLL_MS = 4000

const LOG_DIR = join(homedir(), ".task-hub")
const LOG_FILE = join(LOG_DIR, "service.log")

function log(line) {
  try {
    mkdirSync(LOG_DIR, { recursive: true })
    appendFileSync(LOG_FILE, `${new Date().toISOString()} ${line}\n`)
  } catch {}
}

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
    res.writeHead(401, { "content-type": "application/json" })
    res.end('{"error":"unauthorized"}')
    return
  }

  const url = new URL(req.url || "/", "http://127.0.0.1")

  if (url.pathname === "/health") {
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
  if (url.pathname === "/createSession" && req.method === "POST") {
    const raw = await readBody(req)
    let body = null
    try {
      body = raw ? JSON.parse(raw) : null
    } catch {
      body = null
    }
    const directory = String((body && body.directory) || "").trim()
    const title = String((body && body.title) || "").trim()
    const agent = String((body && body.agent) || "").trim()

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

  res.writeHead(404, { "content-type": "application/json" })
  res.end('{"error":"not-found"}')
})

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[task-hub] service on 127.0.0.1:${PORT}`)
  log(`listening port=${PORT}`)
  void followStream()
  void cliSeed()
})
