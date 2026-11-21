# 快速开始（5 分钟）

> 目标：装好面板、命令行、子代理和技能，建出第一件带三级目录的任务。全程不需要改业务仓库。

## 0. 前置

- OpenChamber **≥ 1.24**（Task Hub 是一个扩展，面板由它提供）。
- Node.js **≥ 20**，`opencode` 命令在 `PATH` 里（面板的状态服务只调用它）。
- Windows 上 PowerShell 若禁止运行脚本，npm 用 `npm.cmd`。

## 1. 装扩展

OpenChamber → **设置 → 扩展** → 粘贴本仓库地址（或本地文件夹、ZIP）→ 添加。

批准两项权限：

- `sessions`：列项目和会话、打开聊天；
- 文件模式 `~/.task-hub/**`：读写任务名册和进度目录。

## 2. 装命令行 `taskhub`

```bash
git clone <this repo> task-hub
cd task-hub
npm link          # 或 npm install -g .
taskhub help
```

`taskhub` 是给协调会话用的受控命令：建任务、加项目、建 worktree、建会话、加成员。它只写 `~/.task-hub/`，不碰业务仓库。

## 3. 登记仓库

首次使用时创建 `~/.task-hub/repos.json`（没有就新建）：

```json
{
  "repos": [
    { "alias": "cashier", "path": "D:\\work\\cashier", "base": "master", "label": "收银端" },
    { "alias": "micro",   "path": "D:\\work\\jonglfow-micro", "base": "master", "label": "微服务" }
  ]
}
```

- `alias` 是建任务时 `--repos` 用的名字，`taskhub repo-list` 会列出来。
- `base` 只写**该仓主分支**。`develop`、`dev`、`test`、`release` 都是合并目标，不是起分支的基线。

## 4. 装子代理与技能

```bash
node scripts/install-integrations.mjs --main-agent "build"
```

把 `build` 换成你实际使用的主代理名（OpenCode 里 `agents/*.md` 的主角色名）。

它会把下面这些装进 `~/.config/opencode/`：

| 来源 | 落点 | 作用 |
|---|---|---|
| `integrations/opencode/agents/看板操作.md` | `agent/看板操作.md` | 只跑 taskhub 建任务 / 加项目 / 开会话 |
| `integrations/opencode/agents/worktree-builder.md` | `agent/worktree-builder.md` | 一次建一个 worktree 并建会话 |
| `integrations/opencode/agents/信箱调度.md` | `agent/信箱调度.md` | 协调会话：一轮巡检、四桶、催办与汇总 |
| `integrations/opencode/skills/task-board/SKILL.md` | `skills/task-board/SKILL.md` | 建任务 / 加项目 / 开会话的判定与回报 |

已有同名文件默认跳过；加 `--force` 覆盖，覆盖前会留 `.bak-时间` 备份。先 `--dry-run` 看清单。

**装完重启 OpenChamber**：代理和技能在会话启动时加载，旧会话不会中途长出来。

## 5. 建第一个任务

```bash
taskhub task-create --title "示例：把 X 接进来" --goal "做完什么" --accept "怎样算完成" --repos cashier
```

打开 Task Hub 面板，应该看到：

```
cashier
  长期     主检出 / test / develop / release
  执行     未指定
  会话     协调 · 示例：把 X 接进来
```

再补第二个仓库：

```bash
taskhub board-add --task task-xxxxxx --repo micro --dry-run
taskhub board-add --task task-xxxxxx --repo micro
```

## 6. 跑一轮协调

打开「信箱调度」会话，发：

```
巡检 task-xxxxxx
```

它会读 `tasks.json`、`HEAD.md`、`SUMMARY.md` 和各会话的 progress，把成员分成在跑 / 可推进 / 等你定 / 已完成，只对可推进的发一条短催办，再把有出处的结论写回 `SUMMARY.md`。

## 7. 把仓库地址丢给 AI

新同事只需把仓库地址和下面这段发给 AI：

> 读这个仓库的 `docs/AGENT-PROMPT.zh-CN.md`，按里面的约束帮我把 Task Hub 装起来；每步先给命令和预期输出，写入前先 dry-run。

详见 [`AGENT-PROMPT.zh-CN.md`](AGENT-PROMPT.zh-CN.md)。