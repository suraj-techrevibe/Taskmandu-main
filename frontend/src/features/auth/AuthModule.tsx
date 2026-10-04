import React, { useState } from 'react';
import { AuthUser } from '../../types';
import { Key, Mail, User, UserPlus, ArrowRight, RefreshCw, Eye, EyeOff, Lock } from 'lucide-react';
import { login, register, saveSession, forgotPassword, resetPassword } from '../../services/auth';
import { toast } from '../../services/toast';

interface AuthModuleProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export default function AuthModule({ onLoginSuccess }: AuthModuleProps) {
  const [screen, setScreen] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Forgot-password flow states
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const runLogin = async (loginEmail: string, loginPassword: string, successMessage?: string) => {
    setLoading(true);
    setMessage(null);
    try {
      const { user, tokens } = await login(loginEmail, loginPassword);
      saveSession(user, tokens);
      if (successMessage) toast.success(successMessage);
      onLoginSuccess(user);
    } catch {
      // Backend error message (e.g. "Invalid email or password") is surfaced
      // as a toast by the global error handler in services/http.ts.
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setMessage({ type: 'error', text: 'Please fill in both email and password.' });
      return;
    }
    void runLogin(email.trim(), password);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password) {
      setMessage({ type: 'error', text: 'Please enter a username, email, and password.' });
      return;
    }
    if (password.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters long.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await register({ name: username.trim(), email: email.trim(), password });
      toast.success('Account created successfully! You can now sign in.');
      setPassword('');
      setUsername('');
      setScreen('login');
    } catch {
      // Backend error message is surfaced by the global error handler.
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Please enter your registered corporate email.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const { resetToken: token } = await forgotPassword(email.trim());
      if (token) {
        // Email delivery not configured: surface the token for the dev flow
        setResetToken(token);
        setTokenInput(token);
        setMessage({
          type: 'success',
          text: 'A reset token has been generated. Set your new password below.',
        });
      } else {
        setMessage({
          type: 'success',
          text: 'If an account exists for this email, a password reset link has been sent. Check your inbox.',
        });
        setEmail('');
      }
    } catch {
      // Backend error message is surfaced by the global error handler.
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = tokenInput.trim();
    if (!token) {
      setMessage({ type: 'error', text: 'Please enter the reset token.' });
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setMessage({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await resetPassword(token, newPassword);
      toast.success('Password reset successfully. You can now sign in.');
      setPassword('');
      setNewPassword('');
      setTokenInput('');
      setResetToken(null);
      setScreen('login');
    } catch {
      // Backend error message is surfaced by the global error handler.
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-8 py-10 animate-fadeIn text-slate-800">
      {/* Brand Logo and Title */}
      <div className="flex flex-col items-center text-center space-y-3">
        <img
          src="/Taskmandu-logo.png"
          alt="Taskmandu logo"
          className="h-14 w-14 rounded-2xl object-cover shadow-md shadow-teal-600/15"
        />
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">Taskmandu</h1>
          <p className="text-xs text-teal-600 font-extrabold uppercase tracking-widest mt-0.5">Workforce Hub</p>
        </div>
      </div>

      {/* Form title */}
      <div className="text-center space-y-1.5">
        {screen === 'login' ? (
          <>
            <h2 className="text-lg font-black text-slate-900">Sign In to Your Workspace</h2>
            <p className="text-xs text-slate-500 font-medium">Enter your corporate credentials to continue</p>
          </>
        ) : screen === 'register' ? (
          <>
            <h2 className="text-lg font-black text-slate-900">Create Corporate Account</h2>
            <p className="text-xs text-slate-500 font-medium">Sign up to request access to the Taskmandu Workforce network</p>
          </>
        ) : (
          <>
            <h2 className="text-lg font-black text-slate-900">Reset Your Password</h2>
            <p className="text-xs text-slate-500 font-medium">Request a reset token and set a new password</p>
          </>
        )}
      </div>

      {/* Alert Message Box */}
      {message && (
        <div className={`p-4 rounded-xl border text-xs font-semibold leading-relaxed ${message.type === 'success'
            ? 'bg-teal-50 border-teal-200 text-teal-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
          {message.text}
        </div>
      )}

      {/* LOGIN FORM */}
      {screen === 'login' && (
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Corporate Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Access Password</label>
              <button
                type="button"
                onClick={() => {
                  setScreen('forgot');
                  setMessage(null);
                }}
                className="text-[10px] text-teal-600 hover:text-teal-700 font-black tracking-wide uppercase transition cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Key className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Establishing Session…</span>
              </>
            ) : (
              <>
                <span>Verify & Establish Session</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* REGISTER FORM */}
      {screen === 'register' && (
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Your Display Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                autoComplete="name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your full name"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Corporate Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Choose Master Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            <p className="text-[9px] text-slate-400 font-semibold">
              Password must be at least 8 characters and include one uppercase letter and one number.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Creating Account…</span>
              </>
            ) : (
              <>
                <span>Register Account</span>
                <UserPlus className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* FORGOT PASSWORD FORM */}
      {screen === 'forgot' && !resetToken && (
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Registered Corporate Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating Token…</span>
              </>
            ) : (
              <>
                <span>Request Reset Token</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* RESET PASSWORD FORM (after token issued) */}
      {screen === 'forgot' && resetToken && (
        <form onSubmit={handleResetSubmit} className="space-y-4">
          {resetToken && (
            <div className="p-4 rounded-xl border border-teal-200 bg-teal-50 text-xs font-semibold leading-relaxed text-teal-800">
              <p className="font-black uppercase tracking-wider text-[10px] mb-1">Your Reset Token</p>
              <p className="font-mono break-all bg-white/70 border border-teal-200/60 rounded-lg px-2.5 py-1.5">{resetToken}</p>
              <p className="mt-2 text-[10px] text-teal-700 font-medium">
                Email delivery is not configured, so your token is shown here. It expires in 30 minutes.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Reset Token</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Key className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Paste the reset token"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition"
              />
            </div>
          </div>

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
            <p className="text-[9px] text-slate-400 font-semibold">
              Password must be at least 8 characters and include one uppercase letter and one number.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
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

      {/* Footer info */}
      <div className="text-center text-[10px] text-slate-400 font-semibold pt-4">
        © 2026 Taskmandu Technologies. Built for Enterprise Scale Operations.
      </div>
    </div>
  );
}
