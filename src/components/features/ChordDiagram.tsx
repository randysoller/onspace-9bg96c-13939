import { ChordData } from '@/types/chord';

interface ChordDiagramProps {
  chord: ChordData;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

export const ChordDiagram = ({ chord, size = 'md', showName = true }: ChordDiagramProps) => {
  const dimensions = {
    sm: { width: 120, height: 140, fretHeight: 20, stringSpacing: 20 },
    md: { width: 180, height: 220, fretHeight: 32, stringSpacing: 30 },
    lg: { width: 240, height: 300, fretHeight: 45, stringSpacing: 40 },
  };

  const { width, height, fretHeight, stringSpacing } = dimensions[size];
  const numStrings = 6;
  const numFrets = 5;
  const padding = 30;

  const baseFret = chord.baseFret || 1;
  const showBaseFret = baseFret > 1;

  return (
    <div className="flex flex-col items-center">
      {showName && (
        <div className="text-center mb-2">
          <h3 className="text-lg font-semibold text-amber-500">
            {chord.root}
            <span className="text-sm text-zinc-400 ml-1">{chord.type}</span>
          </h3>
        </div>
      )}

      <svg width={width} height={height} className="select-none">
        {/* Base fret indicator */}
        {showBaseFret && (
          <text
            x={padding - 20}
            y={padding + fretHeight / 2}
            fill="currentColor"
            className="text-xs text-zinc-400"
            textAnchor="middle"
          >
            {baseFret}fr
          </text>
        )}

        {/* Strings (vertical lines) */}
        {Array.from({ length: numStrings }).map((_, i) => (
          <line
            key={`string-${i}`}
            x1={padding + i * stringSpacing}
            y1={padding}
            x2={padding + i * stringSpacing}
            y2={padding + numFrets * fretHeight}
            stroke="currentColor"
            strokeWidth="2"
            className="text-zinc-600"
          />
        ))}

        {/* Frets (horizontal lines) */}
        {Array.from({ length: numFrets + 1 }).map((_, i) => (
          <line
            key={`fret-${i}`}
            x1={padding}
            y1={padding + i * fretHeight}
            x2={padding + (numStrings - 1) * stringSpacing}
            y2={padding + i * fretHeight}
            stroke="currentColor"
            strokeWidth={i === 0 && baseFret === 1 ? '4' : '2'}
            className="text-zinc-600"
          />
        ))}

        {/* Barres */}
        {chord.barres?.map((barreFret, idx) => {
          const stringIndices = chord.frets
            .map((f, i) => (f === barreFret ? i : -1))
            .filter(i => i !== -1);
          
          if (stringIndices.length < 2) return null;

          const minString = Math.min(...stringIndices);
          const maxString = Math.max(...stringIndices);
          const fretPosition = barreFret - baseFret + 1;

          return (
            <line
              key={`barre-${idx}`}
              x1={padding + minString * stringSpacing}
              y1={padding + (fretPosition - 0.5) * fretHeight}
              x2={padding + maxString * stringSpacing}
              y2={padding + (fretPosition - 0.5) * fretHeight}
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              className="text-amber-500"
            />
          );
        })}

        {/* Finger positions */}
        {chord.frets.map((fret, stringIndex) => {
          if (fret === null || fret === -1) {
            // Muted string (X)
            return (
              <text
                key={`marker-${stringIndex}`}
                x={padding + stringIndex * stringSpacing}
                y={padding - 10}
                fill="currentColor"
                className="text-sm text-red-500 font-bold"
                textAnchor="middle"
              >
                ×
              </text>
            );
          } else if (fret === 0) {
            // Open string (O)
            return (
              <circle
                key={`marker-${stringIndex}`}
                cx={padding + stringIndex * stringSpacing}
                cy={padding - 10}
                r="6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-emerald-500"
              />
            );
          } else {
            // Fretted note
            const fretPosition = fret - baseFret + 1;
            return (
              <circle
                key={`marker-${stringIndex}`}
                cx={padding + stringIndex * stringSpacing}
                cy={padding + (fretPosition - 0.5) * fretHeight}
                r={size === 'sm' ? 6 : size === 'md' ? 8 : 10}
                fill="currentColor"
                className="text-amber-500"
              />
            );
          }
        })}
      </svg>
    </div>
  );
};
