# MedOrch

MedOrch is a development-stage healthcare analytics application built around a bundled, de-identified diabetes/readmission dataset. It includes a Next.js dashboard, a Go gRPC gateway, and an optional Python natural-language analytics engine.

> MedOrch is currently a demonstration system. It must not be used for clinical decisions, patient triage, compliance attestation, or financial forecasting.

## Current architecture

```text
Next.js dashboard (:3000)
├── read-only SQLite analytics
└── SSE /api/stream
       └── Go gRPC gateway (:50051)
             └── Python analytics engine (:50052)
                   ├── read-only SQLite queries
                   └── NVIDIA-hosted language model
```

The dashboard works without the optional AI services. AI mode requires a newly issued NVIDIA API key and network access.

## Prerequisites

- Node.js 24 or newer
- Go version declared in `gateway/go.mod`
- Python 3.11 or newer
- The bundled `database/medorch.db`

## Initial setup

### Frontend

```powershell
cd frontend
npm install
```

### Python engine

Windows:

```powershell
cd engine
python -m venv venv
venv\Scripts\python -m pip install -r requirements-dev.txt
```

Linux/macOS:

```bash
cd engine
python -m venv venv
venv/bin/python -m pip install -r requirements-dev.txt
```

## Configuration

Copy `.env.example` to `.env` only when AI mode is needed. Never commit `.env`.

```powershell
Copy-Item .env.example .env
```

Replace the placeholder `NVIDIA_API_KEY` with a newly issued credential. The credential previously committed to this repository must be revoked and must not be reused.

`NEXT_PUBLIC_MEDORCH_DEMO_MODE` (default `false`) controls demonstration mode: screens built on values the dataset cannot support (beds, staff, departments) are hidden unless it is `true`, and are badged "Demonstration data" when shown.

`MEDORCH_DB_PATH` may be absolute or relative to the repository root. Service addresses have local defaults and can be overridden for container or remote deployments.

## Running locally

On Windows:

```powershell
.\start.bat
```

On Linux/macOS:

```bash
./start.sh
```

If no API key is configured, the startup scripts skip the AI engine and run the database-backed dashboard and gateway. Open `http://localhost:3000`.

Both startup scripts also run `scripts/warmup.ps1` / `scripts/warmup.sh` in the background, which loads the local Ollama models into memory so the first question after a restart is not slow (a cold 14B model can take 45+ seconds).

To check that the assistant is demo-ready, run the curated question set against the running stack (about 20 seconds per question on a local 14B model):

```bash
node scripts/smoke/assistant_questions.mjs --repeats 3
```

It reports pass/fail, latency, and whether a written narrative (rather than the terse table caption) appeared for each question in `config/demo_questions.json`. Those same questions are the assistant's suggested prompts, and their reference SQL is validated by the engine tests.

Individual services can also be started from their directories:

```text
frontend: npm run dev
gateway:  go run .
engine:   venv/Scripts/python main.py   (Windows)
```

## Verification

Frontend:

```powershell
cd frontend
npm test
npm run typecheck
npm run build
npm run lint
npm audit
```

Python:

```powershell
engine\venv\Scripts\python -m pytest engine
```

Go:

```powershell
cd gateway
go test ./...
```

Automated tests do not call the external language-model API and do not modify the bundled database.

## Analytics assistant

MedOrch has one analytics assistant at `/assistant`, replacing the earlier set of
cosmetic per-department "agents". It offers a selectable **context**
(General, Clinical, Operations, Predictive; Billing is declared but unavailable
until real billing data exists) sourced from `config/assistant_capabilities.json`
— the single shared source of truth for what each context is allowed to ask,
read by both the Python engine and the frontend. Selecting a context changes
prompt guidance only; it never changes authorization.

The Predictive context surfaces a real, offline-trained early-readmission-risk
classifier (`engine/ml/` — see `engine/ml/README.md`), not an LLM guess: every
encounter has a precomputed `predicted_readmission_risk` score the assistant
can query like any other column. It is a demonstration model (see the model
card on `/predictive` for its held-out metrics with confidence intervals) —
not clinically validated, not a live prediction service, and not the full
model-governance process required for production predictive claims.

Assistant answers include an automatic chart when the verified result has one
categorical and one numeric column (bar) or two numeric columns (scatter); the
chart type is chosen from the result's shape, never by the model. Charts and
research pages carry an "Ask the assistant" button that opens `/assistant` with
an editable, pre-filled question (never auto-sent).

