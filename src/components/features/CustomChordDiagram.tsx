import type { CustomChordData } from '@/types/customChord';

interface CustomChordDiagramProps {
  chord: CustomChordData;
  size?: 'sm' | 'md' | 'lg';
}

interface SizeConfig {
  width: number;
  height: number;
  dotRadius: number;
  fontSize: number;
  topY: number;
  fretLabelSize: number;
}

const SIZE_CONFIGS: Record<string, SizeConfig> = {
  sm: { width: 100, height: 130, dotRadius: 7, fontSize: 14, topY: 18, fretLabelSize: 9 },
  md: { width: 140, height: 175, dotRadius: 9.5, fontSize: 18, topY: 22, fretLabelSize: 11 },
  lg: { width: 200, height: 250, dotRadius: 13, fontSize: 24, topY: 30, fretLabelSize: 14 },
};

const STRING_WIDTHS = [2.6, 2.2, 1.8, 1.4, 1.0, 0.7];
const FRET_LABEL_EXTRA: Record<string, number> = { sm: 10, md: 14, lg: 20 };

function isLightColor(color: string): boolean {
  const hslMatch = color.match(/hsl\(\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*\)/);
  if (hslMatch) {
    return parseFloat(hslMatch[3]) > 40;
  }
  const c = color.replace('#', '');
  if (c.length >= 6) {
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 160;
  }
  return false;
}

