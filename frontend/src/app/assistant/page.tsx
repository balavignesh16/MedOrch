"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Bot, Code2, ChevronDown, ChevronUp, Lock, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CommandBar from '@/components/CommandBar';
import { AssistantChart } from '@/components/AssistantChart';
import { chooseChart } from '@/lib/assistantChart';
import type {
  AssistantCapabilitiesFile,
  AssistantCapabilityContext,
  ModelProfileEntry,
  ModelProfilesFile,
} from '@/lib/assistantTypes';
import {
  friendlyErrorMessage,
  resolveInitialContext,
  sanitizePromptParam,
  suggestedPromptsFor,
  unavailabilityReason,
} from '@/lib/assistantContext';

interface StreamEvent {
  summaryText: string;
  visualizationDataJson: string;
  executionStatus: string;
  isFinal: boolean;
  errorCode: string;
  piiDetected: boolean;
  piiRedacted: boolean;
  modelVersion: string;
  executedSql?: string;
}

interface ModelUsageResponse {
  date_utc: string;
  counts: Array<{ model_version: string; request_count: number }>;
  gemini_daily_limit_observed: number;
  note: string;
}

interface VisualizationTable {
  columns?: string[];
  rows?: unknown[][];
  row_count?: number;
  truncated?: boolean;
  source_table?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  isStreaming?: boolean;
  executionStatus?: string;
  errorCode?: string;
  executedSql?: string;
  modelVersion?: string;
  visualization?: VisualizationTable | null;
}

let messageCounter = 0;
function nextId(): string {
  messageCounter += 1;
  return `m-${Date.now()}-${messageCounter}`;
}

