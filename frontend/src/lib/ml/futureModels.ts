export const FUTURE_MODELS = [
  {
    name: 'XGBoost Readmission Classifier',
    type: 'Tree-based Ensemble',
    status: 'Planned',
    targetRelease: 'Q4 2026',
    description: 'Replacing current heuristic readmission risk with a trained XGBoost model for non-linear feature interaction capture.'
  },
  {
    name: 'Transformer-based LOS Predictor',
    type: 'Deep Learning',
    status: 'Research',
    targetRelease: 'Q1 2027',
    description: 'Sequence-to-sequence model analyzing temporal clinical notes and vitals to predict dynamic length of stay.'
  },
  {
    name: 'Logistic Regression Baseline',
    type: 'Linear Model',
    status: 'Validation',
    targetRelease: 'Q3 2026',
    description: 'Highly interpretable baseline model for baseline comparison against complex ensembles.'
  },
  {
    name: 'LightGBM Demand Forecaster',
    type: 'Gradient Boosting',
    status: 'Planned',
    targetRelease: 'Q4 2026',
    description: 'High-performance gradient boosting framework for predicting hospital bed demand and ER volume.'
  }
];
