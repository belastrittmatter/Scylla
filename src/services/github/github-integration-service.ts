import {
  inviteCollaborator,
  inviteTeamCollaborators,
} from "./github-collaborator-service";
import {
  createIssueComment,
  listIssueComments,
} from "./github-comment-service";
import {
  createBranchForTask,
  getTaskDevelopmentInfo,
  refreshTaskPullRequest,
} from "./github-branch-service";
import { createIssueForTask, syncTaskToGitHub } from "./github-issue-service";

export * from "./github-types";
export * from "./github-errors";
export * from "./github-dev-utils";
export * from "./github-labels";
export * from "./github-pr-linking";

/** Thin facade over the GitHub issue, branch, comment and collaborator modules. */
export class GithubIntegrationService {
  static createIssueForTask = createIssueForTask;
  static syncTaskToGitHub = syncTaskToGitHub;
  static createBranchForTask = createBranchForTask;
  static refreshTaskPullRequest = refreshTaskPullRequest;
  static getTaskDevelopmentInfo = getTaskDevelopmentInfo;
  static listIssueComments = listIssueComments;
  static createIssueComment = createIssueComment;
  static inviteCollaborator = inviteCollaborator;
  static inviteTeamCollaborators = inviteTeamCollaborators;
}
