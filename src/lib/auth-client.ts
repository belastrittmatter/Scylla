import { createAuthClient } from "better-auth/react";
import { oauthProviderClient } from "@better-auth/oauth-provider/client";
import { agentAuthClient } from "@better-auth/agent-auth/client";

export const authClient = createAuthClient({
  disableDefaultFetchPlugins: true,
  plugins: [oauthProviderClient(), agentAuthClient()],
});

export const { signIn, signUp, useSession, signOut } = authClient;
