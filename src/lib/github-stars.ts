import { cacheLife } from "next/cache";
import { z } from "zod";

const GITHUB_REPO_API_URL =
  "https://api.github.com/repos/belastrittmatter/Scylla";
const FETCH_TIMEOUT_MS = 5000;

const githubRepoSchema = z.object({
  stargazers_count: z.number().int().nonnegative(),
});

export async function fetchGitHubRepoStars(): Promise<number | null> {
  try {
    const response = await fetch(GITHUB_REPO_API_URL, {
      headers: { Accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) {
      return null;
    }
    const parsed = githubRepoSchema.safeParse(await response.json());
    return parsed.success ? parsed.data.stargazers_count : null;
  } catch {
    return null;
  }
}

export async function getGitHubRepoStars(): Promise<number | null> {
  "use cache";
  cacheLife("hours");
  return fetchGitHubRepoStars();
}
