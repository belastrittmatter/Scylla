import { slugify } from "@/lib/utils";

export type GithubPrState = "open" | "draft" | "merged" | "closed";

export interface GithubPullRequestRef {
  number: number;
  title?: string | null;
  body?: string | null;
  head?: { ref?: string | null } | null;
}

export function mapGitHubPrState(pr: {
  merged_at?: string | null;
  draft?: boolean | null;
  state: string;
}): GithubPrState {
  if (pr.merged_at) return "merged";
  if (pr.draft) return "draft";
  if (pr.state === "closed") return "closed";
  return "open";
}

export function generateBranchName(
  issueNumber: number | null | undefined,
  title: string,
  prefix: "feat" | "fix" | "chore" = "feat",
): string {
  const slug = slugify(title).slice(0, 40).replace(/-+$/, "") || "task";
  if (typeof issueNumber === "number" && issueNumber > 0) {
    return `${prefix}/${issueNumber}-${slug}`;
  }
  return `${prefix}/${slug}`;
}

export function isValidBranchName(name: string): boolean {
  return (
    name.length >= 1 &&
    name.length <= 200 &&
    /^[A-Za-z0-9._/-]+$/.test(name) &&
    /^[A-Za-z0-9]/.test(name) &&
    !name.includes("..") &&
    !name.includes("//") &&
    !/(\/|\.|\.lock)$/.test(name)
  );
}

export function buildCheckoutCommand(
  branch: string,
  existsOnRemote: boolean,
): string {
  return existsOnRemote
    ? `git fetch origin && git checkout ${branch}`
    : `git checkout -b ${branch}`;
}

/** Strict link between a pull request and an issue: branch, name or closing keyword. */
export function isPrLinkedToIssue(
  pr: GithubPullRequestRef,
  issueNumber: number,
  taskBranch?: string | null,
): boolean {
  if (!Number.isInteger(issueNumber) || issueNumber <= 0) return false;
  if (pr.number === issueNumber) return false;

  const ref = pr.head?.ref?.trim() ?? "";
  const branch = taskBranch?.trim() ?? "";
  if (branch && ref === branch) return true;

  const segment = new RegExp(
    `(^|[/_-])(issue[-_]?)?${issueNumber}($|[/_-])`,
    "i",
  );
  if (ref && segment.test(ref)) return true;

  const closing = new RegExp(
    `\\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?):?\\s+#${issueNumber}(?!\\d)`,
    "i",
  );
  return closing.test(pr.title ?? "") || closing.test(pr.body ?? "");
}
