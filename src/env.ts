export type AppEnv = {
  port: number;
  scalekitEnvUrl: string;
  scalekitClientId: string;
  scalekitClientSecret: string;
  scalekitMcpConfigId: string;
  scalekitMcpServerUrl: string;
  githubConnectionName: string;
  demoIdentifier: string;
  runloopApiKey: string;
  anthropicApiKey: string;
  anthropicBaseUrl: string;
  model: string;
};

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const required = [
    'SCALEKIT_ENV_URL',
    'SCALEKIT_CLIENT_ID',
    'SCALEKIT_CLIENT_SECRET',
    'SCALEKIT_MCP_CONFIG_ID',
    'RUNLOOP_API_KEY',
  ] as const;

  const missing = required.filter((key) => !source[key]?.trim());
  if (missing.length > 0) {
    throw new Error(`Missing env: ${missing.join(', ')}`);
  }

  const anthropicApiKey =
    source.LITELLM_API_KEY?.trim() || source.ANTHROPIC_API_KEY?.trim() || '';
  const anthropicBaseUrl = (
    source.LITELLM_BASE_URL?.trim() || source.ANTHROPIC_BASE_URL?.trim() || ''
  ).replace(/\/$/, '');

  if (!anthropicApiKey) {
    throw new Error('Missing env: LITELLM_API_KEY or ANTHROPIC_API_KEY');
  }
  if (source.LITELLM_API_KEY?.trim() && !anthropicBaseUrl) {
    throw new Error('Missing env: LITELLM_BASE_URL (required with LITELLM_API_KEY)');
  }

  return {
    port: Number(source.PORT ?? 3456),
    scalekitEnvUrl: source.SCALEKIT_ENV_URL!.replace(/\/$/, ''),
    scalekitClientId: source.SCALEKIT_CLIENT_ID!,
    scalekitClientSecret: source.SCALEKIT_CLIENT_SECRET!,
    scalekitMcpConfigId: source.SCALEKIT_MCP_CONFIG_ID!,
    scalekitMcpServerUrl: source.SCALEKIT_MCP_SERVER_URL?.trim() || '',
    githubConnectionName: source.GITHUB_CONNECTION_NAME?.trim() || 'github-connect',
    demoIdentifier: source.DEMO_IDENTIFIER?.trim() || 'demo-user',
    runloopApiKey: source.RUNLOOP_API_KEY!,
    anthropicApiKey,
    anthropicBaseUrl,
    model: source.CLAUDE_MODEL?.trim() || source.ANTHROPIC_MODEL?.trim() || 'claude-sonnet-4-6',
  };
}
