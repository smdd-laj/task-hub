# 发布材料（Task Hub 1.1.0）

## 一、提交到扩展列表

页面：https://openchamber.dev/zh/extensions/ 底部的「提交你的扩展」链接。
需要给的就是两样：**仓库链接** 和 **一句功能说明**。

一句说明（英文，列表里其它条目都是英文）：

> Task Hub — one task, many agent sessions, one shared progress folder.

中文备注（如果你在信里补一句）：

> 一件任务挂多个协作会话，共用一个进度目录；面板显示谁在跑、谁卡住，点名字直接跳进那个会话。

## 二、仓库

本地已经是一个 git 仓库，根提交 `5bc9cfb`，9 个文件。还没有远端，也没有 `gh` CLI。

```powershell
cd D:\work\_tools\task-hub
git remote add origin <你的仓库地址>
git push -u origin master
```

建仓库时建议：

- 仓库名 `task-hub`，公开，MIT。
- 不要提交 `node_modules/`、`dist/`（`.gitignore` 已排除）。
- `panel/main.js` 必须提交：宿主不会替你编译。

## 三、发版包

`dist/task-hub-1.1.0.zip`（30KB），根目录直接是 `package.json`，面板脚本已构建。
已实测：用这个 zip 通过 `POST /api/guests` 安装返回 201，扩展识别为 `task-hub` 1.1.0。

重新打包：

```powershell
python C:\Users\HUAWEI\AppData\Local\Temp\opencode\repack.py
```

（脚本做两件事：用正斜杠重新压 zip，然后打安装接口验证。）

## 四、安装与权限

设置 → 扩展 → 文件夹 / ZIP / Git 地址。

会请求两项：

- `sessions`：列项目和会话、打开聊天。
- 文件模式 `~/.task-hub/**`：读写看板与进度目录。

没有 `prompt`、没有 `service`，所以不会替用户向任何会话发消息。

## 五、配套的 skill 与智能体

| 用途 | 文件 |
|---|---|
| 读写看板、进度目录约定、发信流程 | `~/.config/opencode/skills/task-hub/SKILL.md` |
| 一轮巡检：四桶分类、催办、汇总 | `~/.config/opencode/agent/信箱调度.md` |
| 旧入口（已迁移，保留重定向） | `skills/mailbox-ops`、`skills/mailbox-self` |

用法一句话：面板用来看和跳；skill 用来改 `tasks.json` 和写进度；`信箱调度` 用来看一轮谁该被推、谁在等用户。

## 六、已知限制（写进发布说明，别等用户踩）

- 面板不跨会话发信；「放入聊天框」只写当前输入框。
- 不显示每轮耗时：公开 SDK 拿不到 turn 起点。
- `~` 之外的路径（例如 D 盘）只记录不读取，面板会标 `external`。
- 扩展与 `tasks.json` 同时写会互相覆盖，后写者赢。
