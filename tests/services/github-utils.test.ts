import { describe, expect, test } from "bun:test";
import {
  buildCheckoutCommand,
  generateBranchName,
  isPrLinkedToIssue,
  isValidBranchName,
  mapGitHubPrState,
} from "../../src/services/github/github-dev-utils";
import {
  buildManagedLabels,
  isManagedLabel,
  issueStateForStatus,
  mergeIssueLabels,
  priorityFromLabels,
  statusFromIssue,
} from "../../src/services/github/github-labels";

describe("mapGitHubPrState", () => {
  test("merged wins over draft and closed", () => {
    expect(
      mapGitHubPrState({
        merged_at: "2026-01-01",
        draft: true,
        state: "closed",
      }),
    ).toBe("merged");
  });
  test("draft, closed and open", () => {
    expect(mapGitHubPrState({ draft: true, state: "open" })).toBe("draft");
    expect(mapGitHubPrState({ merged_at: null, state: "closed" })).toBe(
      "closed",
    );
    expect(mapGitHubPrState({ draft: false, state: "open" })).toBe("open");
  });
});

describe("generateBranchName", () => {
  test("with issue number", () => {
    expect(generateBranchName(42, "Add GitHub sync!")).toBe(
      "feat/42-add-github-sync",
    );
  });
  test("without issue number, 0 or null", () => {
    expect(generateBranchName(null, "Add sync")).toBe("feat/add-sync");
    expect(generateBranchName(undefined, "Add sync")).toBe("feat/add-sync");
    expect(generateBranchName(0, "Add sync")).toBe("feat/add-sync");
  });
  test("long title is cut to 40 chars without trailing hyphen", () => {
    const name = generateBranchName(
      1,
      "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa bbbbbbbbbb",
    );
    expect(name).toBe("feat/1-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    const slug = generateBranchName(1, "a".repeat(39) + " bcd").slice(
      "feat/1-".length,
    );
    expect(slug).toBe("a".repeat(39));
  });
  test("empty title and other prefixes", () => {
    expect(generateBranchName(null, "")).toBe("feat/task");
    expect(generateBranchName(null, "!!!")).toBe("feat/task");
    expect(generateBranchName(7, "Crash on save", "fix")).toBe(
      "fix/7-crash-on-save",
    );
    expect(generateBranchName(null, "Tidy", "chore")).toBe("chore/tidy");
  });
});

describe("isValidBranchName", () => {
  test("valid", () => {
    expect(isValidBranchName("feat/42-add-sync")).toBe(true);
    expect(isValidBranchName("a.b_c-d")).toBe(true);
  });
  test.each([
    "",
    "feat/x; rm -rf",
    "a..b",
    "a//b",
    "-x",
    "x/",
    "x.",
    "x.lock",
    "has space",
    "feat/#42-x",
    "a".repeat(201),
  ])("invalid %p", (name) => {
    expect(isValidBranchName(name)).toBe(false);
  });
  test("200 chars is valid", () => {
    expect(isValidBranchName("a".repeat(200))).toBe(true);
  });
});

describe("buildCheckoutCommand", () => {
  test("remote vs new", () => {
    expect(buildCheckoutCommand("feat/1-x", true)).toBe(
      "git fetch origin && git checkout feat/1-x",
    );
    expect(buildCheckoutCommand("feat/1-x", false)).toBe(
      "git checkout -b feat/1-x",
    );
  });
});

