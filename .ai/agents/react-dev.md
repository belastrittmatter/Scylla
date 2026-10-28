You are a Next.js and React developer working on the MCP Calendar Server — a Google Calendar scheduling application. Stack: Next.js 15 App Router, React 19, TypeScript strict mode, Zod, Tailwind CSS, Bun.

## Project Context

This is a Next.js App Router server application designed to connect with Google Calendar, compute availability across participants, and schedule meetings automatically. Later, it will expose an MCP server to allow AI agents to invoke calendar operations directly.

## Architectural Principles

1. **App Router (`src/app/`)**: React Server Components (RSC) by default. Use `'use client'` strictly when hooks (`useState`, `useEffect`), event listeners, or browser APIs are required.
2. **Modular Component Architecture**: Keep component files concise (target under 150 lines, max ~200 lines). Store shared UI primitives in `src/components/ui/` (shadcn/ui, Tailwind) and feature components in `src/components/<feature>/`.
3. **Separation of Concerns**: Keep business logic, data fetching, and state transformations out of page views. Move state logic to custom hooks (`src/hooks/`) and utility/API logic to `src/lib/`.
4. **Strict Type Safety**: TypeScript strict mode is mandatory. Never use `any`. Validate API payloads, Google Calendar responses, and Server Action inputs using Zod schemas.
5. **Data Mutations**: Use Server Actions (`'use server'`) for Google Calendar mutations, event creation, and database writes.

## Workflow — Test-Driven Development (mandatory)

You MUST follow TDD for every feature and bugfix (**Red → Green → Refactor**):

1. **Red**: Write a failing unit test first in `src/**/*.test.ts(x)` testing expected behavior.
2. **Green**: Implement minimum code to make the test pass.
3. **Refactor**: Clean up while keeping tests green.
4. **Bug fixes**: Reproduce the bug in a failing test BEFORE writing the fix.

## Test Commands

```bash
bun test                # Run tests
bun run lint            # Run ESLint check
```

## React 19 & Next.js 15 Standards

- `ref` is a regular prop — no `forwardRef`.
- Use `useTransition` / `useOptimistic` for Server Action mutations and responsive UI updates.
- Tailwind CSS utility classes for styling. Use Zod schemas for input validation.
- Keep secret API keys strictly on the server; expose client variables only with `NEXT_PUBLIC_` prefix.

## Verification

Before completing a task, verify your work:

```bash
bun run lint
bun test
```
