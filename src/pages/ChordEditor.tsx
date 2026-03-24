import { useState } from 'react';
import { useCustomChordStore } from '@/stores/customChordStore';
import { CustomChordData } from '@/types/customChord';
import { FileText, Edit3, Save, Trash2, XCircle } from 'lucide-react';

interface DotMarker {
  string: number; // 0-5 (E to e)
  fret: number; // 0-5
  finger: number | 'T'; // 1-4 or T for thumb
  color: string;
  shape: 'circle' | 'diamond';
  label?: string;
}

interface BarreMarker {
  fret: number;
  fromString: number;
  toString: number;
  finger: number | 'T';
}

const COLORS = [
  { name: 'Orange', value: '#f59e0b', class: 'bg-amber-500' },
  { name: 'Cyan', value: '#06b6d4', class: 'bg-cyan-500' },
  { name: 'Green', value: '#10b981', class: 'bg-emerald-500' },
  { name: 'Emerald', value: '#14b8a6', class: 'bg-teal-500' },
  { name: 'Purple', value: '#a855f7', class: 'bg-purple-500' },
  { name: 'Orange-Red', value: '#f97316', class: 'bg-orange-500' },
  { name: 'Pink', value: '#ec4899', class: 'bg-pink-500' },
  { name: 'Teal', value: '#14b8a6', class: 'bg-teal-400' },
  { name: 'Yellow', value: '#eab308', class: 'bg-yellow-500' },
  { name: 'Blue', value: '#3b82f6', class: 'bg-blue-500' },
  { name: 'White', value: '#ffffff', class: 'bg-white' },
  { name: 'Gray', value: '#64748b', class: 'bg-slate-500' },
];

const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e'];
const CATEGORIES = ['Open Chords', 'Barre Chords', 'Power Chords', 'Jazz Chords', 'Custom'];
const TYPES = ['Major', 'Minor', '7th', 'Major 7th', 'Minor 7th', 'Diminished', 'Augmented', 'Sus2', 'Sus4'];

