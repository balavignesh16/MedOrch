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

// Same pattern as above, for config/model_profiles.json. Empty string is
// also valid — it means "use the engine's default model" (unchanged
// pre-model-switcher behavior).
function loadAllowedModelProfileIds(): Set<string> {
  try {
    const registryPath = path.resolve(process.cwd(), '../config/model_profiles.json');
    const raw = readFileSync(registryPath, 'utf-8');
    const parsed = JSON.parse(raw) as { profiles?: Array<{ id?: string }> };
    const ids = (parsed.profiles ?? [])
      .map((profile) => profile.id)
      .filter((id): id is string => typeof id === 'string');
    if (ids.length > 0) return new Set(ids);
  } catch {
    // fall through to the safe default below
  }
  console.error('model_profiles.json could not be read; model switching will be unavailable');
  return new Set();
}

export const ALLOWED_MODEL_PROFILE_IDS = loadAllowedModelProfileIds();

export interface ValidAnalyticsRequest {
  prompt: string;
  agentTarget: string;
  modelProfileId: string;
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
  const modelProfileId = typeof candidate.model_profile_id === 'string'
    ? candidate.model_profile_id
    : '';

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
  // Empty string is always valid: it means "use the engine's default
  // model" (unchanged pre-model-switcher behavior). A non-empty value
  // must be a real profile id — an unrecognized one is rejected here
  // rather than silently forwarded, same reasoning as agent targets.
  if (modelProfileId && !ALLOWED_MODEL_PROFILE_IDS.has(modelProfileId)) {
    return { ok: false, error: 'Unknown model profile' };
  }
  return { ok: true, value: { prompt, agentTarget, modelProfileId } };
}
