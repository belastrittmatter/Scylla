# MCP Standard Research Intern Server

Next.js 15 App Router server for a Google Calendar scheduling app.

## Goal

Automatically find available meeting slots across selected participants and book Google Calendar events. Later: expose an MCP server to allow AI agents to schedule meetings directly.

## Quick Reference

```bash
bun run dev             # Start dev server
bun run build           # Production build
bun run lint            # Run ESLint
bun test                # Run tests
```

# Next.js & TypeScript Engineering Standards

> System prompt and behavioral standards for AI agents and human developers working in this codebase.

---

## 1. Core Architectural Principles

- **App Router Primacy**: Always use Next.js App Router (`app/` directory). Never use legacy `pages/` routing.
- **Server Component First**: All components are React Server Components (RSC) by default. Add `'use client'` strictly at the top of files that require React hooks (`useState`, `useEffect`), event listeners, or browser APIs.
- **Modular & Reusable Architecture**: Enforce strict modularity. Prioritize small, composable, single-responsibility components. Extract shared logic into reusable hooks/utilities.
- **Strict Type Safety**: TypeScript strict mode is mandatory. Never use `any`.
- **Automated Mechanics**: Rely on ESLint and Prettier for formatting. Do not write manual formatting rules.

---

## 2. Next.js App Router & Component Standards

### Modular Component Architecture

- **Component Decomposition**: Break down complex UI into small, focused sub-components. Store shared UI primitives in `@/components/ui/` and feature-specific sub-components in `@/components/<feature>/`.
- **File Length Limit**: Keep component files concise (target under 150 lines). If a component grows beyond ~200 lines, refactor it into smaller sub-components or custom hooks immediately.
- **DRY & Reusability**: Search existing `@/components/` and `@/hooks/` before creating new elements. Never duplicate UI structures or data-transformation logic across files.
- **Separation of Concerns**: Separate UI presentation from complex business logic. Move state machines, data fetching helpers, and complex transformations into custom hooks (`@/hooks/`) or utility functions (`@/lib/`).

### File Conventions & Routing

- Place routes inside `app/` using standardized conventions:
  - `page.tsx`: Page UI (orchestrates modular section components; contains minimal inline JSX)
  - `layout.tsx`: Shared layout wrapper
  - `loading.tsx`: Suspense fallback boundary
  - `error.tsx`: Client error boundary (`'use client'`)
  - `not-found.tsx`: 404 page UI
  - `route.ts`: API Route Handler

### Component Boundaries

- **Server Components**: Keep data fetching, database calls, and secret management inside async Server Components.
- **Client Components**: Keep Client Components leaf-level to minimize client JavaScript bundle size. Pass server data down as props.

### Data Fetching & Mutations

- **Fetching**: Fetch data directly inside async Server Components using async/await with native `fetch` or ORM/database clients.
- **Mutations**: Use Server Actions (`'use server'`) for data mutations, form submissions, and database writes.
- **Validation**: Validate input parameters and request payloads using Zod schemas before processing.

### Assets & Styling

- **Styling**: Use Tailwind CSS utility classes.
- **Images**: Use `next/image` (`Image` component) with explicit `width`/`height` or `fill` for layout optimization.
- **Fonts**: Use `next/font` for optimized font loading.

---

## 3. TypeScript Standards

### Type Safety & Schema Definition

- **No `any`**: Use `unknown` paired with type guards or Zod parsing when handling untyped external inputs.
- **Types vs Interfaces**: Prefer `type` for object shapes, unions, and intersections. Use `interface` when defining extendable library contracts.
- **Read-Only Data**: Use `readonly` for immutable state properties.

### Function Declarations & Imports

- **Explicit Returns**: Specify explicit return types on public API exports, Server Actions, and utility functions.
- **Absolute Imports**: Always use path aliases configured in `tsconfig.json` (e.g., `@/components/...`, `@/lib/...`). Avoid relative path traversal (`../../..`).
- **Import Sorting**: Group imports logically: (1) React/Next.js, (2) Third-party packages, (3) Internal modules (`@/...`), (4) Types.

---

## 4. Performance & Security Rules

- **Client Bundle Size**: Use `next/dynamic` for heavy client side-effects or third-party client components not needed on initial paint.
- **Secrets Management**: Keep secret keys strictly on the server. Only expose public variables prefixed with `NEXT_PUBLIC_`.
- **Error Handling**: Use `try/catch` in Server Actions and Route Handlers; return structured error objects `{ success: false, error: string }` instead of unhandled promise rejections.

---

## 5. Explicit Constraints (What NOT To Do)

- **Do NOT** create monolithic components or single files exceeding ~200 lines; decompose into modular sub-components.
- **Do NOT** inline duplicate UI markup or state logic; extract to reusable components or hooks.
- **Do NOT** use `pages/` directory routing or legacy methods (`getServerSideProps`, `getStaticProps`, `getInitialProps`).
- **Do NOT** use `any` type annotations under any circumstances.
- **Do NOT** import server-only modules or secret environment variables into Client Components (`'use client'`).
- **Do NOT** use `var`. Use `const` by default, and `let` only when variable reassignment is required.
- **Do NOT** use raw `<img>` tags for internal or static media; use `next/image`.

## Test-Driven Development (Mandatory)

All features follow TDD (**Red → Green → Refactor**):

1. Write a failing test first.
2. Implement minimum code to pass.
3. Refactor while keeping tests green.
4. Bug fixes: reproduce in a failing test before fixing.

## Agent Roster

Agent system prompts live in `.ai/agents/`. Thin vendor wrappers live in `.claude/agents/` and `.opencode/agents/`.

| Agent           | Purpose                                            |
| --------------- | -------------------------------------------------- |
| `react-dev`     | React / Next.js UI, App Router pages, client hooks |
| `code-reviewer` | Plan compliance and standards review               |
| `design-system` | UI tokens and layout styling                       |
| `e2e-tester`    | Playwright/browser test execution                  |
