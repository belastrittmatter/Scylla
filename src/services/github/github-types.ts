import type { TaskPriority, TaskStatus } from "@/services/task/task-types";

export type GithubPrState = "open" | "draft" | "merged" | "closed";

export interface GithubPullSummary {
  number: number;
  url: string;
  title: string;
  state: GithubPrState;
  headRef: string | null;
}

export interface GithubIssueResult {
  number: number;
  url: string;
}

export interface CreateBranchResult {
  branch: string;
  alreadyExisted: boolean;
  checkoutCommand: string;
  url: string;
}

export interface TaskDevelopmentInfo {
  repository: string | null;
  issueNumber: number | null;
  issueUrl: string | null;
  branch: string | null;
  suggestedBranch: string;
  checkoutCommand: string | null;
  pullRequest: GithubPullSummary | null;
}

export interface GithubIssueComment {
  id: string;
  body: string;
  htmlUrl: string;
  createdAt: string;
  updatedAt: string;
  author: { login: string; avatarUrl: string | null };
}

export interface TaskGithubChanges {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
}
