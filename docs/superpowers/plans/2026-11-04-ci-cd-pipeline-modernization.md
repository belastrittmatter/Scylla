# CI/CD Pipeline Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul Scylla's CI/CD pipeline into a high-velocity parallel fan-out workflow with automated unit, integration, and MCP test suites, ephemeral PostgreSQL service container, Gitleaks secret detection, and an aggregate merge gate.

**Architecture:** Split the monolithic sequential validation job in `.github/workflows/ci.yml` into a parallel DAG of independent jobs gated by path filtering (`dorny/paths-filter@v3`). Fast syntax checks (`format:check`, `typecheck`, `lint`) run in a concurrent matrix; unit tests run isolated; integration and MCP tool tests run against an ephemeral `postgres:16-alpine` service container; an aggregate `ci` verdict job provides a single required status check for branch protection.

**Tech Stack:** GitHub Actions, Bun (`oven-sh/setup-bun@v2`), PostgreSQL 16 Alpine, Drizzle ORM (`drizzle-kit push --force`), Gitleaks Action v2, `dorny/paths-filter@v3`.

**Spec:** [`docs/superpowers/specs/2026-11-04-ci-cd-pipeline-modernization-design.md`](file:///Users/bela.strittmatter/projects/scylla/docs/superpowers/specs/2026-11-04-ci-cd-pipeline-modernization-design.md)

## Global Constraints

- Runtime: Bun latest via `oven-sh/setup-bun@v2`.
- Ephemeral Database: `postgres:16-alpine` with healthcheck `pg_isready -U postgres` on port 5432.
- Concurrency: `cancel-in-progress: ${{ github.event_name == 'pull_request' }}` keyed on `${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}`.
- Single Merge Check: GitHub branch protection must only need the aggregate `ci` gate job.
- Test Coverage: All 38 test suites under `tests/` plus `bun run test:mcp` must execute in CI.
- No modifications to application runtime or test business logic.

## Review Focus

1. **Skipped Job Gate Failure:** On doc-only PRs, skipped upstream jobs must not cause the aggregate `ci` gate to fail.
2. **Drizzle Push Interactive Stalling:** Drizzle Kit must execute with `--force` so it never prompts for interactive confirmation in CI.
3. **MCP Tool DB Dependency:** `bun run test:mcp` must execute inside `integration-tests` with the Postgres service, not in DB-less unit tests.
4. **Gitleaks False Positives:** Existing test mocks (e.g. `agent_mock_token_123`, dummy Better Auth secrets) must be allowlisted via `.gitleaks.toml`.
5. **Quality Check Matrix Isolation:** A formatting failure must not cancel or conceal TypeScript or ESLint check results (`fail-fast: false`).

---

### Task 1: Create Gitleaks Configuration and Allowlist Rules

**Files:**

- Create: `.gitleaks.toml`
- Test: `scripts/verify-ci-workflow.ts`

**Interfaces:**

- Consumes: Test fixtures and dummy token patterns in `tests/` and `.github/workflows/ci.yml`.
- Produces: `.gitleaks.toml` configuration consumed by `gitleaks/gitleaks-action@v2` in CI.

- [ ] **Step 1: Write validation test for `.gitleaks.toml` in `scripts/verify-ci-workflow.ts`**

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node -e 'require("./scripts/verify-ci-workflow.ts").testGitleaksConfig()'`
Expected: FAIL (file does not exist yet)

- [ ] **Step 3: Implement `.gitleaks.toml`**

Create `.gitleaks.toml` with:

- Title: `"Scylla Gitleaks Configuration"`
- Allowlist paths: `tests/.*`, `scripts/test-mcp-tools.ts`, `docs/.*`
- Allowlist stopwords/regexes: `agent_mock_token_.*`, `ci_dummy_secret_.*`, `scoped_access_token_.*`, `session_token_agent_route_test`

- [ ] **Step 4: Run test to verify it passes**

Run: `node -e 'require("./scripts/verify-ci-workflow.ts").testGitleaksConfig()'`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .gitleaks.toml scripts/verify-ci-workflow.ts
git commit -m "chore(ci): add gitleaks configuration with test fixture allowlist"
```

---

### Task 2: Implement Complete Modernized CI Workflow

**Files:**

- Modify: `.github/workflows/ci.yml`
- Test: `scripts/verify-ci-workflow.ts`

**Interfaces:**

- Consumes: `.gitleaks.toml`, `package.json` scripts (`format:check`, `typecheck`, `lint`, `build`, `test:mcp`, `db:push`).
- Produces: Complete GitHub Actions workflow `.github/workflows/ci.yml`.

- [ ] **Step 1: Add workflow structural validation to `scripts/verify-ci-workflow.ts`**

Add checks that verify `.github/workflows/ci.yml` contains:

- `concurrency.cancel-in-progress` checking for pull request event
- `jobs.changes` with `dorny/paths-filter@v3`
- `jobs.quality` with matrix `task: [format, typecheck, lint]` and `fail-fast: false`
- `jobs.unit-tests` running pure UI/utils tests
- `jobs.integration-tests` with `services.postgres` container, `bun run db:push --force`, and `bun run test:mcp`
- `jobs.build` running `bun run build` with Next.js cache
- `jobs.security` running Gitleaks and `bun audit`
- `jobs.ci` with `if: always()` evaluating upstream job conclusions

- [ ] **Step 2: Run test to verify it fails**

Run: `node -e 'require("./scripts/verify-ci-workflow.ts").testWorkflowStructure()'`
Expected: FAIL with missing jobs and structure

- [ ] **Step 3: Implement `.github/workflows/ci.yml`**

Replace `.github/workflows/ci.yml` with the full multi-job DAG:

1. `concurrency` setting with `group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}` and `cancel-in-progress: ${{ github.event_name == 'pull_request' }}`.
2. `changes` job using `dorny/paths-filter@v3` with `permissions: contents: read, pull-requests: read`.
3. `quality` matrix job with `format`, `typecheck`, `lint`.
4. `unit-tests` job running:
   `bun test tests/ui tests/utils tests/test-utils tests/client/calendar-settings.test.ts`
5. `integration-tests` job with `postgres:16-alpine` service, `bun run db:push --force`, running:
   `bun test tests/api tests/actions tests/services tests/db tests/client/api-client.test.ts tests/client/use-user-search.test.ts`
   followed by `bun run test:mcp`.
6. `build` job with Next.js cache restoration and `bun run build`.
7. `security` job running `gitleaks/gitleaks-action@v2` and `bun audit`.
8. `ci` aggregate verdict job evaluating:
   All jobs in `needs` must have `result == 'success' || result == 'skipped'`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node -e 'require("./scripts/verify-ci-workflow.ts").testWorkflowStructure()'`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/ci.yml scripts/verify-ci-workflow.ts
git commit -m "feat(ci): modernize CI pipeline with parallel DAG, ephemeral postgres, and merge gate"
```

---

### Task 3: Comprehensive Test Coverage & Schema Verification

**Files:**

- Modify: `scripts/verify-ci-workflow.ts`
- Read: `tests/**`

**Interfaces:**

- Consumes: Test directory layout.
- Produces: Automated verification that 100% of test files under `tests/` are routed to either `unit-tests` or `integration-tests`.

- [ ] **Step 1: Add test directory completeness check to `scripts/verify-ci-workflow.ts`**

```typescript
export function testAllSuitesCovered() {
  // Find all *.test.ts and *.test.tsx files under tests/
  // Ensure every file is included in either unit-tests or integration-tests commands in ci.yml
}
```

- [ ] **Step 2: Run verification script**

Run: `node -e 'require("./scripts/verify-ci-workflow.ts").testAllSuitesCovered()'`
Expected: PASS (all 38 test suites covered)

- [ ] **Step 3: Commit verification test suite**

```bash
git add scripts/verify-ci-workflow.ts
git commit -m "test(ci): add automated test coverage validator for CI pipeline"
```
