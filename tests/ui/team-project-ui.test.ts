import { describe, it, expect } from "bun:test";
import { PROJECT_STATUS_CONFIG } from "@/components/projects/project-status-badge";
import { slugify } from "@/lib/utils";
import type { ProjectStatus } from "@/services/project/project-types";

describe("Team & Project UI Helpers", () => {
  it("should have complete status configuration for all project statuses", () => {
    const expectedStatuses: ProjectStatus[] = [
      "planning",
      "active",
      "paused",
      "completed",
      "archived",
    ];

    for (const status of expectedStatuses) {
      expect(PROJECT_STATUS_CONFIG[status]).toBeDefined();
      expect(PROJECT_STATUS_CONFIG[status].label).toBeTruthy();
      expect(PROJECT_STATUS_CONFIG[status].colorClass).toBeTruthy();
      expect(PROJECT_STATUS_CONFIG[status].dotClass).toBeTruthy();
    }
  });

  it("should generate valid project and team slugs via slugify", () => {
    expect(slugify("Core Engineering Team")).toBe("core-engineering-team");
    expect(slugify("Mobile App 2.0 (Redesign)")).toBe("mobile-app-20-redesign");
    expect(slugify("   Spaces & Symbols!   ")).toBe("spaces-symbols");
  });

  it("should provide distinct colors and labels for statuses", () => {
    expect(PROJECT_STATUS_CONFIG.planning.label).toBe("Planning");
    expect(PROJECT_STATUS_CONFIG.active.label).toBe("Active");
    expect(PROJECT_STATUS_CONFIG.paused.label).toBe("Paused");
    expect(PROJECT_STATUS_CONFIG.completed.label).toBe("Completed");
    expect(PROJECT_STATUS_CONFIG.archived.label).toBe("Archived");
  });
});
