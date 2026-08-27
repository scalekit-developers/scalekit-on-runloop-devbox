import { RunloopSDK } from '@runloop/api-client';
import { buildAgentScript } from './boxCommands.ts';

export async function runAgentInDevbox(input: {
  runloopApiKey: string;
  mcpUrl: string;
  sessionToken: string;
  anthropicApiKey: string;
  onLog: (line: string) => void;
}): Promise<string> {
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
    const script = buildAgentScript({
      mcpUrl: input.mcpUrl,
      sessionToken: input.sessionToken,
      anthropicApiKey: input.anthropicApiKey,
    });

    await devbox.file.write({
      file_path: '/tmp/run-agent.sh',
      contents: `${script}\n`,
    });
    const execution = await devbox.cmd.execAsync('bash /tmp/run-agent.sh', {
      stdout: (line) => input.onLog(line),
      stderr: (line) => input.onLog(line),
    });
    const result = await execution.result();
    const stdout = (await result.stdout()).trim();
    const stderr = (await result.stderr()).trim();
    if (!result.success) {
      throw new Error(stderr || stdout || `Claude Code exited ${result.exitCode}`);
    }
    return stdout;
  } finally {
    input.onLog('Shutting down Devbox…');
    await devbox.shutdown().catch(() => undefined);
  }
}
