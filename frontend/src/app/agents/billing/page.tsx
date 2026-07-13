import AgentWorkspace from '@/components/AgentWorkspace';

export default function BillingAgentPage() {
  return (
    <AgentWorkspace 
      agentName="Billing & Claims Agent"
      agentDescription="Automated financial analysis and claims processing."
      targetId="billing"
    />
  );
}
