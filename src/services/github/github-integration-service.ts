import { GithubAuthService } from "./github-auth-service";
import {
  type CreateIssueResult,
  type CreateBranchResult,
  type TaskDevelopmentInfo,
  type SyncTaskToGitHubUpdates,
  generateBranchName,
  isPrLinkedToIssue,
} from "./github-dev-utils";
import { GithubUserResolver } from "./github-user-resolver";
import { GithubCommentService } from "./github-comment-service";
import { GithubBranchService } from "./github-branch-service";
import { GithubIssueService } from "./github-issue-service";
import { GithubDevService } from "./github-dev-service";

export type {
  CreateIssueResult,
  CreateBranchResult,
  TaskDevelopmentInfo,
  SyncTaskToGitHubUpdates,
};

export { isPrLinkedToIssue, generateBranchName };

export class GithubIntegrationService {
  public static generateBranchName = generateBranchName;

  public static async resolveToken(
    userId?: string,
  ): Promise<string | undefined> {
    return GithubAuthService.resolveToken(userId);
  }

  public static async createIssueForTask(
    taskId: string,
    userId?: string,
  ): Promise<CreateIssueResult | null> {
    return GithubIssueService.createIssueForTask(taskId, userId);
  }

  public static async createBranchForTask(
    taskId: string,
    customBranchName?: string,
    userId?: string,
  ): Promise<CreateBranchResult> {
    return GithubBranchService.createBranchForTask(
      taskId,
      customBranchName,
      userId,
    );
  }

  public static async getTaskDevelopmentInfo(
    taskId: string,
    userId?: string,
  ): Promise<TaskDevelopmentInfo> {
    return GithubDevService.getTaskDevelopmentInfo(taskId, userId);
  }

  public static async updateIssueState(
    taskId: string,
    status: string,
    userId?: string,
  ): Promise<boolean> {
    return GithubIssueService.updateIssueState(taskId, status, userId);
  }

  public static async updateIssueAssignee(
    taskId: string,
    newAssigneeId: string | null,
    userId?: string,
  ): Promise<boolean> {
    return GithubIssueService.updateIssueAssignee(
      taskId,
      newAssigneeId,
      userId,
    );
  }

  public static async inviteCollaborator(
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

  public static async inviteTeamCollaborators(
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

  public static async resolveGitHubUsername(
    targetUserId: string,
    authUserId?: string,
  ): Promise<string | null> {
    return GithubUserResolver.resolveGitHubUsername(targetUserId, authUserId);
  }

  public static async syncTaskToGitHub(
    taskId: string,
    updates: SyncTaskToGitHubUpdates,
    userId?: string,
  ): Promise<boolean> {
    return GithubIssueService.syncTaskToGitHub(taskId, updates, userId);
  }

  public static async getIssueComments(
    taskId: string,
    userId?: string,
  ): Promise<
    Array<{
      id: string;
      taskId: string;
      userId: string;
      content: string;
      createdAt: Date;
      updatedAt: Date;
      source: "github";
      htmlUrl?: string;
      user: {
        id: string;
        name: string;
        email?: string;
        avatarUrl?: string;
        initials?: string;
      };
    }>
  > {
    return GithubCommentService.getIssueComments(taskId, userId);
  }

  public static async createIssueComment(
    taskId: string,
    content: string,
    userId?: string,
  ): Promise<{ success: boolean; id?: number; htmlUrl?: string }> {
    return GithubCommentService.createIssueComment(taskId, content, userId);
  }
}
