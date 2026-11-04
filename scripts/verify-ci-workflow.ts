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

export function testWorkflowStructure() {
  if (!existsSync(".github/workflows/ci.yml")) {
    throw new Error(".github/workflows/ci.yml missing");
  }
  const content = readFileSync(".github/workflows/ci.yml", "utf-8");

  const requiredTokens = [
    "cancel-in-progress: ${{ github.event_name == 'pull_request' }}",
    "changes:",
    "dorny/paths-filter@v3",
    "quality:",
    "task: [format, typecheck, lint]",
    "fail-fast: false",
    "unit-tests:",
    "integration-tests:",
    "postgres:16-alpine",
    "bun run db:push --force",
    "bun run test:mcp",
    "build:",
    "security:",
    "gitleaks/gitleaks-action@v2",
    "bun audit",
    "ci:",
    "if: always()",
  ];

  for (const token of requiredTokens) {
    if (!content.includes(token)) {
      throw new Error(`Workflow missing expected token/structure: ${token}`);
    }
  }
}

if (process.argv[1]?.endsWith("verify-ci-workflow.ts")) {
  testGitleaksConfig();
  console.log("✅ Gitleaks configuration test passed");
  testWorkflowStructure();
  console.log("✅ CI Workflow structure test passed");
}
