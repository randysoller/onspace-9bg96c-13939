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

import type { ChordData } from '@/types/chord';

interface ChordDiagramProps {
  chord: ChordData;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: { width: 100, height: 130, dotRadius: 7, fontSize: 14 },
  md: { width: 140, height: 175, dotRadius: 9.5, fontSize: 18 },
  lg: { width: 200, height: 250, dotRadius: 13, fontSize: 24 },
};

const STRING_THICKNESSES = [2.6, 2.2, 1.8, 1.4, 1.0, 0.7]; // Low E → High E
const FRET_INLAY_POSITIONS = [3, 5, 7, 9, 15, 17, 19, 21]; // Single dot
const DOUBLE_DOT_POSITIONS = [12, 24]; // Double dot

export function ChordDiagram({ chord, size = 'md', className = '' }: ChordDiagramProps) {
  const { width, height, dotRadius, fontSize } = SIZES[size];
  
  const nutY = height * 0.2;
  const fretSpacing = (height - nutY) / 5;
  const stringSpacing = width / 7;
  const leftMargin = stringSpacing;
  
  const baseFret = chord.baseFret || 1;
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
      aria-label={`${chord.root} ${chord.type} chord diagram`}
    >
      {/* Fret position label */}
      {!isNut && (
        <text
          x={leftMargin * 0.3}
          y={nutY + fretSpacing * 0.5}
          className="fill-zinc-500 text-xs font-display"
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
                className="fill-zinc-700/40"
              />
              <circle
                cx={leftMargin + stringSpacing * 3.5}
                cy={dotY}
                r={dotRadius * 0.3}
                className="fill-zinc-700/40"
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
            className="fill-zinc-700/40"
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
            // Root diamond
            const size = dotRadius * 0.95;
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
      {chord.barres?.map((barre, barreIdx) => {
        const fretY = nutY + (barre.fret - baseFret + 0.5) * fretSpacing;
        const fromX = leftMargin + barre.fromString * stringSpacing;
        const toX = leftMargin + barre.toString * stringSpacing;
        
        // Mark these strings as rendered by barre
        for (let s = barre.fromString; s <= barre.toString; s++) {
          if (chord.frets[s] === barre.fret) {
            barreRenderedStrings.add(s);
          }
        }
        
        return (
          <g key={`barre-${barreIdx}`}>
            {/* Barre bar */}
            <rect
              x={fromX - dotRadius * 0.4}
              y={fretY - dotRadius * 0.7}
              width={toX - fromX + dotRadius * 0.8}
              height={dotRadius * 1.4}
              rx={dotRadius * 0.7}
              className="fill-amber-500/80"
            />
            {/* Individual dots at contact points */}
            {Array.from({ length: barre.toString - barre.fromString + 1 }, (_, i) => {
              const stringIdx = barre.fromString + i;
              if (chord.frets[stringIdx] !== barre.fret) return null;
              
              const dotX = leftMargin + stringIdx * stringSpacing;
              const finger = chord.fingers?.[stringIdx];
              const isRoot = stringIdx === chord.rootNoteString;
              
              if (isRoot) {
                // Root diamond
                return (
                  <g key={`barre-dot-${stringIdx}`}>
                    <polygon
                      points={`${dotX},${fretY - dotRadius} ${dotX + dotRadius},${fretY} ${dotX},${fretY + dotRadius} ${dotX - dotRadius},${fretY}`}
                      className="fill-cyan-500"
                    />
                    {finger && finger > 0 && (
                      <text
                        x={dotX}
                        y={fretY + 1}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-white font-black"
                        style={{ fontSize: fontSize * 0.7 }}
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
                      style={{ fontSize: fontSize * 0.7 }}
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
        if (fret === null || fret <= 0 || fret < baseFret || fret >= baseFret + 5) return null;
        if (barreRenderedStrings.has(stringIdx)) return null;
        
        const fretY = nutY + (fret - baseFret + 0.5) * fretSpacing;
        const dotX = leftMargin + stringIdx * stringSpacing;
        const finger = chord.fingers?.[stringIdx];
        const isRoot = stringIdx === chord.rootNoteString;
        
        if (isRoot) {
          // Root diamond
          return (
            <g key={`dot-${stringIdx}`}>
              <polygon
                points={`${dotX},${fretY - dotRadius} ${dotX + dotRadius},${fretY} ${dotX},${fretY + dotRadius} ${dotX - dotRadius},${fretY}`}
                className="fill-cyan-500"
              />
              {finger && finger > 0 && (
                <text
                  x={dotX}
                  y={fretY + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-white font-black"
                  style={{ fontSize: fontSize * 0.7 }}
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
