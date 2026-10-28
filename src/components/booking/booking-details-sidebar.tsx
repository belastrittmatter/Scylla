"use client";

import * as React from "react";
import { Clock, Building2, Users, Sparkles, Globe, Lock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { InviteData, InviteOrganizer, InviteRoom, InviteMember } from "./booking-types";

interface BookingDetailsSidebarProps {
  invite: InviteData;
  organizer: InviteOrganizer | null;
  room: InviteRoom | null;
  members: InviteMember[];
  timeZone: string;
}

export function BookingDetailsSidebar({
  invite,
  organizer,
  room,
  members,
  timeZone,
}: BookingDetailsSidebarProps) {
  return (
    <div className="bg-muted/20 flex flex-col justify-between space-y-6 p-6 md:col-span-4 lg:p-8">
      <div className="space-y-6">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <Avatar className="border-background shadow-xs h-12 w-12 border-2">
              {organizer?.image && <AvatarImage src={organizer.image} />}
              <AvatarFallback className="bg-orange-500 font-semibold text-white">
                {organizer?.name ? organizer.name.slice(0, 2).toUpperCase() : "AG"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                Invited by
              </p>
              <p className="text-foreground text-sm font-bold">{organizer?.name || "Organizer"}</p>
            </div>
          </div>

          <div className="mb-2">
            {invite.isRestricted ? (
              <Badge
                variant="outline"
                className="gap-1.5 border-orange-500/40 bg-orange-500/10 px-2.5 py-1 text-xs text-orange-600 dark:text-orange-400"
              >
                <Lock className="h-3 w-3 text-orange-500" />
                Restricted Access (Invite Only)
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="border-border text-muted-foreground gap-1.5 px-2.5 py-1 text-xs"
              >
                <Globe className="text-muted-foreground h-3 w-3" />
                Public Meeting Link
              </Badge>
            )}
          </div>

          <h1 className="text-foreground text-2xl font-bold tracking-tight">{invite.title}</h1>
          {invite.description && (
            <p className="text-muted-foreground mt-2 whitespace-pre-wrap text-sm leading-relaxed">
              {invite.description}
            </p>
          )}
        </div>

        <div className="space-y-3 pt-2">
          <div className="text-foreground flex items-center gap-3 text-sm font-medium">
            <Clock className="h-4 w-4 shrink-0 text-orange-500" />
            <span>{invite.duration} minutes</span>
          </div>

          {invite.locationType === "room" && room ? (
            <div className="space-y-2 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-3.5">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 shrink-0 text-orange-500" />
                <span className="text-foreground text-sm font-bold">Room: {room.name}</span>
              </div>
              <div className="text-muted-foreground space-y-1 text-xs">
                {room.building && (
                  <p className="flex items-center gap-1.5">
                    <span>
                      🏢 {room.building} {room.floor ? `(Floor ${room.floor})` : ""}
                    </span>
                  </p>
                )}
                {room.capacity ? (
                  <p className="flex items-center gap-1.5">
                    <span>
                      👥 Capacity:{" "}
                      <strong className="text-foreground font-semibold">
                        {room.capacity} seats
                      </strong>
                    </span>
                  </p>
                ) : null}
              </div>
              {room.features && room.features.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {room.features.map((f) => (
                    <span
                      key={f}
                      className="bg-background text-foreground border-border rounded border px-1.5 py-0.5 text-[10px] capitalize"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-foreground flex items-center gap-3 text-sm font-medium">
              <span className="text-orange-500">📹</span>
              <span>Google Meet (Link generated on confirmation)</span>
            </div>
          )}
        </div>

        <div className="border-border space-y-3 border-t pt-4">
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
            <Users className="h-3.5 w-3.5 text-orange-500" />
            <span>Coordinated Team Members</span>
          </div>

          <div className="space-y-2">
            {organizer && (
              <div className="text-foreground flex items-center gap-2 text-xs">
                <span className="h-2 w-2 rounded-full bg-orange-500" />
                <span className="font-semibold">{organizer.name}</span>
                <span className="text-muted-foreground font-normal">(Host)</span>
              </div>
            )}
            {members.map((m) => (
              <div key={m.id} className="text-foreground flex items-center gap-2 text-xs">
                <span className="bg-muted-foreground h-2 w-2 rounded-full" />
                <span className="font-medium">{m.name}</span>
                <span className="text-muted-foreground font-mono text-[11px]">({m.email})</span>
              </div>
            ))}
          </div>

          <div className="text-foreground flex items-start gap-2.5 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-3 text-[12px]">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
            <span>
              Available slots are dynamically resolved by computing the mutual free intervals of all
              attendees {invite.locationType === "room" ? "and the physical room" : ""}.
            </span>
          </div>
        </div>
      </div>

      <div className="border-border text-muted-foreground flex items-center gap-2 border-t pt-4 text-xs">
        <Globe className="h-3.5 w-3.5 shrink-0" />
        <span>
          Time zone: <strong className="text-foreground font-semibold">{timeZone}</strong>
        </span>
      </div>
    </div>
  );
}
