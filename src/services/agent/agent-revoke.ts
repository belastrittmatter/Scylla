import { revokeMcpClient } from "./mcp-client-service";

export async function revokeAgentAndOAuth(
  agentId: string,
  userId: string,
): Promise<boolean> {
  return revokeMcpClient(userId, agentId);
}
