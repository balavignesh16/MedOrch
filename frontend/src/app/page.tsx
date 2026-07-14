"use client";

import React, { useState, useEffect, useRef } from 'react';
import MetricCard from '@/components/MetricCard';
import { TrendingUp, Users, Activity, DollarSign, Bot, ChevronDown, ChevronRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import CommandBar from '@/components/CommandBar';

// Initial Mock Data Structure
const initialMockData = {
  readmission_risk: { value: '--', trend: '--', isPositive: true },
  active_patients: { value: '--', trend: '--', isPositive: true },
  icu_capacity: { value: '--', trend: '--', isPositive: true },
  cost_impact: { value: '--', trend: '--', isPositive: true }
};

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  reasoning?: string;
  metrics?: any;
}

export default function Home() {
  const [data, setData] = useState(initialMockData);
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'welcome',
    role: 'assistant',
    content: "Welcome to MedOrch AI Clinical Copilot. I can analyze patient readmission risks, predict resource forecasting, and query the entire healthcare database using natural language. How can I assist you today?"
  }]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAgentIndex, setActiveAgentIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);

  const agents = [
    { name: "Orchestrator", icon: Activity, color: "text-brand-indigo", bg: "bg-brand-indigo" },
    { name: "Specialist", icon: Users, color: "text-blue-400", bg: "bg-blue-400" },
    { name: "Research", icon: Bot, color: "text-purple-400", bg: "bg-purple-400" },
    { name: "Cyber GRC", icon: ShieldCheck, color: "text-green-400", bg: "bg-green-400" }
  ];
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Fetch initial baseline metrics
  useEffect(() => {
    fetch('http://localhost:8080/api/patients')
      .then(res => res.json())
      .then(patients => {
        if (Array.isArray(patients)) {
          const highRiskCount = patients.filter((p: any) => p.baselineRiskScore > 0.7).length;
          
          setData(prev => ({
            ...prev,
            active_patients: { value: patients.length.toLocaleString(), trend: "+12", isPositive: true },
            readmission_risk: { value: `${highRiskCount} High Risk`, trend: "-2", isPositive: true }
          }));
        }
      })
      .catch(err => console.error("Error fetching initial baseline metrics:", err));
  }, []);

  const handleQuerySubmit = async (query: string) => {
    const newUserMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: query };
    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);
    setActiveAgentIndex(0);
    setError(null);
    
    // Simulate agent steps progression for WOW effect
    const agentInterval = setInterval(() => {
      setActiveAgentIndex(prev => {
        if (prev >= agents.length - 1) {
          clearInterval(agentInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 800);
    
    try {
      const response = await fetch('http://localhost:8080/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: query }),
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      clearInterval(agentInterval);
      
      const newAssistantMsg: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: result.summary || "Done.",
        reasoning: result.reasoning || undefined,
        metrics: result.metrics || undefined
      };
      
      setMessages(prev => [...prev, newAssistantMsg]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred");
    } finally {
      clearInterval(agentInterval);
      setIsLoading(false);
      setActiveAgentIndex(-1);
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-full relative">
      
      <div className="flex-none mb-8">
        <header className="mb-2">
          <h2 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">AI Clinical Copilot</h2>
          <p className="text-slate-400 mt-2 text-lg">Your intelligent assistant for real-time healthcare analytics.</p>
        </header>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6"
        >
          <MetricCard title="Readmission Risk" value={data.readmission_risk.value} trend={data.readmission_risk.trend} isPositive={data.readmission_risk.isPositive} icon={Activity} />
          <MetricCard title="Active Patients" value={data.active_patients.value} trend={data.active_patients.trend} isPositive={data.active_patients.isPositive} icon={Users} />
          <MetricCard title="ICU Capacity" value={data.icu_capacity.value} trend={data.icu_capacity.trend} isPositive={data.icu_capacity.isPositive} icon={TrendingUp} />
          <MetricCard title="Est. Cost Impact" value={data.cost_impact.value} trend={data.cost_impact.trend} isPositive={data.cost_impact.isPositive} icon={DollarSign} />
        </motion.div>
      </div>

      <div className="flex-1 glass-card rounded-3xl flex flex-col overflow-hidden mb-6 relative">
        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <ChatMessageBubble key={msg.id} msg={msg} />
            ))}
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="flex flex-col space-y-4 max-w-4xl"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-teal/20 flex items-center justify-center border border-brand-teal/30">
                    <Bot className="w-5 h-5 text-brand-teal" />
                  </div>
                  <div className="bg-surface-glass border border-border-glass rounded-2xl rounded-tl-sm px-6 py-4">
                    <div className="flex space-x-2 items-center h-6">
                      <div className="w-2 h-2 bg-brand-teal rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-brand-teal rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-brand-teal rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>

                <div className="ml-14 flex items-center space-x-2 bg-slate-950/80 px-4 py-3 rounded-xl border border-slate-800">
                  <span className="text-xs font-semibold text-slate-400 mr-2 uppercase tracking-wider">Agent Trace:</span>
                  {agents.map((agent, idx) => {
                    const AgentIcon = agent.icon;
                    const isActive = idx === activeAgentIndex;
                    const isPast = idx < activeAgentIndex;
                    return (
                      <React.Fragment key={agent.name}>
                        <div className={`flex items-center space-x-1 ${isActive ? agent.color : isPast ? 'text-slate-500' : 'text-slate-700'} transition-colors duration-500`}>
                          <AgentIcon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />
                          <span className={`text-xs ${isActive ? 'font-bold' : ''}`}>{agent.name}</span>
                        </div>
                        {idx < agents.length - 1 && (
                          <div className="w-4 h-[1px] bg-slate-700 mx-1" />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </AnimatePresence>
        </div>

        {error && (
          <div className="mx-6 p-4 bg-brand-rose/10 border border-brand-rose/30 text-brand-rose rounded-xl backdrop-blur-md">
            {error}
          </div>
        )}

        <div className="p-4 bg-slate-900/40 border-t border-border-glass backdrop-blur-md">
          <CommandBar onQuerySubmit={handleQuerySubmit} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}

const ChatMessageBubble = ({ msg }: { msg: ChatMessage }) => {
  const isUser = msg.role === 'user';
  const [showReasoning, setShowReasoning] = useState(false);
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start space-x-4 w-full ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-brand-teal to-brand-indigo flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
          <Bot className="w-5 h-5 text-white" />
        </div>
      )}
      
      <div className={`flex flex-col space-y-2 max-w-3xl ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`px-6 py-4 text-[15px] leading-relaxed shadow-xl ${
          isUser 
            ? 'bg-gradient-to-r from-brand-teal/20 to-brand-indigo/20 border border-brand-teal/30 rounded-2xl rounded-tr-sm text-white' 
            : 'bg-surface-glass-hover border border-border-glass rounded-2xl rounded-tl-sm text-slate-200'
        }`}>
          {msg.content}
        </div>
        
        {msg.reasoning && (
          <div className="w-full">
            <button 
              onClick={() => setShowReasoning(!showReasoning)}
              className="flex items-center space-x-2 text-xs font-medium text-slate-400 hover:text-brand-teal transition-colors py-1 px-2 rounded-md hover:bg-white/5"
            >
              {showReasoning ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <span>Model Reasoning</span>
            </button>
            <AnimatePresence>
              {showReasoning && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 p-4 bg-slate-950/50 border border-border-glass rounded-xl text-xs text-slate-300 italic whitespace-pre-wrap font-mono">
                    {msg.reasoning}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        
        {msg.metrics && (
          <div className="mt-2 w-full max-w-2xl bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden shadow-inner">
            <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="text-xs font-semibold text-slate-400">Structured Data Payload</span>
            </div>
            
            {Array.isArray(msg.metrics) && msg.metrics.length > 0 ? (
              <div className="p-4 h-64 border-b border-slate-800/50">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={msg.metrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis 
                      dataKey={Object.keys(msg.metrics[0])[0]} 
                      stroke="#64748b" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="#64748b" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '8px' }}
                      itemStyle={{ color: '#06b6d4' }}
                    />
                    <Bar 
                      dataKey={Object.keys(msg.metrics[0])[1] || Object.keys(msg.metrics[0])[0]} 
                      fill="#06b6d4" 
                      radius={[4, 4, 0, 0]} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : null}

            <div className="p-4 overflow-x-auto max-h-48 no-scrollbar bg-slate-950/50">
              <pre className="text-xs font-mono text-teal-300/80">{JSON.stringify(msg.metrics, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
          <Users className="w-5 h-5 text-slate-400" />
        </div>
      )}
    </motion.div>
  );
};
