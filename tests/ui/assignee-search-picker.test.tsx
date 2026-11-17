import * as React from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "bun:test";
import { getAssigneeGithubStatus } from "@/components/tasks/assignee-github-status";
import { AssigneeSearchPicker } from "@/components/tasks/assignee-search-picker";
import { TaskDrawerForm } from "@/components/tasks/task-drawer-form";
import type { TaskUser } from "@/components/tasks/task-types";

const noop = () => {};
const TOOLTIP =
  "Dana has not connected GitHub. Members must connect GitHub in Account Settings before they can be assigned tasks in this project.";

const dana: TaskUser = {
  id: "u1",
  name: "Dana",
  email: "dana@example.com",
  role: "member",
  githubConnected: false,
};
const lee: TaskUser = {
  id: "u2",
  name: "Lee",
  email: "lee@example.com",
  role: "member",
  githubConnected: true,
};

describe("getAssigneeGithubStatus", () => {
  it("blocks a member without GitHub when GitHub is required", () => {
    expect(getAssigneeGithubStatus(dana, true)).toEqual({
      blocked: true,
      badge: "No GitHub",
      tooltip: TOOLTIP,
    });
  });

  it("does not block connected or unknown members, or when not required", () => {
    const none = { blocked: false, badge: null, tooltip: null };
    expect(getAssigneeGithubStatus(lee, true)).toEqual(none);
    expect(
      getAssigneeGithubStatus({ name: "X", githubConnected: undefined }, true),
    ).toEqual(none);
    expect(getAssigneeGithubStatus(dana, false)).toEqual(none);
  });
});

describe("AssigneeSearchPicker", () => {
  const render = (requireGithub?: boolean) =>
    renderToString(
      <AssigneeSearchPicker
        users={[dana, lee]}
        assigneeId="u1"
        onAssigneeChange={noop}
        requireGithub={requireGithub}
      />,
    );

  it("shows the badge and tooltip title for a blocked selected user", () => {
    const html = render(true);
    expect(html).toContain("No GitHub");
    expect(html).toContain(`title="${TOOLTIP}"`);
  });

  it("shows neither when GitHub is not required", () => {
    for (const html of [render(false), render()]) {
      expect(html).not.toContain("No GitHub");
      expect(html).not.toContain("has not connected GitHub");
    }
  });
});

describe("TaskDrawerForm with the picker and Markdown editor", () => {
  const render = (githubRepo?: string) =>
    renderToString(
      <TaskDrawerForm
        title="t"
        description="body"
        status="todo"
        priority="medium"
        assigneeId="u1"
        startDateStr=""
        dueDateStr=""
        estimatedMinutes={60}
        users={[dana, lee]}
        githubRepo={githubRepo}
        onTitleChange={noop}
        onDescriptionChange={noop}
        onStatusChange={noop}
        onPriorityChange={noop}
        onAssigneeChange={noop}
        onStartDateChange={noop}
        onDueDateChange={noop}
        onEstimatedMinutesChange={noop}
      />,
    );

  it("flags members without GitHub only in a GitHub-linked project", () => {
    expect(render("acme/widgets")).toContain("No GitHub");
    expect(render()).not.toContain("No GitHub");
    expect(render("  ")).not.toContain("No GitHub");
  });

  it("uses the Markdown editor for the description", () => {
    const html = render();
    expect(html).toContain("Markdown supported (GFM)");
    expect(html).toContain('id="task-description"');
    expect(html).toContain("Description / Acceptance Criteria");
  });
});

describe("AssigneeSearchPicker selection", () => {
  type Combo = {
    onSelect: (u: TaskUser | null) => void;
    renderItem: (u: TaskUser) => React.ReactNode;
  };
  const setup = (requireGithub?: boolean) => {
    const calls: string[] = [];
    const el = AssigneeSearchPicker({
      users: [dana, lee],
      assigneeId: "u2",
      onAssigneeChange: (id) => calls.push(id),
      requireGithub,
    }) as React.ReactElement<Combo>;
    return { calls, props: el.props };
  };

  it("does not select a blocked member when GitHub is required", () => {
    const { calls, props } = setup(true);
    props.onSelect(dana);
    expect(calls).toEqual([]);
  });

  it("selects connected members and clears to unassigned", () => {
    const { calls, props } = setup(true);
    props.onSelect(lee);
    props.onSelect(null);
    expect(calls).toEqual(["u2", "unassigned"]);
  });

  it("selects any member when GitHub is not required", () => {
    for (const flag of [false, undefined]) {
      const { calls, props } = setup(flag);
      props.onSelect(dana);
      expect(calls).toEqual(["u1"]);
    }
  });

  it("badges only the blocked row in the list", () => {
    const { props } = setup(true);
    const blocked = renderToString(<>{props.renderItem(dana)}</>);
    const ok = renderToString(<>{props.renderItem(lee)}</>);
    expect(blocked).toContain("No GitHub");
    expect(blocked).toContain(`title="${TOOLTIP}"`);
    expect(ok).not.toContain("No GitHub");
  });
});
