/**
 * In Option 2, native OAuth consent and client tables are the single source
 * of truth for AI agent integrations (Codex, Claude, Cursor).
 * No background sync or synthetic host/grant enrollment is required.
 */
export async function syncOAuthConsentsToAgents(
  _userId: string,
): Promise<void> {
  return;
}