export default function ChordEditor() {
  const { addCustomChord, deleteCustomChord } = useCustomChordStore();
  
  // Fretboard state
  const [baseFret, setBaseFret] = useState(1);
  const [visibleFrets, setVisibleFrets] = useState(5);
  const [markers, setMarkers] = useState<DotMarker[]>([
    { string: 2, fret: 1, finger: 2, color: '#f59e0b', shape: 'circle' },
    { string: 1, fret: 2, finger: 1, color: '#06b6d4', shape: 'diamond' },
    { string: 4, fret: 3, finger: 3, color: '#64748b', shape: 'circle' },
  ]);
  const [barres, setBarres] = useState<BarreMarker[]>([]);
  const [barreMode, setBarreMode] = useState(false);
  const [barreFret, setBarreFret] = useState<number | null>(null);
  const [barreFirstString, setBarreFirstString] = useState<number | null>(null);
  
  // Chord info
  const [chordName, setChordName] = useState('C Major');
  const [symbol, setSymbol] = useState('C');
  const [category, setCategory] = useState('Open Chords');
  const [type, setType] = useState('Major');
  
  // Dot appearance
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedShape, setSelectedShape] = useState<'circle' | 'diamond'>('circle');
  const [selectedFinger, setSelectedFinger] = useState<number | 'T'>(1);
  const [customLabel, setCustomLabel] = useState('');
  
  // Open strings state ('none', 'open-circle', 'muted', 'open-diamond')
  const [openStrings, setOpenStrings] = useState<('none' | 'open-circle' | 'muted' | 'open-diamond')[]>(['none', 'none', 'none', 'none', 'none', 'none']);

  const handleFretClick = (string: number, fret: number) => {
    // Check if there's already a marker here
    const existingIndex = markers.findIndex(m => m.string === string && m.fret === fret);
    
    if (existingIndex !== -1) {
      // If in barre mode and clicking on existing marker
      if (barreMode) {
        const clickedMarker = markers[existingIndex];
        
        // If this is the first click in barre mode
        if (barreFret === null) {
          setBarreFret(clickedMarker.fret);
          setBarreFirstString(clickedMarker.string);
        } else if (clickedMarker.fret === barreFret && barreFirstString !== null) {
          // Second click - create the barre
          const fromString = Math.min(barreFirstString, clickedMarker.string);
          const toString = Math.max(barreFirstString, clickedMarker.string);
          
          setBarres([...barres, {
            fret: barreFret,
            fromString,
            toString,
            finger: clickedMarker.finger,
          }]);
          
          // Reset barre mode
          setBarreMode(false);
          setBarreFret(null);
          setBarreFirstString(null);
        } else {
          // Wrong fret - reset
          setBarreFret(null);
          setBarreFirstString(null);
        }
      } else {
        // Not in barre mode - remove existing marker
        setMarkers(markers.filter((_, i) => i !== existingIndex));
      }
    } else {
      // Add new marker only if not in barre mode
      if (!barreMode) {
        setMarkers([...markers, {
          string,
          fret,
          finger: selectedFinger,
          color: selectedColor.value,
          shape: selectedShape,
          label: customLabel || undefined,
        }]);
      }
    }
  };

  const handleStringHeaderClick = (string: number) => {
    const current = openStrings[string];
    const newState = [...openStrings];
    
    // Cycle: none → open-circle → muted → open-diamond → none
    if (current === 'none') {
      newState[string] = 'open-circle';
    } else if (current === 'open-circle') {
      newState[string] = 'muted';
    } else if (current === 'muted') {
      newState[string] = 'open-diamond';
    } else {
      newState[string] = 'none';
    }
    
    setOpenStrings(newState);
  };

  const handleClear = () => {
    setMarkers([]);
    setBarres([]);
    setOpenStrings(['none', 'none', 'none', 'none', 'none', 'none']);
    setBarreMode(false);
    setBarreFret(null);
    setBarreFirstString(null);
  };

  const handleBarreDoubleClick = (barreIndex: number) => {
    setBarres(barres.filter((_, i) => i !== barreIndex));
  };

  const handleUpdateChord = () => {
    const newChord: CustomChordData = {
      id: Date.now().toString(),
      name: chordName,
      root: symbol.charAt(0).toUpperCase(),
      type,
      markers: markers.map(m => ({ string: m.string, fret: m.fret, finger: m.finger })),
      barres: [],
      baseFret,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    addCustomChord(newChord);
    alert('Chord saved to library!');
  };

  const handleStartNew = () => {
    setMarkers([]);
    setBarres([]);
    setOpenStrings(['none', 'none', 'none', 'none', 'none', 'none']);
    setChordName('');
    setSymbol('');
    setBaseFret(1);
    setVisibleFrets(5);
    setBarreMode(false);
    setBarreFret(null);
    setBarreFirstString(null);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Chord Editor</h1>
          <p className="text-sm text-zinc-500">
            Editing: <span className="text-amber-500">{symbol || 'C'}</span> — drag dots to reposition, tap to change fingers
          </p>
        </div>

        {/* FRETBOARD Section */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase text-zinc-400 tracking-wide">Fretboard</h2>
            <button
              onClick={handleClear}
              className="text-xs text-zinc-500 hover:text-amber-500 transition-colors flex items-center gap-1"
            >
              <XCircle className="w-3 h-3" />
              Clear
            </button>
          </div>

          <p className="text-xs text-zinc-600 mb-4">
            Tap fret to place dot. Tap dot to remove. {barreMode && barreFret === null ? (
              <span className="text-amber-500 font-semibold">BARRE MODE: Click first dot in fret to start barre.</span>
            ) : barreMode && barreFret !== null ? (
              <span className="text-amber-500 font-semibold">BARRE MODE: Click second dot in fret {barreFret} to complete barre.</span>
            ) : (
              'Select finger 1-4 or T (thumb), then tap fret. Click "Barre" button to create bar across strings.'
            )} Double-click barre to remove.
          </p>

          {/* Fretboard SVG */}
          <div className="flex justify-center">
            <svg width="320" height="400" viewBox="0 0 320 400" className="select-none">
              {/* String labels at top */}
              {STRING_NAMES.map((name, idx) => (
                <g key={`string-label-${idx}`}>
                  <text
                    x={40 + idx * 45}
                    y={25}
                    textAnchor="middle"
                    className="text-xs fill-zinc-500 font-semibold"
                  >
                    {name}
                  </text>
                  
                  {/* Open/Muted indicator with larger hit area */}
                  <g
                    onClick={() => handleStringHeaderClick(idx)}
                    className="cursor-pointer"
                  >
                    {/* Larger transparent hit area for easier clicking */}
                    <circle
                      cx={40 + idx * 45}
                      cy={40}
                      r="16"
                      fill="transparent"
                      className="hover:fill-white/5"
                    />
                    
                    {openStrings[idx] === 'open-circle' && (
                      <circle
                        cx={40 + idx * 45}
                        cy={40}
                        r="9"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="3"
                        className="pointer-events-none"
                      />
                    )}
                    {openStrings[idx] === 'muted' && (
                      <text
                        x={40 + idx * 45}
                        y={45}
                        textAnchor="middle"
                        className="text-lg fill-zinc-300 font-bold pointer-events-none"
                      >
                        ✕
                      </text>
                    )}
                    {openStrings[idx] === 'open-diamond' && (
                      <path
                        d={`M ${40 + idx * 45} ${40 - 9} L ${40 + idx * 45 + 9} ${40} L ${40 + idx * 45} ${40 + 9} L ${40 + idx * 45 - 9} ${40} Z`}
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="3"
                        className="pointer-events-none"
                      />
                    )}
                    {openStrings[idx] === 'none' && (
                      <circle
                        cx={40 + idx * 45}
                        cy={40}
                        r="9"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="text-zinc-600 hover:text-zinc-400 pointer-events-none"
                      />
                    )}
                  </g>
                </g>
              ))}

              {/* Fret number labels (1 2 3 4 T - Barre) */}
              <g>
                {[1, 2, 3, 4, 'T', '-', 'Barre'].map((label, idx) => {
                  const x = 40 + idx * 35;
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
                          onClick={() => setSelectedFinger(label as number | 'T')}
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
                          onClick={() => {
                            setBarreMode(!barreMode);
                            if (barreMode) {
                              setBarreFret(null);
                              setBarreFirstString(null);
                            }
                          }}
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
                            setSelectedFinger(label as number | 'T');
                          } else if (isBarreButton) {
                            setBarreMode(!barreMode);
                            if (barreMode) {
                              setBarreFret(null);
                              setBarreFirstString(null);
                            }
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
              <rect x="15" y="88" width="270" height="4" fill="currentColor" className="text-zinc-200" />

              {/* Fret lines */}
              {Array.from({ length: visibleFrets }).map((_, fretIdx) => (
                <line
                  key={`fret-${fretIdx}`}
                  x1="15"
                  y1={92 + (fretIdx + 1) * 55}
                  x2="285"
                  y2={92 + (fretIdx + 1) * 55}
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-zinc-200"
                />
              ))}

              {/* String lines */}
              {STRING_NAMES.map((_, stringIdx) => (
                <line
                  key={`string-${stringIdx}`}
                  x1={40 + stringIdx * 45}
                  y1="88"
                  x2={40 + stringIdx * 45}
                  y2={92 + visibleFrets * 55}
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-zinc-200"
                />
              ))}

              {/* Fret number labels on right */}
              {Array.from({ length: visibleFrets }).map((_, fretIdx) => (
                <text
                  key={`fret-num-${fretIdx}`}
                  x="300"
                  y={92 + (fretIdx + 0.5) * 55 + 5}
                  className="text-xs fill-zinc-600"
                >
                  {baseFret + fretIdx}
                </text>
              ))}

              {/* Interactive fret areas */}
              {STRING_NAMES.map((_, stringIdx) =>
                Array.from({ length: visibleFrets }).map((_, fretIdx) => (
                  <rect
                    key={`hit-${stringIdx}-${fretIdx}`}
                    x={40 + stringIdx * 45 - 20}
                    y={92 + fretIdx * 55}
                    width={40}
                    height={55}
                    fill="transparent"
                    className="cursor-pointer hover:fill-white/5"
                    onClick={() => handleFretClick(stringIdx, fretIdx + 1)}
                  />
                ))
              )}

              {/* Barres - draw before markers */}
              {barres.map((barre, idx) => {
                const x1 = 40 + barre.fromString * 45;
                const x2 = 40 + barre.toString * 45;
                const y = 92 + (barre.fret - 0.5) * 55;

                return (
                  <line
                    key={`barre-${idx}`}
                    x1={x1}
                    y1={y}
                    x2={x2}
                    y2={y}
                    stroke="#f59e0b"
                    strokeWidth="12"
                    strokeLinecap="round"
                    className="cursor-pointer"
                    onDoubleClick={() => handleBarreDoubleClick(idx)}
                  />
                );
              })}

              {/* Markers */}
              {markers.map((marker, idx) => {
                const x = 40 + marker.string * 45;
                const y = 92 + (marker.fret - 0.5) * 55;
                const isPartOfBarre = barreMode && barreFirstString !== null && marker.string === barreFirstString && marker.fret === barreFret;

                return (
                  <g key={`marker-${idx}`} className="cursor-pointer">
                    {marker.shape === 'circle' ? (
                      <circle
                        cx={x}
                        cy={y}
                        r="14"
                        fill={marker.color}
                        stroke={isPartOfBarre ? '#f59e0b' : 'none'}
                        strokeWidth={isPartOfBarre ? '3' : '0'}
                        onClick={() => handleFretClick(marker.string, marker.fret)}
                      />
                    ) : (
                      <path
                        d={`M ${x} ${y - 14} L ${x + 14} ${y} L ${x} ${y + 14} L ${x - 14} ${y} Z`}
                        fill={marker.color}
                        stroke={isPartOfBarre ? '#f59e0b' : 'none'}
                        strokeWidth={isPartOfBarre ? '3' : '0'}
                        onClick={() => handleFretClick(marker.string, marker.fret)}
                      />
                    )}
                    
                    {marker.label ? (
                      <text
                        x={x}
                        y={y + 1}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-xs font-black pointer-events-none"
                        fill={marker.color === '#ffffff' ? '#000000' : '#ffffff'}
                      >
                        {marker.label}
                      </text>
                    ) : (
                      <text
                        x={x}
                        y={y + 1}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-sm font-black pointer-events-none"
                        fill={marker.color === '#ffffff' ? '#000000' : marker.shape === 'diamond' ? '#ffffff' : '#1a1a1a'}
                      >
                        {marker.finger}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* FRET SETTINGS */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 mb-6">
          <h2 className="text-sm font-semibold uppercase text-zinc-400 tracking-wide mb-4">Fret Settings</h2>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-xs text-zinc-500 mb-2 block">Base Fret</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBaseFret(Math.max(1, baseFret - 1))}
                  className="w-10 h-10 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 text-zinc-400 transition-colors"
                >
                  −
                </button>
                <div className="flex-1 text-center text-2xl font-bold">{baseFret}</div>
                <button
                  onClick={() => setBaseFret(baseFret + 1)}
                  className="w-10 h-10 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 text-zinc-400 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-500 mb-2 block">Visible Frets</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setVisibleFrets(Math.max(3, visibleFrets - 1))}
                  className="w-10 h-10 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 text-zinc-400 transition-colors"
                >
                  −
                </button>
                <div className="flex-1 text-center text-2xl font-bold">{visibleFrets}</div>
                <button
                  onClick={() => setVisibleFrets(Math.min(7, visibleFrets + 1))}
                  className="w-10 h-10 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 text-zinc-400 transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CHORD INFO */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-semibold uppercase text-zinc-400 tracking-wide">Chord Info</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-zinc-500 mb-1.5 block">Chord Name *</label>
              <input
                type="text"
                value={chordName}
                onChange={(e) => setChordName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                placeholder="C Major"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-500 mb-1.5 block">Symbol *</label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                placeholder="C"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-500 mb-1.5 block">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-1.5 block">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                >
                  {TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* DOT APPEARANCE */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Edit3 className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-semibold uppercase text-zinc-400 tracking-wide">Dot Appearance</h2>
          </div>
          
          <p className="text-xs text-zinc-600 mb-4">
            Configure the color, shape, and label for the next dot you place.
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-zinc-500 mb-2 block uppercase tracking-wide">Dot Color</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color)}
                    className={`w-10 h-10 rounded ${color.class} ${
                      selectedColor.name === color.name
                        ? 'ring-2 ring-offset-2 ring-offset-zinc-900 ring-amber-500'
                        : ''
                    } transition-all hover:scale-110`}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-500 mb-2 block uppercase tracking-wide">Dot Shape</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedShape('circle')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded border transition-all ${
                    selectedShape === 'circle'
                      ? 'bg-amber-500 border-amber-500 text-zinc-950 font-semibold'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-current opacity-40" />
                  Circle
                </button>

                <button
                  onClick={() => setSelectedShape('diamond')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded border transition-all ${
                    selectedShape === 'diamond'
                      ? 'bg-amber-500 border-amber-500 text-zinc-950 font-semibold'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  <div className="w-3 h-3 rotate-45 bg-current opacity-40" />
                  Diamond
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CUSTOM FRET LABEL */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 mb-6">
          <label className="text-xs text-zinc-500 mb-1.5 block uppercase tracking-wide">
            Custom Fret Label <span className="text-zinc-700">(Override finger #)</span>
          </label>
          <input
            type="text"
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500"
            placeholder="e.g. 1/2"
          />
        </div>

        {/* ACTION BUTTONS */}
        <div className="space-y-3 mb-6">
          <button
            onClick={handleUpdateChord}
            className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Save className="w-5 h-5" />
            Update Chord
          </button>

          <button
            onClick={handleStartNew}
            className="w-full bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-white font-medium py-3 rounded-lg transition-colors border border-zinc-800"
          >
            + Cancel — Start New
          </button>

          <button
            onClick={() => {}}
            className="w-full bg-transparent hover:bg-red-950/30 text-red-500 font-medium py-3 rounded-lg transition-colors border border-zinc-800 hover:border-red-900 flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete from Library
          </button>
        </div>

        {/* LIVE PREVIEW */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-sm font-semibold uppercase text-zinc-400 tracking-wide mb-4">Live Preview</h2>
          
          <div className="text-center">
            <div className="text-5xl font-black text-amber-500 mb-1">{symbol || 'C'}</div>
            <div className="text-sm text-zinc-500 mb-6">{chordName || 'C Major'}</div>

            {/* Preview Diagram */}
            <div className="flex justify-center">
              <svg width="180" height="220" viewBox="0 0 180 220">
                {/* Nut */}
                <rect x="30" y="20" width="120" height="4" fill="currentColor" className="text-zinc-200" />

                {/* Frets */}
                {[1, 2, 3, 4].map((fret) => (
                  <line
                    key={`preview-fret-${fret}`}
                    x1="30"
                    y1={20 + fret * 45}
                    x2="150"
                    y2={20 + fret * 45}
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-zinc-200"
                  />
                ))}

                {/* Strings */}
                {[0, 1, 2, 3, 4, 5].map((string) => (
                  <line
                    key={`preview-string-${string}`}
                    x1={30 + string * 24}
                    y1="20"
                    x2={30 + string * 24}
                    y2="200"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-zinc-200"
                  />
                ))}

                {/* Open/Muted markers */}
                {openStrings.map((state, idx) => {
                  if (state === 'open-circle') {
                    return (
                      <circle
                        key={`preview-open-${idx}`}
                        cx={30 + idx * 24}
                        cy={10}
                        r="7"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2.5"
                      />
                    );
                  } else if (state === 'muted') {
                    return (
                      <text
                        key={`preview-muted-${idx}`}
                        x={30 + idx * 24}
                        y={14}
                        textAnchor="middle"
                        className="text-base fill-zinc-300 font-bold"
                      >
                        ✕
                      </text>
                    );
                  } else if (state === 'open-diamond') {
                    return (
                      <path
                        key={`preview-diamond-${idx}`}
                        d={`M ${30 + idx * 24} ${10 - 7} L ${30 + idx * 24 + 7} ${10} L ${30 + idx * 24} ${10 + 7} L ${30 + idx * 24 - 7} ${10} Z`}
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="2.5"
                      />
                    );
                  }
                  return null;
                })}

                {/* Barres in preview */}
                {barres.map((barre, idx) => {
                  const x1 = 30 + barre.fromString * 24;
                  const x2 = 30 + barre.toString * 24;
                  const y = 20 + (barre.fret - 0.5) * 45;

                  return (
                    <line
                      key={`preview-barre-${idx}`}
                      x1={x1}
                      y1={y}
                      x2={x2}
                      y2={y}
                      stroke="#f59e0b"
                      strokeWidth="8"
                      strokeLinecap="round"
                    />
                  );
                })}

                {/* Markers */}
                {markers.map((marker, idx) => {
                  const x = 30 + marker.string * 24;
                  const y = 20 + (marker.fret - 0.5) * 45;

                  return (
                    <g key={`preview-marker-${idx}`}>
                      {marker.shape === 'circle' ? (
                        <circle cx={x} cy={y} r="10" fill={marker.color} />
                      ) : (
                        <path
                          d={`M ${x} ${y - 10} L ${x + 10} ${y} L ${x} ${y + 10} L ${x - 10} ${y} Z`}
                          fill={marker.color}
                        />
                      )}
                      <text
                        x={x}
                        y={y + 1}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-xs font-black"
                        fill={marker.color === '#ffffff' ? '#000000' : '#ffffff'}
                      >
                        {marker.label || marker.finger}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
