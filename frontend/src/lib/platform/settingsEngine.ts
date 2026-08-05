export function getEnterpriseSettings() {
  return {
    theme: 'Dark',
    defaultDashboard: 'Enterprise Home',
    sessionTimeout: 30,
    benchmarkConfig: {
      useIndustryStandard: true,
      targetReadmissionRate: 12.0,
      targetAvgLos: 3.8
    }
  };
}
