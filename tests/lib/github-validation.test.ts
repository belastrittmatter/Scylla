import { describe, expect, it } from "bun:test";
import {
  isValidGithubRepo,
  parseGithubRepo,
  validateGithubRepoName,
} from "@/lib/github-validation";

describe("parseGithubRepo", () => {
  it("parses owner/repo and keeps case", () => {
    expect(parseGithubRepo("octocat/Hello-World")).toEqual({
      owner: "octocat",
      repo: "Hello-World",
      fullName: "octocat/Hello-World",
    });
  });

  it("trims surrounding spaces", () => {
    expect(parseGithubRepo("  octo/repo ")?.fullName).toBe("octo/repo");
  });

  it.each([
    "",
    null,
    undefined,
    "octocat",
    "a/b/c",
    "https://github.com/a/b",
    "-bad/repo",
    "bad-/repo",
    "owner/re po",
    "owner/ repo",
    "owner /repo",
    "owner/repo extra",
    "owner/\trepo",
    "owner/",
    `${"a".repeat(40)}/repo`,
  ])("returns null for %p", (value) => {
    expect(parseGithubRepo(value)).toBeNull();
    expect(isValidGithubRepo(value)).toBe(false);
  });

  it("accepts a 39 character owner", () => {
    expect(isValidGithubRepo(`${"a".repeat(39)}/repo`)).toBe(true);
  });
});

describe("validateGithubRepoName", () => {
  it("accepts a valid name", () => {
    expect(validateGithubRepoName("my-repo_1.x")).toEqual({
      valid: true,
      cleanName: "my-repo_1.x",
    });
  });

  const cases: [string, string, string, string][] = [
    ["empty", "", "Repository name cannot be empty", ""],
    [
      "too long",
      "a".repeat(101),
      "Repository name cannot exceed 100 characters",
      "a".repeat(100),
    ],
    [
      "space",
      "my repo",
      "Repository name cannot contain spaces (use hyphens '-' instead)",
      "my-repo",
    ],
    [
      "leading dot",
      ".repo",
      "Repository name cannot start with a dot (.) or hyphen (-)",
      "repo",
    ],
    [
      "trailing hyphen",
      "repo-",
      "Repository name cannot end with a dot (.) or hyphen (-)",
      "repo",
    ],
    [
      "double dot",
      "a..b",
      "Repository name cannot contain consecutive dots (..)",
      "a.b",
    ],
    [
      "bad char",
      "a$b",
      "Repository name can only contain letters, numbers, hyphens (-), underscores (_), or dots (.)",
      "a$b",
    ],
  ];
  it.each(cases)("rejects %s", (_label, input, error) => {
    const result = validateGithubRepoName(input);
    expect(result.valid).toBe(false);
    expect(result.error).toBe(error);
  });

  it.each(cases)("cleanName for %s", (_label, input, _error, clean) => {
    expect(validateGithubRepoName(input).cleanName).toBe(clean);
  });
});

describe("parseGithubRepo boundaries", () => {
  it("accepts a repo name of exactly 100 characters and rejects 101", () => {
    expect(isValidGithubRepo(`o/${"r".repeat(100)}`)).toBe(true);
    expect(isValidGithubRepo(`o/${"r".repeat(101)}`)).toBe(false);
  });

  it("accepts one-character and inner-hyphen owners", () => {
    expect(parseGithubRepo("a/b")?.owner).toBe("a");
    expect(parseGithubRepo("a-b/repo")?.owner).toBe("a-b");
  });

  it.each([
    "ö/repo",
    "own_er/repo",
    "own.er/repo",
    "owner/répo",
    "owner/a$b",
    "/repo",
    "owner/.",
    "owner/..",
    "owner/.repo",
    "owner/repo-",
  ])("returns null for %p", (value) => {
    expect(parseGithubRepo(value)).toBeNull();
  });

  it("accepts underscores and dots inside the repo name", () => {
    expect(parseGithubRepo("o/my_repo.js")?.repo).toBe("my_repo.js");
  });
});
