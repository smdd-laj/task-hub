# Task Hub 设计（v1：可发布的协作板）

把现有「任务名册」从个人脚本改造成一个可提交到 OpenChamber 扩展市场的扩展。目标：**一件任务挂多个协作会话，共享一个进度目录**，面板负责看清、跳转、把指令放进当前输入框；不替用户跨会话发信。

已定：进度文件放**项目内** `.task-hub/<taskId>/`；v1 带「放入聊天框」（`compose`，不需要额外权限）。

## 1. 与现有实现的关系

| 现有 | v1 扩展 |
|---|---|
| `C:\Users\HUAWEI\.config\opencode\mailbox\roster.json` | `host.storage`，一件任务一个键 |
| `D:\work\.mailbox\<channel>\` | 项目内 `.task-hub/<taskId>/`，相对路径 |
| `mailbox.mjs` 提供 board / refresh / join | 全部由面板自己算，不再依赖 CLI |
| 用 `opencode api` 判断在跑 | 只用 `host.listSessions()` 的 `activity` |
| `session.send` 跨会话发信 | v1 不做；只 openSession + 复制 |
| 中文硬编码 | `ctx.locale` + 中英两套文案 |

## 2. 数据模型

存储（`host.storage`，每值 ≤64KiB，总量 ≤2MiB）：

- `taskhub.index` → `{ version: 1, ids: ["t_xxx", ...] }`（顺序即手动排序）
- `taskhub.task.t_xxx` → 单件任务记录

```json
{
  "id": "t_7f3a1c",
  "title": "二维码生成对接",
  "goal": "……",
  "acceptance": "……",
  "progressDir": ".task-hub/t_7f3a1c",
  "createdAt": 1790000000000,
  "updatedAt": 1790000000000,
  "members": [
    { "sessionId": "ses_...", "title": "中付主扫协同", "directory": "zhongfu" }
  ]
}
```

- 一件任务一个键，避免单值超限；索引只存 id 和顺序。
- 成员标题是缓存，渲染时优先用 `listSessions()` 的实时标题。
- 删除任务：删索引项 + 删任务键；磁盘上的进度目录**不删**，只提示路径（避免误删别人的进展）。

## 3. 进度目录约定

宿主对文件访问有硬限制：`filesystem` 模式只能以 `/` 或 `~/` 开头，声明之后才可读写；`D:\...` 这类盘符路径声明不了，项目外的任意路径也读不到。所以路径分两种模式，由用户在任务里选：

**可读模式（默认）**：根目录默认 `~/.task-hub`，可在设置里改成家目录下的任意子目录，例如 `~/work/tasks`。清单声明一个模式：

```json
"filesystem": ["~/.task-hub/**"]
```

改到别的家目录子目录时，需要把模式改成对应前缀并重新批准（面板给出提示和要粘贴的模式）。

每件任务的目录：`<根>/<taskId>/`。

- `README.md`：口径、协作方、约定。建任务时生成，之后不覆盖。
- `progress-<会话 id 后 6 位>.md`：各方自己写，面板只读。
- `SUMMARY.md`：已定结论，面板只读。

面板显示每个文件的存在、大小、修改时间；点一下复制绝对路径。

**外部模式（只记录）**：用户可以直接填任意绝对路径，比如 `D:\work\.mailbox\task-123`。这类路径宿主读不到，面板只显示、复制，并标一句「此目录不在可读范围」。它适合把进度放在仓库、共享盘或别处，由人和代理自己维护，扩展不代管。

切换模式不搬文件，只换记录；目录里已写的内容不动。

## 4. 能力与清单

```json
{
  "openchamber": {
    "apiVersion": 1,
    "contributes": {
      "panel": { "id": "task-hub", "name": "Task Hub", "icon": "links", "entry": "panel/index.html" },
      "capabilities": ["sessions"],
      "filesystem": ["~/.task-hub/**"]
    }
  }
}
```

- `sessions`：列项目与会话、`openSession()`。
- `filesystem`：只覆盖可读模式的根；用户改到别处时，模式要跟着改并重新批准。
- 不声明 `prompt`、不做 `service` → 全部公开能力。

## 5. 界面

左栏（窄卡片，≤260px）：搜索、排序（手动/名称/会话数）、任务卡（标题 + 会话数），当前会话在其中的任务带一个点。

右栏：
- 标题行：任务名、`你在里面` 标记、编辑/加会话/删除。
- 进度目录行：路径 + 复制；下面三行小字列出 README / SUMMARY / 各 progress 文件的状态。
- 成员行：拖动排序、名字可点（openSession）、实时状态点（running ◌ / waiting ◔ / idle · / failed ✕）、放入聊天框、移除。
- 底部一行提示：面板不代发信，发信在会话里按约定做。

自动刷新：顶部开关，3 秒一轮，弹窗打开或拖动时暂停。

## 6. 明确不做（v1）

- 不跨会话发信，不做本地服务，不读 `bridge.db`，不起守护进程。「放入聊天框」只写当前输入框，不发送。
- 不自动收养新会话（那是 Kanban 的做法），成员一律手动加。
- 不显示轮次耗时（公开 API 拿不到 turn 起点），只显示「刚刚活动 / X 分钟前」。
- 不做 i18n 之外的花样：中英两套文案，跟随 `ctx.locale`。

## 7. 文件结构

```
task-hub/
├── package.json            # openchamber 清单
├── panel/index.html        # 样式与骨架
├── panel/src.js            # 逻辑，esbuild 打成 IIFE
├── panel/main.js           # 构建产物，提交进仓库
├── README.md               # 英文，含权限与限制
├── README.zh-CN.md
└── LICENSE                 # MIT
```

## 8. 里程碑

1. **M1 骨架**：清单能装、面板能开、storage 读写正常（空列表 + 新建）。
2. **M2 会话**：列项目/会话、加人、移除、拖动排序、点名字跳转、实时状态。
3. **M3 进度目录**：建任务时生成 README，列三件套状态，复制路径；无项目时降级。
4. **M4 发布**：中英文案、README、版本号、构建产物、仓库、提交。

## 9. 验收

- 在另一台机器（或清空扩展数据后）从文件夹安装：能装、能开、无 400。
- 新建一件任务、加两个会话、生成 `.task-hub/<id>/README.md`。
- 点会话名跳到对应聊天；自动刷新下状态随会话变化。
- 全程不出现个人绝对路径；不声明 `prompt`/`service`/`filesystem`。
- 卸载后 storage 清空，项目里的 `.task-hub/` 保留。

## 10. 已知风险

- 外部模式的目录面板读不到，只能记录和复制；用户要清楚「面板显示的路径未必能看内容」。
- 用户把根改到家目录其他位置时，清单里的 `filesystem` 模式和实际路径要一致，否则会 `BAD_PATH`；面板必须给出明确提示，而不是静默失败。
- 会话标题来自 `listSessions`，跨项目会话若不在已添加项目里就取不到标题，只能显示缓存名。
- 面板刷新频率与 `onReady` 重复触发：沿用现有「只挂载一次、快照只更新数据」的做法。
