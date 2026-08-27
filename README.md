# Scalekit on a Runloop Devbox

Run any [Scalekit](https://www.scalekit.com) AgentKit connector inside a [Runloop](https://runloop.ai) Devbox. The user authorizes GitHub once. The agent summarizes **their** last pull request (PR). The Devbox never holds a GitHub personal access token (PAT).

**Full steps:** [cookbook.md](./cookbook.md)

## Use this repo when

You need an agent that acts as one user on GitHub (or another Scalekit connector) and the process must run in a cloud sandbox.

Skip this repo if you only have a shared PAT. Use [Runloop’s MCP Hub example](https://github.com/runloopai/api-client-ts/blob/main/examples/mcp-github-tools.ts) instead.

## What you get after setup

1. A local page at `http://localhost:3456`
2. **Connect GitHub** on a Scalekit hosted page
3. **Summarize my last PR** starts a Devbox, runs Claude Code, and prints a two-sentence summary

Scalekit Virtual MCP is the door. A short session token is the key. Claude Code calls the Virtual MCP URL with `Authorization: Bearer <token>`.

## Quick start

You need Node.js 22+, a Scalekit environment, a Runloop API key, and a LiteLLM host **or** an Anthropic API key.

```bash
git clone https://github.com/scalekit-developers/scalekit-on-runloop-devbox.git
cd scalekit-on-runloop-devbox
cp .env.example .env
```

Fill `.env` (never commit that file):

```bash
SCALEKIT_ENV_URL=https://YOUR-ENV.scalekit.dev
SCALEKIT_CLIENT_ID=
SCALEKIT_CLIENT_SECRET=
SCALEKIT_MCP_CONFIG_ID=cfg_...
SCALEKIT_MCP_SERVER_URL=https://.../mcp/v3/servers/...
GITHUB_CONNECTION_NAME=github-connect
DEMO_IDENTIFIER=demo-user

RUNLOOP_API_KEY=

LITELLM_BASE_URL=https://YOUR-LITELLM-HOST
LITELLM_API_KEY=
CLAUDE_MODEL=claude-sonnet-4-6
```

Dashboard clicks live in [cookbook.md](./cookbook.md). You must create a Virtual MCP config named `github-pr-summarizer` and copy its config id and `mcp_server_url`. Do not use `https://mcp.scalekit.com`. That host is Scalekit admin MCP.

```bash
npm install
npm test
npm run dev
```

Open [http://localhost:3456](http://localhost:3456). Connect GitHub. Refresh status. Click **Summarize my last PR**. The first run installs Claude Code in a new Devbox and can take several minutes.

`npm test` should report 9 passed.

## How a run works

| Step | Owner |
|------|--------|
| Check the GitHub connected account | Scalekit |
| Mint a session token | Scalekit |
| Create a Devbox | Runloop (`@runloop/api-client`) |
| Register Virtual MCP on Claude Code | Devbox |
| Call GitHub as that user | Scalekit Virtual MCP |
| Shut down the Devbox | Runloop |

MCP Hub is not used. See `docs/adr/0001-skip-mcp-hub.md`.

## Which SDKs this demo uses

| Package | Role |
|---------|------|
| `@runloop/api-client` | Create, script, and shut down the Devbox |
| `@scalekit-sdk/node` | Management token and the Connect GitHub link |

Session token mint and connected-account list use REST (`POST /api/v1/mcp/configs/{id}/tokens`). The Node SDK does not expose `create_session_token` yet.

## License

See the repository. Treat this as an example, not a production service.
