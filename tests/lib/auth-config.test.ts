import { describe, it, expect } from "bun:test";
import type { BetterAuthOptions } from "better-auth";
import { auth } from "@/lib/auth";

describe("auth account linking", () => {
  // Team invites create unverified placeholder users; Google sign-in must claim them.
  it("lets Google link to an unverified placeholder user", () => {
    const linking = auth.options.account?.accountLinking;
    expect(linking?.enabled).toBe(true);
    expect(linking?.trustedProviders).toContain("google");
    expect(linking?.requireLocalEmailVerified).toBe(false);
  });

  // Linking to unverified users is only safe while nobody can register a password account.
  it("keeps email/password sign-up disabled", () => {
    const options: BetterAuthOptions = auth.options;
    expect(options.emailAndPassword?.enabled).not.toBe(true);
  });
});
