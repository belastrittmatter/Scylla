import { relations, isNull } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  integer,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// 1. Better Auth Tables (User Identity, Sessions, Accounts, Verification)
// ---------------------------------------------------------------------------

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  timezone: text("timezone").default("Asia/Ho_Chi_Minh").notNull(),
  role: text("role").default("member").notNull(), // "admin" | "member"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

// Better Auth API Key / Bearer Token plugin for AI Clients & MCP
export const apikey = pgTable(
  "apikey",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    start: text("start"),
    prefix: text("prefix"),
    key: text("key").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    refillInterval: integer("refill_interval"),
    refillAmount: integer("refill_amount"),
    lastRefillAt: timestamp("last_refill_at"),
    enabled: boolean("enabled").notNull().default(true),
    rateLimitEnabled: boolean("rate_limit_enabled").default(false),
    rateLimitTimeWindow: integer("rate_limit_time_window"),
    rateLimitMax: integer("rate_limit_max"),
    requestCount: integer("request_count").default(0),
    remaining: integer("remaining"),
    lastRequest: timestamp("last_request"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("apikey_userId_idx").on(table.userId)],
);

// ---------------------------------------------------------------------------
// Better Auth MCP / OAuth 2.1 Provider Tables
// ---------------------------------------------------------------------------

export const jwks = pgTable("jwks", {
  id: text("id").primaryKey(),
  publicKey: text("public_key").notNull(),
  privateKey: text("private_key").notNull(),
  createdAt: timestamp("created_at").notNull(),
  expiresAt: timestamp("expires_at"),
  alg: text("alg"),
  crv: text("crv"),
});

export const oauthClient = pgTable(
  "oauth_client",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id").notNull().unique(),
    clientSecret: text("client_secret"),
    clientDiscoveryId: text("client_discovery_id"),
    disabled: boolean("disabled").default(false),
    skipConsent: boolean("skip_consent"),
    enableEndSession: boolean("enable_end_session"),
    subjectType: text("subject_type"),
    scopes: text("scopes").array(),
    clientCredentialsScopes: text("client_credentials_scopes").array(),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
    name: text("name"),
    uri: text("uri"),
    icon: text("icon"),
    contacts: text("contacts").array(),
    tos: text("tos"),
    policy: text("policy"),
    softwareId: text("software_id"),
    softwareVersion: text("software_version"),
    softwareStatement: text("software_statement"),
    redirectUris: text("redirect_uris").array().notNull(),
    postLogoutRedirectUris: text("post_logout_redirect_uris").array(),
    backchannelLogoutUri: text("backchannel_logout_uri"),
    backchannelLogoutSessionRequired: boolean(
      "backchannel_logout_session_required",
    ),
    tokenEndpointAuthMethod: text("token_endpoint_auth_method"),
    applicationType: text("application_type"),
    jwks: text("jwks"),
    jwksUri: text("jwks_uri"),
    grantTypes: text("grant_types").array(),
    responseTypes: text("response_types").array(),
    requirePKCE: boolean("require_pkce"),
    dpopBoundAccessTokens: boolean("dpop_bound_access_tokens").default(false),
    referenceId: text("reference_id"),
    metadata: jsonb("metadata"),
  },
  (table) => [index("oauthClient_userId_idx").on(table.userId)],
);

export const oauthResource = pgTable("oauth_resource", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull().unique(),
  name: text("name").notNull(),
  accessTokenTtl: integer("access_token_ttl"),
  refreshTokenTtl: integer("refresh_token_ttl"),
  signingAlgorithm: text("signing_algorithm"),
  signingKeyId: text("signing_key_id"),
  allowedScopes: text("allowed_scopes").array(),
  customClaims: jsonb("custom_claims"),
  dpopBoundAccessTokensRequired: boolean(
    "dpop_bound_access_tokens_required",
  ).default(false),
  disabled: boolean("disabled").default(false),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
  policyVersion: integer("policy_version").default(1),
  metadata: jsonb("metadata"),
});

export const oauthClientResource = pgTable(
  "oauth_client_resource",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthClient.clientId, { onDelete: "cascade" }),
    resourceId: text("resource_id")
      .notNull()
      .references(() => oauthResource.identifier, { onDelete: "cascade" }),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at"),
  },
  (table) => [
    index("oauthClientResource_clientId_idx").on(table.clientId),
    index("oauthClientResource_resourceId_idx").on(table.resourceId),
  ],
);

