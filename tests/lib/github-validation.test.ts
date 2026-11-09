import { describe, expect, test } from "bun:test";
import { validateGithubRepoName } from "@/lib/github-validation";

describe("validateGithubRepoName", () => {
  test("accepts valid alphanumeric repository names", () => {
    expect(validateGithubRepoName("my-awesome-repo").valid).toBe(true);
    expect(validateGithubRepoName("scylla_backend.v2").valid).toBe(true);
    expect(validateGithubRepoName("project123").valid).toBe(true);
  });

  test("rejects empty or whitespace-only names", () => {
    expect(validateGithubRepoName("").valid).toBe(false);
    expect(validateGithubRepoName("   ").valid).toBe(false);
  });

  test("rejects names with spaces", () => {
    const res = validateGithubRepoName("my project name");
    expect(res.valid).toBe(false);
    expect(res.error).toContain("spaces");
  });

  test("rejects names starting or ending with hyphen or dot", () => {
    expect(validateGithubRepoName("-invalid-start").valid).toBe(false);
    expect(validateGithubRepoName(".invalid-start").valid).toBe(false);
    expect(validateGithubRepoName("invalid-end-").valid).toBe(false);
    expect(validateGithubRepoName("invalid-end.").valid).toBe(false);
  });

  test("rejects names with consecutive dots", () => {
    const res = validateGithubRepoName("repo..name");
    expect(res.valid).toBe(false);
    expect(res.error).toContain("consecutive dots");
  });

  test("rejects .git name", () => {
    expect(validateGithubRepoName(".git").valid).toBe(false);
  });

  test("rejects names longer than 100 characters", () => {
    const longName = "a".repeat(101);
    expect(validateGithubRepoName(longName).valid).toBe(false);
  });

  test("rejects special characters other than hyphens, underscores, dots", () => {
    expect(validateGithubRepoName("project@name").valid).toBe(false);
    expect(validateGithubRepoName("project#name").valid).toBe(false);
    expect(validateGithubRepoName("project!name").valid).toBe(false);
  });
});
