/**
 * SVGChordDiagram — Unified chord diagram renderer.
 *
 * Accepts either a standard ChordData (isCustom={false} or omitted) or a
 * CustomChordData (isCustom={true}) via a discriminated union prop. Both are
 * normalised into a shared RenderData struct before the SVG is drawn, so
 * there is exactly one rendering path with no duplication.
 *
 * Library-mode (amber circles, cyan diamonds, white labels) is the default
 * for standard chords and opt-in for custom ones via the `libraryMode` prop.
 *
 * Drop-in replacement for both ChordDiagram and CustomChordDiagram.
 */

import { memo } from 'react';
import type { ChordData } from '@/types/chord';
import type { CustomChordData, FretMarker } from '@/types/customChord';

// ─── Public Props ─────────────────────────────────────────────────────────────

export type SVGChordDiagramProps = {
  size?: 'sm' | 'md' | 'lg';
  /**
   * Override all marker colours with the standard library scheme:
   * amber circles, cyan diamonds, white bold labels. Defaults to `true`
   * for standard ChordData, and `false` for CustomChordData.
   */
  libraryMode?: boolean;
  className?: string;
} & (
  | { chord: ChordData; isCustom?: false | undefined }
  | { chord: CustomChordData; isCustom: true }
);

// ─── Internal Normalised Format ───────────────────────────────────────────────

interface RenderMarker {
  /** String index 0–5 */
  string: number;
  /** Relative fret index 1–numFrets */
  fret: number;
  shape: 'circle' | 'diamond';
  color: string;
  label: string;
}

interface RenderBarre {
  /** Relative fret index 1–numFrets */
  fret: number;
  fromString: number;
  toString: number;
  color: string;
}

interface RenderData {
  baseFret: number;
  numFrets: number;
  markers: RenderMarker[];
  barres: RenderBarre[];
  mutedStrings: Set<number>;
  /** Open strings drawn as plain circles at the nut */
  openStrings: Set<number>;
  /** Open strings drawn as cyan diamonds at the nut (root notes) */
  openDiamonds: Set<number>;
  ariaLabel: string;
}

// ─── Library-mode canonical colours ──────────────────────────────────────────
// Must match the Tailwind classes used in the old ChordDiagram exactly.

const LIB_CIRCLE_COLOR  = 'hsl(38 92% 50%)';          // amber-500
const LIB_DIAMOND_COLOR = 'hsl(198 93% 60%)';          // cyan-400
const LIB_LABEL_FILL    = '#ffffff';
const LIB_BARRE_COLOR   = 'rgba(251,191,36,0.80)';     // amber-500 @ 80%
const LIB_OPEN_CIRCLE   = 'hsl(38 92% 50%)';
const LIB_OPEN_DIAMOND  = 'hsl(198 93% 60%)';

// ─── Colour utilities ─────────────────────────────────────────────────────────

