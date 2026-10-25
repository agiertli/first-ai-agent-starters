# Codex SDK · JavaScript

## Začněte zde: vytvoření → nastavení → běh → test

1. Upravte brief.md (obsahuje vyplněný fiktivní příklad), nebo použijte brief-template.md.
2. Vložte prompt z create-agent.md do svého nástroje. Přiložte brief.md, instructions.md a materials.md; bez příloh vložte jejich obsah. Samotný odkaz na soubor nestačí.
3. AI připraví nebo upraví agenta. Zkontrolujte výsledek, nastavte skutečné nástroje a oprávnění. Vytvořený text sám agenta nenainstaluje.
4. Pro první běh použijte task.txt, poté tests.md. Uložte skutečný výstup.

Codex SDK spouští hotové agentní prostředí z vašeho programu. Codex řídí modelovou smyčku a vrací události; vlastní pravidla obchodní nabídky zajišťuje náš lokální MCP server. Používáme oficiální @openai/codex-sdk, nikoli běžný klient OpenAI API.

## Spuštění

Node.js 20+, Python 3.11+, uv a funkční přihlášení Codex nebo API přístup podporovaný Codexem. Nárok na model ověřte ve svém účtu. Volitelný CODEX_MODEL vybírá model; bez něj zůstane nastavený výchozí model. Pokud chybí přihlášení, spusťte `npx --no-install codex login` až po npm install.

```sh
uv venv
uv pip install -r requirements.txt
npm install
npm start
```

Na Windows nastavte WORKSHOP_PYTHON na úplnou cestu k .venv/Scripts/python.exe. Na macOS/Linux se automaticky použije .venv/bin/python. Soubor .env.example se automaticky nenačítá.

Program vloží brief.md, instructions.md a task.txt. Přes MCP zpřístupní stejná read_materials, check_quote a save_quote jako ostatní SDK varianty. Změňte sklad Bety v quote-data.json na 8 a porovnejte výsledek. Návrh musí projít kontrolou; nic se neobjednává. Pro změnu požadavků upravte brief.md i quote-data.json.

Codex běží v read-only sandboxu, se zakázaným shellem a webovým vyhledáváním. MCP server je samostatný proces: read-only sandbox se na jeho zápisy nevztahuje. Proto server sám omezuje zápis na jeden ověřený návrh v output. Approval policy never znamená, že program nečeká na interaktivní schválení; naše tři MCP operace jsou výslovně povolené. Uživatelova konfigurace Codexu se může dědit, proto před ukázkou zkontrolujte připojené služby a používejte samostatnou složku s fiktivními daty. Limit běhu: 180 sekund, server povolí nejvýše 3 kontroly a 1 uložený návrh. Toto není limit počtu interních volání modelu.

## Co bylo ověřeno

Živý běh přes Codex SDK: načtení podkladů → kontrola Bety → skutečný uložený návrh za 4 080 Kč. Druhý živý běh se skladem Bety 8 zamítl všechny tři dodavatele a nevytvořil nový soubor. Ověřena také syntaxe, typy a MCP komunikace. Před ukázkou proveďte tests.md se svým účtem; při chybě se nesimuluje odpověď.

## Sources / Zdroje
https://learn.chatgpt.com/docs/codex-sdk
https://learn.chatgpt.com/docs/extend/mcp
