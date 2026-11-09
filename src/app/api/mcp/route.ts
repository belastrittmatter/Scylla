import { auth } from "@/lib/auth";
import { requireMcpAuth } from "@better-auth/mcp";
import {
  createMcpHandler,
  McpServer,
  type AuthInfo,
} from "@modelcontextprotocol/server";
import { registerAllMcpTools } from "@/mcp/tools";
import { registerAllMcpPrompts } from "@/mcp/prompts";
import { createMcpToolContext } from "@/mcp/context";
import { MCP_SERVER_INSTRUCTIONS } from "@/mcp/instructions";
import {
  getAgentScopesForClient,
  createRevokedTokenResponse,
} from "@/services/agent";
import type { CalendarMcpAuthInfo } from "@/mcp/types";

export type { CalendarMcpAuthInfo };

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const resource = `${appUrl}/api/mcp`;

/**
 * Creates and registers tools on the MCP server instance.
 */
export async function createCalendarMcpServer(authInfo?: CalendarMcpAuthInfo) {
  const server = new McpServer(
    {
      name: "mcp-calendar-room-scheduler",
      version: "1.0.0",
    },
    {
      instructions: MCP_SERVER_INSTRUCTIONS,
    },
  );

  const rawScopes =
    authInfo?.scopes ??
    authInfo?.scope ??
    (authInfo !== undefined ? [] : undefined);
  const toolCtx = createMcpToolContext(
    authInfo?.userId ?? authInfo?.sub,
    rawScopes,
    authInfo?.agentId,
  );
  registerAllMcpTools(server, toolCtx);
  registerAllMcpPrompts(server);

  return server;
}

export const mcpServerHandler = createMcpHandler(
  async (ctx) =>
    createCalendarMcpServer(ctx.authInfo as CalendarMcpAuthInfo | undefined),
  { legacy: "stateless" },
);

const mcpAuthHandler = requireMcpAuth(
  auth,
  async (request, claims) => {
    const rawClaims = claims as Record<string, unknown>;
    const userId = (claims.sub || rawClaims.userId) as string | undefined;
    const clientId = (rawClaims.azp ||
      rawClaims.clientId ||
      rawClaims.client_id) as string | undefined;

    let agentScopes: string[] | undefined;
    let agentId: string | undefined;

    if (userId && clientId) {
      const agentCheck = await getAgentScopesForClient(userId, clientId);
      if (agentCheck?.isRevoked) {
        return createRevokedTokenResponse(appUrl);
      }
      if (agentCheck) {
        agentScopes = agentCheck.scopes;
        agentId = agentCheck.agentId;
      }
    }

    const tokenScopes: string[] = Array.isArray(claims.scopes)
      ? (claims.scopes as string[])
      : typeof rawClaims.scope === "string"
        ? rawClaims.scope.split(/[\s,]+/).filter(Boolean)
        : [];

    let resolvedScopes: string[];
    if (tokenScopes.length > 0) {
      if (agentScopes) {
        const consentSet = new Set(agentScopes);
        resolvedScopes = tokenScopes.filter((s) => consentSet.has(s));
      } else {
        resolvedScopes = tokenScopes;
      }
    } else {
      resolvedScopes = agentScopes ?? [];
    }

    const authInfo: CalendarMcpAuthInfo = {
      sub: userId,
      userId,
      agentId,
      scopes: resolvedScopes,
    };

    return mcpServerHandler.fetch(request, {
      authInfo: authInfo as unknown as AuthInfo,
    });
  },
  {
    resource,
  },
);

const handler = async (request: Request) => {
  // 1. Dual authentication: check Agent Auth protocol first if authorization header present
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    try {
      const getAgentSessionFn = (
        auth.api as unknown as {
          getAgentSession?: (opts: { headers: Headers }) => Promise<unknown>;
        }
      ).getAgentSession;

      const agentSession = getAgentSessionFn
        ? await getAgentSessionFn({ headers: request.headers })
        : null;

      if (agentSession) {
        const sessionObj = agentSession as {
          userId?: string | null;
          agentId?: string;
          agent?: {
            id?: string;
            status?: string;
            capabilityGrants?: { capability: string; status?: string }[];
          };
          user?: { id?: string };
        };

        if (sessionObj.agent?.status === "revoked") {
          return createRevokedTokenResponse(appUrl);
        }

        const grants = sessionObj.agent?.capabilityGrants || [];
        const activeGrants = grants
          .filter((g) => !g.status || g.status === "active")
          .map((g) => g.capability);

        const agentId = sessionObj.agentId || sessionObj.agent?.id;
        const userId = sessionObj.userId || sessionObj.user?.id;

        const authInfo: CalendarMcpAuthInfo = {
          sub: userId || agentId,
          userId: userId || undefined,
          agentId: agentId || undefined,
          scopes: activeGrants,
        };

        return await mcpServerHandler.fetch(request, {
          authInfo: authInfo as unknown as AuthInfo,
        });
      }
    } catch (err) {
      console.warn("[MCP] Agent Auth session check failed:", err);
    }
  }

  // 2. Fall back to standard MCP OAuth 2.1 authentication
  return mcpAuthHandler(request);
};

export { handler as GET, handler as POST };
