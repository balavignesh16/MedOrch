import { cache } from 'react';
import {
  QueryFactory,
  normalizeFilters,
  calculatePopulationHealthIndex,
  generateHealthIndexInsights,
  extractAggregates,
  buildWhereClause,
  AnalyticsFilterState
} from './analytics';

export type PopulationFilterState = AnalyticsFilterState;

// --- API Methods ---

export const fetchPopulationOverview = cache(async (filters: any = {}) => {
  const normFilters = normalizeFilters(filters);
  const { whereClause, params } = buildWhereClause(normFilters);

  const total = QueryFactory.executeCount('hospital_readmissions', normFilters);
  const absoluteTotal = QueryFactory.executeCount('hospital_readmissions', {});
  const readmittedCount = QueryFactory.executeCount('hospital_readmissions', normFilters, `readmitted != 'NO'`);
  
  const agg = QueryFactory.executeAggregation('hospital_readmissions', normFilters);
  const { avgLengthOfStay, avgMedications, avgEmergencyVisits } = extractAggregates(agg);
  
  const diabetesCount = QueryFactory.executeCount('hospital_readmissions', normFilters, `diabetesmed = 'Yes'`);

  // Calculate high risk heuristics
  const highRiskCount = QueryFactory.executeCount('hospital_readmissions', normFilters, `(time_in_hospital > 5 OR number_emergency > 0 OR num_medications > 15)`);

  const ageDistribution = QueryFactory.executeGroupedCount<{ category: string, count: number }>('hospital_readmissions', 'age', normFilters);
  let totalAgeSum = 0;
  let totalPatientsWithAge = 0;
  ageDistribution.forEach(d => {
    const match = d.category.match(/\[(\d+)-(\d+)\)/);
    if (match) {
      const midpoint = (parseInt(match[1]) + parseInt(match[2])) / 2;
      totalAgeSum += midpoint * d.count;
      totalPatientsWithAge += d.count;
    }
  });
  const avgAge = totalPatientsWithAge > 0 ? totalAgeSum / totalPatientsWithAge : 0;

  const readmissionPercent = total > 0 ? (readmittedCount / total) * 100 : 0;
  const highRiskPercent = total > 0 ? (highRiskCount / total) * 100 : 0;
  const diabetesPercent = total > 0 ? (diabetesCount / total) * 100 : 0;

  const healthIndex = calculatePopulationHealthIndex({
    highRiskPercent,
    readmissionPercent,
    avgLengthOfStay,
    avgMedications,
    avgEmergencyVisits
  });

  return {
    totalPatients: total,
    absoluteTotal: absoluteTotal,
    activeReadmissions: readmittedCount,
    avgAge: avgAge,
    avgLengthOfStay: avgLengthOfStay,
    avgMedications: avgMedications,
    highRiskPercent: highRiskPercent,
    diabetesPercent: diabetesPercent,
    healthIndex: healthIndex
  };
});

export const fetchDiseaseIntelligence = cache(async (filters: any = {}) => {
  const normFilters = normalizeFilters(filters);
  const { whereClause, params } = buildWhereClause(normFilters);
  
  const query = `
    SELECT 
      diag_1 as disease, 
      COUNT(*) as total_patients,
      SUM(CASE WHEN readmitted != 'NO' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as readmission_rate,
      AVG(time_in_hospital) as avg_los,
      AVG(num_medications) as avg_meds,
      SUM(CASE WHEN gender = 'Female' THEN 1 ELSE 0 END) as female_count,
      SUM(CASE WHEN gender = 'Male' THEN 1 ELSE 0 END) as male_count,
      AVG(CASE age 
        WHEN '[0-10)' THEN 5 WHEN '[10-20)' THEN 15 WHEN '[20-30)' THEN 25 
        WHEN '[30-40)' THEN 35 WHEN '[40-50)' THEN 45 WHEN '[50-60)' THEN 55 
        WHEN '[60-70)' THEN 65 WHEN '[70-80)' THEN 75 WHEN '[80-90)' THEN 85 
        WHEN '[90-100)' THEN 95 ELSE 50 END) as avg_age
    FROM hospital_readmissions
    ${whereClause}
    GROUP BY diag_1
    ORDER BY total_patients DESC
    LIMIT 20
  `;
  
  const rawData = QueryFactory.executeCustomQuery<any[]>(query, params, []);
  
  return rawData.map(d => {
    let riskLevel = 'Low';
    if (d.readmission_rate > 20 || d.avg_los > 7) riskLevel = 'Critical';
    else if (d.readmission_rate > 15 || d.avg_los > 5) riskLevel = 'High';
    else if (d.readmission_rate > 10 || d.avg_los > 3) riskLevel = 'Medium';
    
    return {
      ...d,
      riskLevel,
      trendIndicator: d.readmission_rate > 15 ? 'up' : 'down'
    };
  }).filter(d => d.disease != null && String(d.disease).trim() !== '' && String(d.disease) !== '?');
});

