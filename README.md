# Scalekit × Runloop

Local demo: a user connects GitHub with Scalekit. A Runloop Devbox runs Claude Code. Claude Code calls Scalekit Virtual MCP. There is no MCP Hub.

See `CONTEXT.md` and `docs/adr/0001-skip-mcp-hub.md`.

## Once in the dashboards

1. [Scalekit](https://app.scalekit.com): confirm a GitHub connection (`github-connect` on new environments).
2. AgentKit → Virtual MCP: create a config that maps that GitHub connection. Allow PR read tools. Copy `config id` and `mcp_server_url`.
3. [Runloop](https://platform.runloop.ai/settings#api-keys): create an API key.
4. Anthropic: create an API key for Claude Code.

## Run

```bash
cp .env.example .env
# fill .env
npm install
npm test
npm run dev
```

Open http://localhost:3456.

1. Click **Connect GitHub** if status is not ready. Finish OAuth. Click **Refresh status**.
2. Click **Run**. The first run installs Claude Code in a new Devbox. This can take several minutes.

## What happens on Run

1. Demo app checks the connected account.
2. Demo app mints a session token.
3. Demo app starts a Devbox.
4. Claude Code registers Virtual MCP with that token.
5. Claude Code summarizes the last PR.
6. The Devbox shuts down.
