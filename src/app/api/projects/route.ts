import { ProjectService } from "@/services/project/project-service";
import { TeamService } from "@/services/team/team-service";
import { CreateProjectSchema } from "@/services/api-schemas";
import {
  ProjectStatusSchema,
  type ProjectStatus,
} from "@/services/project/project-types";
import { isUniqueConstraintError, resolveUserId } from "@/services/api-utils";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const teamId = url.searchParams.get("teamId");

    const slug = url.searchParams.get("slug");
    if (slug) {
      if (!teamId) {
        return Response.json(
          { error: "teamId parameter is required when querying by slug" },
          { status: 400 },
        );
      }
      const project = await ProjectService.getProjectBySlug(teamId, slug);
      if (!project) {
        return Response.json({ error: "Project not found" }, { status: 404 });
      }
      return Response.json(project, { status: 200 });
    }

    const statusParam = url.searchParams.get("status");
    let status: ProjectStatus | undefined = undefined;
    if (statusParam) {
      const parsedStatus = ProjectStatusSchema.safeParse(statusParam);
      if (!parsedStatus.success) {
        return Response.json(
          { error: "Invalid status parameter" },
          { status: 400 },
        );
      }
      status = parsedStatus.data;
    }

    if (teamId) {
      const projects = await ProjectService.listProjectsByTeam(
        teamId,
        status ? { status } : undefined,
      );
      return Response.json(projects, { status: 200 });
    }

    const userId = await resolveUserId(req);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userTeams = await TeamService.listUserTeams(userId);
    const teamIds = userTeams.map((t) => t.id);
    if (teamIds.length === 0) {
      return Response.json([], { status: 200 });
    }

    const projects = await ProjectService.listProjectsByTeams(
      teamIds,
      status ? { status } : undefined,
    );
    return Response.json(projects, { status: 200 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to get projects" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    const parseResult = CreateProjectSchema.safeParse(body);
    if (!parseResult.success) {
      return Response.json(
        { error: parseResult.error.issues.map((i) => i.message).join(", ") },
        { status: 400 },
      );
    }

    const userId = await resolveUserId(req);

    let targetGithubRepo = parseResult.data.githubRepo?.trim() || null;
    if (parseResult.data.createNewRepo) {
      if (!userId) {
        return Response.json(
          {
            error:
              "Unauthorized: Active user session required to create GitHub repository",
          },
          { status: 401 },
        );
      }

      const { validateGithubRepoName } =
        await import("@/lib/github-validation");
      const validation = validateGithubRepoName(
        parseResult.data.createNewRepo.name,
      );
      if (!validation.valid) {
        return Response.json(
          { error: validation.error || "Invalid GitHub repository name" },
          { status: 400 },
        );
      }

      const { GithubSyncService } =
        await import("@/services/github/github-sync-service");
      const createdRepo = await GithubSyncService.createAndSetupRepository(
        {
          name: validation.cleanName,
          description:
            parseResult.data.createNewRepo.description ||
            parseResult.data.description,
          isPrivate: parseResult.data.createNewRepo.isPrivate,
          projectName: parseResult.data.name,
        },
        userId,
      );
      targetGithubRepo = createdRepo.fullName;
    }

    const newProject = await ProjectService.createProject({
      ...parseResult.data,
      githubRepo: targetGithubRepo,
    });

    if (newProject.githubRepo?.trim()) {
      try {
        if (userId) {
          const { GithubIntegrationService } =
            await import("@/services/github/github-integration-service");
          await GithubIntegrationService.inviteTeamCollaborators(
            newProject.teamId,
            newProject.githubRepo.trim(),
            userId,
          );
        }
      } catch (inviteErr) {
        console.warn(
          "Failed to auto-invite team collaborators to GitHub repo:",
          inviteErr,
        );
      }

      try {
        const { GithubSyncService } =
          await import("@/services/github/github-sync-service");
        await GithubSyncService.syncProjectIssues(newProject.id, userId);
      } catch (syncErr) {
        console.error("Initial GitHub issue sync error:", syncErr);
      }
    }

    return Response.json(newProject, { status: 201 });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      return Response.json(
        { error: "A project with this slug already exists" },
        { status: 409 },
      );
    }
    const message =
      err instanceof Error ? err.message : "Failed to create project";
    if (message.includes("not found")) {
      return Response.json({ error: message }, { status: 404 });
    }
    return Response.json({ error: message }, { status: 500 });
  }
}
