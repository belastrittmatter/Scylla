import { describe, expect, it } from "bun:test";
import { McpServer } from "@modelcontextprotocol/server";
import { mcpServerHandler } from "../../src/app/api/mcp/route";
import { registerAllMcpPrompts } from "../../src/mcp/prompts";

describe("MCP Prompts Suite", () => {
  it("registers all prompts and generates daily_meeting_flow correctly", async () => {
    const server = new McpServer({
      name: "test-mcp-server",
      version: "1.0.0",
    });

    registerAllMcpPrompts(server);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const registeredPrompts = (server as any)._registeredPrompts;
    expect(registeredPrompts).toBeDefined();
    expect(registeredPrompts.daily_meeting_flow).toBeDefined();
    expect(registeredPrompts.book_meeting_flow).toBeDefined();
    expect(registeredPrompts.create_task_flow).toBeDefined();

    const dailyPrompt = registeredPrompts.daily_meeting_flow;
    const generated = await dailyPrompt.handler({
      teamId: "team-eng-core",
      date: "2026-10-30",
      durationMinutes: 15,
      isOffline: false,
      repeatDays: 5,
    });

    expect(generated.messages).toBeDefined();
    expect(generated.messages.length).toBeGreaterThan(0);
    const contentText = generated.messages[0].content.text;
    expect(contentText).toContain('team "team-eng-core"');
    expect(contentText).toContain("2026-10-30");
    expect(contentText).toContain("repeating for 5 workdays (1 week)");
    expect(contentText).toContain("list_team_members");
    expect(contentText).toContain("find_common_meeting_slots");
    expect(contentText).toContain("book_meeting");
  });

  it("handles prompts/list and prompts/get over MCP JSON-RPC transport", async () => {
    const listReq = new Request("http://localhost:3000/api/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "prompts/list",
        params: {},
      }),
    });

    const listRes = await mcpServerHandler.fetch(listReq);
    expect(listRes.status).toBe(200);
    const listText = await listRes.text();
    expect(listText).toContain("book_meeting_flow");
    expect(listText).toContain("create_task_flow");
    expect(listText).toContain("daily_meeting_flow");

    const getDailyReq = new Request("http://localhost:3000/api/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "prompts/get",
        params: {
          name: "daily_meeting_flow",
          arguments: {
            teamId: "team-eng-core",
            date: "2026-10-30",
            durationMinutes: "15",
            isOffline: "false",
            repeatDays: "5",
          },
        },
      }),
    });

    const getDailyRes = await mcpServerHandler.fetch(getDailyReq);
    expect(getDailyRes.status).toBe(200);
    const getDailyText = await getDailyRes.text();
    expect(getDailyText).not.toContain('"error"');
    expect(getDailyText).toContain("repeating for 5 workdays (1 week)");

    for (const promptName of [
      "book_meeting_flow",
      "create_task_flow",
      "daily_meeting_flow",
    ]) {
      const emptyArgsReq = new Request("http://localhost:3000/api/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 3,
          method: "prompts/get",
          params: {
            name: promptName,
            arguments: {},
          },
        }),
      });

      const emptyArgsRes = await mcpServerHandler.fetch(emptyArgsReq);
      expect(emptyArgsRes.status).toBe(200);
      const emptyArgsText = await emptyArgsRes.text();
      expect(emptyArgsText).not.toContain('"error"');
    }
  });
});
