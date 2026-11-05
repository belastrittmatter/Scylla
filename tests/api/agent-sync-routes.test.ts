import { describe, it, expect, beforeEach } from "bun:test";
import { NextRequest } from "next/server";
import { GET as agentsGet } from "@/app/api/agents/route";
import { POST as revokePost } from "@/app/api/agents/revoke/route";
import { POST as scopesPost } from "@/app/api/agents/scopes/route";
import { db } from "@/db";
import { user, session, oauthClient, oauthConsent } from "@/db/schema";
import { eq } from "drizzle-orm";

describe("Agent API Routes - Native OAuth (#36)", () => {
  const testUserId = "usr_agent_route_test";
  const testToken = "session_token_agent_route_test";
  const testClientPk = "client_pk_route_test";
  const testClientId = "https://agent-route.test/client.json";

  beforeEach(async () => {
    // Clean up
    await db
      .delete(oauthConsent)
      .where(eq(oauthConsent.clientId, testClientId));
    await db.delete(oauthClient).where(eq(oauthClient.id, testClientPk));
    await db.delete(session).where(eq(session.userId, testUserId));
    await db.delete(user).where(eq(user.id, testUserId));

    await db.insert(user).values({
      id: testUserId,
      name: "Route Test User",
      email: "route_test@example.com",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(session).values({
      id: "session_id_route_test",
      userId: testUserId,
      token: testToken,
      expiresAt: new Date(Date.now() + 86400000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(oauthClient).values({
      id: testClientPk,
      clientId: testClientId,
      name: "Codex Route Agent",
      icon: "https://persistent.oaistatic.com/sonic/misc/openai-logo.png",
      uri: "https://chatgpt.com/codex",
      redirectUris: ["http://localhost/cb"],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(oauthConsent).values({
      id: "consent_route_test",
      clientId: testClientId,
      userId: testUserId,
      scopes: ["openid", "profile", "calendar.events"],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it("GET /api/agents requires session and returns connected clients", async () => {
    // Unauthenticated
    const unauthReq = new NextRequest("http://localhost:3000/api/agents", {
      method: "GET",
    });
    const unauthRes = await agentsGet(unauthReq);
    expect(unauthRes.status).toBe(401);

    // Authenticated
    const authReq = new NextRequest("http://localhost:3000/api/agents", {
      method: "GET",
      headers: { authorization: `Bearer ${testToken}` },
    });
    const authRes = await agentsGet(authReq);
    expect(authRes.status).toBe(200);

    const body = await authRes.json();
    expect(body.clients).toHaveLength(1);
    expect(body.clients[0]?.name).toBe("Codex Route Agent");
    expect(body.clients[0]?.icon).toBe(
      "https://persistent.oaistatic.com/sonic/misc/openai-logo.png",
    );
    expect(body.clients[0]?.uri).toBe("https://chatgpt.com/codex");
  });

  it("POST /api/agents/revoke revokes consent for client", async () => {
    const revokeReq = new NextRequest(
      "http://localhost:3000/api/agents/revoke",
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${testToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clientId: testClientId }),
      },
    );

    const revokeRes = await revokePost(revokeReq);
    expect(revokeRes.status).toBe(200);

    const consents = await db
      .select()
      .from(oauthConsent)
      .where(eq(oauthConsent.clientId, testClientId));
    expect(consents).toHaveLength(0);
  });

  it("POST /api/agents/scopes toggles permissions server-side", async () => {
    // Unauthenticated
    const unauthReq = new NextRequest(
      "http://localhost:3000/api/agents/scopes",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: testClientId,
          scopes: ["tasks.write"],
        }),
      },
    );
    const unauthRes = await scopesPost(unauthReq);
    expect(unauthRes.status).toBe(401);

    // Authenticated update
    const authReq = new NextRequest("http://localhost:3000/api/agents/scopes", {
      method: "POST",
      headers: {
        authorization: `Bearer ${testToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clientId: testClientId,
        scopes: ["tasks.write", "rooms.reservation"],
      }),
    });
    const authRes = await scopesPost(authReq);
    expect(authRes.status).toBe(200);
    const body = await authRes.json();
    expect(body.success).toBe(true);
    expect(body.scopes).toEqual(["tasks.write", "rooms.reservation"]);

    // Verify stored in DB
    const consents = await db
      .select()
      .from(oauthConsent)
      .where(eq(oauthConsent.clientId, testClientId));
    expect(consents[0]?.scopes).toContain("tasks.write");
    expect(consents[0]?.scopes).toContain("rooms.reservation");
    expect(consents[0]?.scopes).toContain("agent:customized");
  });
});
