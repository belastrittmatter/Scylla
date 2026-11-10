import { slugify } from "@/lib/utils";
import { GithubAuthService } from "./github-auth-service";

export interface GitHubRepositoryItem {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  isPrivate: boolean;
  htmlUrl: string;
  updatedAt: string;
  defaultBranch?: string;
}

export interface ListRepositoriesResult {
  connected: boolean;
  repositories: GitHubRepositoryItem[];
}

export interface CreateRepositoryParams {
  name: string;
  projectName?: string;
  description?: string | null;
  isPrivate?: boolean;
}

export interface CreatedRepositoryResult {
  id: number;
  name: string;
  fullName: string;
  htmlUrl: string;
  isPrivate: boolean;
  defaultBranch: string;
  labelsCreated: number;
}

export class GithubRepoService {
  /**
   * Fetches repositories for a user with a connected GitHub account.
   */
  public static async listUserRepositories(
    userId: string,
  ): Promise<ListRepositoriesResult> {
    const token = await GithubAuthService.resolveToken(userId);

    if (!token) {
      return { connected: false, repositories: [] };
    }

    const res = await GithubAuthService.fetchWithAuth(
      "https://api.github.com/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator,organization_member",
      {},
      userId,
    );

    if (!res.ok) {
      if (res.status === 401) {
        return { connected: false, repositories: [] };
      }
      throw new Error(`GitHub API error ${res.status}: ${res.statusText}`);
    }

    const data = (await res.json()) as Array<{
      id: number;
      name: string;
      full_name: string;
      description?: string | null;
      private: boolean;
      html_url: string;
      updated_at: string;
      default_branch?: string;
    }>;

    const repositories: GitHubRepositoryItem[] = data.map((r) => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      description: r.description || null,
      isPrivate: Boolean(r.private),
      htmlUrl: r.html_url,
      updatedAt: r.updated_at,
      defaultBranch: r.default_branch,
    }));

    return {
      connected: true,
      repositories,
    };
  }

  /**
   * Creates a new GitHub repository initialized with README, and configures
   * Scylla-compatible labels (status and priority) and issue templates.
   */
  public static async createAndSetupRepository(
    params: CreateRepositoryParams,
    userId: string,
  ): Promise<CreatedRepositoryResult> {
    const token = await GithubAuthService.resolveToken(userId);
    if (!token) {
      throw new Error(
        "No connected GitHub account found. Please connect your GitHub account in Settings.",
      );
    }

    const cleanName = slugify(
      params.name || params.projectName || "scylla-project",
    )
      .slice(0, 100)
      .replace(/^-+|-+$/g, "");

    if (!cleanName) {
      throw new Error("Valid repository name is required");
    }

    const isPrivate = params.isPrivate ?? true;
    const projectTitle = params.projectName || params.name;
    const desc =
      params.description ||
      `Repository for ${projectTitle} managed via Scylla Task Board`;

    // 1. Create repository via GitHub API
    const createRes = await GithubAuthService.fetchWithAuth(
      "https://api.github.com/user/repos",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: cleanName,
          description: desc,
          private: isPrivate,
          auto_init: true,
        }),
      },
      userId,
    );

    if (!createRes.ok) {
      const errJson = (await createRes.json().catch(() => null)) as {
        message?: string;
        errors?: Array<{ message: string }>;
      } | null;

      if (createRes.status === 422) {
        throw new Error(
          `Repository "${cleanName}" already exists on your GitHub account or name is invalid.`,
        );
      }
      throw new Error(
        `Failed to create GitHub repository: ${errJson?.message || createRes.statusText}`,
      );
    }

    const repoData = (await createRes.json()) as {
      id: number;
      name: string;
      full_name: string;
      html_url: string;
      private: boolean;
      default_branch?: string;
    };

    const [owner, repoName] = repoData.full_name.split("/");

    // 2. Setup Scylla standard labels
    const SCYLLA_LABELS = [
      {
        name: "status:todo",
        color: "94a3b8",
        description: "Task is pending and ready to work",
      },
      {
        name: "status:in-progress",
        color: "3b82f6",
        description: "Task is actively being worked on",
      },
      {
        name: "status:in-review",
        color: "8b5cf6",
        description: "Task has a pull request open under review",
      },
      {
        name: "status:done",
        color: "10b981",
        description: "Task is completed and merged",
      },
      {
        name: "status:cancelled",
        color: "ef4444",
        description: "Task has been cancelled",
      },
      {
        name: "priority:low",
        color: "64748b",
        description: "Low priority task",
      },
      {
        name: "priority:medium",
        color: "0ea5e9",
        description: "Medium priority task",
      },
      {
        name: "priority:high",
        color: "f59e0b",
        description: "High priority task",
      },
      {
        name: "priority:urgent",
        color: "ef4444",
        description: "Urgent priority task",
      },
    ];

    let labelsCreated = 0;
    await Promise.allSettled(
      SCYLLA_LABELS.map(async (label) => {
        try {
          const labelRes = await GithubAuthService.fetchWithAuth(
            `https://api.github.com/repos/${owner}/${repoName}/labels`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(label),
            },
            userId,
          );
          if (labelRes.ok) labelsCreated++;
        } catch {
          // ignore duplicate label error
        }
      }),
    );

    // 3. Setup Scylla Issue Template
    const issueTemplateContent = [
      "name: Scylla Task",
      "description: Create a task synchronized with Scylla Kanban Board",
      "title: '[FEAT] '",
      "labels: ['status:todo', 'priority:medium']",
      "body:",
      "  - type: markdown",
      "    attributes:",
      "      value: 'Task created for Scylla workflow'",
      "  - type: textarea",
      "    id: description",
      "    attributes:",
      "      label: Task Description",
      "      description: Clear summary of the task objectives and requirements",
      "      placeholder: Provide details here...",
      "    validations:",
      "      required: true",
    ].join("\n");

    try {
      await GithubAuthService.fetchWithAuth(
        `https://api.github.com/repos/${owner}/${repoName}/contents/.github/ISSUE_TEMPLATE/scylla_task.yml`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message:
              "chore(scylla): add Scylla task issue template and workflow labels",
            content: Buffer.from(issueTemplateContent).toString("base64"),
          }),
        },
        userId,
      );
    } catch {
      // Non-blocking template initialization
    }

    return {
      id: repoData.id,
      name: repoData.name,
      fullName: repoData.full_name,
      htmlUrl: repoData.html_url,
      isPrivate: Boolean(repoData.private),
      defaultBranch: repoData.default_branch || "main",
      labelsCreated,
    };
  }
}
