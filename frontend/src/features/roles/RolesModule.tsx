import { useCallback, useEffect, useState } from 'react';
import {
  BadgeCheck,
  Eye,
  FileOutput,
  KeyRound,
  Loader2,
  MailPlus,
  Pencil,
  Plus,
  Settings2,
  Shield,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { createRole, deleteRole, getPermissionCatalog, listRoles, updateRole } from '../../services/access';
import type { PermissionDef, RoleDef } from '../../types';
import { toast } from '../../services/toast';

interface RolesModuleProps {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

interface RoleForm {
  id?: string;
  name: string;
  description: string;
  permissions: string[];
}

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

export default function RolesModule({ canCreate, canUpdate, canDelete }: RolesModuleProps) {
  const [roles, setRoles] = useState<RoleDef[]>([]);
  const [catalog, setCatalog] = useState<PermissionDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<RoleForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [roleList, permissionList] = await Promise.all([listRoles(), getPermissionCatalog()]);
      setRoles(roleList);
      setCatalog(permissionList);
    } catch {
      // Global error toast handles messaging
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const modules = catalog.reduce<Record<string, PermissionDef[]>>((acc, permission) => {
    (acc[permission.module] ??= []).push(permission);
    return acc;
  }, {});

  const togglePermission = (permissionId: string) => {
    if (!form) return;
    setForm({
      ...form,
      permissions: form.permissions.includes(permissionId)
        ? form.permissions.filter((p) => p !== permissionId)
        : [...form.permissions, permissionId],
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (!form.name.trim()) {
      toast.error('Role name is required');
      return;
    }
    setSaving(true);
    try {
      if (form.id) {
        await updateRole(form.id, { name: form.name.trim(), description: form.description.trim(), permissions: form.permissions });
        toast.success(`Role "${form.name}" updated`);
      } else {
        await createRole({ name: form.name.trim(), description: form.description.trim(), permissions: form.permissions });
        toast.success(`Role "${form.name}" created`);
      }
      setForm(null);
      void load();
    } catch {
      // Global error toast handles messaging
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (role: RoleDef) => {
    setDeletingId(role._id);
    try {
      await deleteRole(role._id);
      toast.success(`Role "${role.name}" deleted`);
      setRoles((prev) => prev.filter((r) => r._id !== role._id));
    } catch {
      // Global error toast handles messaging
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-slate-900 tracking-tight">Roles & Permissions</h3>
          <p className="text-[11px] text-slate-400 font-bold mt-0.5">Define who can do what. Modules render from each role's permission set.</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setForm({ name: '', description: '', permissions: [] })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-black transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Role
          </button>
        )}
      </div>

      {/* Permission catalog */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-xs p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-teal-700" />
          <span className="text-xs font-black text-slate-800 uppercase tracking-wide">Permission Catalog</span>
          <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md ml-auto">{catalog.length} permissions</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {Object.entries(modules).map(([moduleName, permissions]) => (
            <div key={moduleName} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2.5">{moduleName}</p>
              <div className="flex flex-wrap gap-1.5">
                {permissions.map((permission) => (
                  <span
                    key={permission.id}
                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-bold ${permissionStyle(permission.id)}`}
                    title={permission.id}
                  >
                    {(() => {
                      const Icon = permissionIcon(permission.id);
                      return <Icon className="w-3 h-3" />;
                    })()}
                    {permission.label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Roles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {roles.map((role, index) => (
          <div key={role._id} className="bg-white border border-slate-100 rounded-2xl shadow-xs p-5 flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-slate-900">{role.name}</h4>
                  {role.isSystem && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-400 text-[9px] font-black uppercase tracking-wider">
                      System
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 font-bold mt-1 leading-relaxed">{role.description || 'No description'}</p>
                <p className="text-[10px] text-slate-400 font-black mt-1.5">
                  {role.userCount} user{role.userCount === 1 ? '' : 's'} • {role.permissions.length} permissions
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {canUpdate && (
                  <button
                    onClick={() => setForm({ id: role._id, name: role.name, description: role.description, permissions: role.permissions })}
                    className="p-2 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition cursor-pointer"
                    title="Edit role"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
                {canDelete && !role.isSystem && (
                  <button
                    onClick={() => void handleDelete(role)}
                    disabled={deletingId === role._id}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer disabled:opacity-50"
                    title="Delete role"
                  >
                    {deletingId === role._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-4">
              {role.permissions.length === 0 && (
                <span className="text-[10px] font-bold text-slate-400">No permissions assigned</span>
              )}
              {role.permissions.map((permission) => {
                const def = catalog.find((p) => p.id === permission);
                return (
                  <span
                    key={permission}
                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[9px] font-black ${permissionStyle(permission)}`}
                    title={permission}
                  >
                    {(() => {
                      const Icon = permissionIcon(permission);
                      return <Icon className="w-3 h-3" />;
                    })()}
                    {def ? def.label : permission}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit modal */}
      {form && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-xl border border-slate-100 p-6 max-h-[90vh] overflow-y-auto animate-fadeIn">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-5">
              {form.id ? `Edit Role — ${form.name}` : 'Create New Role'}
            </h3>
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Role Name</label>
                  <input
                    type="text"
                    value={form.name}
                    disabled={Boolean(form.id && roles.find((r) => r._id === form.id)?.isSystem)}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Operations Manager"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Description</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Short summary of the role"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Permissions</label>
                  <span className="text-[10px] font-black text-slate-500">{form.permissions.length} selected</span>
                </div>
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {Object.entries(modules).map(([moduleName, permissions]) => {
                    const allSelected = permissions.every((p) => form.permissions.includes(p.id));
                    const someSelected = permissions.some((p) => form.permissions.includes(p.id));
                    return (
                      <div key={moduleName} className="p-3 rounded-xl border border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            const ids = permissions.map((p) => p.id);
                            setForm({
                              ...form,
                              permissions: allSelected
                                ? form.permissions.filter((p) => !ids.includes(p))
                                : [...new Set([...form.permissions, ...ids])],
                            });
                          }}
                          className={`flex items-center justify-between w-full text-left cursor-pointer group ${
                            someSelected ? 'text-teal-700' : 'text-slate-500'
                          }`}
                        >
                          <span className="text-[10px] font-black uppercase tracking-wider">{moduleName}</span>
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 group-hover:bg-teal-100 text-slate-400 group-hover:text-teal-700 transition">
                            {allSelected ? '✓ All' : 'Select all'}
                          </span>
                        </button>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {permissions.map((permission) => {
                            const checked = form.permissions.includes(permission.id);
                            return (
                              <button
                                key={permission.id}
                                type="button"
                                onClick={() => togglePermission(permission.id)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-black transition cursor-pointer ${
                                  checked
                                    ? 'bg-teal-700 border-teal-700 text-white'
                                    : 'bg-white border-slate-200 text-slate-500 hover:border-teal-300 hover:text-teal-700'
                                }`}
                              >
                                {(() => {
                                  const Icon = permissionIcon(permission.id);
                                  return (
                                    <Icon className={`w-3 h-3 ${checked ? 'text-white' : permissionStyle(permission.id).split(' ')[1]}`} />
                                  );
                                })()}
                                {permission.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setForm(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white text-xs font-black flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {form.id ? 'Save Changes' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
