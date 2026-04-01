import { useState, useRef, useCallback, useEffect } from 'react';
import { useCustomChordStore } from '@/stores/customChordStore';
import type { CustomChordData, FretMarker } from '@/types/customChord';

interface InteractiveFretboardProps {
  chord: CustomChordData;
  width?: number;
  height?: number;
}

interface PopupState {
  fret: number;
  string: number;
  x: number;
  y: number;
  mode: 'place' | 'edit';
}

interface DragState {
  marker: FretMarker;
  originFret: number;
  originString: number;
  currentX: number;
  currentY: number;
  startX: number;
  startY: number;
  hasMoved: boolean;
}

interface BarreModeState {
  anchorFret: number;
  anchorString: number;
  selectedStrings: number[];
}

interface BarreDeleteConfirm {
  fret: number;
  fromString: number;
  toString: number;
  x: number;
  y: number;
}

const STRING_LABELS = ['E', 'A', 'D', 'G', 'B', 'e'];
const STRING_WIDTHS_FB = [2.8, 2.4, 2.0, 1.5, 1.1, 0.8];
const SINGLE_DOT_FRETS = [3, 5, 7, 9, 15, 17, 19, 21];
const DOUBLE_DOT_FRETS = [12, 24];

const FINGER_OPTIONS = [
  { value: 1, label: '1', finger: 1, customLabel: '' },
  { value: 2, label: '2', finger: 2, customLabel: '' },
  { value: 3, label: '3', finger: 3, customLabel: '' },
  { value: 4, label: '4', finger: 4, customLabel: '' },
  { value: 'T' as const, label: 'T', finger: 0, customLabel: 'T' },
  { value: 0, label: '–', finger: 0, customLabel: '' },
];

function isLightColor(color: string): boolean {
  const hslMatch = color.match(/hsl\(\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*\)/);
  if (hslMatch) return parseFloat(hslMatch[3]) > 40;
  const c = color.replace('#', '');
  if (c.length >= 6) {
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 160;
  }
  return false;
}

