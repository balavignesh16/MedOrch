"use client";

import React, { useState, useEffect } from 'react';
import CommandBar from '@/components/CommandBar';
import { motion } from 'framer-motion';
import { Bot, Network, Database, Shield, Zap, Activity, Code2, ChevronDown, ChevronUp } from 'lucide-react';
import RiskChart from './RiskChart';
import BedCapacityChart from './BedCapacityChart';
import ComplianceRadar from './ComplianceRadar';
import CostScatterPlot from './CostScatterPlot';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type AgentWorkspaceProps = {
  agentName: string;
  agentDescription: string;
  targetId: string;
};

const AgentWorkspace = ({ agentName, agentDescription, targetId }: AgentWorkspaceProps) => {
  const [insightSummary, setInsightSummary] = useState<string>("");
  const [sqlQuery, setSqlQuery] = useState<string>("");
  const [isSqlExpanded, setIsSqlExpanded] = useState(false);
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
    setSqlQuery("");
    setIsSqlExpanded(false);
    
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
              if (data.visualizationDataJson) {
                const parsedVis = JSON.parse(data.visualizationDataJson);
                if (parsedVis.sql_query) {
                  setSqlQuery(parsedVis.sql_query);
                }
              }
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
          <div className="flex-1 bg-surface-obsidian border border-border-glass rounded-xl p-6 shadow-2xl flex flex-col overflow-hidden relative">
            {/* Background Terminal Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-teal/5 rounded-full blur-[100px] pointer-events-none"></div>
            
            <div className="flex-1 overflow-y-auto pr-4 space-y-6 relative z-10">
              {insightSummary ? (
                <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-brand-teal/10 border border-brand-teal/20 flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 text-brand-teal drop-shadow-[0_0_5px_rgba(20,184,166,0.8)]" />
                  </div>
                  <div className="flex-1 space-y-4">
                    {/* XAI Thought Process Block */}
                    {sqlQuery && (
                      <div className="bg-surface-obsidian border border-brand-teal/20 rounded-xl overflow-hidden shadow-lg">
                        <button 
                          onClick={() => setIsSqlExpanded(!isSqlExpanded)}
                          className="w-full flex items-center justify-between px-4 py-3 bg-brand-teal/10 hover:bg-brand-teal/20 transition-colors"
                        >
                          <div className="flex items-center gap-2 text-brand-teal text-sm font-semibold tracking-wider uppercase">
                            <Code2 className="w-4 h-4" />
                            AI Thought Process: Executed SQL
                          </div>
                          {isSqlExpanded ? <ChevronUp className="w-4 h-4 text-brand-teal" /> : <ChevronDown className="w-4 h-4 text-brand-teal" />}
                        </button>
                        {isSqlExpanded && (
                          <div className="p-4 bg-black overflow-x-auto border-t border-brand-teal/10">
                            <pre className="text-xs text-brand-cyan/80 font-mono whitespace-pre-wrap">
                              {sqlQuery}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="bg-white/[0.02] border border-border-glass rounded-2xl rounded-tl-none p-6 text-slate-200 leading-relaxed shadow-lg font-mono text-sm">
                      <div className="prose prose-invert prose-teal max-w-none prose-p:leading-relaxed prose-pre:bg-black prose-pre:border prose-pre:border-border-glass prose-th:bg-white/5 prose-th:border-border-glass prose-td:border-border-glass prose-table:border-collapse">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {insightSummary}
                        </ReactMarkdown>
                      </div>
                      {isLoading && <span className="inline-block w-2 h-4 bg-brand-teal animate-pulse ml-2 align-middle"></span>}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
                  <div className="w-24 h-24 bg-brand-teal/5 border border-brand-teal/20 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(20,184,166,0.15)] relative">
                    <div className="absolute inset-0 bg-brand-teal/10 rounded-2xl animate-ping opacity-20"></div>
                    <Bot className="w-10 h-10 text-brand-teal drop-shadow-[0_0_8px_rgba(20,184,166,0.8)]" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2 tracking-tight uppercase">{agentName} <span className="text-brand-teal">Operational</span></h3>
                  <p className="text-slate-400 mb-8 max-w-md font-mono text-sm">Awaiting command parameters or select a predefined macro below.</p>
                  
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <button onClick={() => handleQuery("Count the number of patients currently admitted to each department.")} className="bg-white/[0.02] border border-border-glass hover:bg-brand-teal/10 hover:border-brand-teal/50 text-left p-5 rounded-xl transition-all group">
                      <p className="text-sm font-semibold text-slate-200 group-hover:text-brand-teal transition-colors tracking-wide">Analyze Department Loads</p>
                      <p className="text-xs text-slate-500 mt-2 font-mono">EXEC: count_admissions()</p>
                    </button>
                    <button onClick={() => handleQuery("List the 5 most recent abnormal lab results.")} className="bg-white/[0.02] border border-border-glass hover:bg-brand-teal/10 hover:border-brand-teal/50 text-left p-5 rounded-xl transition-all group">
                      <p className="text-sm font-semibold text-slate-200 group-hover:text-brand-teal transition-colors tracking-wide">Summarize Abnormal Labs</p>
                      <p className="text-xs text-slate-500 mt-2 font-mono">EXEC: fetch_critical_labs(limit=5)</p>
                    </button>
                    <button onClick={() => handleQuery("List the top 5 most prescribed active medications.")} className="bg-white/[0.02] border border-border-glass hover:bg-brand-teal/10 hover:border-brand-teal/50 text-left p-5 rounded-xl transition-all group">
                      <p className="text-sm font-semibold text-slate-200 group-hover:text-brand-teal transition-colors tracking-wide">Top Active Medications</p>
                      <p className="text-xs text-slate-500 mt-2 font-mono">EXEC: rank_medications()</p>
                    </button>
                    <button onClick={() => handleQuery("How many patients are currently admitted to the ICU?")} className="bg-white/[0.02] border border-border-glass hover:bg-brand-teal/10 hover:border-brand-teal/50 text-left p-5 rounded-xl transition-all group">
                      <p className="text-sm font-semibold text-slate-200 group-hover:text-brand-teal transition-colors tracking-wide">ICU Capacity Report</p>
                      <p className="text-xs text-slate-500 mt-2 font-mono">EXEC: get_icu_util()</p>
                    </button>
                  </div>
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

          <div className="h-1/2 bg-surface-obsidian border border-border-glass rounded-xl p-6 shadow-2xl overflow-y-auto relative">
            <div className="absolute -bottom-[100px] -right-[100px] w-[200px] h-[200px] bg-brand-cyan/5 rounded-full blur-[80px] pointer-events-none"></div>
            <h3 className="text-xs font-semibold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-teal" /> Execution Trace
            </h3>
            <div className="relative pl-4 space-y-6">
              <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-border-glass" />
              {traceNodes.map((node) => {
                const isProcessing = activeNode === node.id;
                const isDone = activeNode > node.id || activeNode === 5;
                const Icon = node.icon;
                return (
                  <div key={node.id} className="relative flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full z-10 transition-all duration-300 ${isProcessing ? 'bg-brand-cyan shadow-[0_0_12px_rgba(6,182,212,0.9)] scale-125' : isDone ? 'bg-brand-teal shadow-[0_0_8px_rgba(20,184,166,0.5)]' : 'bg-surface-glass border border-border-glass'}`} />
                    <div className={`flex items-center gap-3 p-3 rounded-lg border w-full transition-colors ${isProcessing ? 'bg-white/[0.04] border-brand-cyan/30 text-white' : isDone ? 'bg-brand-teal/5 border-brand-teal/20 text-slate-300' : 'bg-transparent border-transparent text-slate-600'}`}>
                      <Icon className={`w-4 h-4 ${isProcessing ? 'text-brand-cyan' : isDone ? 'text-brand-teal' : 'text-slate-600'}`} />
                      <span className="text-sm font-mono tracking-tight">{node.name}</span>
                      {isProcessing && <span className="ml-auto text-[10px] text-brand-cyan uppercase tracking-widest animate-pulse">Executing_</span>}
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
