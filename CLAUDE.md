# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

This repository contains a single project: `arch-review-backend/` — an ecommerce architecture review tool. It fetches a target website, fingerprints its tech stack from HTML/headers, pulls Google PageSpeed/CrUX data, then runs a four-stage AI pipeline (Intake → Platform → Ecosystem → Report) via the Anthropic API to produce a structured review.

## Commands

All commands are run from inside `arch-review-backend/`.

### Run both servers (recommended for dev)
```bash
npm run dev
```
This uses `concurrently` to start the FastAPI backend (port 8000) and the Vite dev server simultaneously. Logs are colour-coded `[API]` / `[UI]`.

### Backend only
```bash
# First-time setup
python -m venv venv && pip install -r requirements.txt

# Start
./venv/bin/uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend only
```bash
cd frontend
npm install
npm run dev     # dev server (HMR)
npm run build   # production bundle → frontend/dist/
npm run lint    # ESLint
```

### Environment variables
Copy `.env.example` → `.env` in `arch-review-backend/` and fill in:
- `ANTHROPIC_API_KEY` — required for the `/analyze` endpoint (AI pipeline stages)
- `PAGESPEED_API_KEY` — required for Core Web Vitals data; without it every stage returns `{"error": "PAGESPEED_API_KEY not set"}`

The frontend reads `VITE_API_BASE` (defaults to `http://localhost:8000`). In GitHub Codespaces set this to the forwarded port 8000 URL via `frontend/.env`.

## Architecture

### Backend (`main.py`)

A single-file FastAPI app with three endpoints:

| Endpoint | Purpose |
|---|---|
| `GET /health` | Liveness check; shows whether `PAGESPEED_KEY` is set |
| `POST /research` | Fetches the target URL, runs regex fingerprinting against `SIGNATURES`, calls PageSpeed API for mobile + desktop in parallel, returns combined JSON |
| `POST /analyze` | Thin proxy to `https://api.anthropic.com/v1/messages` using `claude-sonnet-4-6`. Accepts `{ system, user }` strings and returns `{ text }` |

The `SIGNATURES` list in `main.py` is the sole source of tech-detection patterns. Each entry has `category`, `tech`, `confidence`, and a list of regex `patterns` matched against URL + response headers + up to 600 KB of HTML. The first matching pattern wins; detection stops per-signature.

### Frontend (`frontend/src/`)

A React 19 single-page app with no router. State is held in `App.jsx` via `useState`; there is no global state library.

**Stage flow** (`STAGE` enum in `App.jsx`):
```
0. Research  → POST /research   → raw evidence pack
1. Intake    → POST /analyze    → { client_name, confirmed_platform, pain_points, ... }
2. Platform  → POST /analyze    → { maturity_score, strengths, risks, ... }
3. Ecosystem → POST /analyze    → { components, strategic_gaps, quick_wins, ... }
4. Report    → POST /analyze    → { headline, executive_summary, key_findings, recommended_actions, ... }
```

Each analysis stage passes the accumulated data from prior stages forward as context. The user can edit the pre-built prompt in a textarea before triggering the agent call.

**Key files:**
- `src/prompts.js` — all system prompts and `buildEvidenceSummary()`. The `CONFIDENCE_RULE` constant is injected into every system prompt; every JSON field in the AI response must carry a `confidence` + `rationale`.
- `src/api.js` — `researchSite()`, `analyze()`, and `parseJSON()`. `parseJSON` strips markdown fences and trailing commas before parsing Claude's raw text response.
- `src/components/AgentStage.jsx` — generic stage component; renders an editable textarea, calls `analyze()`, parses JSON, renders the typed result via `RenderResult`, and exposes "Accept & continue" / "Re-run" actions.
- `src/components/EvidencePack.jsx` — displays tech detections (grouped by category) and a CWV table with field/lab data. Detects field/lab gap (fast field LCP but poor Lighthouse score) and surfaces a warning.
- `src/components/ExportReport.jsx` — `buildMarkdown()` assembles all stage outputs into a single Markdown document and triggers a browser download.

### Data contract

The backend's `/research` response shape (consumed by `buildEvidenceSummary` and rendered by `EvidencePack`):
```json
{
  "requested_url": "...",
  "final_url": "...",
  "http_status": 200,
  "fetch_block_note": null,
  "server_header": "...",
  "tech_detections": [{ "category", "technology", "confidence", "evidence", "match_count", "rationale" }],
  "tech_detection_note": "...",
  "core_web_vitals": {
    "mobile": { "strategy", "field_data": { "LCP", "INP", "CLS", "FCP", "TTFB", "overall_category" }, "lab_data": { "performance_score", "LCP", "TBT", "CLS", "FCP", "speed_index" } },
    "desktop": { ... }
  }
}
```

Each AI stage returns plain JSON (no markdown fences) matching the schema defined in its system prompt in `prompts.js`. `parseJSON` in `api.js` is the single place that handles fence-stripping and trailing-comma cleanup.

## Conventions

- **Confidence-first**: Every finding, score, or claim in AI output must carry `"confidence": "high"|"medium"|"low"` and a `"rationale"`. The `CONFIDENCE_RULE` string in `prompts.js` enforces this via system prompt injection.
- **No test suite** — there are no tests in this project.
- **Styling**: Tailwind CSS utility classes only; no CSS modules or styled-components.
- **No TypeScript** — the frontend is plain JSX.
- **Model**: The backend hardcodes `claude-sonnet-4-6` in the `/analyze` endpoint. Change the `"model"` field in `main.py:payload` to switch models.
