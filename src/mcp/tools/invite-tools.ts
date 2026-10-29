import type { McpServer } from "@modelcontextprotocol/server";
import { MeetingInviteService } from "@/services/meeting-invite";
import { createShareableBookingLinkSchema } from "../schemas";
import type { McpToolContext } from "../types";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export function registerInviteTools(server: McpServer, ctx: McpToolContext) {
  server.registerTool(
    "create_shareable_booking_link",
    {
      description:
        "Generate a shareable public booking link (e.g. /book/[slug]) allowing external or internal guests to pick an open time slot on your calendar.",
      inputSchema: createShareableBookingLinkSchema,
    },
    async ({
      title,
      description,
      durationMinutes = 30,
      memberEmails = [],
      locationType = "meet",
      roomId,
      allowedGuestEmails = [],
    }) => {
      const [token, currentUserProfile] = await Promise.all([
        ctx.getAccessToken(),
        ctx.getCurrentUser(),
      ]);

      // Resolve memberEmails in case nicknames are passed
      const resolvedRaw = await Promise.all(
        memberEmails.map((m) => ctx.resolveAttendeeEmail(m, token)),
      );
      const resolvedMembers: string[] = [];
      for (const resolved of resolvedRaw) {
        if (resolved && !resolvedMembers.includes(resolved.toLowerCase())) {
          resolvedMembers.push(resolved.toLowerCase());
        }
      }

      const invite = await MeetingInviteService.createInvite({
        title,
        description,
        duration: durationMinutes,
        organizerUserId: currentUserProfile.id || "organizer",
        memberEmails: resolvedMembers,
        locationType,
        roomId,
        isRestricted: allowedGuestEmails.length > 0,
        allowedEmails: allowedGuestEmails,
      });

      const bookingUrl = `${appUrl}/book/${invite.slug}`;
      const markdownLink = `[Book Meeting: ${invite.title}](${bookingUrl})`;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                message: "Shareable booking link created successfully",
                slug: invite.slug,
                bookingUrl,
                markdownLink,
                inviteId: invite.id,
                title: invite.title,
                duration: invite.duration,
                locationType: invite.locationType,
                isRestricted: invite.isRestricted,
                allowedEmails: invite.allowedEmails,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );
}
