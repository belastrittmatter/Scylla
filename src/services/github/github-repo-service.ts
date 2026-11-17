import {
  GITHUB_API_URL,
  GithubAuthService,
} from "@/services/github/github-auth-service";
import {
  parseGithubRepo,
  validateGithubRepoName,
} from "@/lib/github-validation";

export interface GitHubRepositoryItem {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  isPrivate: boolean;
  htmlUrl: string;
  updatedAt: string;
  defaultBranch: string | null;
}

export interface ListRepositoriesResult {
  connected: boolean;
  repositories: GitHubRepositoryItem[];
}

export interface CreateRepositoryParams {
  name: string;
  description?: string | null;
  isPrivate?: boolean;
}

export type GithubRepoErrorCode =
  "not_connected" | "invalid_name" | "already_exists" | "github_error";

export class GithubRepoError extends Error {
  readonly code: GithubRepoErrorCode;

  constructor(code: GithubRepoErrorCode, message: string) {
    super(message);
    this.name = "GithubRepoError";
    this.code = code;
  }
}

interface GithubRepoJson {
  id: number;
  name: string;
  full_name: string;
  description?: string | null;
  private: boolean;
  html_url: string;
  updated_at: string;
  default_branch?: string | null;
}

export const NOT_CONNECTED_MESSAGE =
  "Connect your GitHub account in Account Settings before linking a repository";

function toItem(repo: GithubRepoJson): GitHubRepositoryItem {
  return {
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description ?? null,
    isPrivate: repo.private,
    htmlUrl: repo.html_url,
    updatedAt: repo.updated_at,
    defaultBranch: repo.default_branch ?? null,
  };
}

async function githubMessage(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { message?: unknown };
    if (typeof data.message === "string" && data.message) return data.message;
  } catch {
    // body was not JSON; fall back to the status text
  }
  return res.statusText || `HTTP ${res.status}`;
}

export class GithubRepoService {
  static async listUserRepositories(
    userId: string,
  ): Promise<ListRepositoriesResult> {
    if (!(await GithubAuthService.isConnected(userId))) {
      return { connected: false, repositories: [] };
    }
    const res = await GithubAuthService.fetchWithAuth(
      `${GITHUB_API_URL}/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator,organization_member`,
      {},
      userId,
    );
    if (res.status === 401) return { connected: false, repositories: [] };
    if (!res.ok) {
      throw new GithubRepoError(
        "github_error",
        `Failed to list GitHub repositories: ${await githubMessage(res)}`,
      );
    }
    const data = (await res.json()) as GithubRepoJson[];
    return { connected: true, repositories: data.map(toItem) };
  }

  static async getRepository(
    fullName: string,
    userId: string,
  ): Promise<GitHubRepositoryItem | null> {
    const parsed = parseGithubRepo(fullName);
    if (!parsed) return null;
    if (!(await GithubAuthService.isConnected(userId))) return null;
    const res = await GithubAuthService.fetchWithAuth(
      `${GITHUB_API_URL}/repos/${parsed.owner}/${parsed.repo}`,
      {},
      userId,
    );
    if (!res.ok) return null;
    return toItem((await res.json()) as GithubRepoJson);
  }

  static async createRepository(
    params: CreateRepositoryParams,
    userId: string,
  ): Promise<GitHubRepositoryItem> {
    if (!(await GithubAuthService.isConnected(userId))) {
      throw new GithubRepoError("not_connected", NOT_CONNECTED_MESSAGE);
    }
    const validation = validateGithubRepoName(params.name);
    if (!validation.valid) {
      throw new GithubRepoError(
        "invalid_name",
        validation.error ?? "Invalid repository name",
      );
    }
    const res = await GithubAuthService.fetchWithAuth(
      `${GITHUB_API_URL}/user/repos`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: validation.cleanName,
          description: params.description ?? undefined,
          private: params.isPrivate ?? true,
          auto_init: true,
        }),
      },
      userId,
    );
    if (res.status === 422) {
      throw new GithubRepoError(
        "already_exists",
        `Repository "${validation.cleanName}" already exists on your GitHub account or the name is not allowed`,
      );
    }
    if (!res.ok) {
      throw new GithubRepoError(
        "github_error",
        `Failed to create GitHub repository: ${await githubMessage(res)}`,
      );
    }
    return toItem((await res.json()) as GithubRepoJson);
  }
}
