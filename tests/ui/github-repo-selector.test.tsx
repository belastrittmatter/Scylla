import { renderToString } from "react-dom/server";
import { describe, expect, it } from "bun:test";
import {
  NO_GITHUB_REPO,
  filterGithubRepoOptions,
  getGithubRepoSelectionError,
  toProjectRepoPayload,
  type GithubRepoOption,
  type GithubRepoSelection,
} from "@/components/projects/github-repo-selection";
import { GithubRepoSelector } from "@/components/projects/github-repo-selector";
import type { useProjects } from "@/hooks/use-projects";
import {
  GITHUB_REPO_FORMAT_ERROR,
  validateGithubRepoName,
} from "@/lib/github-validation";

const EMPTY_ERROR = "Enter a repository as owner/repo";

describe("getGithubRepoSelectionError", () => {
  it("has no error for 'none'", () => {
    expect(getGithubRepoSelectionError({ mode: "none" })).toBeNull();
    expect(getGithubRepoSelectionError(NO_GITHUB_REPO)).toBeNull();
  });

  it("asks for a value when 'existing' is blank", () => {
    expect(
      getGithubRepoSelectionError({ mode: "existing", githubRepo: "  " }),
    ).toBe(EMPTY_ERROR);
  });

  it("rejects values that are not owner/repo", () => {
    for (const githubRepo of ["octocat", "a/b/c", "https://github.com/a/b"]) {
      expect(
        getGithubRepoSelectionError({ mode: "existing", githubRepo }),
      ).toBe(GITHUB_REPO_FORMAT_ERROR);
    }
  });

  it("accepts a padded owner/repo", () => {
    expect(
      getGithubRepoSelectionError({
        mode: "existing",
        githubRepo: " octocat/Hello-World ",
      }),
    ).toBeNull();
  });

  it("validates the name of a new repository", () => {
    const empty = getGithubRepoSelectionError({
      mode: "new",
      name: "",
      isPrivate: true,
    });
    expect(empty).toBe(validateGithubRepoName("").error ?? null);
    expect(empty).toBe("Repository name cannot be empty");
    expect(
      getGithubRepoSelectionError({
        mode: "new",
        name: "my repo",
        isPrivate: true,
      }),
    ).toBe("Repository name cannot contain spaces (use hyphens '-' instead)");
    expect(
      getGithubRepoSelectionError({
        mode: "new",
        name: "my-repo",
        isPrivate: true,
      }),
    ).toBeNull();
  });
});

describe("toProjectRepoPayload", () => {
  it("is empty for 'none'", () => {
    expect(toProjectRepoPayload({ mode: "none" })).toEqual({});
  });

  it("trims an existing repository", () => {
    expect(
      toProjectRepoPayload({ mode: "existing", githubRepo: "  octo/repo " }),
    ).toEqual({ githubRepo: "octo/repo" });
  });

  it("builds createNewRepo for a new repository", () => {
    expect(
      toProjectRepoPayload({
        mode: "new",
        name: " my-repo ",
        isPrivate: false,
      }),
    ).toEqual({ createNewRepo: { name: "my-repo", isPrivate: false } });
  });
});

function makeOptions(): GithubRepoOption[] {
  return Array.from({ length: 10 }, (_, i) => ({
    fullName: `octo/repo-${i}`,
    isPrivate: false,
    description: null,
  }));
}

describe("filterGithubRepoOptions", () => {
  it("returns the first 8 for an empty query", () => {
    const result = filterGithubRepoOptions(makeOptions(), "");
    expect(result.map((o) => o.fullName)).toEqual(
      makeOptions()
        .slice(0, 8)
        .map((o) => o.fullName),
    );
  });

  it("matches case-insensitively on the full name", () => {
    const options: GithubRepoOption[] = [
      { fullName: "octo/api-server", isPrivate: false, description: null },
      { fullName: "octo/web", isPrivate: true, description: null },
    ];
    expect(
      filterGithubRepoOptions(options, " API ").map((o) => o.fullName),
    ).toEqual(["octo/api-server"]);
  });

  it("respects a custom limit", () => {
    expect(filterGithubRepoOptions(makeOptions(), "", 3)).toHaveLength(3);
  });
});

const REPOS: GithubRepoOption[] = [
  { fullName: "octo/repo", isPrivate: true, description: null },
  { fullName: "octo/other", isPrivate: false, description: null },
  { fullName: "acme/site", isPrivate: false, description: null },
];
const noop = () => {};

