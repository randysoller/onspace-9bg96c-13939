import { memo } from 'react';
import { STRING_NAMES, STRING_SPACING, BASE_X, STRING_HEADER_Y, STRING_LABEL_Y } from '@/constants/fretboard';
import type { StringState } from '@/types/fretboard';

interface StringHeaderProps {
  stringIndex: number;
  state: StringState;
  onStateChange: (stringIndex: number) => void;
}

export const StringHeader = memo(({ stringIndex, state, onStateChange }: StringHeaderProps) => {
  const x = BASE_X + stringIndex * STRING_SPACING;

  return (
    <g>
      <text
        x={x}
        y={STRING_LABEL_Y}
        textAnchor="middle"
        className="text-xs fill-zinc-500 font-semibold"
      >
        {STRING_NAMES[stringIndex]}
      </text>
      
      {/* Open/Muted indicator with larger hit area */}
      <g
        onClick={() => onStateChange(stringIndex)}
        className="cursor-pointer"
        role="button"
        aria-label={`Toggle string ${STRING_NAMES[stringIndex]} state: ${state === 'open-circle' ? 'open' : state === 'muted' ? 'muted' : state === 'open-diamond' ? 'open diamond' : 'none'}`}
        tabIndex={0}
      >
        {/* Larger transparent hit area for easier clicking */}
        <circle
          cx={x}
          cy={STRING_HEADER_Y}
          r="16"
          fill="transparent"
          className="hover:fill-white/5"
        />
        
        {state === 'open-circle' && (
          <circle
            cx={x}
            cy={STRING_HEADER_Y}
            r="9"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="3"
            className="pointer-events-none"
            aria-hidden="true"
          />
        )}
        {state === 'muted' && (
          <text
            x={x}
            y={STRING_HEADER_Y + 5}
            textAnchor="middle"
            className="text-lg fill-zinc-300 font-bold pointer-events-none"
            aria-hidden="true"
          >
            ✕
          </text>
        )}
        {state === 'open-diamond' && (
          <path
            d={`M ${x} ${STRING_HEADER_Y - 9} L ${x + 9} ${STRING_HEADER_Y} L ${x} ${STRING_HEADER_Y + 9} L ${x - 9} ${STRING_HEADER_Y} Z`}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="3"
            className="pointer-events-none"
            aria-hidden="true"
          />
        )}
        {state === 'none' && (
          <circle
            cx={x}
            cy={STRING_HEADER_Y}
            r="9"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-zinc-600 hover:text-zinc-400 pointer-events-none"
            aria-hidden="true"
          />
        )}
      </g>
    </g>
  );
});

StringHeader.displayName = 'StringHeader';
