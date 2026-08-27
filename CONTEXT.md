# Scalekit × Runloop sample

A coding agent runs in a Runloop Devbox and acts as one user on GitHub through Scalekit Virtual MCP.

## Language

**Devbox**:
The isolated Linux VM where the agent process runs.
_Avoid_: sandbox (in writing — same thing, use Devbox), container, Lambda

**MCP Hub**:
Runloop's proxy in front of an MCP server. Not used in v1. See `docs/adr/0001-skip-mcp-hub.md`.
_Avoid_: gateway (that is Agent Gateway), vMCP

**Virtual MCP**:
Scalekit's user-scoped MCP endpoint. One URL per agent role. Each run gets a session token bound to one user.
_Avoid_: admin MCP, mcp.scalekit.com, Hub

**Session token**:
A short-lived Scalekit bearer token for one user and one Virtual MCP. Mint it before each run. Do not reuse it.
_Avoid_: PAT, API key, opaque token

**Opaque token**:
The Hub token inside the Devbox. It is not the session token and not the GitHub OAuth token.
_Avoid_: session token, PAT

**Connection**:
One Scalekit dashboard config for an app (for example GitHub). It serves all users.
_Avoid_: connector (the catalog type), connected account

**Connected account**:
The per-user record that holds that user's GitHub tokens and status.
_Avoid_: connection, account

**Control plane**:
Your app outside the Devbox. It authorizes the user, mints the session token, and starts the Devbox.
_Avoid_: agent, box

**Demo app**:
The TypeScript web app. It is the control plane the user sees.
_Avoid_: agent, Devbox
