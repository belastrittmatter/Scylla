import { type AuthInfo } from "@modelcontextprotocol/server";

export interface CalendarMcpAuthInfo extends Partial<AuthInfo> {
  sub?: string;
  [key: string]: unknown;
}

export interface McpUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export interface McpToolContext {
  userId?: string;
  getAccessToken: () => Promise<string | null>;
  getCurrentUser: () => Promise<McpUser>;
  resolveAttendeeEmail: (
    attendeeOrQuery: string,
    token?: string | null,
  ) => Promise<string>;
}
