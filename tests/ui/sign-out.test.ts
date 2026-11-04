import { describe, expect, it, mock } from "bun:test";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { performSignOut } from "@/components/auth/sign-out";

describe("Logout / SignOut Feature", () => {
  it("allows authenticated user to access /auth/sign-out without redirecting to /", async () => {
    const req = new NextRequest("http://localhost:3000/auth/sign-out", {
      headers: {
        cookie: "better-auth.session_token=valid-token",
      },
    });
    const res = await proxy(req);
    expect(res.status).toBe(200);
  });

  it("exports SignOutPage from @/app/auth/sign-out/page", async () => {
    const mod = await import("@/app/auth/sign-out/page");
    expect(typeof mod.default).toBe("function");
  });

  it("performSignOut calls authClient.signOut with fetchOptions and redirects to sign-in on success", async () => {
    let capturedOnSuccess: (() => void) | undefined;
    const mockSignOut = mock(
      async (opts?: { fetchOptions?: { onSuccess?: () => void } }) => {
        capturedOnSuccess = opts?.fetchOptions?.onSuccess;
        capturedOnSuccess?.();
      },
    );
    const mockNavigate = mock(() => {});
    const mockRefresh = mock(() => {});

    await performSignOut({
      signOutFn: mockSignOut,
      onNavigateSignIn: mockNavigate,
      onRefresh: mockRefresh,
    });

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it("performSignOut still redirects to sign-in even if signOutFn throws", async () => {
    const mockSignOut = mock(async () => {
      throw new Error("Network failure");
    });
    const mockNavigate = mock(() => {});
    const mockRefresh = mock(() => {});

    await performSignOut({
      signOutFn: mockSignOut,
      onNavigateSignIn: mockNavigate,
      onRefresh: mockRefresh,
    });

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });
});
