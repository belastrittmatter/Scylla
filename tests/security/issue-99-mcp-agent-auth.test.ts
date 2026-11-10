import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { eq } from "drizzle-orm";
import { POST as mcpPost } from "@/app/api/mcp/route";
import { auth } from "@/lib/auth";
import { db, user } from "@/db";
import { agent, agentHost } from "@/db/schema";
import { resolveTokenScopes } from "@/services/agent";

const uid = Math.random().toString(36).slice(2, 7);
const userId = `usr_agent_auth_${uid}`;
const hostId = `host_agent_auth_${uid}`;

type AuthApi = { getAgentSession?: (opts: unknown) => Promise<unknown> };
const api = auth.api as unknown as AuthApi;
const original = api.getAgentSession;

async function callAsAgent(agentId: string): Promise<Response> {
  // getAgentSession never exposes agent.status, so the route must look it up.
  api.getAgentSession = async () => ({
    agentId,
    userId,
    agent: { id: agentId, capabilityGrants: [] },
  });
  return mcpPost(
    new Request("http://localhost/api/mcp", {
      method: "POST",
      headers: {
        authorization: "Bearer agent-jwt",
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
    }),
  );
}

describe("MCP agent session status (#99)", () => {
  beforeAll(async () => {
    const now = new Date();
    await db
      .insert(user)
      .values({ id: userId, name: "A", email: `${userId}@example.com` });
    await db.insert(agentHost).values({
      id: hostId,
      name: "Host",
      userId,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
    for (const status of ["active", "revoked", "suspended"]) {
      await db.insert(agent).values({
        id: `agent_${status}_${uid}`,
        name: status,
        userId,
        hostId,
        publicKey: "k",
        status,
        createdAt: now,
        updatedAt: now,
      });
    }
  });

  afterAll(async () => {
    api.getAgentSession = original;
    await db.delete(agentHost).where(eq(agentHost.id, hostId));
    await db.delete(user).where(eq(user.id, userId));
  });

  test("revoked and suspended agents are rejected", async () => {
    for (const status of ["revoked", "suspended"]) {
      const res = await callAsAgent(`agent_${status}_${uid}`);
      expect(res.status).toBe(401);
      expect((await res.json()).error.message).toContain("revoked");
    }
  });

  test("active agents reach the MCP server", async () => {
    const res = await callAsAgent(`agent_active_${uid}`);
    expect(res.status).toBe(200);
  });
});

describe("MCP OAuth scope resolution (#99)", () => {
  test("token scopes are intersected with consent, never widened", () => {
    expect(
      resolveTokenScopes(
        ["tasks.readonly"],
        ["tasks.readonly", "tasks.write", "teams.manage"],
      ),
    ).toEqual(["tasks.readonly"]);
    expect(
      resolveTokenScopes(["tasks.readonly", "tasks.write"], ["tasks.readonly"]),
    ).toEqual(["tasks.readonly"]);
  });

  test("falls back to consent only when the token carries no scopes", () => {
    expect(resolveTokenScopes([], ["calendar.readonly"])).toEqual([
      "calendar.readonly",
    ]);
    expect(resolveTokenScopes(["tasks.write"], undefined)).toEqual([
      "tasks.write",
    ]);
    expect(resolveTokenScopes([], undefined)).toEqual([]);
  });
});
