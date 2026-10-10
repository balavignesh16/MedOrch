import { describe, expect, it } from 'vitest';
import { GET } from './route';

describe('GET /api/assistant/models', () => {
  it('serves the shared model-profile registry', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    const ids = body.profiles.map((profile: { id: string }) => profile.id);
    expect(ids).toEqual(['qwen2.5-14b', 'llama3.1-8b', 'gemini-flash']);
  });

  it('every profile has a display name and provider', async () => {
    const response = await GET();
    const body = await response.json();
    for (const profile of body.profiles) {
      expect(profile.display_name).toBeTruthy();
      expect(['ollama', 'gemini']).toContain(profile.provider);
    }
  });
});
