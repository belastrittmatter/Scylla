import { isNull } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  index,
  integer,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./schema-auth";

// ---------------------------------------------------------------------------
// 7. Teams, Team Members, Projects, and Tasks
// ---------------------------------------------------------------------------

export const team = pgTable(
  "team",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("team_slug_idx").on(table.slug),
    index("team_owner_id_idx").on(table.ownerId),
  ],
);

export const teamMember = pgTable(
  "team_member",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"), // "owner" | "admin" | "member" | "viewer"
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("team_member_team_id_idx").on(table.teamId),
    index("team_member_user_id_idx").on(table.userId),
    uniqueIndex("team_member_team_user_idx").on(table.teamId, table.userId),
  ],
);

export const project = pgTable(
  "project",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("active"), // "planning" | "active" | "paused" | "completed" | "archived"
    color: text("color"),
    githubRepo: text("github_repo"), // canonical "owner/repo"
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("project_team_id_idx").on(table.teamId),
    uniqueIndex("project_team_slug_idx").on(table.teamId, table.slug),
  ],
);

export const task = pgTable(
  "task",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").notNull().default("todo"), // "todo" | "in_progress" | "in_review" | "done" | "cancelled"
    priority: text("priority").notNull().default("medium"), // "low" | "medium" | "high" | "urgent"
    projectId: text("project_id").references(() => project.id, {
      onDelete: "cascade",
    }),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    creatorId: text("creator_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    assigneeId: text("assignee_id").references(() => user.id, {
      onDelete: "set null",
    }),
    dueDate: timestamp("due_date"),
    startDate: timestamp("start_date"),
    position: integer("position").default(0).notNull(),
    estimatedMinutes: integer("estimated_minutes").default(60),
    githubRepo: text("github_repo"), // repository the task's issue lives in
    githubIssueNumber: integer("github_issue_number"),
    githubIssueUrl: text("github_issue_url"),
    githubBranch: text("github_branch"),
    githubPrNumber: integer("github_pr_number"),
    githubPrUrl: text("github_pr_url"),
    githubPrStatus: text("github_pr_status"), // "open" | "draft" | "merged" | "closed"
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("task_team_id_idx").on(table.teamId),
    index("task_project_id_idx").on(table.projectId),
    index("task_assignee_id_idx").on(table.assigneeId),
    index("task_status_idx").on(table.status),
    index("task_priority_idx").on(table.priority),
    index("task_github_issue_idx").on(table.projectId, table.githubIssueNumber),
  ],
);

export const taskComment = pgTable(
  "task_comment",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    taskId: text("task_id")
      .notNull()
      .references(() => task.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    githubCommentId: text("github_comment_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("task_comment_task_id_idx").on(table.taskId),
    index("task_comment_user_id_idx").on(table.userId),
  ],
);

export const taskTimeSession = pgTable(
  "task_time_session",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    taskId: text("task_id")
      .notNull()
      .references(() => task.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    endedAt: timestamp("ended_at"),
    durationSeconds: integer("duration_seconds").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("task_time_session_task_id_idx").on(table.taskId),
    index("task_time_session_started_at_idx").on(table.startedAt),
    uniqueIndex("task_time_session_active_task_idx")
      .on(table.taskId)
      .where(isNull(table.endedAt)),
  ],
);

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------
