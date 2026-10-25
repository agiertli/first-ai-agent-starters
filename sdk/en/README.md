# Python + LiteLLM SDK

## Start here: create → configure → run → test

1. Edit brief.md (a completed fictional example), or use brief-template.md.
2. Paste create-agent.md into your tool. Attach brief.md, instructions.md and materials.md, or paste their contents. A filename alone does not provide access.
3. AI prepares or adapts the agent. Review the result and configure actual tools and permissions. Generated text does not install an agent.
4. For the first run use task.txt, then tests.md. Save the actual output.

You need Python 3.11+, uv, and a tool-capable OpenAI-compatible API. This is not the Codex SDK or Claude Agent SDK.

```sh
uv venv
uv pip install -r requirements.txt
export LLM_API_BASE="https://YOUR-ENDPOINT/v1"
export LLM_MODEL="YOUR-MODEL"
# Set LLM_API_KEY securely in your environment; avoid putting a real key in shell history.
.venv/bin/python agent.py
```

A chat subscription does not imply API credit. This is an actual loop with SDK calls. Tools read quote-data.json, check quantity/cost/deadline and save only a validated draft in output. Offers are fictional; no supplier is contacted. Arbitrary paths and sending are unavailable. Limits: 7 model calls, 4 tools per step, 3 quote checks and 3 minutes total. For this SDK quote-data.json is the source of offers; update it when changing the brief. Connection failure produces an error, never a simulation. Run tests.md.

## Sources / Zdroje
https://docs.litellm.ai/docs/completion/function_call
