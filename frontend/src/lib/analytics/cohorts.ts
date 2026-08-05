export function determineRiskLevel(readmissionRate: number, avgLos: number): string {
  if (readmissionRate > 20 || avgLos > 7) return 'Critical';
  if (readmissionRate > 15 || avgLos > 5) return 'High';
  if (readmissionRate > 10 || avgLos > 3) return 'Medium';
  return 'Low';
}

export function estimateAvgAge(ageBuckets: { age_group: string, count: number }[]): number {
  let totalAgeSum = 0;
  let totalPatientsWithAge = 0;
  ageBuckets.forEach(d => {
    const match = d.age_group.match(/\[(\d+)-(\d+)\)/);
    if (match) {
      const midpoint = (parseInt(match[1]) + parseInt(match[2])) / 2;
      totalAgeSum += midpoint * d.count;
      totalPatientsWithAge += d.count;
    }
  });
  return totalPatientsWithAge > 0 ? totalAgeSum / totalPatientsWithAge : 0;
}
