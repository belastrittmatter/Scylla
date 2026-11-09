import * as React from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, mock } from "bun:test";

mock.module("next/navigation", () => ({
  useRouter: () => ({ push() {}, replace() {}, refresh() {} }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/auth/sign-in",
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

describe("Sign-in is Google-only (#77)", () => {
  it("renders the Google button and no email/password surface", async () => {
    const { default: SignInPage } = await import("@/app/auth/sign-in/page");
    const html = renderToString(<SignInPage />);
    expect(html).toContain("Google");
    expect(html).not.toContain('type="password"');
    expect(html).not.toContain('name="email"');
    expect(html).not.toContain("/auth/forgot-password");
    expect(html).not.toContain("/auth/sign-up");
  });
});

describe("Sign-up redirects to sign-in (#77)", () => {
  it("forwards the query string", async () => {
    const { default: SignUpPage } = await import("@/app/auth/sign-up/page");
    const err = await SignUpPage({
      searchParams: Promise.resolve({ redirectTo: "/consent", a: ["1", "2"] }),
    }).catch((e: Error) => e.message);
    expect(err).toBe("REDIRECT:/auth/sign-in?redirectTo=%2Fconsent&a=1&a=2");
  });
});
