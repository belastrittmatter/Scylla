import { describe, it, expect, beforeEach } from "bun:test";
import { db } from "@/db";
import { user, oauthClient, oauthConsent, oauthAccessToken } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  getAgentScopesForClient,
  updateMcpClientScopes,
} from "@/services/agent";
import { getHumanReadableCapabilities } from "@/constants/agent-capabilities";
import { createMcpToolContext } from "@/mcp/context";
import { verifyScope } from "@/mcp/tools/auth-helpers";

describe("Agent Scopes & Server-side Enforcement (#36)", () => {
  const testUserId = "usr_scope_test";
  const testClientPk = "client_pk_scope_test";
  const testClientId = "https://agent-scope.test/client.json";

  beforeEach(async () => {
    await db
      .delete(oauthAccessToken)
      .where(eq(oauthAccessToken.clientId, testClientId));
    await db
      .delete(oauthConsent)
      .where(eq(oauthConsent.clientId, testClientId));
    await db.delete(oauthClient).where(eq(oauthClient.id, testClientPk));
    await db.delete(user).where(eq(user.id, testUserId));

    await db.insert(user).values({
      id: testUserId,
      name: "Scope Test User",
      email: "scope_test@example.com",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(oauthClient).values({
      id: testClientPk,
      clientId: testClientId,
      name: "Codex Scope Agent",
      icon: "https://agent-scope.test/icon.png",
      uri: "https://agent-scope.test",
      redirectUris: ["http://localhost/cb"],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(oauthConsent).values({
      id: "consent_scope_test",
      clientId: testClientId,
      userId: testUserId,
      resources: ["http://localhost:3000/api/mcp"],
      scopes: ["openid", "profile"],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(oauthAccessToken).values({
      id: "token_scope_test",
      token: "scoped_access_token_123",
      clientId: testClientId,
      userId: testUserId,
      scopes: ["openid", "profile"],
      createdAt: new Date(),
    });
  });

  it("resolves only granted MCP capabilities without implicit defaults", async () => {
    const res = await getAgentScopesForClient(testUserId, testClientId);
    expect(res?.scopes).toEqual([]);
  });

  it("updates and enforces toggled scopes in database and context", async () => {
    // 1. User updates scopes to only allow tasks.write and rooms.reservation
    const updated = await updateMcpClientScopes(testUserId, testClientId, [
      "tasks.write",
      "rooms.reservation",
    ]);

    expect(updated).toEqual(["tasks.write", "rooms.reservation"]);

    // 2. Query effective scopes
    const res = await getAgentScopesForClient(testUserId, testClientId);
    expect(res?.scopes).toEqual(["tasks.write", "rooms.reservation"]);
    expect(res?.scopes).not.toContain("calendar.events");
    expect(res?.scopes).not.toContain("calendar.readonly");

    // 3. Verify server-side context enforcement
    const toolCtx = createMcpToolContext(testUserId, res?.scopes);

    // tasks.write should be permitted
    expect(toolCtx.hasScope("tasks.write")).toBe(true);
    expect(verifyScope(toolCtx, "tasks.write")).toBeNull();

    // rooms.reservation should be permitted
    expect(toolCtx.hasScope("rooms.reservation")).toBe(true);
    expect(verifyScope(toolCtx, "rooms.reservation")).toBeNull();

    // calendar.events should be denied
    expect(toolCtx.hasScope("calendar.events")).toBe(false);
    const calErr = verifyScope(toolCtx, "calendar.events");
    expect(calErr).not.toBeNull();
    expect(calErr?.content[0]?.text).toContain("insufficient_scope");

    // calendar.readonly should also be denied
    expect(toolCtx.hasScope("calendar.readonly")).toBe(false);
  });

  it("allows revoking all domain scopes completely", async () => {
    // User disables all permissions
    await updateMcpClientScopes(testUserId, testClientId, []);

    const res = await getAgentScopesForClient(testUserId, testClientId);
    expect(res?.scopes).toEqual([]);

    const toolCtx = createMcpToolContext(testUserId, res?.scopes);
    expect(toolCtx.hasScope("calendar.readonly")).toBe(false);
    expect(toolCtx.hasScope("rooms.reservation")).toBe(false);
  });

  it("formats human-readable badges correctly", () => {
    expect(
      getHumanReadableCapabilities(["calendar.events", "rooms.reservation"]),
    ).toEqual(["Calendar (Full)", "Room Booking"]);

    expect(
      getHumanReadableCapabilities(["calendar.readonly", "tasks.write"]),
    ).toEqual(["Calendar (Read-only)", "Tasks (Write)"]);

    expect(
      getHumanReadableCapabilities([
        "tasks.delete",
        "projects.delete",
        "teams.delete",
      ]),
    ).toEqual(["Tasks (Delete)", "Projects (Delete)", "Teams (Delete)"]);

    expect(getHumanReadableCapabilities([])).toEqual([]);
  });

  it("updates scopes by agent_ prefixed ID or client primary key", async () => {
    // 1. Update with agent_ prefix
    await updateMcpClientScopes(testUserId, `agent_${testClientPk}`, [
      "calendar.readonly",
      "tasks.delete",
    ]);

    let res = await getAgentScopesForClient(testUserId, testClientId);
    expect(res?.scopes).toEqual(["calendar.readonly", "tasks.delete"]);

    // 2. Update with client primary key
    await updateMcpClientScopes(testUserId, testClientPk, [
      "projects.delete",
      "teams.delete",
    ]);

    res = await getAgentScopesForClient(testUserId, testClientId);
    expect(res?.scopes).toEqual(["projects.delete", "teams.delete"]);
  });

  it("upserts consent record if no prior consent existed", async () => {
    await db
      .delete(oauthConsent)
      .where(eq(oauthConsent.clientId, testClientId));

    const updated = await updateMcpClientScopes(testUserId, testClientId, [
      "tasks.delete",
      "projects.delete",
      "teams.delete",
      "calendar.events",
    ]);

    expect(updated).toEqual([
      "tasks.delete",
      "projects.delete",
      "teams.delete",
      "calendar.events",
    ]);

    const res = await getAgentScopesForClient(testUserId, testClientId);
    expect(res?.scopes).toEqual([
      "tasks.delete",
      "projects.delete",
      "teams.delete",
      "calendar.events",
    ]);
  });
});
