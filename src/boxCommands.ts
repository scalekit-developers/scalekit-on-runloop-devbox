export const AGENT_PROMPT =
  'Use the MCP tools to get my last pull request and describe what it does in 2-3 sentences. Also say how you collected this information.';

export function buildAgentScript(input: {
  mcpUrl: string;
  sessionToken: string;
  anthropicApiKey: string;
}): string {
  const mcpUrl = shellQuote(input.mcpUrl);
  const anthropic = shellQuote(input.anthropicApiKey);
  const prompt = shellQuote(AGENT_PROMPT);

  return [
    'set -euo pipefail',
    'npm install -g @anthropic-ai/claude-code',
    `claude mcp add scalekit-vmcp --transport http ${mcpUrl} --header ${shellQuote(`Authorization: Bearer ${input.sessionToken}`)}`,
    `ANTHROPIC_API_KEY=${anthropic} claude -p ${prompt} --dangerously-skip-permissions`,
  ].join('\n');
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
