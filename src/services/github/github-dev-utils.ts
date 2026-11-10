import { slugify } from "@/lib/utils";

export interface CreateIssueResult {
  number: number;
  url: string;
  branchName: string;
}

export interface CreateBranchResult {
  branchName: string;
  alreadyExisted: boolean;
  checkoutCommand: string;
  issueNumber?: number | null;
  linkedToIssue?: boolean;
}

export interface TaskDevelopmentInfo {
  issueNumber: number | null;
  issueUrl: string | null;
  branch: string | null;
  isBranchOnRemote?: boolean;
  checkoutCommand: string;
  suggestedBranch: string;
  repository: string | null;
  pullRequest: {
    number: number;
    url: string;
    title: string;
    state: "open" | "closed" | "merged" | "draft";
  } | null;
}

export interface SyncTaskToGitHubUpdates {
  title?: string;
  description?: string | null;
  status?: string;
  priority?: string;
  assigneeId?: string | null;
}

export function mapGitHubPrState(pr: {
  merged_at?: string | null;
  draft?: boolean;
  state: string;
}): "merged" | "draft" | "closed" | "open" {
  if (pr.merged_at) return "merged";
  if (pr.draft) return "draft";
  return pr.state === "closed" ? "closed" : "open";
}

/**
 * Strict validator to check if a Pull Request is legitimately linked to an issue.
 * Avoids false positive full-text search matches (e.g. matching any PR with digit "5" or "Merge pull request #1").
 */
export function isPrLinkedToIssue(
  pr: {
    number: number;
    title?: string | null;
    body?: string | null;
    head?: { ref?: string | null } | null;
  },
  issueNumber: number,
  taskBranch?: string | null,
): boolean {
  if (!issueNumber || pr.number === issueNumber) {
    return false;
  }

  // 1. If PR's head ref exactly matches task branch
  if (
    taskBranch &&
    pr.head?.ref &&
    pr.head.ref.trim().toLowerCase() === taskBranch.trim().toLowerCase()
  ) {
    return true;
  }

  // 2. If PR's head ref explicitly contains the issue number:
  if (pr.head?.ref) {
    const branchPattern = new RegExp(
      `(?:^|[/\\-_])(?:#|issue[\\-_]?)?${issueNumber}(?:[/\\-_]|$)`,
      "i",
    );
    if (branchPattern.test(pr.head.ref)) {
      return true;
    }
  }

  // 3. If PR title or body explicitly references this issue:
  const rawText = `${pr.title || ""} ${pr.body || ""}`;
  const sanitizedText = rawText
    .replace(/\bpull\s+request\s+#\d+\b/gi, "")
    .replace(/\bpr\s+#\d+\b/gi, "");

  // Match closing keywords or issue references: closes #5, fixes: #5, etc.
  const keywordPattern = new RegExp(
    `\\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?|refs?|issues?|for)\\s*:?\\s*#${issueNumber}\\b`,
    "i",
  );
  if (keywordPattern.test(sanitizedText)) {
    return true;
  }

  // Match bracketed issue: (#5) or [#5]
  const bracketPattern = new RegExp(`[\\(\\[]#${issueNumber}[\\)\\]]`, "i");
  if (bracketPattern.test(sanitizedText)) {
    return true;
  }

  // General #issueNumber reference
  const issueHashPattern = new RegExp(
    `(?:^|[^a-zA-Z0-9])#${issueNumber}\\b`,
    "i",
  );
  if (issueHashPattern.test(sanitizedText)) {
    return true;
  }

  return false;
}

/**
 * Generates a standard git branch name following Jira conventions.
 * Format: <prefix>/#<number>-<slug> (e.g. feat/#42-add-github-sync)
 */
export function generateBranchName(
  issueNumber: number | null | undefined,
  title: string,
  prefix: "feat" | "fix" | "chore" = "feat",
): string {
  const cleanSlug = slugify(title || "task")
    .slice(0, 35)
    .replace(/-+$/, "");
  if (issueNumber) {
    return `${prefix}/#${issueNumber}-${cleanSlug}`;
  }
  return `${prefix}/${cleanSlug}`;
}
