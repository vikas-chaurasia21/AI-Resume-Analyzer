# AI Resume Analyzer

Upload a resume (PDF, DOCX or TXT) and get the most likely job role, a role-specific ATS score, and AI-written feedback.

The **ATS score is deterministic and explainable** (keyword, section and action-word coverage). **Gemini** is used only for semantic work: role detection and written career feedback. The two are deliberately separate, so the score never depends on an AI's subjective opinion.

## Features

- Resume upload with in-browser text extraction (PDF.js, Mammoth, plain text)
- AI role detection with an **AI-estimated** confidence, confidence level and alternative roles
- Curated role profiles (Software Engineer, Frontend Developer, Backend Developer, Data Analyst, Electrical Engineer) with an AI-generated fallback profile for any other role
- Deterministic ATS score: skills, sections, action words, plus found/missing lists for each
- AI feedback: summary, strengths, weaknesses, suggestions, best role fit
- Downloadable text report
- Gemini retry with model fallback (`gemini-2.5-flash` → `gemini-2.0-flash` → `gemini-1.5-flash`)

## Architecture

```
Browser (Vanilla JS, ES modules)
   │  POST /api/analyze-resume   POST /api/analyze-ai
   ▼
Routes ──► Middleware ──► Controllers ──► Services ──► Profiles / Utils / Config
          (CORS, rate      (HTTP only)    (business     (roleProfile, retry,
           limit, validate)               logic)        jsonParser, logger)
                                              │
                                              ▼
                                       geminiService ──► Google Gemini
```

| Layer | Responsibility |
|---|---|
| `routes/` | Declare endpoints and attach middleware and a controller. Nothing else. |
| `middleware/` | CORS, rate limiting, request validation, centralized error handling. |
| `controllers/` | Translate HTTP request/response. No prompts, no scoring. |
| `services/` | All business logic (see below). |
| `profiles/` | Deterministic role data and role-name matching. |
| `config/` | Environment variables, constants, Gemini client setup. |
| `utils/` | Retry, JSON parsing, logging, `AppError`, helpers. |

Services:

- `geminiService`: the only code that talks to Gemini. Handles model choice, retry, model fallback and error mapping.
- `roleDetectionService`: role prompt, JSON parsing, validation, confidence normalization.
- `atsService`: pure deterministic scoring.
- `resumeAnalysisService`: orchestrates role detection → profile selection → ATS.
- `aiFeedbackService`: feedback prompt and call.

Business logic has no Vercel-specific code. `api/index.js` is a one-line adapter that exports the same Express app used locally.

## Folder structure

```
.
├── backend/
│   ├── api/index.js              # Vercel adapter
│   ├── config/                   # env.js, constants.js, gemini.js
│   ├── controllers/              # aiController, roleController, resumeController
│   ├── middleware/               # cors, rateLimiter, validation, errorHandler
│   ├── profiles/roleProfile.js   # curated roles + aliases + term aliases
│   ├── routes/                   # aiRoutes, roleRoutes, resumeRoutes
│   ├── services/                 # gemini, roleDetection, ats, resumeAnalysis, aiFeedback
│   ├── utils/                    # retry, jsonParser, logger, helpers, AppError
│   ├── validators/resumeValidator.js
│   ├── tests/                    # node:test unit tests
│   ├── index.js                  # builds the Express app
│   ├── server.js                 # local entrypoint (listen)
│   ├── vercel.json
│   └── .env.example
└── frontend/
    ├── index.html
    ├── css/                      # style.css (base), components.css
    ├── js/
    │   ├── main.js               # orchestrates the flow
    │   ├── api/                  # httpClient, analyzeApi, aiApi
    │   ├── services/             # resumeExtractor, atsInsights, reportGenerator
    │   ├── components/           # resumeUpload, roleResult, atsResult, aiFeedback
    │   └── utils/                # dom (safe HTML), formatters, constants
    └── vercel.json
```

## Tech stack

Node.js ≥ 20, Express 5, `@google/generative-ai`, `express-rate-limit`, `cors`, `dotenv`. Frontend: Vanilla HTML/CSS/JavaScript (native ES modules, no build step), PDF.js, Mammoth. Hosting: Vercel.

## API

All responses use one envelope.

```jsonc
// success
{ "success": true, "data": { ... } }
// error
{ "success": false, "error": { "message": "...", "code": "..." } }
```

All analysis endpoints are `POST` with body `{ "resumeText": "..." }` (20–30,000 characters). Other methods return `405`.

| Endpoint | Purpose | `data` |
|---|---|---|
| `POST /api/analyze-resume` | Full pipeline: role → profile → ATS | `detectedRole, normalizedRole, confidence, confidenceLevel, confidenceType, alternativeRoles, reason, roleProfileFound, profileSource, roleProfile, roleKeywords, ats` |
| `POST /api/analyze-role` | Role detection only | `detectedRole, confidence, confidenceLevel, confidenceType, alternativeRoles, reason, skills, importantSections, actionWords, atsKeywords` |
| `POST /api/analyze-ai` | AI feedback. Optional `detectedRole` adds context | `{ aiFeedback }` |
| `GET /api/health` | Liveness check | `{ status: "ok" }` |

`ats` contains `atsScore, skillScore, sectionScore, actionScore, foundSkills, missingSkills, foundSections, missingSections, foundActionWords, missingActionWords`.

