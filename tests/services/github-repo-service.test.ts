import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from "bun:test";
import { inArray } from "drizzle-orm";
import { account, db, user } from "../../src/db";
import {
  GithubRepoError,
  GithubRepoService,
} from "../../src/services/github/github-repo-service";

interface Call {
  url: string;
  method: string;
  body: unknown;
}

const originalFetch = globalThis.fetch;
let calls: Call[] = [];
let respond: (call: Call) => Response = () =>
  new Response("{}", { status: 500 });
const userIds: string[] = [];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function ghRepo(fullName: string, extra: Record<string, unknown> = {}) {
  const name = fullName.split("/")[1];
  return {
    id: 1,
    name,
    full_name: fullName,
    description: null,
    private: true,
    html_url: `https://github.com/${fullName}`,
    updated_at: "2026-01-01T00:00:00Z",
    default_branch: "main",
    ...extra,
  };
}

async function makeUser(connected: boolean): Promise<string> {
  const [u] = await db
    .insert(user)
    .values({
      id: crypto.randomUUID(),
      name: "N",
      email: `n-${crypto.randomUUID()}@example.com`,
    })
    .returning();
  userIds.push(u.id);
  if (connected) {
    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: "12345",
      providerId: "github",
      userId: u.id,
      accessToken: "gho_test",
    });
  }
  return u.id;
}

beforeEach(() => {
  calls = [];
  respond = () => new Response("{}", { status: 500 });
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const call: Call = {
      url: String(input),
      method: init?.method ?? "GET",
      body: typeof init?.body === "string" ? JSON.parse(init.body) : undefined,
    };
    calls.push(call);
    return respond(call);
  }) as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

afterAll(async () => {
  if (userIds.length) await db.delete(user).where(inArray(user.id, userIds));
});

describe("GithubRepoService.listUserRepositories", () => {
  it("returns not connected without a request", async () => {
    const id = await makeUser(false);
    expect(await GithubRepoService.listUserRepositories(id)).toEqual({
      connected: false,
      repositories: [],
    });
    expect(calls).toHaveLength(0);
  });

  it("maps repositories", async () => {
    const id = await makeUser(true);
    respond = () =>
      jsonResponse([
        ghRepo("a/one", { id: 10, description: "d", private: false }),
        ghRepo("a/two", { id: 11, default_branch: undefined }),
      ]);
    const result = await GithubRepoService.listUserRepositories(id);
    expect(calls[0].url).toBe(
      "https://api.github.com/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator,organization_member",
    );
    expect(result.connected).toBe(true);
    expect(result.repositories).toEqual([
      {
        id: 10,
        name: "one",
        fullName: "a/one",
        description: "d",
        isPrivate: false,
        htmlUrl: "https://github.com/a/one",
        updatedAt: "2026-01-01T00:00:00Z",
        defaultBranch: "main",
      },
      {
        id: 11,
        name: "two",
        fullName: "a/two",
        description: null,
        isPrivate: true,
        htmlUrl: "https://github.com/a/two",
        updatedAt: "2026-01-01T00:00:00Z",
        defaultBranch: null,
      },
    ]);
  });

  it("treats 401 as not connected", async () => {
    const id = await makeUser(true);
    respond = () => jsonResponse({ message: "Bad credentials" }, 401);
    expect(await GithubRepoService.listUserRepositories(id)).toEqual({
      connected: false,
      repositories: [],
    });
  });

  it("rejects with github_error on 500", async () => {
    const id = await makeUser(true);
    const err = await GithubRepoService.listUserRepositories(id).catch(
      (e: unknown) => e,
    );
    expect(err).toBeInstanceOf(GithubRepoError);
    expect((err as GithubRepoError).code).toBe("github_error");
  });
});

describe("GithubRepoService.getRepository", () => {
  it("returns the mapped repository", async () => {
    const id = await makeUser(true);
    respond = () => jsonResponse(ghRepo("octo/Repo"));
    const repo = await GithubRepoService.getRepository("octo/repo", id);
    expect(calls[0].url).toBe("https://api.github.com/repos/octo/repo");
    expect(repo?.fullName).toBe("octo/Repo");
    expect(repo?.name).toBe("Repo");
  });

  it("returns null for 404", async () => {
    const id = await makeUser(true);
    respond = () => jsonResponse({ message: "Not Found" }, 404);
    expect(await GithubRepoService.getRepository("octo/repo", id)).toBeNull();
  });

  it("returns null without a request for an invalid name", async () => {
    const id = await makeUser(true);
    expect(await GithubRepoService.getRepository("not-a-repo", id)).toBeNull();
    expect(calls).toHaveLength(0);
  });

  it("returns null without a request when not connected", async () => {
    const id = await makeUser(false);
    expect(await GithubRepoService.getRepository("octo/repo", id)).toBeNull();
    expect(calls).toHaveLength(0);
  });
});

describe("GithubRepoService.createRepository", () => {
  it("posts a private auto-init repository by default", async () => {
    const id = await makeUser(true);
    respond = () => jsonResponse(ghRepo("alice/new-repo"), 201);
    const repo = await GithubRepoService.createRepository(
      { name: "new-repo" },
      id,
    );
    expect(calls[0].method).toBe("POST");
    expect(calls[0].url).toBe("https://api.github.com/user/repos");
    expect(calls[0].body).toEqual({
      name: "new-repo",
      private: true,
      auto_init: true,
    });
    expect(repo.fullName).toBe("alice/new-repo");
  });

  it("sends private false and description when asked", async () => {
    const id = await makeUser(true);
    respond = () => jsonResponse(ghRepo("alice/pub"), 201);
    await GithubRepoService.createRepository(
      { name: "pub", isPrivate: false, description: "hi" },
      id,
    );
    expect(calls[0].body).toEqual({
      name: "pub",
      description: "hi",
      private: false,
      auto_init: true,
    });
  });

  it("rejects not_connected without a request", async () => {
    const id = await makeUser(false);
    const err = await GithubRepoService.createRepository(
      { name: "x" },
      id,
    ).catch((e: unknown) => e);
    expect((err as GithubRepoError).code).toBe("not_connected");
    expect((err as GithubRepoError).message).toBe(
      "Connect your GitHub account in Account Settings before linking a repository",
    );
    expect(calls).toHaveLength(0);
  });

  it("rejects invalid_name without a request", async () => {
    const id = await makeUser(true);
    const err = await GithubRepoService.createRepository(
      { name: "my repo" },
      id,
    ).catch((e: unknown) => e);
    expect((err as GithubRepoError).code).toBe("invalid_name");
    expect((err as GithubRepoError).message).toContain("spaces");
    expect(calls).toHaveLength(0);
  });

  it("maps 422 to already_exists", async () => {
    const id = await makeUser(true);
    respond = () => jsonResponse({ message: "name already exists" }, 422);
    const err = await GithubRepoService.createRepository(
      { name: "dup" },
      id,
    ).catch((e: unknown) => e);
    expect((err as GithubRepoError).code).toBe("already_exists");
    expect((err as GithubRepoError).message).toBe(
      'Repository "dup" already exists on your GitHub account or the name is not allowed',
    );
  });

  it("maps 500 to github_error", async () => {
    const id = await makeUser(true);
    respond = () => jsonResponse({ message: "boom" }, 500);
    const err = await GithubRepoService.createRepository(
      { name: "x" },
      id,
    ).catch((e: unknown) => e);
    expect((err as GithubRepoError).code).toBe("github_error");
    expect((err as GithubRepoError).message).toBe(
      "Failed to create GitHub repository: boom",
    );
  });
});
