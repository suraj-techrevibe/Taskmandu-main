import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';

interface PermissionGateProps {
  permissions: string[];
  effectivePermissions: string[];
  children: React.ReactNode;
}

export default function PermissionGate({
  permissions,
  effectivePermissions,
  children,
}: PermissionGateProps) {
  const navigate = useNavigate();
  const allowed = permissions.some((p) => effectivePermissions.includes(p));

  if (!allowed) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-12 flex flex-col items-center justify-center text-center gap-4 shadow-xs">
        <div className="h-14 w-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
          <Shield className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-black text-slate-900">Access Denied</p>
          <p className="text-xs text-slate-500 font-semibold">
            Your role does not include the permission required to view this page.
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-teal-800 text-white text-xs font-black rounded-xl hover:bg-teal-900 transition cursor-pointer"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
