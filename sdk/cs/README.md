# Python + LiteLLM SDK

## Začněte zde: vytvoření → nastavení → běh → test

1. Upravte brief.md (obsahuje vyplněný fiktivní příklad), nebo použijte brief-template.md.
2. Vložte prompt z create-agent.md do svého nástroje. Přiložte brief.md, instructions.md a materials.md; bez příloh vložte jejich obsah. Samotný odkaz na soubor nestačí.
3. AI připraví nebo upraví agenta. Zkontrolujte výsledek, nastavte skutečné nástroje a oprávnění. Vytvořený text sám agenta nenainstaluje.
4. Pro první běh použijte task.txt, poté tests.md. Uložte skutečný výstup.

Potřebujete Python 3.11+, uv a OpenAI-compatible API s podporou tools. Tohle není Codex SDK ani Claude Agent SDK.

```sh
uv venv
uv pip install -r requirements.txt
export LLM_API_BASE="https://YOUR-ENDPOINT/v1"
export LLM_MODEL="YOUR-MODEL"
# Nastavte LLM_API_KEY bezpečně v prostředí; nevkládejte skutečný klíč do historie příkazů.
.venv/bin/python agent.py
```

Předplatné chatu neznamená kredit API. Ukázka obsahuje skutečnou smyčku a SDK volání. Nástroje čtou quote-data.json, kontrolují množství/cenu/termín a uloží pouze ověřený návrh do output. Nabídky jsou fiktivní; žádný obchod se nekontaktuje. Libovolné cesty a odesílání nejsou dostupné. Limit: 7 volání modelu, 4 nástroje na krok, 3 kontroly nabídek a 3 minuty celkem. Pro tento SDK je quote-data.json zdroj nabídek; při změně briefu upravte i jej. Bez spojení končí chybou, ne simulací. Proveďte tests.md.

## Sources / Zdroje
https://docs.litellm.ai/docs/completion/function_call
