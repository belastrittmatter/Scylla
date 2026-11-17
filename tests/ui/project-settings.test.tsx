import * as React from "react";
import { renderToString } from "react-dom/server";
import { describe, it, expect } from "bun:test";
import { ProjectGithubCard } from "@/components/projects/settings/project-github-card";
import { ProjectSettingsView } from "@/components/projects/settings/project-settings-view";
import { ProjectRow } from "@/components/projects/project-row";
import ProjectSettingsPage, {
  metadata,
} from "@/app/(auth)/projects/[id]/settings/page";
import type { ProjectItem } from "@/hooks/use-projects";
import type { TeamRole } from "@/services/team/team-types";

const noop = () => {};

describe("ProjectGithubCard", () => {
  it("shows the linked repository read-only with GitHub link and Sync now", () => {
    const html = renderToString(
      <ProjectGithubCard
        githubRepo="octo/repo"
        canSync
        isSyncing={false}
        onSync={noop}
      />,
    );
    expect(html).toContain("GitHub Integration");
    expect(html).toContain("octo/repo");
    expect(html).toContain("Linked");
    expect(html).toContain("Open in GitHub");
    expect(html).toContain('href="https://github.com/octo/repo"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noreferrer"');
    expect(html).toContain(
      "The repository link is read-only and cannot be changed after the project is created.",
    );
    expect(html).toContain("Sync now");
    expect(html).not.toContain("<input");
  });

  it("shows Syncing… and disables the button while syncing", () => {
    const html = renderToString(
      <ProjectGithubCard
        githubRepo="octo/repo"
        canSync
        isSyncing
        onSync={noop}
      />,
    );
    expect(html).toContain("Syncing…");
    expect(html).toMatch(/<button[^>]*disabled/);
  });

  it("hides the sync button when canSync is false", () => {
    const html = renderToString(
      <ProjectGithubCard
        githubRepo="octo/repo"
        canSync={false}
        isSyncing={false}
        onSync={noop}
      />,
    );
    expect(html).not.toContain("Sync now");
    expect(html).not.toContain("Syncing…");
  });

  it("shows the unlinked state", () => {
    const html = renderToString(
      <ProjectGithubCard
        githubRepo={null}
        canSync
        isSyncing={false}
        onSync={noop}
      />,
    );
    expect(html).toContain("No GitHub repository linked");
    expect(html).toContain(
      "A repository can be linked when the project is created.",
    );
    expect(html).not.toContain("github.com/");
    expect(html).not.toContain("Sync now");
  });
});

describe("ProjectGithubCard extra states", () => {
  it("enables the Sync now button when not syncing", () => {
    const html = renderToString(
      <ProjectGithubCard
        githubRepo="octo/repo"
        canSync
        isSyncing={false}
        onSync={noop}
      />,
    );
    expect(html).toContain("Sync now");
    expect(html).not.toMatch(/<button[^>]*\sdisabled(=|\s|>)/);
    expect(html).not.toContain("Syncing…");
  });

  it("replaces the label while syncing", () => {
    const html = renderToString(
      <ProjectGithubCard
        githubRepo="octo/repo"
        canSync
        isSyncing
        onSync={noop}
      />,
    );
    expect(html).not.toContain("Sync now");
  });

  it("keeps the repository and GitHub link for read-only users", () => {
    const html = renderToString(
      <ProjectGithubCard
        githubRepo="octo/repo"
        canSync={false}
        isSyncing={false}
        onSync={noop}
      />,
    );
    expect(html).toContain("octo/repo");
    expect(html).toContain("Linked");
    expect(html).toContain('href="https://github.com/octo/repo"');
  });

  it("shows no Linked badge or Open in GitHub when unlinked", () => {
    const html = renderToString(
      <ProjectGithubCard
        githubRepo={null}
        canSync
        isSyncing={false}
        onSync={noop}
      />,
    );
    expect(html).not.toContain("Open in GitHub");
    expect(html).not.toContain("Linked<");
    expect(html).not.toContain("read-only");
  });
});

function view(role: TeamRole, githubRepo: string | null = "octo/repo") {
  return renderToString(
    <ProjectSettingsView
      project={{
        id: "p1",
        name: "Alpha",
        slug: "alpha",
        color: null,
        githubRepo,
      }}
      team={{ id: "t1", name: "Core Team", slug: "core" }}
      role={role}
      userId="u1"
    />,
  );
}

describe("ProjectSettingsView", () => {
  it("renders header, GitHub card and members for an admin", () => {
    const html = view("admin");
    expect(html).toContain("Alpha Settings");
    expect(html).toContain("Core Team");
    expect(html).toContain("Back to board");
    expect(html).toContain("/tasks?scope=team&amp;team=core&amp;project=alpha");
    expect(html).toContain("octo/repo");
    expect(html).toContain("Sync now");
    expect(html).toContain("Team Members");
    expect(html).toContain("Add member");
  });

  it("members can sync but not add members", () => {
    const html = view("member");
    expect(html).toContain("Team Members");
    expect(html).toContain("Sync now");
    expect(html).not.toContain("Add member");
  });

  it("viewers cannot sync or add members", () => {
    const html = view("viewer");
    expect(html).not.toContain("Sync now");
    expect(html).not.toContain("Add member");
  });

  it("shows the unlinked state", () => {
    expect(view("admin", null)).toContain("No GitHub repository linked");
  });
});

describe("ProjectRow settings link", () => {
  const project: ProjectItem = {
    id: "p1",
    teamId: "t1",
    name: "Alpha",
    slug: "alpha",
    description: null,
    status: "active",
    color: null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
  };
  for (const canManage of [true, false]) {
    it(`links to settings when canManage=${canManage}`, () => {
      const html = renderToString(
        <ul>
          <ProjectRow
            project={project}
            teamSlug="core"
            canManage={canManage}
            onEdit={noop}
            onDelete={noop}
          />
        </ul>,
      );
      expect(html).toContain('href="/projects/p1/settings"');
      expect(html).toContain('aria-label="Open Alpha settings"');
      expect(html).toContain('aria-label="Open Alpha board"');
    });
  }
});

describe("project settings page module", () => {
  it("exports a page function and metadata", () => {
    expect(typeof ProjectSettingsPage).toBe("function");
    expect(metadata.title).toContain("Project Settings");
  });
});
