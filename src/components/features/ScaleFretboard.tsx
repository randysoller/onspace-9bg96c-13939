interface ScaleFretboardProps {
  scaleName: string;
  rootNote: string;
  scaleNotes: number[]; // Semitone intervals from root
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

export const ScaleFretboard = ({ 
  scaleName, 
  rootNote, 
  scaleNotes, 
  size = 'md', 
  showName = true 
}: ScaleFretboardProps) => {
  const dimensions = {
    sm: { width: 120, height: 280, fretHeight: 20, stringSpacing: 20 },
    md: { width: 180, height: 420, fretHeight: 32, stringSpacing: 30 },
    lg: { width: 240, height: 560, fretHeight: 45, stringSpacing: 40 },
  };

  const { width, height, fretHeight, stringSpacing } = dimensions[size];
  const numStrings = 6;
  const numFrets = 12;
  const padding = 30;

  // Standard guitar tuning (E A D G B E)
  const stringTuning = ['E', 'B', 'G', 'D', 'A', 'E'];
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  // Get root note index
  const rootIndex = noteNames.indexOf(rootNote);

  // Calculate which frets contain scale notes
  const getScalePositions = () => {
    const positions: { string: number; fret: number; isRoot: boolean }[] = [];

    stringTuning.forEach((openNote, stringIndex) => {
      const openNoteIndex = noteNames.indexOf(openNote);

      for (let fret = 0; fret <= numFrets; fret++) {
        const noteIndex = (openNoteIndex + fret) % 12;
        const intervalFromRoot = (noteIndex - rootIndex + 12) % 12;

        if (scaleNotes.includes(intervalFromRoot)) {
          positions.push({
            string: stringIndex,
            fret,
            isRoot: intervalFromRoot === 0,
          });
        }
      }
    });

    return positions;
  };

  const scalePositions = getScalePositions();

  return (
    <div className="flex flex-col items-center">
      {showName && (
        <div className="text-center mb-4">
          <h3 className="text-2xl font-bold text-cyan-500">
            {rootNote} {scaleName}
          </h3>
        </div>
      )}

      <svg width={width} height={height} className="select-none">
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
            strokeWidth={i === 0 ? '4' : '2'}
            className="text-zinc-600"
          />
        ))}

        {/* Fret markers (dots at 3, 5, 7, 9, 12) */}
        {[3, 5, 7, 9].map(fret => (
          <circle
            key={`marker-${fret}`}
            cx={width / 2}
            cy={padding + (fret - 0.5) * fretHeight}
            r="3"
            fill="currentColor"
            className="text-zinc-700"
          />
        ))}
        {/* Double dots at 12th fret */}
        <circle
          cx={width / 2 - 8}
          cy={padding + (12 - 0.5) * fretHeight}
          r="3"
          fill="currentColor"
          className="text-zinc-700"
        />
        <circle
          cx={width / 2 + 8}
          cy={padding + (12 - 0.5) * fretHeight}
          r="3"
          fill="currentColor"
          className="text-zinc-700"
        />

        {/* Scale positions */}
        {scalePositions.map((pos, idx) => {
          if (pos.fret === 0) {
            // Open string - green circle outline
            return (
              <circle
                key={`pos-${idx}`}
                cx={padding + pos.string * stringSpacing}
                cy={padding - 10}
                r="6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-emerald-500"
              />
            );
          } else if (pos.isRoot) {
            // Root note - cyan diamond
            const x = padding + pos.string * stringSpacing;
            const y = padding + (pos.fret - 0.5) * fretHeight;
            const diamondSize = size === 'sm' ? 6 : size === 'md' ? 8 : 10;

            return (
              <g key={`pos-${idx}`}>
                <polygon
                  points={`
                    ${x},${y - diamondSize}
                    ${x + diamondSize},${y}
                    ${x},${y + diamondSize}
                    ${x - diamondSize},${y}
                  `}
                  fill="currentColor"
                  className="text-cyan-500"
                />
              </g>
            );
          } else {
            // Scale note - orange dot
            return (
              <circle
                key={`pos-${idx}`}
                cx={padding + pos.string * stringSpacing}
                cy={padding + (pos.fret - 0.5) * fretHeight}
                r={size === 'sm' ? 6 : size === 'md' ? 8 : 10}
                fill="currentColor"
                className="text-amber-500"
              />
            );
          }
        })}

        {/* String labels */}
        {stringTuning.map((note, i) => (
          <text
            key={`string-label-${i}`}
            x={padding + i * stringSpacing}
            y={padding + numFrets * fretHeight + 20}
            fill="currentColor"
            className="text-xs text-zinc-500"
            textAnchor="middle"
          >
            {note}
          </text>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-cyan-500 rotate-45" />
          <span>Root</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span>Scale Note</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border-2 border-emerald-500" />
          <span>Open String</span>
        </div>
      </div>
    </div>
  );
};
