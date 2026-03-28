/**
 * Chord Tablature Component
 * 
 * Monospace text representation of chord fret positions
 * Reversed display order (high e on top, low E on bottom)
 */

import type { ChordData } from '@/types/chord';

interface ChordTablatureProps {
  chord: ChordData;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const STRINGS = ['e', 'B', 'G', 'D', 'A', 'E'];

const SIZES = {
  sm: { text: 'text-xs', gap: 'gap-1', padding: 'px-2 py-1.5' },
  md: { text: 'text-sm', gap: 'gap-1.5', padding: 'px-3 py-2' },
  lg: { text: 'text-base', gap: 'gap-2', padding: 'px-4 py-3' },
};

export function ChordTablature({ chord, size = 'md', className = '' }: ChordTablatureProps) {
  const { text, gap, padding } = SIZES[size];
  
  return (
    <div
      className={`bg-white rounded-lg border border-neutral-200 ${padding} ${className}`}
      role="img"
      aria-label={`${chord.symbol} chord tablature`}
    >
      <div className={`flex flex-col ${gap} font-mono ${text}`}>
        {/* Reversed order: high e on top */}
        {[...chord.frets].reverse().map((fret, idx) => {
          const stringName = STRINGS[idx];
          const isMuted = fret === -1;
          const display = fret === -1 ? 'x' : fret === 0 ? '0' : String(fret);
          
          return (
            <div key={stringName} className="flex items-center gap-2.5">
              <span className="text-zinc-800 font-bold w-3">{stringName}</span>
              <span className="text-zinc-400">—</span>
              <span className={`font-bold w-3 text-center ${isMuted ? 'text-zinc-400' : 'text-zinc-900'}`}>
                {display}
              </span>
              <span className="text-zinc-400">—</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
