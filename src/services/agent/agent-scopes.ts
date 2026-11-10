import { db } from "@/db";
import { oauthConsent } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  ALL_MCP_CAPABILITIES,
  type McpCapabilityDefinition,
} from "@/constants/agent-capabilities";

export { ALL_MCP_CAPABILITIES, type McpCapabilityDefinition };

export function resolveEffectiveScopes(scopes: string[]): string[] {
  return scopes.filter(
    (s) =>
      (s.includes(".") || s.includes(":") || s === "*") &&
      s !== "agent:customized",
  );
}

/**
 * Effective MCP scopes for an OAuth token: the token's own scopes narrowed to the
 * user's current consent, so neither down-scoped tokens nor later consent edits widen access.
 */
export function resolveTokenScopes(
  tokenScopes: string[],
  consentScopes: string[] | undefined,
): string[] {
  if (tokenScopes.length === 0) return consentScopes ?? [];
  if (!consentScopes) return tokenScopes;
  const consent = new Set(consentScopes);
  return tokenScopes.filter((s) => consent.has(s));
}

export interface AgentScopesResult {
  scopes: string[];
  isRevoked: boolean;
  agentId?: string;
}

export async function getAgentScopesForClient(
  userId: string,
  clientId: string,
): Promise<AgentScopesResult | null> {
  const consents = await db
    .select()
    .from(oauthConsent)
    .where(
      and(eq(oauthConsent.userId, userId), eq(oauthConsent.clientId, clientId)),
    )
    .orderBy(desc(oauthConsent.updatedAt), desc(oauthConsent.createdAt))
    .limit(1);

  const consent = consents[0];
  if (!consent) {
    return {
      scopes: [],
      isRevoked: true,
    };
  }

  const effectiveScopes = resolveEffectiveScopes(consent.scopes || []);

  return {
    scopes: effectiveScopes,
    isRevoked: false,
    agentId: clientId.startsWith("agent_") ? clientId : `agent_${clientId}`,
  };
}

export function createRevokedTokenResponse(appUrl: string): Response {
  const metadataUrl = `${appUrl}/.well-known/oauth-protected-resource/api/mcp`;
  return new Response(
    JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32000, message: "The access token has been revoked" },
      id: null,
    }),
    {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "WWW-Authenticate": `Bearer error="invalid_token", error_description="The access token has been revoked", resource_metadata="${metadataUrl}"`,
      },
    },
  );
}
