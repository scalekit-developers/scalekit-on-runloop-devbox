import { describe, expect, it } from 'vitest';
import { AGENT_PROMPT, buildAgentScript } from './boxCommands.ts';

describe('buildAgentScript', () => {
  const script = buildAgentScript({
    mcpUrl: 'https://example.scalekit.com/mcp/v3/servers/abc',
    sessionToken: 'session_test_token',
    anthropicApiKey: 'sk-ant-test',
  });

  it('points Claude Code at Virtual MCP, not MCP Hub', () => {
    expect(script).toContain('https://example.scalekit.com/mcp/v3/servers/abc');
    expect(script).toContain('claude mcp add');
    expect(script).toContain('--transport http');
    expect(script).not.toContain('$RL_MCP_URL');
    expect(script).not.toContain('RL_MCP');
  });

  it('sends the session token as a bearer header', () => {
    expect(script).toContain('Authorization: Bearer session_test_token');
  });

  it('asks Claude Code to summarize the last pull request', () => {
    expect(script).toContain(AGENT_PROMPT);
    expect(script).toContain('claude -p');
  });
});