export default function InteractiveFretboard({ chord, width = 320, height = 420 }: InteractiveFretboardProps) {
  const [popup, setPopup] = useState<PopupState | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [barreMode, setBarreMode] = useState<BarreModeState | null>(null);
  const [barreDeleteConfirm, setBarreDeleteConfirm] = useState<BarreDeleteConfirm | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const barreClickRef = useRef<{ fret: number; fromString: number; toString: number; time: number } | null>(null);

  const {
    toggleMutedString,
    toggleOpenString,
    toggleOpenDiamond,
    addMarkerDirect,
    removeMarker,
    moveMarker,
    updateMarkerFinger,
    addBarreFromStrings,
    removeBarreByKey,
  } = useCustomChordStore();

  const numFrets = chord.numFrets;
  const numStrings = 6;

  const padLeft = 44, padRight = 20, padTop = 72, padBottom = 24;
  const gridWidth = width - padLeft - padRight;
  const gridHeight = height - padTop - padBottom;
  const stringSpacing = gridWidth / (numStrings - 1);
  const fretSpacing = gridHeight / numFrets;
  const dotRadius = Math.min(stringSpacing, fretSpacing) * 0.34;

  const getStringX = useCallback((i: number) => padLeft + i * stringSpacing, [padLeft, stringSpacing]);
  const getFretY = useCallback((f: number) => padTop + f * fretSpacing, [padTop, fretSpacing]);

  const clientToSvg = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, [width, height]);

  const svgToGrid = useCallback((svgX: number, svgY: number) => {
    const stringIdx = Math.round((svgX - padLeft) / stringSpacing);
    const fretIdx = Math.round((svgY - padTop) / fretSpacing);
    return {
      string: Math.max(0, Math.min(5, stringIdx)),
      fret: Math.max(1, Math.min(numFrets, fretIdx)),
    };
  }, [padLeft, padTop, stringSpacing, fretSpacing, numFrets]);

  // Close popup on outside click
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setPopup(null);
        setBarreDeleteConfirm(null);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPopup(null);
        setBarreMode(null);
        setBarreDeleteConfirm(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ─── String Header Click Cycle ──────────────────────────────────────────────
  const handleStringHeaderClick = useCallback((stringIdx: number) => {
    const hasMarkers = chord.markers.some(m => m.string === stringIdx);
    const isMuted = chord.mutedStrings.has(stringIdx);
    const isOpen = chord.openStrings.has(stringIdx);
    const isDiamond = chord.openDiamonds.has(stringIdx);

    if (hasMarkers) {
      // → muted
      toggleMutedString(stringIdx);
    } else if (!isMuted && !isOpen) {
      // → open
      toggleOpenString(stringIdx);
    } else if (isOpen && !isDiamond) {
      // → diamond
      toggleOpenDiamond(stringIdx);
    } else if (isOpen && isDiamond) {
      // → muted
      toggleOpenString(stringIdx); // removes open + diamond
      toggleMutedString(stringIdx); // adds muted
    } else if (isMuted) {
      // → un-mute
      toggleMutedString(stringIdx);
    }
  }, [chord, toggleMutedString, toggleOpenString, toggleOpenDiamond]);

  // ─── Barre String Toggle ────────────────────────────────────────────────────
  // Shared logic called from both the fret zone rect AND the marker <g> in barre mode.
  const handleBarreStringToggle = useCallback((fret: number, stringIdx: number) => {
    if (!barreMode) return;
    if (fret !== barreMode.anchorFret) return;
    if (stringIdx === barreMode.anchorString) return; // can't deselect anchor
    const isSelected = barreMode.selectedStrings.includes(stringIdx);
    const selectedStrings = isSelected
      ? barreMode.selectedStrings.filter(s => s !== stringIdx)
      : [...barreMode.selectedStrings, stringIdx];
    setBarreMode({ ...barreMode, selectedStrings });
  }, [barreMode]);

  // ─── Fret Zone Click ────────────────────────────────────────────────────────
  const handleFretZoneClick = useCallback((fret: number, stringIdx: number, svgX: number, svgY: number) => {
    if (drag) return;

    // In barre mode: delegate to barre selection
    if (barreMode) {
      handleBarreStringToggle(fret, stringIdx);
      return;
    }

    // Existing marker → handled by pointer events on marker, not fret zone
    const exists = chord.markers.some(m => m.fret === fret && m.string === stringIdx);
    if (exists) return;

    // Show placement popup
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;
    const scaleX = svgRect.width / width;
    const scaleY = svgRect.height / height;
    const px = (svgX * scaleX) + (svgRect.left - containerRect.left);
    const py = (svgY * scaleY) + (svgRect.top - containerRect.top);

    setPopup({ fret, string: stringIdx, x: px, y: py, mode: 'place' });
  }, [drag, barreMode, chord.markers, width, height]);

  // ─── Marker Pointer Events ──────────────────────────────────────────────────
  const handleMarkerPointerDown = useCallback((e: React.PointerEvent, marker: FretMarker) => {
    if (barreMode) return;
    e.preventDefault();
    e.stopPropagation();
    setPopup(null);
    setBarreDeleteConfirm(null);

    const svgPos = clientToSvg(e.clientX, e.clientY);

    setDrag({
      marker,
      originFret: marker.fret,
      originString: marker.string,
      currentX: svgPos.x,
      currentY: svgPos.y,
      startX: e.clientX,
      startY: e.clientY,
      hasMoved: false,
    });

    (e.target as Element).setPointerCapture(e.pointerId);
  }, [barreMode, clientToSvg]);

  const handleSvgPointerMove = useCallback((e: React.PointerEvent) => {
    if (!drag) return;
    const dist = Math.sqrt((e.clientX - drag.startX) ** 2 + (e.clientY - drag.startY) ** 2);
    const svgPos = clientToSvg(e.clientX, e.clientY);
    setDrag(prev => prev ? {
      ...prev,
      currentX: svgPos.x,
      currentY: svgPos.y,
      hasMoved: prev.hasMoved || dist > 6,
    } : null);
  }, [drag, clientToSvg]);

  const handleSvgPointerUp = useCallback((e: React.PointerEvent) => {
    if (!drag) return;

    if (drag.hasMoved) {
      const svgPos = clientToSvg(e.clientX, e.clientY);
      const target = svgToGrid(svgPos.x, svgPos.y);
      if (target.fret !== drag.originFret || target.string !== drag.originString) {
        moveMarker(drag.originFret, drag.originString, target.fret, target.string);
      }
      setDrag(null);
    } else {
      // Not moved → show edit popup
      if (!containerRef.current) { setDrag(null); return; }
      const containerRect = containerRef.current.getBoundingClientRect();
      const svgRect = svgRef.current?.getBoundingClientRect();
      if (!svgRect) { setDrag(null); return; }
      const scaleX = svgRect.width / width;
      const scaleY = svgRect.height / height;
      const svgPos = clientToSvg(drag.startX, drag.startY);
      const px = (svgPos.x * scaleX) + (svgRect.left - containerRect.left);
      const py = (svgPos.y * scaleY) + (svgRect.top - containerRect.top);
      setPopup({ fret: drag.originFret, string: drag.originString, x: px, y: py, mode: 'edit' });
      setDrag(null);
    }
  }, [drag, clientToSvg, svgToGrid, moveMarker, width, height]);

  // ─── Popup Actions ──────────────────────────────────────────────────────────
  const handlePopupFingerSelect = useCallback((finger: number, label: string) => {
    if (!popup) return;
    if (popup.mode === 'place') {
      addMarkerDirect(popup.fret, popup.string, finger, label);
    } else {
      updateMarkerFinger(popup.fret, popup.string, finger, label);
    }
    setPopup(null);
  }, [popup, addMarkerDirect, updateMarkerFinger]);

  const handlePopupDelete = useCallback(() => {
    if (!popup) return;
    removeMarker(popup.fret, popup.string);
    setPopup(null);
  }, [popup, removeMarker]);

  const handlePopupBarre = useCallback(() => {
    if (!popup) return;
    setBarreMode({
      anchorFret: popup.fret,
      anchorString: popup.string,
      selectedStrings: [popup.string],
    });
    setPopup(null);
  }, [popup]);

  // ─── Barre Actions ──────────────────────────────────────────────────────────
  const handleConnectBarre = useCallback(() => {
    if (!barreMode || barreMode.selectedStrings.length < 2) return;
    addBarreFromStrings(barreMode.anchorFret, barreMode.selectedStrings);
    setBarreMode(null);
  }, [barreMode, addBarreFromStrings]);

  // ─── Barre Double-Click ─────────────────────────────────────────────────────
  const handleBarreClick = useCallback((e: React.MouseEvent, barre: { fret: number; fromString: number; toString: number }, svgX: number, svgY: number) => {
    const now = Date.now();
    const last = barreClickRef.current;
    if (last && last.fret === barre.fret && last.fromString === barre.fromString && last.toString === barre.toString && now - last.time < 400) {
      // Double click
      barreClickRef.current = null;
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const svgRect = svgRef.current?.getBoundingClientRect();
      if (!svgRect) return;
      const scaleX = svgRect.width / width;
      const scaleY = svgRect.height / height;
      const px = (svgX * scaleX) + (svgRect.left - containerRect.left);
      const py = (svgY * scaleY) + (svgRect.top - containerRect.top);
      setBarreDeleteConfirm({ ...barre, x: px, y: py });
    } else {
      barreClickRef.current = { ...barre, time: now };
    }
  }, [width, height]);

  // ─── Popup Positioning ──────────────────────────────────────────────────────
  const getPopupStyle = useCallback((px: number, py: number): React.CSSProperties => {
    const clampedX = Math.min(Math.max(px - 120, 4), width - 250);
    const above = py >= 60;
    return {
      position: 'absolute',
      left: clampedX,
      ...(above ? { bottom: height - py + 8 } : { top: py + 8 }),
      zIndex: 50,
    };
  }, [width, height]);

  // ─── Drag Snap Target ───────────────────────────────────────────────────────
  const dragTarget = drag?.hasMoved ? svgToGrid(drag.currentX, drag.currentY) : null;

  return (
    <div
      ref={containerRef}
      className="relative touch-none select-none"
      style={{ width, height }}
    >
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className={barreMode ? 'cursor-pointer' : 'cursor-crosshair'}
        onPointerMove={handleSvgPointerMove}
        onPointerUp={handleSvgPointerUp}
      >
        {/* String labels at top */}
        {Array.from({ length: numStrings }, (_, i) => {
          const cx = getStringX(i);
          const isMuted = chord.mutedStrings.has(i);
          const isOpen = chord.openStrings.has(i);
          const isDiamond = chord.openDiamonds.has(i);
          const headerY = padTop - dotRadius * 1.6;

          return (
            <g
              key={`header-${i}`}
              onClick={() => handleStringHeaderClick(i)}
              style={{ cursor: 'pointer' }}
            >
              {/* String label */}
              <text
                x={cx}
                y={headerY - dotRadius * 1.4}
                textAnchor="middle"
                fontSize={10}
                fill="hsl(33 14% 72%)"
                fontFamily="DM Sans, sans-serif"
                fontWeight={600}
              >
                {STRING_LABELS[i]}
              </text>

              {/* Hit area */}
              <rect
                x={cx - dotRadius * 1.2}
                y={headerY - dotRadius * 2.2}
                width={dotRadius * 2.4}
                height={dotRadius * 2.8}
                fill="transparent"
              />

              {/* State indicator */}
              {isMuted && (
                <g>
                  {/* Gray X — muted string */}
                  <line x1={cx - dotRadius * 0.65} y1={headerY - dotRadius * 0.65} x2={cx + dotRadius * 0.65} y2={headerY + dotRadius * 0.65} stroke="hsl(0 0% 45%)" strokeWidth={1.8} strokeLinecap="round" />
                  <line x1={cx + dotRadius * 0.65} y1={headerY - dotRadius * 0.65} x2={cx - dotRadius * 0.65} y2={headerY + dotRadius * 0.65} stroke="hsl(0 0% 45%)" strokeWidth={1.8} strokeLinecap="round" />
                </g>
              )}
              {isDiamond && (
                <>
                  {/* Blue diamond — root note, matches fretboard root markers */}
                  <polygon
                    points={`${cx},${headerY - dotRadius * 0.88} ${cx + dotRadius * 0.88},${headerY} ${cx},${headerY + dotRadius * 0.88} ${cx - dotRadius * 0.88},${headerY}`}
                    fill="none"
                    stroke="hsl(200 80% 62%)"
                    strokeWidth={1.8}
                  />
                  <text x={cx} y={headerY + dotRadius * 1.35} textAnchor="middle" fontSize={7} fill="hsl(200 80% 62%)" fontFamily="DM Sans, sans-serif">root</text>
                </>
              )}
              {isOpen && !isDiamond && (
                // Orange circle — open string, matches dot color
                <circle cx={cx} cy={headerY} r={dotRadius * 0.72} fill="none" stroke="hsl(38 90% 56%)" strokeWidth={1.8} />
              )}
              {!isMuted && !isOpen && (
                // Ghost circle — neutral/unset state; dashed to suggest interactivity
                <>
                  <circle
                    cx={cx}
                    cy={headerY}
                    r={dotRadius * 0.72}
                    fill="none"
                    stroke="hsl(33 14% 55%)"
                    strokeWidth={1.2}
                    strokeDasharray="2.5 2.5"
                    strokeOpacity={0.45}
                  />
                  <title>Tap to set open / muted / root</title>
                </>
              )}
            </g>
          );
        })}

        {/* Base fret label */}
        {chord.baseFret > 1 && (
          <text
            x={padLeft - 6}
            y={getFretY(0.5)}
            textAnchor="end"
            fontSize={9}
            fill="hsl(33 14% 72%)"
            fontFamily="DM Sans, sans-serif"
            dominantBaseline="middle"
          >
            {chord.baseFret}fr
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
            strokeWidth={2}
          />
        ))}

        {/* Fret dot inlays */}
        {Array.from({ length: numFrets }, (_, i) => {
          const absFret = chord.baseFret + i;
          const centerY = getFretY(i) + fretSpacing / 2;
          if (SINGLE_DOT_FRETS.includes(absFret)) {
            return <circle key={`inlay-${i}`} cx={getStringX(2.5)} cy={centerY} r={dotRadius / 2} fill="hsl(30 15% 50%)" fillOpacity={0.5} />;
          }
          if (DOUBLE_DOT_FRETS.includes(absFret)) {
            return (
              <g key={`inlay-${i}`}>
                <circle cx={getStringX(1.5)} cy={centerY} r={dotRadius / 2} fill="hsl(30 15% 50%)" fillOpacity={0.5} />
                <circle cx={getStringX(3.5)} cy={centerY} r={dotRadius / 2} fill="hsl(30 15% 50%)" fillOpacity={0.5} />
              </g>
            );
          }
          return null;
        })}

        {/* String lines */}
        {Array.from({ length: numStrings }, (_, i) => (
          <line
            key={`string-${i}`}
            x1={getStringX(i)}
            y1={getFretY(0)}
            x2={getStringX(i)}
            y2={getFretY(numFrets)}
            stroke="hsl(33 14% 72%)"
            strokeWidth={STRING_WIDTHS_FB[i]}
            strokeOpacity={chord.mutedStrings.has(i) ? 0.3 : 1}
          />
        ))}

        {/* Nut */}
        {chord.baseFret === 1 && (
          <rect
            x={getStringX(0)}
            y={getFretY(0) - 6}
            width={getStringX(5) - getStringX(0)}
            height={6}
            fill="hsl(36 33% 93%)"
            rx={1}
          />
        )}

        {/* Clickable fret zones */}
        {Array.from({ length: numFrets }, (_, fi) =>
          Array.from({ length: numStrings }, (_, si) => {
            const fret = fi + 1;
            const svgX = getStringX(si);
            const svgY = getFretY(fi) + fretSpacing / 2;
            return (
              <rect
                key={`zone-${fi}-${si}`}
                x={getStringX(si) - stringSpacing / 2}
                y={getFretY(fi)}
                width={stringSpacing}
                height={fretSpacing}
                fill="transparent"
                onClick={() => handleFretZoneClick(fret, si, svgX, svgY)}
              />
            );
          })
        )}

        {/* Barre indicators */}
        {chord.barres.map((barre, idx) => {
          const x1 = getStringX(barre.fromString);
          const x2 = getStringX(barre.toString);
          const y = getFretY(barre.fret) - fretSpacing / 2;
          const barH = dotRadius * 0.9;
          const svgX = (x1 + x2) / 2;
          const svgY = y;
          return (
            <rect
              key={`barre-${idx}`}
              x={x1}
              y={y - barH / 2}
              width={x2 - x1}
              height={barH}
              rx={barH}
              fill={barre.color}
              fillOpacity={0.85}
              style={{ cursor: 'pointer' }}
              onClick={(e) => handleBarreClick(e, barre, svgX, svgY)}
            />
          );
        })}

        {/* Barre preview in barre mode */}
        {barreMode && barreMode.selectedStrings.length >= 2 && (() => {
          const sorted = [...barreMode.selectedStrings].sort((a, b) => a - b);
          const x1 = getStringX(sorted[0]);
          const x2 = getStringX(sorted[sorted.length - 1]);
          const y = getFretY(barreMode.anchorFret) - fretSpacing / 2;
          return (
            <rect
              x={x1}
              y={y - 4}
              width={x2 - x1}
              height={8}
              rx={4}
              fill="hsl(38 75% 52%)"
              fillOpacity={0.45}
              stroke="hsl(38 75% 52%)"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
          );
        })()}

        {/* Drop target indicator */}
        {drag?.hasMoved && dragTarget && (() => {
          const cx = getStringX(dragTarget.string);
          const cy = getFretY(dragTarget.fret) - fretSpacing / 2;
          return (
            <circle
              cx={cx}
              cy={cy}
              r={dotRadius}
              fill="none"
              stroke="hsl(38 75% 52%)"
              strokeWidth={2}
              strokeDasharray="4 3"
              fillOpacity={0.3}
            />
          );
        })()}

        {/* Placed markers */}
        {chord.markers.map((marker, idx) => {
          const cx = getStringX(marker.string);
          const cy = getFretY(marker.fret) - fretSpacing / 2;
          const r = dotRadius;
          const isDragging = drag?.originFret === marker.fret && drag?.originString === marker.string;
          const opacity = isDragging ? 0.25 : 1;
          const textFill = isLightColor(marker.color) ? '#1a1a1a' : '#fafafa';
          const labelText = marker.label || (marker.finger > 0 ? String(marker.finger) : '');

          // Barre mode visibility
          const isInBarreMode = !!barreMode;
          const isEligible = isInBarreMode && marker.fret === barreMode!.anchorFret;
          const isSelected = isInBarreMode && barreMode!.selectedStrings.includes(marker.string) && marker.fret === barreMode!.anchorFret;
          const isAnchor = isInBarreMode && marker.fret === barreMode!.anchorFret && marker.string === barreMode!.anchorString;
          const dimmed = isInBarreMode && !isEligible;

          return (
            <g
              key={`marker-${idx}`}
              opacity={dimmed ? 0.35 : opacity}
              onPointerDown={(e) => !barreMode && handleMarkerPointerDown(e, marker)}
              onClick={(e) => {
                if (!barreMode) return;
                if (!isEligible) return;
                e.stopPropagation();
                handleBarreStringToggle(marker.fret, marker.string);
              }}
              style={{ cursor: barreMode ? (isEligible ? 'pointer' : 'default') : 'grab' }}
            >
              {/* Hit area */}
              <circle cx={cx} cy={cy} r={r + 8} fill="transparent" />

              {marker.shape === 'diamond' ? (
                <polygon
                  points={`${cx},${cy - r * 1.15} ${cx + r * 1.15},${cy} ${cx},${cy + r * 1.15} ${cx - r * 1.15},${cy}`}
                  fill={marker.color}
                />
              ) : (
                <circle cx={cx} cy={cy} r={r} fill={marker.color} />
              )}

              {labelText && (
                <text
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={13}
                  fill={textFill}
                  fontFamily="DM Sans, sans-serif"
                  fontWeight={700}
                  style={{ pointerEvents: 'none' }}
                >
                  {labelText}
                </text>
              )}

              {/* Barre mode selection ring */}
              {isSelected && (
                <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke="hsl(38 75% 52%)" strokeWidth={2} />
              )}
              {isAnchor && (
                <circle cx={cx} cy={cy} r={r + 6} fill="none" stroke="hsl(38 75% 52%)" strokeWidth={1.5} strokeDasharray="3 2" />
              )}
            </g>
          );
        })}

        {/* Drag ghost */}
        {drag?.hasMoved && (() => {
          const marker = drag.marker;
          const cx = drag.currentX;
          const cy = drag.currentY;
          const r = dotRadius;
          const textFill = isLightColor(marker.color) ? '#1a1a1a' : '#fafafa';
          const labelText = marker.label || (marker.finger > 0 ? String(marker.finger) : '');
          return (
            <g opacity={0.75} style={{ pointerEvents: 'none' }}>
              {marker.shape === 'diamond' ? (
                <polygon
                  points={`${cx},${cy - r * 1.15} ${cx + r * 1.15},${cy} ${cx},${cy + r * 1.15} ${cx - r * 1.15},${cy}`}
                  fill={marker.color}
                  stroke="hsl(38 75% 52%)"
                  strokeWidth={2}
                />
              ) : (
                <circle cx={cx} cy={cy} r={r} fill={marker.color} stroke="hsl(38 75% 52%)" strokeWidth={2} />
              )}
              {labelText && (
                <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={13} fill={textFill} fontFamily="DM Sans, sans-serif" fontWeight={700}>
                  {labelText}
                </text>
              )}
            </g>
          );
        })()}

        {/* Fret numbers on right side */}
        {Array.from({ length: numFrets }, (_, i) => (
          <text
            key={`fretnum-${i}`}
            x={getStringX(5) + 10}
            y={getFretY(i) + fretSpacing / 2}
            textAnchor="start"
            dominantBaseline="middle"
            fontSize={9}
            fill="hsl(33 14% 72%)"
            fillOpacity={0.7}
            fontFamily="DM Sans, sans-serif"
          >
            {chord.baseFret + i}
          </text>
        ))}
      </svg>

      {/* Barre mode banner */}
      {barreMode && (
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-2 py-1.5 rounded-t-lg bg-[hsl(38_75%_52%/0.15)] border-b border-[hsl(38_75%_52%/0.3)]">
          <span className="text-xs text-[hsl(38_75%_62%)] font-body font-medium">
            Barre Mode — Tap markers on fret {barreMode.anchorFret} to select
          </span>
          <button
            type="button"
            onClick={() => setBarreMode(null)}
            className="text-xs text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-subtle))] underline font-body"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Connect Now button in barre mode */}
      {barreMode && barreMode.selectedStrings.length >= 2 && (() => {
        const sorted = [...barreMode.selectedStrings].sort((a, b) => a - b);
        const x1 = getStringX(sorted[0]);
        const x2 = getStringX(sorted[sorted.length - 1]);
        const svgRect = svgRef.current?.getBoundingClientRect();
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (!svgRect || !containerRect) return null;
        const scaleX = svgRect.width / width;
        const fretY = getFretY(barreMode.anchorFret) - fretSpacing / 2;
        const scaleY = svgRect.height / height;
        const midX = ((x1 + x2) / 2) * scaleX + (svgRect.left - containerRect.left);
        const topY = fretY * scaleY + (svgRect.top - containerRect.top) - 40;

        return (
          <button
            type="button"
            onClick={handleConnectBarre}
            className="absolute px-2 py-1 rounded-md text-xs font-body font-semibold bg-[hsl(38_75%_52%)] text-zinc-950 shadow-md -translate-x-1/2"
            style={{ left: midX, top: topY }}
          >
            Connect Now
          </button>
        );
      })()}

      {/* Finger picker popup */}
      {popup && (
        <div
          style={getPopupStyle(popup.x, popup.y)}
          className="rounded-lg border border-[hsl(var(--border-default))] bg-[hsl(var(--bg-elevated))] shadow-lg shadow-black/40 px-1.5 py-1.5 animate-in fade-in zoom-in-95 duration-150"
          onMouseDown={e => e.stopPropagation()}
        >
          <div className="flex items-center gap-1">
            {FINGER_OPTIONS.map((opt) => (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => handlePopupFingerSelect(opt.finger, opt.customLabel)}
                className="size-8 rounded-md text-xs font-body font-bold bg-[hsl(var(--bg-surface))] hover:bg-[hsl(var(--color-primary))] hover:text-[hsl(var(--bg-base))] text-[hsl(var(--text-default))] transition-colors"
              >
                {opt.label}
              </button>
            ))}

            {popup.mode === 'edit' && (
              <>
                <button
                  type="button"
                  onClick={handlePopupBarre}
                  className="px-2 h-8 rounded-md text-xs font-body font-semibold bg-[hsl(38_75%_52%/0.2)] hover:bg-[hsl(38_75%_52%/0.35)] text-[hsl(38_75%_62%)] transition-colors whitespace-nowrap"
                >
                  Barre
                </button>
                <button
                  type="button"
                  onClick={handlePopupDelete}
                  className="size-8 rounded-md text-xs font-bold bg-[hsl(var(--semantic-error)/0.15)] hover:bg-[hsl(var(--semantic-error)/0.3)] text-[hsl(var(--semantic-error))] transition-colors"
                >
                  ✕
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Barre delete confirmation */}
      {barreDeleteConfirm && (
        <div
          style={{ position: 'absolute', left: barreDeleteConfirm.x - 80, top: barreDeleteConfirm.y + 8, zIndex: 60 }}
          className="rounded-lg border border-[hsl(var(--semantic-error)/0.3)] bg-[hsl(var(--bg-elevated))] shadow-lg shadow-black/40 p-3"
          onMouseDown={e => e.stopPropagation()}
        >
          <p className="text-xs text-[hsl(var(--text-subtle))] mb-2 font-body">Remove this barre?</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                removeBarreByKey(barreDeleteConfirm.fret, barreDeleteConfirm.fromString, barreDeleteConfirm.toString);
                setBarreDeleteConfirm(null);
              }}
              className="px-2 py-1 rounded-md text-xs font-body font-semibold bg-[hsl(var(--semantic-error))] text-white hover:opacity-90 transition-opacity"
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setBarreDeleteConfirm(null)}
              className="px-2 py-1 rounded-md text-xs font-body font-medium bg-[hsl(var(--bg-surface))] text-[hsl(var(--text-subtle))] hover:bg-[hsl(var(--bg-overlay))] transition-colors"
            >
              No
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
