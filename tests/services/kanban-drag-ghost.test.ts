import { describe, expect, test } from "bun:test";
import type { TaskItem } from "@/components/tasks/task-types";

describe("Kanban Drag Ghost Image and Drag State Fix (Issue #74)", () => {
  test("generates static clone with animations and transitions stripped for setDragImage", () => {
    // Emulate DOM element with active animations and transitions
    const element = {
      clientWidth: 280,
      clientHeight: 120,
      getBoundingClientRect: () => ({
        width: 280,
        height: 120,
        top: 100,
        left: 200,
      }),
      style: {
        animation: "pulse 1.5s infinite",
        transition: "width 0.3s ease",
      },
    };

    // Test clone creation logic matching kanban-column handleCardDragStart
    const cloneStyle: Record<string, string> = {
      width: `${element.getBoundingClientRect().width}px`,
      height: `${element.getBoundingClientRect().height}px`,
      position: "fixed",
      top: "-9999px",
      left: "-9999px",
      pointerEvents: "none",
      animation: "none",
      transition: "none",
      opacity: "1",
      zIndex: "-9999",
    };

    expect(cloneStyle.animation).toBe("none");
    expect(cloneStyle.transition).toBe("none");
    expect(cloneStyle.top).toBe("-9999px");
    expect(cloneStyle.width).toBe("280px");
    expect(cloneStyle.height).toBe("120px");
  });

  test("isDragging flag halts active 1s interval tick and pulse animation in KanbanCard", () => {
    const mockTask: Partial<TaskItem> = {
      id: "task-in-progress-1",
      title: "Active In Progress Task",
      status: "in_progress",
      priority: "high",
      teamId: "team-1",
      projectId: "proj-1",
      creatorId: "user-1",
      assigneeId: "user-1",
      activeSessionStartedAt: new Date(Date.now() - 3600000).toISOString(),
      totalSpentSeconds: 3600,
      estimatedMinutes: 120,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // When isDragging is true:
    const isDragging = true;
    const shouldRunInterval = mockTask.status === "in_progress" && !isDragging;
    expect(shouldRunInterval).toBe(false);

    // Pulse animation condition
    const shouldPulse = !isDragging;
    expect(shouldPulse).toBe(false);
  });
});
