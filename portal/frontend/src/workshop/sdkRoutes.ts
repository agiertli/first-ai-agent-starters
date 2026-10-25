import { w } from './content';

export const sdkRoutes = [
  {
    title: w('Claude Agent SDK', 'Claude Agent SDK'), products: 'Python / claude-agent-sdk', file: 'claude-sdk',
    why: w('Vlastní program, hotová agentní smyčka Claude Code. SDK zajišťuje opakovaná volání modelu, kontext a provádění nástrojů. Vy dodáte cíl, nástroje a oprávnění.', 'Your program uses the existing Claude Code agent loop. The SDK handles repeated model calls, context and tool execution. You supply the goal, tools and permissions.'),
    steps: w('1. Připravte Python, uv a vlastní přístup k Anthropic API podle README.\n2. Upravte brief.md. Program ho načte spolu s instrukcemi a úkolem.\n3. Spusťte agent.py. Claude samostatně vybírá čtení nabídek, kontrolu a uložení návrhu přes lokální MCP.\n4. Změňte sklad Bety na 8. Ověřte, že agent přehodnotí výsledek a nevytvoří neplatnou nabídku.', '1. Prepare Python, uv and your Anthropic API access as described in the README.\n2. Adapt brief.md. The program loads it alongside instructions and the task.\n3. Run agent.py. Claude chooses when to read offers, validate and save a draft through local MCP.\n4. Change Beta stock to 8. Check that the agent reconsiders and does not save an invalid quotation.'),
    source: 'https://code.claude.com/docs/en/agent-sdk/overview', sourceName: 'Claude Agent SDK',
    validation: w('Ověřené balíčky, konfigurace a skutečné MCP nástroje. Živý běh s modelem Claude je třeba ověřit s vlastním API účtem před ukázkou.', 'Packages, configuration and actual MCP tools checked. Verify a live Claude model run with your API account before demonstrating.'),
  },
  {
    title: w('Codex SDK', 'Codex SDK'), products: 'JavaScript / @openai/codex-sdk', file: 'codex-sdk',
    why: w('Programově spustíte Codex jako hotové agentní prostředí. Codex řídí smyčku; váš program zadá práci a sleduje události. Stejný lokální MCP server dodává nástroje pro nabídku.', 'Start Codex programmatically as a ready-made agent environment. Codex manages the loop; your program supplies the task and observes events. The same local MCP server supplies quotation tools.'),
    steps: w('1. Připravte Node.js, Python a přístup ke Codexu podle README.\n2. Upravte brief.md a zkontrolujte nastavení nástrojů. Připojené služby se mohou dědit z vašeho Codexu.\n3. Spusťte npm start. Sledujte skutečné MCP operace a návrh v output.\n4. Změňte podmínky v quote-data.json a proveďte stejné testy. Read-only sandbox Codexu neomezuje zápisy MCP serveru; ty kontroluje server.', '1. Prepare Node.js, Python and Codex access as described in the README.\n2. Adapt brief.md and review tool configuration. Connected services may be inherited from your Codex settings.\n3. Run npm start. Observe actual MCP operations and the draft in output.\n4. Change quote-data.json constraints and run the same tests. Codex’s read-only sandbox does not restrict MCP server writes; the server enforces those rules.'),
    source: 'https://learn.chatgpt.com/docs/codex-sdk', sourceName: 'Codex SDK',
    validation: w('Živě ověřeno přes Codex SDK: uložený návrh za 4 080 Kč; po snížení skladu Bety na 8 odmítnutí všech možností bez nového souboru.', 'Live-verified through Codex SDK: a saved CZK 4,080 draft; after reducing Beta stock to 8, all options rejected and no new file created.'),
  },
  {
    title: w('Vlastní smyčka · LiteLLM', 'Your own loop · LiteLLM'), products: 'Python / LiteLLM / Qwen, vLLM, OpenAI-compatible API', file: 'sdk',
    why: w('Chcete si sami napsat řídicí prostředí. LiteLLM zprostředkuje volání modelu; váš kód drží historii, provádí nástroje, vrací výsledky a hlídá konec. Hodí se i pro vlastní Qwen.', 'You want to write the harness yourself. LiteLLM calls the model; your code holds history, executes tools, returns results and enforces stopping. This also works with your own Qwen.'),
    steps: w('1. Připravte Python, uv a API s podporou tools.\n2. Nastavte adresu, model a klíč v prostředí podle README.\n3. Spusťte agent.py: model vybírá čtení, kontrolu a uložení nabídky.\n4. Projděte vlastní smyčku: nejvýše 7 volání modelu, 3 kontroly a 180 sekund. Porovnejte, co u prvních dvou variant zajišťuje SDK.', '1. Prepare Python, uv and a tool-capable API.\n2. Set endpoint, model and key in the environment as described in the README.\n3. Run agent.py: the model selects reading, checking and saving a quotation.\n4. Inspect the custom loop: at most 7 model calls, 3 checks and 180 seconds. Compare what the SDK handles in the first two variants.'),
    source: 'https://docs.litellm.ai/docs/completion/function_call', sourceName: 'LiteLLM: tool calling',
    validation: w('Živě ověřeno s Qwenem: platná nabídka i změna zásob, při níž žádný dodavatel nevyhoví.', 'Live-verified with Qwen: a valid quotation and changed stock where no supplier meets the requirements.'),
  },
];
