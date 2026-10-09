// Legacy cosmetic agent routes, replaced by the unified /assistant route
// with a selectable context (see config/assistant_capabilities.json).
// Each legacy path maps to the closest matching context; routes with no
// direct equivalent (predictive_analytics, cyber_grc, patient_navigation)
// fall back to "general" rather than pretending an unavailable capability
// still exists under a new name.
export const LEGACY_AGENT_CONTEXTS: Record<string, string> = {
  clinical_triage: 'clinical',
  resource_optimization: 'operations',
  billing: 'billing',
  predictive_analytics: 'general',
  cyber_grc: 'general',
  patient_navigation: 'general',
};

export interface LegacyRedirect {
  source: string;
  destination: string;
  permanent: boolean;
}

export function buildLegacyAgentRedirects(): LegacyRedirect[] {
  return Object.entries(LEGACY_AGENT_CONTEXTS).map(([legacyPath, context]) => ({
    source: `/agents/${legacyPath}`,
    destination: `/assistant?context=${context}`,
    permanent: false,
  }));
}