export const oauthRefreshToken = pgTable(
  "oauth_refresh_token",
  {
    id: text("id").primaryKey(),
    token: text("token").notNull().unique(),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthClient.clientId, { onDelete: "cascade" }),
    sessionId: text("session_id").references(() => session.id, {
      onDelete: "set null",
    }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    referenceId: text("reference_id"),
    authorizationCodeId: text("authorization_code_id"),
    resources: text("resources").array(),
    requestedUserInfoClaims: text("requested_user_info_claims").array(),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at"),
    revoked: timestamp("revoked"),
    rotatedAt: timestamp("rotated_at"),
    rotationReplayResponse: text("rotation_replay_response"),
    rotationReplayExpiresAt: timestamp("rotation_replay_expires_at"),
    authTime: timestamp("auth_time"),
    confirmation: jsonb("confirmation"),
    scopes: text("scopes").array().notNull(),
  },
  (table) => [
    index("oauthRefreshToken_clientId_idx").on(table.clientId),
    index("oauthRefreshToken_sessionId_idx").on(table.sessionId),
    index("oauthRefreshToken_userId_idx").on(table.userId),
    index("oauthRefreshToken_authorizationCodeId_idx").on(
      table.authorizationCodeId,
    ),
  ],
);

export const oauthAccessToken = pgTable(
  "oauth_access_token",
  {
    id: text("id").primaryKey(),
    token: text("token").unique(),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthClient.clientId, { onDelete: "cascade" }),
    sessionId: text("session_id").references(() => session.id, {
      onDelete: "set null",
    }),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    referenceId: text("reference_id"),
    authorizationCodeId: text("authorization_code_id"),
    resources: text("resources").array(),
    requestedUserInfoClaims: text("requested_user_info_claims").array(),
    refreshId: text("refresh_id").references(() => oauthRefreshToken.id, {
      onDelete: "cascade",
    }),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at"),
    revoked: timestamp("revoked"),
    confirmation: jsonb("confirmation"),
    scopes: text("scopes").array().notNull(),
  },
  (table) => [
    index("oauthAccessToken_clientId_idx").on(table.clientId),
    index("oauthAccessToken_sessionId_idx").on(table.sessionId),
    index("oauthAccessToken_userId_idx").on(table.userId),
    index("oauthAccessToken_authorizationCodeId_idx").on(
      table.authorizationCodeId,
    ),
    index("oauthAccessToken_refreshId_idx").on(table.refreshId),
  ],
);

export const oauthConsent = pgTable(
  "oauth_consent",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthClient.clientId, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    referenceId: text("reference_id"),
    resources: text("resources").array(),
    requestedUserInfoClaims: text("requested_user_info_claims").array(),
    scopes: text("scopes").array().notNull(),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [
    index("oauthConsent_clientId_idx").on(table.clientId),
    index("oauthConsent_userId_idx").on(table.userId),
  ],
);

export const oauthClientAssertion = pgTable("oauth_client_assertion", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
});

// ---------------------------------------------------------------------------
// 2. Physical Meeting Room Catalog
// ---------------------------------------------------------------------------

export const meetingRoom = pgTable(
  "meeting_room",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    googleResourceEmail: text("google_resource_email"),
    officeLocation: text("office_location").default("hcm"),
    capacity: integer("capacity").notNull().default(0),
    features: jsonb("features").$type<string[]>().default([]).notNull(),
    equipment: jsonb("equipment").$type<string[]>().default([]).notNull(),
    building: text("building"),
    floor: text("floor"),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("meeting_room_email_idx").on(table.email),
    index("meeting_room_capacity_idx").on(table.capacity),
  ],
);

// ---------------------------------------------------------------------------
// 3. Event Types / Meeting Templates
// ---------------------------------------------------------------------------

export const eventType = pgTable(
  "event_type",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    title: text("title"),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    duration: integer("duration").notNull(), // duration in minutes
    requiresRoom: boolean("requires_room").default(true),
    beforeBuffer: integer("before_buffer").default(0).notNull(), // buffer before in minutes
    afterBuffer: integer("after_buffer").default(0).notNull(), // buffer after in minutes
    minNoticeHours: integer("min_notice_hours").default(2),
    bookingHorizonDays: integer("booking_horizon_days").default(30),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("event_type_slug_idx").on(table.slug),
    index("event_type_userId_idx").on(table.userId),
  ],
);

