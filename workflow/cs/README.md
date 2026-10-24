# Pevný postup s AI: n8n

1. V existující instanci n8n importujte workflow.json.
2. V uzlu Inputs upravte api_base (bez koncového lomítka), model, materials a task.
3. V uzlu Model vyberte Generic Credential Type → Header Auth. Vytvořte credential s názvem hlavičky Authorization a hodnotou Bearer + vlastní API klíč. Klíč nedávejte do JSON.
4. Ručně spusťte workflow. Uzel Draft for human review obsahuje návrh, který zkontrolujete vy.
5. Proveďte tests.md. Šablona nic nepublikuje a nemá automatický spouštěč.

Pořadí je pevné: Inputs → Model → Draft. Model nevybírá další kroky. Je to AI workflow, ne agentní smyčka. JSON byl strukturálně ověřen; import a běh v konkrétní verzi n8n musíte před ukázkou ověřit.

## Sources / Zdroje
https://docs.n8n.io/workflows/export-import/
https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/
