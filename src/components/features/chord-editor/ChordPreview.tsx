import { memo, useMemo } from 'react';
import { 
  PREVIEW_FRET_SPACING, 
  PREVIEW_STRING_SPACING, 
  PREVIEW_BASE_X, 
  PREVIEW_BASE_Y,
  PREVIEW_MARKER_RADIUS 
} from '@/constants/fretboard';

type StringState = 'none' | 'open-circle' | 'muted' | 'open-diamond';

interface DotMarkerData {
  string: number;
  fret: number;
  finger: number | 'T';
  color: string;
  shape: 'circle' | 'diamond';
  label?: string;
}

interface BarreMarkerData {
  fret: number;
  fromString: number;
  toString: number;
}

interface ChordPreviewProps {
  symbol: string;
  chordName: string;
  markers: DotMarkerData[];
  barres: BarreMarkerData[];
  openStrings: StringState[];
}

export const ChordPreview = memo(({ symbol, chordName, markers, barres, openStrings }: ChordPreviewProps) => {
  // Memoize static fret lines
  const fretLines = useMemo(() => 
    [1, 2, 3, 4].map((fret) => (
      <line
        key={`preview-fret-${fret}`}
        x1={PREVIEW_BASE_X}
        y1={PREVIEW_BASE_Y + fret * PREVIEW_FRET_SPACING}
        x2={PREVIEW_BASE_X + 5 * PREVIEW_STRING_SPACING}
        y2={PREVIEW_BASE_Y + fret * PREVIEW_FRET_SPACING}
        stroke="currentColor"
        strokeWidth="2"
        className="text-zinc-200"
      />
    )),
    []
  );

  // Memoize static string lines
  const stringLines = useMemo(() =>
    [0, 1, 2, 3, 4, 5].map((string) => (
      <line
        key={`preview-string-${string}`}
        x1={PREVIEW_BASE_X + string * PREVIEW_STRING_SPACING}
        y1={PREVIEW_BASE_Y}
        x2={PREVIEW_BASE_X + string * PREVIEW_STRING_SPACING}
        y2={PREVIEW_BASE_Y + 4 * PREVIEW_FRET_SPACING}
        stroke="currentColor"
        strokeWidth="2"
        className="text-zinc-200"
      />
    )),
    []
  );

  return (
    <div className="text-center">
      <div className="text-5xl font-black text-amber-500 mb-1">{symbol || 'C'}</div>
      <div className="text-sm text-zinc-500 mb-6">{chordName || 'C Major'}</div>

      <div className="flex justify-center">
        <svg width="180" height="220" viewBox="0 0 180 220">
          {/* Nut */}
          <rect x={PREVIEW_BASE_X} y={PREVIEW_BASE_Y} width="120" height="4" fill="currentColor" className="text-zinc-200" />

          {/* Frets */}
          {fretLines}

          {/* Strings */}
          {stringLines}

          {/* Open/Muted markers */}
          {openStrings.map((state, idx) => {
            const x = PREVIEW_BASE_X + idx * PREVIEW_STRING_SPACING;
            
            if (state === 'open-circle') {
              return (
                <circle
                  key={`preview-open-${idx}`}
                  cx={x}
                  cy={10}
                  r="7"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                />
              );
            } else if (state === 'muted') {
              return (
                <text
                  key={`preview-muted-${idx}`}
                  x={x}
                  y={14}
                  textAnchor="middle"
                  className="text-base fill-zinc-300 font-bold"
                >
                  ✕
                </text>
              );
            } else if (state === 'open-diamond') {
              return (
                <path
                  key={`preview-diamond-${idx}`}
                  d={`M ${x} ${10 - 8.4} L ${x + 8.4} ${10} L ${x} ${10 + 8.4} L ${x - 8.4} ${10} Z`}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                />
              );
            }
            return null;
          })}

          {/* Barres in preview */}
          {barres.map((barre, idx) => {
            const x1 = PREVIEW_BASE_X + barre.fromString * PREVIEW_STRING_SPACING;
            const x2 = PREVIEW_BASE_X + barre.toString * PREVIEW_STRING_SPACING;
            const y = PREVIEW_BASE_Y + (barre.fret - 0.5) * PREVIEW_FRET_SPACING;

            return (
              <line
                key={`preview-barre-${idx}`}
                x1={x1}
                y1={y}
                x2={x2}
                y2={y}
                stroke="#f59e0b"
                strokeWidth="8"
                strokeLinecap="round"
              />
            );
          })}

          {/* Markers */}
          {markers.map((marker, idx) => {
            const x = PREVIEW_BASE_X + marker.string * PREVIEW_STRING_SPACING;
            const y = PREVIEW_BASE_Y + (marker.fret - 0.5) * PREVIEW_FRET_SPACING;
            const textFill = marker.color === '#ffffff' ? '#000000' : '#ffffff';

            return (
              <g key={`preview-marker-${idx}`}>
                {marker.shape === 'circle' ? (
                  <circle cx={x} cy={y} r={PREVIEW_MARKER_RADIUS} fill={marker.color} />
                ) : (
                  <path
                    d={`M ${x} ${y - PREVIEW_MARKER_RADIUS * 1.2} L ${x + PREVIEW_MARKER_RADIUS * 1.2} ${y} L ${x} ${y + PREVIEW_MARKER_RADIUS * 1.2} L ${x - PREVIEW_MARKER_RADIUS * 1.2} ${y} Z`}
                    fill={marker.color}
                  />
                )}
                <text
                  x={x}
                  y={y + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs font-black"
                  fill={textFill}
                  style={marker.shape === 'diamond' ? { fontFeatureSettings: '"tnum"' } : undefined}
                >
                  {marker.label || marker.finger}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
});

ChordPreview.displayName = 'ChordPreview';
