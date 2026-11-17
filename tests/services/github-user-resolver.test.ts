import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../../src/db";
import { account, user } from "../../src/db/schema";
import { GithubUserResolver } from "../../src/services/github/github-user-resolver";
import { TeamService } from "../../src/services/team/team-service";

interface Recorded {
  url: string;
  method: string;
  body: string | undefined;
}

const ENV_KEYS = [
  "GITHUB_TOKEN",
  "GITHUB_ACCESS_TOKEN",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
] as const;

let originalFetch: typeof globalThis.fetch;
let savedEnv: Record<string, string | undefined>;
let calls: Recorded[];
let responder: (r: Recorded) => Response;
const userIds: string[] = [];

beforeEach(() => {
  originalFetch = globalThis.fetch;
  savedEnv = {};
  for (const k of ENV_KEYS) {
    savedEnv[k] = process.env[k];
    delete process.env[k];
  }
  calls = [];
  responder = () => new Response("unexpected", { status: 500 });
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const rec: Recorded = {
      url: String(input),
      method: init?.method ?? "GET",
      body: typeof init?.body === "string" ? init.body : undefined,
    };
    calls.push(rec);
    return responder(rec);
  }) as typeof globalThis.fetch;
});

afterEach(async () => {
  globalThis.fetch = originalFetch;
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
  for (const id of userIds.splice(0)) {
    await db.delete(user).where(eq(user.id, id));
  }
});

async function makeUser(accountId?: string): Promise<string> {
  const [u] = await db
    .insert(user)
    .values({
      id: crypto.randomUUID(),
      name: "N",
      email: `n-${crypto.randomUUID()}@example.com`,
    })
    .returning();
  userIds.push(u.id);
  if (accountId !== undefined) {
    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId,
      providerId: "github",
      userId: u.id,
      accessToken: "gho_test",
    });
  }
  return u.id;
}

describe("resolveGitHubUsername", () => {
  test("returns the login of the numeric GitHub id", async () => {
    const id = await makeUser("12345");
    responder = () => Response.json({ login: "alice" });
    expect(await GithubUserResolver.resolveGitHubUsername(id)).toBe("alice");
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("https://api.github.com/user/12345");
  });

  test("null without a request when the user has no github account", async () => {
    const id = await makeUser();
    expect(await GithubUserResolver.resolveGitHubUsername(id)).toBeNull();
    expect(calls).toHaveLength(0);
  });

  test("null on a 404 and on a network error", async () => {
    const id = await makeUser("12345");
    responder = () => new Response("nope", { status: 404 });
    expect(await GithubUserResolver.resolveGitHubUsername(id)).toBeNull();
    responder = () => {
      throw new Error("network down");
    };
    expect(await GithubUserResolver.resolveGitHubUsername(id)).toBeNull();
  });

  test("a non-numeric accountId is the login", async () => {
    const id = await makeUser("bob-the-dev");
    expect(await GithubUserResolver.resolveGitHubUsername(id)).toBe(
      "bob-the-dev",
    );
    expect(calls).toHaveLength(0);
  });
});

describe("inviteCollaborator", () => {
  test.each([201, 204])("true for %p with a push permission PUT", async (s) => {
    responder = () => new Response(null, { status: s });
    expect(
      await GithubUserResolver.inviteCollaborator("octo", "repo", "alice"),
    ).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe("PUT");
    expect(calls[0].url).toBe(
      "https://api.github.com/repos/octo/repo/collaborators/alice",
    );
    expect(JSON.parse(calls[0].body ?? "{}")).toEqual({ permission: "push" });
  });

  test("false for 403 and for a thrown error", async () => {
    responder = () => new Response("no", { status: 403 });
    expect(
      await GithubUserResolver.inviteCollaborator("octo", "repo", "alice"),
    ).toBe(false);
    responder = () => {
      throw new Error("down");
    };
    expect(
      await GithubUserResolver.inviteCollaborator("octo", "repo", "alice"),
    ).toBe(false);
  });

  test.each(["", "   ", "a b", "octo", "OCTO"])(
    "false without a request for %p",
    async (name) => {
      expect(
        await GithubUserResolver.inviteCollaborator("octo", "repo", name),
      ).toBe(false);
      expect(calls).toHaveLength(0);
    },
  );
});

describe("inviteTeamCollaborators", () => {
  test("invites connected members and skips the others", async () => {
    const inviter = await makeUser("1");
    const connected = await makeUser("777");
    const unconnected = await makeUser();
    const team = await TeamService.createTeam({
      name: `T ${crypto.randomUUID()}`,
      ownerId: inviter,
    });
    for (const userId of [connected, unconnected]) {
      await TeamService.addTeamMember({
        teamId: team.id,
        userId,
        role: "member",
      });
    }
    responder = (r) =>
      r.method === "GET"
        ? Response.json({ login: "carol" })
        : new Response(null, { status: 201 });

    const result = await GithubUserResolver.inviteTeamCollaborators(
      team.id,
      "octo/repo",
      inviter,
    );
    expect(result).toEqual({ invited: ["carol"], skipped: [unconnected] });
    expect(calls.map((c) => c.url)).toEqual([
      "https://api.github.com/user/777",
      "https://api.github.com/repos/octo/repo/collaborators/carol",
    ]);
  });

  test("failed invites are skipped by login, owner is ignored", async () => {
    const inviter = await makeUser("1");
    const member = await makeUser("9");
    const ownerMember = await makeUser("OCTO");
    const team = await TeamService.createTeam({
      name: `T ${crypto.randomUUID()}`,
      ownerId: inviter,
    });
    for (const userId of [member, ownerMember]) {
      await TeamService.addTeamMember({
        teamId: team.id,
        userId,
        role: "member",
      });
    }
    responder = (r) =>
      r.method === "GET"
        ? Response.json({ login: "dave" })
        : new Response("no", { status: 403 });
    const result = await GithubUserResolver.inviteTeamCollaborators(
      team.id,
      "octo/repo",
      inviter,
    );
    expect(result).toEqual({ invited: [], skipped: ["dave"] });
  });

  test("invalid repo gives empty result", async () => {
    expect(
      await GithubUserResolver.inviteTeamCollaborators(
        crypto.randomUUID(),
        "not a repo",
      ),
    ).toEqual({ invited: [], skipped: [] });
    expect(calls).toHaveLength(0);
  });
});
