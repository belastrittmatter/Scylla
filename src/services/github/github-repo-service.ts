import { validateGithubRepoName } from "@/lib/github-validation";
import { GithubAuthService } from "./github-auth-service";
import { GithubApiError } from "./github-errors";

export interface GithubRepositorySummary {
  id: number;
  fullName: string;
  name: string;
  owner: string;
  private: boolean;
  htmlUrl: string;
  description: string | null;
}

export interface CreateRepositoryInput {
  name: string;
  description?: string | null;
  isPrivate?: boolean;
}

interface RawRepo {
  id: number;
  full_name: string;
  name: string;
  owner: { login: string };
  private: boolean;
  html_url: string;
  description?: string | null;
}

const REPOS_URL = "https://api.github.com/user/repos";

function toSummary(repo: RawRepo): GithubRepositorySummary {
  return {
    id: repo.id,
    fullName: repo.full_name,
    name: repo.name,
    owner: repo.owner.login,
    private: repo.private,
    htmlUrl: repo.html_url,
    description: repo.description ?? null,
  };
}

export class GithubRepoService {
  static async listUserRepositories(
    userId: string,
  ): Promise<{ connected: boolean; repositories: GithubRepositorySummary[] }> {
    if (!(await GithubAuthService.hasGithubConnection(userId))) {
      return { connected: false, repositories: [] };
    }
    const res = await GithubAuthService.fetchWithAuth(
      `${REPOS_URL}?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member`,
      {},
      userId,
    );
    if (!res.ok) {
      throw new GithubApiError(res.status, `GitHub API returned ${res.status}`);
    }
    const data = (await res.json()) as RawRepo[];
    return { connected: true, repositories: data.map(toSummary) };
  }

  static async createRepository(
    input: CreateRepositoryInput,
    userId: string,
  ): Promise<GithubRepositorySummary> {
    const validation = validateGithubRepoName(input.name);
    if (!validation.valid) {
      throw new Error(validation.error ?? "Invalid repository name");
    }
    if (!(await GithubAuthService.hasGithubConnection(userId))) {
      throw new Error("Connect your GitHub account to create a repository");
    }
    const description = input.description?.trim();
    const res = await GithubAuthService.fetchWithAuth(
      REPOS_URL,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: validation.cleanName,
          ...(description ? { description } : {}),
          private: input.isPrivate ?? true,
          auto_init: true,
        }),
      },
      userId,
    );
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as {
        message?: string;
      };
      throw new GithubApiError(
        res.status,
        `GitHub API returned ${res.status}: ${body.message ?? "Unknown error"}`,
      );
    }
    return toSummary((await res.json()) as RawRepo);
  }
}
