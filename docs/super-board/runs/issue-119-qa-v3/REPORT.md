# QA v3 · issue #119 · rebuild of `[qa]` threads

| Check                                                     | Result                                                                               |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| R1 `prettier --check` on all PR files + new test          | clean (v2 REPORT.md reformatted)                                                     |
| `bun run typecheck`                                       | clean                                                                                |
| `bun run lint`                                            | 0 errors, 18 warnings (pre-existing `<img>`)                                         |
| `tests/api/tasks`, `mcp-task-crud`, `task-sub-tasks`, new | 15 pass, 0 fail (68 expects, live DB)                                                |
| R3 MCP client session                                     | `tests/api/mcp-sub-tasks-client.test.ts`: real SDK `Client` over `InMemoryTransport` |
| Mutation check                                            | nesting guard disabled → red; `done` not counted resolved → red; restored → green    |

R3 session covers `listTools` (schema exposes `parentTaskId`), `create_task` with `parentTaskId`, `get_task` progress `0/1` then `1/1` after `update_task status=done`, and a grandchild rejected.
Not done: Inspector / Claude Desktop GUI session (needs a human with an OAuth token); R2 nested board UI is Eric's call.
