import * as React from "react";
import { renderToString } from "react-dom/server";
import { describe, it, expect } from "bun:test";
import { SettingsView } from "@/components/settings/settings-view";
import AccountSettingsPage, {
  metadata,
} from "@/app/(auth)/account/settings/page";
import { AccountSettingsView } from "@/components/settings/account-settings-view";
import { ConnectedAccountRow } from "@/components/settings/connected-account-row";
import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import { authClient } from "@/lib/auth-client";
import { userNameSchema } from "@/lib/validations/user";
import {
  calendarSettingsSchema,
  workingHoursSchema,
  DEFAULT_CALENDAR_SETTINGS,
} from "@/hooks/use-calendar-settings";

describe("Account & App Settings (Issue #34 & #37)", () => {
  it("renders symmetrical top-right link in SettingsView without Go to Calendar button", () => {
    const html = renderToString(<SettingsView />);

    expect(html).toContain('href="/account/settings"');
    expect(html).toContain("Account Settings");
    // Ensure "Go to Calendar" has been removed as requested
    expect(html).not.toContain("Go to Calendar");
    // Verify card structure
    expect(html).toContain("Interface Theme");
    expect(html).toContain("Default Calendar View");
    expect(html).toContain("Date &amp; Time Formatting");
    expect(html).toContain("Working Hours Window");
    expect(html).toContain("Calendar Overlays");
    expect(html).toContain("Restore Defaults");
  });

  it("renders AccountSettingsView with Profile, single Connected Accounts, Danger Zone, and without Set Password", () => {
    const html = renderToString(
      <AuthUIProvider authClient={authClient}>
        <AccountSettingsView />
      </AuthUIProvider>,
    );

    expect(html).toContain('href="/settings"');
    expect(html).toContain("Calendar &amp; Display Preferences");
    expect(html).toContain("Account Settings");
    // Verify structured sections and cards
    expect(html).toContain("Profile");
    expect(html).toContain("Connected Accounts");
    expect(html).toContain("Google");
    expect(html).toContain("GitHub");
    expect(html).toContain("AI Agents &amp; MCP Integrations");
    expect(html).toContain("AI Agent &amp; MCP Capabilities");
    expect(html).toContain("MCP Server URL");
    expect(html).toContain("Copy");
    expect(html).toContain("/api/mcp");
    expect(html).toContain("Danger Zone");
    // Verify Security / Password section was removed as requested
    expect(html).not.toContain("Security &amp; Credentials");
    expect(html).not.toContain("ChangePasswordCard");
    expect(html).toContain('accept="image/*"');
    expect(html).toContain('data-slot="card"');
  });

  it("exports valid metadata and mounts AccountSettingsPage", () => {
    expect(metadata.title).toContain("Account Settings");
    expect(metadata.description).toBeDefined();

    const pageHtml = renderToString(
      <AuthUIProvider authClient={authClient}>
        <AccountSettingsPage />
      </AuthUIProvider>,
    );
    expect(pageHtml).toContain('href="/settings"');
  });

  it("strictly enforces <= 32 character limit on userNameSchema and trims whitespace", () => {
    expect(userNameSchema.safeParse("Alex Developer").success).toBe(true);
    expect(userNameSchema.safeParse("a".repeat(32)).success).toBe(true);
    expect(userNameSchema.safeParse("a".repeat(33)).success).toBe(false);
    expect(userNameSchema.safeParse("").success).toBe(false);
    expect(userNameSchema.safeParse("   ").success).toBe(false);

    // Verify trimming behavior
    const trimmed = userNameSchema.parse("  Alex Developer  ");
    expect(trimmed).toBe("Alex Developer");
    const trimmed32 = userNameSchema.parse("   " + "a".repeat(32) + "   ");
    expect(trimmed32).toBe("a".repeat(32));
    expect(
      userNameSchema.safeParse("   " + "a".repeat(33) + "   ").success,
    ).toBe(false);
  });

  it("strictly enforces calendar settings and working hours schemas using Zod", () => {
    expect(
      calendarSettingsSchema.safeParse(DEFAULT_CALENDAR_SETTINGS).success,
    ).toBe(true);

    // Start hour must be before end hour
    expect(
      workingHoursSchema.safeParse({ dayStartHour: 9, dayEndHour: 17 }).success,
    ).toBe(true);
    expect(
      workingHoursSchema.safeParse({ dayStartHour: 17, dayEndHour: 9 }).success,
    ).toBe(false);
    expect(
      workingHoursSchema.safeParse({ dayStartHour: 10, dayEndHour: 10 })
        .success,
    ).toBe(false);
  });
});

describe("ConnectedAccountRow", () => {
  const base = {
    providerName: "GitHub",
    icon: null,
    isLoading: false,
    isConnected: false,
    connectedText: "Connected for issues, branches and pull requests",
    canUnlink: true,
    isBusy: false,
    onLink: () => {},
    onUnlink: () => {},
  };
  const render = (over: Partial<typeof base>) =>
    renderToString(<ConnectedAccountRow {...base} {...over} />);

  it("shows the name while loading, with no status or button text", () => {
    const html = render({ isLoading: true });
    expect(html).toContain("GitHub");
    expect(html).not.toContain("Not connected");
    expect(html).not.toContain("Link");
  });

  it("shows Not connected and Link when disconnected", () => {
    const html = render({});
    expect(html).toContain("Not connected");
    expect(html).toContain("Link");
    expect(html).not.toContain("issues, branches");
  });

  it("shows the connected text and an enabled Unlink with several accounts", () => {
    const html = render({ isConnected: true });
    expect(html).toContain("Connected for issues, branches and pull requests");
    expect(html).toContain("Unlink");
    expect(html).not.toContain(' disabled=""');
  });

  it("disables Unlink when it is the only account", () => {
    const html = render({ isConnected: true, canUnlink: false });
    expect(html).toContain(' disabled=""');
  });
});
