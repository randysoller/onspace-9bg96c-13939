import { useState, useEffect } from 'react';
import { useCustomChordStore } from '@/stores/customChordStore';
import InteractiveFretboard from '@/components/features/InteractiveFretboard';
import CustomChordDiagram from '@/components/features/CustomChordDiagram';
import ColorShapePicker from '@/components/features/ColorShapePicker';
import { CHORD_TYPE_LABELS, CATEGORY_LABELS } from '@/types/chord';
import type { ChordType, ChordCategory } from '@/types/chord';
import type { DotShape } from '@/types/customChord';
import { DEFAULT_DOT_COLOR, DEFAULT_ROOT_COLOR } from '@/types/customChord';
import {
  Plus, Save, Trash2, RotateCcw, Minus, FileText, Pencil, Tag, Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { isAdmin, ADMIN_USER_IDS } from '@/lib/admin';
import { CHORD_DATABASE } from '@/constants/chords';
import { customToLibraryChord } from '@/types/customChord';
import type { ChordData } from '@/types/chord';

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
  const user = useAuthStore(s => s.user);
  const authLoading = useAuthStore(s => s.loading);

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

  const adminAccess = isAdmin(user?.id);
  const adminSetupMode = ADMIN_USER_IDS.size === 0; // no admins configured yet
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyUserId = () => {
    if (!user?.id) return;
    navigator.clipboard.writeText(user.id).then(() => {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    });
  };

  const canSave =
    currentChord.name.trim() !== '' &&
    currentChord.symbol.trim() !== '' &&
    currentChord.markers.length > 0;

  const canDelete = isEditing || !!currentChord.sourceChordId;

  // ── Export chords.ts download ────────────────────────────────────────────────
  const canExport =
    currentChord.name.trim() !== '' &&
    currentChord.symbol.trim() !== '' &&
    currentChord.markers.length > 0;

  const handleExportChordsTs = () => {
    // Convert the current chord to ChordData format
    const newEntry = customToLibraryChord(currentChord);

    // Serialise a single ChordData entry as a compact object literal
    // matching the style used in src/constants/chords.ts
    const serializeChord = (c: ChordData & Record<string, unknown>): string => {
      const parts: string[] = [];
      parts.push(`id: '${c.id}'`);
      parts.push(`name: '${c.name.replace(/'/g, "\\'")}'`);
      parts.push(`symbol: '${c.symbol.replace(/'/g, "\\'")}'`);
      parts.push(`category: '${c.category}'`);
      parts.push(`type: '${c.type}'`);
      parts.push(`frets: [${(c.frets as number[]).join(', ')}]`);
      parts.push(`fingers: [${(c.fingers as number[]).join(', ')}]`);
      parts.push(`baseFret: ${c.baseFret}`);
      if (c.barres && (c.barres as number[]).length > 0) {
        parts.push(`barres: [${(c.barres as number[]).join(', ')}]`);
      }
      parts.push(`rootNoteString: ${c.rootNoteString}`);
      return `  { ${parts.join(', ')} }`;
    };

    // Build all entries: existing CHORD_DATABASE + new chord
    const allEntries = [
      ...CHORD_DATABASE.map(c => serializeChord(c as ChordData & Record<string, unknown>)),
      serializeChord(newEntry as unknown as ChordData & Record<string, unknown>),
    ];

    const fileContent = [
      `import type { ChordData } from '@/types/chord';`,
      ``,
      `export const CHORD_DATABASE: ChordData[] = [`,
      allEntries.join(',\n'),
      `];`,
      ``,
    ].join('\n');

    // Trigger browser download
    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'chords.ts';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('chords.ts downloaded!', {
      description: `"${currentChord.symbol}" appended. In OnSpace, open Code View → src/constants/chords.ts → replace file contents.`,
      duration: 6000,
    });
  };

  const handleShapeChange = (shape: DotShape) => {
    setSelectedShape(shape);
    if (shape === 'diamond') {
      setSelectedColor(DEFAULT_ROOT_COLOR);
    } else if (selectedColor === DEFAULT_ROOT_COLOR) {
      setSelectedColor(DEFAULT_DOT_COLOR);
    }
  };

  const handleSave = () => {
    console.log(
      `[FretMaster] handleSave() fired`,
      `\n  name: "${currentChord.name}"`,
      `\n  symbol: "${currentChord.symbol}"`,
      `\n  markers: ${currentChord.markers.length}`,
      `\n  isEditing: ${isEditing}`,
      `\n  canSave: ${canSave}`,
      `\n  origin: ${window.location.origin}`
    );
    saveChord();
    // Verify Zustand state updated
    const stored = useCustomChordStore.getState().customChords;
    console.log(
      `[FretMaster] After saveChord(): Zustand has ${stored.length} chord(s):`,
      stored.map(c => c.symbol).join(', ') || '(none)'
    );
    // Verify localStorage
    const lsRaw = localStorage.getItem('fretmaster-custom-chords-v3');
    const lsParsed = lsRaw ? JSON.parse(lsRaw) : null;
    console.log(
      `[FretMaster] localStorage[fretmaster-custom-chords-v3] has ${Array.isArray(lsParsed) ? lsParsed.length : 0} chord(s)`,
      Array.isArray(lsParsed) ? lsParsed.map((c: any) => c.symbol).join(', ') : 'null/invalid'
    );
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

  // ── Admin gate ─────────────────────────────────────────────────────────────
  // Show a locked screen unless the current user is in ADMIN_USER_IDS.
  // Special case: if ADMIN_USER_IDS is still empty (initial setup), show the
  // setup helper so the developer can copy their own user ID in.
  if (!authLoading && !adminAccess) {
    return (
      <div className="stage-gradient min-h-[calc(100vh-58px)] flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--bg-elevated)/0.8)] backdrop-blur-sm p-8 text-center">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-[hsl(var(--semantic-error)/0.12)] flex items-center justify-center">
            <svg className="w-7 h-7 text-[hsl(var(--semantic-error))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="font-display text-xl font-bold text-[hsl(var(--text-default))] mb-2">Admin Only</h2>
          {!user ? (
            <>
              <p className="text-sm text-[hsl(var(--text-muted))] mb-6">
                The Chord Editor is restricted to authorised administrators. Sign in to continue.
              </p>
              <button
                onClick={() => navigate('/auth')}
                className="bg-[hsl(var(--color-primary))] text-[hsl(var(--bg-base))] font-bold px-6 py-2.5 rounded-lg text-sm transition-opacity hover:opacity-90"
              >
                Sign In
              </button>
            </>
          ) : adminSetupMode ? (
            <>
              <p className="text-sm text-[hsl(var(--text-muted))] mb-4">
                No admins configured yet. Add your user ID to <code className="text-[hsl(var(--color-primary))] bg-[hsl(var(--bg-surface))] px-1 py-0.5 rounded text-xs">src/lib/admin.ts</code> to unlock the editor.
              </p>
              <div className="rounded-lg bg-[hsl(var(--bg-surface))] border border-[hsl(var(--border-subtle))] p-3 text-left">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-[10px] font-display uppercase tracking-wider text-[hsl(var(--text-muted))]">Your user ID</p>
                  <button
                    onClick={handleCopyUserId}
                    className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded transition-all ${
                      copiedId
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-[hsl(var(--bg-overlay))] text-[hsl(var(--text-muted))] border border-[hsl(var(--border-subtle))] hover:text-[hsl(var(--color-primary))] hover:border-[hsl(var(--color-primary)/0.4)]'
                    }`}
                    aria-label="Copy user ID to clipboard"
                  >
                    {copiedId ? (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                    {copiedId ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="font-mono text-xs text-[hsl(var(--color-primary))] break-all select-all">{user.id}</p>
              </div>
              <p className="text-xs text-[hsl(var(--text-muted))] mt-3 leading-relaxed">
                Copy the ID above into the <code className="text-xs">ADMIN_USER_IDS</code> set in <code className="text-xs">src/lib/admin.ts</code>, then save the file.
              </p>
            </>
          ) : (
            <p className="text-sm text-[hsl(var(--text-muted))]">
              Your account does not have permission to access the Chord Editor.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="stage-gradient min-h-[calc(100vh-58px)]">
      <div className="px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">

          {/* ── Auth Warning Banner ── */}
          {!authLoading && !user && (
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-400 mb-0.5">Sign in to save chords permanently</p>
                <p className="text-xs text-amber-300/70 leading-relaxed">
                  Without an account, chords only persist in this browser window. They will be lost if you open a different URL or clear your browser data.
                </p>
              </div>
              <button
                onClick={() => navigate('/auth')}
                className="flex-shrink-0 bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold px-3 py-1.5 rounded-md transition-colors"
              >
                Sign In
              </button>
            </div>
          )}

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

                {/* Export chords.ts */}
                <button
                  type="button"
                  onClick={handleExportChordsTs}
                  disabled={!canExport}
                  className={`w-full flex items-center justify-center gap-2 rounded-lg py-2.5 font-display text-sm font-semibold transition-all border ${
                    canExport
                      ? 'border-[hsl(var(--color-primary)/0.4)] text-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-primary)/0.08)]'
                      : 'border-[hsl(var(--border-subtle))] text-[hsl(var(--text-muted))] cursor-not-allowed opacity-40'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  Download chords.ts
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
