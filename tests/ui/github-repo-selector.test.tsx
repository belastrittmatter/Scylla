import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import {
  getGithubRepoSelectionError,
  toProjectRepoPayload,
  type GithubRepoSelection,
} from "@/components/projects/github-repo-selection";
import { GithubRepoSelector } from "@/components/projects/github-repo-selector";

const FORMAT_ERROR = "Repository must be in the form owner/repo";

describe("getGithubRepoSelectionError", () => {
  test("none has no error", () => {
    expect(getGithubRepoSelectionError({ mode: "none" })).toBeNull();
  });

  test("existing accepts owner/repo", () => {
    expect(
      getGithubRepoSelectionError({
        mode: "existing",
        fullName: "acme/widgets",
      }),
    ).toBeNull();
  });

  test("existing rejects a bare owner and a URL", () => {
    for (const fullName of ["acme", "https://github.com/acme/widgets"]) {
      expect(getGithubRepoSelectionError({ mode: "existing", fullName })).toBe(
        FORMAT_ERROR,
      );
    }
  });

  test("new validates the name", () => {
    const make = (name: string): GithubRepoSelection => ({
      mode: "new",
      name,
      isPrivate: true,
    });
    expect(getGithubRepoSelectionError(make("my-repo"))).toBeNull();
    expect(getGithubRepoSelectionError(make("my repo"))).toBe(
      "Repository name cannot contain spaces (use hyphens '-' instead)",
    );
    expect(getGithubRepoSelectionError(make(""))).toBe(
      "Repository name cannot be empty",
    );
  });
});

describe("toProjectRepoPayload", () => {
  test("none gives an empty payload", () => {
    expect(toProjectRepoPayload({ mode: "none" })).toEqual({});
  });
  test("existing gives a trimmed githubRepo", () => {
    expect(
      toProjectRepoPayload({ mode: "existing", fullName: " acme/widgets " }),
    ).toEqual({ githubRepo: "acme/widgets" });
  });
  test("new gives createNewRepo", () => {
    expect(
      toProjectRepoPayload({
        mode: "new",
        name: " my-repo ",
        isPrivate: false,
      }),
    ).toEqual({ createNewRepo: { name: "my-repo", isPrivate: false } });
  });
});

describe("GithubRepoSelector", () => {
  const render = (value: GithubRepoSelection) =>
    renderToString(<GithubRepoSelector value={value} onChange={() => {}} />);
  const values: GithubRepoSelection[] = [
    { mode: "none" },
    { mode: "existing", fullName: "" },
    { mode: "new", name: "", isPrivate: true },
  ];

  test("every mode shows the label and the three choices", () => {
    for (const value of values) {
      const html = render(value);
      expect(html).toContain("GitHub Repository");
      expect(html).toContain("No repository");
      expect(html).toContain("Link existing repository");
      expect(html).toContain("Create new repository");
    }
  });

  test("existing mode shows the owner/repo input and the format error", () => {
    const html = render({ mode: "existing", fullName: "acme" });
    expect(html).toContain('placeholder="owner/repo"');
    expect(html).toContain(FORMAT_ERROR);
  });

  test("existing mode with a valid name shows no error", () => {
    expect(
      render({ mode: "existing", fullName: "acme/widgets" }),
    ).not.toContain(FORMAT_ERROR);
  });

  test("new mode shows the private toggle and name errors", () => {
    const html = render({ mode: "new", name: "bad name", isPrivate: true });
    expect(html).toContain("Private repository");
    expect(html).toContain("cannot contain spaces");
  });

  test("new mode with empty name shows no error yet", () => {
    expect(render({ mode: "new", name: "", isPrivate: true })).not.toContain(
      "cannot be empty",
    );
  });
});
