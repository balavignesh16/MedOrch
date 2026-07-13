"use client";

import React, { useState, useEffect } from 'react';
import CommandBar from '@/components/CommandBar';
import { motion } from 'framer-motion';
import { Bot, Network, Database, Shield, Zap, Activity } from 'lucide-react';
import RiskChart from './RiskChart';
import BedCapacityChart from './BedCapacityChart';
import ComplianceRadar from './ComplianceRadar';
import CostScatterPlot from './CostScatterPlot';

type AgentWorkspaceProps = {
  agentName: string;
  agentDescription: string;
  targetId: string;
};

const AgentWorkspace = ({ agentName, agentDescription, targetId }: AgentWorkspaceProps) => {
  const [insightSummary, setInsightSummary] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeNode, setActiveNode] = useState(0);

  // Simulate execution trace
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setActiveNode(prev => (prev < 4 ? prev + 1 : 1));
      }, 800);
      return () => clearInterval(interval);
    } else {
      setActiveNode(0);
    }
  }, [isLoading]);

  const handleQuery = async (query: string) => {
    setIsLoading(true);
    setInsightSummary("");
    
    try {
      const response = await fetch('/api/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: query, agent_target: targetId }),
      });

      if (!response.ok) throw new Error("Failed to connect to streaming API");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6));
              setInsightSummary(data.summaryText);
            }
          }
        }
      }
    } catch (error) {
      console.error("Streaming Error:", error);
      setInsightSummary("Error connecting to AI Agent via Go Gateway.");
    } finally {
      setIsLoading(false);
      setActiveNode(5); // Complete
    }
  };

  const renderChart = () => {
    if (targetId === 'clinical_triage') return <RiskChart />;
    if (targetId === 'resource_optimization') return <BedCapacityChart />;
    if (targetId === 'cyber_grc') return <ComplianceRadar />;
    if (targetId === 'predictive_analytics') return <CostScatterPlot />;
    return <RiskChart />;
  };

  const traceNodes = [
    { id: 1, name: "NLP Gateway", icon: Network },
    { id: 2, name: "Auth & GRC", icon: Shield },
    { id: 3, name: "Clinical DB", icon: Database },
    { id: 4, name: "LangGraph LLM", icon: Zap },
    { id: 5, name: "Response Stream", icon: Activity },
  ];

  return (
    <div className="w-full flex flex-col h-full">
      <header className="mb-6">
        <div className="flex items-center gap-2 text-sm text-brand-teal mb-2">
          <span>MedOrch Hub</span><span>/</span><span>Agents</span><span>/</span>
          <span className="font-bold text-white">{agentName}</span>
        </div>
        <h2 className="text-3xl font-bold text-foreground tracking-tight">{agentName}</h2>
        <p className="text-slate-400 mt-2">{agentDescription}</p>
      </header>

      <div className="flex-1 grid grid-cols-12 gap-6 mb-4 min-h-0">
        {/* Main Chat Area (8 cols) */}
        <div className="col-span-8 flex flex-col gap-4">
          <div className="flex-1 bg-surface-glass border border-border-glass backdrop-blur-md rounded-2xl p-6 shadow-lg flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto pr-4 space-y-6">
              {insightSummary ? (
                <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-teal/20 flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 text-brand-teal" />
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none p-4 text-slate-200 leading-relaxed">
                    {insightSummary}
                    {isLoading && <span className="animate-pulse ml-1">|</span>}
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <Bot className="w-16 h-16 text-slate-600 mb-4 opacity-30" />
                  <p className="text-slate-400 font-medium text-lg">Agent is standing by.</p>
                  <p className="text-slate-600 text-sm mt-2 max-w-sm">Initialize a LangGraph workflow by typing a query below.</p>
                </div>
              )}
            </div>
          </div>
          <div className="shrink-0">
            <CommandBar onQuery={handleQuery} isLoading={isLoading} />
          </div>
        </div>

        {/* Telemetry Panel (4 cols) */}
        <div className="col-span-4 flex flex-col gap-6 overflow-hidden">
          <div className="h-1/2">
            {renderChart()}
          </div>

          <div className="h-1/2 bg-surface-glass border border-border-glass backdrop-blur-md rounded-2xl p-6 shadow-lg overflow-y-auto">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-teal" /> Live Execution Trace
            </h3>
            <div className="relative pl-4 space-y-6">
              <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-slate-800" />
              {traceNodes.map((node) => {
                const isProcessing = activeNode === node.id;
                const isDone = activeNode > node.id || activeNode === 5;
                const Icon = node.icon;
                return (
                  <div key={node.id} className="relative flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full z-10 transition-all duration-300 ${isProcessing ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)] scale-125' : isDone ? 'bg-brand-teal' : 'bg-slate-700'}`} />
                    <div className={`flex items-center gap-3 p-3 rounded-xl border w-full transition-colors ${isProcessing ? 'bg-white/10 border-amber-500/30 text-white' : isDone ? 'bg-brand-teal/5 border-brand-teal/20 text-slate-300' : 'bg-transparent border-transparent text-slate-600'}`}>
                      <Icon className={`w-5 h-5 ${isProcessing ? 'text-amber-400' : isDone ? 'text-brand-teal' : 'text-slate-600'}`} />
                      <span className="text-sm font-medium">{node.name}</span>
                      {isProcessing && <span className="ml-auto text-[10px] text-amber-400 uppercase tracking-widest animate-pulse">Executing</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentWorkspace;
