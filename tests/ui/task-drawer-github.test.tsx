import { renderToString } from "react-dom/server";
import { describe, expect, it, mock } from "bun:test";
import type * as React from "react";
import type { TaskCommentView } from "@/services/task/workspace-types";
import type { TaskDevelopmentInfo } from "@/services/github/github-dev-service";
import { TaskCommentRow } from "@/components/tasks/task-comment-row";
import { TaskCommentSection } from "@/components/tasks/task-comment-section";
import { TaskGithubDevelopmentCard } from "@/components/tasks/task-github-development-card";
import {
  TaskGithubDevelopmentPanel,
  type TaskGithubDevelopmentPanelProps,
} from "@/components/tasks/task-github-development-panel";
import { createDraftTask } from "@/components/tasks/task-utils";
import type { TaskEditor } from "@/components/tasks/use-task-editor";
import type { Project, TaskItem } from "@/components/tasks/task-types";

const realDrawer = await import("@/components/ui/drawer");
mock.module("@/components/ui/drawer", () => ({
  ...realDrawer,
  DrawerTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
  DrawerDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
  DrawerHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Drawer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DrawerContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DrawerFooter: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
const { TaskDrawer } = await import("@/components/tasks/task-drawer");

const noop = () => {};
const now = new Date("2026-01-01T00:00:00Z");

const project: Project = {
  id: "p1",
  name: "P",
  slug: "p",
  description: null,
  teamId: "team-1",
  status: "active",
  color: "#000",
  githubRepo: "octo/repo",
  createdAt: now,
  updatedAt: now,
} as Project;

const baseInfo: TaskDevelopmentInfo = {
  repository: "octo/repo",
  issueNumber: 42,
  issueUrl: "https://github.com/octo/repo/issues/42",
  branch: null,
  isBranchOnRemote: false,
  suggestedBranch: "feat/42-add-sync",
  checkoutCommand: "git checkout -b feat/42-add-sync",
  pullRequest: null,
};

function panel(over: Partial<TaskGithubDevelopmentPanelProps>): string {
  return renderToString(
    <TaskGithubDevelopmentPanel
      info={baseInfo}
      isLoading={false}
      isCreatingBranch={false}
      copied={false}
      canEdit
      onCreateBranch={noop}
      onCopyCommand={noop}
      onRefresh={noop}
      {...over}
    />,
  );
}

describe("TaskGithubDevelopmentPanel", () => {
  it("shows a loading state without actions", () => {
    const html = panel({ info: null, isLoading: true });
    expect(html).toContain("Development");
    expect(html).toContain("Loading development info…");
    expect(html).not.toContain("Create branch");
  });

  it("shows an unavailable state", () => {
    expect(panel({ info: null })).toContain("Development info unavailable");
  });

  it("shows issue, suggested branch, command and create button", () => {
    const html = panel({});
    expect(html).toContain("octo/repo");
    expect(html).toContain("#42");
    expect(html).toContain('href="https://github.com/octo/repo/issues/42"');
    expect(html).toContain("No branch yet");
    expect(html).toContain("Suggested: feat/42-add-sync");
    expect(html).toMatch(
      /<code[^>]*>git checkout -b feat\/42-add-sync<\/code>/,
    );
    expect(html).toContain('aria-label="Copy git checkout command"');
    expect(html).toContain("Copy");
    expect(html).toContain('aria-label="Refresh development info"');
    expect(html).toContain("Create branch");
    expect(html).toContain("No pull request linked");
  });

  it("shows branch on remote with the merged PR and no create button", () => {
    const html = panel({
      info: {
        ...baseInfo,
        branch: "feat/42-add-sync",
        isBranchOnRemote: true,
        checkoutCommand: "git fetch origin && git checkout feat/42-add-sync",
        pullRequest: {
          number: 7,
          url: "https://github.com/octo/repo/pull/7",
          title: "t",
          state: "merged",
        },
      },
    });
    expect(html).toContain("feat/42-add-sync");
    expect(html).toContain(
      "git fetch origin &amp;&amp; git checkout feat/42-add-sync",
    );
    expect(html).toContain("PR #7");
    expect(html).toContain('href="https://github.com/octo/repo/pull/7"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noreferrer"');
    expect(html).toContain("Merged");
    expect(html).not.toContain("Create branch");
  });

  it("hides create for non-editors but keeps copy", () => {
    const html = panel({ canEdit: false });
    expect(html).not.toContain("Create branch");
    expect(html).toContain('aria-label="Copy git checkout command"');
  });

  it("shows creating state on a disabled button", () => {
    const html = panel({ isCreatingBranch: true });
    expect(html).toMatch(/<button[^>]*disabled[^>]*>[^<]*Creating…/);
  });

  it("shows Copied when copied", () => {
    expect(panel({ copied: true })).toContain("Copied");
  });

  it("shows No issue yet", () => {
    expect(
      panel({ info: { ...baseInfo, issueNumber: null, issueUrl: null } }),
    ).toContain("No issue yet");
  });
});

const draft = createDraftTask("todo", "team-1", "user-1", project);
const task: TaskItem = { ...draft, id: "task-1", title: "T" };

const DISABLED = /\sdisabled(="")?[\s>]/;
function buttonTag(html: string, label: string): string {
  const m = html.match(new RegExp(`<button[^>]*aria-label="${label}"[^>]*>`));
  return m ? m[0] : "";
}
function buttonTagWithText(html: string, text: string): string {
  const m = html.match(new RegExp(`<button[^>]*>[^<]*${text}`));
  return m ? m[0] : "";
}

describe("TaskGithubDevelopmentPanel extra", () => {
  it("disables refresh while loading and enables it otherwise", () => {
    expect(
      buttonTag(panel({ isLoading: true }), "Refresh development info"),
    ).toMatch(DISABLED);
    expect(buttonTag(panel({}), "Refresh development info")).not.toMatch(
      DISABLED,
    );
  });

  it("disables the create button only while creating", () => {
    const creating = panel({ isCreatingBranch: true });
    expect(buttonTagWithText(creating, "Creating…")).toMatch(DISABLED);
    expect(buttonTagWithText(panel({}), "Create branch")).not.toMatch(DISABLED);
  });

  it.each([
    ["open", "Open"],
    ["draft", "Draft"],
    ["closed", "Closed"],
  ] as const)("labels a %s pull request", (state, label) => {
    const html = panel({
      info: {
        ...baseInfo,
        pullRequest: { number: 9, url: "https://x/pull/9", title: "t", state },
      },
    });
    expect(html).toContain("PR #9");
    expect(html).toContain(label);
    expect(html).not.toContain("No pull request linked");
  });

  it("shows no Copied text when not copied", () => {
    expect(panel({})).not.toContain("Copied");
  });
});

describe("TaskGithubDevelopmentCard", () => {
  it("renders the Development heading initially", () => {
    const html = renderToString(
      <TaskGithubDevelopmentCard task={task} canEdit />,
    );
    expect(html).toContain("Development");
  });
});

function comment(over: Partial<TaskCommentView>): TaskCommentView {
  return {
    id: "c1",
    taskId: "task-1",
    userId: "u1",
    content: "hello",
    githubCommentId: null,
    createdAt: now,
    updatedAt: now,
    user: {
      id: "u1",
      name: "Alice",
      email: "a@x.io",
      role: "member",
    },
    source: "local",
    htmlUrl: null,
    ...over,
  };
}

describe("TaskCommentRow", () => {
  it("renders a GitHub comment with markdown and a badge link", () => {
    const html = renderToString(
      <TaskCommentRow
        comment={comment({
          source: "github",
          content: "**done**",
          htmlUrl: "https://github.com/octo/repo/issues/42#issuecomment-1",
          user: { id: "g", name: "octocat", email: "", role: "member" },
        })}
      />,
    );
    expect(html).toContain("octocat");
    expect(html).toContain("<strong>done</strong>");
    expect(html).toContain("GitHub");
    expect(html).toContain(
      'href="https://github.com/octo/repo/issues/42#issuecomment-1"',
    );
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noreferrer"');
  });

  it("marks synced local comments", () => {
    const html = renderToString(
      <TaskCommentRow comment={comment({ githubCommentId: "991" })} />,
    );
    expect(html).toContain("Synced to GitHub");
  });

  it("shows no GitHub marker for unsynced local comments", () => {
    const html = renderToString(<TaskCommentRow comment={comment({})} />);
    expect(html).not.toContain("Synced to GitHub");
    expect(html).not.toContain("GitHub");
  });

  it("shows a GitHub badge without a link when htmlUrl is missing", () => {
    const html = renderToString(
      <TaskCommentRow comment={comment({ source: "github", htmlUrl: null })} />,
    );
    expect(html).toContain("GitHub");
    expect(html).not.toContain("<a ");
    expect(html).not.toContain("Synced to GitHub");
  });

  it("does not render raw HTML from comment content", () => {
    const html = renderToString(
      <TaskCommentRow
        comment={comment({ content: "<script>alert(1)</script>" })}
      />,
    );
    expect(html).not.toContain("<script>alert(1)");
  });

  it("falls back to Team Member", () => {
    const html = renderToString(
      <TaskCommentRow comment={comment({ user: null })} />,
    );
    expect(html).toContain("Team Member");
  });
});

describe("TaskCommentSection", () => {
  it("renders the heading and input", () => {
    const html = renderToString(<TaskCommentSection taskId="task-1" />);
    expect(html).toContain("Activity &amp; Discussion");
    expect(html).toContain("<textarea");
  });

  it("has no textarea when read only", () => {
    const html = renderToString(<TaskCommentSection taskId="t" readOnly />);
    expect(html).not.toContain("<textarea");
  });
});

describe("types", () => {
  it("TaskDrawer accepts onTaskPatched and TaskEditor has patchTask", () => {
    type Patched = Parameters<
      NonNullable<React.ComponentProps<typeof TaskDrawer>["onTaskPatched"]>
    >;
    const args: Patched = ["id", { githubBranch: "x" }];
    const check = (e: TaskEditor) => e.patchTask("id", { githubBranch: "x" });
    expect(args[0]).toBe("id");
    expect(typeof check).toBe("function");
  });
});

describe("TaskDrawer Development card wiring", () => {
  const render = (t: TaskItem, readOnly?: boolean) =>
    renderToString(
      <TaskDrawer
        task={t}
        isOpen
        users={[]}
        onClose={noop}
        onSaveTask={async () => true}
        readOnly={readOnly}
      />,
    );

  it("shows the Development card for a saved task of a linked project", () => {
    const html = render({ ...task, project });
    expect(html).toContain("Development");
    expect(html).toContain("Activity &amp; Discussion");
  });

  it("hides the card for an unlinked project", () => {
    const html = render({ ...task, project: { ...project, githubRepo: null } });
    expect(html).not.toContain("Refresh development info");
    expect(html).toContain("Activity &amp; Discussion");
  });

  it("hides the card for a task without a project", () => {
    expect(render({ ...task, project: undefined })).not.toContain(
      "Refresh development info",
    );
  });

  it("hides the card for drafts", () => {
    const html = render({ ...draft, project });
    expect(html).not.toContain("Refresh development info");
    expect(html).not.toContain("Activity &amp; Discussion");
  });

  it("places the card between the form and the comments", () => {
    const html = render({ ...task, project });
    expect(html.indexOf("Refresh development info")).toBeLessThan(
      html.indexOf("Activity &amp; Discussion"),
    );
  });
});
