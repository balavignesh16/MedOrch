import { describe, expect, it } from 'vitest';
import { PAGE_INDEX, searchPages } from './searchEngine';

describe('page search index', () => {
  it('finds pages by title, module, or keyword', () => {
    expect(searchPages('hba1c').map((r) => r.url)).toContain('/research');
    expect(searchPages('fairness').map((r) => r.url)).toContain('/predictive');
    expect(searchPages('Data Quality').map((r) => r.url)).toContain('/data-quality');
    expect(searchPages('insulin').some((r) => r.title === 'Medication patterns')).toBe(true);
  });

  it('returns nothing for blank or unmatched queries', () => {
    expect(searchPages('')).toEqual([]);
    expect(searchPages('   ')).toEqual([]);
    expect(searchPages('zzzz-no-such-thing')).toEqual([]);
  });

  it('only links to real application routes', () => {
    const routes = new Set(['/', '/strategy', '/operations', '/population', '/quality', '/financial', '/predictive', '/research', '/data-quality', '/report', '/assistant']);
    for (const entry of PAGE_INDEX) expect(routes.has(entry.url)).toBe(true);
  });

  it('contains no figures, scores, or capacity claims that could go stale or be invented', () => {
    for (const entry of PAGE_INDEX) {
      expect(`${entry.title} ${entry.module} ${entry.keywords.join(' ')}`).not.toMatch(/\d+(\.\d+)?\s*(%|d\b|pts)|current:|utilized|capacity warning/i);
    }
  });
});
