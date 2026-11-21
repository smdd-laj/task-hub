# 给 AI 的启动提示词

> 新同事把仓库地址和下面整段发给 AI 即可。它是**约束**，不是让 AI 自由发挥的任务书。

---

你要帮我安装并使用 Task Hub（一个 OpenChamber 扩展 + 一组受控命令 + 三个子代理 + 一个技能）。

仓库：`<把仓库地址贴在这里>`

请先读这两份，再动手：

1. `README.zh-CN.md`
2. `docs/QUICKSTART.zh-CN.md`（安装步骤以它为准）
3. `docs/WORKFLOW.zh-CN.md`（三级目录、角色、写域与停点）

执行约束：

- **不要改任何业务仓库**。这个任务只动 OpenChamber 配置目录和 `~/.task-hub/`。
- **每一步先给命令、预期输出和失败时怎么办**，我确认后再执行写入。
- 会写文件的命令先加 `--dry-run`（`taskhub board-add`、`install-integrations.mjs` 都支持）。
- 不要猜仓库别名、路径或分支名；缺信息就问我。
- 分支基线只写**该仓主分支**。`develop`、`dev`、`test`、`release` 都是合并目标，不是基线；禁止从 `test` 起分支。
- 装子代理和技能时，用我的主代理名替换示例里的 `build`：
  `node scripts/install-integrations.mjs --main-agent "<我的主代理名>"`
- 装完提醒我**重启 OpenChamber**，并说明为什么（代理和技能在会话启动时加载，旧会话不会中途长出来）。
- 最后给我一份清单：改了哪些文件、新增了哪些、哪些被跳过（已存在）、下一步做什么。

验收（做完逐条给我看）：

1. `taskhub help` 能列出命令。
2. `taskhub repo-list` 能读到我登记的仓库；没有就先带我建 `~/.task-hub/repos.json`。
3. 面板里能建出一件任务，且看到「仓库 → 长期四格 / 执行基线 → 会话」三级。
4. 「信箱调度」会话能跑一轮巡检，盘面分成四桶，且有出处的结论写进 `SUMMARY.md`。

我的环境：

- 主代理名：`<例如 build>`
- 任务板根目录：`<默认 ~/.task-hub>`
- 仓库清单：`<先给我看 repos.json，没有就按我给的仓库建>`

---

## 短版（只问装法时用）

> 这是 Task Hub 仓库：`<URL>`。请按 `docs/QUICKSTART.zh-CN.md` 帮我装好扩展、`taskhub` 命令、`看板操作` / `worktree-builder` / `信箱调度` 三个代理和 `task-board` 技能。写入前先 dry-run，装完告诉我改了哪些文件、要重启什么。