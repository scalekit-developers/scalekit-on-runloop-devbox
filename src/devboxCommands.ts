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
  const model = shellQuote(run.model);
  const opus = shellQuote('claude-opus-4-6');
  const sonnet = shellQuote('claude-sonnet-4-6');
  const haiku = shellQuote('claude-haiku-4-5');
  const modelEnv = run.anthropicBaseUrl
    ? `ANTHROPIC_BASE_URL=${shellQuote(run.anthropicBaseUrl)} ANTHROPIC_AUTH_TOKEN=${shellQuote(run.anthropicApiKey)}`
    : `ANTHROPIC_API_KEY=${shellQuote(run.anthropicApiKey)}`;

  return [
    'set -euo pipefail',
    'mkdir -p "$HOME/.claude"',
    `printf '%s\\n' '{"model":"${run.model.replace(/"/g, '')}"}' > "$HOME/.claude/settings.json"`,
    `claude mcp add scalekit-virtual-mcp --transport http ${mcpUrl} --header ${shellQuote(`Authorization: Bearer ${run.sessionToken}`)}`,
    [
      modelEnv,
      `ANTHROPIC_MODEL=${model}`,
      `ANTHROPIC_DEFAULT_MODEL=${model}`,
      `ANTHROPIC_DEFAULT_OPUS_MODEL=${opus}`,
      `ANTHROPIC_DEFAULT_SONNET_MODEL=${sonnet}`,
      `ANTHROPIC_DEFAULT_HAIKU_MODEL=${haiku}`,
      `ANTHROPIC_DEFAULT_FABLE_MODEL=${sonnet}`,
      `claude -p ${prompt} --model ${model} --dangerously-skip-permissions`,
    ].join(' '),
  ].join('\n');
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
