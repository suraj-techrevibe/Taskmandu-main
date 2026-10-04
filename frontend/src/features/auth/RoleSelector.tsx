import React from 'react';
import { Role } from '../../types';
import { Shield, User, Users, Briefcase, Award } from 'lucide-react';

interface RoleSelectorProps {
  currentRole: Role;
  onChangeRole: (role: Role) => void;
}

export default function RoleSelector({ currentRole, onChangeRole }: RoleSelectorProps) {
  const roles: { name: Role; label: string; icon: React.ReactNode; color: string; desc: string }[] = [
    {
      name: 'Super Admin',
      label: 'Super Admin',
      icon: <Shield className="w-4 h-4" />,
      color: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
      desc: 'System configuration, master user permissions, and global metrics.'
    },
    {
      name: 'HR',
      label: 'HR Admin',
      icon: <Users className="w-4 h-4" />,
      color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
      desc: 'Onboarding profiles, offboarding exit clearance, documents checklist.'
    },
    {
      name: 'Manager',
      label: 'Manager',
      icon: <Briefcase className="w-4 h-4" />,
      color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
      desc: 'Shift assignments, roster scheduler, employee performance reviews.'
    },
    {
      name: 'Team Lead',
      label: 'Team Lead',
      icon: <Award className="w-4 h-4" />,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
      desc: 'Daily task creation, progress tracking, and team attendance review.'
    },
    {
      name: 'Employee',
      label: 'Employee (Alex Rivera)',
      icon: <User className="w-4 h-4" />,
      color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
      desc: 'Personal dashboard, GPS Check-In/Out, schedules, and active tasks.'
    }
  ];

  const activeRoleInfo = roles.find((r) => r.name === currentRole);

  return (
    <div className="bg-white border-b border-gray-100 py-3 px-6 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">Workspace Simulator Mode</h1>
            <p className="text-xs text-gray-500">Toggle roles to inspect specific RBAC permissions and layouts.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {roles.map((role) => {
            const isActive = currentRole === role.name;
            return (
              <button
                key={role.name}
                id={`role-btn-${role.name.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => onChangeRole(role.name)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs scale-102 font-semibold'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {role.icon}
                <span>{role.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-dashed border-gray-100 flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Active Role Scope:</span>
        <span className="text-xs text-gray-600 font-medium">
          {activeRoleInfo?.desc}
        </span>
      </div>
    </div>
  );
}
