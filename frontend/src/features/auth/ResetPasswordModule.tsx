import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, KeyRound, Loader2, Lock, Shield } from 'lucide-react';
import { resetPassword } from '../../services/auth';
import { toast } from '../../services/toast';

interface ResetPasswordModuleProps {
  token: string;
  onProceedToLogin: () => void;
}

export default function ResetPasswordModule({ token, onProceedToLogin }: ResetPasswordModuleProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!newPassword || newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError('Password must be at least 8 characters with one uppercase letter and one number.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(token, newPassword);
      setDone(true);
      toast.success('Password reset successfully. You can now sign in.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset your password. The link may be invalid or expired.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="w-full max-w-md mx-auto space-y-8 py-10 animate-fadeIn text-slate-800">
          {/* Brand Logo and Title */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="h-12 w-12 bg-teal-600 rounded-2xl flex items-center justify-center shadow-md shadow-teal-600/15">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">Taskmandu</h1>
              <p className="text-xs text-teal-600 font-extrabold uppercase tracking-widest mt-0.5">Workforce Hub</p>
            </div>
          </div>

          <div className="text-center space-y-1.5">
            <h2 className="text-lg font-black text-slate-900">Set a New Password</h2>
            <p className="text-xs text-slate-500 font-medium">
              {done ? 'Your password has been updated.' : 'Choose a new password for your account.'}
            </p>
          </div>

          {done ? (
            <div className="p-4 rounded-xl border border-teal-200 bg-teal-50 text-xs font-semibold leading-relaxed text-teal-800">
              <p className="font-black uppercase tracking-wider text-[10px] mb-1">Password Updated</p>
              <p>Your password has been reset successfully. Sign in with your new password to continue.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-xs font-semibold leading-relaxed text-rose-800">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">New Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 chars with uppercase & number"
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Confirm New Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Resetting Password…</span>
                  </>
                ) : (
                  <>
                    <span>Reset Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {done && (
            <button
              onClick={onProceedToLogin}
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <span>Proceed to Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
