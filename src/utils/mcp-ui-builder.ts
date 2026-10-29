import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { McpViewType } from "@/components/mcp-ui/mcp-ui-types";

interface CompiledUiBundle {
  readonly css: string;
  readonly js: string;
  readonly renderMcpView: (view: McpViewType, data: unknown) => string;
  readonly mtimeKey: number;
}

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const mcpUiDir = path.join(serverRoot, "src/components/mcp-ui");
const sharedUiDir = path.join(serverRoot, "src/components/ui");
const globalsCssPath = path.join(serverRoot, "src/app/globals.css");
const bundleScriptPath = path.join(serverRoot, "scripts/bundle-mcp-ui.ts");
const prebuiltBundlePath = path.join(serverRoot, ".mcp-cache/mcp-ui-bundle.json");
const nodeRequire = createRequire(path.join(serverRoot, "package.json"));

let cachedBundle: CompiledUiBundle | null = null;
let lastMtimeCheckMs = 0;

function getMcpUiMtimeKey(): number {
  try {
    let maxMtime = fs.statSync(globalsCssPath).mtimeMs;
    for (const dir of [mcpUiDir, sharedUiDir]) {
      if (!fs.existsSync(/*turbopackIgnore: true*/ dir)) continue;
      for (const entry of fs.readdirSync(/*turbopackIgnore: true*/ dir)) {
        const stat = fs.statSync(path.join(dir, entry));
        if (stat.mtimeMs > maxMtime) maxMtime = stat.mtimeMs;
      }
    }
    return maxMtime;
  } catch {
    return 0;
  }
}

function getCompiledBundle(): CompiledUiBundle {
  const isProd = process.env.NODE_ENV === "production";
  if (cachedBundle && isProd) {
    return cachedBundle;
  }
  const now = Date.now();
  if (cachedBundle && now - lastMtimeCheckMs < 1000) {
    return cachedBundle;
  }
  lastMtimeCheckMs = now;
  const mtimeKey = getMcpUiMtimeKey();
  if (cachedBundle && cachedBundle.mtimeKey === mtimeKey) {
    return cachedBundle;
  }
  const rawJson =
    isProd && fs.existsSync(prebuiltBundlePath)
      ? fs.readFileSync(prebuiltBundlePath, "utf-8")
      : execFileSync(process.versions.bun ? process.execPath : "bun", ["run", bundleScriptPath], {
          cwd: serverRoot,
          encoding: "utf-8",
          maxBuffer: 32 * 1024 * 1024,
        });
  const parsed = JSON.parse(rawJson) as { css: string; js: string; ssrJs: string };
  const cjsMod = { exports: {} as { renderMcpView: (view: McpViewType, data: unknown) => string } };
  const evaluateSsr = new Function("exports", "module", "require", parsed.ssrJs);
  evaluateSsr(cjsMod.exports, cjsMod, nodeRequire);

  cachedBundle = {
    css: parsed.css,
    js: parsed.js,
    renderMcpView: cjsMod.exports.renderMcpView,
    mtimeKey,
  };
  return cachedBundle;
}

function safeJsonSerialize(data: unknown): string {
  return JSON.stringify(data ?? null).replace(/</g, "\\u003c");
}

function buildMcpAppHtml(title: string, view: McpViewType, initialData?: unknown): string {
  const { css, js, renderMcpView } = getCompiledBundle();
  const ssrHtml = renderMcpView(view, initialData);
  const safeDataJson = safeJsonSerialize(initialData);
  const safeJs = js.replace(/<\/script/gi, "<\\/script");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>${css}</style>
</head>
<body class="bg-transparent p-2 text-foreground antialiased">
  <div id="root">${ssrHtml}</div>
  <script>window.__MCP_VIEW__ = ${JSON.stringify(view)}; window.__MCP_DATA__ = ${safeDataJson};</script>
  <script type="module">${safeJs}</script>
</body>
</html>`;
}

export function getAgendaUiHtml(initialData?: unknown): string {
  return buildMcpAppHtml("calendar_agenda_app", "agenda", initialData);
}

export function getScheduleUiHtml(initialData?: unknown): string {
  return buildMcpAppHtml("calendar_schedule_comparison_app", "schedule", initialData);
}

export function getTaskBoardUiHtml(initialData?: unknown): string {
  return buildMcpAppHtml("task_kanban_board_app", "tasks", initialData);
}
