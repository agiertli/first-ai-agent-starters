# Codex SDK · JavaScript

## Start here: create → configure → run → test

1. For your own idea, use problem.md as a guide; write or dictate freely: what, why, for whom and in what situation. Paste it with discuss-problem.md into your chat. Explore solutions with AI, then complete and agree brief.md. The supplied brief.md is a completed example, not an initial questionnaire.
2. Paste create-agent.md into your tool. Attach brief.md, instructions.md and materials.md, or paste their contents. A filename alone does not provide access.
3. AI prepares or adapts the agent. Review the result and configure actual tools and permissions. Generated text does not install an agent.
4. For the first run use task.txt, then tests.md. Save the actual output.

The Codex SDK starts a ready-made agent environment from your program. Codex runs the model loop and emits events; our local MCP server enforces the quotation rules. This uses the official @openai/codex-sdk, not the general OpenAI API client.

## Run

Node.js 20+, Python 3.11+, uv, and working Codex sign-in or API access supported by Codex. Verify model access for your account. Optional CODEX_MODEL selects a model; omit it to use your configured default. If sign-in is missing, run `npx --no-install codex login` after npm install.

```sh
uv venv
uv pip install -r requirements.txt
npm install
npm start
```

On Windows, set WORKSHOP_PYTHON to the absolute .venv/Scripts/python.exe path. macOS/Linux use .venv/bin/python automatically. .env.example is not loaded automatically.

The program supplies brief.md, instructions.md and task.txt. MCP exposes the same read_materials, check_quote and save_quote as the other SDK variants. Change Beta stock in quote-data.json to 8 and compare the outcome. Drafts must pass checks; no orders are placed. Update both brief.md and quote-data.json when changing requirements.

Codex uses a read-only sandbox with shell and web search disabled. The MCP server is a separate process: that sandbox does not restrict its writes. The server therefore enforces one validated draft in output. Approval policy never means no interactive approval wait; our three MCP operations are explicitly permitted. User Codex configuration may be inherited, so review connected services before the demo and use a separate folder with fictional data. Limits: 180 seconds; the server permits at most 3 checks and 1 saved draft. This is not a limit on internal model calls.

## Validation

Live Codex SDK run: read offers → validate Beta → save an actual CZK 4,080 draft. A second live run with Beta stock reduced to 8 rejected all three suppliers and created no new file. Syntax, types and MCP communication also checked. Run tests.md with your account before demonstrating. Failure never produces a simulated answer.

## Sources / Zdroje
https://learn.chatgpt.com/docs/codex-sdk
https://learn.chatgpt.com/docs/extend/mcp
