/**
 * Show Chord Name Toggle Component
 * 
 * Toggle button with pill indicator for showing/hiding chord name subtitle
 * Persists preference to localStorage
 */

import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const STORAGE_KEY = 'fretmaster-show-chord-name';

interface ShowChordNameToggleProps {
  className?: string;
}

export function ShowChordNameToggle({ className = '' }: ShowChordNameToggleProps) {
  const [showChordName, setShowChordName] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(showChordName));
  }, [showChordName]);

  const handleToggle = () => {
    const newValue = !showChordName;
    setShowChordName(newValue);
    
    // Dispatch custom event for other components to listen to
    window.dispatchEvent(new CustomEvent('show-chord-name-changed', { 
      detail: { showChordName: newValue } 
    }));
  };

  return (
    <button
      onClick={handleToggle}
      className={`
        px-2 py-1.5 rounded-lg flex items-center gap-2 text-xs font-semibold transition-all
        active:scale-95
        ${
          showChordName
            ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/40'
            : 'bg-[hsl(var(--bg-surface))] text-[hsl(var(--text-subtle))] border border-[hsl(var(--border-subtle))]'
        }
        ${className}
      `}
    >
      {showChordName ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
      {/* Toggle pill indicator */}
      <div
        className={`
          w-8 h-[18px] rounded-full relative transition-colors
          ${showChordName ? 'bg-emerald-500' : 'bg-zinc-600'}
        `}
      >
        <div
          className={`
            absolute w-[14px] h-[14px] bg-white rounded-full top-0.5 transition-transform
            ${showChordName ? 'translate-x-4' : 'translate-x-0.5'}
          `}
        />
      </div>
    </button>
  );
}

/**
 * Hook to access show chord name state from anywhere
 */
export function useShowChordName() {
  const [showChordName, setShowChordName] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    // Listen for changes from other components in the same window
    const handleChordNameChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ showChordName: boolean }>;
      setShowChordName(customEvent.detail.showChordName);
    };

    // Listen for storage changes from other tabs
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        setShowChordName(saved !== null ? JSON.parse(saved) : true);
      } catch {}
    };

    window.addEventListener('show-chord-name-changed', handleChordNameChange);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('show-chord-name-changed', handleChordNameChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return showChordName;
}
