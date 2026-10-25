# Workshop portal source

Editable React/TypeScript source for https://agiertli.github.io/first-ai-agent-starters/.
`frontend/src/workshop/` contains the lessons, diagrams, browser harness and connection UI.
`workshop-content/` contains shared case studies, creation prompts and facilitator runbook text.
`frontend/public/` contains the downloadable templates, PDFs and reference decks.

## Local development

Use a current Node.js 22 or 24 installation with npm, and Python 3.11+ for
packaging the downloadable starters (standard library only).

```sh
cd portal/frontend
npm ci
npm run dev
```

Open http://localhost:5174/#/workshop. No Python backend is required.
For a built local preview, run `npm run build` and `npm run preview` (port 4174).

## Update and publish (also for Codex / Claude)

Edit the sources here, then run from `portal/frontend`:

```sh
npm test
npm run lint
npm run stage
```

`stage` builds the static site and copies it into the repository's `docs/` folder.
Review the change, commit the edited source and generated `docs/`, and push `main`.
GitHub Pages automatically deploys `main:/docs`; no custom domain or server is needed.
Check the **pages build and deployment** Action and the live site before reporting success.
The site URL remains unchanged. `docs/build-manifest.json` identifies the deployed files.
Do not edit minified files in `docs/assets/` by hand.

## Presenting and participant materials

In a live example, select **Promítat ukázku / Present demo** to show the animated
diagram, highlighted event and real model answer together. Previous/next and
the event selector control the recorded trace. Pausing playback does not stop
execution; **Stop** does. Replay makes no API calls. **Esc** returns to the lesson.
The answer panel scrolls independently when the response is long. On small
screens the panels stack rather than shrinking their text to fit.

The agenda protects 40 minutes for building and 30 for testing, in participants'
own tools. Work blocks have a visible timer. The no-code pack includes
`start-here.txt` for a complete first example and `test-record.md` for recording
expectations, actual results and retests. The other packs retain their own setup
requirements; changing the case description does not change an SDK's tools.

Use **Notes and controls** for chapter guidance and the one-page Czech/English
facilitator manual. Notes and model settings are visible on the projector.
The public `frontend/public/runbook/` PDFs must be updated when the shared
`workshop-content/runbook.json` timing or guidance changes. Downloaded assets and
the file previews in `frontend/src/workshop/starterCatalog.json` are regenerated
from the root starter folders by `package_starters.py` before development and
builds. Edit those root folders rather than the generated catalog or ZIP files.

## Model connection and boundaries

Readers need no API key. A presenter enters their own HTTPS API base, model name
and key in **Notes and controls → Model connection**. The key is held in tab
`sessionStorage`, sent directly to that model endpoint, and never published in
the repository or sent to GitHub. Browser scripts can access it; use a dedicated
demo key and **Forget connection** after presenting. Refresh preserves the key;
session restoration and tab duplication may also retain it.

The browser runs the agent loop and only two allowlisted read tools:
`read_materials` and optional `get_weather`. Open-Meteo receives no model key.
The endpoint must authenticate requests and allow HTTPS/CORS from the hosting
origin. The browser's run limits are demonstration controls, not security quotas
on the inference server. There is no shared anonymous model proxy.

The source keeps two compatibility modules (`SettingsPanel.tsx` and
`settingsStorage.ts`) used by the original local technical portal. They are
excluded from this static build; the staging script rejects bundles containing
the original portal API routes. Always use the provided static-mode commands.

Never commit credentials, `.env`, browser sessions or private model-run exports.
Keep Czech and English copy aligned and preserve the real execution trace:
no fabricated answers or weather. The original eleven technical lessons remain
in the separate local lecture project; this source package is the public workshop.
