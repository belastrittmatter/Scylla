import { renderToString } from "react-dom/server";
import { describe, expect, it, mock } from "bun:test";
import { TaskGithubDevelopmentCard } from "@/components/tasks/task-github-development-card";
import { createDraftTask } from "@/components/tasks/task-utils";
import type { TaskDevelopmentInfo } from "@/services/github/github-types";

const task = { ...createDraftTask("todo", "t1", "u1", null), id: "t-1" };

const full: TaskDevelopmentInfo = {
  repository: "acme/widgets",
  issueNumber: 12,
  issueUrl: "https://github.com/acme/widgets/issues/12",
  branch: "feat/12-x",
  suggestedBranch: "feat/12-x",
  checkoutCommand: "git fetch origin && git checkout feat/12-x",
  pullRequest: {
    number: 15,
    url: "https://github.com/acme/widgets/pull/15",
    title: "Do it",
    state: "open",
    headRef: "feat/12-x",
  },
};

const render = (
  info: TaskDevelopmentInfo | null | undefined,
  readOnly = false,
) =>
  renderToString(
    <TaskGithubDevelopmentCard
      task={task}
      readOnly={readOnly}
      initialInfo={info}
    />,
  );

describe("TaskGithubDevelopmentCard", () => {
  it("shows issue, checkout command and PR status", () => {
    const html = render(full);
    expect(html).toContain("Development");
    expect(html).toContain("#12");
    expect(html).toContain('href="https://github.com/acme/widgets/issues/12"');
    expect(html).toContain(
      "git fetch origin &amp;&amp; git checkout feat/12-x",
    );
    expect(html).toContain("Copy checkout command");
    expect(html).toContain("PR #15");
    expect(html).toContain("Open");
    expect(html).toContain('data-pr-status="open"');
  });

  it("offers Create branch with the suggested name unless read-only", () => {
    const info = { ...full, branch: null, checkoutCommand: null };
    const html = render(info);
    expect(html).toContain("feat/12-x");
    expect(html).toContain("Create branch");
    expect(html).not.toContain("Copy checkout command");
    expect(render(info, true)).not.toContain("Create branch");
  });

  it("offers Create issue when there is no issue", () => {
    const info = { ...full, issueNumber: null, issueUrl: null };
    expect(render(info)).toContain("No GitHub issue yet");
    expect(render(info)).toContain("Create issue");
    expect(render(info, true)).not.toContain("Create issue");
  });

  it("says when no pull request is linked", () => {
    const html = render({ ...full, pullRequest: null });
    expect(html).toContain("No linked pull request");
    expect(html).not.toContain("data-pr-status");
  });

  it("shows Loading… while the info is not loaded", () => {
    expect(render(undefined)).toContain("Loading…");
  });
});

mock.module("@/components/ui/drawer", () => {
  const Pass = ({ children }: { children?: React.ReactNode }) => (
    <>{children}</>
  );
  return {
    Drawer: Pass,
    DrawerContent: Pass,
    DrawerFooter: Pass,
    DrawerHeader: Pass,
    DrawerTitle: Pass,
    DrawerDescription: Pass,
    DrawerClose: Pass,
    DrawerTrigger: Pass,
  };
});
const { TaskDrawer } = await import("@/components/tasks/task-drawer");

describe("TaskDrawer Development card wiring", () => {
  const drawer = (t: typeof task) =>
    renderToString(
      <TaskDrawer
        task={t}
        isOpen
        users={[]}
        onClose={() => {}}
        onSaveTask={async () => true}
      />,
    );

  it("shows the card for a task with a repository", () => {
    expect(drawer({ ...task, githubRepo: "acme/widgets" })).toContain(
      "Development",
    );
  });

  it("shows the card when only the project has a repository", () => {
    const t = { ...task, githubRepo: null, project: { githubRepo: "a/b" } };
    expect(drawer(t as never)).toContain("Development");
  });

  it("hides the card without a repository or for a blank one", () => {
    expect(drawer({ ...task, githubRepo: null })).not.toContain("Development");
    expect(drawer({ ...task, githubRepo: "  " })).not.toContain("Development");
  });

  it("hides the card for a draft task", () => {
    const html = drawer({ ...task, id: "draft-1", githubRepo: "a/b" });
    expect(html).not.toContain("Development");
  });
});
