"use client";

import * as React from "react";
import { Clock, Building2, Users, Video, Lock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eyebrow } from "@/components/landing/primitives";
import type {
  InviteData,
  InviteOrganizer,
  InviteRoom,
  InviteMember,
} from "./booking-types";

interface BookingDetailsSidebarProps {
  invite: InviteData;
  organizer: InviteOrganizer | null;
  room: InviteRoom | null;
  members: InviteMember[];
}

/** "A", "A and B", "A, B and C". */
function joinNames(names: string[]) {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

const iconClass = "text-ink-3 mt-0.5 size-4 shrink-0";

export function BookingDetailsSidebar({
  invite,
  organizer,
  room,
  members,
}: BookingDetailsSidebarProps) {
  const organizerName = organizer?.name || "Organizer";
  const attendees = [
    ...(organizer ? [`${organizer.name} (host)`] : []),
    ...members.map((m) => m.name),
  ];

  return (
    <div className="flex flex-col gap-6 p-5 sm:p-8">
      <div className="flex items-center gap-3">
        <Avatar size="lg">
          {organizer?.image && (
            <AvatarImage src={organizer.image} alt={organizerName} />
          )}
          <AvatarFallback className="bg-paper text-ink font-code text-xs">
            {organizer?.name ? organizer.name.slice(0, 2).toUpperCase() : "AG"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <Eyebrow className="text-ink-2 text-[11px]">Invited by</Eyebrow>
          <p className="text-ink mt-0.5 truncate text-sm font-medium">
            {organizerName}
          </p>
        </div>
      </div>

      <div>
        <h1 className="text-ink text-balance text-[28px] font-medium leading-[1.15] tracking-[-0.02em] sm:text-3xl">
          {invite.title}
        </h1>
        {invite.description && (
          <p className="text-ink-2 mt-2 whitespace-pre-wrap text-pretty text-sm leading-relaxed">
            {invite.description}
          </p>
        )}
        {invite.isRestricted && (
          <p className="border-line text-ink-2 font-code mt-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] uppercase tracking-[0.08em]">
            <Lock className="size-3" aria-hidden="true" />
            Restricted access (invite only)
          </p>
        )}
      </div>

      <ul className="text-ink space-y-3 text-sm">
        <li className="flex items-start gap-3">
          <Clock className={iconClass} aria-hidden="true" />
          <span className="font-code tabular-nums">
            {invite.duration} min
          </span>
        </li>

        {invite.locationType === "room" && room ? (
          <li className="flex items-start gap-3">
            <Building2 className={iconClass} aria-hidden="true" />
            <div className="min-w-0 space-y-1">
              <p className="font-medium">Room: {room.name}</p>
              {(room.building || room.capacity) && (
                <p className="text-ink-2 text-xs">
                  {room.building}
                  {room.floor ? ` (Floor ${room.floor})` : ""}
                  {room.building && room.capacity ? " · " : ""}
                  {room.capacity ? (
                    <span className="font-code tabular-nums">
                      {room.capacity} seats
                    </span>
                  ) : null}
                </p>
              )}
              {room.features && room.features.length > 0 && (
                <ul className="flex flex-wrap gap-1 pt-1">
                  {room.features.map((f) => (
                    <li
                      key={f}
                      className="border-line text-ink-2 font-code rounded border px-1.5 py-0.5 text-[10px] lowercase"
                    >
                      {f}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ) : (
          <li className="flex items-start gap-3">
            <Video className={iconClass} aria-hidden="true" />
            <span>
              Google Meet
              <span className="text-ink-2 block text-xs">
                Link generated on confirmation
              </span>
            </span>
          </li>
        )}

        {attendees.length > 0 && (
          <li className="flex items-start gap-3">
            <Users className={iconClass} aria-hidden="true" />
            <span className="text-ink-2">With {joinNames(attendees)}</span>
          </li>
        )}
      </ul>
    </div>
  );
}
