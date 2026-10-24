# Můj první AI agent / My first AI agent

Praktické šablony pro vlastní nástroj. Portál promítá lektor; účastníci pracují v ChatGPT, Claude, Gemini, Codexu nebo n8n.

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
- **sdk/cs** or **sdk/en**: Python + LiteLLM SDK, a real bounded agent loop. Requires Python 3.11+, uv and a tool-capable API.
- **workflow/cs** or **workflow/en**: n8n JSON, a fixed input → model → review workflow. Requires an n8n instance and API access. Import/run validation in your n8n version remains required.

## Co není totéž / Important distinctions

Instructions alone are not a tool-using agent. A tool is an executable operation; a connector links a service; MCP is one connection protocol; a skill is reusable procedural guidance with optional files/scripts; a plugin packages capabilities. Names vary by product. Project AGENTS.md / CLAUDE.md files are not automatically installed skills.

## Výsledek / Outcome

Save your own brief, instructions, actual output, three test results and one next step. Keep the task small. Use fictional sample data. Never connect real publishing, payment or email-write permissions just to test a prompt. Instructions do not enforce permissions; the application must do that.

## Accounts and costs

Feature availability varies by product/account. A chat subscription does not imply API credit. The workshop does not provide accounts or promise paid features. Pair up if access is missing.

## License

Original starter code and prose: MIT (see LICENSE). Product names are their owners’ trademarks. This is an educational starter, not a supported Red Hat product or vendor endorsement. No credentials, customer material, or private presentation decks are included.
