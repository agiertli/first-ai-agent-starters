# A fixed AI workflow: n8n

## Start here: create → configure → run → test

1. For your own idea, use problem.md as a guide; write or dictate freely: what, why, for whom and in what situation. Paste it with discuss-problem.md into your chat. Explore solutions with AI, then complete and agree brief.md. The supplied brief.md is a completed example, not an initial questionnaire.
2. Paste create-agent.md into your tool. Attach brief.md, instructions.md and materials.md, or paste their contents. A filename alone does not provide access.
3. AI prepares or adapts the agent. Review the result and configure actual tools and permissions. Generated text does not install an agent.
4. For the first run use task.txt, then tests.md. Save the actual output.

1. Import workflow.json into an existing n8n instance.
2. Edit api_base (no trailing slash), model, brief, materials, and task in Inputs.
3. In Model, select Generic Credential Type → Header Auth. Create a credential with header name Authorization and value Bearer + your API key. Do not put the key in JSON.
4. Run manually. Draft for human review contains the draft for you to review.
5. Run tests.md. There is no publishing node or automatic trigger.

The sequence is fixed: Inputs → Model → Draft. The model does not choose the next step. This is an AI workflow, not an agent loop. JSON structure has been checked; validate import and execution in your n8n version before demonstration.

## Sources / Zdroje
https://docs.n8n.io/workflows/export-import/
https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/
