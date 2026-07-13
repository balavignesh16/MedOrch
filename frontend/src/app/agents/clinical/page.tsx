import React from 'react';
import AgentWorkspace from '@/components/AgentWorkspace';

export default function ClinicalAgentPage() {
  return (
    <AgentWorkspace 
      agentName="Clinical Triage Agent"
      agentDescription="Specialized in patient prioritization, symptom analysis, and preliminary diagnosis generation."
      targetId="clinical_triage"
    />
  );
}
