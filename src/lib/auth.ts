import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { jwt, bearer } from "better-auth/plugins";
import { mcp } from "@better-auth/mcp";
import { cimd } from "@better-auth/cimd";
import { agentAuth } from "@better-auth/agent-auth";
import { fetchClientMetadataResource } from "@better-auth/cimd/node";
import { APIError } from "better-auth/api";
import { userNameSchema } from "@/lib/validations/user";
import { ALL_MCP_CAPABILITIES } from "@/constants/agent-capabilities";
import { db } from "@/db";
import * as schema from "@/db/schema";

const appUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";

export const auth = betterAuth({
  baseURL: appUrl,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  user: {
    deleteUser: {
      enabled: true,
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (user.name !== undefined && user.name !== null) {
            const parsed = userNameSchema.safeParse(user.name);
            if (!parsed.success) {
              throw new APIError("BAD_REQUEST", {
                message:
                  parsed.error.issues[0]?.message ||
                  "Name must be 32 characters or less",
              });
            }
            return {
              data: {
                ...user,
                name: parsed.data,
              },
            };
          }
        },
      },
      update: {
        before: async (user) => {
          if (user.name !== undefined && user.name !== null) {
            const parsed = userNameSchema.safeParse(user.name);
            if (!parsed.success) {
              throw new APIError("BAD_REQUEST", {
                message:
                  parsed.error.issues[0]?.message ||
                  "Name must be 32 characters or less",
              });
            }
            return {
              data: {
                ...user,
                name: parsed.data,
              },
            };
          }
        },
      },
    },
  },
  session: {
    // The proxy and the route both resolve the session; a signed cookie cache
    // spares the second DB lookup. Revoked sessions stay valid for up to maxAge.
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github"],
      // #111: team invites create unverified placeholder users (team-service addTeamMember);
      // Google must be able to claim them. Safe only while no password sign-up exists.
      requireLocalEmailVerified: false,
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "dummy-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dummy-client-secret",
      scope: [
        "openid",
        "profile",
        "email",
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/calendar.readonly",
        "https://www.googleapis.com/auth/admin.directory.resource.calendar.readonly",
      ],
      accessType: "offline",
      prompt: "consent",
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "dummy-github-client-id",
      clientSecret:
        process.env.GITHUB_CLIENT_SECRET || "dummy-github-client-secret",
      scope: ["repo", "read:user", "user:email"],
    },
  },
  plugins: [
    jwt(),
    bearer(),
    mcp({
      loginPage: "/sign-in",
      consentPage: "/consent",
      resource: `${appUrl}/api/mcp`,
      scopes: [
        "openid",
        "profile",
        "email",
        "offline_access",
        ...ALL_MCP_CAPABILITIES.map((c) => c.id),
      ],
      allowDynamicClientRegistration: true,
      allowUnauthenticatedClientRegistration: true,
      clientRegistrationDefaultApplicationType: "infer",
    }),
    cimd({
      fetchClientMetadataResource,
      metadataProfile: "mcp-2026-07-28",
    }),
    agentAuth({
      providerName: "Scylla",
      providerDescription:
        "Scylla AI Calendar & Workspace Meeting Scheduling Server",
      allowDynamicHostRegistration: true,
      capabilities: [
        {
          name: "calendar.readonly",
          description:
            "Read calendar availability, free/busy slots, event types, and agendas",
        },
        {
          name: "calendar.events",
          description:
            "Schedule, reschedule, cancel meetings and create shareable booking links",
        },
        {
          name: "rooms.reservation",
          description:
            "List office meeting rooms and verify reservation facilities",
        },
        {
          name: "teams.readonly",
          description: "View team workspaces and member rosters",
        },
        {
          name: "teams.manage",
          description: "Manage team workspaces and memberships",
        },
        {
          name: "teams.delete",
          description: "Permanently delete team workspaces",
        },
        {
          name: "projects.readonly",
          description: "View project workspaces and metadata",
        },
        {
          name: "projects.manage",
          description: "Manage projects and workspace assignments",
        },
        {
          name: "projects.delete",
          description: "Permanently delete project workspaces",
        },
        {
          name: "tasks.readonly",
          description: "View workspace tasks, comments, and kanban boards",
        },
        {
          name: "tasks.write",
          description:
            "Manage workspace tasks, kanban boards, and task timelines",
        },
        {
          name: "tasks.delete",
          description: "Permanently delete workspace tasks",
        },
      ],
    }),
  ],
});
