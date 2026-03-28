/**
 * Show Diagrams Toggle Component
 * 
 * Toggle button with pill indicator for showing/hiding chord diagrams
 * Persists preference to localStorage
 */

import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const STORAGE_KEY = 'fretmaster-show-diagrams';

interface ShowDiagramsToggleProps {
  className?: string;
}

export function ShowDiagramsToggle({ className = '' }: ShowDiagramsToggleProps) {
  const [showDiagrams, setShowDiagrams] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(showDiagrams));
  }, [showDiagrams]);

  const handleToggle = () => {
    setShowDiagrams(!showDiagrams);
  };

  return (
    <button
      onClick={handleToggle}
      className={`
        px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-semibold transition-all
        active:scale-95
        ${
          showDiagrams
            ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/40'
            : 'bg-[hsl(var(--bg-surface))] text-[hsl(var(--text-subtle))] border border-[hsl(var(--border-subtle))]'
        }
        ${className}
      `}
    >
      {showDiagrams ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
      <span className="hidden sm:inline">
        Chord Diagram {showDiagrams ? 'On' : 'Off'}
      </span>
      {/* Toggle pill indicator */}
      <div
        className={`
          w-8 h-[18px] rounded-full relative transition-colors
          ${showDiagrams ? 'bg-emerald-500' : 'bg-zinc-600'}
        `}
      >
        <div
          className={`
            absolute w-[14px] h-[14px] bg-white rounded-full top-0.5 transition-transform
            ${showDiagrams ? 'translate-x-4' : 'translate-x-0.5'}
          `}
        />
      </div>
    </button>
  );
}

/**
 * Hook to access show diagrams state from anywhere
 */
export function useShowDiagrams() {
  const [showDiagrams, setShowDiagrams] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        setShowDiagrams(saved !== null ? JSON.parse(saved) : true);
      } catch {}
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return showDiagrams;
}
