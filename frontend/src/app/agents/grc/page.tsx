import React from 'react';
import AgentWorkspace from '@/components/AgentWorkspace';

export default function GrcAgentPage() {
  return (
    <AgentWorkspace 
      agentName="Cyber GRC Agent"
      agentDescription="Ensures HIPAA compliance, audits system access, and scrubs PII from analytical data."
      targetId="cyber_grc"
    />
  );
}
