# Task Hub

One task, many agent sessions, one shared progress folder.

Task Hub is an OpenChamber panel for work that more than one session has to move
forward. Each task lists the sessions working on it and points at a folder where
everyone writes their own short progress file. The panel shows who is running,
who is waiting, which files have been written, and lets you jump straight into a
session.

It does **not** send messages into other sessions. Sending stays a deliberate act
in the session you are talking to; Task Hub only composes the line for you.

## What it does

- **Tasks with several sessions.** Add sessions from any project that is open in
  OpenChamber. Reorder them by dragging; the order is saved.
- **One shared progress folder per task.** `README.md` (the brief), `SUMMARY.md`
  (settled conclusions) and one `progress-<last6>.md` per session. The panel
  shows whether each file exists and how big it is.
- **Live status.** Running, waiting for you, idle or unreachable, from the same
  activity the sidebar shows.
- **Jump to a session.** Click a session name to open that chat.
- **Auto refresh.** A 3-second poll you can switch off while editing.

## Files

Everything lives under `~/.task-hub/`:

- `tasks.json` — the board itself: one entry per task with its sessions. The panel and any agent read and write this same file, so a terminal, a skill or another tool can work on it too.
- `settings.json` — the progress root.
- `<task id>/` — that task's progress folder (`README.md`, `SUMMARY.md`, `progress-*.md`).

## Status

A small local service keeps every session's running state. It subscribes to the
OpenChamber event stream, so a turn starting or finishing shows up immediately;
if the stream goes quiet for 30 seconds it falls back to reading session state
through the `opencode` CLI. The panel asks the service for the sessions on the
board and shows a spinner with the real elapsed time while a turn runs, and a
check with the last turn's duration once it finishes.

The service needs the `opencode` CLI on `PATH`; that is the only external command
it runs.

## Install

Settings → Extensions → paste the folder, ZIP or git URL → Add.

Approve `sessions` (list projects and sessions, open a chat) and the file pattern
`~/.task-hub/**` (read and write the progress folder).

## Where progress files live

Two modes, chosen per task:

- **Readable — home paths.** Default `~/.task-hub/<task id>/`. You can change the
  root to any folder under your home in the manifest's `filesystem` pattern
  (`~/.task-hub/**` by default). The panel reads these files and shows their
  state.
- **Recorded only — any path.** Paste something like `D:\work\notes\task-123`.
  OpenChamber cannot read paths outside the declared pattern, so the panel shows
  and copies the path and marks it `external`. The files are yours to keep.

Files are never created outside a readable folder, and editing a task never
overwrites `SUMMARY.md`.

## What it deliberately does not do

- No sending into another session, no local service, no background daemon.
- No per-turn timing: the public SDK does not expose when a turn started, so the
  panel shows state, not a stopwatch.
- No automatic session discovery; you add sessions yourself.

## Development

```bash
npm install
npx esbuild panel/src.js --bundle --format=iife --platform=browser --outfile=panel/main.js
```

`panel/main.js` is committed: OpenChamber never builds an extension at install
time.

## License

MIT
