import { db } from "@/db";
import {
  oauthClient,
  oauthConsent,
  oauthAccessToken,
  oauthRefreshToken,
  agent,
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { resolveEffectiveScopes } from "./agent-scopes";

export interface ConnectedMcpClient {
  id: string;
  clientId: string;
  name: string;
  icon: string | null;
  uri: string | null;
  scopes: string[];
  resources: string[];
  createdAt: Date | null;
}

export async function listConnectedMcpClients(
  userId: string,
): Promise<ConnectedMcpClient[]> {
  const rows = await db
    .select({
      consent: oauthConsent,
      client: oauthClient,
    })
    .from(oauthConsent)
    .leftJoin(oauthClient, eq(oauthClient.clientId, oauthConsent.clientId))
    .where(eq(oauthConsent.userId, userId))
    .orderBy(desc(oauthConsent.updatedAt), desc(oauthConsent.createdAt));

  const seen = new Set<string>();
  const clients: ConnectedMcpClient[] = [];

  for (const { consent, client } of rows) {
    if (seen.has(consent.clientId)) continue;
    seen.add(consent.clientId);

    clients.push({
      id: consent.id,
      clientId: consent.clientId,
      name: client?.name || "AI Agent",
      icon: client?.icon || null,
      uri: client?.uri || null,
      scopes: resolveEffectiveScopes(consent.scopes || []),
      resources: consent.resources || [],
      createdAt: consent.createdAt,
    });
  }

  return clients;
}

export async function revokeMcpClient(
  userId: string,
  clientIdOrAgentId: string,
): Promise<boolean> {
  let targetClientId = clientIdOrAgentId;

  if (clientIdOrAgentId.startsWith("agent_")) {
    const clientPk = clientIdOrAgentId.replace(/^agent_/, "");
    const matchingClient = await db
      .select()
      .from(oauthClient)
      .where(eq(oauthClient.id, clientPk))
      .limit(1);
    if (matchingClient[0]) {
      targetClientId = matchingClient[0].clientId;
    }
  }

  // 1. Delete OAuth Consent
  await db
    .delete(oauthConsent)
    .where(
      and(
        eq(oauthConsent.userId, userId),
        eq(oauthConsent.clientId, targetClientId),
      ),
    );

  // 2. Revoke / delete OAuth Access Tokens
  await db
    .delete(oauthAccessToken)
    .where(
      and(
        eq(oauthAccessToken.userId, userId),
        eq(oauthAccessToken.clientId, targetClientId),
      ),
    );

  // 3. Revoke / delete OAuth Refresh Tokens
  await db
    .delete(oauthRefreshToken)
    .where(
      and(
        eq(oauthRefreshToken.userId, userId),
        eq(oauthRefreshToken.clientId, targetClientId),
      ),
    );

  // 4. Update legacy agent row if present (scoped to userId to prevent IDOR)
  await db
    .update(agent)
    .set({ status: "revoked", updatedAt: new Date() })
    .where(and(eq(agent.id, clientIdOrAgentId), eq(agent.userId, userId)))
    .catch(() => {});

  return true;
}
