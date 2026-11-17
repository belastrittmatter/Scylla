import { renderToString } from "react-dom/server";
import { describe, expect, it } from "bun:test";
import { TaskCommentItemRow } from "@/components/tasks/task-comment-item-row";
import type { TaskCommentItem } from "@/components/tasks/task-types";

function makeComment(
  overrides: Partial<TaskCommentItem> = {},
): TaskCommentItem {
  return {
    id: "c1",
    taskId: "t1",
    userId: "u1",
    content: "hello there",
    createdAt: new Date(),
    githubCommentId: null,
    user: { id: "u1", name: "Ada", initials: "A", avatarUrl: "" },
    ...overrides,
  } as TaskCommentItem;
}

const render = (c: TaskCommentItem) =>
  renderToString(<TaskCommentItemRow comment={c} />);

describe("TaskCommentItemRow", () => {
  it("marks GitHub comments and links to them", () => {
    const html = render(
      makeComment({
        source: "github",
        htmlUrl: "https://github.com/a/b/issues/1#issuecomment-9",
      }),
    );
    expect(html).toContain("GitHub");
    expect(html).toContain("View on GitHub");
    expect(html).toContain(
      'href="https://github.com/a/b/issues/1#issuecomment-9"',
    );
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).not.toContain("Synced to GitHub");
  });

  it("marks local comments that were synced to GitHub", () => {
    const html = render(
      makeComment({ source: "local", githubCommentId: "55" }),
    );
    expect(html).toContain("Synced to GitHub");
    expect(html).not.toContain("View on GitHub");
  });

  it("shows neither marker for a plain local comment", () => {
    const html = render(makeComment());
    expect(html).not.toContain("Synced to GitHub");
    expect(html).not.toContain("View on GitHub");
    expect(html).toContain("Ada");
  });

  it("falls back to Team Member and renders markdown", () => {
    const html = render(makeComment({ user: null, content: "**bold**" }));
    expect(html).toContain("Team Member");
    expect(html).toContain("<strong>bold</strong>");
  });
});