export const fetchDemographics = cache(async (filters: any = {}) => {
  const normFilters = normalizeFilters(filters);

  const ageData = QueryFactory.executeGroupedCount<{ category: string, count: number }>('hospital_readmissions', 'age', normFilters);
  const genderData = QueryFactory.executeGroupedCount<{ category: string, count: number }>('hospital_readmissions', 'gender', normFilters);
  const raceData = QueryFactory.executeGroupedCount<{ category: string, count: number }>('hospital_readmissions', 'race', normFilters);
  const admissionTypeData = QueryFactory.executeGroupedCount<{ category: string, count: number }>('hospital_readmissions', 'admission_type_id', normFilters);
  const dischargeData = QueryFactory.executeGroupedCount<{ category: string, count: number }>('hospital_readmissions', 'discharge_disposition_id', normFilters);

  return {
    age: ageData.map(d => ({ name: d.category, value: d.count })).filter(d => d.name !== '?'),
    gender: genderData.map(d => ({ name: d.category, value: d.count })).filter(d => d.name !== 'Unknown/Invalid'),
    race: raceData.map(d => ({ name: d.category, value: d.count })).filter(d => d.name !== '?'),
    admissionType: admissionTypeData.map(d => ({ name: d.category, value: d.count })),
    dischargeDisposition: dischargeData.map(d => ({ name: d.category, value: d.count }))
  };
});

export const fetchRiskSegments = cache(async (filters: any = {}) => {
  const normFilters = normalizeFilters(filters);
  const { whereClause, params } = buildWhereClause(normFilters);
  
  const query = `
    SELECT 
      CASE 
        WHEN (time_in_hospital > 7 OR number_emergency > 2 OR num_medications > 20) THEN 'Critical'
        WHEN (time_in_hospital > 5 OR number_emergency > 0 OR num_medications > 15) THEN 'High'
        WHEN (time_in_hospital > 3 OR num_medications > 10) THEN 'Medium'
        ELSE 'Low'
      END as risk_category,
      COUNT(*) as count
    FROM hospital_readmissions
    ${whereClause}
    GROUP BY risk_category
  `;
  const rawDist = QueryFactory.executeCustomQuery<{ risk_category: string, count: number }[]>(query, params, []);
  
  const distribution = {
    Low: 0, Medium: 0, High: 0, Critical: 0
  };
  rawDist.forEach(d => {
    if (d.risk_category in distribution) {
      distribution[d.risk_category as keyof typeof distribution] = d.count;
    }
  });

  const pyramidQuery = `
    SELECT age, gender, COUNT(*) as count
    FROM hospital_readmissions
    ${whereClause}
    GROUP BY age, gender
    ORDER BY age
  `;
  const pyramidRaw = QueryFactory.executeCustomQuery<{ age: string, gender: string, count: number }[]>(pyramidQuery, params, []);
  const pyramidMap = new Map<string, { age: string, Male: number, Female: number }>();
  
  pyramidRaw.forEach(r => {
    if (r.age === '?') return;
    if (!pyramidMap.has(r.age)) {
      pyramidMap.set(r.age, { age: r.age, Male: 0, Female: 0 });
    }
    const entry = pyramidMap.get(r.age)!;
    if (r.gender === 'Male') entry.Male = r.count;
    if (r.gender === 'Female') entry.Female = -r.count;
  });

  return {
    distribution,
    pyramid: Array.from(pyramidMap.values())
  };
});

export const fetchPopulationTrends = cache(async (filters: any = {}) => {
  const normFilters = normalizeFilters(filters);
  const { whereClause, params } = buildWhereClause(normFilters);
  
  const query = `
    SELECT 
      (encounter_id % 12) + 1 as month_index,
      COUNT(*) as admissions,
      SUM(CASE WHEN readmitted != 'NO' THEN 1 ELSE 0 END) as readmissions,
      AVG(time_in_hospital) as avg_los
    FROM hospital_readmissions
    ${whereClause}
    GROUP BY month_index
    ORDER BY month_index
  `;
  const rawTrends = QueryFactory.executeCustomQuery<any[]>(query, params, []);
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return rawTrends.map(t => ({
    name: monthNames[t.month_index - 1],
    admissions: t.admissions,
    readmissions: t.readmissions,
    avg_los: parseFloat(t.avg_los.toFixed(1))
  }));
});

