# MedOrch Phase 6 Roadmap: Truth Sweep, Demo Readiness, and Polish

**Goal:** by presentation day, every number on every page is either real (computed from the dataset or a saved artifact), or visibly labelled as a demonstration. The demo must also run reliably on the presentation machine.

Phase 5 made `/predictive`, `/research`, `/data-quality`, `/report` and `/assistant` trustworthy. The rest of the application still contains invented numbers, and one fake number found by an examiner undermines trust in all the real ones.

Work the milestones **in order**. Each one ends with: all tests green, the affected pages checked in a browser, and a commit.

---

## 0. Audit: what is still not real (verified 2026-10-10)

| Area | Files | Status | What's wrong |
|---|---|---|---|
| **Administration** (`/administration`) | `lib/administrationLogic.ts`, `components/administration/*` | **100% hardcoded** | Invented departments (DEP-001 Emergency…), beds (500 total, 460 allocated), staffing efficiency 82, compliance 96%, 142 missing documents. **The dataset has no departments, beds, staff, or compliance data.** |
| **Strategy** (`/strategy`) | `lib/strategyLogic.ts`, `components/strategy/*` | **100% hardcoded** | Domain scores (clinical 82, financial 78…), "Readmission Rate 15.2%" (the real any-readmission rate is 46.1%, and the 30-day rate is 11.2%), "Forecast Accuracy 92" (no forecast exists), invented initiatives with ROI "3.2x". |
| **Operations** (`/operations`) | `lib/operationalLogic.ts`, `components/operations/*` | **Mixed** | Some counts come from SQL, but patient-flow stages, wait times ("45m", "2.5h"), resource utilisation (Beds 88%), bed capacity (450 current, 520 estimated), trends ("+4%") and insight confidence (94) are invented. A comment literally says "Synthetic aggregations for demo purposes". |
| **Platform / Home** (`/`) | `components/platform/*` (notification-center, system-health, activity-timeline, audit-center…) | **Mostly hardcoded (to verify)** | Likely invented notifications, uptime and activity. |
| **Header** | `components/dashboard/dashboard-header.tsx` | **Fake** | "Seattle General" hospital name, plus a green "live" pulse. |
| **Quality** (`/quality`) | header | Cosmetic | "SPRINT 4" label left in the page title. |
| **Financial** (`/financial`) | `lib/financialLogic.ts`, `lib/analytics/config.ts` | Labelled estimates | Costs come from documented multipliers (`BASE_ENCOUNTER: 100`, `LOS_PER_DAY: 25`). Acceptable **only if** every value is visibly labelled "estimate, not claims data". |
| **Population / Quality** | `lib/populationLogic.ts`, `lib/qualityLogic.ts`, `lib/kpiLogic.ts` | Mostly real | SQL-backed. Composite scores use configured weights (`analytics/config.ts`), which need a visible "how this score is computed" note. |

**What the dataset can and cannot support.** It has encounters, demographics, admission type and source, discharge disposition, length of stay, lab and procedure counts, prior visits, diagnoses, medications, HbA1c and glucose results, and readmission. It has **no** dates, departments, beds, staff, costs, wait times, or hospital names. Anything requiring those must be removed or labelled as a demonstration.

---

## Milestone 1: Decide each module's fate (30 minutes, a decision, not code)

Recommended decisions, which the rest of this plan assumes:

| Module | Decision | Reason |
|---|---|---|
| Operations | **Rebuild on real proxies** | Admission type/source, discharge disposition, length of stay, procedures, labs and prior visits are all real, operationally meaningful fields. |
| Strategy | **Rebuild as an "Executive Evidence Summary"** | An executive view is valuable, but it must summarise real findings rather than invent scores and ROI. |
| Administration | **Move to Demo mode** (hidden by default, clearly labelled when shown) | Nothing about departments, beds or staff exists in the data, so it cannot be made real. |
| Platform/Home widgets | **Keep real items, move fakes to Demo mode** | Same principle. |
| Financial | **Keep, strengthen labelling** | It is already transparent about its formulas. |

---

## Milestone 2: Demo-mode infrastructure (half a day)

So that nothing invented is visible unless someone deliberately turns it on.

1. `frontend/src/lib/demoMode.ts`: `isDemoModeEnabled()` reads `NEXT_PUBLIC_MEDORCH_DEMO_MODE` (default `false`).
2. `components/ui/DemoBadge.tsx`: an amber "DEMONSTRATION DATA — not from the dataset" badge with a tooltip explaining why.
3. `components/ui/DemoGate.tsx`: wraps a fabricated widget. When demo mode is off, it renders a short card ("This widget needs data the dataset does not contain: …"). When it is on, it renders the widget with the badge.
4. Sidebar: hide **Administration** when demo mode is off. Show "(demo)" after its name when on.
5. Tests: a vitest for `isDemoModeEnabled`, and a test that the sidebar link list excludes Administration by default (extract the link list into a pure function so it can be tested).
6. Document the flag in `.env.example` and the README.

