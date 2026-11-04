import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join } from "path";

function getAllTestFiles(dir: string): string[] {
  let results: string[] = [];
  const list = readdirSync(dir);
  for (const file of list) {
    const fullPath = join(dir, file);
    const stat = statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllTestFiles(fullPath));
    } else if (file.endsWith(".test.ts") || file.endsWith(".test.tsx")) {
      results.push(fullPath);
    }
  }
  return results;
}

export function testAllSuitesCovered() {
  const allTests = getAllTestFiles("tests");
  const ciContent = readFileSync(".github/workflows/ci.yml", "utf-8");

  const missing: string[] = [];

  for (const testFile of allTests) {
    const parts = testFile.split("/");
    const parentDir = parts.slice(0, 2).join("/"); // e.g. tests/ui, tests/api

    // A test is covered if its exact path or its parent directory is targeted by bun test in ci.yml
    const exactCovered = ciContent.includes(testFile);
    const dirCovered =
      ciContent.includes(`bun test ${parentDir}`) ||
      ciContent.includes(` ${parentDir} `) ||
      ciContent.includes(` ${parentDir}\n`);

    if (!exactCovered && !dirCovered) {
      missing.push(testFile);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `The following test files are not covered in CI:\n${missing.join("\n")}`,
    );
  }

  console.log(
    `✅ All ${allTests.length} test suites under tests/ are covered in CI workflow`,
  );
}

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
  testAllSuitesCovered();
}
