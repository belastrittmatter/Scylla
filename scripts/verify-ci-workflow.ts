import { readFileSync, existsSync } from "fs";

export function testGitleaksConfig() {
  if (!existsSync(".gitleaks.toml")) {
    throw new Error(".gitleaks.toml missing");
  }
  const content = readFileSync(".gitleaks.toml", "utf-8");
  if (!content.includes("[allowlist]")) {
    throw new Error(".gitleaks.toml missing [allowlist]");
  }
  if (
    !content.includes("agent_mock_token_") ||
    !content.includes("ci_dummy_secret_")
  ) {
    throw new Error("Fixture tokens not allowlisted in .gitleaks.toml");
  }
}

if (process.argv[1]?.endsWith("verify-ci-workflow.ts")) {
  testGitleaksConfig();
  console.log("✅ Gitleaks configuration test passed");
}
