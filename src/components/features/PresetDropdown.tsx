import { useState, useRef, useEffect } from 'react';
import { Bookmark, ChevronDown, Trash2, GripVertical, X } from 'lucide-react';
import { ChordPreset } from '@/stores/presetStore';

interface PresetDropdownProps {
  presets: ChordPreset[];
  activePresetId: string | null;
  onActivate: (id: string) => void;
  onDeactivate: () => void;
  onDelete: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

export default function PresetDropdown({
  presets,
  activePresetId,
  onActivate,
  onDeactivate,
  onDelete,
  onReorder,
}: PresetDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Drag state
  const dragState = useRef<{
    draggingIndex: number | null;
    startY: number;
    currentY: number;
    offsetY: number;
    startTime: number;
    touchId: number | null;
    activated: boolean;
  }>({
    draggingIndex: null,
    startY: 0,
    currentY: 0,
    offsetY: 0,
    startTime: 0,
    touchId: null,
    activated: false,
  });

  const [dragVisual, setDragVisual] = useState<{ from: number; over: number } | null>(null);

  // Outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }
  }, [isOpen]);

  const activePreset = presets.find((p) => p.id === activePresetId);

  const handleToggle = (id: string) => {
    if (activePresetId === id) {
      onDeactivate();
    } else {
      onActivate(id);
    }
    setIsOpen(false);
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm(id);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      onDelete(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  // Drag handlers
  const handlePointerDown = (e: React.PointerEvent, index: number) => {
    const isMouse = e.pointerType === 'mouse';
    const rect = dropdownRef.current?.getBoundingClientRect();
    if (!rect) return;

    dragState.current = {
      draggingIndex: index,
      startY: e.clientY,
      currentY: e.clientY,
      offsetY: 0,
      startTime: Date.now(),
      touchId: e.pointerId,
      activated: isMouse,
    };

    if (isMouse) {
      setDragVisual({ from: index, over: index });
      if (navigator.vibrate) navigator.vibrate(30);
    } else {
      // Touch: activate after 200ms if no vertical scroll
      setTimeout(() => {
        const state = dragState.current;
        if (state.draggingIndex === index && !state.activated) {
          const dy = Math.abs(state.currentY - state.startY);
          if (dy < 8) {
            state.activated = true;
            setDragVisual({ from: index, over: index });
            if (navigator.vibrate) navigator.vibrate(30);
          }
        }
      }, 200);
    }

    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const state = dragState.current;
    if (state.draggingIndex === null) return;

    state.currentY = e.clientY;
    const dy = state.currentY - state.startY;

    // Cancel touch drag if vertical scroll before activation
    if (!state.activated && Math.abs(dy) > 10) {
      dragState.current.draggingIndex = null;
      return;
    }

    if (state.activated) {
      state.offsetY = dy;
      const itemHeight = 48;
      const overIndex = state.draggingIndex + Math.round(dy / itemHeight);
      const clampedOver = Math.max(0, Math.min(presets.length - 1, overIndex));
      setDragVisual({ from: state.draggingIndex, over: clampedOver });
    }
  };

  const handlePointerUp = () => {
    const state = dragState.current;
    if (state.draggingIndex !== null && state.activated && dragVisual) {
      if (dragVisual.from !== dragVisual.over) {
        onReorder(dragVisual.from, dragVisual.over);
      }
    }
    dragState.current.draggingIndex = null;
    dragState.current.activated = false;
    setDragVisual(null);
  };

  const getTransform = (index: number): string => {
    if (!dragVisual) return 'translateY(0)';
    if (index === dragVisual.from) {
      return `translateY(${dragState.current.offsetY}px)`;
    }
    if (dragVisual.from < dragVisual.over && index > dragVisual.from && index <= dragVisual.over) {
      return 'translateY(-48px)';
    }
    if (dragVisual.from > dragVisual.over && index < dragVisual.from && index >= dragVisual.over) {
      return 'translateY(48px)';
    }
    return 'translateY(0)';
  };

  const getVisualClass = (index: number): string => {
    if (!dragVisual || index !== dragVisual.from) return '';
    return 'bg-[hsl(var(--color-primary)/0.15)] scale-[1.02] shadow-lg opacity-85';
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full sm:w-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl
          border-2 transition-all
          ${
            activePresetId
              ? 'border-[hsl(var(--color-primary)/0.4)] bg-[hsl(var(--color-primary)/0.08)] shadow-lg shadow-[hsl(var(--color-primary)/0.15)]'
              : 'border-[hsl(var(--border-default))] bg-[hsl(var(--bg-elevated))] hover:bg-[hsl(var(--bg-overlay))]'
          }
        `}
      >
        <div className="flex items-center gap-2.5">
          <Bookmark
            className={`size-4 ${
              activePresetId ? 'text-[hsl(var(--color-primary))] fill-current' : 'text-[hsl(var(--text-muted))]'
            }`}
          />
          <span className="text-sm font-display font-semibold text-[hsl(var(--text-default))]">
            {activePreset ? activePreset.name : 'EASY START - Presets'}
          </span>
          {activePreset && (
            <span className="px-2 py-0.5 bg-[hsl(var(--color-primary)/0.2)] text-[hsl(var(--color-primary))] text-[10px] font-bold rounded">
              {activePreset.chordIds.length}
            </span>
          )}
        </div>
        <ChevronDown className={`size-4 text-[hsl(var(--text-subtle))] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-full sm:w-80 bg-[hsl(var(--bg-elevated))] border border-[hsl(var(--border-default))] rounded-xl shadow-2xl overflow-hidden z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[hsl(var(--border-subtle))] flex items-center justify-between">
            <div className="text-xs font-display font-bold text-[hsl(var(--text-subtle))] uppercase tracking-wide">
              EASY START - Presets
            </div>
            {activePresetId && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeactivate();
                  setIsOpen(false);
                }}
                className="text-xs text-[hsl(var(--color-primary))] hover:text-[hsl(var(--color-emphasis))] font-semibold"
              >
                Clear filter
              </button>
            )}
          </div>

          {/* Preset list */}
          {presets.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bookmark className="size-10 mx-auto mb-3 text-[hsl(var(--text-muted))] opacity-40" />
              <div className="text-sm font-medium text-[hsl(var(--text-subtle))] mb-1">No presets yet</div>
              <div className="text-xs text-[hsl(var(--text-muted))]">
                Save chord selections from the library to create your first preset
              </div>
            </div>
          ) : (
            <div className="max-h-[50vh] overflow-y-auto">
              {presets.map((preset, index) => (
                <div
                  key={preset.id}
                  onPointerDown={(e) => handlePointerDown(e, index)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  style={{
                    transform: getTransform(index),
                    transition: dragVisual?.from === index ? 'none' : 'transform 0.2s ease-out',
                  }}
                  className={`
                    flex items-center gap-3 px-3 py-3 border-b border-[hsl(var(--border-subtle))] last:border-0
                    cursor-pointer hover:bg-[hsl(var(--bg-overlay))] transition-colors
                    ${getVisualClass(index)}
                  `}
                  onClick={() => handleToggle(preset.id)}
                >
                  <div className="touch-none cursor-grab active:cursor-grabbing text-[hsl(var(--text-muted))]">
                    <GripVertical className="size-4" />
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Bookmark
                      className={`size-3.5 ${
                        activePresetId === preset.id
                          ? 'text-[hsl(var(--color-primary))] fill-current'
                          : 'text-[hsl(var(--text-muted))]'
                      }`}
                    />
                    <span className="text-sm font-medium text-[hsl(var(--text-default))] truncate">{preset.name}</span>
                    <span className="px-1.5 py-0.5 bg-[hsl(var(--bg-surface))] text-[hsl(var(--text-muted))] text-[10px] font-bold rounded">
                      {preset.chordIds.length}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteClick(preset.id, e)}
                    className="p-1.5 hover:bg-[hsl(var(--semantic-error)/0.1)] rounded transition-colors"
                  >
                    <Trash2 className="size-3.5 text-[hsl(var(--text-muted))] hover:text-[hsl(var(--semantic-error))]" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Footer hint */}
          <div className="px-4 py-2.5 border-t border-[hsl(var(--border-subtle))] text-[10px] text-[hsl(var(--text-muted))]">
            {presets.length > 0 ? (
              <>Drag the grip handle to reorder</>
            ) : (
              <>Save more presets from the Chord Library</>
            )}
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center px-4">
          <div className="bg-[hsl(var(--bg-elevated))] border border-[hsl(var(--border-default))] rounded-2xl p-6 max-w-[280px] shadow-2xl">
            <div className="text-lg font-display font-bold text-[hsl(var(--text-default))] mb-2">Delete Preset</div>
            <div className="text-sm text-[hsl(var(--text-subtle))] mb-6">
              Are you sure you want to delete "<strong>{presets.find((p) => p.id === deleteConfirm)?.name}</strong>"?
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-[hsl(var(--bg-surface))] hover:bg-[hsl(var(--bg-overlay))] text-[hsl(var(--text-default))] font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 rounded-lg bg-[hsl(var(--semantic-error))] hover:bg-[hsl(var(--semantic-error)/0.9)] text-white font-semibold transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
