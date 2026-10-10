import type Database from 'better-sqlite3';

export interface ScenarioInput {
  /** Share of in-scope scored encounters the program can follow up (1-50). */
  capacityPercent: number;
  /** Assumed relative reduction in readmission risk among those followed up (0-100). User-supplied. */
  assumedReductionPercent: number;
  costPerReadmission: number | null;
  costPerIntervention: number | null;
}

export interface ScenarioCounts {
  scoredEncounters: number;
  targeted: number;
  caughtReadmissions: number;
  totalReadmissions: number;
}

export interface ScenarioResult extends ScenarioCounts {
  prevalence: number;
  precisionAtCapacity: number;
  captureRate: number;
  /** Capture rate divided by the capacity share: how much better than picking at random. */
  lift: number;
  scenarioAverted: number;
  interventionCost: number | null;
  scenarioSavings: number | null;
  scenarioNet: number | null;
  assumptions: string[];
  formula: string[];
  label: string;
}

export function validateScenarioInput(
  body: unknown,
): { ok: true; value: ScenarioInput } | { ok: false; error: string } {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return { ok: false, error: 'Request body must be a JSON object' };
  const record = body as Record<string, unknown>;

  const number = (key: string): number | null | 'invalid' => {
    const raw = record[key];
    if (raw === undefined || raw === null || raw === '') return null;
    const parsed = typeof raw === 'number' ? raw : Number(raw);
    return Number.isFinite(parsed) ? parsed : 'invalid';
  };

  const capacity = number('capacityPercent');
  if (capacity === null || capacity === 'invalid' || capacity < 1 || capacity > 50) return { ok: false, error: 'capacityPercent must be between 1 and 50' };
  const reduction = number('assumedReductionPercent');
  if (reduction === 'invalid' || (reduction !== null && (reduction < 0 || reduction > 100))) return { ok: false, error: 'assumedReductionPercent must be between 0 and 100' };
  const readmissionCost = number('costPerReadmission');
  const interventionCost = number('costPerIntervention');
  for (const [name, value] of [['costPerReadmission', readmissionCost], ['costPerIntervention', interventionCost]] as const) {
    if (value === 'invalid' || (value !== null && (value < 0 || value > 1e9))) return { ok: false, error: `${name} must be a non-negative number` };
  }
  return {
    ok: true,
    value: {
      capacityPercent: capacity,
      assumedReductionPercent: reduction ?? 0,
      costPerReadmission: readmissionCost as number | null,
      costPerIntervention: interventionCost as number | null,
    },
  };
}

export function scenarioMath(counts: ScenarioCounts, input: ScenarioInput): ScenarioResult {
  const { scoredEncounters, targeted, caughtReadmissions, totalReadmissions } = counts;
  const prevalence = scoredEncounters ? totalReadmissions / scoredEncounters : 0;
  const captureRate = totalReadmissions ? caughtReadmissions / totalReadmissions : 0;
  const capacityShare = scoredEncounters ? targeted / scoredEncounters : 0;
  const scenarioAverted = caughtReadmissions * (input.assumedReductionPercent / 100);
  const interventionCost = input.costPerIntervention === null ? null : targeted * input.costPerIntervention;
  const scenarioSavings = input.costPerReadmission === null ? null : scenarioAverted * input.costPerReadmission;
  const scenarioNet = interventionCost !== null && scenarioSavings !== null ? scenarioSavings - interventionCost : null;

  return {
    ...counts,
    prevalence,
    precisionAtCapacity: targeted ? caughtReadmissions / targeted : 0,
    captureRate,
    lift: capacityShare ? captureRate / capacityShare : 0,
    scenarioAverted,
    interventionCost,
    scenarioSavings,
    scenarioNet,
    assumptions: [
      `Capacity: follow up the highest-risk ${input.capacityPercent}% of scored encounters.`,
      `Assumed relative reduction in readmission among those followed up: ${input.assumedReductionPercent}% (your input, not a finding).`,
      'Readmissions caught are counted from the real data; the model is applied to the same encounters it was partly trained on, so the capture rate is optimistic compared with held-out performance.',
      'Assumes the intervention works equally for every flagged patient and that no one is double counted.',
    ],
    formula: [
      'encounters followed up = floor(scored encounters × capacity)',
      'readmissions caught = actual <30-day readmissions among those followed up (from the data)',
      'scenario readmissions averted = readmissions caught × assumed reduction',
      'intervention cost = encounters followed up × cost per intervention (only if entered)',
      'scenario savings = averted × cost per readmission (only if entered)',
    ],
    label: 'Scenario based on your assumptions — not a forecast.',
  };
}

export function computeScenario(db: Database.Database, input: ScenarioInput): ScenarioResult {
  const totals = db
    .prepare(
      `SELECT COUNT(*) AS scored,
              COALESCE(SUM(CASE WHEN readmitted = '<30' THEN 1 ELSE 0 END), 0) AS readmissions
         FROM hospital_readmissions
        WHERE predicted_readmission_risk_in_scope = 1 AND predicted_readmission_risk IS NOT NULL`,
    )
    .get() as { scored: number; readmissions: number };

  const targeted = Math.floor(totals.scored * (input.capacityPercent / 100));
  const caught =
    targeted === 0
      ? 0
      : (
          db
            .prepare(
              `SELECT COALESCE(SUM(CASE WHEN readmitted = '<30' THEN 1 ELSE 0 END), 0) AS caught
                 FROM (SELECT readmitted FROM hospital_readmissions
                        WHERE predicted_readmission_risk_in_scope = 1 AND predicted_readmission_risk IS NOT NULL
                        ORDER BY predicted_readmission_risk DESC, encounter_id ASC
                        LIMIT ?)`,
            )
            .get(targeted) as { caught: number }
        ).caught;

  return scenarioMath(
    { scoredEncounters: totals.scored, targeted, caughtReadmissions: caught, totalReadmissions: totals.readmissions },
    input,
  );
}
