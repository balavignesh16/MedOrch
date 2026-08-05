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
        let buffer = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                setInsightSummary(data.summaryText);
                if (data.visualizationDataJson) {
                  const parsedVis = JSON.parse(data.visualizationDataJson);
                  if (parsedVis.sql_query) {
                    setSqlQuery(parsedVis.sql_query);
                  }
                }
              } catch (e) {
                console.error("JSON parse error for line:", line.slice(6), e);
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
      <header className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-brand-teal mb-3 uppercase tracking-[0.2em] font-semibold">
            <span className="opacity-60">MedOrch Hub</span><span className="opacity-40">/</span><span className="opacity-60">Agents</span><span className="opacity-40">/</span>
            <span className="text-brand-teal font-bold">{agentName}</span>
          </div>
          <h2 className="text-4xl font-bold text-white tracking-tighter mb-1">{agentName}</h2>
          <p className="text-white/50 font-mono text-sm max-w-xl">{agentDescription}</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-surface-obsidian border border-white/10 flex items-center justify-center shadow-sm">
          <Bot className="w-6 h-6 text-brand-teal" />
        </div>
      </header>

      <div className="flex-1 grid grid-cols-12 gap-8 mb-4 min-h-0">
        {/* Main Chat Area (8 cols) */}
        <div className="col-span-8 flex flex-col gap-6">
          <div className="flex-1 bg-surface-obsidian border border-white/10 rounded-3xl p-8 shadow-xl flex flex-col overflow-hidden relative">
            {/* Background Terminal Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-teal/5 rounded-full blur-[120px] pointer-events-none mix-blend-multiply"></div>
            
            <div className="flex-1 overflow-y-auto pr-4 space-y-8 relative z-10 scrollbar-hide">
              {insightSummary ? (
                <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="flex gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-brand-teal/10 border border-brand-teal/30 flex items-center justify-center shrink-0">
                    <Bot className="w-6 h-6 text-brand-teal" />
                  </div>
                  <div className="flex-1 space-y-6">
                    {/* XAI Thought Process Block */}
                    {sqlQuery && (
                      <div className="bg-surface-black border border-white/10 rounded-2xl overflow-hidden shadow-sm">
                        <button 
                          onClick={() => setIsSqlExpanded(!isSqlExpanded)}
                          className="w-full flex items-center justify-between px-5 py-4 bg-surface-obsidian/5 hover:bg-surface-obsidian/5 transition-colors"
                        >
                          <div className="flex items-center gap-3 text-brand-teal text-xs font-bold tracking-[0.1em] uppercase">
                            <Code2 className="w-4 h-4" />
                            AI Thought Process: Executed SQL
                          </div>
                          {isSqlExpanded ? <ChevronUp className="w-4 h-4 text-brand-teal" /> : <ChevronDown className="w-4 h-4 text-brand-teal" />}
                        </button>
                        {isSqlExpanded && (
                          <div className="p-5 bg-surface-obsidian overflow-x-auto border-t border-white/5">
                            <pre className="text-[13px] text-white/80 font-mono whitespace-pre-wrap leading-relaxed">
                              {sqlQuery}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="bg-surface-obsidian border border-white/10 rounded-3xl rounded-tl-none p-8 text-white/80 leading-loose shadow-sm font-mono text-sm">
                      <div className="prose prose-invert prose-teal max-w-none prose-p:leading-loose prose-pre:bg-surface-black prose-pre:border prose-pre:border-white/10 prose-th:bg-surface-black prose-th:border-white/10 prose-td:border-white/10 prose-table:border-collapse prose-a:text-brand-teal">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {insightSummary}
                        </ReactMarkdown>
                      </div>
                      {isLoading && <span className="inline-block w-2 h-5 bg-brand-teal animate-pulse ml-3 align-middle"></span>}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
                  <div className="w-32 h-32 bg-brand-teal/5 border border-brand-teal/20 rounded-3xl flex items-center justify-center mb-8">
                    <div className="absolute inset-0 bg-brand-teal/10 rounded-3xl animate-ping opacity-30"></div>
                    <Bot className="w-12 h-12 text-brand-teal" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-3 tracking-tighter uppercase flex items-center gap-3">
                    {agentName} 
                    <span className="px-3 py-1 bg-brand-teal/10 border border-brand-teal/30 rounded-full text-brand-teal text-xs tracking-widest">OPERATIONAL</span>
                  </h3>
                  <p className="text-white/50 mb-10 max-w-md font-mono text-sm leading-relaxed">
                    Awaiting command parameters or select a predefined macro below.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-5 w-full">
                    <button onClick={() => handleQuery("Count the number of patients currently admitted to each department.")} className="bg-surface-obsidian border border-white/10 hover:border-brand-teal/40 hover:shadow-md text-left p-6 rounded-2xl transition-all group">
                      <p className="text-sm font-bold text-white group-hover:text-brand-teal transition-colors tracking-wide">Analyze Department Loads</p>
                      <p className="text-[11px] text-white/50 mt-3 font-mono opacity-70">EXEC: count_admissions()</p>
                    </button>
                    <button onClick={() => handleQuery("List the 5 most recent abnormal lab results.")} className="bg-surface-obsidian border border-white/10 hover:border-brand-teal/40 hover:shadow-md text-left p-6 rounded-2xl transition-all group">
                      <p className="text-sm font-bold text-white group-hover:text-brand-teal transition-colors tracking-wide">Summarize Abnormal Labs</p>
                      <p className="text-[11px] text-white/50 mt-3 font-mono opacity-70">EXEC: fetch_critical_labs(limit=5)</p>
                    </button>
                    <button onClick={() => handleQuery("List the top 5 most prescribed active medications.")} className="bg-surface-obsidian border border-white/10 hover:border-brand-teal/40 hover:shadow-md text-left p-6 rounded-2xl transition-all group">
                      <p className="text-sm font-bold text-white group-hover:text-brand-teal transition-colors tracking-wide">Top Active Medications</p>
                      <p className="text-[11px] text-white/50 mt-3 font-mono opacity-70">EXEC: rank_medications()</p>
                    </button>
                    <button onClick={() => handleQuery("How many patients are currently admitted to the ICU?")} className="bg-surface-obsidian border border-white/10 hover:border-brand-teal/40 hover:shadow-md text-left p-6 rounded-2xl transition-all group">
                      <p className="text-sm font-bold text-white group-hover:text-brand-teal transition-colors tracking-wide">ICU Capacity Report</p>
                      <p className="text-[11px] text-white/50 mt-3 font-mono opacity-70">EXEC: get_icu_util()</p>
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
          <div className="h-1/2 bg-surface-obsidian border border-white/10 rounded-3xl p-6 shadow-xl">
            {renderChart()}
          </div>

          <div className="h-1/2 bg-surface-obsidian border border-white/10 rounded-3xl p-8 shadow-xl overflow-hidden relative flex flex-col">
            <div className="absolute -bottom-[100px] -right-[100px] w-[300px] h-[300px] bg-brand-cyan/5 rounded-full blur-[100px] pointer-events-none mix-blend-multiply"></div>
            <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
              <Activity className="w-4 h-4 text-brand-cyan" /> Execution Trace
            </h3>
            <div className="relative pl-5 flex-1 flex flex-col justify-between">
              <div className="absolute left-[27px] top-4 bottom-4 w-[1px] bg-surface-obsidian/10" />
              {traceNodes.map((node) => {
                const isProcessing = activeNode === node.id;
                const isDone = activeNode > node.id || activeNode === 5;
                const Icon = node.icon;
                return (
                  <div key={node.id} className="relative flex items-center gap-5">
                    <div className={`w-3.5 h-3.5 rounded-full z-10 transition-all duration-500 ${isProcessing ? 'bg-brand-cyan shadow-sm scale-150' : isDone ? 'bg-brand-teal' : 'bg-surface-obsidian/10 border border-white/20'}`} />
                    <div className={`flex items-center gap-4 p-3.5 rounded-xl border w-full transition-all duration-300 ${isProcessing ? 'bg-brand-cyan/10 border-brand-cyan/40 text-white translate-x-2' : isDone ? 'bg-surface-black border-white/10 text-white/80' : 'bg-transparent border-transparent text-white/50'}`}>
                      <Icon className={`w-4 h-4 ${isProcessing ? 'text-brand-cyan' : isDone ? 'text-brand-teal' : 'text-white/40'}`} />
                      <span className="text-xs font-mono tracking-wider">{node.name}</span>
                      {isProcessing && <span className="ml-auto text-[9px] text-brand-cyan uppercase tracking-[0.2em] animate-pulse font-bold">Executing_</span>}
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
