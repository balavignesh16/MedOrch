"use client";

import React, { useState } from 'react';
import CommandBar from '@/components/CommandBar';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

type AgentWorkspaceProps = {
  agentName: string;
  agentDescription: string;
  targetId: string;
};

const AgentWorkspace = ({ agentName, agentDescription, targetId }: AgentWorkspaceProps) => {
  const [insightSummary, setInsightSummary] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleQuery = async (query: string) => {
    setIsLoading(true);
    setInsightSummary("");
    
    try {
      const response = await fetch('/api/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Pass the targetId so the Go Gateway knows which Python agent to hit
        body: JSON.stringify({ prompt: query, agent_target: targetId }),
      });

      if (!response.ok) {
        throw new Error("Failed to connect to streaming API");
      }

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
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col h-full">
      <header className="mb-6">
        <div className="flex items-center gap-2 text-sm text-brand-teal mb-2">
          <span>MedOrch Hub</span>
          <span>/</span>
          <span>Agents</span>
          <span>/</span>
          <span className="font-bold text-white">{agentName}</span>
        </div>
        <h2 className="text-3xl font-bold text-foreground tracking-tight">{agentName}</h2>
        <p className="text-slate-400 mt-2">{agentDescription}</p>
      </header>

      <div className="flex-1 bg-surface-glass border border-border-glass backdrop-blur-md rounded-2xl p-6 shadow-lg flex flex-col mb-4 overflow-hidden">
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
             <div className="h-full flex items-center justify-center">
               <div className="text-center">
                 <Bot className="w-12 h-12 text-slate-600 mx-auto mb-4 opacity-50" />
                 <p className="text-slate-500">This workspace is currently empty.</p>
                 <p className="text-slate-600 text-sm mt-2">Ask a question below to wake up the {agentName}.</p>
               </div>
             </div>
          )}
        </div>
      </div>

      <div className="shrink-0">
        <CommandBar onQuery={handleQuery} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default AgentWorkspace;
