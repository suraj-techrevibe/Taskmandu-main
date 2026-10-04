import React, { useRef, useState } from 'react';
import {
  AtSign,
  BadgeCheck,
  Briefcase,
  Edit3,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
  Upload,
  UserRound,
  X,
} from 'lucide-react';
import type { AuthUser, Employee } from '../../types';
import { updateMyAvatar, updateMyProfile } from '../../services/auth';
import { API_BASE_URL, ApiError } from '../../services/http';
import { toast } from '../../services/toast';

interface ProfileModuleProps {
  user: AuthUser;
  employees: Employee[];
  onUserUpdated: (user: AuthUser) => void;
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const ROLE_BADGE_STYLES: Record<string, string> = {
  'Super Admin': 'bg-violet-50 text-violet-700 border-violet-200',
  HR: 'bg-pink-50 text-pink-700 border-pink-200',
  Manager: 'bg-sky-50 text-sky-700 border-sky-200',
  'Team Lead': 'bg-amber-50 text-amber-700 border-amber-200',
  Employee: 'bg-teal-50 text-teal-700 border-teal-200',
};

const ORIGIN_BASE = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

export default function ProfileModule({ user, employees, onUserUpdated }: ProfileModuleProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone ?? '');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar ?? null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const avatarSrc = avatarPreview
    ? avatarPreview.startsWith('http')
      ? avatarPreview
      : `${ORIGIN_BASE}${avatarPreview.startsWith('/') ? avatarPreview : `/${avatarPreview}`}`
    : null;

const linkedEmployee =
  (user.employeeId
    ? employees.find((e) => e.employeeId === user.employeeId) ||
      employees.find((e) => e.id === user.employeeId)
    : undefined) ||
  employees.find((e) => e.email.toLowerCase() === user.email.toLowerCase());

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const startEdit = () => {
    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone ?? '');
    setFieldErrors({});
    setEditing(true);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const updated = await updateMyAvatar(file);
      onUserUpdated(updated);
      setAvatarPreview(updated.avatar ?? null);
      toast.success('Profile photo updated successfully');
    } catch {
      // Errors are surfaced by the http layer's toast.
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    if (!name.trim()) {
      setFieldErrors({ name: 'Name is required.' });
      return;
    }
    if (!email.trim()) {
      setFieldErrors({ email: 'Email is required.' });
      return;
    }

    setSaving(true);
    try {
      const updated = await updateMyProfile({ name: name.trim(), email: email.trim(), phone: phone.trim() || null });
      onUserUpdated(updated);
      toast.success('Profile updated successfully');
      setEditing(false);
    } catch (err) {
      if (err instanceof ApiError) {
        const fieldMap: Record<string, string> = { name: 'name', email: 'email', phone: 'phone' };
        const mapped: Record<string, string> = {};
        Object.entries(err.fieldErrors).forEach(([field, message]) => {
          mapped[fieldMap[field] ?? field] = message;
        });
        setFieldErrors(mapped);
        if (err.statusCode === 409) {
          setFieldErrors({ email: 'This email is already in use by another account.' });
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const errorClass = (hasError: boolean) =>
    hasError
      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10'
      : 'border-slate-200 focus:border-teal-500 focus:ring-teal-500/10';

  const inputClass = (hasError: boolean) =>
    `w-full pl-9 pr-4 py-2.5 bg-white border rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition ${errorClass(hasError)}`;

  const detailRow = (label: string, value: React.ReactNode) => (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-slate-50 last:border-b-0">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider shrink-0">{label}</span>
      <span className="text-xs font-bold text-slate-800 text-right">{value}</span>
    </div>
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Profile Header Card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center gap-5">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={user.name}
              className="h-16 w-16 shrink-0 rounded-2xl object-cover shadow-lg shadow-teal-900/20 ring-2 ring-teal-100"
            />
          ) : (
            <div className="h-16 w-16 shrink-0 rounded-2xl bg-teal-800 text-white font-black flex items-center justify-center text-xl shadow-lg shadow-teal-900/20">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-slate-900 tracking-tight truncate">{user.name}</h2>
              <span
                className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                  ROLE_BADGE_STYLES[user.role] ?? 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {user.role}
              </span>
              <span
                className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                  user.isActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                <BadgeCheck className="w-3 h-3" />
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-400 mt-1 flex items-center gap-1.5 truncate">
              <AtSign className="w-3.5 h-3.5" />
              {user.email}
            </p>
          </div>

          {!editing && (
            <button
              onClick={startEdit}
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-teal-800 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-md shadow-teal-950/10 transition cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Edit Mode Form */}
      {editing ? (
        <form onSubmit={handleSave} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <UserRound className="w-4 h-4 text-teal-800" />
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-tight">Edit Profile</h3>
            </div>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="shrink-0">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={user.name}
                    className="h-16 w-16 rounded-2xl object-cover shadow-lg shadow-teal-900/20 ring-2 ring-teal-100"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-2xl bg-teal-800 text-white font-black flex items-center justify-center text-xl shadow-lg shadow-teal-900/20">
                    {initials}
                  </div>
                )}
              </div>
              <div className="space-y-1.5 min-w-0">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Profile Photo
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-[11px] font-black transition cursor-pointer disabled:opacity-50"
                >
                  {uploadingAvatar ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  {uploadingAvatar ? 'Uploading…' : 'Upload Photo'}
                </button>
                <p className="text-[10px] font-semibold text-slate-400">
                  JPEG, PNG, WEBP or GIF up to 5 MB. Saves immediately.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <UserRound className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className={inputClass(!!fieldErrors.name)}
                />
              </div>
              {fieldErrors.name && <p className="text-[10px] font-bold text-rose-600">{fieldErrors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className={inputClass(!!fieldErrors.email)}
                />
              </div>
              {fieldErrors.email && <p className="text-[10px] font-bold text-rose-600">{fieldErrors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Phone Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+977 9XXXXXXXX"
                  className={inputClass(!!fieldErrors.phone)}
                />
              </div>
              {fieldErrors.phone && <p className="text-[10px] font-bold text-rose-600">{fieldErrors.phone}</p>}
            </div>
          </div>

          <div className="flex gap-2.5 border-t border-slate-100 pt-4 justify-end">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-teal-800 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-md shadow-teal-950/10 transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <BadgeCheck className="w-3.5 h-3.5" />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      ) : (
        <>
          {/* Account Details */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-1">
              <ShieldCheck className="w-4 h-4 text-teal-800" />
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-tight">Account Details</h3>
            </div>
            {detailRow('Employee ID', user.employeeId ?? '—')}
            {detailRow('Email', user.email)}
            {detailRow('Phone', user.phone || '—')}
            {detailRow('Role', user.role)}
            {detailRow('Member Since', formatDate(user.createdAt))}
            {detailRow('Last Login', formatDateTime(user.lastLoginAt))}
          </div>

          {/* Employment Details (linked record) */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-1">
              <Briefcase className="w-4 h-4 text-teal-800" />
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-tight">Employment Details</h3>
            </div>
            {linkedEmployee ? (
              <>
                {detailRow('Department', linkedEmployee.department)}
                {detailRow('Designation', linkedEmployee.designation)}
                {detailRow('Employment Type', linkedEmployee.employmentType)}
                {detailRow('Joining Date', formatDate(linkedEmployee.joiningDate))}
                {detailRow(
                  'Reporting Manager',
                  linkedEmployee.reportingManagerId
                    ? employees.find((m) => m.id === linkedEmployee.reportingManagerId)?.firstName +
                        ' ' +
                        (employees.find((m) => m.id === linkedEmployee.reportingManagerId)?.lastName ?? '')
                    : '—',
                )}
              </>
            ) : (
              <div className="py-6 text-center">
                <p className="text-[10px] font-bold text-slate-400">
                  No employee record is linked to this account yet. Contact an administrator.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