// ---------------------------------------------------------------------------
// 4. Schedules & Working Hours (Availability Engine)
// ---------------------------------------------------------------------------

export const schedule = pgTable(
  "schedule",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").default("Working Hours"),
    timeZone: text("time_zone").default("Asia/Ho_Chi_Minh").notNull(),
    timezone: text("timezone").default("Asia/Ho_Chi_Minh"),
    isDefault: boolean("is_default").default(true),
    workingHours: jsonb("working_hours")
      .$type<Array<{ day: number; start: string; end: string }>>()
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("schedule_userId_idx").on(table.userId)],
);

export const scheduleRule = pgTable(
  "schedule_rule",
  {
    id: text("id").primaryKey(),
    scheduleId: text("schedule_id")
      .notNull()
      .references(() => schedule.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday, 1 = Monday, ... 6 = Saturday
    startTime: text("start_time").notNull(), // e.g. "08:00"
    endTime: text("end_time").notNull(), // e.g. "18:00"
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("schedule_rule_scheduleId_idx").on(table.scheduleId)],
);

// ---------------------------------------------------------------------------
// 5. Bookings & Attendees
// ---------------------------------------------------------------------------

export const booking = pgTable(
  "booking",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    description: text("description"),
    eventTypeId: text("event_type_id").references(() => eventType.id, {
      onDelete: "set null",
    }),
    organizerUserId: text("organizer_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    roomId: text("room_id").references(() => meetingRoom.id, {
      onDelete: "set null",
    }),
    projectId: text("project_id").references(() => project.id, {
      onDelete: "set null",
    }),
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time").notNull(),
    status: text("status").default("confirmed").notNull(),
    attendees: jsonb("attendees")
      .$type<Array<{ email: string; name?: string; status?: string }>>()
      .default([])
      .notNull(),
    gcalEventId: text("gcal_event_id"),
    googleEventId: text("google_event_id"),
    meetingUrl: text("meeting_url"),
    googleMeetUrl: text("google_meet_url"),
    cancellationReason: text("cancellation_reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("booking_organizerUserId_idx").on(table.organizerUserId),
    index("booking_startTime_idx").on(table.startTime),
    index("booking_roomId_idx").on(table.roomId),
    index("booking_projectId_idx").on(table.projectId),
  ],
);

export const bookingAttendee = pgTable(
  "booking_attendee",
  {
    id: text("id").primaryKey(),
    bookingId: text("booking_id")
      .notNull()
      .references(() => booking.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    email: text("email").notNull(),
    name: text("name"),
    rsvpStatus: text("rsvp_status").notNull().default("needs_action"), // "accepted" | "tentative" | "declined" | "needs_action"
    isOrganizer: boolean("is_organizer").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("booking_attendee_bookingId_idx").on(table.bookingId),
    index("booking_attendee_email_idx").on(table.email),
  ],
);

// ---------------------------------------------------------------------------
// 6. Meeting Invites / Shareable Collective Scheduling Links
// ---------------------------------------------------------------------------

export const meetingInvite = pgTable(
  "meeting_invite",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description"),
    duration: integer("duration").notNull().default(30),
    organizerUserId: text("organizer_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    memberEmails: jsonb("member_emails")
      .$type<string[]>()
      .default([])
      .notNull(),
    locationType: text("location_type").default("meet").notNull(),
    roomId: text("room_id").references(() => meetingRoom.id, {
      onDelete: "set null",
    }),
    isRestricted: boolean("is_restricted").default(false).notNull(),
    allowedEmails: jsonb("allowed_emails")
      .$type<string[]>()
      .default([])
      .notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    bookingId: text("booking_id").references(() => booking.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("meeting_invite_slug_idx").on(table.slug),
    index("meeting_invite_organizerUserId_idx").on(table.organizerUserId),
  ],
);

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
    position: integer("position").default(0).notNull(),
    estimatedMinutes: integer("estimated_minutes").default(60),
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

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  apiKeys: many(apikey),
  schedules: many(schedule),
  eventTypes: many(eventType),
  bookings: many(booking),
  meetingInvites: many(meetingInvite),
  oauthClients: many(oauthClient),
  oauthRefreshTokens: many(oauthRefreshToken),
  oauthAccessTokens: many(oauthAccessToken),
  oauthConsents: many(oauthConsent),
  ownedTeams: many(team),
  teamMemberships: many(teamMember),
  assignedTasks: many(task, { relationName: "taskAssignee" }),
  createdTasks: many(task, { relationName: "taskCreator" }),
  taskComments: many(taskComment),
}));

