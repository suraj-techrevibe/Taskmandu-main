import { useCallback, useEffect, useState } from 'react';
import {
  Ban,
  Banknote,
  Briefcase,
  Cake,
  CalendarDays,
  Eye,
  IdCard,
  Loader2,
  Mail,
  MailPlus,
  MapPin,
  Pencil,
  Phone,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserRound,
  X,
} from 'lucide-react';
import {
  cancelInvitation,
  deleteUser,
  listInvitations,
  listRoles,
  listUsers,
  updateUser,
} from '../../services/access';
import * as employeeApi from '../../services/employee';
import type { Employee, Invitation, ManagedUser, RoleDef } from '../../types';
import InviteMemberModal from '../../components/InviteMemberModal';
import { toast } from '../../services/toast';

interface TeamModuleProps {
  canInvite: boolean;
  canUpdateUser: boolean;
  canDeleteUser: boolean;
  canViewEmployee: boolean;
  canUpdateEmployee: boolean;
  currentUserId: string;
}

const STATUS_STYLES: Record<string, string> = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  Cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
  Expired: 'bg-slate-100 text-slate-500 border-slate-200',
};

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

function permissionStyle(permission: string): string {
  const action = permission.split(':')[1]?.toLowerCase() ?? '';
  return PERMISSION_ACTION_STYLES[action] ?? 'bg-slate-100 text-slate-600 border-slate-200';
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function TeamModule({
  canInvite,
  canUpdateUser,
  canDeleteUser,
  canViewEmployee,
  canUpdateEmployee,
  currentUserId,
}: TeamModuleProps) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [roles, setRoles] = useState<RoleDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [roleBusy, setRoleBusy] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  // View / Edit modal state
  const [viewTarget, setViewTarget] = useState<ManagedUser | null>(null);
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);
  const [editTarget, setEditTarget] = useState<ManagedUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Linked employee record being edited (only for users with an employee profile)
  const [empDraft, setEmpDraft] = useState<Employee | null>(null);
  const [empLoading, setEmpLoading] = useState(false);

  // Activate / deactivate confirmation
  const [toggleTarget, setToggleTarget] = useState<ManagedUser | null>(null);
  const [toggling, setToggling] = useState(false);

  // Edit modal status confirmation (draft change confirmed before applying)
  const [pendingEditActive, setPendingEditActive] = useState<boolean | null>(null);

  const loadEmployeeFor = async (employeeId?: string | null): Promise<Employee | null> => {
    if (!employeeId) return null;
    try {
      return await employeeApi.getEmployee(employeeId);
    } catch {
      return null;
    }
  };

  const openView = async (user: ManagedUser) => {
    setViewTarget(user);
    setViewEmployee(null);
    if (canViewEmployee && user.employeeId) {
      setViewEmployee(await loadEmployeeFor(user.employeeId));
    }
  };

  const openEdit = async (user: ManagedUser) => {
    setEditTarget(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPhone(user.phone ?? '');
    setEditRole(user.role);
    setEditActive(user.isActive);
    setPendingEditActive(null);
    setEmpDraft(null);
    if (canViewEmployee && user.employeeId) {
      setEmpLoading(true);
      setEmpDraft(await loadEmployeeFor(user.employeeId));
      setEmpLoading(false);
    }
  };

  const setEmpField = (field: keyof Employee, value: string | number | boolean | null) => {
    setEmpDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    if (!editName.trim() || !editEmail.trim()) {
      toast.error('Name and email are required.');
      return;
    }
    setSaving(true);
    try {
      const patch: Parameters<typeof updateUser>[1] = {
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim() || null,
        role: editRole,
      };
      if (editTarget.id !== currentUserId) {
        patch.isActive = editActive;
      }
      const updated = await updateUser(editTarget.id, patch);

      if (empDraft && canUpdateEmployee) {
        await employeeApi.updateEmployee(empDraft.id, {
          firstName: empDraft.firstName,
          lastName: empDraft.lastName,
          phone: empDraft.phone,
          address: empDraft.address,
          department: empDraft.department,
          designation: empDraft.designation,
          employmentType: empDraft.employmentType,
          joiningDate: empDraft.joiningDate,
          salary: empDraft.salary,
          status: empDraft.status,
        });
      }

      setUsers((prev) => prev.map((u) => (u.id === editTarget.id ? updated : u)));
      toast.success(`${updated.name} updated successfully`);
      setEditTarget(null);
    } catch {
      // Global error toast handles messaging
    } finally {
      setSaving(false);
    }
  };

  const requestToggle = (user: ManagedUser) => {
    if (user.id === currentUserId) {
      toast.error('You cannot deactivate your own account.');
      return;
    }
    setToggleTarget(user);
  };

  const confirmToggle = async () => {
    if (!toggleTarget) return;
    setToggling(true);
    try {
      const updated = await updateUser(toggleTarget.id, { isActive: !toggleTarget.isActive });
      setUsers((prev) => prev.map((u) => (u.id === toggleTarget.id ? updated : u)));
      setViewTarget((prev) => (prev?.id === toggleTarget.id ? updated : prev));
      toast.success(updated.isActive ? `${updated.name} re-activated` : `${updated.name} deactivated`);
      setToggleTarget(null);
    } catch {
      // Global error toast handles messaging
    } finally {
      setToggling(false);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [userList, inviteList, roleList] = await Promise.all([listUsers(), listInvitations(), listRoles()]);
      setUsers(userList);
      setInvitations(inviteList);
      setRoles(roleList);
    } catch {
      // Global error toast handles messaging
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRoleChange = async (userId: string, role: string) => {
    setRoleBusy(userId);
    try {
      const updated = await updateUser(userId, { role });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: updated.role } : u)));
      toast.success(`Role updated to ${updated.role}`);
    } catch {
      // Global error toast handles messaging
    } finally {
      setRoleBusy(null);
    }
  };

  const handleToggleActive = (user: ManagedUser) => {
    requestToggle(user);
  };

  const handleCancelInvite = async (invitation: Invitation) => {
    try {
      await cancelInvitation(invitation._id);
      setInvitations((prev) => prev.map((i) => (i._id === invitation._id ? { ...i, status: 'Cancelled' } : i)));
      toast.success(`Invitation to ${invitation.email} cancelled`);
    } catch {
      // Global error toast handles messaging
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteUser(deleteTarget.id);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      toast.success(`${deleteTarget.name} deleted`);
      setDeleteTarget(null);
    } catch {
      // Global error toast handles messaging
    } finally {
      setDeleting(false);
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
          <h3 className="text-base font-black text-slate-900 tracking-tight">User Management</h3>
          <p className="text-[11px] text-slate-400 font-bold mt-0.5">Accounts, roles and invitations across the workspace</p>
        </div>
        {canInvite && (
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-black transition cursor-pointer"
          >
            <MailPlus className="w-4 h-4" />
            Invite Member
          </button>
        )}
      </div>

      {/* Users */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-teal-700" />
            <span className="text-xs font-black text-slate-800 uppercase tracking-wide">Registered Users</span>
          </div>
          <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">{users.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-600">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-slate-400 bg-slate-50 border-b border-slate-100">
                <th className="px-5 py-3 font-black">User</th>
                <th className="px-5 py-3 font-black">Role</th>
                <th className="px-5 py-3 font-black">Status</th>
                <th className="px-5 py-3 font-black">Last Login</th>
                <th className="px-5 py-3 font-black text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => openView(user)}
                      className="flex items-center gap-2.5 text-left group cursor-pointer"
                      title="View user details"
                    >
                      <div className="h-7 w-7 shrink-0 rounded-lg bg-teal-50 text-teal-700 font-black flex items-center justify-center text-[10px] ring-1 ring-teal-100">
                        {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-800 group-hover:text-teal-700 transition">{user.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{user.email}</p>
                      </div>
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    {canUpdateUser ? (
                      <div className="flex items-center gap-1.5">
                        <select
                          value={user.role}
                          disabled={roleBusy === user.id}
                          onChange={(e) => void handleRoleChange(user.id, e.target.value)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-700 focus:outline-none focus:border-teal-500 cursor-pointer disabled:opacity-50"
                        >
                          {roles.map((r) => (
                            <option key={r._id} value={r.name}>{r.name}</option>
                          ))}
                        </select>
                        {roleBusy === user.id && <Loader2 className="w-3 h-3 animate-spin text-teal-600" />}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-bold text-[11px]">
                        <ShieldCheck className="w-3 h-3" />
                        {user.role}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {canUpdateUser ? (
                      <button
                        onClick={() => void handleToggleActive(user)}
                        disabled={roleBusy === user.id}
                        title={user.isActive ? 'Click to deactivate' : 'Click to activate'}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black transition cursor-pointer disabled:opacity-50 ${
                          user.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {user.isActive ? 'Active' : 'Deactivated'}
                      </button>
                    ) : (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black ${
                        user.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {user.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    )}

                    {canUpdateUser && (
                      <button
                        onClick={() => void handleToggleActive(user)}
                        disabled={roleBusy === user.id}
                        className={`ml-2 px-2.5 py-1.5 rounded-lg text-[10px] font-black border transition cursor-pointer disabled:opacity-50 ${
                          user.isActive
                            ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-100'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100'
                        }`}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    )}

                    {roleBusy === user.id && <Loader2 className="w-3 h-3 animate-spin text-teal-600 ml-1 inline" />}
                  </td>
                  <td className="px-5 py-3.5 text-[11px] font-bold text-slate-500">{formatDate(user.lastLoginAt)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openView(user)}
                        title="View details"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {canUpdateUser && (
                        <button
                          onClick={() => openEdit(user)}
                          title="Edit user"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canDeleteUser && user.id !== currentUserId && (
                        <button
                          onClick={() => setDeleteTarget(user)}
                          disabled={roleBusy === user.id}
                          title="Delete account"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center">
                    <UserRound className="w-6 h-6 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-slate-400">No users yet. Invite your first team member.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invitations */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MailPlus className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-black text-slate-800 uppercase tracking-wide">Pending & Sent Invitations</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">{invitations.length}</span>
            <button onClick={() => void load()} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer" title="Refresh">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-600">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-slate-400 bg-slate-50 border-b border-slate-100">
                <th className="px-5 py-3 font-black">Invitee</th>
                <th className="px-5 py-3 font-black">Role</th>
                <th className="px-5 py-3 font-black">Status</th>
                <th className="px-5 py-3 font-black">Expires</th>
                <th className="px-5 py-3 font-black text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invitations.map((invitation) => (
                <tr key={invitation._id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-3.5">
                    <p className="font-extrabold text-slate-800">{invitation.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{invitation.email}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-[11px]">{invitation.role}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex px-2.5 py-1 rounded-lg border text-[10px] font-black ${STATUS_STYLES[invitation.status] ?? 'bg-slate-100 text-slate-500'}`}>
                      {invitation.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[11px] font-bold text-slate-500">{formatDate(invitation.expiresAt)}</td>
                  <td className="px-5 py-3.5 text-right">
                    {invitation.status === 'Pending' && canInvite && (
                      <button
                        onClick={() => void handleCancelInvite(invitation)}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-black transition cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {invitations.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center">
                    <p className="text-xs font-bold text-slate-400">No invitations have been sent yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showInvite && (
        <InviteMemberModal
          roles={roles}
          onClose={() => setShowInvite(false)}
          onInvited={() => void load()}
        />
      )}

      {/* View user modal */}
      {viewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden animate-fadeIn flex flex-col max-h-[85vh]">
            <div className="p-6 pb-5 bg-slate-50/60 border-b border-slate-100 flex items-start justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-teal-50 text-teal-700 font-black flex items-center justify-center text-sm ring-1 ring-teal-100">
                  {viewTarget.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">{viewTarget.name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold">{viewTarget.email}</p>
                </div>
              </div>
              <button
                onClick={() => setViewTarget(null)}
                title="Close"
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <DetailCard
                  icon={<UserRound className="w-3.5 h-3.5" />}
                  label="Role"
                  value={viewTarget.role}
                  valueClass="text-slate-800"
                />
                <DetailCard
                  icon={<ShieldCheck className="w-3.5 h-3.5" />}
                  label="Status"
                  value={viewTarget.isActive ? 'Active' : 'Deactivated'}
                  valueClass={viewTarget.isActive ? 'text-emerald-600' : 'text-rose-600'}
                />
                <DetailCard
                  icon={<IdCard className="w-3.5 h-3.5" />}
                  label="Employee ID"
                  value={viewTarget.employeeId ?? '—'}
                />
                <DetailCard
                  icon={<Phone className="w-3.5 h-3.5" />}
                  label="Phone"
                  value={viewTarget.phone ?? '—'}
                />
                <DetailCard
                  icon={<CalendarDays className="w-3.5 h-3.5" />}
                  label="Last Login"
                  value={formatDate(viewTarget.lastLoginAt)}
                />
                <DetailCard
                  icon={<CalendarDays className="w-3.5 h-3.5" />}
                  label="Member Since"
                  value={formatDate(viewTarget.createdAt)}
                />
              </div>

              {canViewEmployee && viewTarget.employeeId && (
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-teal-700" />
                    Employee Profile
                  </p>
                  {!viewEmployee ? (
                    <div className="flex items-center gap-2 py-3">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                      <span className="text-[11px] font-bold text-slate-400">Loading employee details…</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <DetailCard
                        icon={<IdCard className="w-3.5 h-3.5" />}
                        label="Employee Code"
                        value={viewEmployee.employeeId}
                      />
                      <DetailCard
                        icon={<UserRound className="w-3.5 h-3.5" />}
                        label="Name"
                        value={`${viewEmployee.firstName} ${viewEmployee.lastName}`}
                      />
                      <DetailCard
                        icon={<Briefcase className="w-3.5 h-3.5" />}
                        label="Department"
                        value={viewEmployee.department}
                      />
                      <DetailCard
                        icon={<Briefcase className="w-3.5 h-3.5" />}
                        label="Designation"
                        value={viewEmployee.designation}
                      />
                      <DetailCard
                        icon={<ShieldCheck className="w-3.5 h-3.5" />}
                        label="Employment Type"
                        value={viewEmployee.employmentType}
                      />
                      <DetailCard
                        icon={<ShieldCheck className="w-3.5 h-3.5" />}
                        label="Employee Status"
                        value={viewEmployee.status}
                        valueClass={
                          viewEmployee.status === 'Active'
                            ? 'text-emerald-600'
                            : viewEmployee.status === 'Onboarding'
                              ? 'text-amber-600'
                              : viewEmployee.status === 'Offboarding'
                                ? 'text-rose-600'
                                : 'text-slate-500'
                        }
                      />
                      <DetailCard
                        icon={<CalendarDays className="w-3.5 h-3.5" />}
                        label="Joining Date"
                        value={viewEmployee.joiningDate}
                      />
                      <DetailCard
                        icon={<Banknote className="w-3.5 h-3.5" />}
                        label="Salary"
                        value={`${viewEmployee.salary.toLocaleString()}`}
                      />
                      <DetailCard
                        icon={<Cake className="w-3.5 h-3.5" />}
                        label="Date of Birth"
                        value={viewEmployee.dob}
                      />
                      <DetailCard
                        icon={<UserRound className="w-3.5 h-3.5" />}
                        label="Gender"
                        value={viewEmployee.gender}
                      />
                      <DetailCard
                        icon={<Phone className="w-3.5 h-3.5" />}
                        label="Phone"
                        value={viewEmployee.phone}
                      />
                      <DetailCard
                        icon={<MapPin className="w-3.5 h-3.5" />}
                        label="Address"
                        value={viewEmployee.address || '—'}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-slate-100 pt-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  Permissions ({viewTarget.permissions.length})
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                  {viewTarget.permissions.length === 0 && (
                    <span className="text-[10px] text-slate-400 font-semibold">No explicit permissions</span>
                  )}
                  {viewTarget.permissions.map((p) => (
                    <span
                      key={p}
                      className={`text-[9px] font-bold rounded px-1.5 py-0.5 border ${permissionStyle(p)}`}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between gap-2.5 shrink-0">
              {canUpdateUser ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => requestToggle(viewTarget)}
                    className={`px-3 py-2 rounded-xl text-[11px] font-black transition border flex items-center gap-1.5 cursor-pointer ${
                      viewTarget.isActive
                        ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-100'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100'
                    }`}
                  >
                    {viewTarget.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => {
                      openEdit(viewTarget);
                      setViewTarget(null);
                    }}
                    className="px-4 py-2.5 bg-teal-800 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit User
                  </button>
                </div>
              ) : (
                <span />
              )}
              <button
                onClick={() => setViewTarget(null)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit user modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden animate-fadeIn flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Pencil className="w-4 h-4 text-teal-700" />
                Edit User
              </h4>
              <button
                onClick={() => setEditTarget(null)}
                title="Close"
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 flex-1 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Phone</label>
                <input
                  type="text"
                  placeholder="+977 ..."
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    {roles.map((r) => (
                      <option key={r._id} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Status</label>
                  <button
                    onClick={() => setPendingEditActive(!editActive)}
                    disabled={editTarget.id === currentUserId}
                    title="Click to change status"
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      editActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${editActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    {editActive ? 'Active' : 'Deactivated'}
                  </button>
                  {editTarget.id === currentUserId && (
                    <p className="text-[9px] text-slate-400 font-semibold">You cannot deactivate your own account.</p>
                  )}
                </div>
              </div>

              {canViewEmployee && editTarget.employeeId && (
                <div className="border border-slate-100 rounded-xl p-4 space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-teal-700" />
                    Employee Details
                    {canUpdateEmployee && <span className="normal-case text-[9px] font-bold text-slate-400">(saved with employee record)</span>}
                  </p>
                  {empLoading ? (
                    <div className="flex items-center gap-2 py-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                      <span className="text-[11px] font-bold text-slate-400">Loading employee details…</span>
                    </div>
                  ) : empDraft ? (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">First Name</label>
                          <input
                            type="text"
                            value={empDraft.firstName}
                            disabled={!canUpdateEmployee}
                            onChange={(e) => setEmpField('firstName', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-teal-500 disabled:opacity-60"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Last Name</label>
                          <input
                            type="text"
                            value={empDraft.lastName}
                            disabled={!canUpdateEmployee}
                            onChange={(e) => setEmpField('lastName', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-teal-500 disabled:opacity-60"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Department</label>
                          <input
                            type="text"
                            value={empDraft.department}
                            disabled={!canUpdateEmployee}
                            onChange={(e) => setEmpField('department', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-teal-500 disabled:opacity-60"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Designation</label>
                          <input
                            type="text"
                            value={empDraft.designation}
                            disabled={!canUpdateEmployee}
                            onChange={(e) => setEmpField('designation', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-teal-500 disabled:opacity-60"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Employment Type</label>
                          <select
                            value={empDraft.employmentType}
                            disabled={!canUpdateEmployee}
                            onChange={(e) => setEmpField('employmentType', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer disabled:opacity-60"
                          >
                            {(['Full-Time', 'Part-Time', 'Contract', 'Intern'] as const).map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Joining Date</label>
                          <input
                            type="date"
                            value={empDraft.joiningDate}
                            disabled={!canUpdateEmployee}
                            onChange={(e) => setEmpField('joiningDate', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-teal-500 disabled:opacity-60"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Salary (NPR)</label>
                          <input
                            type="number"
                            min={0}
                            value={empDraft.salary}
                            disabled={!canUpdateEmployee}
                            onChange={(e) => setEmpField('salary', e.target.value === '' ? 0 : Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-teal-500 disabled:opacity-60"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Phone</label>
                          <input
                            type="text"
                            value={empDraft.phone}
                            disabled={!canUpdateEmployee}
                            onChange={(e) => setEmpField('phone', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-teal-500 disabled:opacity-60"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Date of Birth</label>
                          <input
                            type="date"
                            value={empDraft.dob}
                            disabled={!canUpdateEmployee}
                            onChange={(e) => setEmpField('dob', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-teal-500 disabled:opacity-60"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Gender</label>
                          <select
                            value={empDraft.gender}
                            disabled={!canUpdateEmployee}
                            onChange={(e) => setEmpField('gender', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer disabled:opacity-60"
                          >
                            {(['Male', 'Female', 'Other'] as const).map((g) => (
                              <option key={g} value={g}>{g}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Employee Status</label>
                          <select
                            value={empDraft.status}
                            disabled={!canUpdateEmployee}
                            onChange={(e) => setEmpField('status', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer disabled:opacity-60"
                          >
                            {(['Active', 'Onboarding', 'Offboarding', 'Archived'] as const).map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Address</label>
                        <input
                          type="text"
                          value={empDraft.address}
                          disabled={!canUpdateEmployee}
                          onChange={(e) => setEmpField('address', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-teal-500 disabled:opacity-60"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 py-2">
                      <span className="text-[11px] font-bold text-slate-400">Could not load employee details.</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
              <button
                onClick={() => setEditTarget(null)}
                disabled={saving}
                className="px-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleSaveEdit()}
                disabled={saving}
                className="px-4 py-2.5 bg-teal-800 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal status confirmation */}
      {editTarget && pendingEditActive !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-5 animate-fadeIn">
            <div className="flex items-start gap-3">
              <div
                className={`h-9 w-9 shrink-0 rounded-xl flex items-center justify-center ${
                  pendingEditActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
                }`}
              >
                {pendingEditActive ? <UserCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">
                  {pendingEditActive ? 'Activate user?' : 'Deactivate user?'}
                </h4>
                <p className="text-[11px] text-slate-500 font-semibold mt-1 leading-relaxed">
                  {pendingEditActive
                    ? `${editTarget.name} will regain access to the workspace once you save your changes.`
                    : `${editTarget.name} will lose access to the workspace once you save your changes.`}
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setPendingEditActive(null)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setEditActive(pendingEditActive);
                  setPendingEditActive(null);
                }}
                className={`px-4 py-2.5 text-white rounded-xl text-xs font-bold transition cursor-pointer ${
                  pendingEditActive ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {pendingEditActive ? 'Activate' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-5 animate-fadeIn">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 shrink-0 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">Delete user?</h4>
                <p className="text-[11px] text-slate-500 font-semibold mt-1 leading-relaxed">
                  {deleteTarget.name} (<span className="text-slate-700">{deleteTarget.email}</span>) will be
                  soft-deleted. Their account will be removed from the user list and they will no longer be able
                  to sign in.
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleDeleteUser()}
                disabled={deleting}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deleting && <Loader2 className="w-3 h-3 animate-spin" />}
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activate / deactivate confirmation */}
      {toggleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-5 animate-fadeIn">
            <div className="flex items-start gap-3">
              <div
                className={`h-9 w-9 shrink-0 rounded-xl flex items-center justify-center ${
                  toggleTarget.isActive ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                {toggleTarget.isActive ? <Ban className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">
                  {toggleTarget.isActive ? 'Deactivate user?' : 'Activate user?'}
                </h4>
                <p className="text-[11px] text-slate-500 font-semibold mt-1 leading-relaxed">
                  {toggleTarget.isActive ? (
                    <>
                      {toggleTarget.name} (<span className="text-slate-700">{toggleTarget.email}</span>) will lose
                      access to the workspace until reactivated.
                    </>
                  ) : (
                    <>
                      {toggleTarget.name} (<span className="text-slate-700">{toggleTarget.email}</span>) will regain
                      access to the workspace.
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setToggleTarget(null)}
                disabled={toggling}
                className="px-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => void confirmToggle()}
                disabled={toggling}
                className={`px-4 py-2.5 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                  toggleTarget.isActive ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {toggling && <Loader2 className="w-3 h-3 animate-spin" />}
                {toggleTarget.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailCard({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="bg-slate-50/60 border border-slate-100 rounded-xl p-3 space-y-1">
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
        <span className="text-teal-700">{icon}</span>
        {label}
      </span>
      <p className={`text-xs font-extrabold text-slate-700 truncate ${valueClass ?? ''}`}>{value}</p>
    </div>
  );
}
