import { memo } from 'react';
import { STRING_NAMES, STRING_SPACING, BASE_X, STRING_HEADER_Y, STRING_LABEL_Y } from '@/constants/fretboard';

type StringState = 'none' | 'open-circle' | 'muted' | 'open-diamond';

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
          />
        )}
        {state === 'muted' && (
          <text
            x={x}
            y={STRING_HEADER_Y + 5}
            textAnchor="middle"
            className="text-lg fill-zinc-300 font-bold pointer-events-none"
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
          />
        )}
      </g>
    </g>
  );
});

StringHeader.displayName = 'StringHeader';
