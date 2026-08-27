# Scalekit AgentKit × Runloop — research

Date: 2026-08-27  
Sources: official docs via Exa + Linear SK-1454.

## Split

| Layer | Owner | What it is |
|-------|--------|------------|
| Who the user is, and which SaaS tokens they grant | Scalekit AgentKit | Connections, connected accounts, hosted OAuth, Virtual MCP session tokens |
| Where the agent runs | Runloop | Devbox (isolated VM), MCP Hub, Agent Gateways, network policies |

These products do not overlap.

`https://mcp.scalekit.com` is Scalekit **admin/dev MCP** (orgs, users, connections).  
It is **not** the user-tool endpoint. Use Virtual MCP `mcp_server_url` + a session token.

## Runloop (docs.runloop.ai)

- **Devbox**: isolated Linux VM for agent code.
- **MCP Hub**: one proxy URL (`$RL_MCP_URL`) + opaque per-server tokens. Real credentials stay on Runloop servers.
- **Agent Gateways**: same pattern for LLM APIs (`$ANTHROPIC_URL` + `$ANTHROPIC`). Tokens bind to that Devbox.
- **Network policies**: lock egress. Use `allow_mcp_gateway` and `allow_agent_gateway`.
- **Blueprints / Snapshots / Axons / Benchmarks**: templates, disk state, event stream, evals.

Gap: Hub secrets are account-static (PAT / bearer / header / basic). No per-user OAuth, consent, or refresh.

## Scalekit AgentKit (docs.scalekit.com/agentkit)

- **Connection**: one dashboard config for all users (OAuth app, scopes).
- **Connected account**: per-user tokens and status (`ACTIVE`, `EXPIRED`, `PENDING_AUTH`, …).
- **Virtual MCP**: create once per agent role → static `mcp_server_url`. Mint `create_session_token` per run. Do not reuse.
- **Tool Proxy**: `execute_tool` / `actions.request` from the control plane (no MCP needed).
- Hosted auth links for OAuth. Browser consent happens outside any sandbox.

Gap: no sandbox, no evals, no isolated VM. The agent runtime is yours.

## Wire-up (agreed in SK-1454: “container with Scalekit”)

1. User authorizes in the app (Scalekit hosted page). The Devbox never opens a browser.
2. App checks `list_mcp_connected_accounts`. If not `ACTIVE`, show `authentication_link`.
3. App mints a fresh session token (`create_session_token`).
4. App stores that token as a Runloop account secret (or per-tenant secret).
5. Devbox MCP Hub `endpoint` = Virtual MCP `mcp_server_url`. Hub secret = session token.
6. Box sees only `$RL_MCP_URL` + an opaque Hub token.
7. Network policy: MCP Hub + Agent Gateway only.

## Linear

- [SK-1454](https://linear.app/scalekit/issue/SK-1454/partnership-with-runloop) Partnership with Runloop — High, Todo. Tony: container + Scalekit. Next: sample app, then tutorial/docs.
- [SK-1319](https://linear.app/scalekit/issue/SK-1319/add-runloop-for-ecosystem-level-asks) Ecosystem listing — Backlog, stale since 23 Jul 2026.

## Sources

- https://docs.runloop.ai/docs/overview/what-is-runloop
- https://docs.runloop.ai/docs/devboxes/overview
- https://docs.runloop.ai/docs/devboxes/mcp-hub
- https://docs.runloop.ai/docs/devboxes/agent-gateways
- https://docs.runloop.ai/docs/network-policies
- https://docs.runloop.ai/docs/devboxes/configuration/account-secrets
- https://docs.scalekit.com/agentkit/quickstart/
- https://docs.scalekit.com/agentkit/mcp/overview/
- https://docs.scalekit.com/agentkit/mcp/configure-mcp-server
- https://docs.scalekit.com/agentkit/connections/
- https://docs.scalekit.com/agentkit/connected-accounts/
- https://docs.scalekit.com/agentkit/bring-your-own-connector/making-tool-calls/
