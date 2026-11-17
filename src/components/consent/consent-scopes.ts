import { ALL_MCP_CAPABILITIES } from "@/constants/agent-capabilities";

/** Known MCP scopes the client asked for; nothing is pre-selected otherwise. */
export function initialConsentScopes(requestedScopeParam: string): string[] {
  return requestedScopeParam
    .split(/[\s,]+/)
    .filter((s) => ALL_MCP_CAPABILITIES.some((c) => c.id === s));
}

/** How many of the selected scopes can permanently delete data. */
export function countDestructiveScopes(selectedScopes: string[]): number {
  return ALL_MCP_CAPABILITIES.filter(
    (c) => c.isDestructive && selectedScopes.includes(c.id),
  ).length;
}