export const generatePopulationInsights = cache(async (filters: any = {}) => {
  const overview = await fetchPopulationOverview(filters);
  const disease = await fetchDiseaseIntelligence(filters);
  
  const insights = [];
  
  // Using Insight Engine
  insights.push(...generateHealthIndexInsights(overview.healthIndex));
  
  if (disease.length > 0) {
    insights.push({
      title: `High Volume Diagnosis: ${disease[0].disease}`,
      severity: disease[0].riskLevel === 'Critical' ? 'Critical' : disease[0].riskLevel === 'High' ? 'Warning' : 'Info',
      confidence: 88,
      supportingMetric: "Highest frequency in selected cohort",
      businessImpact: "Driving majority of inpatient utilization and resource consumption.",
      recommendedAction: "Review standardized care pathways for this diagnosis.",
      relatedDashboard: "Disease Intelligence"
    });
  }
  
  return insights;
});

export const fetchCohortList = cache(async (filters: any = {}, page = 1, pageSize = 25, sortBy = 'patient_nbr', sortOrder = 'asc', searchQuery = '') => {
  const normFilters = normalizeFilters(filters);
  const { whereClause, params } = buildWhereClause(normFilters);

  let finalWhere = whereClause;
  if (searchQuery) {
    const searchCond = `(CAST(patient_nbr AS TEXT) LIKE ? OR diag_1 LIKE ?)`;
    finalWhere = finalWhere ? `${finalWhere} AND ${searchCond}` : `WHERE ${searchCond}`;
    params.push(`%${searchQuery}%`, `%${searchQuery}%`);
  }

  // Need to group by patient_nbr to avoid duplicate rows per patient if there are multiple encounters, 
  // but since we want the latest info, we can use an aggregation or just return distinct patients.
  const countQuery = `SELECT COUNT(DISTINCT patient_nbr) as count FROM hospital_readmissions ${finalWhere}`;
  const totalRow = QueryFactory.executeCustomQuery<{ count: number }[]>(countQuery, params, [{ count: 0 }]);
  const total = totalRow[0]?.count || 0;

  const totalPages = Math.ceil(total / pageSize);
  const offset = (Math.max(1, page) - 1) * pageSize;

  const validSortColumns = ['patient_nbr', 'age', 'diag_1', 'readmitted'];
  const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'patient_nbr';
  const safeSortOrder = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  const query = `
    SELECT 
      patient_nbr,
      MAX(age) as age,
      MAX(gender) as gender,
      MAX(race) as race,
      MAX(diag_1) as diag_1,
      COUNT(encounter_id) as num_encounters,
      SUM(num_medications) as total_medications,
      MAX(readmitted) as last_readmission,
      CASE 
        WHEN (MAX(time_in_hospital) > 7 OR MAX(number_emergency) > 2 OR SUM(num_medications) > 20) THEN 'Critical'
        WHEN (MAX(time_in_hospital) > 5 OR MAX(number_emergency) > 0 OR SUM(num_medications) > 15) THEN 'High'
        WHEN (MAX(time_in_hospital) > 3 OR SUM(num_medications) > 10) THEN 'Medium'
        ELSE 'Low'
      END as risk_level
    FROM hospital_readmissions
    ${finalWhere}
    GROUP BY patient_nbr
    ORDER BY ${safeSortBy} ${safeSortOrder}
    LIMIT ? OFFSET ?
  `;

  const patients = QueryFactory.executeCustomQuery<any[]>(query, [...params, pageSize, offset], []);

  return { patients, total, page, pageSize, totalPages };
});

export const fetchPatientDetail = cache(async (patient_nbr: string) => {
  const query = `SELECT * FROM hospital_readmissions WHERE CAST(patient_nbr AS TEXT) = ? ORDER BY encounter_id DESC`;
  const encounters = QueryFactory.executeCustomQuery<any[]>(query, [patient_nbr], []);
  
  if (!encounters || encounters.length === 0) return null;

  let totalLos = 0;
  let totalMeds = 0;
  let totalProcedures = 0;
  let totalEmergency = 0;
  let totalInpatient = 0;

  encounters.forEach(e => {
    totalLos += e.time_in_hospital || 0;
    totalMeds += e.num_medications || 0;
    totalProcedures += e.num_procedures || 0;
    totalEmergency += e.number_emergency || 0;
    totalInpatient += e.number_inpatient || 0;
  });

  let riskLevel = 'Low';
  if (totalLos > 7 || totalEmergency > 2 || totalMeds > 20) riskLevel = 'Critical';
  else if (totalLos > 5 || totalEmergency > 0 || totalMeds > 15) riskLevel = 'High';
  else if (totalLos > 3 || totalMeds > 10) riskLevel = 'Medium';

  const profile = {
    patient_nbr: encounters[0].patient_nbr,
    age: encounters[0].age,
    gender: encounters[0].gender,
    race: encounters[0].race,
    totalEncounters: encounters.length,
    avgLos: (totalLos / encounters.length).toFixed(1),
    totalMeds,
    totalProcedures,
    totalEmergency,
    totalInpatient,
    riskLevel
  };

  return { profile, encounters };
});
