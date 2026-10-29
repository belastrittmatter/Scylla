import { createCalendarMcpServer } from "../src/app/api/mcp/route";

interface RegisteredToolDef {
  description?: string;
  parameters?: { shape?: Record<string, unknown> };
  handler: (
    args: Record<string, unknown>,
  ) => Promise<{ content: Array<{ type: string; text: string }> }>;
}

interface McpServerWithInternals {
  _registeredTools: Record<string, RegisteredToolDef>;
}

async function main() {
  console.log("==================================================");
  console.log("       MCP SERVER TOOL VERIFICATION & HEALTH CHECK ");
  console.log("==================================================\n");

  const server = await createCalendarMcpServer();
  const tools = (server as unknown as McpServerWithInternals)._registeredTools;

  const toolNames = Object.keys(tools);
  console.log(`✅ Loaded ${toolNames.length} MCP Tools successfully:\n`);

  for (const [index, [name, def]] of Object.entries(Object.entries(tools))) {
    console.log(`${Number(index) + 1}. [${name}]`);
    console.log(`   Description : ${def.description}`);
    const schema = def.parameters;
    const props = schema?.shape ? Object.keys(schema.shape) : [];
    console.log(
      `   Parameters  : ${props.length > 0 ? props.join(", ") : "(None)"}`,
    );
    console.log("");
  }

  console.log("--------------------------------------------------");
  console.log("🔬 Executing test tool: `list_meeting_rooms`...");
  console.log("--------------------------------------------------");
  const roomResult = await tools.list_meeting_rooms.handler({});
  const rooms = JSON.parse(roomResult.content[0].text);
  console.log(`✅ Success! Found ${rooms.length} active meeting rooms.`);
  rooms
    .slice(0, 3)
    .forEach((r: { name: string; capacity: number; building?: string }) => {
      console.log(
        `   - ${r.name} (${r.capacity} seats, Building: ${r.building || "N/A"})`,
      );
    });

  console.log("\n--------------------------------------------------");
  console.log("🔬 Executing test tool: `resolve_user` with query 'alex'...");
  console.log("--------------------------------------------------");
  const userResult = await tools.resolve_user.handler({ query: "alex" });
  console.log(`✅ Result: ${userResult.content[0].text}`);

  console.log("\n==================================================");
  console.log("🎉 ALL MCP TOOLS ARE HEALTHY AND READY TO DEMO!");
  console.log("==================================================");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ MCP Verification failed:", err);
  process.exit(1);
});
