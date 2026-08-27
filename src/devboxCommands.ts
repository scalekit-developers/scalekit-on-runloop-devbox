export const AGENT_PROMPT =
  'Use the MCP tools to get my last pull request and describe what it does in 2-3 sentences.';

export type AgentRun = {
  mcpUrl: string;
  sessionToken: string;
  anthropicApiKey: string;
};

export function buildInstallScript(): string {
  return ['set -euo pipefail', 'npm install -g @anthropic-ai/claude-code'].join('\n');
}

export function buildClaudeScript(run: AgentRun): string {
  const mcpUrl = shellQuote(run.mcpUrl);
  const anthropic = shellQuote(run.anthropicApiKey);
  const prompt = shellQuote(AGENT_PROMPT);

  return [
    'set -euo pipefail',
    `claude mcp add scalekit-virtual-mcp --transport http ${mcpUrl} --header ${shellQuote(`Authorization: Bearer ${run.sessionToken}`)}`,
    `ANTHROPIC_API_KEY=${anthropic} claude -p ${prompt} --dangerously-skip-permissions`,
  ].join('\n');
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
