import { auth } from "@/lib/auth";
import { requireMcpAuth } from "@better-auth/mcp";
import { createMcpHandler, McpServer, type AuthInfo } from "@modelcontextprotocol/server";
import { registerAllMcpTools } from "@/mcp/tools";
import { registerAllMcpPrompts } from "@/mcp/prompts";
import { createMcpToolContext } from "@/mcp/context";
import { MCP_SERVER_INSTRUCTIONS } from "@/mcp/instructions";
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
    }
  );

  const toolCtx = createMcpToolContext(authInfo?.sub);
  registerAllMcpTools(server, toolCtx);
  registerAllMcpPrompts(server);

  return server;
}

export const mcpServerHandler = createMcpHandler(
  async (ctx) => {
    return createCalendarMcpServer(ctx.authInfo as CalendarMcpAuthInfo | undefined);
  },
  {
    legacy: "stateless",
  }
);

const handler = requireMcpAuth(
  auth,
  (request, claims) => {
    return mcpServerHandler.fetch(request, { authInfo: claims as unknown as AuthInfo });
  },
  {
    resource,
  }
);

export { handler as GET, handler as POST };
