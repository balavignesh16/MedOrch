export function minMaxScale(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return (value - min) / (max - min);
}

export function zScoreNormalize(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

export function preprocessFeatures(features: Record<string, number>): Record<string, number> {
  // In a real ML pipeline, this would apply pre-computed scalers from training
  // For this synthetic implementation, we return as-is or apply dummy scaling
  return {
    ...features,
    // Example of pseudo-scaling
    ageScaled: minMaxScale(features.age || 50, 0, 100)
  };
}