function AssistantContent() {
  const searchParams = useSearchParams();
  const requestedContext = searchParams.get('context');
  const prefilledPrompt = sanitizePromptParam(searchParams.get('prompt'));

  const [registry, setRegistry] = useState<AssistantCapabilitiesFile | null>(null);
  const [registryError, setRegistryError] = useState(false);
  const [manualContextId, setManualContextId] = useState<string | null>(null);
  const [modelProfiles, setModelProfiles] = useState<ModelProfileEntry[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [usage, setUsage] = useState<ModelUsageResponse | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [expandedSqlId, setExpandedSqlId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const refreshUsage = () => {
    fetch('/api/assistant/usage')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ModelUsageResponse | null) => {
        if (data) setUsage(data);
      })
      .catch(() => undefined);
  };

  useEffect(() => {
    let cancelled = false;
    fetch('/api/assistant/capabilities')
      .then((res) => {
        if (!res.ok) throw new Error('registry unavailable');
        return res.json();
      })
      .then((data: AssistantCapabilitiesFile) => {
        if (cancelled) return;
        setRegistry(data);
      })
      .catch(() => {
        if (!cancelled) setRegistryError(true);
      });

    fetch('/api/assistant/models')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ModelProfilesFile | null) => {
        if (cancelled || !data) return;
        setModelProfiles(data.profiles);
      })
      .catch(() => undefined);

    refreshUsage();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const contexts = useMemo(() => registry?.contexts ?? [], [registry]);
  const selectedContextId = manualContextId ?? resolveInitialContext(requestedContext, contexts);
  const selectedContext: AssistantCapabilityContext | undefined = contexts.find(
    (context) => context.id === selectedContextId,
  );

  const handleQuery = async (prompt: string) => {
    if (!selectedContext || !selectedContext.available) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const userMessageId = nextId();
    const assistantMessageId = nextId();
    setMessages((prev) => [
      ...prev,
      { id: userMessageId, role: 'user', text: prompt },
      { id: assistantMessageId, role: 'assistant', text: '', isStreaming: true },
    ]);
    setIsLoading(true);

    const updateAssistantMessage = (patch: Partial<ChatMessage>) => {
      setMessages((prev) =>
        prev.map((message) => (message.id === assistantMessageId ? { ...message, ...patch } : message)),
      );
    };

    try {
      const response = await fetch('/api/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          agent_target: selectedContext.id,
          model_profile_id: selectedModelId ?? '',
        }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error('Failed to connect to the analytics service');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          let event: StreamEvent;
          try {
            event = JSON.parse(line.slice(6));
          } catch {
            continue;
          }

          const patch: Partial<ChatMessage> = {
            text: event.summaryText,
            executionStatus: event.executionStatus || '',
            errorCode: event.errorCode || '',
            isStreaming: !event.isFinal,
          };
          if (event.modelVersion) patch.modelVersion = event.modelVersion;
          if (event.executedSql) patch.executedSql = event.executedSql;
          if (event.visualizationDataJson) {
            try {
              const parsed = JSON.parse(event.visualizationDataJson);
              if (parsed && Array.isArray(parsed.columns)) patch.visualization = parsed;
            } catch {
              // ignore malformed visualization payloads
            }
          }
          updateAssistantMessage(patch);
          if (event.isFinal) refreshUsage();
        }
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        updateAssistantMessage({
          text: 'The analytics service is unavailable.',
          executionStatus: 'EXECUTION_STATUS_ERROR',
          isStreaming: false,
        });
      }
    } finally {
      setIsLoading(false);
      updateAssistantMessage({ isStreaming: false });
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col h-full py-8">
      <header className="mb-6">
        <h2 className="text-3xl font-bold text-white tracking-tight">MedOrch Analytics Assistant</h2>
        <p className="text-white/50 text-sm mt-2 max-w-2xl">
          Answers historical, de-identified demonstration encounter data from the bundled
          hospital_readmissions table only. This is not a clinical decision-support system and
          does not provide diagnosis, treatment, billing, staffing, or forecasting capability.
        </p>
      </header>

      <div className="flex gap-3 mb-6 flex-wrap">
        {registryError && (
          <p className="text-sm text-red-400">Assistant capabilities could not be loaded.</p>
        )}
        {contexts.map((context) => {
          const isSelected = context.id === selectedContextId;
          return (
            <button
              key={context.id}
              disabled={!context.available}
              onClick={() => setManualContextId(context.id)}
              title={context.available ? context.description : context.unavailable_reason ?? 'Unavailable'}
              className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors flex items-center gap-2 ${
                isSelected
                  ? 'bg-brand-teal/20 border-brand-teal text-brand-teal'
                  : context.available
                  ? 'bg-surface-obsidian border-white/10 text-white/70 hover:border-brand-teal/40'
                  : 'bg-surface-obsidian/50 border-white/5 text-white/30 cursor-not-allowed'
              }`}
            >
              {!context.available && <Lock className="w-3.5 h-3.5" />}
              {context.display_name}
            </button>
          );
        })}
      </div>

      {modelProfiles.length > 0 && (
        <div className="flex gap-3 mb-6 flex-wrap items-center">
          <span className="text-xs uppercase tracking-widest text-white/40 mr-1">Model</span>
          <button
            onClick={() => setSelectedModelId(null)}
            title="Use the server's default configured model"
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
              selectedModelId === null
                ? 'bg-brand-teal/20 border-brand-teal text-brand-teal'
                : 'bg-surface-obsidian border-white/10 text-white/70 hover:border-brand-teal/40'
            }`}
          >
            Default
          </button>
          {modelProfiles.map((profile) => {
            const isSelected = selectedModelId === profile.id;
            return (
              <button
                key={profile.id}
                onClick={() => setSelectedModelId(profile.id)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-brand-teal/20 border-brand-teal text-brand-teal'
                    : 'bg-surface-obsidian border-white/10 text-white/70 hover:border-brand-teal/40'
                }`}
              >
                {profile.display_name}
              </button>
            );
          })}
          {usage && (
            <span className="text-[11px] text-white/40 ml-2" title={usage.note}>
              {usage.counts.find((c) => c.model_version.startsWith('gemini'))?.request_count ?? 0}
              {' / '}
              {usage.gemini_daily_limit_observed} Gemini calls today (local estimate, not a live quota)
            </span>
          )}
        </div>
      )}

      {selectedContext && !selectedContext.available && (
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm">
          {unavailabilityReason(selectedContext)}
        </div>
      )}

      <div className="flex-1 bg-surface-obsidian border border-white/10 rounded-3xl p-8 shadow-xl flex flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto pr-2 space-y-6 scroll-smooth">
          {messages.length > 0 ? (
            messages.map((message) => (
              <ChatBubble
                key={message.id}
                message={message}
                isSqlExpanded={expandedSqlId === message.id}
                onToggleSql={() => setExpandedSqlId(expandedSqlId === message.id ? null : message.id)}
              />
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
              <div className="w-24 h-24 bg-brand-teal/5 border border-brand-teal/20 rounded-3xl flex items-center justify-center mb-6">
                <Bot className="w-10 h-10 text-brand-teal" />
              </div>
              <p className="text-white/50 mb-8 text-sm">
                Select a context above, then ask a question or choose a suggested prompt below.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {suggestedPromptsFor(selectedContext).map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleQuery(prompt)}
                    disabled={!selectedContext?.available}
                    className="bg-surface-obsidian border border-white/10 hover:border-brand-teal/40 text-left p-4 rounded-2xl transition-all text-sm text-white/80 disabled:opacity-40"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 mt-4">
          <CommandBar
            onQuery={handleQuery}
            isLoading={isLoading}
            placeholder={selectedContext?.suggested_prompts?.[0]}
            initialQuery={prefilledPrompt}
          />
        </div>
      </div>
    </div>
  );
}

function ChatBubble({
  message,
  isSqlExpanded,
  onToggleSql,
}: {
  message: ChatMessage;
  isSqlExpanded: boolean;
  onToggleSql: () => void;
}) {
  if (message.role === 'user') {
    return (
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4 justify-end">
        <div className="max-w-2xl rounded-3xl rounded-tr-none bg-brand-teal/15 border border-brand-teal/30 px-5 py-3 text-sm text-white/90">
          {message.text}
        </div>
        <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
          <User className="w-5 h-5 text-white/60" />
        </div>
      </motion.div>
    );
  }

  const isTerminalError =
    message.executionStatus === 'EXECUTION_STATUS_ERROR' ||
    message.executionStatus === 'EXECUTION_STATUS_REJECTED' ||
    message.executionStatus === 'EXECUTION_STATUS_TIMEOUT';
  const isUnsupported = message.executionStatus === 'EXECUTION_STATUS_UNSUPPORTED';
  const displayText = message.errorCode
    ? friendlyErrorMessage(message.errorCode, message.text)
    : message.text;
  const chartSpec = chooseChart(message.visualization?.columns, message.visualization?.rows);

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4">
      <div className="w-10 h-10 rounded-2xl bg-brand-teal/10 border border-brand-teal/30 flex items-center justify-center shrink-0">
        <Bot className="w-5 h-5 text-brand-teal" />
      </div>
      <div className="flex-1 space-y-4 min-w-0">
        {message.executedSql && (
          <div className="bg-surface-black border border-white/10 rounded-2xl overflow-hidden">
            <button
              onClick={onToggleSql}
              className="w-full flex items-center justify-between px-5 py-3 text-brand-teal text-xs font-bold uppercase tracking-widest"
            >
              <span className="flex items-center gap-2"><Code2 className="w-4 h-4" /> Executed SQL (validated, read-only)</span>
              {isSqlExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {isSqlExpanded && (
              <pre className="p-4 text-[13px] text-white/80 font-mono whitespace-pre-wrap border-t border-white/5">
                {message.executedSql}
              </pre>
            )}
          </div>
        )}

        <div
          className={`rounded-2xl rounded-tl-none p-6 text-sm leading-relaxed border ${
            isTerminalError
              ? 'bg-red-500/5 border-red-500/30 text-red-200'
              : isUnsupported
              ? 'bg-amber-500/5 border-amber-500/30 text-amber-200'
              : 'bg-surface-black border-white/10 text-white/80'
          }`}
        >
          <div className="prose prose-invert prose-sm max-w-none prose-p:my-2 prose-headings:my-2">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayText || ' '}</ReactMarkdown>
          </div>
          {message.isStreaming && (
            <span className="inline-block w-2 h-4 bg-brand-teal animate-pulse ml-2 align-middle" />
          )}
          {message.errorCode && (
            <p className="mt-3 text-[11px] uppercase tracking-widest opacity-60">Code: {message.errorCode}</p>
          )}
          {message.modelVersion && (
            <p className="mt-2 text-[11px] uppercase tracking-widest opacity-40">Model: {message.modelVersion}</p>
          )}
        </div>

        {chartSpec && <AssistantChart spec={chartSpec} />}

        {message.visualization?.rows && message.visualization.columns && (
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-sm text-left text-white/70">
              <thead className="bg-surface-black text-white/50 uppercase text-xs">
                <tr>
                  {message.visualization.columns.map((col) => (
                    <th key={col} className="px-4 py-2">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {message.visualization.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-t border-white/5">
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-2 font-mono">{String(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {message.visualization.truncated && (
              <p className="text-[11px] text-white/40 px-4 py-2">Results truncated for display.</p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function AssistantPage() {
  return (
    <Suspense fallback={null}>
      <AssistantContent />
    </Suspense>
  );
}
