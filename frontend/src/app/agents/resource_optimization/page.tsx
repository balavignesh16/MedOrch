import React from 'react';
import AgentWorkspace from '@/components/AgentWorkspace';

export default function OptimizationAgentPage() {
  return (
    <AgentWorkspace 
      agentName="Resource Optimization Agent"
      agentDescription="Manages bed capacity, staff allocation, and operational efficiency across departments."
      targetId="resource_optimization"
    />
  );
}
