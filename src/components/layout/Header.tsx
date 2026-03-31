import { Link, useLocation } from 'react-router-dom';
import { Music, Home, Library, Edit, LogIn, LogOut, BarChart3, Trophy, Target, Music2, TrendingUp, Settings as SettingsIcon, BookOpen, Zap } from 'lucide-react';
import { useMetronomeUIStore } from '@/stores/metronomeUIStore';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/lib/api/auth';
import { NotificationCenter } from '@/components/layout/NotificationCenter';

// ─── Custom Icons ─────────────────────────────────────────────────────────────

const MetronomeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4l-8 14h16L12 4z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v10" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 18h8" />
  </svg>
);

const TuningForkIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v8a3 3 0 006 0V3" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 11v10" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 21h4" />
  </svg>
);

// ─── Nav Item Constants (module-level — never reallocated on render) ──────────

const NAV_ITEMS = [
  { path: '/',        label: 'Home',    icon: Home },
  { path: '/tuner',   label: 'Tuner',   icon: TuningForkIcon },
  { path: '/library', label: 'Library', icon: Library },
  { path: '/editor',  label: 'Editor',  icon: Edit },
] as const;

const USER_MENU_ITEMS = [
  { path: '/lessons',      label: 'Lessons',      icon: BookOpen },
  { path: '/challenges',   label: 'Challenges',   icon: Zap },
  { path: '/songs',        label: 'Songs',        icon: Music2 },
  { path: '/analytics',    label: 'Analytics',    icon: TrendingUp },
  { path: '/goals',        label: 'Goals',        icon: Target },
  { path: '/achievements', label: 'Achievements', icon: Trophy },
  { path: '/leaderboard',  label: 'Leaderboard',  icon: Trophy },
  { path: '/history',      label: 'History',      icon: BarChart3 },
  { path: '/settings',     label: 'Settings',     icon: SettingsIcon },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export const Header = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const { toggleMetronome, closeMetronome } = useMetronomeUIStore();

  const handleSignOut = async () => {
    try {
      await authApi.signOut();
      window.location.href = '/';
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-black/40 backdrop-blur-lg border-b border-amber-500/20 z-[70]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Music className="w-8 h-8 text-amber-500" />
            <span className="text-xl font-bold bg-gradient-to-r from-amber-500 to-amber-300 bg-clip-text text-transparent">
              FretMaster
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">

            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeMetronome}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-500'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}

            {/* Metronome trigger */}
            <button
              onClick={toggleMetronome}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-zinc-400 hover:text-white hover:bg-white/5"
            >
              <MetronomeIcon className="w-5 h-5" />
              <span className="font-medium">Metronome</span>
            </button>

            {/* Authenticated user menu */}
            {user && USER_MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeMetronome}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-500'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}

            {/* Auth */}
            {user ? (
              <div className="flex items-center gap-3 ml-4 pl-4 border-l border-zinc-800">
                <NotificationCenter />
                <div className="text-sm text-zinc-400">{user.username}</div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-zinc-400 hover:text-white hover:bg-white/5"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-zinc-400 hover:text-white hover:bg-white/5 ml-4 pl-4 border-l border-zinc-800"
              >
                <LogIn className="w-5 h-5" />
                <span className="font-medium">Sign In</span>
              </Link>
            )}

          </nav>
        </div>
      </div>
    </header>
  );
};
