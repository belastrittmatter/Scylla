import type { McpServer } from "@modelcontextprotocol/server";
import type { McpToolContext } from "../types";
import { registerUserTools } from "./user-tools";
import { registerRoomsTools } from "./rooms-tools";
import { registerScheduleTools } from "./schedule-tools";
import { registerBookingTools } from "./booking-tools";
import { registerAgendaTools } from "./agenda-tools";
import { registerInviteTools } from "./invite-tools";
import { registerTaskTools } from "./task-tools";
import { registerTeamCrudTools } from "./team-crud-tools";
import { registerTeamMemberTools } from "./team-member-tools";
import { registerProjectCrudTools } from "./project-crud-tools";
import { registerTaskCrudTools } from "./task-crud-tools";

export function registerAllMcpTools(server: McpServer, ctx: McpToolContext) {
  registerUserTools(server, ctx);
  registerRoomsTools(server, ctx);
  registerScheduleTools(server, ctx);
  registerBookingTools(server, ctx);
  registerAgendaTools(server, ctx);
  registerInviteTools(server, ctx);
  registerTaskTools(server, ctx);
  registerTeamCrudTools(server, ctx);
  registerTeamMemberTools(server, ctx);
  registerProjectCrudTools(server, ctx);
  registerTaskCrudTools(server, ctx);
}

export * from "./user-tools";
export * from "./rooms-tools";
export * from "./schedule-tools";
export * from "./booking-tools";
export * from "./agenda-tools";
export * from "./invite-tools";
export * from "./task-tools";
export * from "./team-crud-tools";
export * from "./team-member-tools";
export * from "./project-crud-tools";
export * from "./task-crud-tools";
