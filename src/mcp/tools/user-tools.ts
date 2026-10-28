import type { McpServer } from "@modelcontextprotocol/server";
import { UserService } from "@/services/user";
import { resolveUserSchema } from "../schemas";
import type { McpToolContext } from "../types";

export function registerUserTools(server: McpServer, ctx: McpToolContext) {
  server.registerTool(
    "resolve_user",
    {
      description:
        "Resolve teammates or contacts by nickname or partial name (e.g. 'alex', 'sam', 'sarah') across database users and Google Workspace directory.",
      inputSchema: resolveUserSchema,
    },
    async ({ query, limit = 5 }) => {
      const token = await ctx.getAccessToken();
      const teammates = await UserService.searchTeammates(query, limit, {
        accessToken: token || undefined,
      });

      const bestMatch = teammates.length > 0 ? teammates[0] : null;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                query,
                found: teammates.length > 0,
                bestMatch,
                candidates: teammates,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}
