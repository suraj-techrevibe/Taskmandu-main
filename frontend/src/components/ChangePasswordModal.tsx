import React, { useState } from 'react';
import { Key, Lock, RefreshCw, X } from 'lucide-react';
import { changePassword } from '../services/auth';
import { toast } from '../services/toast';
import { ApiError } from '../services/http';

interface ChangePasswordModalProps {
  onClose: () => void;
}

export default function ChangePasswordModal({ onClose }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    if (!currentPassword || !newPassword || !confirmPassword) {
      setFieldErrors({ form: 'Please fill in all password fields.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setFieldErrors({ confirmPassword: 'New password and confirmation do not match.' });
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success('Password updated successfully. Please use it on your next sign-in.');
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        const fieldMap: Record<string, string> = {
          currentPassword: 'current',
          newPassword: 'new',
        };
        const mapped: Record<string, string> = {};
        Object.entries(err.fieldErrors).forEach(([field, message]) => {
          mapped[fieldMap[field] ?? field] = message;
        });
        setFieldErrors(mapped);
        if (err.statusCode === 400 && err.message === 'Current password is incorrect') {
          setFieldErrors({ current: 'Current password is incorrect.' });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const errorClass = (hasError: boolean) =>
    hasError
      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10'
      : 'border-slate-200 focus:border-teal-500 focus:ring-teal-500/10';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-100 shadow-2xl p-6 relative overflow-hidden animate-fadeIn">
        <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-teal-800" />
            <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight">Change Password</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-800 transition cursor-pointer font-bold text-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {fieldErrors.form && (
          <div className="mb-4 p-3 rounded-xl border bg-rose-50 border-rose-200 text-rose-800 text-xs font-semibold">
            {fieldErrors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Current Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition ${errorClass(!!fieldErrors.current)}`}
              />
            </div>
            {fieldErrors.current && (
              <p className="text-[10px] font-bold text-rose-600">{fieldErrors.current}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">New Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Key className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 chars with uppercase & number"
                className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition ${errorClass(!!fieldErrors.new)}`}
              />
            </div>
            {fieldErrors.new && (
              <p className="text-[10px] font-bold text-rose-600">{fieldErrors.new}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Confirm New Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Key className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition ${errorClass(!!fieldErrors.confirmPassword)}`}
              />
            </div>
            {fieldErrors.confirmPassword && (
              <p className="text-[10px] font-bold text-rose-600">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          <div className="flex gap-2.5 mt-6 border-t border-slate-100 pt-4 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-teal-800 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-md shadow-teal-950/10 transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
