# Python + LiteLLM SDK

You need Python 3.11+, uv, and a tool-capable OpenAI-compatible API. This is not the Codex SDK or Claude Agent SDK.

```sh
uv venv
uv pip install -r requirements.txt
export LLM_API_BASE="https://YOUR-ENDPOINT/v1"
export LLM_MODEL="YOUR-MODEL"
# Set LLM_API_KEY securely in your environment; avoid putting a real key in shell history.
.venv/bin/python agent.py
```

A chat subscription does not imply API credit. This is an actual loop with SDK calls. The only tool reads the specific materials.md, not arbitrary paths, and cannot send anything. Limits: 5 decisions, 4 tools per step, 3 minutes total. Connection failure produces an error, never a simulation. Run tests.md.

## Sources / Zdroje
https://docs.litellm.ai/docs/completion/function_call
