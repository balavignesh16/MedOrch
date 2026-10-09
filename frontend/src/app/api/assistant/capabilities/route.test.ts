import { describe, expect, it } from 'vitest';
import { GET } from './route';

describe('GET /api/assistant/capabilities', () => {
  it('serves the shared registry with the expected contexts', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    const ids = body.contexts.map((context: { id: string }) => context.id);
    expect(ids).toEqual(expect.arrayContaining(['general', 'clinical', 'operations', 'billing']));
  });

  it('marks the billing context unavailable', async () => {
    const response = await GET();
    const body = await response.json();
    const billing = body.contexts.find((context: { id: string }) => context.id === 'billing');
    expect(billing.available).toBe(false);
    expect(billing.unavailable_reason).toBeTruthy();
  });

  it('every suggested prompt belongs to an available context or is empty for unavailable ones', async () => {
    const response = await GET();
    const body = await response.json();
    for (const context of body.contexts) {
      if (!context.available) {
        expect(context.suggested_prompts).toEqual([]);
      }
    }
  });
});
