# tw-house-ops — Agent Instructions

This repository is a Taiwan house-hunting assistant driven by Markdown workflows, YAML configuration, and dependency-free Node.js ESM utilities. Respond to the user in Traditional Chinese unless they request another language.

## Choose the task

- **Repository work** (code, tests, documentation, configuration design): work directly on the requested change. Personal profiles, onboarding, browser setup, and live property searches are not prerequisites.
- **House hunting**: read `docs/house-hunting.md`, then the relevant mode below. Read `modes/_shared.md` for evaluations and other modes that reference it; read `config/profile.yml` and `modes/_profile.md` when personal criteria are needed. Only create missing user files as described in onboarding.
- `docs/superpowers/` contains archived design and implementation history. It does not define current instructions or require any external plugin.

## House-hunting routing

These are natural-language requests to the AI agent, not shell commands or slash commands. Load mode files explicitly; they are workflow documents, not automatically discovered skills.

| User intent | Workflow |
|-------------|----------|
| Set up or update house-hunting preferences | Onboarding and user-layer rules in `docs/house-hunting.md` |
| Paste a listing URL | Auto-pipeline in `docs/house-hunting.md`, then rent or buy mode |
| Evaluate a rental | `modes/rent.md` |
| Evaluate a purchase | `modes/buy.md` |
| `affordability` / budget calculation | `modes/afford.md` |
| `upgrade plan` / sell and buy | `modes/switch.md` |
| `compare` listings | `modes/compare.md` |
| `prepare visit` / record a viewing | `modes/visit.md` |
| `scan` portals | `modes/scan.md` |
| `pipeline` / process pending URLs | `modes/pipeline.md` |
| `tracker` / search progress | Summarize `data/tracker.md` |

## Tools and execution

- Use the tools actually available in the current agent session. Read `docs/browser.md` before live browsing; use interactive browser tools or the `agent-browser` CLI as described there. Use available web search for discovery and market research, and cite sources. Search snippets do not verify listing availability.
- Run scans and batch evaluations sequentially in the current session. Save progress in the pipeline, reports, and TSV files and give brief progress updates during long runs. Resume from unchecked entries after an interruption.
- Do not assume background-agent tools or multi-agent features are available. Delegate only when the user explicitly requests it and the session supports it; keep report numbering and all tracker/pipeline writes coordinated by one writer.
- Respect the session's sandbox, network, and approval settings. If access is blocked, report the limitation and use the normal approval flow when needed. Never fabricate fetched content, completed commands, or property data.

## Data integrity

- Preserve user files: `config/profile.yml`, `portals.yml`, `modes/_profile.md`, `data/*`, `reports/*`, and `output/*`. Never reset these from templates during maintenance or onboarding. Update personal criteria in the user files rather than shared modes.
- New tracker entries must go through an 11-column TSV in `batch/tracker-additions/` and `node merge-tracker.mjs`. Only status and notes of existing rows may be edited directly. Canonical statuses are in `templates/states.yml`.
- After a batch, merge pending TSVs and run `node verify-pipeline.mjs`. Only mark an evaluation complete after its report and tracker entry are saved. If a command fails, report it and preserve pending work for recovery.
- Prepare drafts and viewing plans freely; sending an offer, application, or contract requires the user's review and explicit approval.

## Development and validation

Node.js 22+ is recommended; the utilities use built-in modules and need no npm dependencies.

```bash
npm test                       # Existing utility tests
node verify-pipeline.mjs        # Read-only report/tracker integrity check
```

`node merge-tracker.mjs` and `node dedup-tracker.mjs` modify user data; run them only as part of requested tracker maintenance or evaluation work. For documentation-only changes, check references and instruction consistency. Do not start onboarding or generate personal data as a development smoke test.
