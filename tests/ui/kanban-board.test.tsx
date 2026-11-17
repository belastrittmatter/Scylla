import { renderToString } from "react-dom/server";
import { describe, expect, it } from "bun:test";
import { KanbanCard } from "@/components/tasks/kanban-card";
import { KanbanColumn } from "@/components/tasks/kanban-column";
import { TaskGithubRepoChip } from "@/components/tasks/task-github-repo-chip";
import { createDraftTask } from "@/components/tasks/task-utils";
import type { TaskItem } from "@/components/tasks/task-types";

function makeTask(id: string, overrides: Partial<TaskItem> = {}): TaskItem {
  return {
    ...createDraftTask("todo", "t1", "u1", null),
    id,
    title: `Task ${id}`,
    ...overrides,
  };
}

describe("KanbanCard GitHub badges", () => {
  it("shows issue, branch and PR status for a linked task", () => {
    const html = renderToString(
      <KanbanCard
        task={makeTask("a", {
          githubRepo: "acme/widgets",
          githubIssueNumber: 12,
          githubIssueUrl: "https://github.com/acme/widgets/issues/12",
          githubBranch: "feat/12-x",
          githubPrNumber: 15,
          githubPrUrl: "https://github.com/acme/widgets/pull/15",
          githubPrStatus: "merged",
        })}
      />,
    );
    expect(html).toContain("#12");
    expect(html).toContain('href="https://github.com/acme/widgets/issues/12"');
    expect(html).toContain("feat/12-x");
    expect(html).toContain("PR #15");
    expect(html).toContain("Merged");
    expect(html).toContain('data-pr-status="merged"');
    expect(html).toContain('href="https://github.com/acme/widgets/pull/15"');
  });

  it("shows no GitHub markers for an unlinked task", () => {
    const html = renderToString(<KanbanCard task={makeTask("b")} />);
    expect(html).not.toContain("#12");
    expect(html).not.toContain("PR #");
    expect(html).not.toContain("data-pr-status");
    expect(html).not.toContain("View issue");
    expect(html).not.toContain("Branch:");
  });
});

describe("KanbanColumn GitHub summary", () => {
  it("summarizes linked issues and PRs in the header", () => {
    const html = renderToString(
      <KanbanColumn
        id="todo"
        title="To do"
        tasks={[
          makeTask("a", { githubIssueNumber: 1 }),
          makeTask("b", { githubIssueNumber: 2 }),
          makeTask("c", { githubPrNumber: 9 }),
        ]}
      />,
    );
    expect(html).toContain("2 issues · 1 PR");
    expect(html).toContain("GitHub-linked tasks in this column");
  });

  it("shows no summary when nothing is linked", () => {
    const html = renderToString(
      <KanbanColumn id="todo" title="To do" tasks={[makeTask("a")]} />,
    );
    expect(html).not.toContain("issue");
    expect(html).not.toContain("GitHub-linked");
  });
});

describe("TaskGithubRepoChip", () => {
  it("links to the repository", () => {
    const html = renderToString(<TaskGithubRepoChip repo="acme/widgets" />);
    expect(html).toContain('href="https://github.com/acme/widgets"');
    expect(html).toContain("acme/widgets");
    expect(html).toContain('rel="noopener noreferrer"');
  });
});
