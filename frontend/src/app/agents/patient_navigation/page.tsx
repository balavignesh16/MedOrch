import AgentWorkspace from '@/components/AgentWorkspace';

export default function NavigationAgentPage() {
  return (
    <AgentWorkspace 
      agentName="Patient Navigation Agent"
      agentDescription="Care pathway routing and patient assistance."
      targetId="navigation"
    />
  );
}
