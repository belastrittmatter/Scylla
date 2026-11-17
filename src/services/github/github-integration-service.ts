import {
  GithubIssueService,
  type CreateIssueResult,
  type SyncTaskToGitHubUpdates,
} from "./github-issue-service";
import {
  GithubBranchService,
  type CreateBranchResult,
} from "./github-branch-service";
import {
  GithubDevService,
  type TaskDevelopmentInfo,
} from "./github-dev-service";
import { GithubUserResolver } from "./github-user-resolver";

export type {
  CreateIssueResult,
  SyncTaskToGitHubUpdates,
} from "./github-issue-service";
export type { CreateBranchResult } from "./github-branch-service";
export type { TaskDevelopmentInfo } from "./github-dev-service";

/** Single entry point for Scylla's GitHub features. */
export class GithubIntegrationService {
  static createIssueForTask(
    taskId: string,
    userId?: string,
  ): Promise<CreateIssueResult | null> {
    return GithubIssueService.createIssueForTask(taskId, userId);
  }

  static syncTaskToGitHub(
    taskId: string,
    updates: SyncTaskToGitHubUpdates,
    userId?: string,
  ): Promise<boolean> {
    return GithubIssueService.syncTaskToGitHub(taskId, updates, userId);
  }

  /** Makes sure the task has an issue first, so the branch name carries its number. */
  static async createBranchForTask(
    taskId: string,
    customBranchName?: string,
    userId?: string,
  ): Promise<CreateBranchResult> {
    await GithubIssueService.createIssueForTask(taskId, userId).catch(
      () => null,
    );
    return GithubBranchService.createBranchForTask(
      taskId,
      customBranchName,
      userId,
    );
  }

  static getTaskDevelopmentInfo(
    taskId: string,
    userId?: string,
  ): Promise<TaskDevelopmentInfo> {
    return GithubDevService.getTaskDevelopmentInfo(taskId, userId);
  }

  static resolveGitHubUsername(
    targetUserId: string,
    authUserId?: string,
  ): Promise<string | null> {
    return GithubUserResolver.resolveGitHubUsername(targetUserId, authUserId);
  }

  static inviteCollaborator(
    owner: string,
    repo: string,
    username: string,
    authUserId?: string,
  ): Promise<boolean> {
    return GithubUserResolver.inviteCollaborator(
      owner,
      repo,
      username,
      authUserId,
    );
  }

  static inviteTeamCollaborators(
    teamId: string,
    githubRepo: string,
    inviterUserId?: string,
  ): Promise<{ invited: string[]; skipped: string[] }> {
    return GithubUserResolver.inviteTeamCollaborators(
      teamId,
      githubRepo,
      inviterUserId,
    );
  }
}
