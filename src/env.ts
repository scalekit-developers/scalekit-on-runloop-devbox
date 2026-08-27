export type AppEnv = {
  port: number;
  scalekitEnvUrl: string;
  scalekitClientId: string;
  scalekitClientSecret: string;
  scalekitMcpConfigId: string;
  githubConnectionName: string;
  demoIdentifier: string;
  runloopApiKey: string;
  anthropicApiKey: string;
};

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const required = [
    'SCALEKIT_ENV_URL',
    'SCALEKIT_CLIENT_ID',
    'SCALEKIT_CLIENT_SECRET',
    'SCALEKIT_MCP_CONFIG_ID',
    'RUNLOOP_API_KEY',
    'ANTHROPIC_API_KEY',
  ] as const;

  const missing = required.filter((key) => !source[key]?.trim());
  if (missing.length > 0) {
    throw new Error(`Missing env: ${missing.join(', ')}`);
  }

  return {
    port: Number(source.PORT ?? 3456),
    scalekitEnvUrl: source.SCALEKIT_ENV_URL!.replace(/\/$/, ''),
    scalekitClientId: source.SCALEKIT_CLIENT_ID!,
    scalekitClientSecret: source.SCALEKIT_CLIENT_SECRET!,
    scalekitMcpConfigId: source.SCALEKIT_MCP_CONFIG_ID!,
    githubConnectionName: source.GITHUB_CONNECTION_NAME?.trim() || 'github-connect',
    demoIdentifier: source.DEMO_IDENTIFIER?.trim() || 'demo-user',
    runloopApiKey: source.RUNLOOP_API_KEY!,
    anthropicApiKey: source.ANTHROPIC_API_KEY!,
  };
}
