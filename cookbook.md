# Run a GitHub agent in a Devbox as one user

Use this recipe when an agent must call GitHub as Alice, not as a shared personal access token (PAT), and the agent process must run in a Runloop Devbox.

Do not use this recipe when you only need a static GitHub PAT and Runloop MCP Hub. That path is [Runloop’s official example](https://github.com/runloopai/api-client-ts/blob/main/examples/mcp-github-tools.ts).

**Result.** You open a local page, click Connect GitHub, click Run, and read a two-sentence summary of your last pull request (PR). Scalekit Virtual MCP holds the GitHub Open Authorization (OAuth) token. The Devbox holds only a short session token.

## Contents

- [What the two products own](#what-the-two-products-own)
- [What you need before you start](#what-you-need-before-you-start)
- [Create a Virtual MCP config in Scalekit](#create-a-virtual-mcp-config-in-scalekit)
- [Create a Runloop API key](#create-a-runloop-api-key)
- [Point Claude Code at LiteLLM](#point-claude-code-at-litellm)
- [Install and start the demo](#install-and-start-the-demo)
- [Connect GitHub and run](#connect-github-and-run)
- [What a successful run looks like](#what-a-successful-run-looks-like)
- [How a tool call travels](#how-a-tool-call-travels)
- [Which software development kits (SDKs) this demo uses](#which-software-development-kits-sdks-this-demo-uses)
- [Fix common failures](#fix-common-failures)

## What the two products own

Scalekit owns **who the user is**. A connection is one GitHub app config for all users. A connected account is one user’s GitHub OAuth tokens. Virtual MCP is one HTTP door plus a session token per run.

Runloop owns **where the agent runs**. A Devbox is an isolated Linux virtual machine (VM) in Runloop’s cloud.

MCP Hub is not in this recipe. Hub only stops a one-hour session token from leaving the Devbox. Virtual MCP already hides the GitHub OAuth token. See `docs/adr/0001-skip-mcp-hub.md`.

## What you need before you start

| Account | Why |
|---------|-----|
| [Scalekit](https://app.scalekit.com) | GitHub connection, Virtual MCP config, API credentials |
| [Runloop](https://platform.runloop.ai) | Devbox API key |
| LiteLLM gateway **or** Anthropic | Claude Code model calls |
| GitHub user with at least one PR | Something for the agent to summarize |

Node.js 22+ is required. The demo is TypeScript. Clone this folder and stay in it:

```bash
cd ecosystem/scalekit-x-runloop
```

## Create a Virtual MCP config in Scalekit

Virtual MCP is a Scalekit endpoint. The config is the recipe (which GitHub connection, which tools). The URL is the door Claude Code calls. The config id is how the Demo app mints a session token.

1. Open [app.scalekit.com](https://app.scalekit.com) and sign in.
2. Open **Developers → Settings → API Credentials**. Copy Environment URL, Client ID, and Client Secret.
3. Open **AgentKit → Connections**. Confirm a GitHub connection exists. New environments name it `github-connect`. Copy the exact name.
4. Open **AgentKit → Virtual MCP** (MCP configs).
5. Create a config named `github-pr-summarizer`. Map the GitHub connection. Allow PR read tools (`search_pull_requests`, `get_pull_request`, `get_me`).
6. Copy the **config id** (`cfg_…`) and **`mcp_server_url`**.

Do not use `https://mcp.scalekit.com`. That host is Scalekit admin MCP. It does not run user GitHub tools.

<details>
<summary>What config id and mcp_server_url each do</summary>

The Demo app calls Scalekit with the config id and your identifier. Scalekit mints a session token. Claude Code then calls `mcp_server_url` with `Authorization: Bearer <token>`. Scalekit checks the token and runs tools as that user. No token means no tools. A token for Alice cannot open Bob’s GitHub.
</details>

## Create a Runloop API key

1. Open [platform.runloop.ai](https://platform.runloop.ai) and sign in.
2. Open **Settings → API keys**.
3. Create a key and copy it once.

## Point Claude Code at LiteLLM

Claude Code speaks the Anthropic Messages API (`POST /v1/messages`). Many LiteLLM hosts also expose the OpenAI shape (`POST /v1/chat/completions`). Full LiteLLM usually serves both on the same host.

Set `LITELLM_BASE_URL` to the host only. Example: `https://llm.example.com`. Do not append `/v1` or `/chat/completions`.

Claude Code defaults to `claude-opus-5`. Your LiteLLM key may not allow that name. Pin a name your key lists. This demo defaults to `claude-sonnet-4-6` and remaps the opus / sonnet / haiku aliases.

Native Anthropic works too. Set `ANTHROPIC_API_KEY` and leave the LiteLLM variables empty.

## Install and start the demo

```bash
cp .env.example .env
```

Fill `.env`. Never commit that file.

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

PORT=3456
```

`DEMO_IDENTIFIER` is the demo user. Use the same string every run.

```bash
npm install
npm test
npm run dev
```

`npm test` should report 9 passed. Open [http://localhost:3456](http://localhost:3456).

## Connect GitHub and run

1. If the page says GitHub needs authorization, click **Connect GitHub**.
2. Finish the GitHub consent screen.
3. Return to the page and click **Refresh status**.
4. Status should say GitHub is connected.
5. Click **Summarize my last PR**.
6. Wait. The first run creates a Devbox and installs Claude Code. That can take several minutes.

The hop rail lights up as logs arrive: Browser → Scalekit → Devbox → GitHub.

## What a successful run looks like

| Check | Pass |
|--------|------|
| `npm test` | 9 passed |
| Status after OAuth | GitHub is connected |
| First log line after mint | `Claude model: claude-sonnet-4-6` |
| Mid logs | Creating Devbox, install, Claude Code |
| Final block | Two or three sentences about your last PR |
| End | Devbox shuts down |

## How a tool call travels

1. Demo app checks the connected account (`ACTIVE`).
2. Demo app mints a session token for `DEMO_IDENTIFIER` and the Virtual MCP config.
3. Demo app creates a Devbox with `@runloop/api-client`.
4. Claude Code inside the Devbox registers `mcp_server_url` with the session token as a bearer header.
5. Claude Code asks Virtual MCP for the last PR.
6. Scalekit uses the user’s GitHub OAuth token and calls GitHub.
7. The summary returns to the page. The Devbox shuts down.

The GitHub OAuth token never enters the Devbox. The session token does. That is deliberate for this recipe.

## Which software development kits (SDKs) this demo uses

Both official TypeScript clients are in `package.json`.

| Package | Used for |
|---------|----------|
| `@runloop/api-client` | `RunloopSDK`: create Devbox, write files, `cmd.execAsync`, shutdown |
| `@scalekit-sdk/node` | `ScalekitClient`: `getClientAccessToken()`, `actions.getAuthorizationLink()` |

Virtual MCP **list connected accounts** and **mint session token** use representational state transfer (REST) against:

- `POST /api/v1/mcp/configs/{id}/connected_accounts`
- `POST /api/v1/mcp/configs/{id}/tokens`

The Node SDK does not expose `create_session_token` yet. The Python Scalekit SDK does. See `src/scalekit.ts`.

Claude Code is a CLI installed **inside** the Devbox (`npm install -g @anthropic-ai/claude-code`). The Demo app does not import an Anthropic SDK.

## Fix common failures

**Connect GitHub never appears.** Config id or `GITHUB_CONNECTION_NAME` does not match the dashboard.

**Mint session token fails.** The GitHub connected account is not `ACTIVE`, or the Virtual MCP config has no GitHub mapping.

**`Invalid model name … claude-opus-5`.** Claude Code still resolved the opus alias. Confirm `CLAUDE_MODEL` and restart `npm run dev`. The log must show `Claude model: claude-sonnet-4-6` (or your pinned name).

**`401` from LiteLLM.** The host wants `x-api-key` instead of a bearer token, or the key is wrong.

**Claude finds no PR.** Add PR read tools on the Virtual MCP config. Sign in with a GitHub user who has a PR.

**Wrong MCP host.** `SCALEKIT_MCP_SERVER_URL` must be the Virtual MCP URL from the config, not `https://mcp.scalekit.com`.

**Runloop auth error.** `RUNLOOP_API_KEY` is missing or revoked.

## Related

- `CONTEXT.md` — terms used in this recipe
- `docs/adr/0001-skip-mcp-hub.md` — why Hub is omitted
- [Scalekit Virtual MCP](https://docs.scalekit.com/agentkit/mcp/overview/)
- [Runloop Devboxes](https://docs.runloop.ai/docs/devboxes/overview)
- Possible upstream PR home: [runloopai/api-client-ts examples](https://github.com/runloopai/api-client-ts/blob/main/examples/mcp-github-tools.ts)
