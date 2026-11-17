import { describe, expect, mock, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { ProjectSettingsView } from "@/components/projects/settings/project-settings-view";
import { ProjectGithubCard } from "@/components/projects/settings/project-github-card";
import { ProjectMembersCard } from "@/components/projects/settings/project-members-card";
import { ProjectSettingsSkeleton } from "@/components/projects/settings/project-settings-skeleton";
import { ProjectRow } from "@/components/projects/project-row";
import type { ProjectItem } from "@/hooks/use-projects";
import type { TeamRole } from "@/services/team/team-types";

const team = { id: "t1", name: "Core Team", slug: "core" };
const view = (githubRepo: string | null, role: TeamRole) =>
  renderToString(
    <ProjectSettingsView
      project={{
        id: "p1",
        name: "Apollo",
        slug: "apollo",
        teamId: "t1",
        githubRepo,
      }}
      team={team}
      role={role}
    />,
  );

describe("ProjectSettingsView", () => {
  test("admin with a linked repo sees the repo, sync, link and member controls", () => {
    const html = view("acme/widgets", "admin");
    // The project name is the page heading; the context line names the team.
    expect(html).toMatch(/<h1[^>]*>Apollo<\/h1>/);
    expect(html).toContain("Settings · Core Team");
    expect(html).toContain("acme/widgets");
    expect(html).toContain('href="https://github.com/acme/widgets"');
    expect(html).toContain("Sync issues");
    expect(html).toContain("Team Members");
    expect(html).toContain("Add member");
  });

  test("the repository is never in an editable input", () => {
    const html = view("acme/widgets", "admin");
    for (const input of html.match(/<input[^>]*>/g) ?? []) {
      if (input.includes("acme/widgets")) expect(input).toContain("readonly");
    }
  });

  test("not linked shows the empty message and no sync", () => {
    const html = view(null, "admin");
    expect(html).toContain(
      "This project is not linked to a GitHub repository.",
    );
    expect(html).not.toContain("Sync issues");
  });

  test("a viewer has no sync and no add member", () => {
    const html = view("acme/widgets", "viewer");
    expect(html).not.toContain("Sync issues");
    expect(html).not.toContain("Add member");
    expect(html).toContain("Open on GitHub");
  });

  test("a member can sync but not add members", () => {
    const html = view("acme/widgets", "member");
    expect(html).toContain("Sync issues");
    expect(html).not.toContain("Add member");
  });
});

describe("settings cards on their own", () => {
  test("ProjectGithubCard", () => {
    const html = renderToString(
      <ProjectGithubCard projectId="p1" githubRepo="acme/widgets" canSync />,
    );
    expect(html).toContain("GitHub Repository");
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  test("ProjectMembersCard shows loading first", () => {
    const html = renderToString(<ProjectMembersCard teamId="t1" canManage />);
    expect(html).toContain("Team Members");
    expect(html).toContain("Loading members");
    expect(html).toContain("Add member");
  });

  test("the page skeleton announces loading and hides its shapes", () => {
    const html = renderToString(<ProjectSettingsSkeleton />);
    expect(html).toContain('role="status"');
    expect(html).toContain("Loading project settings");
    expect(html).toContain('aria-hidden="true"');
  });
});

describe("ProjectRow settings link", () => {
  const project = {
    id: "p9",
    teamId: "t1",
    name: "Apollo",
    slug: "apollo",
    description: null,
    status: "active",
    color: null,
    createdAt: "",
    updatedAt: "",
  } satisfies ProjectItem;

  test.each([true, false])(
    "is shown to every member (canManage=%p)",
    (canManage) => {
      const html = renderToString(
        <ProjectRow
          project={project}
          teamSlug="core"
          canManage={canManage}
          onEdit={() => {}}
          onDelete={() => {}}
        />,
      );
      expect(html).toContain('href="/projects/p9/settings"');
      expect(html).toContain('aria-label="Open Apollo settings"');
    },
  );
});

describe("ProjectMembersCard member rows", () => {
  const members = [
    {
      id: "m1",
      teamId: "t1",
      userId: "u-owner",
      role: "owner",
      joinedAt: "",
      user: { id: "u-owner", name: "Olive Owner", email: "olive@example.com" },
    },
    {
      id: "m2",
      teamId: "t1",
      userId: "u-mem",
      role: "member",
      joinedAt: "",
      user: { id: "u-mem", name: "Mia Member", email: "mia@example.com" },
    },
  ];
  const loaded = (canManage: boolean) => {
    mock.module("@/components/teams/use-team-members", () => ({
      useTeamMembers: () => ({
        members,
        isLoading: false,
        addMember: async () => {},
        updateRole: async () => {},
        removeMember: async () => {},
      }),
    }));
    return renderToString(
      <ProjectMembersCard teamId="t1" canManage={canManage} />,
    );
  };

  test("lists name, email and role of each member", () => {
    const html = loaded(false);
    for (const text of [
      "Olive Owner",
      "olive@example.com",
      "Mia Member",
      "mia@example.com",
    ]) {
      expect(html).toContain(text);
    }
    expect(html).not.toContain("Loading members");
  });

  test("a manager gets one named Remove, only on non-owner rows", () => {
    const html = loaded(true);
    expect(html.match(/<button[^>]*aria-label="Remove [^"]*"/g)).toHaveLength(
      1,
    );
    expect(html).toContain('aria-label="Remove Mia Member"');
    expect(html).not.toContain('aria-label="Remove Olive Owner"');
    expect(html).toContain("Add member");
  });

  test("card titles are level-2 headings", () => {
    const html = loaded(true);
    expect(html).toContain("<h2>Team Members</h2>");
    const github = renderToString(
      <ProjectGithubCard projectId="p1" githubRepo="acme/widgets" canSync />,
    );
    expect(github).toContain("<h2>GitHub Repository</h2>");
  });

  test("a member without a name falls back to the email, shown once", () => {
    mock.module("@/components/teams/use-team-members", () => ({
      useTeamMembers: () => ({
        members: [
          {
            ...members[1],
            user: { id: "u-mem", name: "", email: "mia@example.com" },
          },
        ],
        isLoading: false,
        addMember: async () => {},
        updateRole: async () => {},
        removeMember: async () => {},
      }),
    }));
    const html = renderToString(<ProjectMembersCard teamId="t1" canManage />);
    expect(html.match(/>mia@example\.com</g)).toHaveLength(1);
    expect(html).toContain('aria-label="Remove mia@example.com"');
  });

  test("an empty or failed member load says so instead of a blank card", () => {
    mock.module("@/components/teams/use-team-members", () => ({
      useTeamMembers: () => ({
        members: [],
        isLoading: false,
        addMember: async () => {},
        updateRole: async () => {},
        removeMember: async () => {},
      }),
    }));
    const html = renderToString(<ProjectMembersCard teamId="t1" canManage />);
    expect(html).toContain("No members to show.");
    expect(html).not.toContain("<ul");
  });

  test("without canManage there is no Remove and no Add member", () => {
    const html = loaded(false);
    expect(html).not.toContain("Remove");
    expect(html).not.toContain("Add member");
  });
});
