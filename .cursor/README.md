# Cursor MCP config

Project-level MCP servers are configured in **`mcp.json`** in this folder.

## Render MCP

To use the Render MCP server:

1. Get your Render API key: [Render Dashboard](https://dashboard.render.com) → **Account Settings** → **API Keys** → Create or copy a key.
2. Edit **`mcp.json`** and replace `<YOUR_API_KEY>` with your key.
3. Restart Cursor so it picks up the config.

If you put a real API key in `mcp.json`, consider adding `.cursor/mcp.json` to `.gitignore` so it isn’t committed.
