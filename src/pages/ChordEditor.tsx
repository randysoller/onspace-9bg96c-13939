import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useCustomChordStore } from '@/stores/customChordStore';
import { CustomChordData } from '@/types/customChord';
import { FileText, Save, Trash2, XCircle, Keyboard, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { FretboardSVG } from '@/components/features/chord-editor/FretboardSVG';
import { ChordPreview } from '@/components/features/chord-editor/ChordPreview';
import { DotAppearanceControls } from '@/components/features/chord-editor/DotAppearanceControls';
import { DOT_COLORS, CHORD_CATEGORIES, CHORD_TYPES } from '@/constants/fretboard';
import type { DotMarker, BarreMarker, StringState, FingerType, ColorOption, ChordShape } from '@/types/fretboard';

export default function ChordEditor() {
  const { addCustomChord, customChords } = useCustomChordStore();
  const fretboardRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState<{
    chordName?: string;
    symbol?: string;
  }>({});
  
  // Fretboard state
  const [baseFret, setBaseFret] = useState<number>(1);
  const [visibleFrets, setVisibleFrets] = useState<number>(5);
  const [markers, setMarkers] = useState<DotMarker[]>([
    { string: 2, fret: 1, finger: 2, color: '#f59e0b', shape: 'circle' },
    { string: 1, fret: 2, finger: 1, color: '#06b6d4', shape: 'diamond' },
    { string: 4, fret: 3, finger: 3, color: '#64748b', shape: 'circle' },
  ]);
  const [barres, setBarres] = useState<BarreMarker[]>([]);
  const [barreMode, setBarreMode] = useState<boolean>(false);
  const [barreFret, setBarreFret] = useState<number | null>(null);
  const [barreFirstString, setBarreFirstString] = useState<number | null>(null);
  
  // Chord info
  const [chordName, setChordName] = useState<string>('C Major');
  const [symbol, setSymbol] = useState<string>('C');
  const [category, setCategory] = useState<string>('Open Chords');
  const [type, setType] = useState<string>('Major');
  
  // Dot appearance
  const [selectedColor, setSelectedColor] = useState<ColorOption>(DOT_COLORS[0]);
  const [selectedShape, setSelectedShape] = useState<ChordShape>('circle');
  const [selectedFinger, setSelectedFinger] = useState<FingerType>(1);
  const [customLabel, setCustomLabel] = useState<string>('');
  
  // Open strings state
  const [openStrings, setOpenStrings] = useState<StringState[]>(['none', 'none', 'none', 'none', 'none', 'none']);
  
  // Keyboard navigation state
  const [keyboardNavEnabled, setKeyboardNavEnabled] = useState<boolean>(false);
  const [selectedString, setSelectedString] = useState<number | null>(null);
  const [selectedFret, setSelectedFret] = useState<number | null>(null);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState<boolean>(false);

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

  // Real-time validation
  const validateChordName = useCallback((name: string): string | undefined => {
    if (!name.trim()) {
      return 'Chord name is required';
    }
    if (name.trim().length < 2) {
      return 'Chord name must be at least 2 characters';
    }
    const duplicate = customChords.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
      return 'A chord with this name already exists in your library';
    }
    return undefined;
  }, [customChords]);

  const validateSymbol = useCallback((sym: string): string | undefined => {
    if (!sym.trim()) {
      return 'Chord symbol is required';
    }
    // Regex for valid chord symbols: C, Am7, F#dim, etc.
    const symbolPattern = /^[A-G][#b]?(m|maj|min|dim|aug|sus)?[0-9]?$/i;
    if (!symbolPattern.test(sym.trim())) {
      return 'Invalid symbol format (e.g., C, Am7, F#dim)';
    }
    return undefined;
  }, []);

  // Validate on change
  useEffect(() => {
    const errors: typeof validationErrors = {};
    if (chordName) {
      errors.chordName = validateChordName(chordName);
    }
    if (symbol) {
      errors.symbol = validateSymbol(symbol);
    }
    setValidationErrors(errors);
  }, [chordName, symbol, validateChordName, validateSymbol]);

  // Check if form is valid
  const isValid = useMemo(() => {
    return chordName.trim() && symbol.trim() && 
           !validationErrors.chordName && 
           !validationErrors.symbol &&
           markers.length > 0;
  }, [chordName, symbol, validationErrors, markers]);

  const handleUpdateChord = useCallback(async () => {
    // Final validation
    const nameError = validateChordName(chordName);
    const symbolError = validateSymbol(symbol);
    
    if (nameError || symbolError) {
      setValidationErrors({ chordName: nameError, symbol: symbolError });
      toast.error('Please fix validation errors before saving');
      return;
    }

    if (markers.length === 0) {
      toast.error('Please add at least one marker to the fretboard');
      return;
    }

    setSaving(true);
    try {
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
      toast.success('Chord saved to library!');
      
      // Clear form after successful save
      handleStartNew();
    } catch (error) {
      toast.error('Failed to save chord');
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  }, [chordName, symbol, type, markers, baseFret, addCustomChord, validateChordName, validateSymbol, handleStartNew]);

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
    setSelectedString(null);
    setSelectedFret(null);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Don't handle keyboard events when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
        return;
      }

      // Toggle keyboard navigation mode
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setKeyboardNavEnabled(prev => !prev);
        if (!keyboardNavEnabled) {
          setSelectedString(2);
          setSelectedFret(1);
          fretboardRef.current?.focus();
        }
        return;
      }

      // Show keyboard shortcuts help
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowKeyboardHelp(prev => !prev);
        return;
      }

      if (!keyboardNavEnabled) return;

      // Navigation
      if (e.key === 'ArrowUp' || e.key === 'w') {
        e.preventDefault();
        setSelectedString(prev => prev !== null ? Math.max(0, prev - 1) : 2);
      } else if (e.key === 'ArrowDown' || e.key === 's') {
        e.preventDefault();
        setSelectedString(prev => prev !== null ? Math.min(5, prev + 1) : 2);
      } else if (e.key === 'ArrowLeft' || e.key === 'a') {
        e.preventDefault();
        setSelectedFret(prev => prev !== null ? Math.max(1, prev - 1) : 1);
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        e.preventDefault();
        setSelectedFret(prev => prev !== null ? Math.min(visibleFrets, prev + 1) : 1);
      }
      
      // Place/remove dot
      else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (selectedString !== null && selectedFret !== null) {
          handleFretClick(selectedString, selectedFret);
        }
      }
      
      // Delete marker
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (selectedString !== null && selectedFret !== null) {
          const index = markers.findIndex(m => m.string === selectedString && m.fret === selectedFret);
          if (index !== -1) {
            setMarkers(prev => prev.filter((_, i) => i !== index));
          }
        }
      }
      
      // Select finger
      else if (['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        setSelectedFinger(parseInt(e.key) as FingerType);
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setSelectedFinger('T');
      }
      
      // Toggle barre mode
      else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        handleBarreToggle();
      }
      
      // Escape to exit modes
      else if (e.key === 'Escape') {
        e.preventDefault();
        if (barreMode) {
          setBarreMode(false);
          setBarreFret(null);
          setBarreFirstString(null);
        } else if (keyboardNavEnabled) {
          setKeyboardNavEnabled(false);
          setSelectedString(null);
          setSelectedFret(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyboardNavEnabled, selectedString, selectedFret, visibleFrets, markers, handleFretClick, handleBarreToggle, barreMode]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1">Chord Editor</h1>
              <p className="text-sm text-zinc-500">
                Editing: <span className="text-amber-500">{symbol || 'C'}</span> — drag dots to reposition, tap to change fingers
              </p>
            </div>
            <button
              onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
              className="p-2 text-zinc-500 hover:text-amber-500 transition-colors"
              aria-label="Show keyboard shortcuts"
              title="Show keyboard shortcuts (?)"
            >
              <Keyboard className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
          
          {/* Keyboard shortcuts help */}
          {showKeyboardHelp && (
            <div 
              className="mt-4 bg-zinc-900 border border-zinc-800 rounded-lg p-4"
              role="region"
              aria-label="Keyboard shortcuts"
            >
              <h3 className="text-sm font-semibold text-amber-500 mb-3">Keyboard Shortcuts</h3>
              <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
                <div><kbd className="px-2 py-1 bg-zinc-800 rounded">Cmd/Ctrl+K</kbd> Toggle navigation</div>
                <div><kbd className="px-2 py-1 bg-zinc-800 rounded">?</kbd> Show this help</div>
                <div><kbd className="px-2 py-1 bg-zinc-800 rounded">↑↓←→</kbd> or <kbd className="px-2 py-1 bg-zinc-800 rounded">WASD</kbd> Navigate</div>
                <div><kbd className="px-2 py-1 bg-zinc-800 rounded">Enter/Space</kbd> Place dot</div>
                <div><kbd className="px-2 py-1 bg-zinc-800 rounded">1-4</kbd> Select finger</div>
                <div><kbd className="px-2 py-1 bg-zinc-800 rounded">T</kbd> Thumb</div>
                <div><kbd className="px-2 py-1 bg-zinc-800 rounded">B</kbd> Toggle barre</div>
                <div><kbd className="px-2 py-1 bg-zinc-800 rounded">Del</kbd> Remove dot</div>
                <div><kbd className="px-2 py-1 bg-zinc-800 rounded">Esc</kbd> Cancel/Exit</div>
              </div>
            </div>
          )}
        </div>

        {/* FRETBOARD Section */}
        <div 
          ref={fretboardRef}
          className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 mb-6"
          tabIndex={0}
          role="application"
          aria-label="Chord fretboard editor"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase text-zinc-400 tracking-wide">Fretboard</h2>
            <div className="flex items-center gap-2">
              {keyboardNavEnabled && (
                <span className="text-xs text-amber-500 font-semibold" aria-live="polite">
                  Keyboard Mode Active
                </span>
              )}
              <button
                onClick={handleClear}
                className="text-xs text-zinc-500 hover:text-amber-500 transition-colors flex items-center gap-1"
                aria-label="Clear all markers"
              >
                <XCircle className="w-3 h-3" aria-hidden="true" />
                Clear
              </button>
            </div>
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
              selectedString={keyboardNavEnabled ? selectedString : null}
              selectedFret={keyboardNavEnabled ? selectedFret : null}
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
              <label htmlFor="chord-name" className="text-xs text-zinc-500 mb-1.5 block">Chord Name *</label>
              <input
                id="chord-name"
                type="text"
                value={chordName}
                onChange={(e) => setChordName(e.target.value)}
                className={`w-full bg-zinc-950 border rounded px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none ${
                  validationErrors.chordName 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-zinc-700 focus:border-amber-500'
                }`}
                placeholder="C Major"
                aria-required="true"
                aria-describedby="chord-name-help chord-name-error"
                aria-invalid={!!validationErrors.chordName}
              />
              <span id="chord-name-help" className="sr-only">Enter the full name of the chord, for example C Major or A minor 7</span>
              {validationErrors.chordName && (
                <div 
                  id="chord-name-error" 
                  className="flex items-center gap-1 mt-1.5 text-xs text-red-500"
                  role="alert"
                  aria-live="polite"
                >
                  <AlertCircle className="w-3 h-3" aria-hidden="true" />
                  {validationErrors.chordName}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="chord-symbol" className="text-xs text-zinc-500 mb-1.5 block">Symbol *</label>
              <input
                id="chord-symbol"
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className={`w-full bg-zinc-950 border rounded px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none ${
                  validationErrors.symbol 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-zinc-700 focus:border-amber-500'
                }`}
                placeholder="C"
                aria-required="true"
                aria-describedby="chord-symbol-help chord-symbol-error"
                aria-invalid={!!validationErrors.symbol}
              />
              <span id="chord-symbol-help" className="sr-only">Enter the chord symbol, for example C, Am7, or F#dim</span>
              {validationErrors.symbol && (
                <div 
                  id="chord-symbol-error" 
                  className="flex items-center gap-1 mt-1.5 text-xs text-red-500"
                  role="alert"
                  aria-live="polite"
                >
                  <AlertCircle className="w-3 h-3" aria-hidden="true" />
                  {validationErrors.symbol}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="chord-category" className="text-xs text-zinc-500 mb-1.5 block">Category</label>
                <select
                  id="chord-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  aria-label="Select chord category"
                >
                  {CHORD_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="chord-type" className="text-xs text-zinc-500 mb-1.5 block">Type</label>
                <select
                  id="chord-type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  aria-label="Select chord type"
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
            disabled={!isValid || saving}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed text-zinc-950 font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
            aria-label="Save chord to library"
            aria-live="polite"
          >
            {saving ? <LoadingSpinner size="sm" /> : <Save className="w-5 h-5" aria-hidden="true" />}
            {saving ? 'Saving...' : 'Update Chord'}
          </button>
          {!isValid && (chordName || symbol || markers.length > 0) && (
            <p className="text-xs text-zinc-500 text-center -mt-2" role="status" aria-live="polite">
              {!chordName ? 'Enter chord name' : !symbol ? 'Enter chord symbol' : markers.length === 0 ? 'Add at least one marker' : 'Fix validation errors to save'}
            </p>
          )}

          <button
            onClick={handleStartNew}
            className="w-full bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-white font-medium py-3 rounded-lg transition-colors border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:ring-offset-2 focus:ring-offset-zinc-950"
            aria-label="Cancel editing and start a new chord"
          >
            + Cancel — Start New
          </button>

          <button
            onClick={() => {}}
            className="w-full bg-transparent hover:bg-red-950/30 text-red-500 font-medium py-3 rounded-lg transition-colors border border-zinc-800 hover:border-red-900 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
            aria-label="Delete chord from library"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
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
