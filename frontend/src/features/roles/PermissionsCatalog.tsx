import { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  Eye,
  FileOutput,
  KeyRound,
  Loader2,
  MailPlus,
  Pencil,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { getPermissionCatalog } from '../../services/access';
import type { PermissionDef } from '../../types';

const PERMISSION_ACTION_STYLES: Record<string, string> = {
  view: 'bg-sky-50 text-sky-700 border-sky-200',
  read: 'bg-sky-50 text-sky-700 border-sky-200',
  create: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  add: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  update: 'bg-amber-50 text-amber-700 border-amber-200',
  edit: 'bg-amber-50 text-amber-700 border-amber-200',
  delete: 'bg-rose-50 text-rose-700 border-rose-200',
  remove: 'bg-rose-50 text-rose-700 border-rose-200',
  invite: 'bg-violet-50 text-violet-700 border-violet-200',
  approve: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  assign: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  generate: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  manage: 'bg-teal-50 text-teal-700 border-teal-200',
};

function permissionStyle(permissionId: string): string {
  const action = permissionId.split(':')[1]?.toLowerCase() ?? '';
  return PERMISSION_ACTION_STYLES[action] ?? 'bg-slate-100 text-slate-600 border-slate-200';
}

function permissionIcon(permissionId: string) {
  const action = permissionId.split(':')[1]?.toLowerCase() ?? '';
  switch (action) {
    case 'view':
    case 'read':
      return Eye;
    case 'create':
    case 'add':
      return Plus;
    case 'update':
    case 'edit':
      return Pencil;
    case 'delete':
    case 'remove':
      return Trash2;
    case 'invite':
      return MailPlus;
    case 'approve':
      return BadgeCheck;
    case 'assign':
      return UserCheck;
    case 'generate':
      return FileOutput;
    case 'manage':
      return Settings2;
    default:
      return KeyRound;
  }
}

export default function PermissionsCatalog() {
  const [catalog, setCatalog] = useState<PermissionDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void getPermissionCatalog()
      .then((permissions) => {
        if (!cancelled) setCatalog(permissions);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const modules = useMemo(() => {
    const filtered = query.trim()
      ? catalog.filter(
          (p) =>
            p.label.toLowerCase().includes(query.toLowerCase()) ||
            p.id.toLowerCase().includes(query.toLowerCase()) ||
            p.module.toLowerCase().includes(query.toLowerCase()),
        )
      : catalog;
    return filtered.reduce<Record<string, PermissionDef[]>>((acc, permission) => {
      (acc[permission.module] ??= []).push(permission);
      return acc;
    }, {});
  }, [catalog, query]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-slate-900 tracking-tight">Permission Catalog</h3>
          <p className="text-[11px] text-slate-400 font-bold mt-0.5">
            Every permission the app recognizes, grouped by module.
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search permissions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full sm:w-64 bg-slate-50 border border-slate-100 pl-9 pr-3 py-2 rounded-xl text-[11px] font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-teal-500 transition"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 flex flex-col items-center justify-center gap-3 shadow-xs">
          <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
          <p className="text-xs font-bold text-slate-400">Loading permission catalog…</p>
        </div>
      ) : Object.keys(modules).length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 flex flex-col items-center justify-center gap-3 shadow-xs">
          <ShieldCheck className="w-8 h-8 text-slate-300" />
          <p className="text-xs font-bold text-slate-400">No permissions match your search.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {Object.entries(modules).map(([moduleName, permissions]) => (
            <div key={moduleName} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-black text-slate-900 uppercase tracking-wider">{moduleName}</p>
                <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                  {permissions.length} permission{permissions.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                {permissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-center gap-2.5 border rounded-xl px-3 py-2.5 bg-slate-50/50"
                  >
                    <span className={`h-8 w-8 shrink-0 rounded-lg border flex items-center justify-center ${permissionStyle(permission.id)}`}>
                      {(() => {
                        const Icon = permissionIcon(permission.id);
                        return <Icon className="w-3.5 h-3.5" />;
                      })()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-extrabold text-slate-800 truncate">{permission.label}</p>
                      <code className={`inline-block text-[9px] font-bold rounded px-1.5 py-0.5 border ${permissionStyle(permission.id)}`}>
                        {permission.id}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
