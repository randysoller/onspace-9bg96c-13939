import { memo } from 'react';
import { STRING_SPACING, FRET_SPACING, BASE_X, BASE_Y, MARKER_RADIUS } from '@/constants/fretboard';

interface DotMarkerProps {
  string: number;
  fret: number;
  finger: number | 'T';
  color: string;
  shape: 'circle' | 'diamond';
  label?: string;
  isHighlighted?: boolean;
  onClick: () => void;
}

export const DotMarker = memo(({ 
  string, 
  fret, 
  finger, 
  color, 
  shape, 
  label, 
  isHighlighted,
  onClick 
}: DotMarkerProps) => {
  const x = BASE_X + string * STRING_SPACING;
  const y = BASE_Y + (fret - 0.5) * FRET_SPACING;

  const textFill = color === '#ffffff' ? '#000000' : shape === 'diamond' ? '#ffffff' : '#1a1a1a';
  const displayText = label || finger;

  return (
    <g className="cursor-pointer" onClick={onClick}>
      {shape === 'circle' ? (
        <circle
          cx={x}
          cy={y}
          r={MARKER_RADIUS}
          fill={color}
          stroke={isHighlighted ? '#f59e0b' : 'none'}
          strokeWidth={isHighlighted ? '3' : '0'}
        />
      ) : (
        <path
          d={`M ${x} ${y - MARKER_RADIUS} L ${x + MARKER_RADIUS} ${y} L ${x} ${y + MARKER_RADIUS} L ${x - MARKER_RADIUS} ${y} Z`}
          fill={color}
          stroke={isHighlighted ? '#f59e0b' : 'none'}
          strokeWidth={isHighlighted ? '3' : '0'}
        />
      )}
      
      <text
        x={x}
        y={y + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        className={label ? "text-xs font-black pointer-events-none" : "text-sm font-black pointer-events-none"}
        fill={textFill}
      >
        {displayText}
      </text>
    </g>
  );
});

DotMarker.displayName = 'DotMarker';
