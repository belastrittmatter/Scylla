import { describe, it, expect } from "bun:test";
import { MAIN_NAV_ITEMS } from "@/constants/navigation";
import { roleInTeam } from "@/services/team/team-summaries";
import TeamProjectsRedirect from "@/app/(auth)/teams/[slug]/projects/page";
import ProjectRedirect from "@/app/(auth)/teams/[slug]/projects/[projectSlug]/page";
import ProjectsRedirect from "@/app/(auth)/projects/page";

async function redirectTarget(run: () => unknown): Promise<string> {
  try {
    await run();
  } catch (err) {
    return (err as { digest?: string }).digest ?? "";
  }
  return "";
}

describe("team routes", () => {
  it("lists Teams in the main navigation between Tasks and Settings", () => {
    const ids = MAIN_NAV_ITEMS.map((i) => i.id);
    expect(ids.indexOf("teams")).toBe(ids.indexOf("tasks") + 1);
    expect(ids.indexOf("teams")).toBe(ids.indexOf("settings") - 1);
    expect(MAIN_NAV_ITEMS.find((i) => i.id === "teams")?.url).toBe("/teams");
  });

  it("redirects /teams/[slug]/projects to the projects tab", async () => {
    const digest = await redirectTarget(() =>
      TeamProjectsRedirect({ params: Promise.resolve({ slug: "core" }) }),
    );
    expect(digest).toContain("/teams/core?tab=projects");
  });

  it("redirects a project URL to the scoped task board", async () => {
    const digest = await redirectTarget(() =>
      ProjectRedirect({
        params: Promise.resolve({ slug: "core", projectSlug: "api" }),
      }),
    );
    expect(digest).toContain("/tasks?scope=team&team=core&project=api");
  });

  it("redirects /projects to /teams", async () => {
    expect(await redirectTarget(() => ProjectsRedirect())).toContain("/teams");
  });
});

describe("roleInTeam", () => {
  const team = { ownerId: "u1", members: [{ userId: "u2", role: "viewer" }] };
  it("gives a non-member no role (gate for the /teams/[slug] 404)", () => {
    expect(roleInTeam(team, "stranger")).toBeUndefined();
  });
  it("owner column wins; members get their row role", () => {
    expect(roleInTeam(team, "u1")).toBe("owner");
    expect(roleInTeam(team, "u2")).toBe("viewer");
  });
});
