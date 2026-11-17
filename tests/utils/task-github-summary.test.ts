import { describe, expect, it } from "bun:test";
import {
  formatColumnGithubSummary,
  githubIssueHref,
  prStatusLabel,
  summarizeColumnGithub,
} from "@/components/tasks/task-github-summary";

describe("prStatusLabel", () => {
  it("labels every PR state", () => {
    expect(prStatusLabel("open")).toBe("Open");
    expect(prStatusLabel("draft")).toBe("Draft");
    expect(prStatusLabel("merged")).toBe("Merged");
    expect(prStatusLabel("closed")).toBe("Closed");
  });
  it("falls back to Open for unknown values", () => {
    expect(prStatusLabel(null)).toBe("Open");
    expect(prStatusLabel(undefined)).toBe("Open");
    expect(prStatusLabel("weird")).toBe("Open");
  });
});

describe("summarizeColumnGithub", () => {
  it("counts tasks with issues and with PRs", () => {
    expect(
      summarizeColumnGithub([
        { githubIssueNumber: 1, githubPrNumber: null },
        { githubIssueNumber: 2, githubPrNumber: 5 },
        { githubIssueNumber: null, githubPrNumber: null },
      ]),
    ).toEqual({ issues: 2, pullRequests: 1 });
  });
  it("is zero for an empty column", () => {
    expect(summarizeColumnGithub([])).toEqual({ issues: 0, pullRequests: 0 });
  });
});

describe("formatColumnGithubSummary", () => {
  it("is null when nothing is linked", () => {
    expect(
      formatColumnGithubSummary({ issues: 0, pullRequests: 0 }),
    ).toBeNull();
  });
  it("pluralizes each part", () => {
    expect(formatColumnGithubSummary({ issues: 1, pullRequests: 0 })).toBe(
      "1 issue",
    );
    expect(formatColumnGithubSummary({ issues: 2, pullRequests: 0 })).toBe(
      "2 issues",
    );
    expect(formatColumnGithubSummary({ issues: 0, pullRequests: 1 })).toBe(
      "1 PR",
    );
    expect(formatColumnGithubSummary({ issues: 3, pullRequests: 2 })).toBe(
      "3 issues · 2 PRs",
    );
  });
});

describe("githubIssueHref", () => {
  it("prefers the stored URL", () => {
    expect(
      githubIssueHref({
        githubIssueNumber: 4,
        githubIssueUrl: "https://example.com/i/4",
        githubRepo: "a/b",
      }),
    ).toBe("https://example.com/i/4");
  });
  it("falls back to the task repo, then the project repo", () => {
    expect(
      githubIssueHref({
        githubIssueNumber: 4,
        githubIssueUrl: null,
        githubRepo: "a/b",
        project: { githubRepo: "c/d" },
      }),
    ).toBe("https://github.com/a/b/issues/4");
    expect(
      githubIssueHref({
        githubIssueNumber: 4,
        githubIssueUrl: null,
        githubRepo: null,
        project: { githubRepo: "c/d" },
      }),
    ).toBe("https://github.com/c/d/issues/4");
  });
  it("is null when unknown", () => {
    expect(
      githubIssueHref({
        githubIssueNumber: 4,
        githubIssueUrl: null,
        githubRepo: null,
      }),
    ).toBeNull();
    expect(
      githubIssueHref({
        githubIssueNumber: null,
        githubIssueUrl: null,
        githubRepo: "a/b",
      }),
    ).toBeNull();
  });
});
