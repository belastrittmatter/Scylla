import { db } from "@/db";
import { user, team, teamMember, project, task } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function seedDefaultWorkspace(currentUserId?: string): Promise<void> {
  // 1. Identify primary user
  let primaryUser = currentUserId
    ? (await db.select().from(user).where(eq(user.id, currentUserId)))[0]
    : (await db.select().from(user).limit(1))[0];

  if (!primaryUser) {
    const [created] = await db
      .insert(user)
      .values({
        id: "usr-primary",
        name: "Alex Morgan",
        email: "alex.morgan@example.com",
        emailVerified: true,
        role: "admin",
      })
      .returning();
    primaryUser = created;
  }

  // 2. Ensure default team members exist
  const defaultTeammates = [
    {
      id: "usr-olivia",
      name: "Olivia Chen",
      email: "olivia.chen@example.com",
      role: "Product Manager",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    },
    {
      id: "usr-riley",
      name: "Riley Cooper",
      email: "riley.cooper@example.com",
      role: "Fullstack Engineer",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
    {
      id: "usr-jordan",
      name: "Jordan Lee",
      email: "jordan.lee@example.com",
      role: "Frontend Engineer",
      image:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
    {
      id: "usr-taylor",
      name: "Taylor Reed",
      email: "taylor.reed@example.com",
      role: "AI Lead",
      image:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    },
  ];

  const teammateIds: Record<string, string> = {};
  for (const tm of defaultTeammates) {
    const [existing] = await db.select().from(user).where(eq(user.email, tm.email)).limit(1);
    if (existing) {
      teammateIds[tm.id] = existing.id;
    } else {
      await db
        .insert(user)
        .values({
          id: tm.id,
          name: tm.name,
          email: tm.email,
          emailVerified: true,
          role: "member",
          image: tm.image,
        })
        .onConflictDoNothing();
      teammateIds[tm.id] = tm.id;
    }
  }

  // 3. Create Teams
  const [engTeam] = await db
    .insert(team)
    .values({
      id: "team-eng-core",
      name: "Engineering Core",
      slug: "engineering-core",
      description: "Core platform, infrastructure, MCP protocol bridges & web services",
      ownerId: primaryUser.id,
    })
    .onConflictDoNothing()
    .returning();

  await db
    .insert(team)
    .values({
      id: "team-product-design",
      name: "Product & Design",
      slug: "product-design",
      description: "UX design systems, user journey workflows, and interface standards",
      ownerId: primaryUser.id,
    })
    .onConflictDoNothing();

  const activeTeamId = engTeam ? engTeam.id : "team-eng-core";

  // 4. Add Team Members
  const allUsers = await db.select().from(user);
  for (const u of allUsers) {
    await db
      .insert(teamMember)
      .values({
        teamId: activeTeamId,
        userId: u.id,
        role: u.id === primaryUser.id ? "owner" : "member",
      })
      .onConflictDoNothing();
  }

  const designMembers = [
    { userId: primaryUser.id, role: "owner" as const },
    { userId: teammateIds["usr-olivia"], role: "member" as const },
    { userId: teammateIds["usr-jordan"], role: "member" as const },
  ];
  for (const dm of designMembers) {
    await db
      .insert(teamMember)
      .values({
        teamId: "team-product-design",
        userId: dm.userId,
        role: dm.role,
      })
      .onConflictDoNothing();
  }

  // 5. Create Projects
  const [mcpProj] = await db
    .insert(project)
    .values({
      id: "proj-mcp-bridge",
      name: "MCP Client Protocol Bridge",
      slug: "mcp-client-bridge",
      description: "Production MCP server implementation, tool router, and token cost benchmarking",
      teamId: activeTeamId,
      status: "active",
      color: "#3b82f6",
    })
    .onConflictDoNothing()
    .returning();

  const [kanbanProj] = await db
    .insert(project)
    .values({
      id: "proj-kanban-dashboard",
      name: "Task & Workspace Dashboard",
      slug: "task-workspace-dashboard",
      description: "Responsive Next.js 15 Kanban board, dense spreadsheet table, and task drawer",
      teamId: activeTeamId,
      status: "active",
      color: "#10b981",
    })
    .onConflictDoNothing()
    .returning();

  const [calendarProj] = await db
    .insert(project)
    .values({
      id: "proj-calendar-sync",
      name: "Google Calendar & Room Sync",
      slug: "calendar-room-sync",
      description: "Bidirectional calendar sync, visual timeline scheduler, and room availability",
      teamId: activeTeamId,
      status: "planning",
      color: "#8b5cf6",
    })
    .onConflictDoNothing()
    .returning();

  const activeMcpProjId = mcpProj?.id || "proj-mcp-bridge";
  const activeKanbanProjId = kanbanProj?.id || "proj-kanban-dashboard";
  const activeCalProjId = calendarProj?.id || "proj-calendar-sync";

  // 6. Create Seed Tasks
  const now = Date.now();
  const seedTasks = [
    {
      id: "task-101",
      title: "Implement Model Context Protocol (MCP) tool router",
      description: "Standardize JSON-RPC handler for agenda, booking, and room query tools",
      status: "in_progress",
      priority: "urgent",
      projectId: activeMcpProjId,
      teamId: activeTeamId,
      creatorId: primaryUser.id,
      assigneeId: teammateIds["usr-olivia"],
      dueDate: new Date(now + 86400000 * 2),
      position: 0,
    },
    {
      id: "task-102",
      title: "Database schema migration for team and task tables",
      description: "Add Drizzle ORM definitions, foreign keys, and indexes for teams and projects",
      status: "done",
      priority: "high",
      projectId: activeMcpProjId,
      teamId: activeTeamId,
      creatorId: primaryUser.id,
      assigneeId: primaryUser.id,
      dueDate: new Date(now - 86400000),
      position: 1,
    },
    {
      id: "task-103",
      title: "Design shadcn Task Drawer with responsive Base UI gestures",
      description: "Refactor drawer to slide-over with swipeDirection right and hotkeys",
      status: "done",
      priority: "medium",
      projectId: activeKanbanProjId,
      teamId: activeTeamId,
      creatorId: primaryUser.id,
      assigneeId: teammateIds["usr-jordan"],
      dueDate: new Date(now + 86400000 * 4),
      position: 2,
    },
    {
      id: "task-104",
      title: "Optimize token budget tracking in agentic timesheet pipeline",
      description:
        "Ensure test runner and sync workspace commands execute strictly within token budget",
      status: "todo",
      priority: "medium",
      projectId: activeKanbanProjId,
      teamId: activeTeamId,
      creatorId: primaryUser.id,
      assigneeId: teammateIds["usr-riley"],
      dueDate: new Date(now + 86400000 * 7),
      position: 3,
    },
    {
      id: "task-105",
      title: "Build bidirectional Google Calendar sync engine with Meet links",
      description: "Auto-generate conferenceData and sync attendees across organizational accounts",
      status: "in_review",
      priority: "high",
      projectId: activeCalProjId,
      teamId: activeTeamId,
      creatorId: primaryUser.id,
      assigneeId: teammateIds["usr-taylor"],
      dueDate: new Date(now + 86400000 * 3),
      position: 4,
    },
    {
      id: "task-106",
      title: "Audit WCAG 2.1 AA accessibility on interactive Kanban cards",
      description:
        "Verify ARIA roles, drag handles, color contrasts, and keyboard navigation tab stops",
      status: "todo",
      priority: "low",
      projectId: activeKanbanProjId,
      teamId: activeTeamId,
      creatorId: primaryUser.id,
      assigneeId: teammateIds["usr-jordan"],
      dueDate: new Date(now + 86400000 * 10),
      position: 5,
    },
  ];

  for (const t of seedTasks) {
    await db.insert(task).values(t).onConflictDoNothing();
  }
}
