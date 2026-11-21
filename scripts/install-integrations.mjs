#!/usr/bin/env node
/**
 * Install the Task Hub agent kit into an OpenCode config directory.
 *
 * Copies integrations/opencode/agents/*.md into <config>/agent/ and
 * integrations/opencode/skills/* into <config>/skills/, replacing the
 * {{MAIN_AGENT}} placeholder with --main-agent.
 *
 * Usage:
 *   node scripts/install-integrations.mjs
 *   node scripts/install-integrations.mjs --main-agent "build" --dry-run
 *   node scripts/install-integrations.mjs --config-dir "C:\Users\me\.config\opencode" --force
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const sourceRoot = path.join(repoRoot, "integrations", "opencode");

function parseArgs(argv) {
  const out = { mainAgent: "build", configDir: "", taskHubHome: "", dryRun: false, force: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--main-agent") out.mainAgent = argv[++i] || out.mainAgent;
    else if (a === "--config-dir") out.configDir = argv[++i] || "";
    else if (a === "--task-hub-home") out.taskHubHome = argv[++i] || "";
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--force") out.force = true;
    else if (a === "--help" || a === "-h") {
      console.log("usage: node scripts/install-integrations.mjs [--main-agent NAME] [--config-dir DIR] [--task-hub-home DIR] [--dry-run] [--force]");
      process.exit(0);
    }
  }
  return out;
}

function timestamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function configDirFor(arg) {
  if (arg) return path.resolve(arg);
  if (process.env.OPENCODE_CONFIG_DIR) return path.resolve(process.env.OPENCODE_CONFIG_DIR);
  return path.join(os.homedir(), ".config", "opencode");
}

function listFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true });
}

function installFile(src, dest, vars, { dryRun, force }) {
  let text = fs.readFileSync(src, "utf8");
  for (const [key, value] of Object.entries(vars)) text = text.replaceAll(key, value);
  const exists = fs.existsSync(dest);
  if (exists && !force) {
    const same = fs.readFileSync(dest, "utf8") === text;
    if (same) return { dest, state: "unchanged" };
    return { dest, state: "skipped (exists, use --force)" };
  }
  if (dryRun) return { dest, state: exists ? "would overwrite" : "would create" };
  if (exists) fs.copyFileSync(dest, `${dest}.bak-${timestamp()}`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, text, "utf8");
  return { dest, state: exists ? "overwritten (backup kept)" : "created" };
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const configDir = configDirFor(opts.configDir);
  const taskHubHome = path.resolve(opts.taskHubHome || path.join(os.homedir(), ".task-hub"));
  const vars = {
    "{{MAIN_AGENT}}": opts.mainAgent,
    "{{TASK_HUB_HOME}}": taskHubHome.replaceAll("\\", "/"),
  };
  if (!fs.existsSync(sourceRoot)) {
    console.error(`missing source: ${sourceRoot}`);
    process.exit(1);
  }
  console.log(`config: ${configDir}`);
  console.log(`main agent: ${opts.mainAgent}`);
  console.log(`task hub home: ${taskHubHome}`);
  if (opts.dryRun) console.log("dry run, nothing written");

  const results = [];
  const agentsDir = path.join(sourceRoot, "agents");
  for (const entry of listFiles(agentsDir)) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
    results.push(installFile(path.join(agentsDir, entry.name), path.join(configDir, "agent", entry.name), vars, opts));
  }

  const skillsDir = path.join(sourceRoot, "skills");
  for (const entry of listFiles(skillsDir)) {
    if (!entry.isDirectory()) continue;
    const src = path.join(skillsDir, entry.name, "SKILL.md");
    if (!fs.existsSync(src)) continue;
    results.push(installFile(src, path.join(configDir, "skills", entry.name, "SKILL.md"), vars, opts));
  }

  for (const r of results) console.log(`${r.state.padEnd(26)} ${r.dest}`);
  const changed = results.filter((r) => !r.state.startsWith("skipped") && r.state !== "unchanged").length;
  console.log(`\n${results.length} file(s), ${changed} to write`);

  if (!opts.dryRun) {
    console.log("\nnext:");
    console.log("  1. restart OpenChamber (agents and skills load at session start)");
    console.log('  2. run: taskhub task-create --title "first task" --goal "..." --accept "..." --repos <alias>');
    console.log("  3. open the Task Hub panel and check the three-level groups");
  }
}

main();