"use client";

import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { AgendaApp } from "@/components/mcp-ui/agenda-app";
import { ScheduleApp } from "@/components/mcp-ui/schedule-app";
import { TaskBoardApp } from "@/components/mcp-ui/task-board-app";
import type {
  AgendaData,
  McpViewType,
  ScheduleData,
  TaskBoardData,
} from "@/components/mcp-ui/mcp-ui-types";

declare global {
  interface Window {
    __MCP_VIEW__?: McpViewType;
    __MCP_DATA__?: unknown;
  }
}

function renderView(): React.JSX.Element {
  const view = window.__MCP_VIEW__;
  const initialData = window.__MCP_DATA__;
  if (view === "agenda")
    return <AgendaApp initialData={initialData as AgendaData | null} />;
  if (view === "schedule")
    return <ScheduleApp initialData={initialData as ScheduleData | null} />;
  return <TaskBoardApp initialData={initialData as TaskBoardData | null} />;
}

if (typeof document !== "undefined") {
  const container = document.getElementById("root");
  if (container) {
    if (container.hasChildNodes()) {
      hydrateRoot(container, renderView());
    } else {
      createRoot(container).render(renderView());
    }
  }
}
