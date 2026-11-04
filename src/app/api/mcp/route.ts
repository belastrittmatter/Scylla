import { auth } from "@/lib/auth";
import { requireMcpAuth } from "@better-auth/mcp";
import { verifyAgentRequest } from "@better-auth/agent-auth";
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

    const resolvedScopes: string[] =
      agentScopes ??
      (Array.isArray(claims.scopes)
        ? (claims.scopes as string[])
        : typeof rawClaims.scope === "string"
          ? rawClaims.scope.split(/[\s,]+/)
          : []);

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
  try {
    const agentSession = await verifyAgentRequest(request, auth);
    if (agentSession) {
      const activeGrants = (
        (
          agentSession as {
            capabilityGrants?: { capability: string; status?: string }[];
          }
        ).capabilityGrants || []
      )
        .filter((g) => !g.status || g.status === "active")
        .map((g) => g.capability);

      const agentObj = (
        agentSession as { agent?: { id?: string; capabilities?: string[] } }
      ).agent;
      const userObj = (agentSession as { user?: { id?: string } }).user;

      const agentScopes =
        activeGrants.length > 0 ? activeGrants : agentObj?.capabilities || [];

      const authInfo: CalendarMcpAuthInfo = {
        sub: userObj?.id || agentObj?.id,
        userId: userObj?.id,
        agentId: agentObj?.id,
        scopes: agentScopes,
      };

      return await mcpServerHandler.fetch(request, {
        authInfo: authInfo as unknown as AuthInfo,
      });
    }
  } catch (err) {
    console.warn("[MCP] verifyAgentRequest check failed:", err);
  }

  // 2. Fall back to standard MCP OAuth 2.1 authentication
  return mcpAuthHandler(request);
};

export { handler as GET, handler as POST };
