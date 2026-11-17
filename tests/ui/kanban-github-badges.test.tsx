import { renderToString } from "react-dom/server";
import { describe, expect, it } from "bun:test";
import { KanbanBoardView } from "@/components/tasks/kanban-board-view";
import { KanbanCard } from "@/components/tasks/kanban-card";
import { TaskTableRow } from "@/components/tasks/task-table-row";
import {
  TaskGithubBadges,
  countLinkedPullRequests,
  getPrStatusLabel,
  hasGithubBadges,
} from "@/components/tasks/task-github-badges";
import {
  shouldAutoSyncProject,
  useProjectGithubAutoSync,
} from "@/components/tasks/use-project-github-auto-sync";
import { Table, TableBody } from "@/components/ui/table";
import type { Project, TaskItem } from "@/components/tasks/task-types";
import { createDraftTask } from "@/components/tasks/task-utils";

function makeProject(githubRepo: string | null): Project {
  return {
    id: "proj-1",
    name: "Proj",
    slug: "proj",
    description: null,
    teamId: "team-1",
    status: "active",
    color: null,
    githubRepo,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function makeTask(overrides: Partial<TaskItem> = {}): TaskItem {
  return {
    ...createDraftTask("todo", "team-1", "user-1", null),
    id: "task-1",
    title: "Add sync",
    ...overrides,
  };
}

const full = makeTask({
  githubIssueNumber: 42,
  githubIssueUrl: "https://github.com/octo/repo/issues/42",
  githubBranch: "feat/42-add-sync",
  githubPrNumber: 7,
  githubPrUrl: "https://github.com/octo/repo/pull/7",
  githubPrStatus: "merged",
});

describe("helpers", () => {
  it("hasGithubBadges", () => {
    expect(hasGithubBadges(makeTask())).toBe(false);
    expect(hasGithubBadges(makeTask({ githubIssueNumber: 1 }))).toBe(true);
    expect(hasGithubBadges(makeTask({ githubBranch: "b" }))).toBe(true);
    expect(hasGithubBadges(makeTask({ githubPrNumber: 1 }))).toBe(true);
  });

  it("getPrStatusLabel", () => {
    expect(getPrStatusLabel("open")).toBe("Open");
    expect(getPrStatusLabel("draft")).toBe("Draft");
    expect(getPrStatusLabel("merged")).toBe("Merged");
    expect(getPrStatusLabel("closed")).toBe("Closed");
    expect(getPrStatusLabel(null)).toBeNull();
    expect(getPrStatusLabel(undefined)).toBeNull();
    expect(getPrStatusLabel("weird")).toBeNull();
  });

  it("countLinkedPullRequests", () => {
    const tasks = [
      makeTask({ githubPrNumber: 1 }),
      makeTask({ githubPrNumber: 2 }),
      makeTask(),
    ];
    expect(countLinkedPullRequests(tasks)).toBe(2);
    expect(countLinkedPullRequests([])).toBe(0);
  });
});

describe("TaskGithubBadges", () => {
  it("renders nothing without GitHub data", () => {
    expect(renderToString(<TaskGithubBadges task={makeTask()} />)).toBe("");
  });

  it("renders issue, branch and PR chip", () => {
    const html = renderToString(<TaskGithubBadges task={full} />);
    expect(html).toContain("#42");
    expect(html).toContain('href="https://github.com/octo/repo/issues/42"');
    expect(html).toContain('title="GitHub issue #42"');
    expect(html).toContain("feat/42-add-sync");
    expect(html).toContain('title="Branch: feat/42-add-sync"');
    expect(html).toContain("PR #7");
    expect(html).toContain("Merged");
    expect(html).toContain('data-pr-status="merged"');
    expect(html).toContain('href="https://github.com/octo/repo/pull/7"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('title="Pull request #7 (merged)"');
  });

  it("falls back to the project repo for the issue link", () => {
    const withProject = makeTask({
      githubIssueNumber: 42,
      project: makeProject("octo/repo"),
    });
    expect(renderToString(<TaskGithubBadges task={withProject} />)).toContain(
      'href="https://github.com/octo/repo/issues/42"',
    );
    const bare = renderToString(
      <TaskGithubBadges task={makeTask({ githubIssueNumber: 42 })} />,
    );
    expect(bare).toContain("#42");
    expect(bare).not.toContain("href=");
  });

  it("renders a PR without status or URL", () => {
    const html = renderToString(
      <TaskGithubBadges task={makeTask({ githubPrNumber: 7 })} />,
    );
    expect(html).toContain("PR #7");
    expect(html).toContain('data-pr-status=""');
    expect(html).toContain('title="Pull request #7"');
    expect(html).not.toContain("href=");
    for (const l of ["Open", "Draft", "Merged", "Closed"]) {
      expect(html).not.toContain(l);
    }
  });

  it.each([
    ["open", "Open"],
    ["draft", "Draft"],
    ["closed", "Closed"],
  ])("shows status %s", (status, label) => {
    const html = renderToString(
      <TaskGithubBadges
        task={makeTask({ githubPrNumber: 3, githubPrStatus: status })}
      />,
    );
    expect(html).toContain(label);
    expect(html).toContain(`data-pr-status="${status}"`);
  });
});

describe("placement", () => {
  it("KanbanCard shows badges only with GitHub data", () => {
    const withData = renderToString(<KanbanCard task={full} />);
    expect(withData).toContain("Add sync");
    expect(withData).toContain('title="GitHub issue #42"');
    expect(withData).toContain("PR #7");
    const plain = renderToString(<KanbanCard task={makeTask()} />);
    expect(plain).toContain("Add sync");
    expect(plain).not.toContain('title="GitHub issue');
    expect(plain).not.toContain("PR #");
  });

  it("KanbanColumn header shows the PR count chip", () => {
    const base = (n: number) => makeTask({ id: `t${n}`, status: "in_review" });
    const two = renderToString(
      <KanbanBoardView
        tasks={[
          { ...base(1), githubPrNumber: 1 },
          { ...base(2), githubPrNumber: 2 },
          base(3),
        ]}
      />,
    );
    expect(two).toContain("2 PRs");
    expect(two).toContain("Tasks with a linked pull request");
    const one = renderToString(
      <KanbanBoardView tasks={[{ ...base(1), githubPrNumber: 1 }, base(2)]} />,
    );
    expect(one).toContain("1 PR");
    expect(one).not.toContain("1 PRs");
    const none = renderToString(<KanbanBoardView tasks={[base(1), base(2)]} />);
    expect(none).not.toContain("Tasks with a linked pull request");
  });

  it("TaskTableRow shows badges only with GitHub data", () => {
    const row = (task: TaskItem) =>
      renderToString(
        <Table>
          <TableBody>
            <TaskTableRow
              task={task}
              onSelectTask={() => {}}
              showAssignee={false}
            />
          </TableBody>
        </Table>,
      );
    const withData = row(full);
    expect(withData).toContain("feat/42-add-sync");
    expect(withData).toContain("PR #7");
    const plain = row(makeTask());
    expect(plain).not.toContain("PR #");
    expect(plain).not.toContain("Branch:");
  });
});

describe("auto sync", () => {
  it("shouldAutoSyncProject", () => {
    const seen = new Set(["proj-1"]);
    expect(shouldAutoSyncProject(null, new Set())).toBe(false);
    expect(shouldAutoSyncProject(undefined, new Set())).toBe(false);
    expect(shouldAutoSyncProject(makeProject(null), new Set())).toBe(false);
    expect(shouldAutoSyncProject(makeProject("  "), new Set())).toBe(false);
    expect(shouldAutoSyncProject(makeProject("octo/repo"), seen)).toBe(false);
    expect(shouldAutoSyncProject(makeProject("octo/repo"), new Set())).toBe(
      true,
    );
  });

  it("exports the hook", () => {
    expect(typeof useProjectGithubAutoSync).toBe("function");
  });
});

describe("badge links and markup (QA)", () => {
  it("links are not draggable and open safely", () => {
    const html = renderToString(<TaskGithubBadges task={full} />);
    expect(html.match(/draggable="false"/g)?.length).toBe(2);
    expect(html.match(/rel="noreferrer"/g)?.length).toBe(2);
    expect(html.match(/target="_blank"/g)?.length).toBe(2);
  });

  it("renders issue, branch, PR in that order", () => {
    const html = renderToString(<TaskGithubBadges task={full} />);
    const i = html.indexOf("GitHub issue #42");
    const b = html.indexOf("Branch: feat/42-add-sync");
    const p = html.indexOf("Pull request #7");
    expect(i).toBeGreaterThan(-1);
    expect(b).toBeGreaterThan(i);
    expect(p).toBeGreaterThan(b);
  });

  it("issue without any URL is plain text with no link attributes", () => {
    const html = renderToString(
      <TaskGithubBadges task={makeTask({ githubIssueNumber: 42 })} />,
    );
    expect(html).not.toContain("target=");
    expect(html).not.toContain("<a ");
  });

  it("renders only the data that exists", () => {
    const html = renderToString(
      <TaskGithubBadges task={makeTask({ githubBranch: "solo" })} />,
    );
    expect(html).toContain('title="Branch: solo"');
    expect(html).not.toContain("GitHub issue");
    expect(html).not.toContain("PR #");
  });

  it("escapes a hostile branch name", () => {
    const html = renderToString(
      <TaskGithubBadges
        task={makeTask({ githubBranch: '"><script>alert(1)</script>' })}
      />,
    );
    expect(html).not.toContain("<script>");
  });

  it("card shows badges between title and the rest, row after title", () => {
    const card = renderToString(<KanbanCard task={full} />);
    expect(card.indexOf("Add sync")).toBeLessThan(
      card.indexOf("GitHub issue #42"),
    );
    const row = renderToString(
      <Table>
        <TableBody>
          <TaskTableRow
            task={full}
            onSelectTask={() => {}}
            showAssignee={false}
          />
        </TableBody>
      </Table>,
    );
    expect(row.indexOf("Add sync")).toBeLessThan(
      row.indexOf("GitHub issue #42"),
    );
  });
});
