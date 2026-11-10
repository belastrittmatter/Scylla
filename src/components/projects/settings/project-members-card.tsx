"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, UserPlus, AlertCircle, Check, Trash2 } from "lucide-react";
import type { TeamMemberItem } from "./project-settings-types";

interface ProjectMembersCardProps {
  teamName: string;
  teamMembers: TeamMemberItem[];
  hasGithubRepo: boolean;
  addMemberOpen: boolean;
  setAddMemberOpen: (open: boolean) => void;
  newMemberEmail: string;
  setNewMemberEmail: (email: string) => void;
  newMemberRole: string;
  setNewMemberRole: (role: string) => void;
  isAddingMember: boolean;
  onAddMember: (e: React.FormEvent) => Promise<void>;
  removingMemberId: string | null;
  onRemoveMember: (userId: string, memberName: string) => Promise<void>;
}

export function ProjectMembersCard({
  teamName,
  teamMembers,
  hasGithubRepo,
  addMemberOpen,
  setAddMemberOpen,
  newMemberEmail,
  setNewMemberEmail,
  newMemberRole,
  setNewMemberRole,
  isAddingMember,
  onAddMember,
  removingMemberId,
  onRemoveMember,
}: ProjectMembersCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="size-4" />
            <span>Team Members</span>
            {teamMembers.length > 0 && (
              <Badge variant="secondary" className="text-xs font-normal">
                {teamMembers.length}
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="text-xs">
            {teamName
              ? `Members of ${teamName} who have access to collaborate on this project.`
              : "Members of the team who have access to collaborate on this project."}
          </CardDescription>
        </div>

        <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
          <DialogTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
              >
                <UserPlus className="size-3.5" />
                <span>Add Member</span>
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md">
            <form onSubmit={onAddMember}>
              <DialogHeader>
                <DialogTitle>Add Member to Project Team</DialogTitle>
                <DialogDescription>
                  Invite a registered user by email address to join this
                  project&apos;s team.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="new-member-email"
                    className="text-xs font-medium"
                  >
                    Email Address
                  </Label>
                  <Input
                    id="new-member-email"
                    type="email"
                    placeholder="teammate@example.com"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    required
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="new-member-role"
                    className="text-xs font-medium"
                  >
                    Role
                  </Label>
                  <Select
                    value={newMemberRole}
                    onValueChange={(val) => val && setNewMemberRole(val)}
                  >
                    <SelectTrigger id="new-member-role" className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAddMemberOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isAddingMember || !newMemberEmail.trim()}
                >
                  {isAddingMember ? "Adding..." : "Add to Team"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className="space-y-3">
        {teamMembers.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2 text-center">
            No team members found for this project.
          </p>
        ) : (
          <div className="divide-y divide-border rounded-md border border-border">
            {teamMembers.map((member) => {
              const isOwner = member.teamRole === "owner";
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar size="sm">
                      {member.image && (
                        <AvatarImage src={member.image} alt={member.name} />
                      )}
                      <AvatarFallback>
                        {(member.name || member.email)
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground truncate">
                          {member.name || member.email}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-[10px] uppercase font-mono px-1.5 py-0 h-4"
                        >
                          {member.teamRole}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {member.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {member.githubConnected && member.githubUsername ? (
                      <a
                        href={`https://github.com/${member.githubUsername}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-muted/60 hover:bg-muted text-[11px] text-foreground font-mono transition-colors"
                        title="GitHub connected"
                      >
                        <svg
                          className="size-3 fill-current"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.7.08-.7 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.73 1.27 3.4.97.1-.76.4-1.27.73-1.56-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.07.78 2.15v3.18c0 .31.2.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
                        </svg>
                        <span>@{member.githubUsername}</span>
                        <Check className="size-3 text-emerald-500" />
                      </a>
                    ) : member.githubConnected ? (
                      <div
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-muted/60 text-[11px] text-foreground font-mono"
                        title="GitHub connected"
                      >
                        <svg
                          className="size-3 fill-current"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.7.08-.7 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.73 1.27 3.4.97.1-.76.4-1.27.73-1.56-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.07.78 2.15v3.18c0 .31.2.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
                        </svg>
                        <span>Connected</span>
                        <Check className="size-3 text-emerald-500" />
                      </div>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[11px] text-muted-foreground font-normal gap-1"
                      >
                        <AlertCircle className="size-3 text-amber-500" />
                        <span>No GitHub</span>
                      </Badge>
                    )}

                    {!isOwner && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          onRemoveMember(member.id, member.name || member.email)
                        }
                        disabled={removingMemberId === member.id}
                        className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Remove from team"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {hasGithubRepo && (
          <p className="text-[11px] text-muted-foreground pt-1">
            Note: Team members must link their GitHub account in Account
            Settings to be assigned tasks in this GitHub-connected project.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
