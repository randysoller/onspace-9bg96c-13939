import { memo } from 'react';
import { STRING_SPACING, FRET_SPACING, BASE_X, BASE_Y } from '@/constants/fretboard';
import type { FingerType } from '@/types/fretboard';

interface BarreMarkerProps {
  fret: number;
  fromString: number;
  toString: number;
  onDoubleClick: () => void;
}

export const BarreMarker = memo(({ fret, fromString, toString, onDoubleClick }: BarreMarkerProps) => {
  const x1 = BASE_X + fromString * STRING_SPACING;
  const x2 = BASE_X + toString * STRING_SPACING;
  const y = BASE_Y + (fret - 0.5) * FRET_SPACING;

  return (
    <line
      x1={x1}
      y1={y}
      x2={x2}
      y2={y}
      stroke="#f59e0b"
      strokeWidth="12"
      strokeLinecap="round"
      className="cursor-pointer"
      onDoubleClick={onDoubleClick}
      role="button"
      aria-label={`Barre chord marker on fret ${fret}, strings ${fromString + 1} to ${toString + 1}. Double-click to remove`}
      tabIndex={-1}
    />
  );
});

BarreMarker.displayName = 'BarreMarker';
