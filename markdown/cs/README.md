# Markdown: Codex / Claude Code

## Začněte zde: vytvoření → nastavení → běh → test

1. Pro vlastní nápad vyplňte problem.md: co řešíte, proč, pro koho a v jaké situaci. Vložte jej spolu s discuss-problem.md do svého chatu. AI pomůže navrhnout řešení; teprve potom společně doplňte a potvrďte brief.md. Předvyplněný brief.md je ukázka hotového zadání, ne vstupní dotazník.
2. Vložte prompt z create-agent.md do svého nástroje. Přiložte brief.md, instructions.md a materials.md; bez příloh vložte jejich obsah. Samotný odkaz na soubor nestačí.
3. AI připraví nebo upraví agenta. Zkontrolujte výsledek, nastavte skutečné nástroje a oprávnění. Vytvořený text sám agenta nenainstaluje.
4. Pro první běh použijte task.txt, poté tests.md. Uložte skutečný výstup.

1. Použijte tuto složku jako samostatný projekt. Potřebujete nainstalovaný a přihlášený Codex nebo Claude Code.
2. Codex načítá AGENTS.md, Claude Code CLAUDE.md. Instrukce vás odkazují na brief.md a materials.md; upravte je.
3. Otevřete složku v aplikaci a zadejte obsah task.txt. Požádejte o potvrzení, které instrukce byly načteny.
4. Omezte oprávnění v hostitelské aplikaci; textový soubor sám není bezpečnostní hranice. Nepovolujte automaticky všechny příkazy.
5. Proveďte tests.md. Výstup zkontrolujte před použitím.

AGENTS.md a CLAUDE.md jsou projektové instrukce, nikoli automaticky instalovaný skill. Skutečný skill má vlastní SKILL.md a podporované umístění v daném produktu.

## Sources / Zdroje
https://learn.chatgpt.com/docs/agent-configuration/agents-md
https://code.claude.com/docs/en/memory
