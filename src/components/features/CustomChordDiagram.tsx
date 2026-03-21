import { CustomChordData } from '@/types/customChord';

interface CustomChordDiagramProps {
  chord: CustomChordData;
  onMarkerClick?: (string: number, fret: number) => void;
  editable?: boolean;
}

export const CustomChordDiagram = ({ chord, onMarkerClick, editable = false }: CustomChordDiagramProps) => {
  const width = 200;
  const height = 250;
  const stringSpacing = 32;
  const fretHeight = 40;
  const numStrings = 6;
  const numFrets = 5;
  const padding = 30;

  const handleClick = (stringIndex: number, fret: number) => {
    if (editable && onMarkerClick) {
      onMarkerClick(stringIndex, fret);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="text-center mb-2">
        <h3 className="text-lg font-semibold text-amber-500">{chord.name}</h3>
        <p className="text-sm text-zinc-400">
          {chord.root} {chord.type}
        </p>
      </div>

      <svg width={width} height={height} className="select-none">
        {/* Strings */}
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

        {/* Frets */}
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

        {/* Markers */}
        {chord.markers.map((marker, idx) => {
          if (marker.fret === 0) {
            return (
              <circle
                key={`marker-${idx}`}
                cx={padding + marker.string * stringSpacing}
                cy={padding - 10}
                r="6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-emerald-500"
              />
            );
          } else {
            return (
              <circle
                key={`marker-${idx}`}
                cx={padding + marker.string * stringSpacing}
                cy={padding + (marker.fret - 0.5) * fretHeight}
                r="8"
                fill="currentColor"
                className="text-amber-500 cursor-pointer hover:text-amber-400"
                onClick={() => handleClick(marker.string, marker.fret)}
              />
            );
          }
        })}

        {/* Barres */}
        {chord.barres?.map((barre, idx) => {
          const markers = chord.markers.filter(m => m.fret === barre);
          if (markers.length < 2) return null;
          
          const minString = Math.min(...markers.map(m => m.string));
          const maxString = Math.max(...markers.map(m => m.string));

          return (
            <line
              key={`barre-${idx}`}
              x1={padding + minString * stringSpacing}
              y1={padding + (barre - 0.5) * fretHeight}
              x2={padding + maxString * stringSpacing}
              y2={padding + (barre - 0.5) * fretHeight}
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              className="text-amber-500"
            />
          );
        })}
      </svg>
    </div>
  );
};
