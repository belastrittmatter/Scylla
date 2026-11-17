import { describe, expect, test } from "bun:test";
import {
  buildCheckoutCommand,
  generateBranchName,
  isValidBranchName,
} from "@/services/github/github-dev-utils";
import {
  issueStateForStatus,
  labelNames,
  mergeTaskLabels,
  priorityFromLabels,
  statusFromIssue,
} from "@/services/github/github-labels";
import {
  mapPullState,
  pickLinkedPullRequest,
  timelinePullNumbers,
} from "@/services/github/github-pr-linking";
import type { GithubPullSummary } from "@/services/github/github-types";

const pr = (
  number: number,
  state: GithubPullSummary["state"],
  headRef: string | null = null,
): GithubPullSummary => ({
  number,
  url: `https://github.com/acme/widgets/pull/${number}`,
  title: `PR ${number}`,
  state,
  headRef,
});

describe("dev utils", () => {
  test("generateBranchName", () => {
    expect(generateBranchName(12, "Add GitHub sync!")).toBe(
      "feat/12-add-github-sync",
    );
    expect(generateBranchName(null, "Add GitHub sync!", "fix")).toBe(
      "fix/add-github-sync",
    );
    expect(generateBranchName(3, "!!!")).toBe("feat/3-task");
    expect(generateBranchName(undefined, "")).toBe("feat/task");
    const long = generateBranchName(1, `${"a".repeat(39)} bbbbbb`);
    expect(long).toBe(`feat/1-${"a".repeat(39)}`);
    expect(generateBranchName(1, "x".repeat(60), "chore")).toBe(
      `chore/1-${"x".repeat(40)}`,
    );
  });

  test("buildCheckoutCommand", () => {
    expect(buildCheckoutCommand("feat/1-x")).toBe(
      "git fetch origin && git checkout feat/1-x",
    );
  });

  test("isValidBranchName accepts and rejects", () => {
    for (const ok of ["feat/1-x", "a", "v1.2/x_y-z", "a".repeat(200)]) {
      expect(isValidBranchName(ok)).toBe(true);
    }
    const bad = [
      "",
      "a".repeat(201),
      "/a",
      "-a",
      ".a",
      "a/",
      "a.",
      "a.lock",
      "a..b",
      "a//b",
      "a@{b",
      "a b",
      "a~b",
      "é",
    ];
    for (const name of bad) expect(isValidBranchName(name)).toBe(false);
  });
});

describe("labels", () => {
  test("labelNames trims names", () => {
    expect(labelNames([" a ", { name: " b " }, { name: null }])).toEqual([
      "a",
      "b",
    ]);
    expect(labelNames(null)).toEqual([]);
  });

  test("statusFromIssue", () => {
    expect(statusFromIssue({ state: "closed", labels: [] })).toBe("done");
    expect(
      statusFromIssue({ state: "closed", state_reason: "not_planned" }),
    ).toBe("cancelled");
    expect(
      statusFromIssue({ state: "closed", labels: ["Status: Cancelled"] }),
    ).toBe("cancelled");
    expect(
      statusFromIssue({
        state: "open",
        labels: [{ name: "status: in review" }],
      }),
    ).toBe("in_review");
    expect(
      statusFromIssue({
        state: "open",
        labels: ["status: in progress", "status: todo"],
      }),
    ).toBe("in_progress");
    expect(statusFromIssue({ state: "open", labels: ["STATUS: TODO"] })).toBe(
      "todo",
    );
    expect(statusFromIssue({ state: "open", labels: ["bug"] })).toBeNull();
    expect(statusFromIssue({ state: "open" })).toBeNull();
    expect(
      statusFromIssue({ state: "open", labels: ["status: done"] }),
    ).toBeNull();
    expect(
      statusFromIssue({ state: "open", labels: ["status: cancelled"] }),
    ).toBeNull();
  });

  test("priorityFromLabels", () => {
    expect(priorityFromLabels(["x", "Priority: High"])).toBe("high");
    expect(priorityFromLabels(["priority: low", "priority: urgent"])).toBe(
      "low",
    );
    expect(priorityFromLabels(["x"])).toBeNull();
    expect(priorityFromLabels(undefined)).toBeNull();
  });

  test("mergeTaskLabels", () => {
    const current = ["bug", "status: todo", "priority: low", "docs"];
    expect(mergeTaskLabels(current, "done", "urgent")).toEqual([
      "bug",
      "docs",
      "status: done",
      "priority: urgent",
    ]);
    expect(mergeTaskLabels(current, "in_review")).toEqual([
      "bug",
      "priority: low",
      "docs",
      "status: in review",
    ]);
    expect(mergeTaskLabels(current, undefined, "high")).toEqual([
      "bug",
      "status: todo",
      "docs",
      "priority: high",
    ]);
    expect(mergeTaskLabels(["Status: Todo", "b"], "done")).toEqual([
      "b",
      "status: done",
    ]);
    expect(mergeTaskLabels(current)).toEqual(current);
  });

  test("issueStateForStatus", () => {
    expect(issueStateForStatus("done")).toEqual({
      state: "closed",
      state_reason: "completed",
    });
    expect(issueStateForStatus("cancelled")).toEqual({
      state: "closed",
      state_reason: "not_planned",
    });
    for (const s of ["todo", "in_progress", "in_review"] as const) {
      expect(issueStateForStatus(s)).toEqual({
        state: "open",
        state_reason: null,
      });
    }
  });
});

