import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/lib/api/auth';
import { LogIn, Mail, Lock, User } from 'lucide-react';

type AuthView = 'login' | 'signup' | 'verify';

// Password validation constants
const MIN_PASSWORD_LENGTH = 8;
const PASSWORD_REQUIREMENTS = {
  minLength: MIN_PASSWORD_LENGTH,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
};

// Common weak passwords to reject
const COMMON_WEAK_PASSWORDS = [
  'password', '12345678', 'password123', 'qwerty123', 'abc12345',
  'letmein', 'welcome1', 'monkey123', 'dragon123', 'master123',
];

function validatePasswordStrength(password: string): { isValid: boolean; error: string } {
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    return { isValid: false, error: `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters` };
  }

  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (PASSWORD_REQUIREMENTS.requireNumber && !/[0-9]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }

  if (COMMON_WEAK_PASSWORDS.includes(password.toLowerCase())) {
    return { isValid: false, error: 'This password is too common. Please choose a stronger password' };
  }

  return { isValid: true, error: '' };
}

export default function Auth() {
  const navigate = useNavigate();
  const { login, setLoading } = useAuthStore();
  
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // FIX #5: Add password confirmation
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLocalLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      setLoading(false);
      setLocalLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLocalLoading(true);

    try {
      await authApi.sendOtp(email);
      setView('verify');
      setLocalLoading(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send verification code';
      setError(errorMessage);
      setLocalLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // FIX #5: Check password confirmation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.error);
      return;
    }

    setLoading(true);
    setLocalLoading(true);

    try {
      const user = await authApi.verifyOtpAndSetPassword(email, otp, password, username);
      login({
        id: user!.id,
        email: user!.email!,
        username: username || user!.email!.split('@')[0],
        avatar: user!.user_metadata?.avatar_url,
      });
      navigate('/');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Verification failed';
      setError(errorMessage);
      setLoading(false);
      setLocalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-amber-500 mb-2">FretMaster</h1>
          <p className="text-zinc-400">
            {view === 'login' && 'Sign in to your account'}
            {view === 'signup' && 'Create your account'}
            {view === 'verify' && 'Verify your email'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setView('signup')}
                className="text-amber-500 hover:text-amber-400 text-sm"
              >
                Don't have an account? Sign up
              </button>
            </div>
          </form>
        )}

        {view === 'signup' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="your@email.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending code...' : 'Send Verification Code'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setView('login')}
                className="text-amber-500 hover:text-amber-400 text-sm"
              >
                Already have an account? Sign in
              </button>
            </div>
          </form>
        )}

        {view === 'verify' && (
          <form onSubmit={handleVerifyAndRegister} className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/50 text-amber-500 px-4 py-3 rounded-lg text-sm mb-4">
              Check your email for the verification code
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="123456"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="your_username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={MIN_PASSWORD_LENGTH}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="••••••••"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Must be {MIN_PASSWORD_LENGTH}+ characters with uppercase, lowercase, and number
              </p>
            </div>

            {/* FIX #5: Add password confirmation field */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={MIN_PASSWORD_LENGTH}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Complete Registration'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setView('signup')}
                className="text-amber-500 hover:text-amber-400 text-sm"
              >
                Back to email entry
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
