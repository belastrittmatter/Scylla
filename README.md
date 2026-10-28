# Next.js Server & Application

Foundational Next.js application for MCP Standard Research Intern, configured with TypeScript strict mode, Tailwind CSS v4, shadcn/ui components, Prettier formatting with automated class sorting, and Husky + lint-staged pre-commit automation.

---

## Tech Stack & Architecture

- **Framework**: Next.js 16 (App Router in `src/app/`, React 19)
- **Language**: TypeScript (strict mode, `@/*` mapped to `src/*`)
- **Styling**: Tailwind CSS v4 with OKLCH CSS variables, design tokens, and dark mode support
- **UI Components**: shadcn/ui (`components.json`) with Lucide icons (`lucide-react`), `clsx`, `tailwind-merge`, and `class-variance-authority`
- **Code Quality & Formatting**:
  - Prettier with `prettier-plugin-tailwindcss` for automated Tailwind class sorting
  - ESLint 9 with Next.js rules enforcing project standards (`server/AGENTS.md`)
- **Git Hooks & Pre-Commit**: Husky (`.husky/pre-commit`) running `lint-staged` automatically on staged files

---

## Directory Structure

```text
server/
├── src/
│   ├── app/
│   │   ├── globals.css      # Tailwind v4 theme, design tokens, and CSS variables
│   │   ├── layout.tsx       # Root layout wrapper
│   │   └── page.tsx         # Main entry page
│   ├── components/
│   │   └── ui/              # shadcn/ui primitives (button, card, badge)
│   └── lib/
│       └── utils.ts         # cn() utility helper (clsx + tailwind-merge)
├── components.json          # shadcn/ui registry & alias configuration
├── tsconfig.json            # TypeScript strict mode with @/* -> ./src/*
├── eslint.config.mjs        # ESLint flat config
├── next.config.ts           # Next.js compiler settings
└── package.json             # Scripts & dependencies
```

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.2+) or Node.js (v20+)

### 1. Install Dependencies

From the repository root or inside `server/`:

```bash
bun install
```

### 2. Start Development Server

```bash
# From repository root
bun run dev

# Or inside server directory
cd server && bun run dev
```

The application will be live at [http://localhost:3000](http://localhost:3000).

### 3. Build for Production

```bash
bun run build
```

### 4. Sync Meeting Rooms from Google Workspace

```bash
# Trigger POST endpoint to fetch resources from Google Admin Directory & upsert into PostgreSQL
curl -X POST http://localhost:3000/api/rooms/sync
```

_(For full setup details on Google OAuth scopes, directory permissions, and normalization rules, see the main [README.md](../README.md#meeting-room-synchronization-google-workspace))._

---

## Code Quality & Formatting

### Run Prettier (Format check / write)

```bash
# Check formatting
bun run format:check

# Format files & auto-sort Tailwind classes
bun run format
```

### Run Linter

```bash
bun run lint
```

### Pre-commit Automation

Husky automatically runs `lint-staged` upon `git commit`, running Prettier on all staged `.ts`, `.tsx`, `.css`, and `.json` files before any commit is accepted.
