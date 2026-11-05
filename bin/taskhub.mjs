#!/usr/bin/env node
/**
 * taskhub —— 任务协作板的受控命令通道。
 *
 * 给「信箱调度」这类协调会话用：它跑不了普通 shell，只能跑本命令，
 * 用有限动作完成「建任务 / 建 worktree / 建会话 / 加成员」。
 *
 * 所有输出都是 JSON（一行或多行），失败时 exit 1 并给 {error, detail}。
 * 本命令永远不删除任何东西。
 */
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { spawnSync } from "node:child_process"

const HOME = process.env.USERPROFILE || os.homedir()
const TASKS_ROOT = path.join(HOME, ".task-hub", "tasks")
const TASKS_FILE = path.join(HOME, ".task-hub", "tasks.json")
const REPOS_FILE = path.join(HOME, ".task-hub", "repos.json")
const SETTINGS_FILE = path.join(HOME, ".config", "openchamber", "settings.json")
const AGENTS = new Set(["信箱调度", "流式开发主代理", "值班调度"])

const argv = process.argv.slice(2)
const cmd = argv[0] || "help"
const flags = parseFlags(argv.slice(1))

function parseFlags(args) {
  const out = {}
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (!a.startsWith("--")) continue
    const key = a.slice(2)
    const next = args[i + 1]
    if (next === undefined || next.startsWith("--")) out[key] = true
    else {
      out[key] = next
      i++
    }
  }
  return out
}

function fail(error, detail = "") {
  process.stdout.write(JSON.stringify({ error, detail: String(detail).slice(0, 600) }) + "\n")
  process.exit(1)
}

function ok(data) {
  process.stdout.write(JSON.stringify(data, null, 2) + "\n")
}

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""))
  } catch {
    return fallback
  }
}

function writeJson(file, data) {
  const tmp = file + ".tmp-" + process.pid
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + "\n", "utf8")
  fs.renameSync(tmp, file)
}

