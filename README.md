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
can query like any other column. It is a demonstration model (held-out
ROC-AUC ≈ 0.66) — not clinically validated, not a live prediction service, and
not the full model-governance process Phase 5 requires for production
predictive claims.

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

## Data behavior

- Population, clinical-quality, and parts of financial/operational analytics query `hospital_readmissions` in SQLite.
- Financial results are configured estimates rather than claims data.
- Several operations, administration, strategy, platform, and predictive screens still contain demonstration values.
- Prediction screens currently use heuristic rules, not trained clinical models.
- AI-generated SQL is restricted to one read-only `SELECT` against `hospital_readmissions`, with SQL-length, row, column, and timeout limits, plus a SQLite authorizer denying any table other than `hospital_readmissions` and any reference to `patient_nbr` or `encounter_id`.
- Unsupported forecasting, billing, staffing, capacity, named-medication, and named-lab requests return a capability-aware limitation message instead of invented results, and execute no SQL.

See [ROADMAP.md](ROADMAP.md) for the delivery plan and production-readiness gates.

## Security notes

- Authentication remains a client-side demonstration and is not a security boundary. Phase 3 (real server-backed auth) is not complete: every assistant request is recorded as `unauthenticated-demo`, and no role supplied by the browser is ever trusted for authorization.
- API routes must not be exposed publicly until server-side authentication is implemented.
- The assistant's identifier protection (`pii_detected` / `pii_redacted` / legacy `pii_scrubbed`) is limited direct-pattern matching on `patient_nbr` and `encounter_id` — it is not comprehensive clinical NER, HIPAA certification, or formal de-identification validation.
- Generated SQL and audit identifiers are never sent to the browser unless `ANALYTICS_DEV_PROVENANCE=true` is explicitly set for local development.
- If this repository has been shared, remove any old credential from Git history after revoking it. Never commit a real key in `.env.example` — only `.env` is gitignored.
