export interface GithubRepoValidationResult {
  valid: boolean;
  error?: string;
  cleanName: string;
}

export const GITHUB_REPO_FORMAT_ERROR =
  "Repository must be in the form owner/repo";

/** Validate a repository name (no owner) against GitHub's naming rules. */
export function validateGithubRepoName(
  name: string,
): GithubRepoValidationResult {
  const trimmed = name.trim();
  const cleanName = trimmed
    .replace(/\s+/g, "-")
    .replace(/[^A-Za-z0-9_.-]/g, "")
    .replace(/\.{2,}/g, ".")
    .replace(/^[.-]+|[.-]+$/g, "");
  const fail = (error: string): GithubRepoValidationResult => ({
    valid: false,
    error,
    cleanName,
  });

  if (!trimmed) return fail("Repository name cannot be empty");
  if (trimmed.length > 100) {
    return fail("Repository name cannot exceed 100 characters");
  }
  if (/\s/.test(trimmed)) {
    return fail(
      "Repository name cannot contain spaces (use hyphens '-' instead)",
    );
  }
  if (/^[.-]/.test(trimmed)) {
    return fail("Repository name cannot start with a dot (.) or hyphen (-)");
  }
  if (/[.-]$/.test(trimmed)) {
    return fail("Repository name cannot end with a dot (.) or hyphen (-)");
  }
  if (trimmed.includes("..")) {
    return fail("Repository name cannot contain consecutive dots (..)");
  }
  if (trimmed.toLowerCase() === ".git") {
    return fail("Repository name cannot be .git");
  }
  if (!/^[A-Za-z0-9_.-]+$/.test(trimmed)) {
    return fail(
      "Repository name can only contain letters, numbers, hyphens (-), underscores (_), or dots (.)",
    );
  }
  return { valid: true, cleanName: trimmed };
}

const OWNER_PATTERN = /^(?!-)[A-Za-z0-9-]{1,39}(?<!-)$/;
const URL_PREFIX = /^https:\/\/github\.com\//;

/** Parse "owner/repo" or a github.com URL into its parts, or null. */
export function parseGithubRepoFullName(
  value: string | null | undefined,
): { owner: string; repo: string } | null {
  if (typeof value !== "string") return null;
  let path = value.trim().replace(URL_PREFIX, "");
  path = path.replace(/\/$/, "").replace(/\.git$/, "");
  const parts = path.split("/");
  if (parts.length !== 2) return null;
  const [owner, repo] = parts;
  if (!OWNER_PATTERN.test(owner)) return null;
  if (!validateGithubRepoName(repo).valid) return null;
  return { owner, repo };
}

/** True only for the canonical "owner/repo" form. */
export function isValidGithubRepoFullName(value: string): boolean {
  const parsed = parseGithubRepoFullName(value);
  return !!parsed && value.trim() === `${parsed.owner}/${parsed.repo}`;
}