function expandHome(p) {
  if (!p) return ""
  return String(p).replace(/^~/, HOME).replace(/\//g, "\\")
}

function projectIdFor(dir) {
  const norm = String(dir).replace(/\\/g, "/")
  return "path_" + Buffer.from(norm, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function registerProject(dir, label) {
  const settings = readJson(SETTINGS_FILE, null)
  if (!settings) return { error: "settings-unreadable" }
  const id = projectIdFor(dir)
  const projects = Array.isArray(settings.projects) ? settings.projects : []
  if (projects.some((p) => p.id === id || p.path === dir)) return { id, added: false }
  const now = Date.now()
  projects.push({
    id,
    path: dir,
    label,
    icon: "folder",
    color: "type",
    defaultAgent: "流式开发主代理",
    addedAt: now,
    lastOpenedAt: now,
    iconBackground: null,
    sidebarCollapsed: false
  })
  settings.projects = projects
  writeJson(SETTINGS_FILE, settings)
  return { id, added: true }
}

function findOpencode() {
  const known = path.join(
    HOME,
    "AppData", "Local", "Programs", "@openchamberelectron", "resources", "opencode-cli", "opencode.exe"
  )
  if (fs.existsSync(known)) return known
  const dirs = String(process.env.PATH || "").split(";")
  for (const d of dirs) {
    for (const name of ["opencode.exe", "opencode.cmd", "opencode"]) {
      const p = path.join(d, name)
      if (fs.existsSync(p)) return p
    }
  }
  return "opencode"
}

const OPENCODE = findOpencode()

function run(cmdPath, args, opts = {}) {
  const res = spawnSync(cmdPath, args, {
    encoding: "utf8",
    windowsHide: true,
    timeout: opts.timeout || 30000,
    cwd: opts.cwd,
    shell: false
  })
  return {
    ok: res.status === 0,
    status: res.status,
    out: String(res.stdout || ""),
    err: String(res.stderr || ""),
    message: res.error ? String(res.error.message) : ""
  }
}

function git(args, cwd, timeout = 120000) {
  return run("git", args, { cwd, timeout })
}

function createSession(directory, title, agent) {
  if (!AGENTS.has(agent)) return { error: "bad-agent", detail: agent }
  const payload = JSON.stringify({ title, location: { directory }, agent })
  const out = run(OPENCODE, ["api", "POST", "/api/session", "-d", payload], { timeout: 60000 })
  if (!out.ok) return { error: "create-failed", detail: (out.err || out.message || out.out).slice(0, 400) }
  try {
    const data = JSON.parse(out.out)
    const id = String((data.data || data).id || "")
    if (!/^ses_[A-Za-z0-9]+$/.test(id)) return { error: "create-failed", detail: "no session id" }
    return { sessionId: id }
  } catch {
    return { error: "create-failed", detail: out.out.slice(0, 400) }
  }
}

function loadTasks() {
  const data = readJson(TASKS_FILE, null)
  if (!data || !Array.isArray(data.tasks)) fail("tasks-unreadable", TASKS_FILE)
  return data
}

function saveTasks(data) {
  const backup = TASKS_FILE + ".bak-taskhub"
  try {
    fs.copyFileSync(TASKS_FILE, backup)
  } catch {}
  writeJson(TASKS_FILE, data)
}

function findTask(data, id) {
  const task = data.tasks.find((t) => t.id === id)
  if (!task) fail("task-not-found", id)
  return task
}

function loadRepos() {
  const data = readJson(REPOS_FILE, null)
  if (!data || !Array.isArray(data.repos)) fail("repos-unreadable", REPOS_FILE)
  return data
}

function resolveRepo(alias) {
  if (/^[A-Za-z]:[\\/]/.test(alias)) {
    return { alias: path.basename(alias), path: path.normalize(alias), base: "master" }
  }
  const repos = loadRepos().repos
  const hit = repos.find((r) => r.alias === alias)
  if (!hit) fail("repo-unknown", alias + "；可用：" + repos.map((r) => r.alias).join(", "))
  return hit
}

function isGitRoot(dir) {
  if (!fs.existsSync(dir)) return false
  const out = git(["rev-parse", "--show-toplevel"], dir, 15000)
  if (!out.ok) return false
  const top = out.out.trim().replace(/\//g, "\\")
  return path.normalize(top).toLowerCase() === path.normalize(dir).toLowerCase()
}

function gitignoreHasWorktrees(repoPath) {
  for (const name of [".gitignore"]) {
    const p = path.join(repoPath, name)
    if (!fs.existsSync(p)) continue
    const text = fs.readFileSync(p, "utf8")
    if (/^\/?\.worktrees\/?\s*$/m.test(text)) return true
  }
  return false
}

function worktreePathFor(repoPath, name, style) {
  if (style === "dot") return path.join(repoPath, ".worktrees", name)
  if (style === "sibling") return path.join(path.dirname(repoPath), path.basename(repoPath) + "--worktrees", name)
  return gitignoreHasWorktrees(repoPath)
    ? path.join(repoPath, ".worktrees", name)
    : path.join(path.dirname(repoPath), path.basename(repoPath) + "--worktrees", name)
}

function validBranch(branch) {
  if (!/^(feature|hotfix)\/[A-Za-z0-9][A-Za-z0-9._-]{0,60}$/.test(branch)) return false
  return true
}

function taskDirOf(task) {
  return expandHome(task.progressDir)
}

/* ---------------- commands ---------------- */

function cmdRepoList() {
  const repos = loadRepos().repos
  ok({
    repos: repos.map((r) => ({
      alias: r.alias,
      path: r.path,
      base: r.base || "master",
      exists: fs.existsSync(r.path),
      git: isGitRoot(r.path)
    }))
  })
}

function cmdTaskCreate() {
  const title = String(flags.title || "").trim()
  const goal = String(flags.goal || "").trim()
  const accept = String(flags.accept || "").trim()
  if (!title || !goal || !accept) fail("missing-fields", "--title --goal --accept 都要给")

  let id = "task-" + Date.now().toString(36).slice(-6)
  const data = loadTasks()
  while (data.tasks.some((t) => t.id === id)) id = "task-" + (Date.now() + 1).toString(36).slice(-6)

  const custom = flags.dir ? expandHome(String(flags.dir)) : ""
  const dir = custom || path.join(TASKS_ROOT, id)
  if (!path.normalize(dir).toLowerCase().startsWith(path.normalize(TASKS_ROOT).toLowerCase())) {
    fail("bad-dir", "任务目录必须在 " + TASKS_ROOT + " 下")
  }
  if (fs.existsSync(dir) && fs.readdirSync(dir).length) fail("dir-not-empty", dir)

  const plan = { id, dir, title, goal, accept, coordinator: null }
  if (flags["dry-run"]) return ok({ dryRun: true, ...plan })

  fs.mkdirSync(path.join(dir, "progress"), { recursive: true })
  fs.mkdirSync(path.join(dir, "deliverables"), { recursive: true })
  fs.mkdirSync(path.join(dir, "archive"), { recursive: true })

  const head = [
    "# " + title + " \u00b7 \u5f53\u524d\u72b6\u6001",
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
  ].join("\n") + "\n"
  fs.writeFileSync(path.join(dir, "HEAD.md"), head, "utf8")
  fs.writeFileSync(path.join(dir, "SUMMARY.md"), "# " + title + " \u00b7 \u6c47\u603b\n\n\u53ea\u5199\u5df2\u5b9a\u7ed3\u8bba\u3002\n\n", "utf8")

  const project = registerProject(dir, title + " \u00b7 " + id)

  const coordTitle = "\u534f\u8c03 \u00b7 " + title
  const coord = createSession(dir, coordTitle, "信箱调度")

  const now = Date.now()
  const task = {
    id,
    title,
    goal,
    acceptance: accept,
    progressDir: "~/.task-hub/tasks/" + id,
    createdAt: now,
    updatedAt: now,
    members: coord.sessionId
      ? [{ sessionId: coord.sessionId, title: coordTitle, directory: id, role: "main" }]
      : [],
    coordinator: coord.sessionId || ""
  }
  data.tasks.push(task)
  saveTasks(data)

  ok({
    id,
    dir,
    projectId: project.id || "",
    coordinator: coord.sessionId || "",
    coordinatorError: coord.error || "",
    repos: []
  })
}

function cmdWorktreeCreate() {
  const taskId = String(flags.task || "").trim()
  const repoArg = String(flags.repo || "").trim()
  const branch = String(flags.branch || "").trim()
  if (!taskId || !repoArg || !branch) fail("missing-fields", "--task --repo --branch 都要给")
  if (!validBranch(branch)) fail("bad-branch", "只允许 feature/<slug> 或 hotfix/<slug>，ASCII，≤60 字符")

  const data = loadTasks()
  const task = findTask(data, taskId)
  const repo = resolveRepo(repoArg)
  const repoPath = path.normalize(expandHome(repo.path))
  if (!isGitRoot(repoPath)) fail("repo-not-git-root", repoPath)

  const base = String(flags.base || repo.base || "master").trim()
  const name = branch.split("/").slice(1).join("-")
  const wtPath = worktreePathFor(repoPath, name, repo.worktreeStyle)
  if (fs.existsSync(wtPath)) fail("path-exists", wtPath)

  const branchExists = git(["rev-parse", "--verify", "refs/heads/" + branch], repoPath, 15000)
  if (branchExists.ok) fail("branch-exists", branch)

  let fetchNote = ""
  const fetched = git(["fetch", "origin", "--prune"], repoPath, 60000)
  if (!fetched.ok) fetchNote = "fetch-failed: " + (fetched.err || fetched.message).slice(0, 160)

  const originBase = "origin/" + base
  const hasOrigin = git(["rev-parse", "--verify", originBase], repoPath, 15000).ok
  const baseRef = hasOrigin ? originBase : base
  const baseCheck = git(["rev-parse", "--verify", baseRef], repoPath, 15000)
  if (!baseCheck.ok) fail("base-unknown", baseRef)
  const baseSha = baseCheck.out.trim()

  const plan = { task: taskId, repo: repo.alias || path.basename(repoPath), path: wtPath, branch, base, baseRef, baseSha, fetchNote }
  if (flags["dry-run"]) return ok({ dryRun: true, ...plan })

  const added = git(["worktree", "add", "-b", branch, wtPath, baseRef], repoPath, 900000)
  if (!added.ok) fail("worktree-failed", (added.err || added.message || added.out).slice(0, 600))

  const head = git(["rev-parse", "--short", "HEAD"], wtPath, 15000)
  // 并行建多个 worktree 时，各自写 tasks.json 会互相覆盖：由协调方事后串行 repo-record。
  if (!flags["no-record"]) {
    task.repos = Array.isArray(task.repos) ? task.repos : []
    task.repos.push({ alias: repo.alias || path.basename(repoPath), path: wtPath, branch, base, createdAt: Date.now() })
    task.updatedAt = Date.now()
    saveTasks(data)
  }

  ok({ task: taskId, repo: repo.alias || path.basename(repoPath), path: wtPath, branch, base, head: head.out.trim(), fetchNote })
}

function cmdRepoRecord() {
  const taskId = String(flags.task || "").trim()
  const repoArg = String(flags.repo || "").trim()
  const wtPath = path.normalize(expandHome(String(flags.path || "")))
  const branch = String(flags.branch || "").trim()
  const base = String(flags.base || "master").trim()
  if (!taskId || !repoArg || !wtPath || !branch) fail("missing-fields", "--task --repo --path --branch 都要给")
  if (!path.isAbsolute(wtPath)) fail("bad-path", wtPath)
  if (!fs.existsSync(wtPath)) fail("path-missing", wtPath)
  if (!validBranch(branch)) fail("bad-branch", branch)
  if (flags["dry-run"]) return ok({ dryRun: true, task: taskId, repo: repoArg, path: wtPath, branch, base })

  const data = loadTasks()
  const task = findTask(data, taskId)
  task.repos = Array.isArray(task.repos) ? task.repos : []
  const exists = task.repos.some((r) => path.normalize(r.path).toLowerCase() === wtPath.toLowerCase())
  if (!exists) {
    task.repos.push({ alias: repoArg, path: wtPath, branch, base, createdAt: Date.now() })
    task.updatedAt = Date.now()
    saveTasks(data)
  }
  ok({ task: taskId, repo: repoArg, path: wtPath, branch, base, added: !exists, count: task.repos.length })
}

function cmdSessionCreate() {
  const dir = path.normalize(expandHome(String(flags.dir || "")))
  const title = String(flags.title || "").trim()
  const agent = String(flags.agent || "流式开发主代理").trim()
  if (!dir || !path.isAbsolute(dir)) fail("bad-dir", "必须是绝对路径")
  if (!fs.existsSync(dir)) fail("dir-missing", dir)
  if (!title) fail("missing-title", "--title 必填")
  if (!AGENTS.has(agent)) fail("bad-agent", "只允许：" + [...AGENTS].join(" / "))
  const res = createSession(dir, title, agent)
  if (res.error) fail(res.error, res.detail)
  ok({ sessionId: res.sessionId, directory: dir, title, agent })
}

function cmdMemberAdd() {
  const taskId = String(flags.task || "").trim()
  const sessionId = String(flags.session || "").trim()
  const title = String(flags.title || "").trim()
  const role = String(flags.role || "helper").trim()
  if (!taskId || !sessionId || !title) fail("missing-fields", "--task --session --title 都要给")
  if (!/^ses_[A-Za-z0-9]+$/.test(sessionId)) fail("bad-session", sessionId)
  if (!["main", "helper"].includes(role)) fail("bad-role", "main 或 helper")
  const data = loadTasks()
  const task = findTask(data, taskId)
  task.members = Array.isArray(task.members) ? task.members : []
  if (task.members.some((m) => m.sessionId === sessionId)) fail("already-member", sessionId)
  task.members.push({
    sessionId,
    title,
    directory: String(flags.dir || taskId),
    role
  })
  task.updatedAt = Date.now()
  saveTasks(data)
  ok({ task: taskId, sessionId, role, members: task.members.length })
}

function cmdTaskShow() {
  const data = loadTasks()
  const task = findTask(data, String(flags.task || "").trim())
  ok({ task })
}

function help() {
  const lines = [
    "taskhub — 任务协作板受控命令（给协调会话用）",
    "",
    "  taskhub repo-list",
    "  taskhub task-create --title <t> --goal <g> --accept <a> [--dir <abs>] [--dry-run]",
    "  taskhub worktree-create --task <id> --repo <alias> --branch feature/<slug> [--base master] [--no-record] [--dry-run]",
    "  taskhub repo-record --task <id> --repo <alias> --path <abs> --branch feature/<slug> [--base master] [--dry-run]",
    "  taskhub session-create --dir <abs> --title <t> [--agent 流式开发主代理|信箱调度|值班调度]",
    "  taskhub member-add --task <id> --session <ses_x> --title <t> [--role main|helper] [--dir <label>]",
    "  taskhub task-show --task <id>",
    "",
    "worktree 落点：仓内 .worktrees（仓的 .gitignore 已忽略时）否则 D:\\work\\<repo>--worktrees。"
  ]
  process.stdout.write(lines.join("\n") + "\n")
}

const table = {
  "repo-list": cmdRepoList,
  "task-create": cmdTaskCreate,
  "worktree-create": cmdWorktreeCreate,
  "repo-record": cmdRepoRecord,
  "session-create": cmdSessionCreate,
  "member-add": cmdMemberAdd,
  "task-show": cmdTaskShow
}

if (cmd === "help" || cmd === "--help" || cmd === "-h") help()
else if (table[cmd]) table[cmd]()
else fail("unknown-command", cmd)