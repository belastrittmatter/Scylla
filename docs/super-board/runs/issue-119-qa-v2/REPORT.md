# QA v2 · issue #119 · head 180143e

| Check | Result |
| --- | --- |
| `bun run typecheck` | clean |
| `bun run lint` | 0 errors, 18 warnings (pre-existing `<img>`) |
| `bun test tests/api/tasks.test.ts tests/api/mcp-task-crud.test.ts tests/services/task-sub-tasks.test.ts` | 14 pass, 0 fail (60 expects, live DB) |
| pr-security-review | 0 findings: parent must be in the same team, one level, `parentTaskId` not accepted by update |
| Docs in diff | README MCP section documents `parentTaskId`, `subTaskProgress`, resolve via `update_task` |
| MCP client | tool handlers run in `mcp-task-crud.test.ts`; no Inspector / Claude Desktop session |
| UI | `n/m` badge in `kanban-card.tsx` not rendered in a browser; no screenshots (no app/auth env available to this lane) |

Test gaps (not written): board badge source `TaskWorkspaceService` progress map has no test; `cancelled` counted as resolved is asserted only through `getTaskById`.
Deferred by Builder, stated in PR: nested/expandable sub-tasks on the board, dedicated `POST .../sub-tasks` route.
Deploy note: `task.parent_task_id` column must exist before deploy (`db:push` hit a rename prompt; applied by hand to dev DB).
