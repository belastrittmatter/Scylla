import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { jwt, bearer } from "better-auth/plugins";
import { mcp } from "@better-auth/mcp";
import { cimd } from "@better-auth/cimd";
import { fetchClientMetadataResource } from "@better-auth/cimd/node";
import { APIError } from "better-auth/api";
import { userNameSchema } from "@/lib/validations/user";
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
          }
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
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
  },
  plugins: [
    jwt(),
    bearer(),
    mcp({
      loginPage: "/sign-in",
      consentPage: "/consent",
      resource: `${appUrl}/api/mcp`,
      allowDynamicClientRegistration: true,
      allowUnauthenticatedClientRegistration: true,
      clientRegistrationDefaultApplicationType: "infer",
    }),
    cimd({
      fetchClientMetadataResource,
      metadataProfile: "mcp-2026-07-28",
    }),
  ],
});
