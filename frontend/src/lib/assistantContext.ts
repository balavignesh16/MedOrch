import type { AssistantCapabilityContext } from './assistantTypes';

/** Resolve which context should be selected initially: the one named in
 * the URL if it exists in the registry, otherwise "general". */
export function resolveInitialContext(
  requestedContextId: string | null,
  contexts: AssistantCapabilityContext[],
): string {
  if (requestedContextId && contexts.some((context) => context.id === requestedContextId)) {
    return requestedContextId;
  }
  return 'general';
}

export function isContextSelectable(context: AssistantCapabilityContext | undefined): boolean {
  return context?.available === true;
}

export function suggestedPromptsFor(context: AssistantCapabilityContext | undefined): string[] {
  if (!context || !context.available) return [];
  return context.suggested_prompts;
}

export function unavailabilityReason(context: AssistantCapabilityContext | undefined): string {
  if (!context) return 'Unknown analytics context.';
  return context.unavailable_reason ?? 'This context has no supported data source.';
}

/**
 * Maps a stable error code to actionable, user-safe guidance. Never
 * includes raw exception text, stack traces, or model output — those stay
 * server-side. Falls back to the server-provided message when the code is
 * unrecognized rather than guessing.
 */
export function friendlyErrorMessage(errorCode: string, fallback: string): string {
  switch (errorCode) {
    case 'UNKNOWN_CONTEXT':
      return 'That analytics context is not recognized. Try selecting one of the tabs above.';
    case 'CONTEXT_UNAVAILABLE':
      return fallback;
    case 'UNSUPPORTED_REQUEST':
      return fallback;
    case 'INVALID_MODEL_OUTPUT':
      return 'The assistant could not turn this into a valid query. Try rephrasing it more simply, pick one of the suggested questions, or try again — this can happen occasionally with local models.';
    case 'UNSAFE_SQL':
      return 'The generated query did not pass the safety checks for this dataset, so nothing was run (the assistant already retried once). Try asking for a count, average or rate by one column, or pick one of the suggested questions.';
    case 'QUERY_TIMEOUT':
      return 'The query took too long to run against the historical dataset. Try a narrower question.';
    case 'MODEL_TIMEOUT':
      return 'The assistant took too long to respond. Try again, ask a shorter question, or choose a different model above.';
    case 'MODEL_UNAVAILABLE':
      return fallback;
    case 'MODEL_SERVICE_ERROR':
      return fallback;
    case 'MODEL_RATE_LIMITED':
      return fallback;
    case 'GROUNDING_FAILED':
      return 'The assistant could not verify its answer against the actual query results, so nothing was shown. Try again.';
    case 'IDENTIFIER_EXPOSURE':
      return 'The response was blocked because it could have exposed a protected identifier.';
    case 'INTERNAL_ERROR':
      return 'Something went wrong on the server while answering this. Try again; if it keeps happening, restart the services (stop.bat, then start.bat).';
    case 'AUDIT_FAILURE':
      return 'Your request completed, but its audit record could not be saved.';
    default:
      return fallback;
  }
}

export const MAX_PREFILL_PROMPT_LENGTH = 300;

/** Validates a ?prompt= URL parameter. The result only pre-fills the input
 * box; it is never sent automatically, and carries no hidden instructions. */
export function sanitizePromptParam(raw: string | null | undefined): string {
  if (!raw) return '';
  const cleaned = Array.from(raw, (char) => (char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127 ? ' ' : char))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.slice(0, MAX_PREFILL_PROMPT_LENGTH);
}

export function buildAssistantLink(prompt: string, contextId = 'general'): string {
  const params = new URLSearchParams({ context: contextId, prompt: sanitizePromptParam(prompt) });
  return `/assistant?${params.toString()}`;
}
