import { db } from "@/db";
import { oauthClient, oauthConsent, oauthAccessToken } from "@/db/schema";
import { eq, and, or, desc } from "drizzle-orm";
import { ALL_MCP_CAPABILITIES } from "@/constants/agent-capabilities";

export async function updateMcpClientScopes(
  userId: string,
  clientIdOrAgentId: string,
  newScopes: string[],
): Promise<string[]> {
  let targetClientId = clientIdOrAgentId;

  const clientPk = clientIdOrAgentId.startsWith("agent_")
    ? clientIdOrAgentId.replace(/^agent_/, "")
    : clientIdOrAgentId;

  const matchingClient = await db
    .select()
    .from(oauthClient)
    .where(
      or(
        eq(oauthClient.clientId, clientIdOrAgentId),
        eq(oauthClient.id, clientPk),
      ),
    )
    .limit(1);

  if (matchingClient[0]) {
    targetClientId = matchingClient[0].clientId;
  }

  const consents = await db
    .select()
    .from(oauthConsent)
    .where(
      and(
        eq(oauthConsent.userId, userId),
        or(
          eq(oauthConsent.clientId, targetClientId),
          eq(oauthConsent.clientId, clientIdOrAgentId),
          eq(oauthConsent.id, clientIdOrAgentId),
        ),
      ),
    )
    .orderBy(desc(oauthConsent.updatedAt), desc(oauthConsent.createdAt))
    .limit(1);

  const consent = consents[0];
  if (consent?.clientId) {
    targetClientId = consent.clientId;
  }

  const preservedScopes = (consent?.scopes || []).filter(
    (s) =>
      !s.includes(".") &&
      !s.includes(":") &&
      s !== "agent:customized" &&
      s !== "*",
  );
  if (!preservedScopes.includes("openid")) {
    preservedScopes.push("openid");
  }

  const validScopeIds = new Set<string>(
    ALL_MCP_CAPABILITIES.map((cap) => cap.id),
  );
  const sanitizedScopes = Array.from(
    new Set(newScopes.filter((s) => validScopeIds.has(s))),
  );

  const updatedScopes = Array.from(
    new Set([...preservedScopes, "agent:customized", ...sanitizedScopes]),
  );

  if (consent) {
    await db
      .update(oauthConsent)
      .set({
        scopes: updatedScopes,
        updatedAt: new Date(),
      })
      .where(eq(oauthConsent.id, consent.id));
  } else {
    await db.insert(oauthConsent).values({
      id: crypto.randomUUID(),
      clientId: targetClientId,
      userId: userId,
      scopes: updatedScopes,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  await db
    .update(oauthAccessToken)
    .set({ scopes: updatedScopes })
    .where(
      and(
        eq(oauthAccessToken.userId, userId),
        or(
          eq(oauthAccessToken.clientId, targetClientId),
          eq(oauthAccessToken.clientId, clientIdOrAgentId),
        ),
      ),
    )
    .catch(() => {});

  return sanitizedScopes;
}
