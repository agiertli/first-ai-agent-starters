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

The two top-level areas are **Presentation** and **Exercises**. Presentation has
20 concise slides covering the nine timed sections (180 minutes). Arrow keys
and previous/next buttons move between slides; Programme jumps to a section.
The default language is Czech, with English available from the header.

Exercises is a directly shareable page:
https://agiertli.github.io/first-ai-agent-starters/#/workshop?view=exercises
It provides copy-ready problem questions, discovery and creation prompts, a test
record and a save checklist. Examples appear here, not in the opening. There is
no need to download files or visit GitHub for the basic path. SDK, Markdown and
workflow downloads remain available under Templates. The QR under Facilitator
opens the public exercise page; no external tracking or shortener is used.

The weather demonstration opens over the current slide. Starting a run hides
setup controls to keep the diagram, highlighted event and actual answer visible
together. “Set up the next attempt” reveals the scenario and input again.
Stepping and pause control the recorded trace, not execution; replay makes no
API calls. Esc closes the demo. The result remains available when reopened.
On narrow screens content stacks and scrolls rather than shrinking to unreadable text.

The agenda protects 40 minutes of building and 30 of testing in participants'
own apps. The brief starts with the problem, reason, people and context. AI helps
agree outputs, tools and success checks only after a solution is chosen. Timers
continue while switching to Exercises, but reset when leaving their slide.

**Facilitator** contains slide notes and the one-page Czech/English guide.
Notes and connection settings are also visible on the projector.
The public PDFs must be regenerated when `workshop-content/runbook.json` changes.
`presentationContent.ts` holds the slide sequence and notes; `SlideContent.tsx`
renders the visuals; `workshop-content/practice-prompts.json` is the source for
copyable exercises. Generated ZIPs and `starterCatalog.json` come from the root
starter folders via `package_starters.py`; edit those folders, not ZIPs.

## Model connection and boundaries

Readers need no API key. A presenter enters their own HTTPS API base, model name
and key in **Facilitator → Model connection**. **Save connection** remembers
all three in `localStorage` by default, including after closing and reopening the
browser in the same profile. Private browsing or clearing site data can remove
them; they do not sync across browsers or devices. The key is sent directly to
the model endpoint, never published in the repository or sent to GitHub.
Same-origin scripts can read this plaintext storage; use a dedicated demo key.
**Forget connection** removes the credentials, also updating other open tabs.
It leaves only a non-secret null marker so an old restored session cannot revive
a forgotten key. Existing session-only connections migrate automatically.
If storage is unavailable, the UI reports memory-only use rather than promising
that the connection will survive a reload.

The browser runs the agent loop and only two allowlisted read tools:
`read_materials` and optional `get_weather`. Open-Meteo receives no model key.
The endpoint must authenticate requests and allow HTTPS/CORS from the hosting
origin. The browser's run limits are demonstration controls, not security quotas
on the inference server. There is no shared anonymous model proxy.

### Debugging a live request

The answer panel shows elapsed waiting time and connection status independently
of diagram playback. Each model request has a 60-second limit; the complete run
has a three-minute limit. Responses arrive as a whole, so an empty answer panel
while waiting does not prove the model is stuck. The timer measures time used,
not model completion progress. There are no automatic retries.

Open **Connection diagnostics** in the answer panel, or filter the browser's
DevTools Console for `[workshop:model]`. Each request logs its start, response
headers, completion or failure, with elapsed time, HTTP status when available,
and the caught exception's name, message and stack with private values redacted.
Diagnostics include the endpoint and model name, but omit credentials, prompts
and response bodies. A provider request ID is included only if CORS exposes it.
The panel can copy these diagnostic details for troubleshooting.

Timeouts, HTTP failures and malformed responses have separate messages. A fetch
network error may still leave JavaScript unable to distinguish CORS, TLS, a
blocked redirect or a lost connection; inspect **Network → chat/completions**
and the browser's own console messages. A cancelled or timed-out browser request
does not guarantee that inference has stopped on the server.

The source keeps two compatibility modules (`SettingsPanel.tsx` and
`settingsStorage.ts`) used by the original local technical portal. They are
excluded from this static build; the staging script rejects bundles containing
the original portal API routes. Always use the provided static-mode commands.

Never commit credentials, `.env`, browser sessions or private model-run exports.
Keep Czech and English copy aligned and preserve the real execution trace:
no fabricated answers or weather. The original eleven technical lessons remain
in the separate local lecture project; this source package is the public workshop.
