import { useState } from 'react';
import { useCustomChordStore } from '@/stores/customChordStore';
import InteractiveFretboard from '@/components/features/InteractiveFretboard';
import CustomChordDiagram from '@/components/features/CustomChordDiagram';
import ColorShapePicker from '@/components/features/ColorShapePicker';
import { CHORD_TYPE_LABELS, CATEGORY_LABELS } from '@/types/chord';
import type { ChordType, ChordCategory } from '@/types/chord';
import type { DotShape } from '@/types/customChord';
import { DEFAULT_DOT_COLOR, DEFAULT_ROOT_COLOR } from '@/types/customChord';
import {
  Plus, Save, Trash2, RotateCcw, Minus, FileText, Pencil, Tag,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const EDITABLE_TYPES: ChordType[] = [
  'major', 'minor', 'augmented', 'slash', 'diminished', 'suspended',
  'major7', 'dominant7', 'minor7', 'aug7', 'halfDim7', 'dim7',
  '9th', '11th', '13th',
];

const EDITABLE_CATEGORIES: ChordCategory[] = ['open', 'barre', 'movable', 'custom'];

const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e'];

export default function ChordEditor() {
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    currentChord,
    selectedColor,
    selectedShape,
    selectedFinger,
    customLabel,
    isEditing,
    setSelectedColor,
    setSelectedShape,
    setSelectedFinger,
    setCustomLabel,
    setName,
    setSymbol,
    setBaseFret,
    setNumFrets,
    setChordType,
    setChordCategory,
    saveChord,
    deleteFromLibrary,
    newChord,
    clearFretboard,
  } = useCustomChordStore();

  const canSave =
    currentChord.name.trim() !== '' &&
    currentChord.symbol.trim() !== '' &&
    currentChord.markers.length > 0;

  const canDelete = isEditing || !!currentChord.sourceChordId;

  const handleShapeChange = (shape: DotShape) => {
    setSelectedShape(shape);
    if (shape === 'diamond') {
      setSelectedColor(DEFAULT_ROOT_COLOR);
    } else if (selectedColor === DEFAULT_ROOT_COLOR) {
      setSelectedColor(DEFAULT_DOT_COLOR);
    }
  };

  const handleSave = () => {
    saveChord();
    const message = isEditing ? 'Chord updated in your library!' : 'Chord saved to your library!';
    toast.success(message, {
      description: `"${currentChord.symbol}" is now available in the Chord Library.`,
    });
  };

  const handleFingerButton = (value: number | 'T') => {
    if (value === 'T') {
      setSelectedFinger(0);
      setCustomLabel('T');
    } else {
      setSelectedFinger(value as number);
      if (customLabel === 'T') setCustomLabel('');
    }
  };

  const isFingerActive = (value: number | 'T') => {
    if (value === 'T') return customLabel === 'T';
    return selectedFinger === (value as number) && customLabel !== 'T';
  };

  return (
    <div className="stage-gradient min-h-[calc(100vh-58px)]">
      <div className="px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">

          {/* ── Header ── */}
          <div className="mb-6 sm:mb-8">
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[hsl(var(--text-default))]">
              Chord Editor
            </h1>
            <p className="text-sm font-body text-[hsl(var(--text-muted))] mt-1">
              {currentChord.sourceChordId
                ? `Editing: ${currentChord.symbol}`
                : 'Create and customize your own chord diagrams'}
            </p>
          </div>

          {/* ── 3-column grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">

            {/* ── LEFT: Fretboard ── */}
            <div className="lg:col-span-5 space-y-4">

              {/* Fretboard Panel */}
              <div className="rounded-xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--bg-elevated)/0.6)] backdrop-blur-sm p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-display font-semibold uppercase tracking-wider text-[hsl(var(--text-muted))]">
                    Fretboard
                  </h2>
                  <button
                    type="button"
                    onClick={clearFretboard}
                    className="flex items-center gap-1.5 text-xs font-body font-medium text-[hsl(var(--text-muted))] hover:text-[hsl(var(--semantic-error))] hover:bg-[hsl(var(--semantic-error)/0.1)] px-2 py-1 rounded-md transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Clear
                  </button>
                </div>

                <p className="text-xs font-body text-[hsl(var(--text-muted))] mb-4 leading-relaxed">
                  Tap fret to place dot. Tap dot to change finger, delete, or start barre. Drag dots to move. Double-click barre to remove.
                </p>

                <div className="flex justify-center overflow-x-auto">
                  <InteractiveFretboard chord={currentChord} />
                </div>
              </div>

              {/* Fret Settings Panel */}
              <div className="rounded-xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--bg-elevated)/0.6)] backdrop-blur-sm p-4 sm:p-6">
                <h2 className="text-xs font-display font-semibold uppercase tracking-wider text-[hsl(var(--text-muted))] mb-4">
                  Fret Settings
                </h2>

                <div className="grid grid-cols-2 gap-6">
                  {/* Base Fret */}
                  <div>
                    <label className="block text-xs font-body text-[hsl(var(--text-muted))] mb-2">Base Fret</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setBaseFret(currentChord.baseFret - 1)}
                        disabled={currentChord.baseFret <= 1}
                        className="size-8 rounded-md bg-[hsl(var(--bg-surface))] border border-[hsl(var(--border-subtle))] flex items-center justify-center text-[hsl(var(--text-subtle))] hover:bg-[hsl(var(--bg-overlay))] disabled:opacity-30 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-display text-lg font-bold text-[hsl(var(--text-default))] min-w-[2ch] text-center">
                        {currentChord.baseFret}
                      </span>
                      <button
                        type="button"
                        onClick={() => setBaseFret(currentChord.baseFret + 1)}
                        disabled={currentChord.baseFret >= 20}
                        className="size-8 rounded-md bg-[hsl(var(--bg-surface))] border border-[hsl(var(--border-subtle))] flex items-center justify-center text-[hsl(var(--text-subtle))] hover:bg-[hsl(var(--bg-overlay))] disabled:opacity-30 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Visible Frets */}
                  <div>
                    <label className="block text-xs font-body text-[hsl(var(--text-muted))] mb-2">Visible Frets</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setNumFrets(currentChord.numFrets - 1)}
                        disabled={currentChord.numFrets <= 3}
                        className="size-8 rounded-md bg-[hsl(var(--bg-surface))] border border-[hsl(var(--border-subtle))] flex items-center justify-center text-[hsl(var(--text-subtle))] hover:bg-[hsl(var(--bg-overlay))] disabled:opacity-30 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-display text-lg font-bold text-[hsl(var(--text-default))] min-w-[2ch] text-center">
                        {currentChord.numFrets}
                      </span>
                      <button
                        type="button"
                        onClick={() => setNumFrets(currentChord.numFrets + 1)}
                        disabled={currentChord.numFrets >= 7}
                        className="size-8 rounded-md bg-[hsl(var(--bg-surface))] border border-[hsl(var(--border-subtle))] flex items-center justify-center text-[hsl(var(--text-subtle))] hover:bg-[hsl(var(--bg-overlay))] disabled:opacity-30 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Active Barres */}
                {currentChord.barres.length > 0 && (
                  <div className="mt-4">
                    <label className="block text-xs font-body text-[hsl(var(--text-muted))] mb-2">Active Barres</label>
                    <div className="flex flex-wrap gap-1.5">
                      {currentChord.barres.map((barre, idx) => (
                        <span
                          key={idx}
                          className="rounded-md px-2 py-1 text-xs font-body bg-[hsl(var(--bg-surface))] text-[hsl(var(--text-subtle))]"
                        >
                          Fret {barre.fret}: {STRING_NAMES[barre.fromString]}→{STRING_NAMES[barre.toString]}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs font-body text-[hsl(var(--text-muted))] mt-1.5 opacity-60">
                      Double-click a barre on the fretboard to remove it.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ── CENTER: Controls ── */}
            <div className="lg:col-span-4 space-y-4">

              {/* Chord Info Panel */}
              <div className="rounded-xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--bg-elevated)/0.6)] backdrop-blur-sm p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-4 h-4 text-[hsl(var(--text-muted))]" />
                  <h2 className="text-xs font-display font-semibold uppercase tracking-wider text-[hsl(var(--text-muted))]">
                    Chord Info
                  </h2>
                </div>

                <div className="space-y-3">
                  {/* Chord Name */}
                  <div>
                    <label className="block text-xs font-body font-medium text-[hsl(var(--text-subtle))] mb-1">
                      Chord Name *
                    </label>
                    <input
                      type="text"
                      value={currentChord.name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. C Major"
                      className="w-full rounded-lg border border-[hsl(var(--border-default))] bg-[hsl(var(--bg-surface))] px-3 py-2.5 text-sm font-body text-[hsl(var(--text-default))] placeholder:text-[hsl(var(--text-muted)/0.5)] focus:outline-none focus:border-[hsl(var(--color-primary))] focus:ring-1 focus:ring-[hsl(var(--color-primary)/0.3)]"
                    />
                  </div>

                  {/* Symbol */}
                  <div>
                    <label className="block text-xs font-body font-medium text-[hsl(var(--text-subtle))] mb-1">
                      Symbol *
                    </label>
                    <input
                      type="text"
                      value={currentChord.symbol}
                      onChange={e => setSymbol(e.target.value)}
                      placeholder="e.g. C, Am7, Bb+"
                      className="w-full rounded-lg border border-[hsl(var(--border-default))] bg-[hsl(var(--bg-surface))] px-3 py-2.5 text-sm font-body text-[hsl(var(--text-default))] placeholder:text-[hsl(var(--text-muted)/0.5)] focus:outline-none focus:border-[hsl(var(--color-primary))] focus:ring-1 focus:ring-[hsl(var(--color-primary)/0.3)]"
                    />
                  </div>

                  {/* Category & Type */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="flex items-center gap-1 text-xs font-body font-medium text-[hsl(var(--text-subtle))] mb-1">
                        <Tag className="w-3 h-3" />
                        Category
                      </label>
                      <select
                        value={currentChord.chordCategory ?? 'custom'}
                        onChange={e => setChordCategory(e.target.value as ChordCategory)}
                        className="w-full rounded-lg border border-[hsl(var(--border-default))] bg-[hsl(var(--bg-surface))] px-3 py-2.5 text-sm font-body text-[hsl(var(--text-default))] focus:outline-none focus:border-[hsl(var(--color-primary))] focus:ring-1 focus:ring-[hsl(var(--color-primary)/0.3)]"
                      >
                        {EDITABLE_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="flex items-center gap-1 text-xs font-body font-medium text-[hsl(var(--text-subtle))] mb-1">
                        <Tag className="w-3 h-3" />
                        Type
                      </label>
                      <select
                        value={currentChord.chordType ?? 'major'}
                        onChange={e => setChordType(e.target.value as ChordType)}
                        className="w-full rounded-lg border border-[hsl(var(--border-default))] bg-[hsl(var(--bg-surface))] px-3 py-2.5 text-sm font-body text-[hsl(var(--text-default))] focus:outline-none focus:border-[hsl(var(--color-primary))] focus:ring-1 focus:ring-[hsl(var(--color-primary)/0.3)]"
                      >
                        {EDITABLE_TYPES.map(type => (
                          <option key={type} value={type}>{CHORD_TYPE_LABELS[type]}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dot Appearance Panel */}
              <div className="rounded-xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--bg-elevated)/0.6)] backdrop-blur-sm p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Pencil className="w-4 h-4 text-[hsl(var(--text-muted))]" />
                  <h2 className="text-xs font-display font-semibold uppercase tracking-wider text-[hsl(var(--text-muted))]">
                    Dot Appearance
                  </h2>
                </div>

                <p className="text-xs font-body text-[hsl(var(--text-muted))] mb-4">
                  Configure the color, shape, and label for the next dot you place.
                </p>

                <ColorShapePicker
                  selectedColor={selectedColor}
                  selectedShape={selectedShape}
                  onColorChange={setSelectedColor}
                  onShapeChange={handleShapeChange}
                />

                {/* Finger Number */}
                <div className="mt-4">
                  <label className="block text-xs font-display font-semibold uppercase tracking-wider text-[hsl(var(--text-muted))] mb-2">
                    Finger Number
                  </label>
                  <div className="flex items-center gap-1.5">
                    {([1, 2, 3, 4, 'T', 0] as const).map(value => (
                      <button
                        key={String(value)}
                        type="button"
                        onClick={() => handleFingerButton(value)}
                        className={`size-8 rounded-md text-xs font-body font-bold transition-colors ${
                          isFingerActive(value)
                            ? 'bg-[hsl(var(--color-primary))] text-[hsl(var(--bg-base))]'
                            : 'bg-[hsl(var(--bg-surface))] text-[hsl(var(--text-subtle))] hover:bg-[hsl(var(--bg-overlay))]'
                        }`}
                      >
                        {value === 0 ? '–' : String(value)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Fret Label */}
                <div className="mt-4">
                  <label className="block text-xs font-body font-medium text-[hsl(var(--text-subtle))] mb-1">
                    <span className="font-display font-semibold uppercase tracking-wider text-[hsl(var(--text-muted))]">
                      Custom Fret Label
                    </span>{' '}
                    <span className="font-body font-normal text-[hsl(var(--text-muted))] normal-case tracking-normal">(overrides finger #)</span>
                  </label>
                  <input
                    type="text"
                    value={customLabel}
                    onChange={e => setCustomLabel(e.target.value.slice(0, 3))}
                    placeholder="R, T, 3, etc."
                    className="w-24 rounded-lg border border-[hsl(var(--border-default))] bg-[hsl(var(--bg-surface))] px-3 py-2 text-sm font-body text-[hsl(var(--text-default))] placeholder:text-[hsl(var(--text-muted)/0.5)] focus:outline-none focus:border-[hsl(var(--color-primary))] focus:ring-1 focus:ring-[hsl(var(--color-primary)/0.3)]"
                  />
                </div>
              </div>

              {/* Save / Delete Actions */}
              <div className="space-y-2">
                {/* Save Button */}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!canSave}
                  className={`w-full flex items-center justify-center gap-2 rounded-lg py-3 font-display text-base font-bold transition-all ${
                    canSave
                      ? 'bg-[hsl(var(--color-primary))] text-[hsl(var(--bg-base))] glow-primary active:scale-[0.98]'
                      : 'bg-[hsl(var(--bg-surface))] text-[hsl(var(--text-muted))] cursor-not-allowed'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  {isEditing ? 'Update Chord' : 'Save to Library'}
                </button>

                {/* Cancel — Start New */}
                {(isEditing || currentChord.sourceChordId) && (
                  <button
                    type="button"
                    onClick={newChord}
                    className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 font-display text-sm font-semibold border border-[hsl(var(--border-subtle))] text-[hsl(var(--text-subtle))] hover:bg-[hsl(var(--bg-overlay))] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Cancel — Start New
                  </button>
                )}

                {/* Delete from Library */}
                {canDelete && !showDeleteConfirm && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 font-display text-sm font-semibold border border-[hsl(var(--semantic-error)/0.3)] text-[hsl(var(--semantic-error))] hover:bg-[hsl(var(--semantic-error)/0.08)] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete from Library
                  </button>
                )}

                {/* Delete Confirmation */}
                {showDeleteConfirm && (
                  <div className="rounded-lg border border-[hsl(var(--semantic-error)/0.3)] bg-[hsl(var(--semantic-error)/0.06)] p-3">
                    <p className="text-sm font-body text-[hsl(var(--text-subtle))] mb-3">
                      Remove &ldquo;{currentChord.symbol}&rdquo; from the library?
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 py-2 rounded-md text-sm font-body font-medium bg-[hsl(var(--bg-surface))] text-[hsl(var(--text-subtle))] hover:bg-[hsl(var(--bg-overlay))] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          deleteFromLibrary();
                          setShowDeleteConfirm(false);
                          toast.success('Chord removed from library');
                        }}
                        className="flex-1 py-2 rounded-md text-sm font-body font-semibold bg-[hsl(var(--semantic-error))] text-white hover:opacity-90 transition-opacity"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT: Live Preview ── */}
            <div className="lg:col-span-3">
              <div className="rounded-xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--bg-elevated)/0.6)] backdrop-blur-sm p-4 sm:p-6">
                <h2 className="text-xs font-display font-semibold uppercase tracking-wider text-[hsl(var(--text-muted))] mb-4">
                  Live Preview
                </h2>

                <div className="flex flex-col items-center gap-2">
                  {currentChord.symbol && (
                    <div className="font-display text-xl font-bold text-[hsl(var(--color-primary))]">
                      {currentChord.symbol}
                    </div>
                  )}
                  {currentChord.name && (
                    <div className="font-body text-xs text-[hsl(var(--text-muted))]">
                      {currentChord.name}
                    </div>
                  )}

                  <CustomChordDiagram chord={currentChord} size="lg" />

                  {(currentChord.chordCategory || currentChord.chordType) && (
                    <div className="flex flex-wrap gap-1 justify-center mt-1">
                      {currentChord.chordCategory && (
                        <span className="rounded-md bg-[hsl(var(--bg-surface))] px-2 py-0.5 text-[9px] font-body font-medium uppercase tracking-wider text-[hsl(var(--text-muted))]">
                          {CATEGORY_LABELS[currentChord.chordCategory]}
                        </span>
                      )}
                      {currentChord.chordType && (
                        <span className="rounded-md bg-[hsl(var(--bg-surface))] px-2 py-0.5 text-[9px] font-body font-medium uppercase tracking-wider text-[hsl(var(--text-muted))]">
                          {CHORD_TYPE_LABELS[currentChord.chordType]}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
