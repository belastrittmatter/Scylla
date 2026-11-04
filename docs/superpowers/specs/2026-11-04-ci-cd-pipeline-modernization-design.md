# CI/CD Pipeline Modernization Design (Issue #44)

- **Date:** 2026-11-04
- **Status:** Draft / In Review
- **Issue Reference:** [Issue #44](https://github.com/belastrittmatter/Scylla/issues/44)
- **Reference Implementations:** [margince/margince](https://github.com/margince/margince) (`ci.yml`), Cal.com (`all-checks.yml`)

---

## 1. Intent and Why

The current Scylla CI workflow (`.github/workflows/ci.yml`) has severe limitations:

1. **Serial Feedback Bottleneck:** Formatting (`prettier`), TypeScript (`tsc`), ESLint (`eslint`), and Next.js build run sequentially in a single monolithic job. A single whitespace or formatting error aborts the run before typechecking or linting can execute, forcing developers into frustrating fix-and-wait cycles.
2. **Critical Test Blind Spot:** Over 35 test suites under `tests/` (covering API routes, database models, client services, agent scopes, and UI components) and MCP contract checks (`scripts/test-mcp-tools.ts`) are never executed in CI. Regressions and broken business logic currently pass CI completely undetected.
3. **No Integration or Database Verification:** There is no ephemeral database service container, meaning Drizzle schema changes (`src/db/schema.ts`) and migrations are never validated from scratch in a clean environment.
4. **Inefficient Triggering:** Heavy builds execute even when only documentation or markdown files are updated.
5. **No Secret or Vulnerability Scanning:** Committed tokens, OAuth credentials, or vulnerable dependencies are not scanned.

This design establishes a modern parallel fan-out CI pipeline for Scylla inspired by battle-tested open-source workflows (especially `margince/margince`). It delivers sub-minute feedback on fast checks, full test coverage with ephemeral Postgres, secret detection with fixture allowlisting, and a single robust merge gate for GitHub branch protection.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals

- **Immediate Parallel Visibility:** Format checking, typechecking, and linting run concurrently in parallel matrix jobs so developers see all failures across all three dimensions simultaneously in ~10–15 seconds.
- **Full Test Automation in CI:**
  - Fast, DB-less unit and UI tests run in an isolated test runner.
  - Ephemeral PostgreSQL 16 container initializes and runs DB, service, action, API tests, and MCP server tool contracts.
- **Clean Schema Verification:** Execute `bun run db:push --force` against clean Postgres to guarantee schema sync without drift or interactive terminal blocks.
- **MCP Tool Protocol Verification:** Run `bun run test:mcp` against the initialized database container to verify MCP tool registrations, handlers, and room schemas.
- **Diff-Aware Path Filtering:** Skip expensive test, build, and integration jobs on PRs that only modify documentation (`*.md`, `.github/ISSUE_TEMPLATE/**`, etc.).
- **Security & Secret Scanning:** Run Gitleaks on all PRs with an explicit `.gitleaks.toml` configuration to prevent real credential leaks while allowlisting dummy test fixtures, plus `bun audit` for dependency vulnerabilities.
- **Single Aggregate Merge Gate:** An aggregate `ci` verdict job that passes when all required active jobs succeed (or are legitimately skipped by path filtering), providing a single required status check for GitHub branch protection.
- **Safe Concurrency:** Cancel outdated in-flight runs on pull requests when new commits are pushed, while safeguarding runs on `main` to ensure a permanent record of main branch integrity.

### Non-Goals

- End-to-end browser automation (Playwright/Cypress) – deferred to a dedicated E2E workflow if needed.
- Continuous deployment, container baking, or artifact publishing – this pipeline is strictly a CI merge gate.
- Modifying existing application business logic or test files.

### Anti-Goals

- Monolithic sequential execution where one failure blocks feedback on other checks.
- Putting `bun run test:mcp` in a database-less job (it queries the `meetingRoom` table and would crash).
- Unfiltered Gitleaks scans that trigger false positives on mock test tokens (e.g. `agent_mock_token_123`, dummy Better Auth secrets).
- Requiring individual dynamic jobs in GitHub branch protection that block PRs when skipped by path filtering.

---

## 3. Reference Architecture & Lessons Learned from Margince

Examining `margince/margince` and other high-velocity open source repositories yielded four critical architectural patterns adopted in this design:

1. **The Aggregate Merge Gate (`ci`):** Margince relies on an aggregate `ci` job with `if: always()` that inspects `needs.*.result`. Path-filtered jobs emit skipped states when out-of-scope. An aggregate job checks that no job failed or was cancelled, allowing GitHub branch protection to require only `ci` rather than juggling dynamic job names.
2. **Correct Concurrency Formula:** Keying concurrency on `${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}` with `cancel-in-progress: ${{ github.event_name == 'pull_request' }}` cancels redundant PR iterations while allowing every push to `main` to run through.
3. **Secret Scan Scope:** Margince runs secret scanning across _all_ PRs (even doc updates), because credentials can be inadvertently pasted into any file type.
4. **Tool Command Accuracy:** Bun's built-in audit command is `bun audit` (not `bun pm audit`). Drizzle Kit push in non-interactive CI must include `--force` (`bun run db:push --force`) to prevent hanging on interactive confirmation prompts.

---

## 4. Pipeline Topology & Job Specifications

```
                     ┌──────────────────┐
                     │ push / PR event  │
                     └────────┬─────────┘
                              │
            ┌─────────────────┴─────────────────┐
            │                                   │
  ┌─────────▼──────────┐              ┌─────────▼──────────┐
  │  changes (filter)  │              │  security (scan)   │
  └─────────┬──────────┘              │ Gitleaks+bun audit │
            │                         └─────────┬──────────┘
   ┌────────┴────────┬───────────────┬──────────┴───┐
   │ (if code)       │ (if code)     │ (if code)    │ (if code)
┌──▼────────────┐ ┌──▼───────────┐ ┌─▼────────────┐ ┌▼─────────────────────┐
│ quality       │ │ unit-tests   │ │ build        │ │ integration-tests     │
│ (format/type/ │ │ (pure UI &   │ │ (next.js)    │ │ (postgres:16-alpine + │
│  lint matrix) │ │  utils)      │ │              │ │  db:push + db/api/mcp)│
└──┬────────────┘ └──┬───────────┘ └──┬───────────┘ └─┬─────────────────────┘
   │                 │                │               │
   └─────────────────┴────────┬───────┴───────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   ci (verdict gate)│
                    │  single status check
                    └────────────────────┘
```

### Job 1: `changes` (Diff Classifier)

- **Image:** `ubuntu-latest`
- **Action:** `dorny/paths-filter@v3`
- **Permissions:** `contents: read`, `pull-requests: read`
- **Filters:**
  - `docs`: `['**/*.md', '.github/ISSUE_TEMPLATE/**', 'docs/**']`
  - `code`: any file outside `docs` (e.g. `src/**`, `tests/**`, `scripts/**`, `package.json`, `bun.lock`, `drizzle.config.ts`, `tsconfig.json`)
- **Outputs:** `code` boolean flag

### Job 2: `quality` (Parallel Syntax & Lint Matrix)

- **Image:** `ubuntu-latest`
- **Needs:** `changes`
- **Condition:** `needs.changes.outputs.code == 'true' || github.event_name != 'pull_request'`
- **Matrix Strategy:**
  - `task: [format, typecheck, lint]`
  - `include`:
    - `task: format` -> `run: bun run format:check`
    - `task: typecheck` -> `run: bun run typecheck`
    - `task: lint` -> `run: bun run lint`
- **Fast-fail:** `false` (so all three check results are always produced even if one fails)

### Job 3: `unit-tests` (Pure Fast Tests - DB-less)

- **Image:** `ubuntu-latest`
- **Needs:** `changes`
- **Condition:** `needs.changes.outputs.code == 'true' || github.event_name != 'pull_request'`
- **Steps:**
  - Setup Bun (`oven-sh/setup-bun@v2`, latest)
  - `bun install --frozen-lockfile`
  - `bun test tests/ui tests/utils tests/test-utils tests/client/calendar-settings.test.ts`

### Job 4: `integration-tests` (Ephemeral Postgres, DB Tests & MCP Suite)

- **Image:** `ubuntu-latest`
- **Needs:** `changes`
- **Condition:** `needs.changes.outputs.code == 'true' || github.event_name != 'pull_request'`
- **Service Container:**
  - `postgres:16-alpine`
  - Ports: `5432:5432`
  - Environment: `POSTGRES_USER: postgres`, `POSTGRES_PASSWORD: postgres`, `POSTGRES_DB: scylla_test`
  - Health check: `pg_isready -U postgres` (interval 10s, timeout 5s, retries 5)
- **Steps:**
  - Setup Bun & install dependencies
  - Apply schema: `bun run db:push --force` with `DATABASE_URL: postgres://postgres:postgres@localhost:5432/scylla_test`
  - Run database, service, action, API, and DB-backed client test suites:
    `bun test tests/api tests/actions tests/services tests/db tests/client/api-client.test.ts tests/client/use-user-search.test.ts`
  - Run MCP server tool verification and health check:
    `bun run test:mcp` (verifies tool registry, schemas, and `list_meeting_rooms` against Postgres)

### Job 5: `build` (Next.js Production Build)

- **Image:** `ubuntu-latest`
- **Needs:** `changes`
- **Condition:** `needs.changes.outputs.code == 'true' || github.event_name != 'pull_request'`
- **Cache:** `actions/cache@v4` on `.next/cache` keyed by OS, lockfile, and source hashes.
- **Environment:**
  - `DATABASE_URL: "postgres://postgres:postgres@localhost:5432/mcp_db"`
  - `BETTER_AUTH_SECRET: "ci_dummy_secret_ci_dummy_secret_32_chars_min"`
  - `BETTER_AUTH_URL: "http://localhost:3000"`
  - `NEXT_PUBLIC_APP_URL: "http://localhost:3000"`
  - `NEXT_TELEMETRY_DISABLED: "1"`
- **Command:** `bun run build`

### Job 6: `security` (Gitleaks & Dependency Audit)

- **Image:** `ubuntu-latest`
- **Runs on:** All pull requests and main pushes (independent of path filters, as secrets can appear in any file).
- **Steps:**
  - Checkout repository (with `fetch-depth: 0` for git history inspection on PR commits)
  - Gitleaks scan: `gitleaks/gitleaks-action@v2` using repository `.gitleaks.toml`
  - Dependency vulnerability audit: `bun audit`

### Job 7: `ci` (Aggregate Verdict Gate)

- **Image:** `ubuntu-latest`
- **Needs:** `[changes, quality, unit-tests, integration-tests, build, security]`
- **Condition:** `if: always()`
- **Logic:** Evaluates the execution results of all upstream jobs.
  - If any job resulted in `failure` or `cancelled`, this job exits with code 1.
  - If jobs succeeded or were skipped due to path filtering, this job succeeds with code 0.
- **Branch Protection:** This is the single status check required in repository branch protection settings.

---

## 5. Security Configuration (`.gitleaks.toml`)

To eliminate false positive failures on legitimate test fixtures and mock auth secrets:

- An explicit `.gitleaks.toml` configuration will be added to the repository root.
- Allowlist paths: `tests/**`, `scripts/test-mcp-tools.ts`.
- Allowlist regexes / stopwords: `ci_dummy_secret_.*`, `agent_mock_token_.*`, `scoped_access_token_.*`.

---

## 6. What's Left to the Builder

The builder implementing this design is authorized to:

- Fine-tune exact path filter patterns in `dorny/paths-filter`.
- Verify the exact flags for `bun audit` and `.gitleaks.toml` syntax.
- Ensure all test file paths match current and newly added suites under `tests/`.
- Ensure appropriate timeouts (e.g. `timeout-minutes: 15`) on each job to prevent hanging runs.
