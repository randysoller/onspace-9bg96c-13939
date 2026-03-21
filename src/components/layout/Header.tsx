import { Link, useLocation } from 'react-router-dom';
import { Music, Home, Library, Edit, Mic, Radio } from 'lucide-react';

export const Header = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/metronome', label: 'Metronome', icon: Radio },
    { path: '/library', label: 'Library', icon: Library },
    { path: '/editor', label: 'Editor', icon: Edit },
    { path: '/tuner', label: 'Tuner', icon: Mic },
  ];

  return (
    <header className="bg-black/40 backdrop-blur-lg border-b border-amber-500/20">
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
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
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
          </nav>
        </div>
      </div>
    </header>
  );
};