describe("isPrLinkedToIssue", () => {
  const pr = (o: {
    number?: number;
    title?: string;
    body?: string;
    ref?: string;
  }): Parameters<typeof isPrLinkedToIssue>[0] => ({
    number: o.number ?? 500,
    title: o.title,
    body: o.body,
    head: o.ref === undefined ? undefined : { ref: o.ref },
  });

  test("exact task branch after trimming", () => {
    expect(isPrLinkedToIssue(pr({ ref: " my-branch " }), 42, "my-branch")).toBe(
      true,
    );
    expect(isPrLinkedToIssue(pr({ ref: "other" }), 42, "my-branch")).toBe(
      false,
    );
    expect(isPrLinkedToIssue(pr({ ref: "my-branch" }), 42, "")).toBe(false);
  });
  test.each(["feat/42-login", "issue-42", "fix/issue_42", "42", "x/42"])(
    "branch segment %p matches 42",
    (ref) => {
      expect(isPrLinkedToIssue(pr({ ref }), 42)).toBe(true);
    },
  );
  test.each(["feat/142-login", "feat/420", "v42", "feat/login"])(
    "branch %p does not match 42",
    (ref) => {
      expect(isPrLinkedToIssue(pr({ ref }), 42)).toBe(false);
    },
  );
  test.each(["Fixes #42", "closes: #42", "RESOLVED #42", "text\nfix #42."])(
    "closing keyword %p",
    (body) => {
      expect(isPrLinkedToIssue(pr({ body }), 42)).toBe(true);
      expect(isPrLinkedToIssue(pr({ title: body }), 42)).toBe(true);
    },
  );
  test.each(["Fixes #421", "see #42", "Add login (#42)", "refs #42", "#42"])(
    "not a closing keyword %p",
    (body) => {
      expect(isPrLinkedToIssue(pr({ body, title: body }), 42)).toBe(false);
    },
  );
  test("PR number equal to the issue number, or invalid issue number", () => {
    expect(
      isPrLinkedToIssue(pr({ number: 42, ref: "feat/42-login" }), 42),
    ).toBe(false);
    expect(
      isPrLinkedToIssue(pr({ ref: "feat/0-x", body: "Fixes #0" }), 0),
    ).toBe(false);
  });
});

describe("labels", () => {
  test("isManagedLabel", () => {
    expect(isManagedLabel("priority:high")).toBe(true);
    expect(isManagedLabel("Status:todo")).toBe(true);
    expect(isManagedLabel("bug")).toBe(false);
  });
  test("buildManagedLabels", () => {
    expect(
      buildManagedLabels({ status: "in_progress", priority: "high" }),
    ).toEqual(["priority:high", "status:in-progress"]);
    expect(
      buildManagedLabels({ status: "in_review", priority: "low" }),
    ).toEqual(["priority:low", "status:in-review"]);
    expect(
      buildManagedLabels({ status: "cancelled", priority: "urgent" }),
    ).toEqual(["priority:urgent", "status:cancelled"]);
  });
  test("mergeIssueLabels keeps unmanaged, replaces managed", () => {
    expect(
      mergeIssueLabels(["bug", "priority:low", "status:todo", "ui"], {
        status: "done",
        priority: "urgent",
      }),
    ).toEqual(["bug", "ui", "priority:urgent", "status:done"]);
  });
  test("priorityFromLabels", () => {
    expect(priorityFromLabels(["bug", "Priority:HIGH", "priority:low"])).toBe(
      "high",
    );
    expect(priorityFromLabels(["priority:weird", "bug"])).toBeNull();
    expect(priorityFromLabels([])).toBeNull();
  });
  test("statusFromIssue closed", () => {
    expect(statusFromIssue({ state: "closed", labels: [] })).toBe("done");
    expect(
      statusFromIssue({
        state: "closed",
        state_reason: "not_planned",
        labels: [],
      }),
    ).toBe("cancelled");
    expect(
      statusFromIssue({ state: "closed", labels: ["Status:Cancelled"] }),
    ).toBe("cancelled");
  });
  test("statusFromIssue open with labels", () => {
    expect(
      statusFromIssue({
        state: "open",
        labels: ["status:in-review", "status:todo"],
      }),
    ).toBe("in_review");
    expect(
      statusFromIssue({ state: "open", labels: ["STATUS:IN-PROGRESS"] }),
    ).toBe("in_progress");
    expect(
      statusFromIssue(
        { state: "open", labels: ["status:todo"] },
        "in_progress",
      ),
    ).toBe("todo");
  });
  test("statusFromIssue open without a usable label", () => {
    expect(statusFromIssue({ state: "open", labels: [] }, "in_progress")).toBe(
      "in_progress",
    );
    expect(statusFromIssue({ state: "open", labels: [] }, "in_review")).toBe(
      "in_review",
    );
    expect(
      statusFromIssue({ state: "open", labels: ["status:done"] }, "done"),
    ).toBe("todo");
    expect(
      statusFromIssue(
        { state: "open", labels: ["status:cancelled"] },
        "cancelled",
      ),
    ).toBe("todo");
    expect(statusFromIssue({ state: "open", labels: [] }, null)).toBe("todo");
    expect(statusFromIssue({ state: "open", labels: [] })).toBe("todo");
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
    expect(issueStateForStatus("in_progress")).toEqual({
      state: "open",
      state_reason: "reopened",
    });
  });
});