export default function CustomChordDiagram({ chord, size = 'md' }: CustomChordDiagramProps) {
  const config = SIZE_CONFIGS[size];
  const { numFrets, baseFret } = chord;

  // Scale height proportionally when numFrets differs from 5
  const fretRatio = numFrets / 5;
  const svgHeight = config.height * fretRatio;

  // Extra left padding when baseFret > 1
  const fretLabelPad = baseFret > 1 ? FRET_LABEL_EXTRA[size] : 0;

  const padLeft = fretLabelPad + config.dotRadius * 1.5;
  const padRight = config.dotRadius * 1.5;
  const padTop = config.topY;
  const padBottom = config.dotRadius * 2;

  const gridWidth = config.width - padLeft - padRight;
  const gridHeight = svgHeight - padTop - padBottom;
  const stringSpacing = gridWidth / 5;
  const fretSpacing = gridHeight / numFrets;

  const getStringX = (i: number) => padLeft + i * stringSpacing;
  const getFretY = (f: number) => padTop + f * fretSpacing;

  // Fret dot inlay positions
  const singleDots = [3, 5, 7, 9, 15, 17, 19, 21];
  const doubleDots = [12, 24];

  return (
    <svg
      width={config.width}
      height={svgHeight}
      viewBox={`0 0 ${config.width} ${svgHeight}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Base fret label */}
      {baseFret > 1 && (
        <text
          x={padLeft - config.dotRadius - 3}
          y={getFretY(1) - fretSpacing / 2}
          textAnchor="end"
          fontSize={config.fretLabelSize}
          fill="hsl(33 14% 72%)"
          fontFamily="DM Sans, sans-serif"
          dominantBaseline="middle"
        >
          {baseFret}fr
        </text>
      )}

      {/* Fret lines */}
      {Array.from({ length: numFrets + 1 }, (_, i) => (
        <line
          key={`fret-${i}`}
          x1={getStringX(0)}
          y1={getFretY(i)}
          x2={getStringX(5)}
          y2={getFretY(i)}
          stroke="white"
          strokeWidth={i === 0 && baseFret !== 1 ? 2.5 : 2}
        />
      ))}

      {/* Fret dot inlays */}
      {Array.from({ length: numFrets }, (_, i) => {
        const absFret = baseFret + i;
        const centerY = getFretY(i) + fretSpacing / 2;
        const centerX = getStringX(2.5);
        if (singleDots.includes(absFret)) {
          return (
            <circle
              key={`inlay-${i}`}
              cx={centerX}
              cy={centerY}
              r={config.dotRadius / 2}
              fill="hsl(30 15% 50%)"
              fillOpacity={0.5}
            />
          );
        }
        if (doubleDots.includes(absFret)) {
          return (
            <g key={`inlay-${i}`}>
              <circle cx={getStringX(1.5)} cy={centerY} r={config.dotRadius / 2} fill="hsl(30 15% 50%)" fillOpacity={0.5} />
              <circle cx={getStringX(3.5)} cy={centerY} r={config.dotRadius / 2} fill="hsl(30 15% 50%)" fillOpacity={0.5} />
            </g>
          );
        }
        return null;
      })}

      {/* String lines */}
      {Array.from({ length: 6 }, (_, i) => (
        <line
          key={`string-${i}`}
          x1={getStringX(i)}
          y1={getFretY(0)}
          x2={getStringX(i)}
          y2={getFretY(numFrets)}
          stroke="hsl(33 14% 72%)"
          strokeWidth={STRING_WIDTHS[i]}
          strokeOpacity={chord.mutedStrings.has(i) ? 0.3 : 1}
        />
      ))}

      {/* Nut (if baseFret === 1) */}
      {baseFret === 1 && (
        <rect
          x={getStringX(0)}
          y={getFretY(0) - 6}
          width={getStringX(5) - getStringX(0)}
          height={6}
          fill="hsl(36 33% 93%)"
          rx={1}
        />
      )}

      {/* Open/Muted indicators */}
      {Array.from({ length: 6 }, (_, i) => {
        const cx = getStringX(i);
        const cy = padTop - config.dotRadius * 1.2;
        const r = config.dotRadius * 0.7;

        if (chord.mutedStrings.has(i)) {
          const d = r * 0.6;
          return (
            <g key={`header-${i}`}>
              <line x1={cx - d} y1={cy - d} x2={cx + d} y2={cy + d} stroke="hsl(30 7% 47%)" strokeWidth={1.5} />
              <line x1={cx + d} y1={cy - d} x2={cx - d} y2={cy + d} stroke="hsl(30 7% 47%)" strokeWidth={1.5} />
            </g>
          );
        }
        if (chord.openDiamonds.has(i)) {
          const dr = r * 1.3;
          return (
            <polygon
              key={`header-${i}`}
              points={`${cx},${cy - dr} ${cx + dr},${cy} ${cx},${cy + dr} ${cx - dr},${cy}`}
              fill="none"
              stroke="hsl(200 80% 62%)"
              strokeWidth={1.5}
            />
          );
        }
        if (chord.openStrings.has(i)) {
          return (
            <circle
              key={`header-${i}`}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="hsl(33 14% 72%)"
              strokeWidth={1.5}
            />
          );
        }
        return null;
      })}

      {/* Barres */}
      {chord.barres.map((barre, idx) => {
        const x1 = getStringX(barre.fromString);
        const x2 = getStringX(barre.toString);
        const y = getFretY(barre.fret) - fretSpacing / 2;
        const barHeight = 4;
        return (
          <rect
            key={`barre-${idx}`}
            x={x1}
            y={y - barHeight / 2}
            width={x2 - x1}
            height={barHeight}
            rx={barHeight}
            fill={barre.color}
            fillOpacity={0.9}
          />
        );
      })}

      {/* Markers */}
      {chord.markers.map((marker, idx) => {
        const cx = getStringX(marker.string);
        const cy = getFretY(marker.fret) - fretSpacing / 2;
        const r = config.dotRadius;
        const textFill = isLightColor(marker.color) ? '#1a1a1a' : '#fafafa';
        const labelText = marker.label || (marker.finger > 0 ? String(marker.finger) : '');

        if (marker.shape === 'diamond') {
          const dr = r * 1.15;
          return (
            <g key={`marker-${idx}`}>
              <polygon
                points={`${cx},${cy - dr} ${cx + dr},${cy} ${cx},${cy + dr} ${cx - dr},${cy}`}
                fill={marker.color}
              />
              {labelText && (
                <text
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={r * 0.9}
                  fill={textFill}
                  fontFamily="DM Sans, sans-serif"
                  fontWeight={700}
                >
                  {labelText}
                </text>
              )}
            </g>
          );
        }

        return (
          <g key={`marker-${idx}`}>
            <circle cx={cx} cy={cy} r={r} fill={marker.color} />
            {labelText && (
              <text
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={r * 0.9}
                fill={textFill}
                fontFamily="DM Sans, sans-serif"
                fontWeight={700}
              >
                {labelText}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
