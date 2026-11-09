import { db } from "@/db";
import { task } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { ProjectService } from "@/services/project/project-service";
import { TaskService } from "@/services/task/task-service";
import { GithubAuthService } from "./github-auth-service";
import { GithubCollaboratorMatcher } from "./github-collaborator-matcher";
import { buildBranchMap, buildPrMap } from "./github-sync-mapping";
import {
  GithubRepoService,
  type GitHubRepositoryItem,
  type ListRepositoriesResult,
  type CreateRepositoryParams,
  type CreatedRepositoryResult,
} from "./github-repo-service";

export type {
  GitHubRepositoryItem,
  ListRepositoriesResult,
  CreateRepositoryParams,
  CreatedRepositoryResult,
};

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body?: string | null;
  state: "open" | "closed" | string;
  html_url: string;
  pull_request?: unknown;
  assignee?: { login: string; id?: number } | null;
  assignees?: Array<{ login: string; id?: number }>;
}

export interface GitHubCollaborator {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  permissions?: {
    admin?: boolean;
    push?: boolean;
    pull?: boolean;
  };
}

export interface SyncResult {
  repository: string;
  createdCount: number;
  updatedCount: number;
  totalIssues: number;
  collaboratorsCount: number;
}

export class GithubSyncService {
  public static async listUserRepositories(
    userId: string,
  ): Promise<ListRepositoriesResult> {
    return GithubRepoService.listUserRepositories(userId);
  }

  public static async createAndSetupRepository(
    params: CreateRepositoryParams,
    userId: string,
  ): Promise<CreatedRepositoryResult> {
    return GithubRepoService.createAndSetupRepository(params, userId);
  }

  public static async syncCollaborators(
    teamId: string,
    owner: string,
    repo: string,
    token?: string,
    userId?: string,
  ): Promise<Map<string, string>> {
    return GithubCollaboratorMatcher.syncCollaborators(
      teamId,
      owner,
      repo,
      token,
      userId,
    );
  }

  public static async syncProjectIssues(
    projectId: string,
    currentUserId?: string,
  ): Promise<SyncResult> {
    const projectRecord = await ProjectService.getProjectById(projectId);
    if (!projectRecord) {
      throw new Error(`Project with id "${projectId}" not found`);
    }

    if (!projectRecord.githubRepo?.trim()) {
      throw new Error("Project is not linked to any GitHub repository");
    }

    const parts = projectRecord.githubRepo.trim().split("/");
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new Error(
        `Invalid GitHub repository format "${projectRecord.githubRepo}". Expected "owner/repo"`,
      );
    }

    const [owner, repo] = parts;
    const token = await GithubAuthService.resolveToken(currentUserId);

    const memberMap = await this.syncCollaborators(
      projectRecord.teamId,
      owner,
      repo,
      token,
      currentUserId,
    );

    const [issuesRes, branchesRes, pullsRes] = await Promise.all([
      GithubAuthService.fetchWithAuth(
        `https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=100`,
        {},
        currentUserId,
      ),
      GithubAuthService.fetchWithAuth(
        `https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`,
        {},
        currentUserId,
      ).catch(() => null),
      GithubAuthService.fetchWithAuth(
        `https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=100`,
        {},
        currentUserId,
      ).catch(() => null),
    ]);

    if (!issuesRes.ok) {
      const errorBody = await issuesRes.text().catch(() => "");
      throw new Error(
        `GitHub API returned ${issuesRes.status}: ${issuesRes.statusText}. ${errorBody}`.trim(),
      );
    }

    const data = (await issuesRes.json()) as GitHubIssue[];
    if (!Array.isArray(data)) {
      throw new Error("Invalid response from GitHub API");
    }

    const branchList = (
      branchesRes && branchesRes.ok
        ? await branchesRes.json().catch(() => [])
        : []
    ) as Array<{ name: string }>;

    const pullList = (
      pullsRes && pullsRes.ok ? await pullsRes.json().catch(() => []) : []
    ) as Array<{
      number: number;
      html_url: string;
      title: string;
      body?: string | null;
      state: "open" | "closed" | string;
      draft?: boolean;
      merged_at?: string | null;
      head?: { ref?: string };
    }>;

    const branchMap = buildBranchMap(branchList);
    const prMap = buildPrMap(pullList, branchMap);

    let fallbackCreatorId = currentUserId;
    if (!fallbackCreatorId) {
      const firstUser = await db.query.user.findFirst();
      if (!firstUser) {
        throw new Error("No users found to assign task creator");
      }
      fallbackCreatorId = firstUser.id;
    }

    let createdCount = 0;
    let updatedCount = 0;

    for (const issue of data) {
      if (issue.pull_request) continue;

      const existing = await db.query.task.findFirst({
        where: and(
          eq(task.projectId, projectId),
          eq(task.githubIssueNumber, issue.number),
        ),
      });

      const linkedPr = prMap.get(issue.number) || null;
      const linkedBranch =
        existing?.githubBranch ||
        linkedPr?.branch ||
        branchMap.get(issue.number) ||
        null;

      let mappedStatus: "todo" | "in_progress" | "in_review" | "done" = "todo";
      if (issue.state === "closed" || linkedPr?.state === "merged") {
        mappedStatus = "done";
      } else if (
        linkedPr &&
        (linkedPr.state === "open" || linkedPr.state === "draft")
      ) {
        mappedStatus = "in_review";
      } else if (linkedBranch) {
        mappedStatus = "in_progress";
      } else if (
        existing?.status === "in_progress" ||
        existing?.status === "in_review"
      ) {
        mappedStatus = existing.status as "in_progress" | "in_review";
      } else {
        mappedStatus = "todo";
      }

      const cleanTitle = (issue.title || "Untitled Issue").trim().slice(0, 200);
      const cleanDescription = issue.body ? issue.body.slice(0, 100000) : null;

      const assigneeLogin =
        issue.assignee?.login || issue.assignees?.[0]?.login;
      const matchedAssigneeId = assigneeLogin
        ? (memberMap.get(assigneeLogin.toLowerCase()) ?? null)
        : null;

      const gitData = {
        githubBranch: linkedBranch,
        githubPrNumber: linkedPr?.number ?? null,
        githubPrUrl: linkedPr?.url ?? null,
        githubPrStatus: linkedPr?.state ?? null,
      };

      if (existing) {
        await TaskService.updateTask(existing.id, {
          title: cleanTitle,
          description: cleanDescription,
          status: mappedStatus,
          githubIssueUrl: issue.html_url,
          ...gitData,
          ...(matchedAssigneeId ? { assigneeId: matchedAssigneeId } : {}),
        });
        updatedCount++;
      } else {
        await TaskService.createTask({
          title: cleanTitle,
          description: cleanDescription || undefined,
          status: mappedStatus,
          priority: "medium",
          teamId: projectRecord.teamId,
          projectId: projectRecord.id,
          creatorId: fallbackCreatorId,
          assigneeId: matchedAssigneeId,
          githubIssueNumber: issue.number,
          githubIssueUrl: issue.html_url,
          ...gitData,
        });
        createdCount++;
      }
    }

    return {
      repository: projectRecord.githubRepo,
      createdCount,
      updatedCount,
      totalIssues: createdCount + updatedCount,
      collaboratorsCount: memberMap.size,
    };
  }
}
