import { pgTable, text, timestamp, index, integer } from "drizzle-orm/pg-core";
import { user } from "./schema-auth";

export const agentHost = pgTable(
  "agent_host",
  {
    id: text("id").primaryKey(),
    name: text("name"),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    defaultCapabilities: text("default_capabilities"),
    publicKey: text("public_key"),
    kid: text("kid"),
    jwksUrl: text("jwks_url"),
    enrollmentTokenHash: text("enrollment_token_hash"),
    enrollmentTokenExpiresAt: timestamp("enrollment_token_expires_at"),
    status: text("status").notNull().default("active"),
    activatedAt: timestamp("activated_at"),
    expiresAt: timestamp("expires_at"),
    lastUsedAt: timestamp("last_used_at"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    index("agentHost_userId_idx").on(table.userId),
    index("agentHost_kid_idx").on(table.kid),
    index("agentHost_enrollmentTokenHash_idx").on(table.enrollmentTokenHash),
    index("agentHost_status_idx").on(table.status),
  ],
);

export const agent = pgTable(
  "agent",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    hostId: text("host_id")
      .notNull()
      .references(() => agentHost.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("active"),
    mode: text("mode").notNull().default("delegated"),
    publicKey: text("public_key").notNull(),
    kid: text("kid"),
    jwksUrl: text("jwks_url"),
    lastUsedAt: timestamp("last_used_at"),
    activatedAt: timestamp("activated_at"),
    expiresAt: timestamp("expires_at"),
    metadata: text("metadata"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    index("agent_userId_idx").on(table.userId),
    index("agent_hostId_idx").on(table.hostId),
    index("agent_status_idx").on(table.status),
    index("agent_kid_idx").on(table.kid),
  ],
);

export const agentCapabilityGrant = pgTable(
  "agent_capability_grant",
  {
    id: text("id").primaryKey(),
    agentId: text("agent_id")
      .notNull()
      .references(() => agent.id, { onDelete: "cascade" }),
    capability: text("capability").notNull(),
    deniedBy: text("denied_by").references(() => user.id, {
      onDelete: "cascade",
    }),
    grantedBy: text("granted_by").references(() => user.id, {
      onDelete: "cascade",
    }),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    status: text("status").notNull().default("active"),
    reason: text("reason"),
    constraints: text("constraints"),
  },
  (table) => [
    index("agentCapabilityGrant_agentId_idx").on(table.agentId),
    index("agentCapabilityGrant_capability_idx").on(table.capability),
    index("agentCapabilityGrant_grantedBy_idx").on(table.grantedBy),
    index("agentCapabilityGrant_status_idx").on(table.status),
  ],
);

export const approvalRequest = pgTable(
  "approval_request",
  {
    id: text("id").primaryKey(),
    method: text("method").notNull(),
    agentId: text("agent_id").references(() => agent.id, {
      onDelete: "cascade",
    }),
    hostId: text("host_id").references(() => agentHost.id, {
      onDelete: "cascade",
    }),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    capabilities: text("capabilities"),
    status: text("status").notNull().default("pending"),
    userCodeHash: text("user_code_hash"),
    loginHint: text("login_hint"),
    bindingMessage: text("binding_message"),
    clientNotificationToken: text("client_notification_token"),
    clientNotificationEndpoint: text("client_notification_endpoint"),
    deliveryMode: text("delivery_mode"),
    interval: integer("interval").notNull(),
    lastPolledAt: timestamp("last_polled_at"),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    index("approvalRequest_agentId_idx").on(table.agentId),
    index("approvalRequest_hostId_idx").on(table.hostId),
    index("approvalRequest_userId_idx").on(table.userId),
    index("approvalRequest_status_idx").on(table.status),
  ],
);