describe("pr linking", () => {
  test("mapPullState", () => {
    expect(
      mapPullState({ state: "closed", draft: true, merged_at: "2024-01-01" }),
    ).toBe("merged");
    expect(mapPullState({ state: "open", draft: true })).toBe("draft");
    expect(mapPullState({ state: "closed", draft: false })).toBe("closed");
    expect(mapPullState({ state: "open", merged_at: null })).toBe("open");
  });

  test("timelinePullNumbers", () => {
    const ev = (number: unknown, repo?: unknown, isPr = true) => ({
      event: "cross-referenced",
      source: {
        issue: {
          number,
          ...(isPr ? { pull_request: {} } : {}),
          ...(repo === undefined ? {} : { repository: { full_name: repo } }),
        },
      },
    });
    expect(timelinePullNumbers("nope", "acme/widgets")).toEqual([]);
    expect(
      timelinePullNumbers(
        [
          ev(7),
          ev(5, "Acme/Widgets"),
          ev(7),
          ev(9, "other/repo"),
          ev(10, undefined, false),
          ev("11"),
          {
            event: "labeled",
            source: { issue: { number: 12, pull_request: {} } },
          },
          null,
        ],
        "acme/widgets",
      ),
    ).toEqual([7, 5]);
  });

  test("pickLinkedPullRequest", () => {
    const ctx = { issueNumber: 5, branch: "feat/5-x", timelinePullNumbers: [] };
    expect(pickLinkedPullRequest([pr(8, "open")], ctx)).toBeNull();
    // mention-only PRs never link; even with matching number text
    expect(
      pickLinkedPullRequest([pr(5, "open"), pr(6, "merged")], {
        ...ctx,
        branch: null,
        timelinePullNumbers: [5],
      }),
    ).toBeNull();
    expect(
      pickLinkedPullRequest([pr(8, "open", " Feat/5-X ")], ctx)?.number,
    ).toBe(8);
    // branch matches win over timeline matches
    expect(
      pickLinkedPullRequest([pr(8, "closed", "feat/5-x"), pr(9, "open")], {
        ...ctx,
        timelinePullNumbers: [9],
      })?.number,
    ).toBe(8);
    // state ordering then highest number
    const timeline = {
      ...ctx,
      branch: null,
      timelinePullNumbers: [1, 2, 3, 4, 6],
    };
    expect(
      pickLinkedPullRequest(
        [pr(1, "closed"), pr(2, "merged"), pr(3, "draft"), pr(4, "open")],
        timeline,
      )?.number,
    ).toBe(4);
    expect(
      pickLinkedPullRequest(
        [pr(1, "closed"), pr(2, "merged"), pr(3, "draft")],
        timeline,
      )?.number,
    ).toBe(3);
    expect(
      pickLinkedPullRequest([pr(1, "merged"), pr(2, "closed")], timeline)
        ?.number,
    ).toBe(1);
    expect(
      pickLinkedPullRequest([pr(4, "open"), pr(6, "open")], timeline)?.number,
    ).toBe(6);
    // no issue number: timeline cannot match
    expect(
      pickLinkedPullRequest([pr(4, "open")], {
        ...timeline,
        issueNumber: null,
      }),
    ).toBeNull();
    // branch null never matches headRef null
    expect(
      pickLinkedPullRequest([pr(4, "open", null)], {
        issueNumber: null,
        branch: null,
        timelinePullNumbers: [],
      }),
    ).toBeNull();
  });
});
