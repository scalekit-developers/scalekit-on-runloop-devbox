import { config as loadDotenv } from 'dotenv';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from './env.ts';
import { runAgentInDevbox } from './runloop.ts';
import { createScalekit, loadGithubStatus, mintSessionToken } from './scalekit.ts';

loadDotenv();

const env = loadEnv();
const scalekit = createScalekit(env);
const app = express();
const here = path.dirname(fileURLToPath(import.meta.url));

app.use(express.static(path.join(here, '..', 'public')));

app.get('/api/status', async (_req, res) => {
  try {
    const status = await loadGithubStatus(env, scalekit);
    res.json({ ...status, identifier: env.demoIdentifier, connectionName: env.githubConnectionName });
  } catch (error) {
    res.status(500).json({ error: messageOf(error) });
  }
});

app.post('/api/run', async (_req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (event: Record<string, unknown>) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  try {
    send({ type: 'log', text: 'Checking GitHub connected account…' });
    const status = await loadGithubStatus(env, scalekit);
    if (status.state !== 'ready') {
      send({
        type: 'error',
        text:
          status.state === 'needs_auth'
            ? 'GitHub is not connected. Click Connect GitHub first.'
            : 'GitHub is not connected. Refresh status, then click Connect GitHub.',
        status,
      });
      res.end();
      return;
    }

    send({ type: 'log', text: 'Minting a Scalekit session token…' });
    const { token, mcpServerUrl } = await mintSessionToken(env, scalekit);
    send({ type: 'log', text: `Virtual MCP: ${mcpServerUrl}` });
    send({ type: 'log', text: `Claude model: ${env.model}` });

    const summary = await runAgentInDevbox({
      runloopApiKey: env.runloopApiKey,
      mcpUrl: mcpServerUrl,
      sessionToken: token,
      anthropicApiKey: env.anthropicApiKey,
      anthropicBaseUrl: env.anthropicBaseUrl,
      model: env.model,
      onLog: (text) => send({ type: 'log', text }),
    });

    send({ type: 'done', text: summary });
  } catch (error) {
    send({ type: 'error', text: messageOf(error) });
  } finally {
    res.end();
  }
});

app.listen(env.port, () => {
  console.log(`Demo app: http://localhost:${env.port}`);
});

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
