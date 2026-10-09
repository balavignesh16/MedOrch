import { readFileSync } from 'fs';
import path from 'path';

export const MAX_PROMPT_LENGTH = 4_000;

// Derived from config/assistant_capabilities.json rather than duplicated
// here, so adding a context to the registry (as happened when the
// "predictive" context was added) can never silently desync from what this
// route accepts. Includes contexts the registry marks unavailable (e.g.
// "billing") deliberately, so the request reaches the engine and gets a
// proper capability-aware CONTEXT_UNAVAILABLE explanation instead of being
// rejected at this layer. Read once at module load — this file changes only
// on deploy, not per-request. Falls back to a minimal safe set if the
// registry can't be read, rather than crashing request validation.
function loadAllowedAgentTargets(): Set<string> {
  try {
    const registryPath = path.resolve(process.cwd(), '../config/assistant_capabilities.json');
    const raw = readFileSync(registryPath, 'utf-8');
    const parsed = JSON.parse(raw) as { contexts?: Array<{ id?: string }> };
    const ids = (parsed.contexts ?? [])
      .map((context) => context.id)
      .filter((id): id is string => typeof id === 'string');
    if (ids.length > 0) return new Set(ids);
  } catch {
    // fall through to the safe default below
  }
  console.error('assistant_capabilities.json could not be read; falling back to a minimal allowlist');
  return new Set(['general']);
}

export const ALLOWED_AGENT_TARGETS = loadAllowedAgentTargets();

export interface ValidAnalyticsRequest {
  prompt: string;
  agentTarget: string;
}

export type AnalyticsRequestValidation =
  | { ok: true; value: ValidAnalyticsRequest }
  | { ok: false; error: string };

export function validateAnalyticsRequest(body: unknown): AnalyticsRequestValidation {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object' };
  }

  const candidate = body as Record<string, unknown>;
  const prompt = typeof candidate.prompt === 'string' ? candidate.prompt.trim() : '';
  const agentTarget = typeof candidate.agent_target === 'string'
    ? candidate.agent_target
    : 'general';

  if (!prompt) return { ok: false, error: 'Prompt must not be empty' };
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return {
      ok: false,
      error: `Prompt must be ${MAX_PROMPT_LENGTH} characters or fewer`,
    };
  }
  if (!ALLOWED_AGENT_TARGETS.has(agentTarget)) {
    return { ok: false, error: 'Unknown agent target' };
  }
  return { ok: true, value: { prompt, agentTarget } };
}