Every answer is produced through a fixed pipeline: a structured query planner
(JSON-schema output, never raw prose SQL extraction) proposes a plan; the plan's
SQL is validated and executed through a read-only SQLite connection with a
SQLite authorizer as a second, independent enforcement layer; results are
either rendered deterministically (counts, simple grouped tables) or
summarized by the model with every number required to cite an actual result
cell (`engine/evidence.py`) — a summary containing an unverifiable number is
rejected rather than shown. Outbound text is inspected for identifier
patterns (`patient_nbr`, `encounter_id`) before it leaves the engine
(`engine/pii_guard.py`), and every request outcome — success, unsupported,
rejected, timeout, or error — writes exactly one record to a separate,
privacy-aware audit database (`engine/audit_log.py`): a SHA-256 hash and a
redacted excerpt of the prompt, never the raw prompt or result rows.

## Analytics pages

| Page | What it shows | Source |
|---|---|---|
| `/predictive` | Model card, ROC/PR/calibration, threshold explorer, SHAP importance, fairness audit, highest-risk encounters with reasons, intervention scenario calculator | `engine/ml/artifacts/*.json`, scored `medorch.db` |
| `/research` | HbA1c replication-style study (CONSORT flow, odds ratios, interaction test), medication patterns, two-cohort statistical comparison | `engine/analysis/artifacts/hba1c_study.json`, read-only queries |
| `/data-quality` | Missingness, repeat patients, outcome balance, definitions, exclusions, lineage | `engine/analysis/artifacts/data_quality.json` |
| `/report` | Printable report assembled from all of the above (Download PDF) | the same artifacts |

To (re)generate the artifacts see the regeneration order in `engine/ml/README.md`.

## Demo script (about 5 minutes)

1. **Data Quality** — 101,766 encounters from 71,518 patients; what is missing (weight 97%, HbA1c not performed in 83%), why those columns were excluded, the two definitions of "readmission", and the lineage from raw file to answer.
2. **Research** — the HbA1c replication-style study: cohort flow, adjusted odds ratios, and an honest statement of how it compares with the published paper (directionally consistent, individually non-significant). Run the cohort comparison (e.g. women vs. men) and read the effect size, not just the p-value.
3. **Predictive** — the model card with confidence intervals; the threshold explorer (why 0.5 catches almost nothing and a validation-chosen cutoff does); SHAP drivers; the fairness table with its suppressed and noise-flagged gaps; click a high-risk row for its reasons; try the scenario calculator (it shows nothing beneficial until you enter an assumption).
4. **Assistant** — click an "Ask the assistant" button, run the pre-filled question, and show the automatic chart, the validated SQL, the model label, and the model switcher.
5. **Report** — open the report and use Download PDF.

## Data behavior

- Population, clinical-quality, and parts of financial/operational analytics query `hospital_readmissions` in SQLite.
- Financial results are configured estimates rather than claims data.
- Several operations, administration, strategy, and platform screens still contain demonstration values.
- `/predictive`, `/research`, `/data-quality` and `/report` show only real values: they are built from saved evaluation artifacts (`engine/ml/artifacts/`, `engine/analysis/artifacts/`) or read-only queries, and display an explicit "needs a generated artifact" notice when one is missing instead of placeholder numbers.
- AI-generated SQL is restricted to one read-only `SELECT` against `hospital_readmissions`, with SQL-length, row, column, and timeout limits, plus a SQLite authorizer denying any table other than `hospital_readmissions`. `patient_nbr` and `encounter_id` may appear only as the argument of `COUNT()` (never selected, grouped, or passed to other functions).
- Unsupported forecasting, billing, staffing, capacity, named-medication, and named-lab requests return a capability-aware limitation message instead of invented results, and execute no SQL.

See [ROADMAP.md](ROADMAP.md) for the delivery plan and production-readiness gates.

## Security notes

- Authentication remains a client-side demonstration and is not a security boundary. Phase 3 (real server-backed auth) is not complete: every assistant request is recorded as `unauthenticated-demo`, and no role supplied by the browser is ever trusted for authorization.
- API routes must not be exposed publicly until server-side authentication is implemented.
- The assistant's identifier protection (`pii_detected` / `pii_redacted` / legacy `pii_scrubbed`) is limited direct-pattern matching on `patient_nbr` and `encounter_id` — it is not comprehensive clinical NER, HIPAA certification, or formal de-identification validation.
- Generated SQL and audit identifiers are never sent to the browser unless `ANALYTICS_DEV_PROVENANCE=true` is explicitly set for local development.
- If this repository has been shared, remove any old credential from Git history after revoking it. Never commit a real key in `.env.example` — only `.env` is gitignored.
