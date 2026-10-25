# Claude Agent SDK · Python

## Start here: create → configure → run → test

1. For your own idea, fill in problem.md: what, why, for whom and in what situation. Paste it with discuss-problem.md into your chat. Explore solutions with AI, then complete and agree brief.md. The supplied brief.md is a completed example, not an initial questionnaire.
2. Paste create-agent.md into your tool. Attach brief.md, instructions.md and materials.md, or paste their contents. A filename alone does not provide access.
3. AI prepares or adapts the agent. Review the result and configure actual tools and permissions. Generated text does not install an agent.
4. For the first run use task.txt, then tests.md. Save the actual output.

The SDK supplies the loop, context and tool execution. Our code supplies the brief, permissions and three tools through local MCP. You do not write the model loop yourself.

## Run

Python 3.11+, uv, and your own Anthropic API access. The package includes a Claude Code runtime. Set ANTHROPIC_API_KEY securely in the environment; .env.example is not loaded automatically. Optionally set CLAUDE_MODEL to a model your account can access.

```sh
uv venv
uv pip install -r requirements.txt
.venv/bin/python agent.py
```

The agent receives brief.md, instructions.md and task.txt. Offers come from fictional quote-data.json. The agent chooses its next action; the server validates the proposal and saves at most one file in output. Change Beta stock to 8 and rerun: no offer then meets the brief. When changing requirements, update both brief.md and quote-data.json.

Built-in tools are disabled (tools=[]). Only our MCP read_materials, check_quote and save_quote are allowed; other permission requests are denied. The server is a local process and enforces its own operation boundary. Limits: 7 agentic turns, 3 quotation checks, 180 seconds. max_budget_usd=1 is an estimated threshold, not a guaranteed billing cap. Do not assume a chat subscription includes API credit.

## Validation

Import and configuration checked against the pinned SDK; actual MCP communication and check/save operations checked on fictional data. A live Anthropic model run has not yet been verified. Run tests.md with your account before a public demo. No canned answers are supplied.

## Sources / Zdroje
https://code.claude.com/docs/en/agent-sdk/overview
https://code.claude.com/docs/en/agent-sdk/permissions
