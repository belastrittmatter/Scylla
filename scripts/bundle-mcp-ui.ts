import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const serverDir = path.resolve(import.meta.dir, "..");
const req = createRequire(path.join(serverDir, "package.json"));
const twTurbopackEntry = req.resolve("@tailwindcss/turbopack");
const twReq = createRequire(twTurbopackEntry);

const { compile, optimize } = twReq("@tailwindcss/node") as {
  compile: (
    css: string,
    opts: { base: string; onDependency: (dep: string) => void },
  ) => Promise<{ build: (candidates: string[]) => string }>;
  optimize: (css: string, opts: { minify: boolean }) => { code: string };
};
const { Scanner } = twReq("@tailwindcss/oxide") as {
  Scanner: new (opts: {
    sources: { base: string; pattern: string; negated: boolean }[];
  }) => {
    scan: () => string[];
  };
};

const clientEntryPath = path.join(
  serverDir,
  "src/components/mcp-ui/mcp-app-client.tsx",
);
const virtualSsrEntryPath = path.join(
  serverDir,
  "src/components/mcp-ui/__ssr_virtual__.tsx",
);
const globalsCssPath = path.join(serverDir, "src/app/globals.css");

const [clientBuild, ssrBuild, rawCss] = await Promise.all([
  Bun.build({
    entrypoints: [clientEntryPath],
    target: "browser",
    minify: true,
    define: { "process.env.NODE_ENV": '"production"' },
  }),
  Bun.build({
    entrypoints: [virtualSsrEntryPath],
    files: {
      [virtualSsrEntryPath]: `
        import React from "react";
        import { renderToString } from "react-dom/server";
        import { AgendaApp } from "@/components/mcp-ui/agenda-app";
        import { ScheduleApp } from "@/components/mcp-ui/schedule-app";
        import { TaskBoardApp } from "@/components/mcp-ui/task-board-app";
        export function renderMcpView(view: string, data: unknown): string {
          if (view === "agenda") return renderToString(<AgendaApp initialData={data} />);
          if (view === "schedule") return renderToString(<ScheduleApp initialData={data} />);
          return renderToString(<TaskBoardApp initialData={data} />);
        }
      `,
    },
    target: "node",
    format: "cjs",
    minify: true,
    define: { "process.env.NODE_ENV": '"production"' },
  }),
  Bun.file(globalsCssPath).text(),
]);

if (!clientBuild.success || clientBuild.outputs.length === 0) {
  throw new Error(
    `Client Bun.build failed: ${JSON.stringify(clientBuild.logs)}`,
  );
}
if (!ssrBuild.success || ssrBuild.outputs.length === 0) {
  throw new Error(`SSR Bun.build failed: ${JSON.stringify(ssrBuild.logs)}`);
}

const [js, ssrJs] = await Promise.all([
  clientBuild.outputs[0].text(),
  ssrBuild.outputs[0].text(),
]);

const compiler = await compile(rawCss, {
  base: path.dirname(globalsCssPath),
  onDependency: () => {},
});
const scanner = new Scanner({
  sources: [
    {
      base: path.join(serverDir, "src/components/mcp-ui"),
      pattern: "**/*.{ts,tsx}",
      negated: false,
    },
    {
      base: path.join(serverDir, "src/components/ui"),
      pattern: "**/*.{ts,tsx}",
      negated: false,
    },
  ],
});
const compiledCss = compiler.build(scanner.scan());
const css = optimize(compiledCss, { minify: true }).code;
const payload = JSON.stringify({ css, js, ssrJs });

if (process.argv.includes("--write")) {
  const outPath = path.join(serverDir, ".mcp-cache/mcp-ui-bundle.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, payload, "utf-8");
} else {
  process.stdout.write(payload);
}
