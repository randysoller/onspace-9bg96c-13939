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

        {/* Muted/Open markers above nut */}
        {chord.frets.map((fret, stringIndex) => {
          const isRoot = stringIndex === (chord.rootString ?? -1);
          const openCircleRadius = size === 'sm' ? 5.35 : size === 'md' ? 8.01 : 10.68; // 90% of finger dot, then 10% smaller = 8.91
          
          if (fret === null || fret === -1) {
            // Muted string - gray X matching fret/string color, same size as open circles
            return (
              <text
                key={`marker-${stringIndex}`}
                x={padding + stringIndex * stringSpacing}
                y={padding - 10}
                fill="#71717a"
                className="font-bold"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ fontSize: size === 'sm' ? '17px' : size === 'md' ? '24px' : '33px' }}
              >
                ✕
              </text>
            );
          } else if (fret === 0) {
            if (isRoot) {
              // Open root note - blue diamond (5% increase)
              const diamondSize = size === 'sm' ? 4.725 : size === 'md' ? 8.0325 : 11.34;
              return (
                <path
                  key={`marker-${stringIndex}`}
                  d={`M ${padding + stringIndex * stringSpacing} ${padding - 10 - diamondSize} 
                      L ${padding + stringIndex * stringSpacing + diamondSize} ${padding - 10} 
                      L ${padding + stringIndex * stringSpacing} ${padding - 10 + diamondSize} 
                      L ${padding + stringIndex * stringSpacing - diamondSize} ${padding - 10} Z`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={size === 'sm' ? '1.5' : size === 'md' ? '2.5' : '3.5'}
                  className="text-cyan-500"
                />
              );
            } else {
              // Open string - orange circle border
              return (
                <circle
                  key={`marker-${stringIndex}`}
                  cx={padding + stringIndex * stringSpacing}
                  cy={padding - 10}
                  r={openCircleRadius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={size === 'sm' ? '1.5' : size === 'md' ? '2.5' : '3.5'}
                  className="text-amber-500"
                />
              );
            }
          }
          return null;
        })}

        {/* Finger positions on fretboard */}
        {chord.frets.map((fret, stringIndex) => {
          if (fret > 0) {
            const isRoot = stringIndex === (chord.rootString ?? -1);
            const fretPosition = fret - baseFret + 1;
            const fingerDotRadius = size === 'sm' ? 6 : size === 'md' ? 9 : 12;
            
            if (isRoot) {
              // Root note - cyan diamond (5% increase)
              const diamondSize = size === 'sm' ? 6.615 : size === 'md' ? 10.8675 : 15.12;
              return (
                <path
                  key={`marker-${stringIndex}`}
                  d={`M ${padding + stringIndex * stringSpacing} ${padding + (fretPosition - 0.5) * fretHeight - diamondSize} 
                      L ${padding + stringIndex * stringSpacing + diamondSize} ${padding + (fretPosition - 0.5) * fretHeight} 
                      L ${padding + stringIndex * stringSpacing} ${padding + (fretPosition - 0.5) * fretHeight + diamondSize} 
                      L ${padding + stringIndex * stringSpacing - diamondSize} ${padding + (fretPosition - 0.5) * fretHeight} Z`}
                  fill="currentColor"
                  className="text-cyan-500"
                />
              );
            } else {
              // Regular finger dot - amber circle
              return (
                <circle
                  key={`marker-${stringIndex}`}
                  cx={padding + stringIndex * stringSpacing}
                  cy={padding + (fretPosition - 0.5) * fretHeight}
                  r={fingerDotRadius}
                  fill="currentColor"
                  className="text-amber-500"
                />
              );
            }
          }
          return null;
        })}
      </svg>
    </div>
  );
};
