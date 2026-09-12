---
name: codex
description: Run tasks, generate diffs, or execute coding subtasks using the OpenAI Codex CLI and MCP server integration in Antigravity.
---

# OpenAI Codex Integration

This skill enables Antigravity to utilize the OpenAI Codex CLI (`@openai/codex`) installed on the system as an external code engine and subagent.

## Codex MCP Server
Codex runs as a Model Context Protocol (MCP) server defined in `.agents/mcp_config.json`:
```json
{
  "mcpServers": {
    "openai-codex": {
      "command": "cmd.exe",
      "args": ["/c", "codex", "mcp-server"]
    }
  }
}
```

## CLI Usage
You can also run Codex commands directly in the terminal:
- Run interactive coding session: `codex "<prompt>"`
- Run non-interactively: `codex exec "<task>"`
- Run code review: `codex review`
- Apply diffs: `codex apply`
