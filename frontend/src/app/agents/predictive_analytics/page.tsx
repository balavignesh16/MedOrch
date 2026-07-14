import React from 'react';
import AgentWorkspace from '@/components/AgentWorkspace';

export default function PredictiveAgentPage() {
  return (
    <AgentWorkspace 
      agentName="Predictive Analytics Agent"
      agentDescription="Forecasts patient volumes, readmission risks, and financial impacts using historical data."
      targetId="predictive_analytics"
    />
  );
}
