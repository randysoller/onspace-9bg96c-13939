import { useState, useCallback } from 'react';
import { useCustomChordStore } from '@/stores/customChordStore';
import { CustomChordData } from '@/types/customChord';
import { FileText, Save, Trash2, XCircle } from 'lucide-react';
import { FretboardSVG } from '@/components/features/chord-editor/FretboardSVG';
import { ChordPreview } from '@/components/features/chord-editor/ChordPreview';
import { DotAppearanceControls } from '@/components/features/chord-editor/DotAppearanceControls';
import { DOT_COLORS, CHORD_CATEGORIES, CHORD_TYPES } from '@/constants/fretboard';

interface DotMarker {
  string: number;
  fret: number;
  finger: number | 'T';
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

type StringState = 'none' | 'open-circle' | 'muted' | 'open-diamond';

export default function ChordEditor() {
  const { addCustomChord } = useCustomChordStore();
  
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
  const [selectedColor, setSelectedColor] = useState(DOT_COLORS[0]);
  const [selectedShape, setSelectedShape] = useState<'circle' | 'diamond'>('circle');
  const [selectedFinger, setSelectedFinger] = useState<number | 'T'>(1);
  const [customLabel, setCustomLabel] = useState('');
  
  // Open strings state
  const [openStrings, setOpenStrings] = useState<StringState[]>(['none', 'none', 'none', 'none', 'none', 'none']);

  const handleFretClick = useCallback((string: number, fret: number) => {
    const existingIndex = markers.findIndex(m => m.string === string && m.fret === fret);
    
    if (existingIndex !== -1) {
      if (barreMode) {
        const clickedMarker = markers[existingIndex];
        
        if (barreFret === null) {
          setBarreFret(clickedMarker.fret);
          setBarreFirstString(clickedMarker.string);
        } else if (clickedMarker.fret === barreFret && barreFirstString !== null) {
          const fromString = Math.min(barreFirstString, clickedMarker.string);
          const toString = Math.max(barreFirstString, clickedMarker.string);
          
          setBarres(prev => [...prev, {
            fret: barreFret,
            fromString,
            toString,
            finger: clickedMarker.finger,
          }]);
          
          setBarreMode(false);
          setBarreFret(null);
          setBarreFirstString(null);
        } else {
          setBarreFret(null);
          setBarreFirstString(null);
        }
      } else {
        setMarkers(prev => prev.filter((_, i) => i !== existingIndex));
      }
    } else {
      if (!barreMode) {
        setMarkers(prev => [...prev, {
          string,
          fret,
          finger: selectedFinger,
          color: selectedColor.value,
          shape: selectedShape,
          label: customLabel || undefined,
        }]);
      }
    }
  }, [markers, barreMode, barreFret, barreFirstString, selectedFinger, selectedColor, selectedShape, customLabel]);

  const handleStringHeaderClick = useCallback((stringIndex: number) => {
    setOpenStrings(prev => {
      const newState = [...prev];
      const current = newState[stringIndex];
      
      if (current === 'none') {
        newState[stringIndex] = 'open-circle';
      } else if (current === 'open-circle') {
        newState[stringIndex] = 'muted';
      } else if (current === 'muted') {
        newState[stringIndex] = 'open-diamond';
      } else {
        newState[stringIndex] = 'none';
      }
      
      return newState;
    });
  }, []);

  const handleClear = useCallback(() => {
    setMarkers([]);
    setBarres([]);
    setOpenStrings(['none', 'none', 'none', 'none', 'none', 'none']);
    setBarreMode(false);
    setBarreFret(null);
    setBarreFirstString(null);
  }, []);

  const handleBarreDoubleClick = useCallback((barreIndex: number) => {
    setBarres(prev => prev.filter((_, i) => i !== barreIndex));
  }, []);

  const handleBarreToggle = useCallback(() => {
    setBarreMode(prev => !prev);
    if (barreMode) {
      setBarreFret(null);
      setBarreFirstString(null);
    }
  }, [barreMode]);

  const handleUpdateChord = useCallback(() => {
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
  }, [chordName, symbol, type, markers, baseFret, addCustomChord]);

  const handleStartNew = useCallback(() => {
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
  }, []);

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

          <div className="flex justify-center">
            <FretboardSVG
              baseFret={baseFret}
              visibleFrets={visibleFrets}
              markers={markers}
              barres={barres}
              openStrings={openStrings}
              selectedFinger={selectedFinger}
              barreMode={barreMode}
              barreFret={barreFret}
              barreFirstString={barreFirstString}
              onFretClick={handleFretClick}
              onStringHeaderClick={handleStringHeaderClick}
              onBarreDoubleClick={handleBarreDoubleClick}
              onFingerSelect={setSelectedFinger}
              onBarreToggle={handleBarreToggle}
            />
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
                  {CHORD_CATEGORIES.map(cat => (
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
                  {CHORD_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* DOT APPEARANCE & CUSTOM LABEL */}
        <DotAppearanceControls
          selectedColor={selectedColor}
          selectedShape={selectedShape}
          customLabel={customLabel}
          onColorChange={setSelectedColor}
          onShapeChange={setSelectedShape}
          onLabelChange={setCustomLabel}
        />

        {/* ACTION BUTTONS */}
        <div className="space-y-3 my-6">
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
          <ChordPreview
            symbol={symbol}
            chordName={chordName}
            markers={markers}
            barres={barres}
            openStrings={openStrings}
          />
        </div>
      </div>
    </div>
  );
}
