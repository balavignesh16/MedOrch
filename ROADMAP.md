# MedOrch Delivery Roadmap

Last updated: 2026-10-10

## Current implementation status

The Sprint 1 implementation is complete in the working tree: secure configuration,
guarded read-only SQL execution, a successful Next.js production build, typed data
boundaries, deterministic frontend/Python/Go tests, checked startup scripts, CI,
dependency remediation, and visible demo labeling are implemented. ESLint and the
standalone TypeScript check both pass with zero errors and zero warnings.

Release remains blocked on two repository-owner actions: revoke the exposed NVIDIA
credential and clean the shared Git history. The history-aware Gitleaks scan correctly
finds three historical credential occurrences and will keep CI red until that cleanup
is performed. Vitest and the Node development baseline were upgraded so the complete
frontend dependency audit now reports zero known vulnerabilities.

Sprint 2 is complete in the working tree. Core encounter, readmission-proxy, and LOS metrics now have deterministic SQL tests and a documented catalog. Encounter-versus-patient terminology is corrected on supported population and quality surfaces; filters have an explicit allowlist; fabricated modulo-month charts were replaced by non-temporal source distributions; financial and operational estimates are centrally documented and visibly labelled; and the shared encounter-risk rule is consistently applied. Predictive, administration, strategy, authentication, and AI-governance work remains in later roadmap phases.

Phase 4 (Safe and truthful AI analytics) is implemented in the working tree, ahead of Phase 3 (authentication), which is intentionally still outstanding — see the note below. The six cosmetic per-department agents are replaced by one assistant at `/assistant` with a selectable context (General, Clinical, Operations; Billing is declared in `config/assistant_capabilities.json` but marked unavailable). Query planning uses structured JSON output validated with Pydantic, never regex extraction of prose. Generated SQL is validated (`engine/sql_guard.py`) and additionally enforced at execution time by a SQLite authorizer callback, then executed read-only with row/column/length/timeout limits. Answers are either rendered deterministically from result cells or synthesized with every number required to cite an actual row/column (`engine/evidence.py`); ungrounded answers are rejected rather than shown. Outbound text is inspected for `patient_nbr`/`encounter_id` patterns before leaving the engine (`engine/pii_guard.py`). Every request outcome writes exactly one record to a separate, privacy-aware audit database (`engine/audit_log.py`) — a prompt hash and redacted excerpt only, never raw prompts or result rows. Because Phase 3 is not complete, every request is still recorded as `requester_type=unauthenticated-demo` and no browser-supplied role is trusted; this is documented in the README's security notes, not hidden.

Analytics rigour (a focused slice of Phase 5, driven by the Healthcare & Data Analytics coursework) is implemented in the working tree. The predictive model was rebuilt with a documented methodology: death/hospice discharges excluded from the cohort, a patient-grouped train/validation/test split, Strack-style ICD-9 diagnosis groups and derived features, calibrated logistic regression / random forest / LightGBM candidates selected on validation data only, and decision thresholds chosen on validation (max-F1 and top-10% capacity) and reported on a once-used test set with bootstrap 95% intervals. Offline scripts add SHAP explanations (global and per-encounter), a subgroup fairness audit that suppresses small groups and flags gaps whose intervals overlap, an HbA1c replication-style study (CONSORT flow, adjusted odds ratios, interaction test, an honest comparison with the published paper), and a data-quality profile with lineage. The fabricated predictive screens (hardcoded 94.2% accuracy, invented patients, forecast and interventions) were replaced by `/predictive`, `/research`, `/data-quality` and `/report`, which render only saved artifacts or read-only queries and show an explicit notice when an artifact is missing. The assistant gained automatic result-shaped charts, pre-filled "ask about this chart" links, rounding-aware evidence grounding, and a schema description that now lists the available SQL functions and drug columns. Still outstanding from Phase 5: operations, administration, strategy and platform modules still contain demonstration values; model governance (drift monitoring, approval, rollback) is not implemented. See `engine/ml/README.md` for the regeneration order.

## Objective

Move MedOrch from a local analytics demonstration to a trustworthy, testable healthcare analytics application. The roadmap prioritizes security, correctness, and deployability before new features.

## Product boundaries

Until the Production Readiness milestone is complete, MedOrch must be described as a development/demo system using bundled de-identified and synthetic data. It must not be used for clinical decisions, patient triage, compliance attestation, or financial forecasting.

