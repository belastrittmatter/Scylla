import { describe, it, expect, beforeEach } from "bun:test";
import { db } from "@/db";
import { user, oauthClient, oauthConsent } from "@/db/schema";
import {
  listConnectedMcpClients,
  revokeMcpClient,
  getAgentScopesForClient,
  createRevokedTokenResponse,
} from "@/services/agent";
import { eq } from "drizzle-orm";

describe("Native MCP OAuth Client Service (#36)", () => {
  const testUserId = "usr_agent_sync_unit_test";
  const testClientPk = "test_client_pk_123";
  const testClientId = "https://agent.test/client.json";

  beforeEach(async () => {
    // Clean up test rows
    await db
      .delete(oauthConsent)
      .where(eq(oauthConsent.clientId, testClientId));
    await db.delete(oauthClient).where(eq(oauthClient.id, testClientPk));
    await db.delete(user).where(eq(user.id, testUserId));

    // Seed user & client
    await db.insert(user).values({
      id: testUserId,
      name: "Sync Test User",
      email: "sync_test@example.com",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(oauthClient).values({
      id: testClientPk,
      clientId: testClientId,
      name: "Test Codex Agent",
      icon: "https://agent.test/icon.png",
      uri: "https://agent.test",
      redirectUris: ["http://localhost/cb"],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(oauthConsent).values({
      id: "consent_test_123",
      clientId: testClientId,
      userId: testUserId,
      resources: ["http://localhost:3000/api/mcp"],
      scopes: ["openid", "profile", "tasks.write"],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it("lists connected MCP clients directly from OAuth consents", async () => {
    const clients = await listConnectedMcpClients(testUserId);
    expect(clients).toHaveLength(1);
    expect(clients[0]?.name).toBe("Test Codex Agent");
    expect(clients[0]?.icon).toBe("https://agent.test/icon.png");
    expect(clients[0]?.uri).toBe("https://agent.test");
    expect(clients[0]?.scopes).toContain("tasks.write");
  });

  it("resolves active agent scopes and blocks revoked clients", async () => {
    const scopesBefore = await getAgentScopesForClient(
      testUserId,
      testClientId,
    );
    expect(scopesBefore).not.toBeNull();
    expect(scopesBefore?.isRevoked).toBe(false);
    expect(scopesBefore?.scopes).toEqual(["tasks.write"]);

    // Revoke client
    const revoked = await revokeMcpClient(testUserId, testClientId);
    expect(revoked).toBe(true);

    const scopesAfter = await getAgentScopesForClient(testUserId, testClientId);
    expect(scopesAfter).not.toBeNull();
    expect(scopesAfter?.isRevoked).toBe(true);

    // Verify OAuth consent was invalidated in DB
    const remainingConsents = await db
      .select()
      .from(oauthConsent)
      .where(eq(oauthConsent.clientId, testClientId));
    expect(remainingConsents).toHaveLength(0);
  });

  it("builds RFC 6750 / RFC 9728 401 challenge response with WWW-Authenticate header when token is revoked", async () => {
    const res = createRevokedTokenResponse("http://localhost:3000");
    expect(res.status).toBe(401);

    const wwwAuth = res.headers.get("WWW-Authenticate");
    expect(wwwAuth).toContain('error="invalid_token"');
    expect(wwwAuth).toContain("resource_metadata=");
    expect(wwwAuth).toContain(
      "http://localhost:3000/.well-known/oauth-protected-resource/api/mcp",
    );

    const body = await res.json();
    expect(body.jsonrpc).toBe("2.0");
    expect(body.error.code).toBe(-32000);
    expect(body.error.message).toContain("revoked");
  });
});
