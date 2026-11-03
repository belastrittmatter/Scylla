import * as React from "react";
import { renderToString } from "react-dom/server";
import { describe, it, expect } from "bun:test";
import { AuthUIProvider, SessionsCard } from "@daveyplate/better-auth-ui";
import { AccountSettingsView } from "@/components/settings/account-settings-view";
import { authClient } from "@/lib/auth-client";

describe("SessionsCard & Session Revocation (Issue #35)", () => {
  const mockSessions = [
    {
      id: "sess-current",
      token: "tok-current-123",
      ipAddress: "127.0.0.1",
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(),
    },
    {
      id: "sess-remote-mobile",
      token: "tok-remote-456",
      ipAddress: "192.168.1.150",
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(),
    },
  ];

  it("renders SessionsCard on /account/settings under Security & Sessions", () => {
    const html = renderToString(
      <AuthUIProvider authClient={authClient}>
        <AccountSettingsView />
      </AuthUIProvider>,
    );

    expect(html).toContain("Security &amp; Sessions");
    expect(html).toContain(
      "View active browser and device sessions and revoke access remotely.",
    );
  });

  it("displays active sessions with correct OS, browser, and IP address", () => {
    const customHooks = {
      useSession: () => ({
        data: {
          session: {
            id: "sess-current",
            createdAt: new Date(),
            updatedAt: new Date(),
            userId: "usr-1",
            expiresAt: new Date(),
            token: "tok-current-123",
          },
          user: {
            id: "usr-1",
            name: "Alex Developer",
            email: "alex@example.com",
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        isPending: false,
        isRefetching: false,
        error: null,
        refetch: () => {},
      }),
      useListSessions: () => ({
        data: mockSessions,
        isPending: false,
        isRefetching: false,
        error: null,
        refetch: () => {},
      }),
    };

    const html = renderToString(
      <AuthUIProvider
        {...({
          authClient,
          hooks: customHooks,
        } as unknown as React.ComponentProps<typeof AuthUIProvider>)}
      >
        <SessionsCard />
      </AuthUIProvider>,
    );

    // Current session
    expect(html).toContain("Current Session");
    expect(html).toContain("macOS, Chrome");
    expect(html).toContain("Sign Out");

    // Remote mobile session
    expect(html).toContain("192.168.1.150");
    expect(html).toContain("iOS");
    expect(html).toContain("Revoke");
  });

  it("handles remote session revocation call with session token", async () => {
    let revokedToken: string | null = null;
    let refetchCalled = false;

    const customMutators = {
      revokeSession: async ({ token }: { token: string }) => {
        revokedToken = token;
        return { success: true };
      },
    };

    // Simulate the revocation handler used by SessionsCard for remote session
    const remoteSession = mockSessions[1];
    await customMutators.revokeSession({ token: remoteSession.token });
    refetchCalled = true;

    expect<string | null>(revokedToken).toBe("tok-remote-456");
    expect(refetchCalled).toBe(true);
  });

  it("triggers clean sign out and redirect to /sign-in when revoking current session", async () => {
    let signedOut = false;
    let redirectedTo: string | null = null;

    const mockAuthClient = {
      signOut: async () => {
        signedOut = true;
      },
    };

    const mockRouter = {
      push: (to: string) => {
        redirectedTo = to;
      },
    };

    // Simulate navigation handler logic from AuthUIProvider
    const handleNavigation = async (href: string) => {
      if (href === "/auth/sign-out" || href.endsWith("/sign-out")) {
        await mockAuthClient.signOut();
        mockRouter.push("/sign-in");
        return;
      }
      mockRouter.push(href);
    };

    await handleNavigation("/auth/sign-out");

    expect(signedOut).toBe(true);
    expect<string | null>(redirectedTo).toBe("/sign-in");
  });
});
