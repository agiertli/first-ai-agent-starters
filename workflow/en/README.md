# A fixed AI workflow: n8n

1. Import workflow.json into an existing n8n instance.
2. Edit api_base (no trailing slash), model, materials, and task in Inputs.
3. In Model, select Generic Credential Type → Header Auth. Create a credential with header name Authorization and value Bearer + your API key. Do not put the key in JSON.
4. Run manually. Draft for human review contains the draft for you to review.
5. Run tests.md. There is no publishing node or automatic trigger.

The sequence is fixed: Inputs → Model → Draft. The model does not choose the next step. This is an AI workflow, not an agent loop. JSON structure has been checked; validate import and execution in your n8n version before demonstration.

## Sources / Zdroje
https://docs.n8n.io/workflows/export-import/
https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/