## Success criteria

The first production candidate is ready when:

- No credentials or secrets are committed to the repository.
- A clean checkout passes lint, type-check, unit tests, integration tests, and production build.
- Authentication and role authorization are enforced on the server and on API routes.
- Every displayed metric is classified as observed, derived, predicted, or demonstration data.
- No AI response invents clinical, operational, or financial results.
- The application can be started reproducibly with one documented local command and one supported container deployment path.
- Dataset lineage, metric definitions, limitations, and model behavior are documented.

## Phase 0 — Security containment

Target: Day 1

### Deliverables

- Revoke the exposed NVIDIA API key.
- Remove hardcoded credentials from `engine/main.py` and `engine/test_agent.py`.
- Load secrets from environment variables and provide a safe `.env.example`.
- Review Git history for exposed credentials and clean it if the repository has been shared.
- Remove hardcoded database passwords from the default production configuration.
- Add startup validation that fails clearly when required configuration is missing.

### Exit criteria

- Secret scanning finds no committed credentials.
- The engine starts with environment-provided configuration.
- Missing configuration produces a safe, actionable error.

## Phase 1 — Establish a green engineering baseline

Target: Week 1

### Deliverables

- Fix the Next.js 16 route signature for `/api/patients/[id]`.
- Fix all build-blocking TypeScript errors.
- Reduce ESLint to zero errors; separately track non-blocking warnings.
- Remove or repair unused legacy paths such as `src/app/actions.ts` and the unused dashboard clients.
- Add consistent error responses and request validation to API routes.
- Add root-level developer documentation for prerequisites, setup, data initialization, and service startup.
- Replace `start.bat`/`start.sh` assumptions with checked startup scripts that report missing tools and failed services.

### Required checks

```text
npm run lint
npm run build
go test ./...
python -m pytest
```

### Exit criteria

- All required checks pass from a clean checkout.
- `/api/patients/1` returns the expected record.
- Every primary page loads without server or browser-console errors.

## Phase 2 — Data truth and analytics correctness

Target: Weeks 2–3

### Deliverables

- Choose one supported application database for the first release. Recommended: keep SQLite for local development, then add PostgreSQL only when ingestion and deployment require it.
- Document the two current schemas and decide whether the synthetic patient tables remain supported.
- Rename encounter counts currently presented as patient counts.
- Replace `encounter_id % 12` charts with either a valid time field or an explicit non-temporal distribution.
- Create a metric catalog covering definitions, units, formulas, filters, source columns, and limitations.
- Label calculated cost values as estimates and move multipliers into documented configuration.
- Make risk thresholds consistent across population, quality, and predictive modules.
- Add SQL fixture tests for filters, cohort counts, readmission rates, LOS, risk groups, and financial calculations.

### Exit criteria

- Dashboard numbers have reproducible SQL tests.
- The same metric has the same definition everywhere.
- No chart implies dates, live feeds, or real-time status that the source data does not provide.

## Phase 3 — Real authentication and authorization

Status: implemented as demonstration-grade server-side auth (Phase 6 M8). SSO/MFA remain future work.

Target: Weeks 3–4

### Deliverables

- Replace `localStorage` role selection with a server-backed session.
- Add authenticated user identities and secure password or SSO integration.
- Enforce roles in middleware, server actions, route handlers, and AI requests.
- Remove the hardcoded `user_role: "admin"` value.
- Define access rules for patient-level data, exports, financial data, configuration, and audit logs.
- Record authenticated access to sensitive routes.
- Add authorization tests for administrator, physician, billing, and unauthenticated users.

### Exit criteria

- Direct URL/API access cannot bypass role restrictions.
- Client-supplied roles are never trusted.
- Sensitive access is attributable to an authenticated user.

## Phase 4 — Safe and truthful AI analytics

Target: Weeks 4–6

### Deliverables

- Delete the instruction to invent exact forecasts and financial effects.
- Return an explicit unsupported/insufficient-data result for questions the dataset cannot answer.
- Replace regex-only SQL extraction with constrained structured output.
- Execute AI-generated SQL through a read-only database connection with table, statement, row, and timeout limits.
- Validate requested agent capabilities against the data actually available.
- Either implement real agent specialization or present one analytics assistant with selectable contexts.
- Remove predefined prompts that query unavailable department, lab-name, or medication-name data.
- Implement real PII inspection before setting `pii_scrubbed=true`.
- Store prompt, generated query, execution status, model version, and response provenance in an audit record.
- Add adversarial tests for prompt injection, unrelated requests, data exfiltration, invalid SQL, timeouts, and hallucination behavior.

