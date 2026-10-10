import { describe, expect, it } from 'vitest';
import { NAV_LINKS, visibleNavLinks } from './navigation';

describe('visibleNavLinks', () => {
  it('hides demo-only pages unless demo mode is on', () => {
    expect(visibleNavLinks('admin', false).map((l) => l.href)).not.toContain('/administration');
    expect(visibleNavLinks('admin', true).map((l) => l.href)).toContain('/administration');
  });

  it('only marks Administration as demo-only', () => {
    expect(NAV_LINKS.filter((l) => l.demoOnly).map((l) => l.href)).toEqual(['/administration']);
  });

  it('filters by role, and shows everything permitted before the role is known', () => {
    const doctor = visibleNavLinks('doctor', true).map((l) => l.href);
    expect(doctor).toContain('/quality');
    expect(doctor).not.toContain('/operations');
    expect(visibleNavLinks(null, false).length).toBe(NAV_LINKS.length - 1);
  });

  it('every link has a unique href', () => {
    expect(new Set(NAV_LINKS.map((l) => l.href)).size).toBe(NAV_LINKS.length);
  });
});
