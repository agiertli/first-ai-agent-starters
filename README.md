# Můj první AI agent / My first AI agent

Praktické šablony pro vlastní nástroj. Portál promítá lektor; účastníci pracují v ChatGPT, Claude, Gemini, Codexu nebo n8n.

## Začněte tvorbou / Start by creating

**create-agent.md → brief.md → instructions.md → task.txt → tests.md**

Prompt **create-agent.md** říká AI, aby s vámi agenta vytvořila. Brief je zdroj požadavků; instructions jsou pravidla pro jeho běh. V UI přiložte soubory nebo vložte jejich obsah. Název souboru není přístup na disk. Nastavení nástrojů a oprávnění ve své aplikaci ověřte zvlášť.

**create-agent.md** asks AI to create the agent with you. The brief holds requirements; instructions govern execution. Attach or paste files in a UI. A filename is not filesystem access. Verify tools and permissions in your application separately.

All routes use the same fictional quotation example. `cases.md` offers presentation and afternoon-planning alternatives. The SDK provides real read/check/save tools; UI and Markdown use your application's actual tools. n8n remains a fixed workflow for comparison.

## Bez terminálu / Without a terminal

Klikněte **Code → Download ZIP**, rozbalte soubor a otevřete README.md v jedné cestě a jazyku. Soubory `.md` jsou obyčejný text; otevřete je v textovém editoru, ne v terminálu.

[Download ZIP](https://github.com/agiertli/first-ai-agent-starters/archive/refs/heads/main.zip)

## S terminálem / With a terminal

```sh
git clone https://github.com/agiertli/first-ai-agent-starters.git
cd first-ai-agent-starters
```

## Vyberte jednu cestu / Choose one route

- **ui/cs** or **ui/en**: ChatGPT, Claude, Gemini. Paste instructions and sample materials into your own chat. No coding.
- **markdown/cs** or **markdown/en**: Codex / Claude Code project instructions. Requires the app and an account.
- **SDK / code — choose one implementation:**
  - **claude-sdk/cs** or **claude-sdk/en**: Claude Agent SDK in Python. Claude's harness supplies the loop; our local MCP server supplies quotation tools. Requires Anthropic API access.
  - **codex-sdk/cs** or **codex-sdk/en**: official Codex SDK in JavaScript. Codex supplies the agent harness and streams events; the same local MCP tools enforce quotation rules. Requires working Codex access, Node.js and Python.
  - **sdk/cs** or **sdk/en**: Python + LiteLLM, a custom bounded loop for a tool-capable API such as Qwen/vLLM. Here you own the harness code.
- **workflow/cs** or **workflow/en**: n8n JSON, a fixed input → model → review workflow. Requires an n8n instance and API access. Import/run validation in your n8n version remains required.

## Co není totéž / Important distinctions

Instructions alone are not a tool-using agent. A tool is an executable operation; a connector links a service; MCP is one connection protocol; a skill is reusable procedural guidance with optional files/scripts; a plugin packages capabilities. Names vary by product. Project AGENTS.md / CLAUDE.md files are not automatically installed skills.

## Výsledek / Outcome

Save your own brief, instructions, actual output, three test results and one next step. Keep the task small. Use fictional sample data. Never connect real publishing, payment or email-write permissions just to test a prompt. Instructions do not enforce permissions; the application must do that.

## Accounts and costs

Feature availability varies by product/account. A chat subscription does not imply API credit. The workshop does not provide accounts or promise paid features. Pair up if access is missing. Claude/Codex starters have package/configuration and real MCP tool checks. Codex SDK was also live-tested for both valid and infeasible quotations. Claude still needs a live run with an Anthropic API account. The LiteLLM route was live-tested with Qwen. SDK configuration and inherited user settings matter; read the selected README before running.

## License

Original starter code and prose: MIT (see LICENSE). Product names are their owners’ trademarks. This is an educational starter, not a supported Red Hat product or vendor endorsement. No credentials, customer material, or private presentation decks are included.
