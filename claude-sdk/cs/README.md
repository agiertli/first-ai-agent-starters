# Claude Agent SDK · Python

## Začněte zde: vytvoření → nastavení → běh → test

1. Upravte brief.md (obsahuje vyplněný fiktivní příklad), nebo použijte brief-template.md.
2. Vložte prompt z create-agent.md do svého nástroje. Přiložte brief.md, instructions.md a materials.md; bez příloh vložte jejich obsah. Samotný odkaz na soubor nestačí.
3. AI připraví nebo upraví agenta. Zkontrolujte výsledek, nastavte skutečné nástroje a oprávnění. Vytvořený text sám agenta nenainstaluje.
4. Pro první běh použijte task.txt, poté tests.md. Uložte skutečný výstup.

SDK poskytuje smyčku, kontext a provádění nástrojů. Náš kód dodává zadání, oprávnění a tři nástroje přes lokální MCP. Není nutné psát vlastní modelovou smyčku.

## Spuštění

Python 3.11+, uv a vlastní přístup k Anthropic API. Balíček obsahuje runtime Claude Code. Nastavte ANTHROPIC_API_KEY bezpečně v prostředí; .env.example se automaticky nenačítá. Volitelně nastavte CLAUDE_MODEL na model dostupný vašemu účtu.

```sh
uv venv
uv pip install -r requirements.txt
.venv/bin/python agent.py
```

Zadání se čte z brief.md, instructions.md a task.txt. Nabídky jsou ve fiktivním quote-data.json. Agent si zvolí další krok; server kontroluje návrh a uloží nejvýše jeden soubor do output. Změňte sklad Bety na 8 a spusťte znovu: žádná nabídka pak nesplní zadání. Pro změnu požadavků upravte brief.md i quote-data.json.

Vestavěné nástroje jsou vypnuté (tools=[]). Povolené jsou pouze read_materials, check_quote a save_quote z našeho MCP serveru; ostatní žádosti o povolení se zamítnou. Server běží jako lokální proces a sám vynucuje povolené operace. Limit: 7 agentních kol, 3 kontroly nabídky, 180 sekund. max_budget_usd=1 je odhadovaný práh, nikoli zaručený cenový strop. Předplatné chatu nepovažujte za API kredit.

## Co bylo ověřeno

Import a konfigurace proti připnutému SDK, skutečná MCP komunikace a kontrola/uložení na fiktivních datech. Živý modelový běh přes Anthropic API zatím nebyl ověřen. Před veřejnou ukázkou proveďte tests.md se svým účtem. Žádné náhradní odpovědi nejsou připravené.

## Sources / Zdroje
https://code.claude.com/docs/en/agent-sdk/overview
https://code.claude.com/docs/en/agent-sdk/permissions
