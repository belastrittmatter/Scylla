/**
 * GitHub repository name validation according to GitHub naming conventions:
 * - 1 to 100 characters
 * - Only ASCII alphanumeric characters, hyphens (-), underscores (_), and periods (.)
 * - Cannot start or end with a hyphen or period
 * - Cannot contain spaces or consecutive periods
 * - Cannot be named ".git"
 */

export interface GithubRepoValidationResult {
  valid: boolean;
  error?: string;
  cleanName: string;
}

export function validateGithubRepoName(
  name: string,
): GithubRepoValidationResult {
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

  if (/\.\./.test(trimmed)) {
    return {
      valid: false,
      error: "Repository name cannot contain consecutive dots (..)",
      cleanName: trimmed.replace(/\.+/g, "."),
    };
  }

  if (trimmed.toLowerCase() === ".git") {
    return {
      valid: false,
      error: "Repository name cannot be .git",
      cleanName: "",
    };
  }

  // GitHub allowed characters: letters, numbers, hyphens, underscores, dots
  if (!/^[a-zA-Z0-9_.-]+$/.test(trimmed)) {
    return {
      valid: false,
      error:
        "Repository name can only contain letters, numbers, hyphens (-), underscores (_), or dots (.)",
      cleanName: trimmed.replace(/[^a-zA-Z0-9_.-]/g, "-"),
    };
  }

  return {
    valid: true,
    cleanName: trimmed,
  };
}
