import { memo, useCallback, useMemo } from 'react';
import { StringHeader } from './StringHeader';
import { DotMarker } from './DotMarker';
import { BarreMarker } from './BarreMarker';
import { 
  STRING_NAMES, 
  STRING_SPACING, 
  FRET_SPACING, 
  BASE_X, 
  BASE_Y,
  NUT_Y 
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
  finger: number | 'T';
}

interface FretboardSVGProps {
  baseFret: number;
  visibleFrets: number;
  markers: DotMarkerData[];
  barres: BarreMarkerData[];
  openStrings: StringState[];
  selectedFinger: number | 'T';
  barreMode: boolean;
  barreFret: number | null;
  barreFirstString: number | null;
  onFretClick: (string: number, fret: number) => void;
  onStringHeaderClick: (string: number) => void;
  onBarreDoubleClick: (index: number) => void;
  onFingerSelect: (finger: number | 'T') => void;
  onBarreToggle: () => void;
}

export const FretboardSVG = memo(({
  baseFret,
  visibleFrets,
  markers,
  barres,
  openStrings,
  selectedFinger,
  barreMode,
  barreFret,
  barreFirstString,
  onFretClick,
  onStringHeaderClick,
  onBarreDoubleClick,
  onFingerSelect,
  onBarreToggle,
}: FretboardSVGProps) => {
  // Memoize fret lines to avoid recalculation on every render
  const fretLines = useMemo(() => 
    Array.from({ length: visibleFrets }).map((_, fretIdx) => (
      <line
        key={`fret-${fretIdx}`}
        x1="15"
        y1={BASE_Y + (fretIdx + 1) * FRET_SPACING}
        x2="285"
        y2={BASE_Y + (fretIdx + 1) * FRET_SPACING}
        stroke="currentColor"
        strokeWidth="2"
        className="text-zinc-200"
      />
    )),
    [visibleFrets]
  );

  // Memoize string lines
  const stringLines = useMemo(() =>
    STRING_NAMES.map((_, stringIdx) => (
      <line
        key={`string-${stringIdx}`}
        x1={BASE_X + stringIdx * STRING_SPACING}
        y1={NUT_Y}
        x2={BASE_X + stringIdx * STRING_SPACING}
        y2={BASE_Y + visibleFrets * FRET_SPACING}
        stroke="currentColor"
        strokeWidth="2"
        className="text-zinc-200"
      />
    )),
    [visibleFrets]
  );

  // Memoize fret number labels
  const fretNumberLabels = useMemo(() =>
    Array.from({ length: visibleFrets }).map((_, fretIdx) => (
      <text
        key={`fret-num-${fretIdx}`}
        x="300"
        y={BASE_Y + (fretIdx + 0.5) * FRET_SPACING + 5}
        className="text-xs fill-zinc-600"
      >
        {baseFret + fretIdx}
      </text>
    )),
    [baseFret, visibleFrets]
  );

  // Memoize interactive areas
  const interactiveAreas = useMemo(() =>
    STRING_NAMES.flatMap((_, stringIdx) =>
      Array.from({ length: visibleFrets }).map((_, fretIdx) => (
        <rect
          key={`hit-${stringIdx}-${fretIdx}`}
          x={BASE_X + stringIdx * STRING_SPACING - 20}
          y={BASE_Y + fretIdx * FRET_SPACING}
          width={40}
          height={FRET_SPACING}
          fill="transparent"
          className="cursor-pointer hover:fill-white/5"
          onClick={() => onFretClick(stringIdx, fretIdx + 1)}
        />
      ))
    ),
    [visibleFrets, onFretClick]
  );

  // Memoized callbacks
  const handleMarkerClick = useCallback((string: number, fret: number) => {
    onFretClick(string, fret);
  }, [onFretClick]);

  const handleBarreDoubleClick = useCallback((index: number) => {
    onBarreDoubleClick(index);
  }, [onBarreDoubleClick]);

  return (
    <svg width="320" height="400" viewBox="0 0 320 400" className="select-none">
      {/* String labels and headers */}
      {STRING_NAMES.map((_, idx) => (
        <StringHeader
          key={`string-header-${idx}`}
          stringIndex={idx}
          state={openStrings[idx]}
          onStateChange={onStringHeaderClick}
        />
      ))}

      {/* Finger selector buttons */}
      <g>
        {[1, 2, 3, 4, 'T', '-', 'Barre'].map((label, idx) => {
          const x = BASE_X + idx * 35;
          const isFingerButton = typeof label === 'number' || label === 'T';
          const isSelected = selectedFinger === label && isFingerButton;
          const isBarreButton = label === 'Barre';
          const isBarreActive = barreMode && isBarreButton;
          
          return (
            <g key={`fret-label-${idx}`}>
              {isFingerButton && (
                <rect
                  x={x - 15}
                  y={55}
                  width={30}
                  height={24}
                  rx={6}
                  fill={isSelected ? '#f59e0b' : 'transparent'}
                  className="cursor-pointer"
                  onClick={() => onFingerSelect(label as number | 'T')}
                />
              )}
              {isBarreButton && (
                <rect
                  x={x - 20}
                  y={55}
                  width={40}
                  height={24}
                  rx={6}
                  fill={isBarreActive ? '#f59e0b' : 'transparent'}
                  className="cursor-pointer"
                  onClick={onBarreToggle}
                />
              )}
              <text
                x={x}
                y={72}
                textAnchor="middle"
                className={`text-xs font-semibold cursor-pointer ${
                  isSelected || isBarreActive ? 'fill-zinc-950' : 'fill-zinc-500'
                }`}
                onClick={() => {
                  if (isFingerButton) {
                    onFingerSelect(label as number | 'T');
                  } else if (isBarreButton) {
                    onBarreToggle();
                  }
                }}
              >
                {label}
              </text>
            </g>
          );
        })}
      </g>

      {/* Nut (thick top line) */}
      <rect x="15" y={NUT_Y} width="270" height="4" fill="currentColor" className="text-zinc-200" />

      {/* Fret lines */}
      {fretLines}

      {/* String lines */}
      {stringLines}

      {/* Fret number labels */}
      {fretNumberLabels}

      {/* Interactive fret areas */}
      {interactiveAreas}

      {/* Barres - draw before markers */}
      {barres.map((barre, idx) => (
        <BarreMarker
          key={`barre-${idx}`}
          fret={barre.fret}
          fromString={barre.fromString}
          toString={barre.toString}
          onDoubleClick={() => handleBarreDoubleClick(idx)}
        />
      ))}

      {/* Markers */}
      {markers.map((marker, idx) => {
        const isPartOfBarre = barreMode && barreFirstString !== null && 
                              marker.string === barreFirstString && marker.fret === barreFret;
        
        return (
          <DotMarker
            key={`marker-${idx}`}
            string={marker.string}
            fret={marker.fret}
            finger={marker.finger}
            color={marker.color}
            shape={marker.shape}
            label={marker.label}
            isHighlighted={isPartOfBarre}
            onClick={() => handleMarkerClick(marker.string, marker.fret)}
          />
        );
      })}
    </svg>
  );
});

FretboardSVG.displayName = 'FretboardSVG';
