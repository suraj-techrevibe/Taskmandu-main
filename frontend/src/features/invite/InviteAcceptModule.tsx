import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, Check, Loader2, MailCheck, Shield, X } from 'lucide-react';
import { acceptInvitation, getInvitation, rejectInvitation } from '../../services/access';
import type { Invitation } from '../../types';
import { toast } from '../../services/toast';

interface InviteAcceptModuleProps {
  token: string;
  onProceedToLogin: () => void;
}

export default function InviteAcceptModule({ token, onProceedToLogin }: InviteAcceptModuleProps) {
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [rejected, setRejected] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getInvitation(token);
      setInvitation(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load this invitation');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    if (!password || !confirm) {
      setFieldErrors({
        password: !password ? 'Password is required' : '',
        confirm: !confirm ? 'Please confirm your password' : '',
      });
      return;
    }
    if (password !== confirm) {
      setFieldErrors({ confirm: 'Passwords do not match' });
      return;
    }
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setFieldErrors({ password: 'Password must be 8+ characters with an uppercase letter and a number' });
      return;
    }
    setAccepting(true);
    try {
      await acceptInvitation(token, password);
      setAccepted(true);
    } catch (err) {
      // Global error toast handles messaging
    } finally {
      setAccepting(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm('Decline this invitation? You will not get another one for this email.')) return;
    setRejecting(true);
    try {
      await rejectInvitation(token);
      setRejected(true);
      toast.info('Invitation declined');
    } catch {
      // Global error toast handles messaging
    } finally {
      setRejecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6">
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm max-w-md w-full p-8 text-center">
          <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <X className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-2">Invitation unavailable</h2>
          <p className="text-xs text-slate-500 font-bold leading-relaxed">{error ?? 'This invitation does not exist.'}</p>
          <button
            onClick={onProceedToLogin}
            className="mt-6 px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-black transition cursor-pointer"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6">
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm max-w-md w-full p-8 text-center animate-fadeIn">
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <Check className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-2">You're in!</h2>
          <p className="text-xs text-slate-500 font-bold leading-relaxed">
            Your account is ready. Sign in as <span className="text-teal-700">{invitation.name}</span> with your new password.
          </p>
          <button
            onClick={onProceedToLogin}
            className="mt-6 px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-black inline-flex items-center gap-2 transition cursor-pointer"
          >
            Sign In Now <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  if (rejected) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6">
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm max-w-md w-full p-8 text-center animate-fadeIn">
          <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4">
            <MailCheck className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-2">Invitation declined</h2>
          <p className="text-xs text-slate-500 font-bold leading-relaxed">Thanks for letting us know. This invitation has been closed.</p>
          <button
            onClick={onProceedToLogin}
            className="mt-6 px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-black transition cursor-pointer"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  const notPending = invitation.status !== 'Pending';

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6">
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm max-w-md w-full p-8 animate-fadeIn">
        <div className="flex flex-col items-center text-center space-y-3 mb-6">
          <div className="h-12 w-12 bg-teal-600 rounded-2xl flex items-center justify-center shadow-md shadow-teal-600/15">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase">Taskmandu</h1>
            <p className="text-[10px] text-teal-600 font-extrabold uppercase tracking-widest mt-0.5">Workforce Hub</p>
          </div>
        </div>

        {notPending ? (
          <div className="text-center">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-2">
              Invitation {invitation.status.toLowerCase()}
            </h2>
            <p className="text-xs text-slate-500 font-bold leading-relaxed">
              This invitation for <span className="text-slate-800">{invitation.name}</span> is no longer pending
              {invitation.status === 'Accepted' && ' — the account already exists. Please sign in instead.'}
              {invitation.status === 'Expired' && ' — please ask the inviter to send a new one.'}
            </p>
            <button
              onClick={onProceedToLogin}
              className="mt-6 px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-black inline-flex items-center gap-2 transition cursor-pointer"
            >
              Go to Sign In <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">You've been invited</h2>
              <p className="text-xs text-slate-500 font-bold mt-1.5 leading-relaxed">
                <span className="text-slate-800 font-black">{invitation.invitedByName}</span> invited{' '}
                <span className="text-slate-800 font-black">{invitation.name}</span> to join the workspace as
              </p>
              <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-black">
                {invitation.role}
              </span>
            </div>

            <form onSubmit={handleAccept} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Create Your Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 chars with uppercase & number"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition"
                />
                {fieldErrors.password && <p className="text-[10px] font-bold text-rose-600">{fieldErrors.password}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition"
                />
                {fieldErrors.confirm && <p className="text-[10px] font-bold text-rose-600">{fieldErrors.confirm}</p>}
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={rejecting || accepting}
                  className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-black transition cursor-pointer disabled:opacity-50"
                >
                  {rejecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Decline Invitation'}
                </button>
                <button
                  type="submit"
                  disabled={accepting}
                  className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-black inline-flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  {accepting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Accept & Join
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
