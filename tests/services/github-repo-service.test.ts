import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { GithubApiError } from "@/services/github/github-errors";
import { GithubRepoService } from "@/services/github/github-repo-service";
import {
  createGithubFixture,
  type GithubFixture,
} from "../test-utils/github-fixtures";
import { mockGithubApi } from "../test-utils/mock-github-api";

let fixture: GithubFixture;
let restore: (() => void) | null = null;
let savedToken: string | undefined;

beforeEach(() => {
  savedToken = process.env.GITHUB_TOKEN;
  delete process.env.GITHUB_TOKEN;
});

afterEach(async () => {
  restore?.();
  restore = null;
  if (savedToken === undefined) delete process.env.GITHUB_TOKEN;
  else process.env.GITHUB_TOKEN = savedToken;
  await fixture?.cleanup();
});

const rawRepo = {
  id: 77,
  full_name: "acme/widgets",
  name: "widgets",
  owner: { login: "acme" },
  private: true,
  html_url: "https://github.com/acme/widgets",
  description: "Widgets",
};

describe("listUserRepositories", () => {
  test("without a GitHub account: not connected, no request", async () => {
    fixture = await createGithubFixture({ githubAccount: false });
    const m = mockGithubApi([]);
    restore = m.restore;
    const result = await GithubRepoService.listUserRepositories(fixture.userId);
    expect(result).toEqual({ connected: false, repositories: [] });
    expect(m.calls).toHaveLength(0);
  });

  test("with an account maps the fields", async () => {
    fixture = await createGithubFixture();
    const m = mockGithubApi([
      { method: "GET", path: "/user/repos", body: [rawRepo] },
    ]);
    restore = m.restore;
    const result = await GithubRepoService.listUserRepositories(fixture.userId);
    expect(result).toEqual({
      connected: true,
      repositories: [
        {
          id: 77,
          fullName: "acme/widgets",
          name: "widgets",
          owner: "acme",
          private: true,
          htmlUrl: "https://github.com/acme/widgets",
          description: "Widgets",
        },
      ],
    });
    expect(m.calls[0].search).toBe(
      "?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member",
    );
  });

  test("a non-2xx response throws GithubApiError", async () => {
    fixture = await createGithubFixture();
    restore = mockGithubApi([
      { method: "GET", path: "/user/repos", status: 403 },
    ]).restore;
    const err = await GithubRepoService.listUserRepositories(
      fixture.userId,
    ).catch((e) => e);
    expect(err).toBeInstanceOf(GithubApiError);
    expect(err.status).toBe(403);
  });
});

describe("createRepository", () => {
  test("sends private true and auto_init true by default", async () => {
    fixture = await createGithubFixture();
    const m = mockGithubApi([
      { method: "POST", path: "/user/repos", status: 201, body: rawRepo },
    ]);
    restore = m.restore;
    const created = await GithubRepoService.createRepository(
      { name: "widgets" },
      fixture.userId,
    );
    expect(created.fullName).toBe("acme/widgets");
    expect(m.calls[0].body).toEqual({
      name: "widgets",
      private: true,
      auto_init: true,
    });
  });

  test("sends description and explicit visibility", async () => {
    fixture = await createGithubFixture();
    const m = mockGithubApi([
      { method: "POST", path: "/user/repos", status: 201, body: rawRepo },
    ]);
    restore = m.restore;
    await GithubRepoService.createRepository(
      { name: "widgets", description: "Hi", isPrivate: false },
      fixture.userId,
    );
    expect(m.calls[0].body).toEqual({
      name: "widgets",
      description: "Hi",
      private: false,
      auto_init: true,
    });
  });

  test("an invalid name throws the validation error with no request", async () => {
    fixture = await createGithubFixture();
    const m = mockGithubApi([]);
    restore = m.restore;
    await expect(
      GithubRepoService.createRepository({ name: "bad name" }, fixture.userId),
    ).rejects.toThrow(
      "Repository name cannot contain spaces (use hyphens '-' instead)",
    );
    expect(m.calls).toHaveLength(0);
  });

  test("without an account throws the connect error", async () => {
    fixture = await createGithubFixture({ githubAccount: false });
    const m = mockGithubApi([]);
    restore = m.restore;
    await expect(
      GithubRepoService.createRepository({ name: "widgets" }, fixture.userId),
    ).rejects.toThrow("Connect your GitHub account to create a repository");
    expect(m.calls).toHaveLength(0);
  });

  test("a 422 response throws GithubApiError with the GitHub message", async () => {
    fixture = await createGithubFixture();
    restore = mockGithubApi([
      {
        method: "POST",
        path: "/user/repos",
        status: 422,
        body: { message: "name already exists on this account" },
      },
    ]).restore;
    const err = await GithubRepoService.createRepository(
      { name: "widgets" },
      fixture.userId,
    ).catch((e) => e);
    expect(err).toBeInstanceOf(GithubApiError);
    expect(err.status).toBe(422);
    expect(err.message).toBe(
      "GitHub API returned 422: name already exists on this account",
    );
  });
});
