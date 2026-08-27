export const AGENT_PROMPT =
  'Use the MCP tools to get my last pull request and describe what it does in 2-3 sentences.';

export type AgentRun = {
  mcpUrl: string;
  sessionToken: string;
  anthropicApiKey: string;
  anthropicBaseUrl?: string;
  model: string;
};

export function buildInstallScript(): string {
  return ['set -euo pipefail', 'npm install -g @anthropic-ai/claude-code'].join('\n');
}

export function buildClaudeScript(run: AgentRun): string {
  const mcpUrl = shellQuote(run.mcpUrl);
  const prompt = shellQuote(AGENT_PROMPT);
  const modelEnv = run.anthropicBaseUrl
    ? `ANTHROPIC_BASE_URL=${shellQuote(run.anthropicBaseUrl)} ANTHROPIC_AUTH_TOKEN=${shellQuote(run.anthropicApiKey)}`
    : `ANTHROPIC_API_KEY=${shellQuote(run.anthropicApiKey)}`;

  return [
    'set -euo pipefail',
    `claude mcp add scalekit-virtual-mcp --transport http ${mcpUrl} --header ${shellQuote(`Authorization: Bearer ${run.sessionToken}`)}`,
    `${modelEnv} ANTHROPIC_MODEL=${shellQuote(run.model)} claude -p ${prompt} --model ${shellQuote(run.model)} --dangerously-skip-permissions`,
  ].join('\n');
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
