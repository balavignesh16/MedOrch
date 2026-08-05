"use client";

import React, { useState } from 'react';
import { Search, Sparkles, X, ChevronDown, ChevronUp, Code2, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface GlobalQueryBarProps {
  injectedContext?: string;
}

export default function GlobalQueryBar({ injectedContext }: GlobalQueryBarProps = {}) {
  const [query, setQuery] = useState("");
  const [insightSummary, setInsightSummary] = useState<string>("");
  const [sqlQuery, setSqlQuery] = useState<string>("");
  const [isSqlExpanded, setIsSqlExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleQuery = async (q: string) => {
    if (!q.trim()) return;
    setIsLoading(true);
    setInsightSummary("");
    setSqlQuery("");
    setIsSqlExpanded(false);
    setHasSearched(true);
    
    try {
      const finalPrompt = injectedContext ? `[LIVE HOSPITAL DATA CONTEXT: ${injectedContext}]\n\nUser Query: ${q}` : q;
      const response = await fetch('/api/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: finalPrompt, agent_target: 'global' }),
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
      setInsightSummary("Error connecting to MedOrch Nexus AI Engine.");
    } finally {
      setIsLoading(false);
    }
  };

  const exampleQueries = [
    "What percent of patients drop if the hospital moved to a new location?",
    "How many patients are currently admitted to the ICU?",
    "List the 5 most recent abnormal lab results.",
    "Run a simulation: Financial impact of moving ER to west wing"
  ];

  return (
    <div className="w-full relative z-30 mb-8">
      {/* Search Input */}
      <div className="relative group">
        <div className="absolute inset-0 bg-brand-teal/5 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none mix-blend-multiply"></div>
        <div className="relative flex items-center bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl transition-all group-focus-within:border-brand-teal/50 group-focus-within:shadow-[0_8px_30px_rgba(20,184,166,0.15)]">
          <div className="pl-6 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-brand-teal animate-pulse" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleQuery(query);
            }}
            placeholder="Ask MedOrch Nexus anything..."
            className="flex-1 bg-transparent border-none text-slate-900 text-lg px-4 py-5 focus:outline-none placeholder-slate-400 font-medium"
          />
          <button 
            onClick={() => handleQuery(query)}
            disabled={isLoading || !query.trim()}
            className="mr-3 px-6 py-2.5 bg-brand-teal/10 hover:bg-brand-teal/20 border border-brand-teal/30 text-brand-teal font-bold uppercase tracking-widest text-xs rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : 'Execute'}
          </button>
        </div>
      </div>

      {/* Example Queries */}
      {!hasSearched && (
        <div className="flex flex-wrap items-center gap-3 mt-4 px-2">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mr-2">Example Queries:</span>
          {exampleQueries.map((q, i) => (
            <button
              key={i}
              onClick={() => {
                setQuery(q);
                handleQuery(q);
              }}
              className="px-4 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 text-xs hover:bg-slate-50 hover:text-brand-teal hover:border-brand-teal/30 transition-colors shadow-sm"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Results Dropdown */}
      <AnimatePresence>
        {hasSearched && (
          <motion.div 
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            className="absolute top-full left-0 right-0 mt-4 bg-white border border-slate-200 rounded-3xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.1)] overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4">
              <button 
                onClick={() => {
                  setHasSearched(false);
                  setQuery("");
                }}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>
            
            <div className="flex gap-6 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-brand-teal/10 border border-brand-teal/30 flex items-center justify-center shrink-0">
                <Bot className="w-6 h-6 text-brand-teal" />
              </div>
              <div className="flex-1 space-y-6 min-w-0 pr-8">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">{query}</h3>
                
                {/* SQL Thought Process */}
                {sqlQuery && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <button 
                      onClick={() => setIsSqlExpanded(!isSqlExpanded)}
                      className="w-full flex items-center justify-between px-5 py-4 bg-slate-100 hover:bg-slate-200/60 transition-colors"
                    >
                      <div className="flex items-center gap-3 text-brand-teal text-xs font-bold tracking-[0.1em] uppercase">
                        <Code2 className="w-4 h-4" />
                        AI Thought Process
                      </div>
                      {isSqlExpanded ? <ChevronUp className="w-4 h-4 text-brand-teal" /> : <ChevronDown className="w-4 h-4 text-brand-teal" />}
                    </button>
                    {isSqlExpanded && (
                      <div className="p-5 bg-white overflow-x-auto border-t border-slate-100">
                        <pre className="text-[13px] text-slate-700 font-mono whitespace-pre-wrap leading-relaxed">
                          {sqlQuery}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="text-slate-700 leading-loose font-mono text-sm">
                  <div className="prose prose-slate prose-teal max-w-none prose-p:leading-loose prose-pre:bg-slate-50 prose-pre:border prose-pre:border-slate-200 prose-th:bg-slate-50 prose-th:border-slate-200 prose-td:border-slate-200 prose-table:border-collapse prose-a:text-brand-teal">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {insightSummary}
                    </ReactMarkdown>
                  </div>
                  {isLoading && <span className="inline-block w-2 h-5 bg-brand-teal animate-pulse ml-3 align-middle"></span>}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