### Exit criteria

- The assistant never fabricates database results.
- Every numerical answer is traceable to returned query data or explicitly labelled as a configured estimate.
- Unsupported questions fail safely.
- AI access respects the authenticated user's permissions.

## Phase 5 — Replace demonstration modules

Target: Weeks 6–8

Work through modules in this order:

1. Operations
2. Administration
3. Predictive analytics
4. Strategy and executive home
5. Platform governance features

For each module:

- Inventory every displayed value.
- Classify it as observed, derived, predicted, configured target, or demo-only.
- Connect it to a source or remove it from the release.
- Add empty, loading, stale-data, and unavailable states.
- Add formula and component tests.

Predictive analytics requires a separate model-governance gate: training data, validation design, calibration, subgroup evaluation, versioning, drift monitoring, approval, and rollback must be real before accuracy or confidence claims are displayed.

### Exit criteria

- No production page contains unexplained hardcoded operational claims.
- Demo-only screens are hidden behind an explicit demo mode.

## Phase 6 — Deployment and observability

Target: Weeks 8–9

### Deliverables

- Add Gateway and Engine Dockerfiles.
- Use Compose service DNS names instead of `localhost` inside containers.
- Make protobuf and database assets available inside the correct images.
- Add health/readiness endpoints for all services.
- Add structured logs, request correlation IDs, timeouts, graceful shutdown, and basic metrics.
- Pin supported Node, Go, Python, and dependency versions.
- Add CI for lint, build, tests, secret scanning, dependency scanning, and container builds.
- Document backup, restore, migration, and rollback procedures.

### Exit criteria

- `docker compose up --build` produces a working stack from a clean checkout.
- Health checks detect unavailable dependencies.
- CI blocks broken builds and leaked credentials.

## Phase 7 — Production-readiness review

Target: Week 10+

### Deliverables

- Threat model and security review.
- Privacy/data-retention review.
- Accessibility and browser testing.
- Performance and concurrency testing.
- Clinical-safety review for any patient-facing or care-impacting feature.
- Recovery and failure-mode exercises.
- Final documentation and operator runbook.

### Exit criteria

- Known risks have owners and documented mitigations.
- Release scope and unsupported use cases are explicit.
- Product, engineering, security, and clinical stakeholders approve the release boundary.

## Recommended Sprint 1 backlog

Sprint goal: secure the repository and produce a reproducible green build without changing product behavior.

1. Revoke and externalize the NVIDIA credential.
2. Add `.env.example` and configuration validation.
3. Fix the dynamic patient route and add an API test.
4. Resolve production-build failures.
5. Establish the test framework for frontend and Python.
6. Add tests for database availability and core readmission metrics.
7. Triage ESLint findings into correctness fixes and typing cleanup.
8. Rewrite the root README with architecture and startup instructions.
9. Add CI for build, tests, lint, and secret scanning.
10. Add visible “Demo / de-identified bundled data” labeling.

## Backlog rules

- A feature is not complete without tests, source attribution, failure states, and documentation.
- Never label a fixed value as live, predicted, monitored, or compliant.
- Never expose a clinical or financial number without its definition and source.
- Security and data-correctness defects take priority over new dashboards.
- Each sprint should leave the main branch buildable and runnable.

## Suggested ownership

| Workstream | Primary owner | Required reviewer |
|---|---|---|
| Frontend and accessibility | Frontend engineer | Product/design |
| Analytics and data definitions | Data engineer | Clinical/operations subject-matter expert |
| AI query service | Backend/AI engineer | Security and data engineering |
| Authentication and audit | Backend engineer | Security |
| Deployment and CI | Platform engineer | Backend/frontend owners |
| Predictive models | Data scientist | Clinical safety/model governance |

## Decision log to create before Phase 2

- Intended users and supported workflows.
- Whether MedOrch is a demonstration, internal analytics tool, or regulated clinical product.
- SQLite versus PostgreSQL release architecture.
- Whether the legacy synthetic patient schema remains.
- Which modules are in the first release.
- Whether AI is required for the first release or can follow a deterministic analytics release.
