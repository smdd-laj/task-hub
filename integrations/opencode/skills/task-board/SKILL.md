---
name: task-board
description: 按 Task Hub 规范建任务、给任务加项目、在指定目录开会话。触发：建任务、加项目、加仓库、长期目录、执行基线、看板操作、taskhub board-add。只写任务名册和任务目录，不改业务代码，不建 worktree，除非用户明确说要建执行目录。
---

# 看板操作

用户说「建任务」「给这件任务加项目」「在这个目录开会话」时使用。只跑 `taskhub`。不要手改 `tasks.json`，不要自己拼长期目录。

仓库别名以 `taskhub repo-list` 为准；别名、路径、主分支写在 `~/.task-hub/repos.json`。

## 建任务

三个字段都要有：标题、做什么、怎样算完成。用户没给后两项时，用标题填上，并在回报里写明是照标题填的。

```
taskhub task-create --title "<标题>" --goal "<做什么>" --accept "<怎样算完成>" --repos <alias,alias>
```

`--repos` 可省略。给了就会带上长期四格和一条空的执行基线。多个仓库的执行基线不一样时，不要在这条命令上加 `--baseline`，建完再逐个 `board-add`。

这条命令会：建 `~/.task-hub/tasks/<id>`、写 `HEAD.md` 和 `SUMMARY.md`、把任务目录登记成 OpenChamber 项目、建协调会话并写入名册（协调代理名由安装时指定）。

## 加项目

已有任务要补仓库时：

```
taskhub board-add --task <id> --repo <alias>
taskhub board-add --task <id> --repo <alias> --baseline feature/<slug>
taskhub board-add --task <id> --repo <alias> --baseline feature/<slug> --baseline-path <已有绝对路径>
```

写入结果固定是：

- **长期**：主检出（用 `repos.json` 里的 `base`）、`test`、`develop`、`release`。路径是 `D:\work\<仓库>--worktrees\<分支>`（Windows）或 `~/work/...`（其他系统）。微服务的 release 路径可能留空，因为本地 `refs/heads/release` 和 `release/*` 撞名，合 release 走合并请求。
- **执行**：没给 `--baseline` 就是「未指定」。给了分支，并且旁边已经有同名目录，就写上路径；没有目录就只记分支，注明还没建。
- 已在这件任务上的仓库会跳过。原来基线是「未指定」、这次给了 `--baseline`，只补基线，不重复加一行。

**不建 worktree，不 fetch，不切分支。** 用户明确说「把执行目录建出来」时，才另跑：

```
taskhub worktree-create --task <id> --repo <alias> --branch feature/<slug> --base <该仓主分支> --no-record
```

成功后再 `board-add --baseline <同一分支> --baseline-path <返回的 path>`。基线只能是该仓主分支；`develop`、`dev`、`test`、`release` 都是合并目标，不是基线。长期目录（test / develop / release）本命令不新建；缺了就在回报里写「还没建」，等用户另说。

多个仓库基线不同，就一条 `board-add` 一个仓库。先 `--dry-run` 看 `added`，确认后再去掉 `--dry-run`。

## 开会话

目录必须已经存在，并且是这个项目的主检出、长期目录或执行目录。标题写成「项目简称 - 现在做什么」。

```
taskhub session-create --dir "<绝对路径>" --title "<标题>" --agent "{{MAIN_AGENT}}"
taskhub member-add --task <id> --session <ses_...> --title "<同一标题>" --role helper --dir "<同一个绝对路径>"
```

协调会话用同一个主代理加 `--role main`。`--dir` 必须是绝对路径，不能写任务 id 或目录末段，否则看板归不到这一格。

`session-create` 只把会话写进引擎和名册。侧栏认的是宿主自己建的会话，这条命令建出来的不一定出现在侧栏。回报里写明这一点。用户要在侧栏点得开，让他在看板该格子的「+」里再建一个。

## 不做

- 不改业务仓库，不 commit，不 push，不 merge。
- 不删任务、不删项目、不删会话。
- 不把 `test` 写成执行基线，不从 `test` 拉分支。
- 不并行写 `tasks.json`。一次只跑一条会写名册的命令。
- 派单或自己动手改代码之前，仍要先读全局 `AGENTS.md` 和该仓库的 `AGENTS.md`。本技能本身不改代码。

## 回报

```
任务：<id> <标题>
协调：<sessionId 或失败原因>
项目：<alias> 长期=主检出/test/develop/release 执行=<分支或未指定> 路径=<有或还没建>
会话：<sessionId> 目录=<绝对路径> 侧栏=不一定显示
未做：<没建的 worktree、没加的仓库>
```