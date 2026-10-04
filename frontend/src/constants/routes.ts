export interface AppRouteInfo {
  id: string;
  path: string;
  label: string;
  permissions: string[];
}

export const APP_ROUTES: AppRouteInfo[] = [
  { id: 'profile', path: '/profile', label: 'My Profile', permissions: [] },
  { id: 'dashboard', path: '/dashboard', label: 'Dashboard', permissions: ['dashboard:view'] },
  { id: 'projects', path: '/projects', label: 'Projects', permissions: ['projects:view'] },
  { id: 'notes', path: '/notes', label: 'Notes', permissions: ['notes:view'] },
  { id: 'chat', path: '/chat', label: 'Group Chat', permissions: ['chat:manage'] },
  { id: 'reports', path: '/reports', label: 'Reports', permissions: ['reports:view'] },
  { id: 'roster', path: '/roster', label: 'Employee Roster', permissions: ['rosters:view'] },
  { id: 'attendance', path: '/attendance', label: 'Attendance Check-In', permissions: ['attendance:view'] },
  { id: 'departments', path: '/departments', label: 'Departments', permissions: ['departments:view'] },
  { id: 'leave', path: '/leave', label: 'Leave Management', permissions: ['leaves:view'] },
  { id: 'onboarding', path: '/onboarding', label: 'Employee Onboarding', permissions: ['onboarding:manage'] },
  { id: 'offboarding', path: '/offboarding', label: 'Exit / Offboarding', permissions: ['offboarding:view'] },
  { id: 'recruitment', path: '/recruitment', label: 'Recruitment & Job Apps', permissions: ['recruitment:view'] },
  { id: 'team', path: '/users', label: 'User Management', permissions: ['users:view'] },
  { id: 'roles', path: '/roles', label: 'Roles & Permissions', permissions: ['roles:view'] },
  { id: 'permissions', path: '/permissions', label: 'Permission Catalog', permissions: ['roles:view'] },
];

export const routeByTab: Record<string, AppRouteInfo> = Object.fromEntries(
  APP_ROUTES.map((r) => [r.id, r]),
);

export interface RouteTitlePattern {
  pattern: RegExp;
  title: string;
}

// Dynamic / public routes that are not part of APP_ROUTES (checked in order)
export const ROUTE_TITLE_PATTERNS: RouteTitlePattern[] = [
  { pattern: /^\/reset-password\/[a-f0-9]{64}$/, title: 'Reset Password' },
  { pattern: /^\/invite\/[a-f0-9]{64}$/, title: 'Accept Invitation' },
  { pattern: /^\/onboarding\/decision\/[a-f0-9]{64}$/, title: 'Onboarding Decision' },
  { pattern: /^\/projects\/[^/]+\/tasks\/[^/]+$/, title: 'Task Details' },
  { pattern: /^\/projects\/[^/]+\/board$/, title: 'Project Board' },
  { pattern: /^\/projects\/[^/]+$/, title: 'Project Details' },
];

export function resolveRouteTitle(pathname: string): string | null {
  for (const { pattern, title } of ROUTE_TITLE_PATTERNS) {
    if (pattern.test(pathname)) return title;
  }
  return null;
}
