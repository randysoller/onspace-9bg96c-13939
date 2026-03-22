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
    sm: { width: 180, height: 340, fretHeight: 25, stringSpacing: 28, padding: 35 },
    md: { width: 240, height: 460, fretHeight: 35, stringSpacing: 38, padding: 45 },
    lg: { width: 300, height: 580, fretHeight: 45, stringSpacing: 48, padding: 55 },
  };

  const { width, height, fretHeight, stringSpacing, padding } = dimensions[size];
  const numStrings = 6;
  const numFrets = 12;

  // Standard guitar tuning (E A D G B E) - low to high
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

  // Calculate dot/diamond sizes to match chord diagrams
  const dotRadius = size === 'sm' ? 10 : size === 'md' ? 13 : 15;
  const diamondSize = size === 'sm' ? 12 : size === 'md' ? 15 : 17;
  const openStringRadius = size === 'sm' ? 5 : size === 'md' ? 6 : 7;

  return (
    <div className="flex flex-col items-center">
      {showName && (
        <div className="text-center mb-6">
          <h3 className="text-3xl font-bold text-cyan-500">
            {rootNote} {scaleName}
          </h3>
        </div>
      )}

      <svg width={width} height={height} className="select-none">
        {/* Nut (thick top line) */}
        <rect 
          x={padding} 
          y={padding} 
          width={(numStrings - 1) * stringSpacing} 
          height="4" 
          fill="currentColor" 
          className="text-zinc-200" 
        />

        {/* Frets (horizontal lines) */}
        {Array.from({ length: numFrets }).map((_, i) => (
          <line
            key={`fret-${i + 1}`}
            x1={padding}
            y1={padding + (i + 1) * fretHeight}
            x2={padding + (numStrings - 1) * stringSpacing}
            y2={padding + (i + 1) * fretHeight}
            stroke="currentColor"
            strokeWidth="2.5"
            className="text-zinc-200"
          />
        ))}

        {/* Strings (vertical lines) */}
        {Array.from({ length: numStrings }).map((_, i) => (
          <line
            key={`string-${i}`}
            x1={padding + i * stringSpacing}
            y1={padding}
            x2={padding + i * stringSpacing}
            y2={padding + numFrets * fretHeight}
            stroke="currentColor"
            strokeWidth="2.5"
            className="text-zinc-200"
          />
        ))}

        {/* Fret markers (dots at 3, 5, 7, 9) */}
        {[3, 5, 7, 9].map(fret => (
          <circle
            key={`marker-${fret}`}
            cx={padding + ((numStrings - 1) * stringSpacing) / 2}
            cy={padding + (fret - 0.5) * fretHeight}
            r="4"
            fill="currentColor"
            className="text-zinc-700"
          />
        ))}
        {/* Double dots at 12th fret */}
        <circle
          cx={padding + ((numStrings - 1) * stringSpacing) / 2 - 12}
          cy={padding + (12 - 0.5) * fretHeight}
          r="4"
          fill="currentColor"
          className="text-zinc-700"
        />
        <circle
          cx={padding + ((numStrings - 1) * stringSpacing) / 2 + 12}
          cy={padding + (12 - 0.5) * fretHeight}
          r="4"
          fill="currentColor"
          className="text-zinc-700"
        />

        {/* Open string indicators (above nut) */}
        {scalePositions
          .filter(pos => pos.fret === 0)
          .map((pos, idx) => (
            <circle
              key={`open-${idx}`}
              cx={padding + pos.string * stringSpacing}
              cy={padding - 12}
              r={openStringRadius}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-emerald-500"
            />
          ))}

        {/* Scale positions (fretted notes only) */}
        {scalePositions
          .filter(pos => pos.fret > 0)
          .map((pos, idx) => {
            const x = padding + pos.string * stringSpacing;
            const y = padding + (pos.fret - 0.5) * fretHeight;

            if (pos.isRoot) {
              // Root note - cyan diamond (matching chord diagrams)
              return (
                <g key={`root-${idx}`}>
                  <path
                    d={`M ${x} ${y - diamondSize} 
                        L ${x + diamondSize} ${y} 
                        L ${x} ${y + diamondSize} 
                        L ${x - diamondSize} ${y} Z`}
                    fill="currentColor"
                    className="text-cyan-500"
                  />
                </g>
              );
            } else {
              // Scale note - amber circle (matching chord diagrams)
              return (
                <circle
                  key={`note-${idx}`}
                  cx={x}
                  cy={y}
                  r={dotRadius}
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
            className="text-sm text-zinc-400 font-bold"
            textAnchor="middle"
          >
            {note}
          </text>
        ))}
      </svg>

      {/* Legend - matching chord practice aesthetics */}
      <div className="flex items-center gap-6 mt-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full bg-amber-500" />
          <span className="text-zinc-400">Scale Note</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rotate-45 bg-cyan-500" />
          <span className="text-zinc-400">Root Note</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full border-2 border-emerald-500" />
          <span className="text-zinc-400">Open String</span>
        </div>
      </div>
    </div>
  );
};
