# MCP Standard Research Intern Server — Claude Code

> **Read `PROJECT.md` now for full project context** — architecture, conventions, TDD rules, agent roster.

## Prerequisites

- Superpowers plugin installed via `claude plugin install superpowers`.

## Agents & Skills

- Native agents load from `.claude/agents/`. Dispatched via native `Agent` tool.
- Native skills load from `.claude/skills/`. Invoked via native `Skill` tool.