**Acceptance:** with the flag off, `/administration` shows a single explanation card, not invented numbers; the sidebar hides it.

---

## Milestone 3: Rebuild Operations on real data (1–1½ days)

Replace `lib/operationalLogic.ts` with SQL-backed functions (parameterised, read-only, using `getDb()`). Each widget states its source.

| New widget | Computation (all from `hospital_readmissions`) |
|---|---|
| **Admission mix** | Counts and percentages by `admission_type_id` and `admission_source_id`, labelled with `IDs_mapping.csv` (add a small TS loader, or emit labels from `engine/analysis/data_quality.py`). |
| **Length-of-stay profile** | Distribution of `time_in_hospital` (1–14 days), mean/median/p90, and LOS by admission type. |
| **Discharge destinations** | Counts by `discharge_disposition_id` (labelled), and 30-day readmission rate by destination with Wilson CIs. Reuse `wilsonInterval` from `lib/analytics/inference.ts`. |
| **Resource intensity** | Mean labs, procedures and medications per encounter, by admission type and LOS band. |
| **Prior utilisation** | Distribution of `number_emergency`, `number_inpatient`, `number_outpatient`, and readmission rate by prior-inpatient band. |
| **Throughput proxy** | Encounters by admission source, *not* over time (there are no dates). Say so explicitly. |

Delete: patient-flow stages with invented wait times, resource "utilisation %", bed capacity, invented trends, and fixed insight confidence values. Any insight text must be generated by deterministic rules from the computed numbers (as on the fairness page), never with a fixed "confidence: 94".

Keep using the existing filter allowlist (`normalizeFilters` / `buildWhereClause`) so the page filters still work.

**Tests:** an in-memory better-sqlite3 fixture for each new function (pattern: `lib/ml/predictiveData.test.ts`), checking counts, percentages, CIs, small-group suppression (n < 30), and that filters are bound as parameters.

**Acceptance:** `grep` for literals such as `'45m'`, `utilization: 88` and `trend: '+` in `operationalLogic.ts` returns nothing; every number traces to a query.

---

## Milestone 4: Rebuild Strategy as an Executive Evidence Summary (1 day)

One page that answers "what did this project find?" for an executive or examiner, assembled only from real sources:

1. **Headline KPIs** (DB): encounters, patients, the 30-day and any-readmission rates (both, clearly named), mean LOS, and the share of encounters with HbA1c tested.
2. **Model summary** (metrics artifact): AUC with CI, recall/precision at the operating threshold, and a link to `/predictive`.
3. **Key findings**, each a sentence generated by rules from artifacts:
   - from the HbA1c study (direction plus significance, honestly stated);
   - from fairness (which gaps were flagged, and which may be noise);
   - from SHAP (the top 3 drivers);
   - from data quality (the biggest gaps).
4. **Targets panel:** a user-editable target for each KPI, stored in browser `localStorage`, labelled "your target". The current-vs-target gap is computed. No built-in "industry benchmark" or "best practice" numbers unless you can cite a real source.
5. **Opportunities**, rule-based: e.g. "Discharge destination X has the highest 30-day rate (Y%, n=Z)" from the Operations queries. **No ROI, cost, or "time to benefit"**; the scenario calculator on `/predictive` is the only place for what-if numbers.

Delete `strategyLogic.ts`'s invented scores, benchmarks, initiatives and roadmap, or move them behind `DemoGate` if you want to keep the visual.

**Tests:** finding-generation rules (pure functions) with fixture artifacts, for example "if no exposure odds ratio is significant, the sentence must say so".

---

## Milestone 5: Home, header, Platform and Financial clean-up (half a day)

1. **Header:** remove "Seattle General" and the live pulse. Show "UCI Diabetes 130-US (1999–2008) · de-identified" instead.
2. **Quality:** remove the "SPRINT 4" label.
3. **Home:** audit each `components/platform/*` widget. Keep real ones (links to pages, the real KPI cards). Move notifications, system health, activity timeline, comments and workspace items into `DemoGate`, or delete them. Add a "Start here" card linking the demo path: Data Quality → Research → Predictive → Assistant → Report.
4. **Financial:** add a persistent banner: "Costs are illustrative estimates from configured multipliers (`lib/analytics/config.ts`), not claims or billing data." Show the formula next to each cost figure. Let the user edit the multipliers (as on the scenario calculator) so the page does not imply authority it lacks.
5. **Composite scores** (Population/Quality): add a "How this score is computed" disclosure listing the weights from `analytics/config.ts`.

**Acceptance:** run the headless page walk (see Milestone 7) with demo mode off and search every page's text for a list of known invented strings ("Seattle", "SPRINT", "DEP-0", "Forecast Accuracy", "ROI"). There must be none.

---

## Milestone 6: Assistant robustness for the live demo (1 day)

Issues observed in testing that could embarrass a live demo:

