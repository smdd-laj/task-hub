import { createServer } from "node:http"
import { execFile } from "node:child_process"
import { promisify } from "node:util"

const run = promisify(execFile)
const PORT = Number(process.env.OPENCHAMBER_SERVICE_PORT || 0)
const TOKEN = process.env.OPENCHAMBER_SERVICE_TOKEN || ""

const CACHE_MS = 1500
let cache = { at: 0, value: {} }
let inflight = null

function cli(args, timeout = 12000) {
  return run("opencode", args, {
    timeout,
    windowsHide: true,
    maxBuffer: 16 * 1024 * 1024
  })
}

/**
 * 只回答「这一轮是不是还在跑」。
 * 会话列表的 time 字段在空闲时也会被元数据刷新，不能用；只能比最后一条消息的时间和上一轮的结束时刻。
 */
async function stateOfSession(id) {
  try {
    const [{ stdout: listOut }, { stdout: msgOut }] = await Promise.all([
      cli(["api", "get", `/api/session/${id}`]),
      cli(["api", "get", `/api/session/${id}/message?limit=1`])
    ])
    const session = JSON.parse(listOut)
    const info = session.data || session
    const rows = JSON.parse(msgOut)
    const list = Array.isArray(rows) ? rows : rows.data || []
    const last = list[list.length - 1]
    const lastAt = last ? Number((last.info || last).time?.created) || 0 : 0
    const turn = info.metadata?.openchamber?.turn || {}
    const turnEnd = Number(turn.endedAt) || 0
    const running = Boolean(lastAt && turnEnd && lastAt > turnEnd)
    return { running, lastMs: Number(turn.durationMs) || 0, outcome: info.outcome || null }
  } catch {
    return null
  }
}

async function collect(ids) {
  const value = {}
  await Promise.all(
    ids.map(async (id) => {
      const state = await stateOfSession(id)
      if (state) value[id] = state
    })
  )
  return value
}

const server = createServer(async (req, res) => {
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
    const now = Date.now()
    if (now - cache.at < CACHE_MS) {
      res.writeHead(200, { "content-type": "application/json" })
      res.end(JSON.stringify(pick(cache.value, ids)))
      return
    }
    if (!inflight) {
      inflight = collect(ids)
        .then((value) => {
          cache = { at: Date.now(), value }
          return value
        })
        .finally(() => {
          inflight = null
        })
    }
    const value = await inflight
    res.writeHead(200, { "content-type": "application/json" })
    res.end(JSON.stringify(pick(value, ids)))
    return
  }

  res.writeHead(404, { "content-type": "application/json" })
  res.end('{"error":"not-found"}')
})

function pick(value, ids) {
  const out = {}
  for (const id of ids) if (value[id]) out[id] = value[id]
  return out
}

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[task-hub] service listening on 127.0.0.1:${PORT}`)
})
