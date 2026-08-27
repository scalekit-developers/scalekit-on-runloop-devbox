import { describe, expect, it } from 'vitest';
import { AGENT_PROMPT, buildClaudeScript, buildInstallScript } from './devboxCommands.ts';

const run = {
  mcpUrl: 'https://example.scalekit.com/mcp/v3/servers/abc',
  sessionToken: 'session_test_token',
  anthropicApiKey: 'sk-ant-test',
  model: 'claude-sonnet-4-6',
};

describe('buildClaudeScript', () => {
  const script = buildClaudeScript(run);

  it('points Claude Code at Virtual MCP, not MCP Hub', () => {
    expect(script).toContain('https://example.scalekit.com/mcp/v3/servers/abc');
    expect(script).toContain('claude mcp add scalekit-virtual-mcp');
    expect(script).toContain('--transport http');
    expect(script).not.toContain('$RL_MCP_URL');
    expect(script).not.toContain('RL_MCP');
    expect(script).not.toContain('vmcp');
  });

  it('sends the session token as a bearer header', () => {
    expect(script).toContain('Authorization: Bearer session_test_token');
  });

  it('points Claude Code at LiteLLM when a base URL is set', () => {
    const viaLiteLlm = buildClaudeScript({
      ...run,
      anthropicBaseUrl: 'https://llm.example.com',
    });
    expect(viaLiteLlm).toContain("ANTHROPIC_BASE_URL='https://llm.example.com'");
    expect(viaLiteLlm).toContain("ANTHROPIC_AUTH_TOKEN='sk-ant-test'");
    expect(viaLiteLlm).not.toContain('ANTHROPIC_API_KEY=');
  });

  it('asks Claude Code to summarize the last pull request', () => {
    expect(script).toContain(AGENT_PROMPT);
    expect(script).toContain('claude -p');
    expect(script).not.toContain('how you collected');
    expect(script).not.toContain('npm install');
    expect(script).toContain("--model 'claude-sonnet-4-6'");
  });
});

describe('buildInstallScript', () => {
  it('installs Claude Code only', () => {
    expect(buildInstallScript()).toContain('npm install -g @anthropic-ai/claude-code');
    expect(buildInstallScript()).not.toContain('claude -p');
  });
});
