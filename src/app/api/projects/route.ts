import { ProjectService } from "@/services/project/project-service";
import { TeamService } from "@/services/team/team-service";
import { CreateProjectSchema } from "@/services/api-schemas";
import {
  ProjectStatusSchema,
  type ProjectStatus,
} from "@/services/project/project-types";
import { isUniqueConstraintError, resolveUserId } from "@/services/api-utils";
import { z } from "zod";
import { slugify } from "@/lib/utils";
import { GithubAuthService } from "@/services/github/github-auth-service";
import { GithubSyncService } from "@/services/github/github-sync-service";
import {
  GithubRepoError,
  GithubRepoService,
  type GithubRepoErrorCode,
} from "@/services/github/github-repo-service";

const CreateProjectRequestSchema = CreateProjectSchema.extend({
  createNewRepo: z
    .object({
      name: z.string().min(1, "Repository name is required"),
      isPrivate: z.boolean().default(true),
      description: z.string().nullable().optional(),
    })
    .optional(),
});

const REPO_ERROR_STATUS: Record<GithubRepoErrorCode, number> = {
  not_connected: 400,
  invalid_name: 400,
  already_exists: 409,
  github_error: 502,
};

function slugConflict(): Response {
  return Response.json(
    { error: "A project with this slug already exists" },
    { status: 409 },
  );
}

/** Decides which repository the new project links to, or answers with the error. */
async function resolveRepoToLink(
  userId: string,
  githubRepo: string | null | undefined,
  createNewRepo: z.infer<typeof CreateProjectRequestSchema>["createNewRepo"],
): Promise<{ githubRepo: string | null } | Response> {
  if (githubRepo && createNewRepo) {
    return Response.json(
      { error: "Provide either githubRepo or createNewRepo, not both" },
      { status: 400 },
    );
  }
  if (!githubRepo && !createNewRepo) return { githubRepo: githubRepo ?? null };

  if (!(await GithubAuthService.isConnected(userId))) {
    return Response.json(
      {
        error:
          "Connect your GitHub account in Account Settings before linking a repository",
      },
      { status: 400 },
    );
  }

  if (githubRepo) {
    const repo = await GithubRepoService.getRepository(githubRepo, userId);
    if (!repo) {
      return Response.json(
        {
          error: `GitHub repository "${githubRepo}" was not found or you do not have access to it`,
        },
        { status: 400 },
      );
    }
    return { githubRepo: repo.fullName };
  }

  try {
    const created = await GithubRepoService.createRepository(
      createNewRepo!,
      userId,
    );
    return { githubRepo: created.fullName };
  } catch (err) {
    if (err instanceof GithubRepoError) {
      return Response.json(
        { error: err.message },
        { status: REPO_ERROR_STATUS[err.code] },
      );
    }
    throw err;
  }
}

export async function GET(req: Request) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const teamId = url.searchParams.get("teamId");

    if (teamId) {
      const targetTeam = await TeamService.getTeamById(teamId);
      if (!targetTeam) {
        return Response.json(
          { error: `Team with id "${teamId}" not found` },
          { status: 404 },
        );
      }
      const isMember = await TeamService.isTeamMember(teamId, userId);
      if (!isMember) {
        return Response.json(
          { error: "Forbidden: Not a member of this team" },
          { status: 403 },
        );
      }
    }

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
    const userId = await resolveUserId(req);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    const parseResult = CreateProjectRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return Response.json(
        { error: parseResult.error.issues.map((i) => i.message).join(", ") },
        { status: 400 },
      );
    }

    const targetTeam = await TeamService.getTeamById(parseResult.data.teamId);
    if (!targetTeam) {
      return Response.json(
        { error: `Team with id "${parseResult.data.teamId}" not found` },
        { status: 404 },
      );
    }

    const isAuthorized = await TeamService.isTeamAdminOrOwner(
      parseResult.data.teamId,
      userId,
    );
    if (!isAuthorized) {
      return Response.json(
        { error: "Forbidden: Only team owners and admins can create projects" },
        { status: 403 },
      );
    }

    const { createNewRepo, ...projectFields } = parseResult.data;
    const slug = slugify(projectFields.slug || projectFields.name);
    if (await ProjectService.getProjectBySlug(projectFields.teamId, slug)) {
      return slugConflict();
    }
    const resolved = await resolveRepoToLink(
      userId,
      projectFields.githubRepo,
      createNewRepo,
    );
    if (resolved instanceof Response) return resolved;

    const newProject = await ProjectService.createProject({
      ...projectFields,
      githubRepo: resolved.githubRepo,
    });
    if (resolved.githubRepo) {
      void GithubSyncService.syncProjectIssuesInBackground(
        newProject.id,
        userId,
      );
    }
    return Response.json(newProject, { status: 201 });
  } catch (err) {
    if (isUniqueConstraintError(err)) return slugConflict();
    const message =
      err instanceof Error ? err.message : "Failed to create project";
    if (message.includes("not found")) {
      return Response.json({ error: message }, { status: 404 });
    }
    return Response.json({ error: message }, { status: 500 });
  }
}
