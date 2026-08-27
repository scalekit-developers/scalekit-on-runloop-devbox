import { ScalekitClient } from '@scalekit-sdk/node';
import type { AppEnv } from './env.ts';
import type { ConnectedAccount } from './githubStatus.ts';

export function createScalekit(env: AppEnv): ScalekitClient {
  return new ScalekitClient(env.scalekitEnvUrl, env.scalekitClientId, env.scalekitClientSecret);
}

export async function listMcpConnectedAccounts(
  env: AppEnv,
  scalekit: ScalekitClient,
): Promise<ConnectedAccount[]> {
  const token = await scalekit.getClientAccessToken();
  const response = await fetch(
    `${env.scalekitEnvUrl}/api/v1/mcp/configs/${env.scalekitMcpConfigId}/connected_accounts`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: env.demoIdentifier,
        include_auth_link: true,
      }),
    },
  );

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Scalekit list connected accounts failed (${response.status}): ${text}`);
  }

  const data = JSON.parse(text) as { connected_accounts?: ConnectedAccount[] };
  return data.connected_accounts ?? [];
}

export async function mintSessionToken(
  env: AppEnv,
  scalekit: ScalekitClient,
): Promise<{ token: string; mcpServerUrl: string }> {
  const accessToken = await scalekit.getClientAccessToken();
  const response = await fetch(
    `${env.scalekitEnvUrl}/api/v1/mcp/configs/${env.scalekitMcpConfigId}/tokens`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: env.demoIdentifier,
        expiry: '3600s',
      }),
    },
  );

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Scalekit mint session token failed (${response.status}): ${text}`);
  }

  const data = JSON.parse(text) as { token?: string };
  if (!data.token) {
    throw new Error('Scalekit mint session token returned no token');
  }

  const mcpServerUrl = await readMcpServerUrl(env, accessToken);
  return { token: data.token, mcpServerUrl };
}

async function readMcpServerUrl(env: AppEnv, accessToken: string): Promise<string> {
  const fromEnv = process.env.SCALEKIT_MCP_SERVER_URL?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  const response = await fetch(
    `${env.scalekitEnvUrl}/api/v1/mcp/configs/${env.scalekitMcpConfigId}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Scalekit get MCP config failed (${response.status}): ${text}`);
  }
  const data = JSON.parse(text) as { config?: { mcp_server_url?: string }; mcp_server_url?: string };
  const url = data.config?.mcp_server_url ?? data.mcp_server_url;
  if (!url) {
    throw new Error('Set SCALEKIT_MCP_SERVER_URL or enable mcp_server_url on the Virtual MCP config');
  }
  return url;
}
