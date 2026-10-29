import { describe, expect, it } from "bun:test";
import { McpServer } from "@modelcontextprotocol/server";
import { registerAllMcpPrompts } from "../../src/mcp/prompts";

describe("MCP Prompts Suite", () => {
  it("registers all prompts and generates daily_meeting_flow correctly", async () => {
    const server = new McpServer({
      name: "test-mcp-server",
      version: "1.0.0",
    });

    registerAllMcpPrompts(server);

    const registeredPrompts = (
      server as unknown as {
        _registeredPrompts: Record<
          string,
          {
            handler: (
              args: Record<string, unknown>,
            ) => Promise<{ messages: { content: { text: string } }[] }>;
          }
        >;
      }
    )._registeredPrompts;
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
});
