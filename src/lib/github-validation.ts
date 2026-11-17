export const GITHUB_REPO_FORMAT_ERROR =
  'Repository must be in "owner/repo" format';

export interface ParsedGithubRepo {
  owner: string;
  repo: string;
  fullName: string;
}

export interface GithubRepoNameValidation {
  valid: boolean;
  error?: string;
  cleanName: string;
}

/** Validates a repository name (without the owner) by GitHub's naming rules. */
export function validateGithubRepoName(name: string): GithubRepoNameValidation {
  const trimmed = (name || "").trim();
  if (!trimmed) {
    return {
      valid: false,
      error: "Repository name cannot be empty",
      cleanName: "",
    };
  }
  if (trimmed.length > 100) {
    return {
      valid: false,
      error: "Repository name cannot exceed 100 characters",
      cleanName: trimmed.slice(0, 100),
    };
  }
  if (/\s/.test(trimmed)) {
    return {
      valid: false,
      error: "Repository name cannot contain spaces (use hyphens '-' instead)",
      cleanName: trimmed.replace(/\s+/g, "-"),
    };
  }
  if (/^[.-]/.test(trimmed)) {
    return {
      valid: false,
      error: "Repository name cannot start with a dot (.) or hyphen (-)",
      cleanName: trimmed.replace(/^[.-]+/, ""),
    };
  }
  if (/[.-]$/.test(trimmed)) {
    return {
      valid: false,
      error: "Repository name cannot end with a dot (.) or hyphen (-)",
      cleanName: trimmed.replace(/[.-]+$/, ""),
    };
  }
  if (trimmed.includes("..")) {
    return {
      valid: false,
      error: "Repository name cannot contain consecutive dots (..)",
      cleanName: trimmed.replace(/\.+/g, "."),
    };
  }
  if (!/^[A-Za-z0-9_.-]+$/.test(trimmed)) {
    return {
      valid: false,
      error:
        "Repository name can only contain letters, numbers, hyphens (-), underscores (_), or dots (.)",
      cleanName: trimmed,
    };
  }
  return { valid: true, cleanName: trimmed };
}

const OWNER_PATTERN = /^(?!-)[A-Za-z0-9-]{1,39}(?<!-)$/;

/** Parses exactly "owner/repo"; returns null for any other shape. */
export function parseGithubRepo(
  value: string | null | undefined,
): ParsedGithubRepo | null {
  if (typeof value !== "string") return null;
  const parts = value.trim().split("/");
  if (parts.length !== 2) return null;
  const [owner, repo] = parts;
  if (!OWNER_PATTERN.test(owner)) return null;
  // validateGithubRepoName trims, so reject whitespace in the raw segment here.
  if (/\s/.test(repo) || !validateGithubRepoName(repo).valid) return null;
  return { owner, repo, fullName: `${owner}/${repo}` };
}

export function isValidGithubRepo(value: string | null | undefined): boolean {
  return parseGithubRepo(value) !== null;
}
