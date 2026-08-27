import { ScalekitClient } from '@scalekit-sdk/node';
import type { AppEnv } from './env.ts';
import {
  githubStatusFromAccounts,
  withAuthLink,
  type ConnectedAccount,
  type GithubStatus,
} from './githubStatus.ts';

export function createScalekit(env: AppEnv): ScalekitClient {
  return new ScalekitClient(env.scalekitEnvUrl, env.scalekitClientId, env.scalekitClientSecret);
}

export async function loadGithubStatus(env: AppEnv, scalekit: ScalekitClient): Promise<GithubStatus> {
  const accounts = await listMcpConnectedAccounts(env, scalekit);
  const status = githubStatusFromAccounts(accounts, env.githubConnectionName);
  if (status.state === 'ready' || status.state === 'needs_auth') {
    return status;
  }

  const link = await fetchAuthorizationLink(env, scalekit);
  if (link) {
    return withAuthLink(status, link);
  }
  return status;
}

async function listMcpConnectedAccounts(
  env: AppEnv,
  scalekit: ScalekitClient,
): Promise<ConnectedAccount[]> {
  const data = await scalekitJson<{ connected_accounts?: ConnectedAccount[] }>(
    env,
    scalekit,
    `/api/v1/mcp/configs/${env.scalekitMcpConfigId}/connected_accounts`,
    {
      method: 'POST',
      body: {
        identifier: env.demoIdentifier,
        include_auth_link: true,
      },
    },
  );
  return data.connected_accounts ?? [];
}

export async function mintSessionToken(
  env: AppEnv,
  scalekit: ScalekitClient,
): Promise<{ token: string; mcpServerUrl: string }> {
  const data = await scalekitJson<{ token?: string }>(
    env,
    scalekit,
    `/api/v1/mcp/configs/${env.scalekitMcpConfigId}/tokens`,
    {
      method: 'POST',
      body: {
        identifier: env.demoIdentifier,
        expiry: '3600s',
      },
    },
  );
  if (!data.token) {
    throw new Error('Scalekit mint session token returned no token');
  }
  return { token: data.token, mcpServerUrl: await readMcpServerUrl(env, scalekit) };
}

async function readMcpServerUrl(env: AppEnv, scalekit: ScalekitClient): Promise<string> {
  if (env.scalekitMcpServerUrl) {
    return env.scalekitMcpServerUrl;
  }

  const data = await scalekitJson<{ config?: { mcp_server_url?: string }; mcp_server_url?: string }>(
    env,
    scalekit,
    `/api/v1/mcp/configs/${env.scalekitMcpConfigId}`,
    { method: 'GET' },
  );
  const url = data.config?.mcp_server_url ?? data.mcp_server_url;
  if (!url) {
    throw new Error('Set SCALEKIT_MCP_SERVER_URL or enable mcp_server_url on the Virtual MCP config');
  }
  return url;
}

async function fetchAuthorizationLink(env: AppEnv, scalekit: ScalekitClient): Promise<string> {
  const response = await scalekit.actions.getAuthorizationLink({
    connectionName: env.githubConnectionName,
    identifier: env.demoIdentifier,
  });
  return response.link?.trim() ?? '';
}

async function scalekitJson<T>(
  env: AppEnv,
  scalekit: ScalekitClient,
  path: string,
  init: { method: 'GET' | 'POST'; body?: unknown },
): Promise<T> {
  const accessToken = await scalekit.getClientAccessToken();
  const response = await fetch(`${env.scalekitEnvUrl}${path}`, {
    method: init.method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Scalekit ${init.method} ${path} failed (${response.status}): ${text}`);
  }
  return JSON.parse(text) as T;
}
