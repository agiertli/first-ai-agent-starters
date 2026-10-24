# Python + LiteLLM SDK

Potřebujete Python 3.11+, uv a OpenAI-compatible API s podporou tools. Tohle není Codex SDK ani Claude Agent SDK.

```sh
uv venv
uv pip install -r requirements.txt
export LLM_API_BASE="https://YOUR-ENDPOINT/v1"
export LLM_MODEL="YOUR-MODEL"
# Nastavte LLM_API_KEY bezpečně v prostředí; nevkládejte skutečný klíč do historie příkazů.
.venv/bin/python agent.py
```

Předplatné chatu neznamená kredit API. Ukázka obsahuje skutečnou smyčku a SDK volání. Jediný nástroj přečte konkrétní materials.md, nemůže číst libovolné cesty ani nic odeslat. Limit je 5 rozhodnutí, 4 nástroje na krok, 3 minuty celkem. Bez spojení končí chybou, ne simulací. Proveďte tests.md.

## Sources / Zdroje
https://docs.litellm.ai/docs/completion/function_call
