/**
 * Chord Diagram SVG Component
 * 
 * Renders guitar chord diagrams with:
 * - Nut (solid white bar when baseFret === 1)
 * - Graduated string thickness
 * - Fret dot inlays
 * - Open/muted string indicators
 * - Finger dots with numbers
 * - Root note diamond indicator
 * - Barre indicators
 */

import { memo } from 'react';
import type { ChordData } from '@/types/chord';

interface ChordDiagramProps {
  chord: ChordData;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: { width: 100, height: 130, dotRadius: 7, fontSize: 14, fretTextSize: 20 },
  md: { width: 140, height: 175, dotRadius: 9.5, fontSize: 18, fretTextSize: 22 },
  lg: { width: 200, height: 250, dotRadius: 13, fontSize: 24, fretTextSize: 28 },
};

const STRING_THICKNESSES = [2.6, 2.2, 1.8, 1.4, 1.0, 0.7]; // Low E → High E
const FRET_INLAY_POSITIONS = [3, 5, 7, 9, 15, 17, 19, 21]; // Single dot
const DOUBLE_DOT_POSITIONS = [12, 24]; // Double dot

function ChordDiagramBase({ chord, size = 'md', className = '' }: ChordDiagramProps) {
  // Validate size prop to prevent undefined SIZES lookup
  const validSize: 'sm' | 'md' | 'lg' = size in SIZES ? (size as 'sm' | 'md' | 'lg') : 'md';
  const { width, height, dotRadius, fontSize, fretTextSize } = SIZES[validSize];
  
  // Defensive: Ensure dimensions are valid numbers
  if (!width || !height || isNaN(width) || isNaN(height)) {
    console.error('❌ ChordDiagram: Invalid dimensions', { width, height, size, validSize });
    return null;
  }
  
  const nutY = height * 0.2;
  const fretSpacing = (height - nutY) / 5;
  const stringSpacing = width / 7;
  const leftMargin = stringSpacing;
  
  // Defensive: Ensure baseFret is a valid number
  const baseFret = typeof chord.baseFret === 'number' && !isNaN(chord.baseFret) && chord.baseFret > 0
    ? chord.baseFret
    : 1;
  const isNut = baseFret === 1;
  
  // Track which strings are rendered by barre sections
  const barreRenderedStrings = new Set<number>();

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`chord-diagram ${className}`}
      role="img"
      aria-label={`${chord.symbol} chord diagram`}
      style={{ overflow: 'visible' }}
    >
      {/* Fret position label — rendered outside the viewBox boundary so it's never obscured */}
      {!isNut && (
        <text
          x={fretTextSize * 0.3}
          y={nutY + fretSpacing * 0.5}
          textAnchor="end"
          dominantBaseline="middle"
          className="fill-zinc-400 font-display"
          style={{ fontSize: fretTextSize }}
        >
          {baseFret}fr
        </text>
      )}
      
      {/* Nut */}
      <rect
        x={leftMargin}
        y={nutY}
        width={stringSpacing * 5}
        height={isNut ? 4 : 2}
        className={isNut ? 'fill-white' : 'fill-zinc-400'}
      />
      
      {/* Frets */}
      {[1, 2, 3, 4, 5].map((fret) => (
        <line
          key={`fret-${fret}`}
          x1={leftMargin}
          y1={nutY + fret * fretSpacing}
          x2={leftMargin + stringSpacing * 5}
          y2={nutY + fret * fretSpacing}
          className="stroke-zinc-400"
          strokeWidth={1.5}
        />
      ))}
      
      {/* Fret inlay dots */}
      {[1, 2, 3, 4, 5].map((fretNum) => {
        const absoluteFret = baseFret + fretNum - 1;
        const isSingleDot = FRET_INLAY_POSITIONS.includes(absoluteFret);
        const isDoubleDot = DOUBLE_DOT_POSITIONS.includes(absoluteFret);
        
        if (!isSingleDot && !isDoubleDot) return null;
        
        const dotY = nutY + (fretNum - 0.5) * fretSpacing;
        
        if (isDoubleDot) {
          return (
            <g key={`inlay-${fretNum}`}>
              <circle
                cx={leftMargin + stringSpacing * 1.5}
                cy={dotY}
                r={dotRadius * 0.3}
                className="fill-zinc-500/70"
              />
              <circle
                cx={leftMargin + stringSpacing * 3.5}
                cy={dotY}
                r={dotRadius * 0.3}
                className="fill-zinc-500/70"
              />
            </g>
          );
        }
        
        return (
          <circle
            key={`inlay-${fretNum}`}
            cx={leftMargin + stringSpacing * 2.5}
            cy={dotY}
            r={dotRadius * 0.35}
            className="fill-zinc-500/70"
          />
        );
      })}
      
      {/* Strings */}
      {[0, 1, 2, 3, 4, 5].map((stringIdx) => (
        <line
          key={`string-${stringIdx}`}
          x1={leftMargin + stringIdx * stringSpacing}
          y1={nutY}
          x2={leftMargin + stringIdx * stringSpacing}
          y2={nutY + fretSpacing * 5}
          className="stroke-zinc-400"
          strokeWidth={STRING_THICKNESSES[stringIdx]}
        />
      ))}
      
      {/* Open/Muted strings */}
      {chord.frets.map((fret, idx) => {
        const x = leftMargin + idx * stringSpacing;
        const y = nutY * 0.5;
        const isRoot = idx === chord.rootNoteString;
        
        if (fret === -1) {
          // Muted string - X
          return (
            <text
              key={`muted-${idx}`}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-zinc-500 font-bold"
              style={{ fontSize: fontSize * 1.2 }}
            >
              ✕
            </text>
          );
        } else if (fret === 0) {
          // Open string
          if (isRoot) {
            // Root diamond — 20% larger than orange dots
            const size = dotRadius * 1.14;
            return (
              <polygon
                key={`open-${idx}`}
                points={`${x},${y - size} ${x + size},${y} ${x},${y + size} ${x - size},${y}`}
                className="fill-none stroke-cyan-500"
                strokeWidth={2.5}
              />
            );
          } else {
            return (
              <circle
                key={`open-${idx}`}
                cx={x}
                cy={y}
                r={dotRadius * 0.7}
                className="fill-none stroke-amber-500"
                strokeWidth={2.5}
              />
            );
          }
        }
        return null;
      })}
      
      {/* Barre indicators */}
      {/* chord.barres is number[] (plain absolute fret numbers per ChordData type).
           We derive fromString/toString by scanning chord.frets for strings at that fret. */}
      {chord.barres?.map((barreFret, barreIdx) => {
        // barreFret is a plain number (absolute fret position)
        const barreFretNum = typeof barreFret === 'number' ? barreFret : (barreFret as any).fret;
        if (typeof barreFretNum !== 'number' || isNaN(barreFretNum)) return null;

        // Derive which strings participate in this barre
        const barreStringIndices = chord.frets
          .map((f, idx) => ({ f, idx }))
          .filter(x => x.f === barreFretNum)
          .map(x => x.idx);
        if (barreStringIndices.length < 2) return null;

        const fromStringIdx = Math.min(...barreStringIndices);
        const toStringIdx = Math.max(...barreStringIndices);

        const fretY = nutY + (barreFretNum - baseFret + 0.5) * fretSpacing;
        const fromX = leftMargin + fromStringIdx * stringSpacing;
        const toX = leftMargin + toStringIdx * stringSpacing;

        // Mark these strings as rendered by barre
        for (let s = fromStringIdx; s <= toStringIdx; s++) {
          if (chord.frets[s] === barreFretNum) {
            barreRenderedStrings.add(s);
          }
        }

        // Use barre as alias for the derived values below
        const barre = { fret: barreFretNum, fromString: fromStringIdx, toString: toStringIdx };
        
        return (
          <g key={`barre-${barreIdx}`}>
            {/* Barre bar — height and centering match CustomChordDiagram's
                 barHeight = dotRadius * 1.02 (1.2 × 0.85 = 15% thinner). */}
            {(() => { const bh = dotRadius * 1.02; return (
              <rect
                x={fromX}
                y={fretY - bh / 2}
                width={toX - fromX}
                height={bh}
                rx={bh / 2}
                className="fill-amber-500/80"
              />
            ); })()}
            {/* Individual dots at contact points */}
            {Array.from({ length: barre.toString - barre.fromString + 1 }, (_, i) => {
              const stringIdx = barre.fromString + i;
              if (chord.frets[stringIdx] !== barre.fret) return null;
              
              const dotX = leftMargin + stringIdx * stringSpacing;
              const finger = chord.fingers?.[stringIdx];
              const isRoot = stringIdx === chord.rootNoteString;
              
              if (isRoot) {
                // Root diamond — 20% larger than orange dots
                return (
                  <g key={`barre-dot-${stringIdx}`}>
                    <polygon
                      points={`${dotX},${fretY - dotRadius * 1.2} ${dotX + dotRadius * 1.2},${fretY} ${dotX},${fretY + dotRadius * 1.2} ${dotX - dotRadius * 1.2},${fretY}`}
                      className="fill-cyan-500"
                    />
                    {finger && finger > 0 && (
                      <text
                        x={dotX}
                        y={fretY + 1}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-white font-black"
                        style={{ fontSize }}
                      >
                        {finger}
                      </text>
                    )}
                  </g>
                );
              }
              
              return (
                <g key={`barre-dot-${stringIdx}`}>
                  <circle
                    cx={dotX}
                    cy={fretY}
                    r={dotRadius * 0.9}
                    className="fill-amber-500"
                  />
                  {finger && finger > 0 && (
                    <text
                      x={dotX}
                      y={fretY + 1}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-white font-black"
                      style={{ fontSize }}
                    >
                      {finger}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
      
      {/* Individual finger dots (skip if rendered by barre) */}
      {chord.frets.map((fret, stringIdx) => {
        // Defensive: Ensure fret is a valid number
        if (fret === null || fret === undefined || typeof fret !== 'number' || isNaN(fret)) return null;
        if (fret <= 0 || fret < baseFret || fret >= baseFret + 5) return null;
        if (barreRenderedStrings.has(stringIdx)) return null;
        
        const fretY = nutY + (fret - baseFret + 0.5) * fretSpacing;
        const dotX = leftMargin + stringIdx * stringSpacing;
        const finger = chord.fingers?.[stringIdx];
        const isRoot = stringIdx === chord.rootNoteString;
        
        if (isRoot) {
          // Root diamond — 20% larger than orange dots
          return (
            <g key={`dot-${stringIdx}`}>
              <polygon
                points={`${dotX},${fretY - dotRadius * 1.2} ${dotX + dotRadius * 1.2},${fretY} ${dotX},${fretY + dotRadius * 1.2} ${dotX - dotRadius * 1.2},${fretY}`}
                className="fill-cyan-500"
              />
              {finger && finger > 0 && (
                <text
                  x={dotX}
                  y={fretY + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-white font-black"
                  style={{ fontSize }}
                >
                  {finger}
                </text>
              )}
            </g>
          );
        }
        
        return (
          <g key={`dot-${stringIdx}`}>
            <circle
              cx={dotX}
              cy={fretY}
              r={dotRadius}
              className="fill-amber-500"
            />
            {finger && finger > 0 && (
              <text
                x={dotX}
                y={fretY + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-white font-black"
                style={{ fontSize }}
              >
                {finger}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export const ChordDiagram = memo(ChordDiagramBase);
