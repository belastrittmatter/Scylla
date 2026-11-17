import { and, eq, max } from "drizzle-orm";
import { db } from "@/db";
import { task, team } from "@/db/schema";
import { parseGithubRepoFullName } from "@/lib/github-validation";
import { ProjectService } from "@/services/project/project-service";
import { GithubAuthService } from "./github-auth-service";
import { GithubApiError } from "./github-errors";
import {
  timelinePullNumbers,
  pickLinkedPullRequest,
  toPullSummary,
  type GithubRawPull,
} from "./github-pr-linking";
import type { GithubPullSummary } from "./github-types";
import {
  mapIssueToTaskFields,
  type GithubIssueItem,
} from "./github-sync-mapping";

export interface SyncResult {
  repository: string;
  createdCount: number;
  updatedCount: number;
  totalIssues: number;
}

export const BACKGROUND_SYNC_MIN_INTERVAL_MS = 60_000;

const inFlight = new Map<string, Promise<SyncResult | null>>();
const lastRun = new Map<string, number>();

const API = "https://api.github.com";

export class GithubSyncService {
  static async syncProjectIssues(
    projectId: string,
    userId?: string,
  ): Promise<SyncResult> {
    const project = await ProjectService.getProjectById(projectId);
    if (!project) throw new Error(`Project with id "${projectId}" not found`);
    const parsed = parseGithubRepoFullName(project.githubRepo);
    if (!parsed)
      throw new Error("Project is not linked to a GitHub repository");
    const { owner, repo } = parsed;
    const base = `${API}/repos/${owner}/${repo}`;
    const fullName = project.githubRepo!;
    const get = (path: string) =>
      GithubAuthService.fetchWithAuth(`${base}${path}`, {}, userId);

    const issuesRes = await get("/issues?state=all&per_page=100");
    if (!issuesRes.ok) {
      throw new GithubApiError(
        issuesRes.status,
        `GitHub API returned ${issuesRes.status}`,
      );
    }
    const raw = (await issuesRes.json()) as GithubIssueItem[];
    const issues = (Array.isArray(raw) ? raw : []).filter(
      (i) => !i.pull_request,
    );
    const pulls = await GithubSyncService.loadPulls(get);

    const ownerId =
      userId ??
      (await db.query.team.findFirst({ where: eq(team.id, project.teamId) }))
        ?.ownerId;
    const ctx = {
      id: project.id,
      teamId: project.teamId,
      githubRepo: fullName,
    };
    let createdCount = 0;
    let updatedCount = 0;

    for (const issue of issues) {
      const [existing] = await db
        .select()
        .from(task)
        .where(
          and(
            eq(task.projectId, project.id),
            eq(task.githubIssueNumber, issue.number),
          ),
        )
        .limit(1);
      const fields = mapIssueToTaskFields(issue, ctx, existing);
      let taskId: string;
      const branch = existing?.githubBranch ?? null;
      if (existing) {
        await db
          .update(task)
          .set({ ...fields, updatedAt: new Date() })
          .where(eq(task.id, existing.id));
        taskId = existing.id;
        updatedCount++;
      } else {
        if (!ownerId) throw new Error("Project team has no owner");
        const position = await GithubSyncService.nextPosition(
          project.teamId,
          fields.status,
        );
        const [row] = await db
          .insert(task)
          .values({
            ...fields,
            teamId: project.teamId,
            projectId: project.id,
            creatorId: ownerId,
            assigneeId: null,
            position,
          })
          .returning({ id: task.id });
        taskId = row.id;
        createdCount++;
      }
      if (pulls.length > 0) {
        const events = await get(
          `/issues/${issue.number}/timeline?per_page=100`,
        )
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => []);
        const linked = pickLinkedPullRequest(pulls, {
          issueNumber: issue.number,
          branch,
          timelinePullNumbers: timelinePullNumbers(events, fullName),
        });
        if (linked) {
          await db
            .update(task)
            .set({
              githubPrNumber: linked.number,
              githubPrUrl: linked.url,
              githubPrStatus: linked.state,
              githubBranch: branch ?? linked.headRef,
            })
            .where(eq(task.id, taskId));
        }
      }
    }

    return {
      repository: fullName,
      createdCount,
      updatedCount,
      totalIssues: createdCount + updatedCount,
    };
  }

  static startBackgroundSync(
    projectId: string,
    userId?: string,
  ): Promise<SyncResult | null> {
    const running = inFlight.get(projectId);
    if (running) return running;
    const last = lastRun.get(projectId);
    if (
      last !== undefined &&
      Date.now() - last < BACKGROUND_SYNC_MIN_INTERVAL_MS
    )
      return Promise.resolve(null);
    const promise = GithubSyncService.syncProjectIssues(projectId, userId)
      .catch((error: unknown) => {
        console.warn(`GitHub background sync failed for ${projectId}`, error);
        return null;
      })
      .finally(() => {
        inFlight.delete(projectId);
        lastRun.set(projectId, Date.now());
      });
    inFlight.set(projectId, promise);
    return promise;
  }

  static resetBackgroundSyncState(): void {
    inFlight.clear();
    lastRun.clear();
  }

  private static async loadPulls(
    get: (path: string) => Promise<Response>,
  ): Promise<GithubPullSummary[]> {
    try {
      const res = await get("/pulls?state=all&per_page=100");
      if (!res.ok) return [];
      const data = (await res.json()) as GithubRawPull[];
      return Array.isArray(data) ? data.map(toPullSummary) : [];
    } catch {
      return [];
    }
  }

  private static async nextPosition(
    teamId: string,
    status: string,
  ): Promise<number> {
    const [row] = await db
      .select({ value: max(task.position) })
      .from(task)
      .where(and(eq(task.teamId, teamId), eq(task.status, status as never)));
    return (row?.value ?? -1) + 1;
  }
}
