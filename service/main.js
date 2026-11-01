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
import { readFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import { execFile } from "node:child_process"

const PORT = Number(process.env.OPENCHAMBER_SERVICE_PORT || 0)
const TOKEN = process.env.OPENCHAMBER_SERVICE_TOKEN || ""

const CACHE_MS = 1000
const STREAM_STALE_MS = 30000
const CLI_POLL_MS = 4000

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

async function cliSeed() {
  if (cliInflight) return cliInflight
  cliInflight = (async () => {
    const out = await cli(["api", "get", "/api/session?limit=500"])
    if (!out) return
    try {
      const parsed = JSON.parse(out)
      const rows = Array.isArray(parsed) ? parsed : parsed.data || []
      for (const session of rows) {
        const current = states.get(session.id) || { running: false, since: 0, lastMs: 0, updatedAt: 0 }
        const turn = session.metadata?.openchamber?.turn || {}
        if (!current.running) current.lastMs = current.lastMs || Number(turn.durationMs) || 0
        current.updatedAt = current.updatedAt || Number(session.time?.updated) || 0
        states.set(session.id, current)
      }
      cliAt = Date.now()
    } catch {}
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
    return
  }

  res.writeHead(404, { "content-type": "application/json" })
  res.end('{"error":"not-found"}')
})

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[task-hub] service on 127.0.0.1:${PORT}`)
  void followStream()
  void cliSeed()
})