Common error codes: `INVALID_REQUEST`, `MISSING_RESUME_TEXT`, `RESUME_TOO_SHORT`, `RESUME_TOO_LONG` (400/413), `RATE_LIMITED` (429), `AI_RATE_LIMITED` (429), `AI_UNAVAILABLE` (503), `AI_UPSTREAM_ERROR` / `AI_INVALID_JSON` / `AI_INVALID_ROLE_RESPONSE` (502), `INTERNAL_ERROR` (500).

## Local setup

```bash
# Backend
cd backend
npm install
cp .env.example .env        # then put your own GEMINI_API_KEY in .env
npm run dev                 # http://localhost:5000
npm test

# Frontend (must be served over http, ES modules do not work from file://)
cd ../frontend
npx serve .                 # or VS Code "Live Server"
```

The frontend automatically uses `http://localhost:5000` when opened on `localhost`.

## Environment variables (backend)

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | yes | Google AI Studio key. Server-side only. |
| `ALLOWED_ORIGINS` | yes in production | Comma-separated browser origins allowed by CORS, e.g. `https://my-frontend.vercel.app`. |
| `PORT` | no | Local port (default 5000). |
| `LOG_LEVEL` | no | `error`, `warn`, `info`, `debug`. |
| `GEMINI_MODELS` | no | Comma-separated fallback chain override. |
| `RATE_LIMIT_MAX` | no | Requests per window per IP on `/api` (default 100). |
| `AI_RATE_LIMIT_MAX` | no | Requests per window per IP on Gemini-backed routes (default 30). |
| `RATE_LIMIT_WINDOW_MS` | no | Window length (default 15 minutes). |

Never commit `.env`. Never put the key in frontend code.

## Vercel deployment

Two Vercel projects, one repository:

1. **Backend**: Import the repo, set *Root Directory* to `backend`. Add `GEMINI_API_KEY` and `ALLOWED_ORIGINS` (your frontend's URL, no trailing slash) under Environment Variables. Deploy. All `/api/*` requests are routed to the single Express function in `api/index.js`.
2. **Frontend**: Import the same repo, set *Root Directory* to `frontend`, framework preset *Other*. No build command.
3. If your backend URL differs from the one in `frontend/js/utils/constants.js` (`API_BASE_URL`), update it and redeploy the frontend.

## Application flow

```
Upload resume
  → extract text in the browser (PDF.js / Mammoth / text)
  → POST /api/analyze-resume
       detect most likely role (Gemini) + AI-estimated confidence
       → select role profile (curated, else AI-generated)
       → deterministic role-specific ATS
  → POST /api/analyze-ai  (Gemini feedback)
  → render results → optional report download
```

The role and ATS results are shown as soon as they are ready; AI feedback fills in afterwards, and a failure there never hides the rest.

## ATS scoring methodology

```
ATS score = skills coverage × 50 + sections coverage × 30 + action-word coverage × 20
```

Coverage = terms found ÷ terms in the role profile. Each sub-score is rounded for display; the total is rounded once from the unrounded parts.

Matching is case-insensitive and **whole-word**, so `OS` does not match "projects" and `Java` does not match "JavaScript". A small alias table in `profiles/roleProfile.js` handles real equivalents (`SQL` ↔ MySQL/PostgreSQL, `Node` ↔ NodeJS, `OS` ↔ "Operating Systems", "Project" ↔ `Projects`, …). The ATS service never calls an AI.

## AI role detection

Gemini receives the resume and returns JSON: role, confidence, alternatives, reason and role-relevant skills/sections/action words/keywords. The backend parses it tolerantly (code fences, stray text), validates it, clamps confidence to 0–100, and **computes the confidence level itself** (≥90 Very High, ≥75 High, ≥60 Moderate, else Low).

Confidence is the model's own estimate from evidence in the resume. It is not a calibrated or mathematically verified probability, and the UI says so.

If the detected role matches a curated profile (or alias), that profile is used. Otherwise a profile is built from the AI's output; scores for those roles are less objective because the keywords come from the same AI, and the UI flags this.

**Adding a role:** add one entry to `roleProfiles` in `backend/profiles/roleProfile.js` (`aliases`, `skills`, `sections`, `actionWords`, `keywords`). No other change is needed.

## Security considerations

- The Gemini key exists only in server environment variables.
- CORS allow-list via `ALLOWED_ORIGINS` (production denies browser origins that are not listed).
- Body size limit (200 KB), type and length validation, control-character sanitization.
- Rate limiting: general and stricter for Gemini-backed routes. Counters are in memory, so on serverless they are per instance; use a shared store such as Redis for strict limits.
- Prompts wrap the resume in delimiters and tell the model to treat it as data (reduces, but cannot eliminate, prompt injection). AI output is validated and length-limited before use.
- Errors are centralized and sanitized: no stack traces, raw Gemini messages or raw AI output reach clients. Details are logged server-side.
- Resume text is never logged (only lengths).
- The frontend escapes all dynamic values before inserting them into the page.

## Future improvements

- Shared rate-limit store (Redis/Upstash) and optional caching of repeated analyses
- More curated roles (Full Stack, Data Scientist, ML/AI, DevOps, Cloud, QA, Product Manager, …)
- Subresource Integrity hashes and a Content-Security-Policy for the frontend
- Server-side OCR for scanned PDFs
- End-to-end tests (HTTP and browser) and CI
- Optional TypeScript migration
