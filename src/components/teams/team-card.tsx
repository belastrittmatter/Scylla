"use client";

import * as React from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  FolderKanban,
  MoreVertical,
  Edit2,
  UserCog,
  Trash2,
} from "lucide-react";
import type { TeamItem } from "@/hooks/use-teams";

interface TeamCardProps {
  team: TeamItem;
  onEdit: (team: TeamItem) => void;
  onManageMembers: (team: TeamItem) => void;
  onDelete: (id: string) => void;
}

export function TeamCard({
  team,
  onEdit,
  onManageMembers,
  onDelete,
}: TeamCardProps) {
  return (
    <Card className="hover:shadow-xs flex flex-col justify-between transition-all hover:border-neutral-300 dark:hover:border-neutral-700">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold leading-none">
                {team.name}
              </CardTitle>
              {team.role && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-normal capitalize"
                >
                  {team.role}
                </Badge>
              )}
            </div>
            <p className="font-mono text-xs text-neutral-400">/{team.slug}</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-neutral-400"
                />
              }
            >
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={() => onEdit(team)}
                className="cursor-pointer gap-2"
              >
                <Edit2 className="size-3.5" />
                <span>Edit Team</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onManageMembers(team)}
                className="cursor-pointer gap-2"
              >
                <UserCog className="size-3.5" />
                <span>Members</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(team.id)}
                className="cursor-pointer gap-2 text-red-600 dark:text-red-400"
              >
                <Trash2 className="size-3.5" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <CardDescription className="mt-1 line-clamp-2 min-h-[32px] text-xs">
          {team.description || "No description provided."}
        </CardDescription>
      </CardHeader>

      <CardFooter>
        <Button
          variant="secondary"
          size="sm"
          className="w-full justify-center gap-2 text-xs font-medium"
          render={<Link href={`/teams/${team.slug}/projects`} />}
        >
          <FolderKanban className="size-3.5 text-neutral-500" />
          <span>Manage Projects</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
