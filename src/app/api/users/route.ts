import { resolveUserId } from "@/services/api-utils";
import { db } from "@/db";
import { user, account, teamMember, team } from "@/db/schema";
import { eq, and, inArray, asc } from "drizzle-orm";
import { TeamService } from "@/services/team/team-service";
import { GithubIntegrationService } from "@/services/github/github-integration-service";
import type { TeamRole } from "@/services/team/team-types";

export async function GET(req: Request) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Get all teams accessible to the current user
    const userTeams = await TeamService.listUserTeams(userId);
    const teamIds = userTeams.map((t) => t.id);

    if (teamIds.length === 0) {
      // If user has no teams, return their own profile
      const [self] = await db
        .select()
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);
      const [selfAcc] = await db
        .select()
        .from(account)
        .where(
          and(eq(account.userId, userId), eq(account.providerId, "github")),
        )
        .limit(1);

      let selfGhUsername: string | null = null;
      if (selfAcc) {
        if (selfAcc.accountId && !/^\d+$/.test(selfAcc.accountId)) {
          selfGhUsername = selfAcc.accountId;
        } else if (self?.email?.endsWith("@users.noreply.github.com")) {
          selfGhUsername = self.email.replace("@users.noreply.github.com", "");
        } else {
          selfGhUsername = await GithubIntegrationService.resolveGitHubUsername(
            userId,
            userId,
          );
        }
      }

      return Response.json(
        self
          ? [
              {
                id: self.id,
                name: self.name,
                email: self.email,
                image: self.image,
                role: self.role || "member",
                githubConnected: !!selfAcc,
                githubUsername: selfGhUsername,
                createdAt: self.createdAt,
                teams: [],
              },
            ]
          : [],
        { status: 200 },
      );
    }

    // 2. Get all team memberships within those teams
    const allMemberships = await db
      .select({
        teamId: teamMember.teamId,
        userId: teamMember.userId,
        role: teamMember.role,
        teamName: team.name,
        teamSlug: team.slug,
      })
      .from(teamMember)
      .innerJoin(team, eq(teamMember.teamId, team.id))
      .where(inArray(teamMember.teamId, teamIds));

    const memberUserIds = Array.from(
      new Set(allMemberships.map((m) => m.userId)),
    );

    // 3. Fetch users and their GitHub account links
    const [allUsers, allGithubAccounts] = await Promise.all([
      db
        .select()
        .from(user)
        .where(inArray(user.id, memberUserIds))
        .orderBy(asc(user.name)),
      db
        .select({
          userId: account.userId,
          accountId: account.accountId,
        })
        .from(account)
        .where(
          and(
            inArray(account.userId, memberUserIds),
            eq(account.providerId, "github"),
          ),
        ),
    ]);

    const ghMap = new Map(
      allGithubAccounts.map((a) => [a.userId, a.accountId]),
    );

    const usersResult = await Promise.all(
      allUsers.map(async (u) => {
        const ghAccId = ghMap.get(u.id);
        const isConnected = ghAccId !== undefined;
        let ghUsername: string | null = null;

        if (isConnected) {
          if (ghAccId && !/^\d+$/.test(ghAccId)) {
            ghUsername = ghAccId;
          } else if (u.email?.endsWith("@users.noreply.github.com")) {
            ghUsername = u.email.replace("@users.noreply.github.com", "");
          } else {
            ghUsername = await GithubIntegrationService.resolveGitHubUsername(
              u.id,
              userId,
            );
          }
        }

        const userTeamsList = allMemberships
          .filter((m) => m.userId === u.id)
          .map((m) => ({
            teamId: m.teamId,
            teamName: m.teamName,
            teamSlug: m.teamSlug,
            role: m.role,
          }));

        return {
          id: u.id,
          name: u.name,
          email: u.email,
          image: u.image,
          role: userTeamsList[0]?.role || u.role || "member",
          githubConnected: isConnected,
          githubUsername: ghUsername,
          createdAt: u.createdAt,
          teams: userTeamsList,
        };
      }),
    );

    return Response.json(usersResult, { status: 200 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to list users" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const callerUserId = await resolveUserId(req);
    if (!callerUserId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      email?: string;
      name?: string;
      teamId?: string;
      role?: TeamRole;
    };

    if (!body.email?.trim()) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    if (!body.teamId?.trim()) {
      return Response.json({ error: "teamId is required" }, { status: 400 });
    }

    const isAuthorized = await TeamService.isTeamAdminOrOwner(
      body.teamId.trim(),
      callerUserId,
    );

    if (!isAuthorized && process.env.NODE_ENV === "production") {
      return Response.json(
        { error: "Only team admins or owners can add new members" },
        { status: 403 },
      );
    }

    const member = await TeamService.addTeamMember({
      teamId: body.teamId.trim(),
      email: body.email.trim(),
      role: body.role || "member",
    });

    return Response.json({ success: true, data: member }, { status: 201 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to add user" },
      { status: 500 },
    );
  }
}
