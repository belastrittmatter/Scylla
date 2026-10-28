import { describe, it, expect, beforeEach, afterAll, spyOn } from "bun:test";
import { createCalendarMcpServer } from "@/app/api/mcp/route";
import {
  buildScheduleComparisonMarkdown,
  buildPersonalCalendarMarkdown,
  buildTaskBoardMarkdown,
} from "@/utils/mcp-markdown-builder";
import { getAgendaUiHtml, getScheduleUiHtml, getTaskBoardUiHtml } from "@/utils/mcp-ui-builder";
import { db, user } from "@/db";
import { GoogleCalendarService } from "@/services/google-calendar";
import { UserService } from "@/services/user";
import { TeamService } from "@/services/team/team-service";
import { eq } from "drizzle-orm";

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

function getRegisteredTools(server: unknown): Record<string, RegisteredToolDef> {
  return (server as McpServerWithInternals)._registeredTools;
}

describe("MCP Tools & Utilities Suite", () => {
  const testUserId = "usr_mcp_test_organizer";
  const testUserEmail = "organizer@example.com";

  beforeEach(async () => {
    // Ensure test user exists in DB
    const existing = await db.select().from(user).where(eq(user.id, testUserId)).limit(1);
    if (existing.length === 0) {
      await db.insert(user).values({
        id: testUserId,
        name: "MCP Test Organizer",
        email: testUserEmail,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  });

  afterAll(async () => {
    await db.delete(user).where(eq(user.id, testUserId));
  });

  it("registers all required MCP tools on the server", async () => {
    const server = await createCalendarMcpServer({ sub: testUserId });
    const registeredTools = getRegisteredTools(server);

    expect(registeredTools).toBeDefined();
    expect(registeredTools["resolve_user"]).toBeDefined();
    expect(registeredTools["list_meeting_rooms"]).toBeDefined();
    expect(registeredTools["list_event_types"]).toBeDefined();
    expect(registeredTools["find_common_meeting_slots"]).toBeDefined();
    expect(registeredTools["compare_schedules"]).toBeDefined();
    expect(registeredTools["book_meeting"]).toBeDefined();
    expect(registeredTools["reschedule_meeting"]).toBeDefined();
    expect(registeredTools["cancel_meeting"]).toBeDefined();
    expect(registeredTools["get_my_agenda"]).toBeDefined();
    expect(registeredTools["create_shareable_booking_link"]).toBeDefined();
    expect(registeredTools["list_teams"]).toBeDefined();
    expect(registeredTools["list_projects"]).toBeDefined();
    expect(registeredTools["create_project"]).toBeDefined();
    expect(registeredTools["list_tasks"]).toBeDefined();
    expect(registeredTools["create_task"]).toBeDefined();
    expect(registeredTools["update_task"]).toBeDefined();
    expect(registeredTools["get_task_board"]).toBeDefined();
    expect(registeredTools["get_active_tasks"]).toBeDefined();
    expect(registeredTools["get_task_timeline"]).toBeDefined();
  }, 15000);

  describe("resolve_user tool", () => {
    it("resolves a user by nickname or partial name", async () => {
      const server = await createCalendarMcpServer({ sub: testUserId });
      const tool = getRegisteredTools(server)["resolve_user"];

      const res = await tool.handler({ query: "sarah", limit: 5 });
      expect(res.content).toBeDefined();
      expect(res.content[0].type).toBe("text");

      const parsed = JSON.parse(res.content[0].text);
      expect(parsed.found).toBe(true);
      expect(parsed.bestMatch).toBeDefined();
      expect(parsed.bestMatch.email.toLowerCase()).toContain("sarah");
      expect(parsed.candidates.length).toBeGreaterThan(0);
    }, 15000);

    it("handles queries with no matches gracefully", async () => {
      const server = await createCalendarMcpServer({ sub: testUserId });
      const tool = getRegisteredTools(server)["resolve_user"];

      const res = await tool.handler({ query: "xyz_nonexistent_person_999", limit: 5 });
      const parsed = JSON.parse(res.content[0].text);
      expect(parsed.found).toBe(false);
      expect(parsed.bestMatch).toBeNull();
      expect(parsed.candidates).toHaveLength(0);
    }, 15000);
  });

  describe("find_common_meeting_slots tool with nickname resolution", () => {
    it("resolves nicknames in attendees list and computes conflict-free slots", async () => {
      const server = await createCalendarMcpServer({ sub: testUserId });
      const tool = getRegisteredTools(server)["find_common_meeting_slots"];

      const res = await tool.handler({
        attendees: ["me", "sarah"], // 'me' + nickname without @
        durationMinutes: 30,
        startDate: "2026-10-20T08:00:00.000Z",
        endDate: "2026-10-20T18:00:00.000Z",
        timezone: "Asia/Ho_Chi_Minh",
      });

      expect(res.content).toBeDefined();
      const markdown = res.content[0].text;
      expect(markdown).toContain("# Schedule Comparison");
      expect(markdown.toLowerCase()).toContain("sarah");
      const structured = (
        res as { structuredContent?: { targetUser?: { name?: string; email?: string } } }
      ).structuredContent;
      expect(structured?.targetUser?.name).not.toBe("me");
      expect(structured?.targetUser?.email).toContain("sarah");
    }, 15000);

    it("deduplicates freeBusy and directory lookups across multiple attendees and preloads room busy intervals", async () => {
      const server = await createCalendarMcpServer({ sub: testUserId });
      const tool = getRegisteredTools(server)["find_common_meeting_slots"];

      const freeBusySpy = spyOn(GoogleCalendarService, "getFreeBusy");
      const searchSpy = spyOn(UserService, "searchTeammates");

      try {
        const res = await tool.handler({
          attendees: ["me", "sarah", "alex@example.com"],
          durationMinutes: 30,
          startDate: "2026-10-20T08:00:00.000Z",
          endDate: "2026-10-20T18:00:00.000Z",
          timezone: "Asia/Ho_Chi_Minh",
        });

        expect(freeBusySpy).toHaveBeenCalledTimes(1);
        expect(searchSpy).toHaveBeenCalledTimes(1);

        const structured = res.structuredContent as {
          rooms?: Array<{ id: string; busy?: unknown[] }>;
        };
        expect(Array.isArray(structured?.rooms)).toBe(true);
        for (const room of structured?.rooms || []) {
          expect(Array.isArray(room.busy)).toBe(true);
        }
      } finally {
        freeBusySpy.mockRestore();
        searchSpy.mockRestore();
      }
    }, 15000);
  });

  describe("compare_schedules tool", () => {
    it("compares schedules and generates formatted Markdown card", async () => {
      const server = await createCalendarMcpServer({ sub: testUserId });
      const tool = getRegisteredTools(server)["compare_schedules"];

      const res = await tool.handler({
        targetUser: "sarah",
        date: "2026-10-20",
        durationMinutes: 30,
      });

      expect(res.isError).toBeFalsy();
      expect(res.content).toBeDefined();
      const markdown = res.content[0].text;

      // Verify Markdown content & structure
      expect(markdown).toContain("# Schedule Comparison");
      expect(markdown).toContain("Sarah");
      expect(markdown).toContain("Recommended Mutual Free Slots");
    }, 15000);

    it("returns error message when target nickname is unknown and not an email", async () => {
      const server = await createCalendarMcpServer({ sub: testUserId });
      const tool = getRegisteredTools(server)["compare_schedules"];

      const res = await tool.handler({
        targetUser: "unknown_coworker_404",
        date: "2026-10-20",
      });

      expect(res.isError).toBe(true);
      expect(res.content[0].text).toContain("Could not find any teammate or contact");
    }, 15000);

    it("incorporates roomId and suggestedTitle into schedule comparison and UI", async () => {
      const server = await createCalendarMcpServer({ sub: testUserId });
      const tool = getRegisteredTools(server)["compare_schedules"];

      const res = await tool.handler({
        targetUser: "sarah",
        date: "2026-10-20",
        roomId: "room_1",
        suggestedTitle: "Quarterly Strategy Sync: Alice & Sarah",
        suggestedAgenda: "Review Q4 roadmap milestones",
      });

      expect(res.isError).toBeFalsy();
      const markdown = res.content[0].text;
      expect(markdown).toContain("Quarterly Strategy Sync: Alice & Sarah");
      expect(markdown).toContain("Suggested Title");
      expect(res.structuredContent).toBeDefined();
      expect(res.structuredContent?.selectedRoomId).toBe("room_1");
      expect(res.structuredContent?.suggestedTitle).toBe("Quarterly Strategy Sync: Alice & Sarah");
      expect(res.structuredContent?.suggestedAgenda).toBe("Review Q4 roadmap milestones");
    }, 15000);
  });

  describe("create_shareable_booking_link tool", () => {
    it("generates a shareable booking link with slug and markdown link", async () => {
      const server = await createCalendarMcpServer({ sub: testUserId });
      const tool = getRegisteredTools(server)["create_shareable_booking_link"];

      const res = await tool.handler({
        title: "Product Design Review",
        description: "Discussing v2 UI wireframes and token styles",
        durationMinutes: 45,
        memberEmails: ["sarah"], // Nickname
        locationType: "meet",
      });

      expect(res.content).toBeDefined();
      const parsed = JSON.parse(res.content[0].text);
      expect(parsed.slug).toBeDefined();
      expect(parsed.bookingUrl).toContain(`/book/${parsed.slug}`);
      expect(parsed.markdownLink).toContain(`[Book Meeting: Product Design Review]`);
      expect(parsed.duration).toBe(45);
      expect(parsed.locationType).toBe("meet");
    }, 15000);
  });

  describe("book_meeting tool with smart attendee resolution", () => {
    it("resolves nickname attendees and books Google Calendar meeting", async () => {
      const server = await createCalendarMcpServer({ sub: testUserId });
      const tool = getRegisteredTools(server)["book_meeting"];

      const res = await tool.handler({
        summary: "Quarterly Planning Sync",
        description: "Review MCP deliverables and timeline",
        start: "2026-10-20T14:00:00.000Z",
        end: "2026-10-20T15:00:00.000Z",
        attendees: ["sarah"], // Nickname
      });

      expect(res.isError).toBeFalsy();
      const parsed = JSON.parse(res.content[0].text);
      expect(parsed.message).toContain("successfully");
      expect(parsed.eventId).toBeDefined();
      expect(parsed.meetingUrl).toBeDefined();
      // Attendees should include Sarah's resolved email
      const attendeeEmails = parsed.attendees.map((a: string | { email: string }) =>
        typeof a === "string" ? a : a.email
      );
      expect(attendeeEmails.some((e: string) => e.includes("sarah"))).toBe(true);
    }, 15000);

    it("links meeting to project and updates via reschedule_meeting tool", async () => {
      const server = await createCalendarMcpServer({ sub: testUserId });
      const tools = getRegisteredTools(server);

      // Ensure test team exists with unique name/slug
      const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const testTeam = await TeamService.createTeam({
        name: `Calendar Link Team ${uniqueSuffix}`,
        slug: `cal-team-${uniqueSuffix}`,
        ownerId: testUserId,
      });

      // Create a test project via MCP tool
      const projRes = await tools["create_project"].handler({
        teamId: testTeam.id,
        name: "Calendar MCP Integration",
        slug: `cal-mcp-${uniqueSuffix}`,
      });
      const projData = JSON.parse(projRes.content[0].text);

      // Book meeting linked to project
      const bookRes = await tools["book_meeting"].handler({
        summary: "Sprint Kickoff",
        description: "Initial sprint discussion",
        start: "2026-10-21T09:00:00.000Z",
        end: "2026-10-21T10:00:00.000Z",
        attendees: ["sarah"],
        projectId: projData.project.id,
      });

      expect(bookRes.isError).toBeFalsy();
      const booked = JSON.parse(bookRes.content[0].text);
      expect(booked.projectId).toBe(projData.project.id);
      expect(booked.projectName).toBe("Calendar MCP Integration");
      expect(booked.summary).toContain("[Calendar MCP Integration]");

      // Reschedule and verify project link is retained or updated
      const reschedRes = await tools["reschedule_meeting"].handler({
        eventId: booked.eventId,
        newStart: "2026-10-21T10:00:00.000Z",
        newEnd: "2026-10-21T11:00:00.000Z",
        projectId: projData.project.id,
      });

      expect(reschedRes.isError).toBeFalsy();
      const resched = JSON.parse(reschedRes.content[0].text);
      expect(resched.projectId).toBe(projData.project.id);
      expect(resched.projectName).toBe("Calendar MCP Integration");
    }, 15000);
  });

  describe("buildScheduleComparisonMarkdown utility", () => {
    it("produces valid Markdown with profile and mutual slots", () => {
      const markdown = buildScheduleComparisonMarkdown({
        currentUser: {
          name: "Alice Developer",
          email: "alice@example.com",
        },
        targetUser: {
          name: "Bob Manager",
          email: "bob@example.com",
          title: "Engineering Manager",
        },
        dateStr: "2026-10-20",
        currentUserBusy: [{ start: "2026-10-20T09:00:00.000Z", end: "2026-10-20T10:00:00.000Z" }],
        targetUserBusy: [{ start: "2026-10-20T11:00:00.000Z", end: "2026-10-20T12:00:00.000Z" }],
        mutualSlots: [
          { start: "2026-10-20T10:00:00.000Z", end: "2026-10-20T10:30:00.000Z" },
          { start: "2026-10-20T14:00:00.000Z", end: "2026-10-20T14:30:00.000Z" },
        ],
        durationMinutes: 30,
      });

      expect(markdown).toContain("# Schedule Comparison");
      expect(markdown).toContain("Alice Developer");
      expect(markdown).toContain("Bob Manager");
      expect(markdown).toContain("30 minutes");
      expect(markdown).toContain("Recommended Mutual Free Slots");
    });

    it("handles 3 or more people in schedule comparison markdown", () => {
      const markdown = buildScheduleComparisonMarkdown({
        currentUser: { name: "Alice Developer", email: "alice@example.com" },
        targetUser: { name: "Bob Manager", email: "bob@example.com" },
        allAttendees: [
          { name: "Bob Manager", email: "bob@example.com" },
          { name: "Charlie Designer", email: "charlie@example.com" },
        ],
        dateStr: "2026-10-20",
        mutualSlots: [{ start: "2026-10-20T10:00:00.000Z", end: "2026-10-20T10:30:00.000Z" }],
        durationMinutes: 30,
      });

      expect(markdown).toContain(
        "# Schedule Comparison: Alice Developer, Bob Manager & Charlie Designer"
      );
    });

    it("handles empty busy blocks gracefully displaying no mutual free slots message", () => {
      const markdown = buildScheduleComparisonMarkdown({
        currentUser: { name: "Solo", email: "solo@example.com" },
        targetUser: { name: "Free Person", email: "free@example.com" },
        dateStr: "2026-10-20",
        currentUserBusy: [],
        targetUserBusy: [],
        mutualSlots: [],
        durationMinutes: 30,
      });

      expect(markdown).toContain("# Schedule Comparison: Solo & Free Person");
      expect(markdown).toContain("No mutual free slots found");
    });
  });

  describe("buildPersonalCalendarMarkdown utility", () => {
    it("renders personal calendar Markdown agenda", () => {
      const markdown = buildPersonalCalendarMarkdown({
        user: { name: "Alex Morgan", email: "alex.morgan@example.com" },
        baseDate: "2026-10-16",
        events: [
          {
            title: "Sprint Planning",
            start: "2026-10-16T09:00:00.000Z",
            end: "2026-10-16T10:00:00.000Z",
            meetingUrl: "https://meet.google.com/abc-defg-hij",
            location: "Room Saigon 14",
          },
          {
            title: "Architecture Review",
            start: "2026-10-16T14:00:00.000Z",
            end: "2026-10-16T15:00:00.000Z",
          },
        ],
      });

      expect(markdown).toContain("# Calendar Agenda: Alex Morgan");
      expect(markdown).toContain("Sprint Planning");
      expect(markdown).toContain("Architecture Review");
      expect(markdown).toContain("[Join Meeting](https://meet.google.com/abc-defg-hij)");
    });
  });

  describe("buildTaskBoardMarkdown utility", () => {
    it("buildTaskBoardMarkdown renders duration and active timer indicators", () => {
      const md = buildTaskBoardMarkdown({
        teamName: "Core Team",
        tasks: [
          {
            id: "task-1",
            title: "Active Working Task",
            status: "in_progress",
            priority: "high",
            estimatedMinutes: 120,
            totalSpentSeconds: 6300,
            activeSessionStartedAt: new Date().toISOString(),
          },
        ],
      });
      expect(md).toContain("⏱ 1h 45m / 2h");
      expect(md).toContain("(active timer)");
    });
  });

  describe("get_my_agenda tool with Markdown agenda output", () => {
    it("returns Markdown agenda calendar", async () => {
      const server = await createCalendarMcpServer({ sub: testUserId });
      const tool = getRegisteredTools(server)["get_my_agenda"];

      const res = await tool.handler({
        date: "2026-10-20",
        days: 7,
      });

      expect(res.isError).toBeFalsy();
      expect(res.content).toBeDefined();
      const text = res.content[0].text;
      expect(text).toContain("# Calendar Agenda");
    }, 15000);
  });

  describe("Task Management MCP Tools Suite", () => {
    let testTeamId: string;

    beforeEach(async () => {
      const userTeams = await TeamService.listUserTeams(testUserId);
      if (userTeams.length > 0) {
        testTeamId = userTeams[0].id;
      } else {
        const newTeam = await TeamService.createTeam({
          name: "MCP Engineering",
          ownerId: testUserId,
          description: "Engineering team for MCP testing",
        });
        testTeamId = newTeam.id;
      }
    });

    it("list_teams returns teams accessible to user", async () => {
      const server = await createCalendarMcpServer({ sub: testUserId });
      const tool = getRegisteredTools(server)["list_teams"];

      const res = await tool.handler({});
      expect(res.content).toBeDefined();

      const parsed = JSON.parse(res.content[0].text);
      expect(parsed.count).toBeGreaterThan(0);
      expect(parsed.teams.some((t: { id: string }) => t.id === testTeamId)).toBe(true);
    });

    it("create_project and list_projects manage team projects", async () => {
      const server = await createCalendarMcpServer({ sub: testUserId });
      const createProjectTool = getRegisteredTools(server)["create_project"];
      const listProjectsTool = getRegisteredTools(server)["list_projects"];

      const projName = `Backend Optimization ${Date.now()}`;
      const createRes = await createProjectTool.handler({
        teamId: testTeamId,
        name: projName,
        description: "Improve response latency",
        status: "active",
        color: "#2563eb",
      });
      const createdParsed = JSON.parse(createRes.content[0].text);
      expect(createdParsed.project.id).toBeDefined();
      expect(createdParsed.project.name).toBe(projName);

      const listRes = await listProjectsTool.handler({
        teamId: testTeamId,
        status: "active",
      });
      const listParsed = JSON.parse(listRes.content[0].text);
      expect(listParsed.projects.length).toBeGreaterThan(0);
      expect(
        listParsed.projects.some((p: { id: string }) => p.id === createdParsed.project.id)
      ).toBe(true);
    });

    it("create_task, list_tasks, update_task, and get_task_board lifecycle", async () => {
      const server = await createCalendarMcpServer({ sub: testUserId });
      const createProjectTool = getRegisteredTools(server)["create_project"];
      const createTaskTool = getRegisteredTools(server)["create_task"];
      const listTasksTool = getRegisteredTools(server)["list_tasks"];
      const updateTaskTool = getRegisteredTools(server)["update_task"];
      const getBoardTool = getRegisteredTools(server)["get_task_board"];

      // Setup a project for testTeamId
      const projRes = await createProjectTool.handler({
        teamId: testTeamId,
        name: `Core Project ${Date.now()}`,
        status: "active",
      });
      const projParsed = JSON.parse(projRes.content[0].text);
      const testProjectId = projParsed.project.id;

      // 1a. If user/client does not specify which project, create_task returns project options to select from
      const noProjRes = await createTaskTool.handler({
        teamId: testTeamId,
        title: "Implement MCP Task Tools",
      });
      const noProjParsed = JSON.parse(noProjRes.content[0].text);
      expect(noProjParsed.requiresProjectSelection).toBe(true);
      expect(noProjParsed.projects.length).toBeGreaterThan(0);
      expect(noProjParsed.projects.some((p: { id: string }) => p.id === testProjectId)).toBe(true);

      // 1b. Create Task with required projectId
      const createRes = await createTaskTool.handler({
        teamId: testTeamId,
        projectId: testProjectId,
        title: "Implement MCP Task Tools",
        description: "Expose 7 MCP task management tools",
        status: "todo",
        priority: "high",
        assigneeId: "me",
        dueDate: "2026-11-01T00:00:00.000Z",
      });
      const createdParsed = JSON.parse(createRes.content[0].text);
      const taskId = createdParsed.task.id;
      expect(taskId).toBeDefined();
      expect(createdParsed.task.projectId).toBe(testProjectId);
      expect(createdParsed.task.priority).toBe("high");
      expect(createdParsed.task.assigneeId).toBe(testUserId);

      // 2. List Tasks (with direct user & priority filtering, optional teamId)
      const listRes = await listTasksTool.handler({
        user: "me",
        status: "todo",
        priority: "high",
      });
      const listParsed = JSON.parse(listRes.content[0].text);
      expect(listParsed.tasks.some((t: { id: string }) => t.id === taskId)).toBe(true);

      // 3a. If user wants to update/assign project without specifying which project, update_task returns options
      const updateNoProjRes = await updateTaskTool.handler({
        taskId,
        projectId: "",
      });
      const updateNoProjParsed = JSON.parse(updateNoProjRes.content[0].text);
      expect(updateNoProjParsed.requiresProjectSelection).toBe(true);
      expect(updateNoProjParsed.projects.length).toBeGreaterThan(0);

      // 3b. Update Task
      const updateRes = await updateTaskTool.handler({
        taskId,
        status: "in_progress",
        title: "Implement MCP Task Tools (In Progress)",
      });
      const updatedParsed = JSON.parse(updateRes.content[0].text);
      expect(updatedParsed.task.status).toBe("in_progress");
      expect(updatedParsed.task.title).toBe("Implement MCP Task Tools (In Progress)");

      // 4. Get Task Board View
      const boardRes = await getBoardTool.handler({
        teamId: testTeamId,
      });
      expect(boardRes.content.length).toBeGreaterThanOrEqual(2);
      expect(boardRes.content[0].text).toContain("# Task Board:");
      expect(boardRes.content[0].text).toContain("Implement MCP Task Tools (In Progress)");

      // 5. Reject cross-team projectId on create_task and update_task
      await expect(
        createTaskTool.handler({
          teamId: testTeamId,
          title: "Invalid Project Task",
          projectId: "proj_nonexistent_other_team",
        })
      ).rejects.toThrow("not found in team");

      await expect(
        updateTaskTool.handler({
          taskId,
          projectId: "proj_nonexistent_other_team",
        })
      ).rejects.toThrow("not found in task's team");
    });

    it("get_active_tasks, get_task_timeline, and time tracking parity in list_tasks and get_task_board", async () => {
      const server = await createCalendarMcpServer({ sub: testUserId });
      const createProjectTool = getRegisteredTools(server)["create_project"];
      const createTaskTool = getRegisteredTools(server)["create_task"];
      const updateTaskTool = getRegisteredTools(server)["update_task"];
      const listTasksTool = getRegisteredTools(server)["list_tasks"];
      const getBoardTool = getRegisteredTools(server)["get_task_board"];
      const getActiveTasksTool = getRegisteredTools(server)["get_active_tasks"];
      const getTaskTimelineTool = getRegisteredTools(server)["get_task_timeline"];

      // Setup project
      const projRes = await createProjectTool.handler({
        teamId: testTeamId,
        name: `Time Tracking Project ${Date.now()}`,
        status: "active",
      });
      const testProjectId = JSON.parse(projRes.content[0].text).project.id;

      // Create a task
      const createRes = await createTaskTool.handler({
        teamId: testTeamId,
        projectId: testProjectId,
        title: "Tracked Feature Work",
        status: "todo",
        priority: "medium",
        estimatedMinutes: 90,
      });
      const taskId = JSON.parse(createRes.content[0].text).task.id;

      // 1. Move to in_progress (creates active task_time_session)
      await updateTaskTool.handler({
        taskId,
        status: "in_progress",
      });

      // 2. get_active_tasks should return the task
      expect(getActiveTasksTool).toBeDefined();
      const activeRes = await getActiveTasksTool.handler({
        teamId: testTeamId,
      });
      const activeParsed = JSON.parse(activeRes.content[0].text);
      expect(activeParsed.activeTasks.length).toBeGreaterThan(0);
      const activeTask = activeParsed.activeTasks.find((t: { id: string }) => t.id === taskId);
      expect(activeTask).toBeDefined();
      expect(activeTask.activeSessionStartedAt).toBeDefined();
      expect(typeof activeTask.elapsedSessionSeconds).toBe("number");
      expect(typeof activeTask.totalSpentSeconds).toBe("number");
      expect(activeTask.budgetStatus).toBeDefined();
      expect(activeTask.budgetStatus.estimatedMinutes).toBe(90);

      // 3. get_task_timeline should return sessions
      expect(getTaskTimelineTool).toBeDefined();
      const timelineRes = await getTaskTimelineTool.handler({
        taskId,
      });
      const timelineParsed = JSON.parse(timelineRes.content[0].text);
      expect(timelineParsed.task.id).toBe(taskId);
      expect(timelineParsed.sessions.length).toBeGreaterThan(0);
      expect(typeof timelineParsed.totalSpentSeconds).toBe("number");
      expect(typeof timelineParsed.budgetVarianceSeconds).toBe("number");

      // 4. list_tasks with hasActiveSession filter and time fields
      const listActiveRes = await listTasksTool.handler({
        teamId: testTeamId,
        hasActiveSession: true,
      });
      const listActiveParsed = JSON.parse(listActiveRes.content[0].text);
      expect(listActiveParsed.tasks.some((t: { id: string }) => t.id === taskId)).toBe(true);
      const foundTask = listActiveParsed.tasks.find((t: { id: string }) => t.id === taskId);
      expect(foundTask.estimatedMinutes).toBe(90);
      expect(foundTask.activeSessionStartedAt).toBeDefined();
      expect(typeof foundTask.totalSpentSeconds).toBe("number");

      const listInactiveRes = await listTasksTool.handler({
        teamId: testTeamId,
        hasActiveSession: false,
      });
      const listInactiveParsed = JSON.parse(listInactiveRes.content[0].text);
      expect(listInactiveParsed.tasks.some((t: { id: string }) => t.id === taskId)).toBe(false);

      // 5. get_task_board includes time metrics in structuredContent and markdown
      const boardRes = await getBoardTool.handler({
        teamId: testTeamId,
      });
      const boardStructured = boardRes.structuredContent as {
        tasks: Array<{
          id: string;
          totalSpentSeconds?: number;
          activeSessionStartedAt?: string | null;
          estimatedMinutes?: number;
        }>;
      };
      const boardTask = boardStructured.tasks.find((t) => t.id === taskId);
      expect(boardTask).toBeDefined();
      expect(boardTask?.estimatedMinutes).toBe(90);
      expect(boardTask?.activeSessionStartedAt).toBeDefined();
      expect(typeof boardTask?.totalSpentSeconds).toBe("number");
      expect(boardRes.content[0].text).toContain("Tracked Feature Work");
      expect(boardRes.content[0].text).toContain("⏱");
    });
  });

  describe("SEP-1865 MCP Apps UI Handshake & Escape Security", () => {
    it("embeds SEP-1865 JSON-RPC handshake (ui/initialize & ui/notifications/initialized) and escapes XSS via React SSR + shadcn/ui", () => {
      const agendaHtml = getAgendaUiHtml({
        user: { name: "Alice" },
        baseDate: "2026-10-21",
        events: [
          {
            title: "<script>alert(1)</script>",
            start: "2026-10-21T02:00:00.000Z",
            end: "2026-10-21T05:00:00.000Z",
          },
        ],
      });
      expect(agendaHtml).toContain('data-slot="card"');
      expect(agendaHtml).toContain('data-slot="badge"');
      expect(agendaHtml).toContain("ui/initialize");
      expect(agendaHtml).toContain("ui/notifications/initialized");
      expect(agendaHtml).toContain("2026-01-26");
      expect(agendaHtml).toContain("\\u003cscript>alert(1)\\u003c/script>");
      expect(agendaHtml).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");

      const scheduleHtml = getScheduleUiHtml({ mutualSlots: [] });
      expect(scheduleHtml).toContain('data-slot="card"');
      expect(scheduleHtml).toContain("ui/initialize");
      expect(scheduleHtml).toContain("tools/call");
      expect(scheduleHtml).toContain("ui/message");
      expect(scheduleHtml).toContain("book_meeting");
      expect(scheduleHtml).toContain("mtg-agenda");
      expect(scheduleHtml).toContain("roomEmail");

      const fivePersonScheduleHtml = getScheduleUiHtml({
        currentUser: { name: "User 1", email: "user1@example.com" },
        allAttendees: [
          { name: "User 2", email: "user2@example.com" },
          { name: "User 3", email: "user3@example.com" },
          { name: "User 4", email: "user4@example.com" },
          { name: "User 5", email: "user5@example.com" },
        ],
        mutualSlots: [],
      });
      expect(fivePersonScheduleHtml).toContain("window.__MCP_DATA__ =");
      expect(fivePersonScheduleHtml).toContain("User 1, User 2, User 3, User 4 &amp; User 5");

      const taskHtml = getTaskBoardUiHtml({ teamName: "Core", tasks: [] });
      expect(taskHtml).toContain('data-slot="card"');
      expect(taskHtml).toContain("ui/initialize");
      expect(taskHtml).toContain("draggable");
      expect(taskHtml).toContain("update_task");
      expect(taskHtml).toContain("Cancelled");
    });

    it("renders task-board-app with live timer, progress bar, and time tracking elements in SSR HTML", () => {
      const htmlBlue = getTaskBoardUiHtml({
        teamName: "Core Team",
        tasks: [
          {
            id: "t-1",
            title: "Test In-Progress Task",
            status: "in_progress",
            estimatedMinutes: 60,
            totalSpentSeconds: 1800,
            activeSessionStartedAt: new Date().toISOString(),
          },
        ],
      });
      expect(htmlBlue).toContain('data-testid="task-timer"');
      expect(htmlBlue).toContain('data-testid="task-progress"');
      expect(htmlBlue).toContain("bg-blue-500");

      const htmlAmber = getTaskBoardUiHtml({
        teamName: "Core Team",
        tasks: [
          {
            id: "t-2",
            title: "Warning Task",
            status: "in_progress",
            estimatedMinutes: 60,
            totalSpentSeconds: 3000,
            activeSessionStartedAt: null,
          },
        ],
      });
      expect(htmlAmber).toContain("bg-amber-500");

      const htmlRed = getTaskBoardUiHtml({
        teamName: "Core Team",
        tasks: [
          {
            id: "t-3",
            title: "Over Budget Task",
            status: "in_progress",
            estimatedMinutes: 60,
            totalSpentSeconds: 4000,
            activeSessionStartedAt: null,
          },
        ],
      });
      expect(htmlRed).toContain("bg-red-500");
    });
  });

  describe("MCP Prompts & Workflow Suite", () => {
    it("registers book_meeting_flow prompt with conversational guidance", async () => {
      const server = await createCalendarMcpServer({ sub: testUserId });
      const registeredPrompts = (
        server as unknown as {
          _registeredPrompts: Record<
            string,
            { handler: (args: Record<string, unknown>) => Promise<{ messages: { content: { text: string } }[] }> }
          >;
        }
      )._registeredPrompts;
      expect(registeredPrompts).toBeDefined();
      expect(registeredPrompts["book_meeting_flow"]).toBeDefined();

      const promptDef = registeredPrompts["book_meeting_flow"];
      const promptResult = await promptDef.handler({ targetUser: "alex morgan", date: "today" });
      expect(promptResult.messages).toHaveLength(1);
      expect(promptResult.messages[0].content.text).toContain("alex morgan");
      expect(promptResult.messages[0].content.text).toContain("offline meeting room or online");
      expect(promptResult.messages[0].content.text).toContain("minCapacity");
    });

    it("registers create_task_flow prompt with project selection guidance", async () => {
      const server = await createCalendarMcpServer({ sub: testUserId });
      const registeredPrompts = (
        server as unknown as {
          _registeredPrompts: Record<
            string,
            { handler: (args: Record<string, unknown>) => Promise<{ messages: { content: { text: string } }[] }> }
          >;
        }
      )._registeredPrompts;
      expect(registeredPrompts).toBeDefined();
      expect(registeredPrompts["create_task_flow"]).toBeDefined();

      const promptDef = registeredPrompts["create_task_flow"];
      const promptResult = await promptDef.handler({ teamId: "eng-team", title: "Write API docs" });
      expect(promptResult.messages).toHaveLength(1);
      expect(promptResult.messages[0].content.text).toContain("Write API docs");
      expect(promptResult.messages[0].content.text).toContain("Every task requires a project");
    });
  });
});
