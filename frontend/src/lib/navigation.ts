export type Role = 'admin' | 'doctor' | 'billing';

export type NavIcon =
  | 'home' | 'population' | 'quality' | 'operations' | 'financial' | 'administration'
  | 'strategy' | 'predictive' | 'research' | 'dataQuality' | 'report' | 'assistant';

export interface NavLink {
  name: string;
  href: string;
  icon: NavIcon;
  roles: Role[];
  /** Page built on values the dataset cannot support; shown only in demo mode. */
  demoOnly?: boolean;
}

export const NAV_LINKS: NavLink[] = [
  { name: 'Enterprise Home', href: '/', icon: 'home', roles: ['admin', 'doctor', 'billing'] },
  { name: 'Population Health', href: '/population', icon: 'population', roles: ['admin', 'doctor', 'billing'] },
  { name: 'Clinical Quality', href: '/quality', icon: 'quality', roles: ['admin', 'doctor'] },
  { name: 'Operational Intelligence', href: '/operations', icon: 'operations', roles: ['admin', 'billing'] },
  { name: 'Financial Intelligence', href: '/financial', icon: 'financial', roles: ['admin', 'billing'] },
  { name: 'Administration', href: '/administration', icon: 'administration', roles: ['admin'], demoOnly: true },
  { name: 'Strategy & Decision Hub', href: '/strategy', icon: 'strategy', roles: ['admin'] },
  { name: 'Predictive Analytics', href: '/predictive', icon: 'predictive', roles: ['admin', 'doctor', 'billing'] },
  { name: 'Research & Statistics', href: '/research', icon: 'research', roles: ['admin', 'doctor', 'billing'] },
  { name: 'Data Quality', href: '/data-quality', icon: 'dataQuality', roles: ['admin', 'doctor', 'billing'] },
  { name: 'Analysis Report', href: '/report', icon: 'report', roles: ['admin', 'doctor', 'billing'] },
  { name: 'Analytics Assistant', href: '/assistant', icon: 'assistant', roles: ['admin', 'doctor', 'billing'] },
];

export function visibleNavLinks(role: string | null | undefined, demoMode: boolean): NavLink[] {
  return NAV_LINKS.filter((link) => (!link.demoOnly || demoMode) && (!role || link.roles.includes(role as Role)));
}
