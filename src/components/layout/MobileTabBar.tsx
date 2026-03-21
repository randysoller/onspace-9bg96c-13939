import { Link, useLocation } from 'react-router-dom';
import { Music, Home, Library, Edit, Mic } from 'lucide-react';

export const MobileTabBar = () => {
  const location = useLocation();

  const tabs = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/practice', label: 'Practice', icon: Music },
    { path: '/library', label: 'Library', icon: Library },
    { path: '/editor', label: 'Editor', icon: Edit },
    { path: '/tuner', label: 'Tuner', icon: Mic },
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
      </div>
    </div>
  );
};