function render(
  value: GithubRepoSelection,
  extra: { connected?: boolean; isLoading?: boolean; disabled?: boolean } = {},
): string {
  return renderToString(
    <GithubRepoSelector
      value={value}
      onChange={noop}
      repositories={REPOS}
      connected={extra.connected ?? true}
      isLoading={extra.isLoading}
      disabled={extra.disabled}
    />,
  );
}

describe("GithubRepoSelector", () => {
  it("in mode none shows the three modes and nothing else", () => {
    const html = render({ mode: "none" });
    expect(html).toContain("GitHub repository");
    expect(html).toContain("No repository");
    expect(html).toContain("Use existing");
    expect(html).toContain("Create new");
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
    expect(html.match(/aria-pressed="false"/g)).toHaveLength(2);
    expect(html).not.toContain('id="github-repo-input"');
    expect(html).not.toContain('role="alert"');
  });

  it("does not show the connect notice in mode none", () => {
    const html = render({ mode: "none" }, { connected: false });
    expect(html).not.toContain("/account/settings");
  });

  it("in mode existing shows the input and the filtered repositories", () => {
    const html = render({ mode: "existing", githubRepo: "octo/re" });
    expect(html).toContain('id="github-repo-input"');
    expect(html).toContain('placeholder="owner/repo"');
    expect(html).toContain('value="octo/re"');
    expect(html).toContain("octo/repo");
    expect(html).toContain("Private");
    expect(html).not.toContain("acme/site");
    expect(html).not.toContain('role="alert"');
  });

  it("shows the format message for an invalid value", () => {
    const html = render({ mode: "existing", githubRepo: "nope" });
    expect(html).toContain('role="alert"');
    expect(html).toContain(
      "Repository must be in &quot;owner/repo&quot; format",
    );
  });

  it("shows a loading text instead of the list", () => {
    const html = render(
      { mode: "existing", githubRepo: "" },
      { isLoading: true },
    );
    expect(html).toContain("Loading repositories…");
    expect(html).not.toContain("acme/site");
  });

  it("shows the connect notice with a link when not connected", () => {
    const html = render(
      { mode: "existing", githubRepo: "" },
      { connected: false },
    );
    expect(html).toContain(
      "Connect your GitHub account in Account Settings to link a repository.",
    );
    expect(html).toContain('href="/account/settings"');
  });

  it("in mode new shows the name input, the private checkbox and the alert", () => {
    const html = render({ mode: "new", name: "my repo", isPrivate: true });
    expect(html).toContain('id="github-repo-name"');
    expect(html).toContain('placeholder="new-repository-name"');
    expect(html).toContain("Private repository");
    expect(html).toContain('role="alert"');
    expect(html).toContain("cannot contain spaces");
  });

  it("disables inputs and mode buttons when disabled", () => {
    const html = render(
      { mode: "existing", githubRepo: "octo" },
      { disabled: true },
    );
    const input = html.match(/<input[^>]*id="github-repo-input"[^>]*>/)?.[0];
    expect(input).toContain("disabled");
    expect(html.match(/<button[^>]*disabled/g)?.length).toBeGreaterThanOrEqual(
      4,
    );
    const newHtml = render(
      { mode: "new", name: "x", isPrivate: true },
      { disabled: true },
    );
    expect(
      newHtml.match(/<input[^>]*id="github-repo-name"[^>]*>/)?.[0],
    ).toContain("disabled");
  });
});

describe("createProject payload typing", () => {
  it("accepts the repo payload on createProject's parameter", () => {
    type CreateData = Parameters<
      ReturnType<typeof useProjects>["createProject"]
    >[0];
    const send = (data: CreateData) => data;
    const existing = send({
      teamId: "t",
      name: "p",
      ...toProjectRepoPayload({ mode: "existing", githubRepo: "o/r" }),
    });
    const created = send({
      teamId: "t",
      name: "p",
      ...toProjectRepoPayload({ mode: "new", name: "r", isPrivate: true }),
    });
    expect(existing.githubRepo).toBe("o/r");
    expect(created.createNewRepo).toEqual({ name: "r", isPrivate: true });
  });
});

