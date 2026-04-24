import { Link, useLocation } from 'react-router-dom';
import { Home, Library, Edit } from 'lucide-react';
import { useMetronomeUIStore } from '@/stores/metronomeUIStore';

// Custom Metronome Icon (old-time pyramid metronome)
const MetronomeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4l-8 14h16L12 4z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v10" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 18h8" />
  </svg>
);

// Custom Tuning Fork Icon
const TuningForkIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v8a3 3 0 006 0V3" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 11v10" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 21h4" />
  </svg>
);

export const MobileTabBar = () => {
  const location = useLocation();
  const { toggleMetronome, closeMetronome } = useMetronomeUIStore();

  return (
    <div 
      className="md:hidden bg-black/90 backdrop-blur-lg border-t border-amber-500/20" 
      style={{ 
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        transform: 'translate3d(0, 0, 0)',
        WebkitTransform: 'translate3d(0, 0, 0)',
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        isolation: 'isolate'
      }}
    >
      <div className="flex items-center justify-around h-16">
        {/* Home */}
        <Link
          to="/"
          onClick={closeMetronome}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            location.pathname === '/' ? 'text-amber-500' : 'text-zinc-400'
          }`}
        >
          <Home className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Home</span>
        </Link>

        {/* Tuner */}
        <Link
          to="/tuner"
          onClick={closeMetronome}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            location.pathname === '/tuner' ? 'text-amber-500' : 'text-zinc-400'
          }`}
        >
          <TuningForkIcon className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Tuner</span>
        </Link>

        {/* Metronome Button (Modal Trigger) */}
        <button
          onClick={toggleMetronome}
          className="flex flex-col items-center justify-center flex-1 h-full transition-colors text-zinc-400"
        >
          <MetronomeIcon className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Metronome</span>
        </button>

        {/* Library */}
        <Link
          to="/library"
          onClick={closeMetronome}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            location.pathname === '/library' ? 'text-amber-500' : 'text-zinc-400'
          }`}
        >
          <Library className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Chord Vault</span>
        </Link>

        {/* Editor */}
        <Link
          to="/editor"
          onClick={closeMetronome}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            location.pathname === '/editor' ? 'text-amber-500' : 'text-zinc-400'
          }`}
        >
          <Edit className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Editor</span>
        </Link>
      </div>
    </div>
  );
};