function isLightColor(color: string): boolean {
  const hsl = color.match(/hsl\(\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/);
  if (hsl) return parseFloat(hsl[3]) > 40;
  const c = color.replace('#', '');
  if (c.length >= 6) {
    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 160;
  }
  return false;
}

// ─── Normalisation ────────────────────────────────────────────────────────────

function normalizeStandard(chord: ChordData): RenderData {
  const baseFret = typeof chord.baseFret === 'number' && chord.baseFret > 0 ? chord.baseFret : 1;
  const numFrets = 5;

  const markers: RenderMarker[] = [];
  const mutedStrings  = new Set<number>();
  const openStrings   = new Set<number>();
  const openDiamonds  = new Set<number>();

  // Track which strings are covered by a barre so we can skip individual dots
  const barreStrings = new Set<number>();
  const barreFrets   = new Set<number>();
  if (chord.barres) {
    for (const barreFret of chord.barres) {
      barreFrets.add(barreFret);
      chord.frets.forEach((f, idx) => { if (f === barreFret) barreStrings.add(idx); });
    }
  }

  for (let i = 0; i < 6; i++) {
    const fret = chord.frets[i];
    if (fret === null || fret === undefined || isNaN(fret)) continue;

    if (fret === -1) {
      mutedStrings.add(i);
    } else if (fret === 0) {
      if (i === chord.rootNoteString) {
        openDiamonds.add(i);
      } else {
        openStrings.add(i);
      }
    } else {
      const relativeFret = fret - baseFret + 1;
      if (relativeFret < 1 || relativeFret > numFrets) continue;
      if (barreStrings.has(i) && barreFrets.has(fret)) continue; // drawn by barre

      const isRoot = i === chord.rootNoteString;
      markers.push({
        string: i,
        fret:   relativeFret,
        shape:  isRoot ? 'diamond' : 'circle',
        color:  isRoot ? LIB_DIAMOND_COLOR : LIB_CIRCLE_COLOR,
        label:  chord.fingers?.[i] && chord.fingers[i] > 0 ? String(chord.fingers[i]) : '',
      });
    }
  }

  // Barres
  const barres: RenderBarre[] = [];
  for (const barreFret of chord.barres ?? []) {
    const strings = chord.frets
      .map((f, idx) => ({ f, idx }))
      .filter(x => x.f === barreFret)
      .map(x => x.idx);
    if (strings.length < 2) continue;
    const fromString = Math.min(...strings);
    const toString   = Math.max(...strings);
    const relativeFret = barreFret - baseFret + 1;

    // Add individual barre-dot markers
    for (let s = fromString; s <= toString; s++) {
      if (chord.frets[s] !== barreFret) continue;
      const isRoot = s === chord.rootNoteString;
      const finger = chord.fingers?.[s];
      markers.push({
        string: s,
        fret:   relativeFret,
        shape:  isRoot ? 'diamond' : 'circle',
        color:  isRoot ? LIB_DIAMOND_COLOR : LIB_CIRCLE_COLOR,
        label:  finger && finger > 0 ? String(finger) : '',
      });
    }

    barres.push({
      fret: relativeFret,
      fromString,
      toString,
      color: LIB_BARRE_COLOR,
    });
  }

  return { baseFret, numFrets, markers, barres, mutedStrings, openStrings, openDiamonds, ariaLabel: `${chord.symbol} chord diagram` };
}

function normalizeCustom(chord: CustomChordData): RenderData {
  return {
    baseFret:     chord.baseFret,
    numFrets:     chord.numFrets,
    markers:      chord.markers.map(m => ({
      string: m.string,
      fret:   m.fret,
      shape:  m.shape,
      color:  m.color,
      label:  m.label || (m.finger > 0 ? String(m.finger) : ''),
    })),
    barres: chord.barres.map(b => ({
      fret:       b.fret,
      fromString: b.fromString,
      toString:   b.toString,
      color:      b.color,
    })),
    mutedStrings:  chord.mutedStrings,
    openStrings:   chord.openStrings,
    openDiamonds:  chord.openDiamonds,
    ariaLabel:     `${chord.symbol} chord diagram`,
  };
}

// ─── Size config ──────────────────────────────────────────────────────────────

interface SizeConfig {
  width: number;
  height: number;
  dotRadius: number;
  fontSize: number;
  topY: number;
  fretLabelSize: number;
}

const SIZE_CONFIGS: Record<'sm' | 'md' | 'lg', SizeConfig> = {
  sm: { width: 100, height: 130, dotRadius: 7,    fontSize: 14, topY: 26, fretLabelSize: 9  },
  md: { width: 140, height: 175, dotRadius: 9.5,  fontSize: 18, topY: 32, fretLabelSize: 11 },
  lg: { width: 200, height: 250, dotRadius: 13,   fontSize: 24, topY: 42, fretLabelSize: 14 },
};

const STRING_WIDTHS   = [2.6, 2.2, 1.8, 1.4, 1.0, 0.7];
const FRET_LABEL_EXTRA: Record<string, number> = { sm: 10, md: 14, lg: 20 };
const FRET_INLAY_SINGLE = [3, 5, 7, 9, 15, 17, 19, 21];
const FRET_INLAY_DOUBLE = [12, 24];

// ─── Renderer ─────────────────────────────────────────────────────────────────

function SVGChordDiagramBase({
  chord,
  isCustom,
  size = 'md',
  libraryMode,
  className = '',
}: SVGChordDiagramProps) {
  // Resolve effective libraryMode — standard chords are always in library mode
  const effectiveLibraryMode = isCustom ? (libraryMode ?? false) : true;

  // Normalise
  const data: RenderData = isCustom
    ? normalizeCustom(chord as CustomChordData)
    : normalizeStandard(chord as ChordData);

  const config = SIZE_CONFIGS[size in SIZE_CONFIGS ? (size as 'sm' | 'md' | 'lg') : 'md'];
  const { baseFret, numFrets, markers, barres, mutedStrings, openStrings, openDiamonds } = data;

  // Scale SVG height for fret count
  const fretRatio = numFrets / 5;
  const svgHeight = config.height * fretRatio;

  // Grid geometry
  const fretLabelPad = baseFret > 1 ? FRET_LABEL_EXTRA[size] : 0;
  const padLeft   = fretLabelPad + config.dotRadius * 1.5;
  const padRight  = config.dotRadius * 1.5;
  const padTop    = config.topY;
  const padBottom = config.dotRadius * 2;
  const gridWidth  = config.width - padLeft - padRight;
  const gridHeight = svgHeight - padTop - padBottom;
  const stringSpacing = gridWidth / 5;
  const fretSpacing   = gridHeight / numFrets;

  const sx = (i: number) => padLeft + i * stringSpacing;   // string X
  const fy = (f: number) => padTop  + f * fretSpacing;     // fret Y (f=0 is nut line)

  // Resolve marker rendering colours
  const markerFill = (m: RenderMarker) =>
    effectiveLibraryMode
      ? (m.shape === 'diamond' ? LIB_DIAMOND_COLOR : LIB_CIRCLE_COLOR)
      : m.color;

  const labelFill = (m: RenderMarker) =>
    effectiveLibraryMode
      ? LIB_LABEL_FILL
      : (isLightColor(m.color) ? '#1a1a1a' : '#fafafa');

  const fontWeight = effectiveLibraryMode ? 900 : 700;
  const barreColor = (b: RenderBarre) =>
    effectiveLibraryMode ? LIB_BARRE_COLOR : b.color;

  const barHeight = config.dotRadius * 1.02; // matches historical barre height

  return (
    <svg
      width={config.width}
      height={svgHeight}
      viewBox={`0 0 ${config.width} ${svgHeight}`}
      className={`svg-chord-diagram ${className}`}
      role="img"
      aria-label={data.ariaLabel}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Base fret label */}
      {baseFret > 1 && (
        <text
          x={padLeft - config.dotRadius - 3}
          y={fy(1) - fretSpacing / 2}
          textAnchor="end"
          fontSize={config.fretLabelSize}
          fill="hsl(33 14% 72%)"
          fontFamily="DM Sans, sans-serif"
          dominantBaseline="middle"
        >
          {baseFret}fr
        </text>
      )}

      {/* Nut (solid bar when baseFret === 1) */}
      {baseFret === 1 && (
        <rect
          x={sx(0)}
          y={fy(0) - 6}
          width={sx(5) - sx(0)}
          height={6}
          fill="hsl(36 33% 93%)"
          rx={1}
        />
      )}

      {/* Fret lines */}
      {Array.from({ length: numFrets + 1 }, (_, i) => (
        <line
          key={`fret-${i}`}
          x1={sx(0)} y1={fy(i)}
          x2={sx(5)} y2={fy(i)}
          stroke="white"
          strokeWidth={i === 0 && baseFret !== 1 ? 2.5 : 2}
        />
      ))}

      {/* Fret dot inlays */}
      {Array.from({ length: numFrets }, (_, i) => {
        const absFret = baseFret + i;
        const centerY = fy(i) + fretSpacing / 2;
        if (FRET_INLAY_SINGLE.includes(absFret)) {
          return (
            <circle key={`inlay-${i}`} cx={sx(2.5)} cy={centerY}
              r={config.dotRadius / 2} fill="hsl(30 15% 50%)" fillOpacity={0.5} />
          );
        }
        if (FRET_INLAY_DOUBLE.includes(absFret)) {
          return (
            <g key={`inlay-${i}`}>
              <circle cx={sx(1.5)} cy={centerY} r={config.dotRadius / 2} fill="hsl(30 15% 50%)" fillOpacity={0.5} />
              <circle cx={sx(3.5)} cy={centerY} r={config.dotRadius / 2} fill="hsl(30 15% 50%)" fillOpacity={0.5} />
            </g>
          );
        }
        return null;
      })}

      {/* String lines */}
      {Array.from({ length: 6 }, (_, i) => (
        <line
          key={`str-${i}`}
          x1={sx(i)} y1={fy(0)}
          x2={sx(i)} y2={fy(numFrets)}
          stroke="hsl(33 14% 72%)"
          strokeWidth={STRING_WIDTHS[i]}
          strokeOpacity={mutedStrings.has(i) ? 0.3 : 1}
        />
      ))}

      {/* Open / Muted indicators above nut */}
      {Array.from({ length: 6 }, (_, i) => {
        const cx = sx(i);
        const cy = padTop - config.dotRadius * 2.0;
        const r  = config.dotRadius * 0.7;

        if (mutedStrings.has(i)) {
          const d = r * 0.85;
          return (
            <g key={`head-${i}`}>
              <line x1={cx - d} y1={cy - d} x2={cx + d} y2={cy + d} stroke="hsl(30 7% 47%)" strokeWidth={2.5} />
              <line x1={cx + d} y1={cy - d} x2={cx - d} y2={cy + d} stroke="hsl(30 7% 47%)" strokeWidth={2.5} />
            </g>
          );
        }
        if (openDiamonds.has(i)) {
          const dr = r * 1.56;
          const fill   = effectiveLibraryMode ? 'none' : 'none';
          const stroke = effectiveLibraryMode ? LIB_OPEN_DIAMOND : 'hsl(200 80% 62%)';
          return (
            <polygon
              key={`head-${i}`}
              points={`${cx},${cy - dr} ${cx + dr},${cy} ${cx},${cy + dr} ${cx - dr},${cy}`}
              fill={fill}
              stroke={stroke}
              strokeWidth={2.5}
            />
          );
        }
        if (openStrings.has(i)) {
          const stroke = effectiveLibraryMode ? LIB_OPEN_CIRCLE : 'hsl(33 14% 72%)';
          return (
            <circle key={`head-${i}`} cx={cx} cy={cy} r={r}
              fill="none" stroke={stroke} strokeWidth={2.5} />
          );
        }
        return null;
      })}

      {/* Barres */}
      {barres.map((b, idx) => {
        const x1 = sx(b.fromString);
        const x2 = sx(b.toString);
        const y  = fy(b.fret) - fretSpacing / 2;
        return (
          <rect
            key={`barre-${idx}`}
            x={x1}
            y={y - barHeight / 2}
            width={x2 - x1}
            height={barHeight}
            rx={barHeight / 2}
            fill={barreColor(b)}
            fillOpacity={0.9}
          />
        );
      })}

      {/* Markers */}
      {markers.map((m, idx) => {
        const cx = sx(m.string);
        const cy = fy(m.fret) - fretSpacing / 2;
        const r  = config.dotRadius;
        const fill = markerFill(m);
        const tFill = labelFill(m);

        if (m.shape === 'diamond') {
          const dr = r * 1.38;
          return (
            <g key={`marker-${idx}`}>
              <polygon
                points={`${cx},${cy - dr} ${cx + dr},${cy} ${cx},${cy + dr} ${cx - dr},${cy}`}
                fill={fill}
              />
              {m.label && (
                <text
                  x={cx} y={cy + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={r * 1.975}
                  fill={tFill}
                  fontFamily="DM Sans, sans-serif"
                  fontWeight={fontWeight}
                  style={{ fontFeatureSettings: '"tnum"' }}
                >
                  {m.label}
                </text>
              )}
            </g>
          );
        }

        return (
          <g key={`marker-${idx}`}>
            <circle cx={cx} cy={cy} r={r} fill={fill} />
            {m.label && (
              <text
                x={cx} y={cy + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={r * 1.6875}
                fill={tFill}
                fontFamily="DM Sans, sans-serif"
                fontWeight={fontWeight}
              >
                {m.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export const SVGChordDiagram = memo(SVGChordDiagramBase);
export default SVGChordDiagram;
