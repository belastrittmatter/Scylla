import { describe, expect, test } from "bun:test";
import { slugify } from "../../src/lib/utils";

describe("slugify utility", () => {
  test("converts simple string to kebab case", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  test("handles uppercase, special characters, and multiple spaces", () => {
    expect(slugify("  My Super Cool Project!! @2026 ")).toBe(
      "my-super-cool-project-2026",
    );
  });

  test("collapses multiple dashes and underscores into single dash", () => {
    expect(slugify("engineering___infra---team")).toBe(
      "engineering-infra-team",
    );
  });

  test("trims leading and trailing hyphens", () => {
    expect(slugify("---alpha-beta---")).toBe("alpha-beta");
  });
});
