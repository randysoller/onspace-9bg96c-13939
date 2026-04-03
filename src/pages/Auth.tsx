import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/lib/api/auth';
import { Mail, Lock, User, ShieldCheck } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { supabase } from '@/lib/supabase';

type AuthView = 'login' | 'signup' | 'forgot' | 'update-password';

const MIN_PASSWORD_LENGTH = 8;

function validatePassword(password: string): string {
  if (password.length < MIN_PASSWORD_LENGTH)
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/[0-9]/.test(password))  return 'Password must contain at least one number';
  return '';
}

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, setLoading } = useAuthStore();

  // Detect ?view=update-password in the URL (set by Supabase reset-link redirect)
  const urlView = searchParams.get('view') as AuthView | null;
  const [view, setView] = useState<AuthView>(
    urlView === 'update-password' ? 'update-password' : 'login',
  );

  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername]             = useState('');
  const [error, setError]                   = useState('');
  const [loading, setLocalLoading]          = useState(false);
  const [resetSent, setResetSent]           = useState(false);
  const [showForgotHint, setShowForgotHint] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  // When Supabase redirects back after a password-reset email click, it fires
  // a PASSWORD_RECOVERY auth event. We listen for it so we can confirm the
  // session is valid before letting the user submit the new-password form.
  useEffect(() => {
    if (view !== 'update-password') return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Session is now active with a recovery token — keep showing the form.
        console.log('[FretMaster] PASSWORD_RECOVERY event received — ready to set new password');
      }
    });

    return () => subscription.unsubscribe();
  }, [view]);

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowForgotHint(false);
    setLoading(true);
    setLocalLoading(true);
    try {
      const user = await authApi.signInWithPassword(email, password);
      login({
        id: user.id,
        email: user.email!,
        username: user.user_metadata?.username || user.email!.split('@')[0],
        avatar: user.user_metadata?.avatar_url,
      });
      navigate('/');
    } catch (err: unknown) {
      const code = (err as any)?.code;
      setError(err instanceof Error ? err.message : 'Login failed');
      if (code === 'invalid_credentials') setShowForgotHint(true);
      setLoading(false);
      setLocalLoading(false);
    }
  };

  // ── Forgot password ────────────────────────────────────────────────────────
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLocalLoading(true);
    try {
      await authApi.resetPassword(email);
      setResetSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setLocalLoading(false);
    }
  };

  // ── Update password (after clicking reset link) ────────────────────────────
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    const pwError = validatePassword(password);
    if (pwError) { setError(pwError); return; }

    setLocalLoading(true);
    try {
      await authApi.updatePassword(password);
      setPasswordUpdated(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setLocalLoading(false);
    }
  };

  // ── Sign up ────────────────────────────────────────────────────────────────
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    const pwError = validatePassword(password);
    if (pwError) { setError(pwError); return; }

    setLoading(true);
    setLocalLoading(true);
    try {
      const user = await authApi.signUp(email, password, username || email.split('@')[0]);
      login({
        id: user!.id,
        email: user!.email!,
        username: username || user!.email!.split('@')[0],
        avatar: user!.user_metadata?.avatar_url,
      });
      navigate('/');
    } catch (err: unknown) {
      const code = (err as any)?.code;
      if (code === 'user_already_exists') {
        setView('login');
        setError(err instanceof Error ? err.message : 'Account already exists. Please sign in.');
      } else {
        setError(err instanceof Error ? err.message : 'Sign up failed');
      }
      setLoading(false);
      setLocalLoading(false);
    }
  };

  // ── Shared subtitle ────────────────────────────────────────────────────────
  const subtitle = {
    login:           'Sign in to your account',
    signup:          'Create your account',
    forgot:          'Reset your password',
    'update-password': 'Set a new password',
  }[view];

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-amber-500 mb-2">FretMaster</h1>
          <p className="text-zinc-400">{subtitle}</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* ── LOGIN ── */}
        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                <Lock className="w-4 h-4 inline mr-2" />Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <LoadingSpinner size="sm" />}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
            {showForgotHint && (
              <div className="bg-amber-500/10 border border-amber-500/40 rounded-lg px-4 py-3 text-sm text-amber-400 text-center">
                Can&apos;t remember your password?{' '}
                <button
                  type="button"
                  onClick={() => { setView('forgot'); setError(''); setResetSent(false); setShowForgotHint(false); }}
                  className="underline font-bold hover:text-amber-300"
                >
                  Reset it here
                </button>
              </div>
            )}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => { setView('forgot'); setError(''); setResetSent(false); setShowForgotHint(false); }}
                className="text-zinc-400 hover:text-zinc-300 text-sm"
              >
                Forgot password?
              </button>
              <button
                type="button"
                onClick={() => { setView('signup'); setError(''); }}
                className="text-amber-500 hover:text-amber-400 text-sm"
              >
                Don&apos;t have an account? Sign up
              </button>
            </div>
          </form>
        )}

        {/* ── FORGOT PASSWORD ── */}
        {view === 'forgot' && (
          <div>
            {resetSent ? (
              <div className="text-center">
                <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-white mb-2">Check your email</h2>
                <p className="text-sm text-zinc-400 mb-6">
                  A reset link was sent to{' '}
                  <span className="text-white font-medium">{email}</span>.
                  Click the link in the email — it will bring you back here to set a new password.
                </p>
                <button
                  type="button"
                  onClick={() => { setView('login'); setResetSent(false); setEmail(''); }}
                  className="text-amber-500 hover:text-amber-400 text-sm"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-sm text-zinc-400 mb-2">
                  Enter your email and we&apos;ll send you a reset link.
                </p>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="your@email.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <LoadingSpinner size="sm" />}
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => { setView('login'); setError(''); }}
                    className="text-zinc-400 hover:text-zinc-300 text-sm"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ── UPDATE PASSWORD (landed here via reset email link) ── */}
        {view === 'update-password' && (
          <div>
            {passwordUpdated ? (
              <div className="text-center">
                <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <ShieldCheck className="w-7 h-7 text-emerald-400" />
                </div>
                <h2 className="text-lg font-bold text-white mb-2">Password updated!</h2>
                <p className="text-sm text-zinc-400 mb-6">
                  Your password has been changed. You can now sign in with your new password.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/auth')}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold py-3 rounded-lg transition-colors"
                >
                  Go to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <p className="text-sm text-zinc-400 mb-2">
                  Enter a new password for your account.
                </p>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    <Lock className="w-4 h-4 inline mr-2" />New Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoFocus
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="••••••••"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    8+ characters with uppercase, lowercase, and a number
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">
                    <Lock className="w-4 h-4 inline mr-2" />Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <LoadingSpinner size="sm" />}
                  {loading ? 'Updating…' : 'Set New Password'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ── SIGN UP ── */}
        {view === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                <User className="w-4 h-4 inline mr-2" />Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="your_username (optional)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                <Lock className="w-4 h-4 inline mr-2" />Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="••••••••"
              />
              <p className="text-xs text-zinc-500 mt-1">
                8+ characters with uppercase, lowercase, and a number
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                <Lock className="w-4 h-4 inline mr-2" />Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <LoadingSpinner size="sm" />}
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => { setView('login'); setError(''); }}
                className="text-amber-500 hover:text-amber-400 text-sm"
              >
                Already have an account? Sign in
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
