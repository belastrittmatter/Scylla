"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { TaskBoardData } from "@/components/mcp-ui/mcp-ui-types";
import { HardLink } from "./hard-link";

const InteractiveTaskBoardApp = dynamic(
  () =>
    import("@/components/mcp-ui/task-board-app").then((m) => m.TaskBoardApp),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] w-full items-center justify-center bg-neutral-900/60 rounded-xl text-sm text-neutral-400">
        <span className="size-2 rounded-full bg-orange-500 animate-ping mr-2" />
        Mounting interactive MCP Kanban board...
      </div>
    ),
  },
);

const MOCK_MCP_KANBAN_DATA: TaskBoardData = {
  teamName: "Team",
  projectName: "Scylla",
  tasks: [
    {
      id: "tsk-01",
      title: "Drag & drop task workflow",
      description: "Try dragging this card to In Progress or Done!",
      status: "todo",
      priority: "urgent",
      assigneeName: "Alex Rivera",
      estimatedMinutes: 60,
      totalSpentSeconds: 0,
      dueDate: "2026-11-15",
    },
    {
      id: "tsk-02",
      title: "Live deep work time-tracker",
      description: "Real-time session timer actively ticking every second.",
      status: "todo",
      priority: "high",
      assigneeName: "Olivia Chen",
      estimatedMinutes: 90,
      totalSpentSeconds: 3450,
      activeSessionStartedAt: new Date(
        Date.now() - 1000 * 60 * 24 - 1000 * 37,
      ).toISOString(),
      dueDate: "2026-11-18",
    },
    {
      id: "tsk-03",
      title: "Autonomous room & calendar triage",
      description: "Auto-detect meeting conflicts with Google Calendar sync.",
      status: "todo",
      priority: "urgent",
      assigneeName: "Riley Cooper",
      estimatedMinutes: 120,
      totalSpentSeconds: 5200,
      dueDate: "2026-11-19",
    },
    {
      id: "tsk-04",
      title: "Multi-person schedule comparison",
      description: "Compute mutual free slots across multiple calendars.",
      status: "todo",
      priority: "medium",
      assigneeName: "Jordan Lee",
      estimatedMinutes: 45,
      totalSpentSeconds: 2700,
      dueDate: "2026-11-10",
    },
  ],
};

export function LandingTaskBoardPreview() {
  return (
    <section className="section-bottom-border relative z-10 bg-[#09090b]">
      <div className="container">
        <div className="border-container section-spacing-lg">
          <div
            className="flex justify-between items-center gap-8 sm:gap-12 flex-col lg:flex-row"
            data-container="trail-section"
          >
            {/* Interactive MCP Kanban UI Window (Replaced static video with live interactive UI) */}
            <div
              className="lg:max-w-[620px] xl:max-w-[660px] w-full rounded-[18px] border border-white/10 bg-[#121215] shadow-2xl overflow-hidden transition-all duration-300 hover:border-white/20 text-foreground"
              style={
                {
                  "--color-primary": "var(--primary)",
                  "--color-secondary": "var(--secondary)",
                  fontFamily: "var(--font-sans)",
                } as React.CSSProperties
              }
            >
              <InteractiveTaskBoardApp initialData={MOCK_MCP_KANBAN_DATA} />
            </div>

            {/* Content text */}
            <div className="lg:max-w-[540px] w-full lg:py-5">
              <span className="badge-button mb-3 inline-block">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block mr-1.5" />
                Visual Task Execution
              </span>
              <h2
                data-title=""
                className="gradient-text text-3xl sm:text-4xl lg:text-5xl xl:text-[51px] font-semibold -tracking-[0.4px] !leading-[1.12]"
              >
                Turn Sprint Backlogs into Deep-Work Reality
              </h2>
              <p
                data-excerpt=""
                className="mt-4 md:mt-5 text-offWhite/80 text-sm sm:text-base leading-relaxed"
              >
                Prioritize sprints with zero overhead. Drag tasks across
                customizable workflow columns, track deep-work sessions with
                active sub-second timers, and automatically connect deliverables
                to calendar timelines.
              </p>
              <img
                data-line-top=""
                className="my-5 lg:my-8"
                src="/images/gradient-border.svg"
                alt="gradient Border"
              />
              <ul
                data-list=""
                className="font-medium text-offWhite/80 space-y-3.5 text-sm sm:text-base"
              >
                <li className="flex items-center gap-3">
                  <img src="/images/list-check.svg" alt="check" />
                  <span>
                    Interactive drag-and-drop Kanban with priority states &amp;
                    assignees.
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <img src="/images/list-check.svg" alt="check" />
                  <span>
                    Sub-second live session timers &amp; team velocity metrics.
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <img src="/images/list-check.svg" alt="check" />
                  <span>
                    Seamless 1-click scheduling: lock tasks into calendar focus
                    blocks.
                  </span>
                </li>
              </ul>
              <img
                data-line-bottom=""
                className="my-5 lg:my-8"
                src="/images/gradient-border.svg"
                alt="gradient Border"
              />
              <div data-button="" className="flex flex-wrap items-center gap-4">
                <HardLink
                  className="button-primary inline-flex items-center justify-center px-[22px] py-3 text-white font-medium text-sm leading-normal rounded-[10px] relative z-1 overflow-hidden text-center shadow-lg shadow-orange-500/20 cursor-pointer"
                  href="/tasks"
                >
                  Open Interactive Task Board
                </HardLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
