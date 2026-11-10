import { describe, expect, test } from "bun:test";
import { validateTaskTransitionRule } from "@/services/task/task-rules";

describe("validateTaskTransitionRule (Git Workflow & Permission Enforcement)", () => {
  test("allows re-ordering within the same status column", () => {
    const result = validateTaskTransitionRule({
      task: {
        id: "task-1",
        status: "in_progress",
        assigneeId: "user-2",
      },
      targetStatus: "in_progress",
      currentUser: { id: "user-1" },
      currentTeamRole: "member",
    });

    expect(result.allowed).toBe(true);
  });

  test("blocks team member from moving someone else's task", () => {
    const result = validateTaskTransitionRule({
      task: {
        id: "task-1",
        status: "todo",
        assigneeId: "user-alice",
        creatorId: "user-bob",
      },
      targetStatus: "in_progress",
      currentUser: { id: "user-charlie" },
      currentTeamRole: "member",
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("assignee or project admins");
  });

  test("allows admin or owner to move any task", () => {
    const result = validateTaskTransitionRule({
      task: {
        id: "task-1",
        status: "todo",
        assigneeId: "user-alice",
        creatorId: "user-bob",
      },
      targetStatus: "in_progress",
      currentUser: { id: "user-admin" },
      currentTeamRole: "admin",
    });

    expect(result.allowed).toBe(true);
  });

  test("allows claiming unassigned task into in_progress and auto-assigns currentUser", () => {
    const result = validateTaskTransitionRule({
      task: {
        id: "task-1",
        status: "todo",
        assigneeId: null,
      },
      targetStatus: "in_progress",
      currentUser: { id: "user-bob" },
      currentTeamRole: "member",
    });

    expect(result.allowed).toBe(true);
    expect(result.autoAssignCurrentUserId).toBe("user-bob");
  });

  test("blocks moving to in_review on Git project when no branch or PR exists", () => {
    const result = validateTaskTransitionRule({
      task: {
        id: "task-1",
        status: "in_progress",
        assigneeId: "user-1",
        githubBranch: null,
        githubPrNumber: null,
      },
      targetStatus: "in_review",
      currentUser: { id: "user-1" },
      currentTeamRole: "member",
      isProjectLinkedToGithub: true,
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain(
      "requires a linked Git branch or Pull Request",
    );
  });

  test("allows moving to in_review on Git project when branch exists", () => {
    const result = validateTaskTransitionRule({
      task: {
        id: "task-1",
        status: "in_progress",
        assigneeId: "user-1",
        githubBranch: "feat/#1-user-auth",
        githubPrNumber: null,
      },
      targetStatus: "in_review",
      currentUser: { id: "user-1" },
      currentTeamRole: "member",
      isProjectLinkedToGithub: true,
    });

    expect(result.allowed).toBe(true);
  });

  test("blocks moving to done on Git project when PR is open and not merged", () => {
    const result = validateTaskTransitionRule({
      task: {
        id: "task-1",
        status: "in_review",
        assigneeId: "user-1",
        githubBranch: "feat/#1-user-auth",
        githubPrNumber: 14,
        githubPrStatus: "open",
      },
      targetStatus: "done",
      currentUser: { id: "user-1" },
      currentTeamRole: "member",
      isProjectLinkedToGithub: true,
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Pull Request #14 is currently "open"');
  });

  test("allows moving to done on Git project when PR is merged", () => {
    const result = validateTaskTransitionRule({
      task: {
        id: "task-1",
        status: "in_review",
        assigneeId: "user-1",
        githubBranch: "feat/#1-user-auth",
        githubPrNumber: 14,
        githubPrStatus: "merged",
      },
      targetStatus: "done",
      currentUser: { id: "user-1" },
      currentTeamRole: "member",
      isProjectLinkedToGithub: true,
    });

    expect(result.allowed).toBe(true);
  });
});