describe("GithubRepoSelector behaviour", () => {
  type Node = {
    type: unknown;
    props: Record<string, unknown> & { children?: unknown };
  };

  function isNode(x: unknown): x is Node {
    return typeof x === "object" && x !== null && "props" in x && "type" in x;
  }

  // Calls only the selector's own hook-free panels, leaving ui primitives as
  // elements so their handler props can be read.
  function collect(node: unknown, out: Node[] = []): Node[] {
    if (Array.isArray(node)) {
      node.forEach((n) => collect(n, out));
    } else if (isNode(node)) {
      if (
        typeof node.type === "function" &&
        ["ExistingPanel", "NewPanel"].includes(node.type.name)
      ) {
        collect((node.type as (p: unknown) => unknown)(node.props), out);
      } else {
        out.push(node);
        collect(node.props.children, out);
      }
    }
    return out;
  }

  function nodes(
    value: GithubRepoSelection,
    onChange: (v: GithubRepoSelection) => void,
  ): Node[] {
    return collect(
      GithubRepoSelector({
        value,
        onChange,
        repositories: REPOS,
        connected: true,
      }),
    );
  }

  function text(n: Node): string {
    const walk = (c: unknown): string =>
      Array.isArray(c)
        ? c.map(walk).join("")
        : typeof c === "string"
          ? c
          : isNode(c)
            ? walk(c.props.children)
            : "";
    return walk(n.props.children);
  }

  it("marks the button of the current mode as pressed", () => {
    const html = render({ mode: "new", name: "", isPrivate: true });
    expect(html).toMatch(
      /<button[^>]*aria-pressed="true"[^>]*>Create new<\/button>/,
    );
    expect(html).toMatch(
      /<button[^>]*aria-pressed="false"[^>]*>No repository<\/button>/,
    );
    const existing = render({ mode: "existing", githubRepo: "" });
    expect(existing).toMatch(
      /<button[^>]*aria-pressed="true"[^>]*>Use existing<\/button>/,
    );
  });

  it("renders every button as type=button", () => {
    const html = render({ mode: "existing", githubRepo: "octo" });
    const buttons = html.match(/<button\b[^>]*>/g) ?? [];
    expect(buttons.length).toBeGreaterThanOrEqual(5);
    for (const b of buttons) expect(b).toContain('type="button"');
  });

  it("reflects isPrivate on the checkbox", () => {
    const on = render({ mode: "new", name: "x", isPrivate: true });
    const off = render({ mode: "new", name: "x", isPrivate: false });
    expect(on).toContain('aria-checked="true"');
    expect(off).toContain('aria-checked="false"');
  });

  it("shows Private only for private repositories", () => {
    const html = render({ mode: "existing", githubRepo: "octo/" });
    expect(html.match(/Private/g)).toHaveLength(1);
    expect(html).toContain("octo/other");
  });

  it("sends the initial value of each mode when a mode button is chosen", () => {
    const calls: GithubRepoSelection[] = [];
    const found = nodes({ mode: "none" }, (v) => calls.push(v));
    const click = (label: string) =>
      (found.find((n) => text(n) === label)?.props.onClick as () => void)();
    click("No repository");
    click("Use existing");
    click("Create new");
    expect(calls).toEqual([
      { mode: "none" },
      { mode: "existing", githubRepo: "" },
      { mode: "new", name: "", isPrivate: true },
    ]);
  });

  it("sends the typed text and the picked repository in mode existing", () => {
    const calls: GithubRepoSelection[] = [];
    const found = nodes({ mode: "existing", githubRepo: "octo/" }, (v) =>
      calls.push(v),
    );
    const input = found.find((n) => n.props.id === "github-repo-input");
    (input?.props.onChange as (e: { target: { value: string } }) => void)({
      target: { value: "abc/def" },
    });
    (
      found.find((n) => text(n) === "octo/other")?.props.onClick as () => void
    )();
    expect(calls).toEqual([
      { mode: "existing", githubRepo: "abc/def" },
      { mode: "existing", githubRepo: "octo/other" },
    ]);
  });

  it("keeps the other field when editing a new repository", () => {
    const calls: GithubRepoSelection[] = [];
    const found = nodes({ mode: "new", name: "keep", isPrivate: false }, (v) =>
      calls.push(v),
    );
    (
      found.find((n) => n.props.id === "github-repo-name")?.props
        .onChange as (e: { target: { value: string } }) => void
    )({ target: { value: "renamed" } });
    (
      found.find((n) => n.props.id === "github-repo-private")?.props
        .onCheckedChange as (c: boolean) => void
    )(true);
    expect(calls).toEqual([
      { mode: "new", name: "renamed", isPrivate: false },
      { mode: "new", name: "keep", isPrivate: true },
    ]);
  });
});
