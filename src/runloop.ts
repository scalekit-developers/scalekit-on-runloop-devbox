import { RunloopSDK, type Devbox } from '@runloop/api-client';
import { buildClaudeScript, buildInstallScript, type AgentRun } from './devboxCommands.ts';

export async function runAgentInDevbox(
  input: AgentRun & {
    runloopApiKey: string;
    onLog: (line: string) => void;
  },
): Promise<string> {
  const sdk = new RunloopSDK({ bearerToken: input.runloopApiKey });
  input.onLog('Creating Devbox…');

  const devbox = await sdk.devbox.create({
    name: `scalekit-demo-${Date.now()}`,
    launch_parameters: {
      resource_size_request: 'SMALL',
      keep_alive_time_seconds: 900,
    },
  });

  try {
    input.onLog(`Devbox ${devbox.id} is up. Installing Claude Code (this can take a few minutes)…`);
    await runScript(devbox, '/tmp/install-claude.sh', buildInstallScript(), input.onLog);

    input.onLog('Asking Claude Code for the last pull request…');
    const result = await runScript(
      devbox,
      '/tmp/run-claude.sh',
      buildClaudeScript({
        mcpUrl: input.mcpUrl,
        sessionToken: input.sessionToken,
        anthropicApiKey: input.anthropicApiKey,
        anthropicBaseUrl: input.anthropicBaseUrl,
        model: input.model,
      }),
      input.onLog,
    );
    return (await result.stdout()).trim();
  } finally {
    input.onLog('Shutting down Devbox…');
    await devbox.shutdown().catch(() => undefined);
  }
}

async function runScript(devbox: Devbox, path: string, contents: string, onLog: (line: string) => void) {
  await devbox.file.write({ file_path: path, contents: `${contents}\n` });
  const execution = await devbox.cmd.execAsync(`bash ${path}`, {
    stdout: (line) => onLog(line),
    stderr: (line) => onLog(line),
  });
  const result = await execution.result();
  if (!result.success) {
    const stderr = (await result.stderr()).trim();
    const stdout = (await result.stdout()).trim();
    throw new Error(stderr || stdout || `Command exited ${result.exitCode}`);
  }
  return result;
}