1. **Narrative fall-backs.** Large results sometimes fail grounding (for example, the model swapping two values) and show the terse deterministic text. Improvements:
   - For results with more than 6 rows, ask the model for a narrative about only the top and bottom 3 rows, and send only those rows.
   - Retry synthesis once when grounding fails, telling the model which claim failed, before falling back.
   - Tests: fake LLM returning a wrong claim then a correct one; the retry succeeds and is audited.
2. **Unsupported-but-reasonable questions** like "What share of encounters had an insulin dose increase?" fail because the model uses `SUM(CASE … encounter_id …)`. Add a planner self-repair loop: when the SQL guard rejects a query, send the guard's message back to the planner once ("Your SQL was rejected because …; rewrite it"). Add a cap and audit both attempts.
3. **Cold start.** The first Ollama call after a restart can take over 45 seconds. Add a `scripts/warmup.ps1` (and `.sh`) that sends one tiny prompt to each local profile, and call it from `start.bat` after the engine starts.
4. **Curated demo questions:** a tested list of 8–10 questions that reliably work, shown as suggested prompts in the General context (`config/assistant_capabilities.json`). Each has an engine test with a fake planner and fixture data.
5. **Error copy:** review `friendlyErrorMessage`, so every error tells the user what to try next.

**Acceptance:** the 10 curated questions succeed live, 10 times in a row each, against local Qwen (script this; log pass/fail and latency).

---

## Milestone 7: Automated verification and demo rehearsal (half a day)

1. Promote the headless Chrome page walk used during Phase 5 into `scripts/smoke/walk.mjs`:
   - log in via localStorage;
   - visit every page;
   - fail on console errors, HTTP ≥ 400, or banned strings;
   - save screenshots to `tmp/smoke/`.
   Add an npm script: `npm run smoke`.
2. Add the `/report` PDF render (Chrome `Page.printToPDF`) to the smoke run and assert page count > 3.
3. Rehearsal checklist in `docs/DEMO_CHECKLIST.md`:
   - reboot; `start.bat`; run warm-up; run smoke;
   - open the 5 demo pages in tabs;
   - have the PDF already saved as a fallback;
   - have Gemini available as a backup model if Ollama is slow, and confirm its daily quota.
4. Record a 5-minute screen capture of the full demo as a backup in case live software fails.

---

## Milestone 8 (optional, if time allows): Real authentication (1½–2 days)

Roadmap Phase 3. Lower mark value than everything above, but it removes the "client-side auth" caveat.

- Server-side session with signed HTTP-only cookies (e.g. `iron-session`), bcrypt-hashed demo users in a small SQLite `users` table, and a seeded admin/doctor/billing user.
- Route protection in Next.js middleware, and role checks in API route handlers (`/api/stream`, `/api/research/compare`, `/api/predictive/scenario`).
- Record the authenticated username (not the browser-supplied role) in the audit log's `requester_type`.
- Tests: unauthenticated API calls return 401; billing role cannot open restricted routes.

Read the Next.js 16 middleware guide in `frontend/node_modules/next/dist/docs/` first. Middleware conventions changed in recent versions.

---

## Milestone 9 (optional): Academic deliverables

These usually carry the marks directly.

1. **Written report.** Use `/report` as its backbone, adding a methods section (the cohort, split, threshold and fairness choices, each with its reason), results, limitations and ethics. 8–12 pages.
2. **Slides (10–12).** Problem → data and quality → methods → model results (with honest AUC) → fairness → HbA1c replication → live demo → limitations → future work.
3. **Viva preparation.** Likely questions with crisp answers:
   - Why is AUC only 0.67?
   - Why not use `class_weight`?
   - Why group the split by patient?
   - What does SHAP show, and what doesn't it show?
   - Why didn't your HbA1c result reach significance when the paper's did?
   - How do you stop the LLM inventing numbers?

---

## Suggested schedule

| Day | Milestones | Outcome |
|---|---|---|
| 1 | 1, 2, 5 | No invented numbers visible by default; header/home cleaned |
| 2 | 3 | Operations fully real |
| 3 | 4 | Executive Evidence Summary |
| 4 | 6 | Assistant reliable for live demo |
| 5 | 7 (+ 9 starts) | Automated smoke, rehearsal, backups |
| 6–7 | 8 and/or 9 | Auth if time; report, slides, viva prep |

## Ground rules (same as Phase 5)

- Never fabricate a number. If the data cannot support a widget, remove it or put it behind `DemoGate`.
- Every new query is parameterised and read-only. Every new pure function has tests. No test calls a real LLM.
- Verify in the browser before calling anything done; commit after each milestone.
- Watch out for shell escaping when writing code through shell commands: use the file-writing tools for anything containing backslashes.

## Handing this to an implementation agent

> Read `docs/PHASE6_ROADMAP.md` and `docs/PHASE5_IMPLEMENTATION_PROMPT.md` (for ground rules and environment facts). Implement Milestone 2, then stop and report with real results and verification performed.
