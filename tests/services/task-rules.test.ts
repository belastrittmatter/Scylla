import { describe, expect, it } from "bun:test";
import {
  assigneeGithubRequiredMessage,
  checkAssigneeGithubRule,
} from "@/services/task/task-rules";

describe("checkAssigneeGithubRule", () => {
  it("allows when the project has no GitHub repo", () => {
    expect(
      checkAssigneeGithubRule({
        projectGithubRepo: null,
        assigneeId: "u1",
        assigneeHasGithub: false,
      }),
    ).toEqual({ allowed: true });
    expect(
      checkAssigneeGithubRule({
        projectGithubRepo: undefined,
        assigneeId: "u1",
        assigneeHasGithub: false,
      }),
    ).toEqual({ allowed: true });
  });

  it("allows when the repo is blank", () => {
    expect(
      checkAssigneeGithubRule({
        projectGithubRepo: "   ",
        assigneeId: "u1",
        assigneeHasGithub: false,
      }),
    ).toEqual({ allowed: true });
  });

  it("allows when there is no assignee", () => {
    expect(
      checkAssigneeGithubRule({
        projectGithubRepo: "acme/widgets",
        assigneeId: null,
        assigneeHasGithub: false,
      }),
    ).toEqual({ allowed: true });
  });

  it("allows an assignee with GitHub", () => {
    expect(
      checkAssigneeGithubRule({
        projectGithubRepo: "acme/widgets",
        assigneeId: "u1",
        assigneeHasGithub: true,
      }),
    ).toEqual({ allowed: true });
  });

  it("rejects an assignee without GitHub with the member name", () => {
    expect(
      checkAssigneeGithubRule({
        projectGithubRepo: "acme/widgets",
        assigneeId: "u1",
        assigneeHasGithub: false,
        assigneeName: "Bea",
      }),
    ).toEqual({
      allowed: false,
      reason:
        "Cannot assign task: Bea has not connected a GitHub account. Members must connect GitHub in Account Settings before they can be assigned tasks in a project linked to GitHub.",
    });
  });

  it("falls back to 'This member' when no name is given", () => {
    const result = checkAssigneeGithubRule({
      projectGithubRepo: "acme/widgets",
      assigneeId: "u1",
      assigneeHasGithub: false,
    });
    expect(result).toEqual({
      allowed: false,
      reason:
        "Cannot assign task: This member has not connected a GitHub account. Members must connect GitHub in Account Settings before they can be assigned tasks in a project linked to GitHub.",
    });
    expect(assigneeGithubRequiredMessage()).toBe(
      result.allowed ? "" : result.reason,
    );
  });
});
