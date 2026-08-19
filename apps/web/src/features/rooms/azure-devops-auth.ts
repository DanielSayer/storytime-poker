import {
  BrowserCacheLocation,
  InteractionRequiredAuthError,
  PublicClientApplication,
} from "@azure/msal-browser";
import { env } from "@storytime-poker/env/web";

const AZURE_DEVOPS_SCOPE = "https://app.vssps.visualstudio.com/vso.work";

let clientPromise: Promise<PublicClientApplication> | undefined;

export function isAzureDevOpsConfigured() {
  return Boolean(
    env.VITE_AZURE_DEVOPS_CLIENT_ID && env.VITE_AZURE_DEVOPS_TENANT_ID,
  );
}

async function getClient() {
  const clientId = env.VITE_AZURE_DEVOPS_CLIENT_ID;
  const tenantId = env.VITE_AZURE_DEVOPS_TENANT_ID;
  if (!clientId || !tenantId) {
    return undefined;
  }
  clientPromise ??= (async () => {
    const client = new PublicClientApplication({
      auth: {
        clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        redirectUri: `${window.location.origin}/redirect.html`,
      },
      cache: {
        cacheLocation: BrowserCacheLocation.SessionStorage,
      },
    });
    await client.initialize();
    return client;
  })();
  return await clientPromise;
}

export async function acquireAzureDevOpsToken(interactive: boolean) {
  const client = await getClient();
  if (!client) {
    return undefined;
  }

  let account = client.getActiveAccount() ?? client.getAllAccounts()[0];
  if (!account) {
    if (!interactive) {
      return undefined;
    }
    const result = await client.loginPopup({
      scopes: [AZURE_DEVOPS_SCOPE],
      prompt: "select_account",
    });
    account = result.account;
    client.setActiveAccount(account);
    return result.accessToken;
  }

  try {
    const result = await client.acquireTokenSilent({
      account,
      scopes: [AZURE_DEVOPS_SCOPE],
    });
    return result.accessToken;
  } catch (error) {
    if (!(error instanceof InteractionRequiredAuthError) || !interactive) {
      return undefined;
    }
    const result = await client.acquireTokenPopup({
      account,
      scopes: [AZURE_DEVOPS_SCOPE],
    });
    client.setActiveAccount(result.account);
    return result.accessToken;
  }
}
