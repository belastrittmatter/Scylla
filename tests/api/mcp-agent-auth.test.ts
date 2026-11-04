import { describe, it, expect, beforeEach } from "bun:test";
import { createCalendarMcpServer } from "@/app/api/mcp/route";
import { GET as getAgentConfiguration } from "@/app/.well-known/agent-configuration/route";
import { auth } from "@/lib/auth";
import { db, user } from "@/db";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

interface RegisteredToolDef {
  description?: string;
  parameters?: unknown;
  handler: (args: Record<string, unknown>) => Promise<{
    content: Array<{ type: string; text: string; resource?: unknown }>;
    isError?: boolean;
    structuredContent?: Record<string, unknown>;
  }>;
}

interface McpServerWithInternals {
  _registeredTools: Record<string, RegisteredToolDef>;
}

function getRegisteredTools(
  server: unknown,
): Record<string, RegisteredToolDef> {
  return (server as McpServerWithInternals)._registeredTools;
}

describe("MCP Agent Auth & Server-Side Scope Enforcement (#36)", () => {
  const testUserId = "usr_agent_auth_test_user";
  const testUserEmail = "agent_auth_test@example.com";

  beforeEach(async () => {
    const existing = await db
      .select()
      .from(user)
      .where(eq(user.id, testUserId))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(user).values({
        id: testUserId,
        name: "Agent Auth Test User",
        email: testUserEmail,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  });

  describe("Agent Configuration Discovery Endpoint", () => {
    it("returns 200 with standard agent discovery schema and configured endpoints", async () => {
      const req = new NextRequest(
        "http://localhost:3000/.well-known/agent-configuration",
      );
      const res = await getAgentConfiguration(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toBeDefined();
      expect(data.provider_name).toBe("Scylla");
      expect(data.modes).toContain("delegated");
      expect(data.modes).toContain("autonomous");
      expect(data.endpoints.capabilities).toBeDefined();
      expect(data.endpoints.register).toBeDefined();
    });

    it("lists all registered server capabilities via agent-auth capability catalog", async () => {
      const result = await auth.api.listCapabilities();
      expect(result).toBeDefined();
      expect(result.capabilities).toBeDefined();

      const capabilityNames = (
        result.capabilities as Array<{ name?: string }>
      ).map((c) => c.name);
      expect(capabilityNames).toContain("calendar.readonly");
      expect(capabilityNames).toContain("calendar.events");
      expect(capabilityNames).toContain("rooms.reservation");
      expect(capabilityNames).toContain("tasks.readonly");
      expect(capabilityNames).toContain("tasks.write");
      expect(capabilityNames).toContain("tasks.delete");
      expect(capabilityNames).toContain("projects.readonly");
      expect(capabilityNames).toContain("projects.manage");
      expect(capabilityNames).toContain("projects.delete");
      expect(capabilityNames).toContain("teams.readonly");
      expect(capabilityNames).toContain("teams.manage");
      expect(capabilityNames).toContain("teams.delete");
    });
  });

  describe("Server-Side Scope Enforcement on MCP Tools", () => {
    it("rejects tool execution when scopes is undefined (fail-closed scope enforcement)", async () => {
      const server = await createCalendarMcpServer({ sub: testUserId });
      const tools = getRegisteredTools(server);

      // resolve_user requires calendar.readonly
      const res = await tools.resolve_user.handler({ name: "NonExistent" });
      expect(res.isError).toBe(true);
      expect(res.structuredContent?.code).toBe("insufficient_scope");
      expect(res.structuredContent?.required_scope).toBe("calendar.readonly");
    });

    it("rejects tool execution with insufficient_scope error code when required scope is missing", async () => {
      // Empty scopes: agent has no permissions granted
      const server = await createCalendarMcpServer({
        sub: testUserId,
        agentId: "agent_zero_permissions",
        scopes: [],
      });
      const tools = getRegisteredTools(server);

      const res = await tools.resolve_user.handler({ name: "Test" });
      expect(res.isError).toBe(true);
      expect(res.structuredContent?.code).toBe("insufficient_scope");
      expect(res.structuredContent?.required_scope).toBe("calendar.readonly");
      expect(res.content[0]?.text).toContain("insufficient_scope");
      expect(res.content[0]?.text).toContain("calendar.readonly");
    });

    it("allows tool execution when exact scope is granted", async () => {
      const server = await createCalendarMcpServer({
        sub: testUserId,
        agentId: "agent_rooms_access",
        scopes: ["rooms.reservation"],
      });
      const tools = getRegisteredTools(server);

      // rooms.reservation is satisfied
      const res = await tools.list_meeting_rooms.handler({});
      expect(res.isError).toBeFalsy();

      // But calendar.readonly is not satisfied
      const failRes = await tools.resolve_user.handler({ name: "Test" });
      expect(failRes.isError).toBe(true);
      expect(failRes.structuredContent?.code).toBe("insufficient_scope");
    });

    it("satisfies child scopes through scope hierarchy implication", async () => {
      // calendar.events implies calendar.readonly
      const server = await createCalendarMcpServer({
        sub: testUserId,
        agentId: "agent_calendar_events",
        scopes: ["calendar.events"],
      });
      const tools = getRegisteredTools(server);

      // resolve_user requires calendar.readonly, which should pass via calendar.events
      const res = await tools.resolve_user.handler({ name: "Test" });
      expect(res.isError).toBeFalsy();

      // tasks.write implies tasks.readonly: list_tasks passes scope check (fails on team lookup, not scope)
      const taskServer = await createCalendarMcpServer({
        sub: testUserId,
        agentId: "agent_task_writer",
        scopes: ["tasks.write"],
      });
      const taskTools = getRegisteredTools(taskServer);

      await expect(
        taskTools.list_tasks.handler({ teamId: "none" }),
      ).rejects.toThrow("not found or access denied");
    });

    it("strictly separates destructive delete operations from write/manage scopes", async () => {
      // Agent only has write/manage scopes, NOT delete scopes
      const server = await createCalendarMcpServer({
        sub: testUserId,
        agentId: "agent_write_only",
        scopes: ["tasks.write", "projects.manage", "teams.manage"],
      });
      const tools = getRegisteredTools(server);

      // delete_task must be rejected with insufficient_scope for tasks.delete
      const deleteTaskRes = await tools.delete_task.handler({
        taskId: "task_123",
      });
      expect(deleteTaskRes.isError).toBe(true);
      expect(deleteTaskRes.structuredContent?.code).toBe("insufficient_scope");
      expect(deleteTaskRes.structuredContent?.required_scope).toBe(
        "tasks.delete",
      );

      // delete_project must be rejected with insufficient_scope for projects.delete
      const deleteProjRes = await tools.delete_project.handler({
        projectId: "proj_123",
      });
      expect(deleteProjRes.isError).toBe(true);
      expect(deleteProjRes.structuredContent?.code).toBe("insufficient_scope");
      expect(deleteProjRes.structuredContent?.required_scope).toBe(
        "projects.delete",
      );

      // delete_team must be rejected with insufficient_scope for teams.delete
      const deleteTeamRes = await tools.delete_team.handler({
        teamId: "team_123",
      });
      expect(deleteTeamRes.isError).toBe(true);
      expect(deleteTeamRes.structuredContent?.code).toBe("insufficient_scope");
      expect(deleteTeamRes.structuredContent?.required_scope).toBe(
        "teams.delete",
      );
    });

    it("enforces rooms.reservation when booking or rescheduling with room parameters", async () => {
      // Agent only has calendar.events, not rooms.reservation
      const server = await createCalendarMcpServer({
        sub: testUserId,
        agentId: "agent_cal_only",
        scopes: ["calendar.events"],
      });
      const tools = getRegisteredTools(server);

      // book_meeting with roomEmail requires rooms.reservation
      const bookRes = await tools.book_meeting.handler({
        summary: "Sprint Planning",
        startTime: "2026-11-04T10:00:00Z",
        endTime: "2026-11-04T11:00:00Z",
        roomEmail: "conference-room-a@scylla.work",
      });
      expect(bookRes.isError).toBe(true);
      expect(bookRes.structuredContent?.code).toBe("insufficient_scope");
      expect(bookRes.structuredContent?.required_scope).toBe(
        "rooms.reservation",
      );

      // reschedule_meeting with roomEmail requires rooms.reservation
      const reschedRes = await tools.reschedule_meeting.handler({
        eventId: "evt_123",
        startTime: "2026-11-04T14:00:00Z",
        endTime: "2026-11-04T15:00:00Z",
        roomEmail: "conference-room-b@scylla.work",
      });
      expect(reschedRes.isError).toBe(true);
      expect(reschedRes.structuredContent?.code).toBe("insufficient_scope");
      expect(reschedRes.structuredContent?.required_scope).toBe(
        "rooms.reservation",
      );
    });

    it("satisfies all scopes when wildcard '*' or domain wildcard is granted", async () => {
      const server = await createCalendarMcpServer({
        sub: testUserId,
        agentId: "agent_full_admin",
        scopes: ["*"],
      });
      const tools = getRegisteredTools(server);

      const userRes = await tools.resolve_user.handler({ name: "Test" });
      expect(userRes.isError).toBeFalsy();

      const roomsRes = await tools.list_meeting_rooms.handler({});
      expect(roomsRes.isError).toBeFalsy();
    });

    it("enforces scope boundaries on teams, projects, and tasks", async () => {
      const server = await createCalendarMcpServer({
        sub: testUserId,
        agentId: "agent_teams_only",
        scopes: ["teams.manage"],
      });
      const tools = getRegisteredTools(server);

      // teams.manage should pass for team tools
      const teamRes = await tools.get_team.handler({
        teamId: "nonexistent_team",
      });
      // Might return not found or error, but NOT insufficient_scope
      if (teamRes.isError) {
        expect(teamRes.structuredContent?.code).not.toBe("insufficient_scope");
      }

      // But task tools require tasks.readonly
      const taskRes = await tools.list_tasks.handler({ teamId: "some_team" });
      expect(taskRes.isError).toBe(true);
      expect(taskRes.structuredContent?.code).toBe("insufficient_scope");
      expect(taskRes.structuredContent?.required_scope).toBe("tasks.readonly");
    });
  });
});
