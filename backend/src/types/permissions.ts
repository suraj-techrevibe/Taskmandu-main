export interface Permission {
  id: string;
  label: string;
  module: string;
}

export const PERMISSION_CATALOG: Permission[] = [
  { id: 'dashboard:view', label: 'View Dashboard', module: 'Dashboard' },
  { id: 'users:view', label: 'View Users', module: 'User Management' },
  { id: 'users:invite', label: 'Invite Users', module: 'User Management' },
  { id: 'users:update', label: 'Update Users', module: 'User Management' },
  { id: 'users:delete', label: 'Delete Users', module: 'User Management' },
  { id: 'roles:view', label: 'View Roles & Permissions', module: 'Roles & Permissions' },
  { id: 'roles:create', label: 'Create Roles', module: 'Roles & Permissions' },
  { id: 'roles:update', label: 'Update Roles & Permissions', module: 'Roles & Permissions' },
  { id: 'roles:delete', label: 'Delete Roles', module: 'Roles & Permissions' },
  { id: 'employees:view', label: 'View Employees', module: 'Employees' },
  { id: 'employees:create', label: 'Create Employees', module: 'Employees' },
  { id: 'employees:update', label: 'Update Employees', module: 'Employees' },
  { id: 'employees:delete', label: 'Delete Employees', module: 'Employees' },
  { id: 'attendance:view', label: 'View Attendance', module: 'Attendance' },
  { id: 'attendance:manage', label: 'Manage Attendance', module: 'Attendance' },
  { id: 'tasks:view', label: 'View Tasks', module: 'Tasks' },
  { id: 'tasks:create', label: 'Create Tasks', module: 'Tasks' },
  { id: 'tasks:update', label: 'Update Tasks', module: 'Tasks' },
  { id: 'tasks:delete', label: 'Delete Tasks', module: 'Tasks' },
  { id: 'leaves:view', label: 'View Leaves', module: 'Leaves' },
  { id: 'leaves:approve', label: 'Approve / Reject Leaves', module: 'Leaves' },
  { id: 'rosters:view', label: 'View Rosters', module: 'Rosters' },
  { id: 'rosters:manage', label: 'Manage Rosters', module: 'Rosters' },
  { id: 'onboarding:manage', label: 'Manage Onboarding', module: 'Onboarding' },
  { id: 'offboarding:view', label: 'View Offboarding', module: 'Offboarding' },
  { id: 'offboarding:manage', label: 'Manage Offboarding', module: 'Offboarding' },
  { id: 'recruitment:view', label: 'View Recruitment', module: 'Recruitment' },
  { id: 'recruitment:manage', label: 'Manage Recruitment', module: 'Recruitment' },
  { id: 'reports:view', label: 'View Reports', module: 'Reports' },
  { id: 'reports:export', label: 'Export Reports', module: 'Reports' },
  { id: 'notes:view', label: 'View Notes', module: 'Notes' },
  { id: 'notes:manage', label: 'Manage Notes', module: 'Notes' },
  { id: 'chat:manage', label: 'Manage Group Chat', module: 'Group Chat' },
  { id: 'notifications:manage', label: 'Manage Notifications', module: 'Notifications' },
  { id: 'departments:view', label: 'View Departments', module: 'Departments' },
  { id: 'departments:manage', label: 'Manage Departments', module: 'Departments' },
  { id: 'projects:view', label: 'View Projects', module: 'Projects' },
  { id: 'projects:create', label: 'Create Projects', module: 'Projects' },
  { id: 'projects:update', label: 'Update Projects', module: 'Projects' },
  { id: 'projects:delete', label: 'Delete Projects', module: 'Projects' },
  { id: 'projects:manage', label: 'Manage All Projects (bypass ownership)', module: 'Projects' },
  { id: 'tasks:manage', label: 'Manage All Tasks (bypass ownership)', module: 'Tasks' },
];

export const ALL_PERMISSIONS: string[] = PERMISSION_CATALOG.map((p) => p.id);

export const PERMISSIONS_BY_MODULE: Record<string, Permission[]> = PERMISSION_CATALOG.reduce(
  (acc, permission) => {
    (acc[permission.module] ??= []).push(permission);
    return acc;
  },
  {} as Record<string, Permission[]>,
);

export function isValidPermission(id: string): boolean {
  return PERMISSION_CATALOG.some((p) => p.id === id);
}
