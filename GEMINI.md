# MCP Standard Research Intern Server — Antigravity (`agy`)

> **Read `PROJECT.md` now for full project context** — architecture, conventions, TDD rules, agent roster.

## Prerequisites

- Antigravity authenticated (`agy auth`).
- Superpowers skills in `~/.agents/skills/` — provides TDD, brainstorming, systematic-debugging workflows.

## Agents & Skills

- Load canonical prompt from `.ai/agents/<name>.md`.
- Register runtime subagent via `define_subagent`, then dispatch via `invoke_subagent`.
- Project skills auto-discovered via `.agents/skills.json`.
