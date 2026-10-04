import React, { useEffect, useState } from 'react';
import { Check, Copy, Loader2, Mail, UserCheck, X } from 'lucide-react';
import type { Role, RoleDef } from '../types';
import { createInvitation } from '../services/access';
import { listEmployees } from '../services/employee';
import type { Employee } from '../types';
import { toast } from '../services/toast';

interface InviteMemberModalProps {
  roles: RoleDef[];
  onClose: () => void;
  onInvited: () => void;
}

export default function InviteMemberModal({ roles, onClose, onInvited }: InviteMemberModalProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [role, setRole] = useState<Role>('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    void listEmployees(200)
      .then(setEmployees)
      .catch(() => setEmployees([]));
  }, []);

  useEffect(() => {
    if (!role && roles.length > 0) setRole(roles[0].name);
  }, [roles, role]);

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    if (!selectedEmployeeId || !role) {
      setFieldErrors({
        employee: !selectedEmployeeId ? 'Select an employee to invite' : '',
        role: !role ? 'Role is required' : '',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await createInvitation({ employeeId: selectedEmployeeId, role });
      toast.success(`Invitation sent to ${selectedEmployee!.email}`);
      if (result.inviteLink) setInviteLink(result.inviteLink);
      if (result.emailDelivered) {
        onClose();
      }
      onInvited();
    } catch (err) {
      // Backend message surfaced by global error handler.
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.info(`Invite link: ${inviteLink}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-100 p-6 animate-fadeIn">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Invite Workspace Member</h3>
              <p className="text-[10px] text-slate-400 font-bold">Invite an existing employee to join your workspace</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Employee</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <UserCheck className="w-4 h-4" />
              </span>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition cursor-pointer"
              >
                <option value="">Select an employee…</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} — {emp.designation} ({emp.status})
                  </option>
                ))}
              </select>
            </div>
            {selectedEmployee && (
              <p className="text-[9px] text-slate-400 font-semibold">
                Invite will be sent to <span className="text-teal-700 font-bold">{selectedEmployee.email}</span>
              </p>
            )}
            {fieldErrors.employee && <p className="text-[10px] font-bold text-rose-600">{fieldErrors.employee}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Assigned Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition cursor-pointer"
            >
              {roles.map((r) => (
                <option key={r._id} value={r.name}>
                  {r.name} — {r.permissions.length} permissions
                </option>
              ))}
            </select>
            <p className="text-[9px] text-slate-400 font-semibold">The invitee will see modules based on this role's permissions.</p>
            {fieldErrors.role && <p className="text-[10px] font-bold text-rose-600">{fieldErrors.role}</p>}
          </div>

          {inviteLink && (
            <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 space-y-2">
              <p className="text-[10px] font-black text-teal-700 uppercase tracking-wider">SMTP not configured — share this link</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-[10px] text-teal-800 font-bold bg-white rounded-lg px-2.5 py-1.5 border border-teal-200 truncate">
                  {inviteLink}
                </code>
                <button
                  type="button"
                  onClick={copyLink}
                  className="shrink-0 px-2.5 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white transition cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || employees.length === 0}
              className="px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white text-xs font-black flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {inviteLink ? 'Send Another Invite' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}