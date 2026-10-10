import type Database from 'better-sqlite3';

export interface RiskDriver {
  feature: string;
  value: string;
  contribution: number;
}

/** De-identified view of a high-risk encounter. The row's rank is its display
 * key; encounter_id and patient_nbr must never be added to this shape. */
export interface HighRiskEncounter {
  rank: number;
  riskScore: number;
  age: string | null;
  gender: string | null;
  race: string | null;
  daysInHospital: number | null;
  priorInpatientVisits: number | null;
  medications: number | null;
  diagnoses: number | null;
  drivers: RiskDriver[];
}

interface ScoredRow {
  encounter_id: number;
  age: string | null;
  gender: string | null;
  race: string | null;
  time_in_hospital: number | null;
  number_inpatient: number | null;
  num_medications: number | null;
  number_diagnoses: number | null;
  predicted_readmission_risk: number;
  predicted_readmission_risk_model_version: string | null;
}

interface DriverRow {
  encounter_id: number;
  feature: string;
  feature_value: string;
  contribution: number;
}

function tableExists(db: Database.Database, name: string): boolean {
  const row = db.prepare("SELECT 1 AS present FROM sqlite_master WHERE type = 'table' AND name = ?").get(name);
  return row !== undefined;
}

function hasScoringColumns(db: Database.Database): boolean {
  const columns = db.prepare('PRAGMA table_info(hospital_readmissions)').all() as Array<{ name: string }>;
  const names = new Set(columns.map((column) => column.name));
  return names.has('predicted_readmission_risk') && names.has('predicted_readmission_risk_in_scope');
}

export function getHighRiskEncounters(db: Database.Database, limit = 50): HighRiskEncounter[] {
  if (!hasScoringColumns(db)) return [];
  const boundedLimit = Math.max(1, Math.min(Math.trunc(limit), 200));
  const rows = db
    .prepare(
      `SELECT encounter_id, age, gender, race, time_in_hospital, number_inpatient, num_medications,
              number_diagnoses, predicted_readmission_risk, predicted_readmission_risk_model_version
         FROM hospital_readmissions
        WHERE predicted_readmission_risk_in_scope = 1 AND predicted_readmission_risk IS NOT NULL
        ORDER BY predicted_readmission_risk DESC, encounter_id ASC
        LIMIT ?`,
    )
    .all(boundedLimit) as ScoredRow[];

  const driversByEncounter = new Map<number, RiskDriver[]>();
  if (rows.length > 0 && tableExists(db, 'readmission_risk_explanations')) {
    const placeholders = rows.map(() => '?').join(', ');
    const driverRows = db
      .prepare(
        `SELECT encounter_id, feature, feature_value, contribution, model_version
           FROM readmission_risk_explanations
          WHERE encounter_id IN (${placeholders})
          ORDER BY encounter_id, rank`,
      )
      .all(...rows.map((row) => row.encounter_id)) as Array<DriverRow & { model_version: string }>;
    const currentVersion = new Map(rows.map((row) => [row.encounter_id, row.predicted_readmission_risk_model_version]));
    for (const driver of driverRows) {
      // Explanations from a previous model version would describe a different score; omit them.
      if (driver.model_version !== currentVersion.get(driver.encounter_id)) continue;
      const list = driversByEncounter.get(driver.encounter_id) ?? [];
      list.push({ feature: driver.feature, value: driver.feature_value, contribution: driver.contribution });
      driversByEncounter.set(driver.encounter_id, list);
    }
  }

  return rows.map((row, index) => ({
    rank: index + 1,
    riskScore: row.predicted_readmission_risk,
    age: row.age,
    gender: row.gender,
    race: row.race,
    daysInHospital: row.time_in_hospital,
    priorInpatientVisits: row.number_inpatient,
    medications: row.num_medications,
    diagnoses: row.number_diagnoses,
    drivers: driversByEncounter.get(row.encounter_id) ?? [],
  }));
}

export interface RiskBin {
  from: number;
  to: number;
  count: number;
}

export interface RiskSummary {
  scoredEncounters: number;
  meanPredictedRisk: number | null;
  observedWithin30DayRate: number | null;
  bins: RiskBin[];
}

export const RISK_BIN_WIDTH = 0.05;

export function getRiskSummary(db: Database.Database): RiskSummary {
  if (!hasScoringColumns(db)) {
    return { scoredEncounters: 0, meanPredictedRisk: null, observedWithin30DayRate: null, bins: [] };
  }
  const totals = db
    .prepare(
      `SELECT COUNT(*) AS n, AVG(predicted_readmission_risk) AS mean_risk,
              AVG(CASE WHEN readmitted = '<30' THEN 1.0 ELSE 0.0 END) AS observed
         FROM hospital_readmissions
        WHERE predicted_readmission_risk_in_scope = 1 AND predicted_readmission_risk IS NOT NULL`,
    )
    .get() as { n: number; mean_risk: number | null; observed: number | null };
  const binRows = db
    .prepare(
      `SELECT MIN(CAST(predicted_readmission_risk / ? AS INTEGER), CAST(1.0 / ? AS INTEGER) - 1) AS bin, COUNT(*) AS count
         FROM hospital_readmissions
        WHERE predicted_readmission_risk_in_scope = 1 AND predicted_readmission_risk IS NOT NULL
        GROUP BY bin
        ORDER BY bin`,
    )
    .all(RISK_BIN_WIDTH, RISK_BIN_WIDTH) as Array<{ bin: number; count: number }>;
  return {
    scoredEncounters: totals.n,
    meanPredictedRisk: totals.mean_risk,
    observedWithin30DayRate: totals.observed,
    bins: binRows.map((row) => ({
      from: Number((row.bin * RISK_BIN_WIDTH).toFixed(4)),
      to: Number(((row.bin + 1) * RISK_BIN_WIDTH).toFixed(4)),
      count: row.count,
    })),
  };
}
