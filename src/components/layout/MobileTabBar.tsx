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
  const { toggleMetronome } = useMetronomeUIStore();

  const tabs = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/tuner', label: 'Tuner', icon: TuningForkIcon },
    { path: '/library', label: 'Library', icon: Library },
    { path: '/editor', label: 'Editor', icon: Edit },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-lg border-t border-amber-500/20 z-50">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? 'text-amber-500' : 'text-zinc-400'
              }`}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{tab.label}</span>
            </Link>
          );
        })}
        
        {/* Metronome Button (Modal Trigger) */}
        <button
          onClick={toggleMetronome}
          className="flex flex-col items-center justify-center flex-1 h-full transition-colors text-zinc-400"
        >
          <MetronomeIcon className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">Metronome</span>
        </button>
      </div>
    </div>
  );
};
