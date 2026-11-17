import { describe, it, expect } from "bun:test";
import {
  GITHUB_REPO_FORMAT_ERROR,
  isValidGithubRepoFullName,
  parseGithubRepoFullName,
  validateGithubRepoName,
} from "@/lib/github-validation";

describe("validateGithubRepoName", () => {
  it("accepts a normal name and returns the trimmed name", () => {
    expect(validateGithubRepoName("my-repo_1.0")).toEqual({
      valid: true,
      cleanName: "my-repo_1.0",
    });
    expect(validateGithubRepoName("  ok  ").cleanName).toBe("ok");
  });

  const cases: Array<[string, string]> = [
    ["", "Repository name cannot be empty"],
    ["   ", "Repository name cannot be empty"],
    ["a".repeat(101), "Repository name cannot exceed 100 characters"],
    [
      "my repo",
      "Repository name cannot contain spaces (use hyphens '-' instead)",
    ],
    [".hidden", "Repository name cannot start with a dot (.) or hyphen (-)"],
    ["-x", "Repository name cannot start with a dot (.) or hyphen (-)"],
    ["x-", "Repository name cannot end with a dot (.) or hyphen (-)"],
    ["a..b", "Repository name cannot contain consecutive dots (..)"],
    [".git", "Repository name cannot start with a dot (.) or hyphen (-)"],
    [
      "bad$name",
      "Repository name can only contain letters, numbers, hyphens (-), underscores (_), or dots (.)",
    ],
  ];
  for (const [input, error] of cases) {
    it(`rejects ${JSON.stringify(input.slice(0, 12))}`, () => {
      const result = validateGithubRepoName(input);
      expect(result.valid).toBe(false);
      expect(result.error).toBe(error);
    });
  }

  it("accepts 100 characters", () => {
    expect(validateGithubRepoName("a".repeat(100)).valid).toBe(true);
  });
});

describe("parseGithubRepoFullName", () => {
  const expected = { owner: "acme", repo: "widgets" };
  it("parses the accepted forms", () => {
    expect(parseGithubRepoFullName("acme/widgets")).toEqual(expected);
    expect(parseGithubRepoFullName("https://github.com/acme/widgets")).toEqual(
      expected,
    );
    expect(
      parseGithubRepoFullName("https://github.com/acme/widgets.git"),
    ).toEqual(expected);
    expect(
      parseGithubRepoFullName("  https://github.com/acme/widgets/ "),
    ).toEqual(expected);
  });

  it("returns null for invalid input", () => {
    for (const bad of [
      "acme",
      "acme/",
      "/widgets",
      "acme/wid gets",
      "-acme/widgets",
      "acme-/widgets",
      "a/b/c",
      "x".repeat(40) + "/widgets",
      null,
      undefined,
    ]) {
      expect(parseGithubRepoFullName(bad)).toBeNull();
    }
  });
});

describe("isValidGithubRepoFullName", () => {
  it("is true only for the canonical form", () => {
    expect(isValidGithubRepoFullName("acme/widgets")).toBe(true);
    expect(isValidGithubRepoFullName(" acme/widgets ")).toBe(true);
    expect(isValidGithubRepoFullName("https://github.com/acme/widgets")).toBe(
      false,
    );
    expect(isValidGithubRepoFullName("acme")).toBe(false);
    expect(isValidGithubRepoFullName("")).toBe(false);
  });

  it("exposes the format error message", () => {
    expect(GITHUB_REPO_FORMAT_ERROR).toBe(
      "Repository must be in the form owner/repo",
    );
  });
});

describe("QA edge cases", () => {
  it("accepts a 39-character owner and rejects 40", () => {
    expect(parseGithubRepoFullName(`${"o".repeat(39)}/r`)).toEqual({
      owner: "o".repeat(39),
      repo: "r",
    });
    expect(parseGithubRepoFullName(`${"o".repeat(40)}/r`)).toBeNull();
  });

  it("rejects owners with invalid characters", () => {
    expect(parseGithubRepoFullName("ac_me/widgets")).toBeNull();
    expect(parseGithubRepoFullName("ac me/widgets")).toBeNull();
  });

  it("rejects repo parts that fail the name rules", () => {
    expect(parseGithubRepoFullName("acme/.hidden")).toBeNull();
    expect(parseGithubRepoFullName("acme/a..b")).toBeNull();
    expect(parseGithubRepoFullName("acme/bad$name")).toBeNull();
    expect(parseGithubRepoFullName("acme/.git")).toBeNull();
  });

  it("rejects non-https or non-github URLs and URL with extra path", () => {
    expect(
      parseGithubRepoFullName("http://github.com/acme/widgets"),
    ).toBeNull();
    expect(
      parseGithubRepoFullName("https://gitlab.com/acme/widgets"),
    ).toBeNull();
    expect(
      parseGithubRepoFullName("https://github.com/acme/widgets/issues"),
    ).toBeNull();
  });

  it("strips a .git suffix from the short form but it is not canonical", () => {
    expect(parseGithubRepoFullName("acme/widgets.git")).toEqual({
      owner: "acme",
      repo: "widgets",
    });
    expect(isValidGithubRepoFullName("acme/widgets.git")).toBe(false);
    expect(isValidGithubRepoFullName("acme/widgets/")).toBe(false);
    expect(
      isValidGithubRepoFullName("https://github.com/acme/widgets.git"),
    ).toBe(false);
  });

  it("returns a corrected cleanName for a rejected name", () => {
    expect(validateGithubRepoName("my repo").cleanName).toBe("my-repo");
    expect(validateGithubRepoName("bad$name").cleanName).toBe("badname");
  });

  it("checks run in order: spaces before leading dot", () => {
    expect(validateGithubRepoName(".a b").error).toBe(
      "Repository name cannot contain spaces (use hyphens '-' instead)",
    );
  });
});