export const sessionRelations = relations(session, ({ one, many }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
  oauthRefreshTokens: many(oauthRefreshToken),
  oauthAccessTokens: many(oauthAccessToken),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const apikeyRelations = relations(apikey, ({ one }) => ({
  user: one(user, {
    fields: [apikey.userId],
    references: [user.id],
  }),
}));

export const scheduleRelations = relations(schedule, ({ one, many }) => ({
  user: one(user, {
    fields: [schedule.userId],
    references: [user.id],
  }),
  rules: many(scheduleRule),
}));

export const scheduleRuleRelations = relations(scheduleRule, ({ one }) => ({
  schedule: one(schedule, {
    fields: [scheduleRule.scheduleId],
    references: [schedule.id],
  }),
}));

export const eventTypeRelations = relations(eventType, ({ one, many }) => ({
  user: one(user, {
    fields: [eventType.userId],
    references: [user.id],
  }),
  bookings: many(booking),
}));

export const meetingRoomRelations = relations(meetingRoom, ({ many }) => ({
  bookings: many(booking),
}));

export const bookingRelations = relations(booking, ({ one, many }) => ({
  organizer: one(user, {
    fields: [booking.organizerUserId],
    references: [user.id],
  }),
  eventType: one(eventType, {
    fields: [booking.eventTypeId],
    references: [eventType.id],
  }),
  room: one(meetingRoom, {
    fields: [booking.roomId],
    references: [meetingRoom.id],
  }),
  project: one(project, {
    fields: [booking.projectId],
    references: [project.id],
  }),
  attendeesList: many(bookingAttendee),
}));

export const bookingAttendeeRelations = relations(
  bookingAttendee,
  ({ one }) => ({
    booking: one(booking, {
      fields: [bookingAttendee.bookingId],
      references: [booking.id],
    }),
  }),
);

export const meetingInviteRelations = relations(meetingInvite, ({ one }) => ({
  organizer: one(user, {
    fields: [meetingInvite.organizerUserId],
    references: [user.id],
  }),
  room: one(meetingRoom, {
    fields: [meetingInvite.roomId],
    references: [meetingRoom.id],
  }),
  booking: one(booking, {
    fields: [meetingInvite.bookingId],
    references: [booking.id],
  }),
}));

export const oauthClientRelations = relations(oauthClient, ({ one, many }) => ({
  user: one(user, {
    fields: [oauthClient.userId],
    references: [user.id],
  }),
  oauthClientResources: many(oauthClientResource),
  oauthRefreshTokens: many(oauthRefreshToken),
  oauthAccessTokens: many(oauthAccessToken),
  oauthConsents: many(oauthConsent),
}));

export const oauthResourceRelations = relations(oauthResource, ({ many }) => ({
  oauthClientResources: many(oauthClientResource),
}));

export const oauthClientResourceRelations = relations(
  oauthClientResource,
  ({ one }) => ({
    oauthClient: one(oauthClient, {
      fields: [oauthClientResource.clientId],
      references: [oauthClient.clientId],
    }),
    oauthResource: one(oauthResource, {
      fields: [oauthClientResource.resourceId],
      references: [oauthResource.identifier],
    }),
  }),
);

export const oauthRefreshTokenRelations = relations(
  oauthRefreshToken,
  ({ one, many }) => ({
    oauthClient: one(oauthClient, {
      fields: [oauthRefreshToken.clientId],
      references: [oauthClient.clientId],
    }),
    session: one(session, {
      fields: [oauthRefreshToken.sessionId],
      references: [session.id],
    }),
    user: one(user, {
      fields: [oauthRefreshToken.userId],
      references: [user.id],
    }),
    oauthAccessTokens: many(oauthAccessToken),
  }),
);

export const oauthAccessTokenRelations = relations(
  oauthAccessToken,
  ({ one }) => ({
    oauthClient: one(oauthClient, {
      fields: [oauthAccessToken.clientId],
      references: [oauthClient.clientId],
    }),
    session: one(session, {
      fields: [oauthAccessToken.sessionId],
      references: [session.id],
    }),
    user: one(user, {
      fields: [oauthAccessToken.userId],
      references: [user.id],
    }),
    oauthRefreshToken: one(oauthRefreshToken, {
      fields: [oauthAccessToken.refreshId],
      references: [oauthRefreshToken.id],
    }),
  }),
);

export const oauthConsentRelations = relations(oauthConsent, ({ one }) => ({
  oauthClient: one(oauthClient, {
    fields: [oauthConsent.clientId],
    references: [oauthClient.clientId],
  }),
  user: one(user, {
    fields: [oauthConsent.userId],
    references: [user.id],
  }),
}));

export const teamRelations = relations(team, ({ one, many }) => ({
  owner: one(user, {
    fields: [team.ownerId],
    references: [user.id],
  }),
  members: many(teamMember),
  projects: many(project),
  tasks: many(task),
}));

export const teamMemberRelations = relations(teamMember, ({ one }) => ({
  team: one(team, {
    fields: [teamMember.teamId],
    references: [team.id],
  }),
  user: one(user, {
    fields: [teamMember.userId],
    references: [user.id],
  }),
}));

export const projectRelations = relations(project, ({ one, many }) => ({
  team: one(team, {
    fields: [project.teamId],
    references: [team.id],
  }),
  tasks: many(task),
  bookings: many(booking),
}));

export const taskRelations = relations(task, ({ one, many }) => ({
  team: one(team, {
    fields: [task.teamId],
    references: [team.id],
  }),
  project: one(project, {
    fields: [task.projectId],
    references: [project.id],
  }),
  creator: one(user, {
    fields: [task.creatorId],
    references: [user.id],
    relationName: "taskCreator",
  }),
  assignee: one(user, {
    fields: [task.assigneeId],
    references: [user.id],
    relationName: "taskAssignee",
  }),
  comments: many(taskComment),
  timeSessions: many(taskTimeSession),
}));

export const taskCommentRelations = relations(taskComment, ({ one }) => ({
  task: one(task, {
    fields: [taskComment.taskId],
    references: [task.id],
  }),
  user: one(user, {
    fields: [taskComment.userId],
    references: [user.id],
  }),
}));

export const taskTimeSessionRelations = relations(
  taskTimeSession,
  ({ one }) => ({
    task: one(task, {
      fields: [taskTimeSession.taskId],
      references: [task.id],
    }),
    user: one(user, {
      fields: [taskTimeSession.userId],
      references: [user.id],
    }),
  }),
);

// ---------------------------------------------------------------------------
// Exported TypeScript Types
// ---------------------------------------------------------------------------

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;

export type Account = typeof account.$inferSelect;
export type NewAccount = typeof account.$inferInsert;

export type ApiKey = typeof apikey.$inferSelect;
export type NewApiKey = typeof apikey.$inferInsert;

export type Schedule = typeof schedule.$inferSelect;
export type NewSchedule = typeof schedule.$inferInsert;

export type ScheduleRule = typeof scheduleRule.$inferSelect;
export type NewScheduleRule = typeof scheduleRule.$inferInsert;

export type EventType = typeof eventType.$inferSelect;
export type NewEventType = typeof eventType.$inferInsert;

export type MeetingRoom = typeof meetingRoom.$inferSelect;
export type NewMeetingRoom = typeof meetingRoom.$inferInsert;

export type Booking = typeof booking.$inferSelect;
export type NewBooking = typeof booking.$inferInsert;

export type BookingAttendee = typeof bookingAttendee.$inferSelect;
export type NewBookingAttendee = typeof bookingAttendee.$inferInsert;

export type MeetingInvite = typeof meetingInvite.$inferSelect;
export type NewMeetingInvite = typeof meetingInvite.$inferInsert;

export type Team = typeof team.$inferSelect;
export type NewTeam = typeof team.$inferInsert;

export type TeamMember = typeof teamMember.$inferSelect;
export type NewTeamMember = typeof teamMember.$inferInsert;

export type Project = typeof project.$inferSelect;
export type NewProject = typeof project.$inferInsert;

export type Task = typeof task.$inferSelect;
export type NewTask = typeof task.$inferInsert;

export type TaskComment = typeof taskComment.$inferSelect;
export type NewTaskComment = typeof taskComment.$inferInsert;

export type TaskTimeSession = typeof taskTimeSession.$inferSelect;
export type NewTaskTimeSession = typeof taskTimeSession.$inferInsert;
