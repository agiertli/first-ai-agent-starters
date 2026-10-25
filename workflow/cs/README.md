# Pevný postup s AI: n8n

## Začněte zde: vytvoření → nastavení → běh → test

1. Pro vlastní nápad vyplňte problem.md: co řešíte, proč, pro koho a v jaké situaci. Vložte jej spolu s discuss-problem.md do svého chatu. AI pomůže navrhnout řešení; teprve potom společně doplňte a potvrďte brief.md. Předvyplněný brief.md je ukázka hotového zadání, ne vstupní dotazník.
2. Vložte prompt z create-agent.md do svého nástroje. Přiložte brief.md, instructions.md a materials.md; bez příloh vložte jejich obsah. Samotný odkaz na soubor nestačí.
3. AI připraví nebo upraví agenta. Zkontrolujte výsledek, nastavte skutečné nástroje a oprávnění. Vytvořený text sám agenta nenainstaluje.
4. Pro první běh použijte task.txt, poté tests.md. Uložte skutečný výstup.

1. V existující instanci n8n importujte workflow.json.
2. V uzlu Inputs upravte api_base (bez koncového lomítka), model, brief, materials a task.
3. V uzlu Model vyberte Generic Credential Type → Header Auth. Vytvořte credential s názvem hlavičky Authorization a hodnotou Bearer + vlastní API klíč. Klíč nedávejte do JSON.
4. Ručně spusťte workflow. Uzel Draft for human review obsahuje návrh, který zkontrolujete vy.
5. Proveďte tests.md. Šablona nic nepublikuje a nemá automatický spouštěč.

Pořadí je pevné: Inputs → Model → Draft. Model nevybírá další kroky. Je to AI workflow, ne agentní smyčka. JSON byl strukturálně ověřen; import a běh v konkrétní verzi n8n musíte před ukázkou ověřit.

## Sources / Zdroje
https://docs.n8n.io/workflows/export-import/
https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/
