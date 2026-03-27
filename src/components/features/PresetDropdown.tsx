/**
 * PresetDropdown Component — Preset selection, drag-and-drop reorder, delete confirmation
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, ChevronDown, GripVertical, Trash2, X } from 'lucide-react';
import type { ChordPreset } from '@/stores/presetStore';

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
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<{
    draggingIndex: number | null;
    currentOverIndex: number | null;
    pointerStartY: number | null;
    dragOffsetY: number;
    longPressTimer: number | null;
    hasMoved: boolean;
  }>({
    draggingIndex: null,
    currentOverIndex: null,
    pointerStartY: null,
    dragOffsetY: 0,
    longPressTimer: null,
    hasMoved: false,
  });
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  
  const activePreset = presets.find((p) => p.id === activePresetId);
  const isActive = !!activePreset;
  
  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);
  
  // Drag-and-drop handlers
  const handlePointerDown = (e: React.PointerEvent, index: number, isGripHandle: boolean) => {
    e.stopPropagation();
    
    if (!isGripHandle) return; // Only grip handle can initiate drag
    
    const isTouchEvent = e.pointerType === 'touch';
    
    if (isTouchEvent) {
      // Touch: 200ms long-press to activate
      const timer = window.setTimeout(() => {
        if (!dragState.hasMoved) {
          activateDrag(index, e.clientY);
        }
      }, 200);
      
      setDragState((prev) => ({
        ...prev,
        pointerStartY: e.clientY,
        longPressTimer: timer,
        hasMoved: false,
      }));
    } else {
      // Mouse: immediate activation
      activateDrag(index, e.clientY);
    }
  };
  
  const activateDrag = (index: number, clientY: number) => {
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
    
    setDragState((prev) => ({
      ...prev,
      draggingIndex: index,
      currentOverIndex: index,
      pointerStartY: clientY,
      dragOffsetY: 0,
    }));
  };
  
  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragState.longPressTimer && !dragState.hasMoved) {
      const moved = Math.abs(e.clientY - (dragState.pointerStartY ?? 0)) > 8;
      if (moved) {
        // Cancel long-press
        clearTimeout(dragState.longPressTimer);
        setDragState((prev) => ({ ...prev, longPressTimer: null, hasMoved: true }));
      }
    }
    
    if (dragState.draggingIndex === null || !listRef.current) return;
    
    const offsetY = e.clientY - (dragState.pointerStartY ?? 0);
    setDragState((prev) => ({ ...prev, dragOffsetY: offsetY }));
    
    // Calculate current over index
    const listRect = listRef.current.getBoundingClientRect();
    const itemHeight = 48; // py-3 ~ 12px * 2 + 24px content
    const relativeY = e.clientY - listRect.top;
    const overIndex = Math.floor(relativeY / itemHeight);
    const clampedIndex = Math.max(0, Math.min(presets.length - 1, overIndex));
    
    setDragState((prev) => ({ ...prev, currentOverIndex: clampedIndex }));
  };
  
  const handlePointerUp = () => {
    if (dragState.longPressTimer) {
      clearTimeout(dragState.longPressTimer);
    }
    
    const { draggingIndex, currentOverIndex } = dragState;
    
    if (draggingIndex !== null && currentOverIndex !== null && draggingIndex !== currentOverIndex) {
      onReorder(draggingIndex, currentOverIndex);
    }
    
    setDragState({
      draggingIndex: null,
      currentOverIndex: null,
      pointerStartY: null,
      dragOffsetY: 0,
      longPressTimer: null,
      hasMoved: false,
    });
  };
  
  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };
  
  const handleConfirmDelete = () => {
    if (deleteConfirmId) {
      onDelete(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };
  
  const getTranslateY = (index: number) => {
    if (dragState.draggingIndex === null || dragState.currentOverIndex === null) return 0;
    
    if (index === dragState.draggingIndex) {
      return dragState.dragOffsetY;
    }
    
    if (dragState.draggingIndex < dragState.currentOverIndex) {
      // Dragging downward
      if (index > dragState.draggingIndex && index <= dragState.currentOverIndex) {
        return -48;
      }
    } else {
      // Dragging upward
      if (index < dragState.draggingIndex && index >= dragState.currentOverIndex) {
        return 48;
      }
    }
    
    return 0;
  };
  
  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full sm:w-auto flex items-center justify-between gap-2 px-4 py-2.5 rounded-lg border font-body font-medium text-sm transition-all
          ${
            isActive
              ? 'bg-[hsl(var(--color-primary)/0.12)] border-[hsl(var(--color-primary)/0.35)] text-[hsl(var(--color-primary))] shadow-lg shadow-[hsl(var(--color-primary)/0.15)]'
              : isOpen
              ? 'bg-[hsl(var(--bg-elevated))] border-[hsl(var(--color-primary))] text-[hsl(var(--text-default))]'
              : 'bg-[hsl(var(--bg-elevated))] border-[hsl(var(--border-default))] text-[hsl(var(--text-subtle))] hover:bg-[hsl(var(--bg-overlay))]'
          }
        `}
      >
        <div className="flex items-center gap-2">
          <Bookmark className={`size-3.5 ${isActive ? 'fill-current' : ''}`} />
          <span className="uppercase tracking-wide text-xs">
            {activePreset ? activePreset.name : 'EASY START - Presets'}
          </span>
          <span className="flex items-center justify-center size-5 rounded-full bg-[hsl(var(--bg-surface))] text-[hsl(var(--text-muted))] text-[10px] font-bold tabular-nums">
            {presets.length}
          </span>
        </div>
        <ChevronDown
          className={`size-3.5 text-[hsl(var(--text-muted))] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      
      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-2 w-full sm:w-80 rounded-xl border border-[hsl(var(--border-default))] bg-[hsl(var(--bg-elevated))] shadow-2xl shadow-black/50 overflow-hidden z-50 max-h-[50vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-[hsl(var(--border-subtle))] flex items-center justify-between">
              <span className="text-xs font-body font-semibold text-[hsl(var(--text-muted))] uppercase tracking-widest">
                EASY START - Presets
              </span>
              {isActive && (
                <button
                  onClick={onDeactivate}
                  className="text-xs font-body text-[hsl(var(--color-primary))] hover:underline"
                >
                  Clear filter
                </button>
              )}
            </div>
            
            {/* Preset List */}
            {presets.length > 0 ? (
              <div
                ref={listRef}
                className="relative"
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                {presets.map((preset, index) => (
                  <div
                    key={preset.id}
                    className="relative"
                    style={{
                      transform: `translateY(${getTranslateY(index)}px)`,
                      transition:
                        dragState.draggingIndex === index ? 'none' : 'transform 0.2s ease-out',
                      zIndex: dragState.draggingIndex === index ? 10 : 1,
                    }}
                  >
                    <div
                      className={`
                        flex items-center gap-2 px-2 py-3 border-b border-[hsl(var(--border-subtle))]
                        ${dragState.draggingIndex === index ? 'bg-[hsl(var(--color-primary)/0.15)] scale-[1.02] shadow-lg opacity-85' : ''}
                        ${preset.id === activePresetId ? 'bg-[hsl(var(--color-primary)/0.08)]' : ''}
                      `}
                    >
                      {/* Drag handle */}
                      <div
                        className="flex-shrink-0 size-7 flex items-center justify-center cursor-grab active:cursor-grabbing text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text-default))] transition-colors"
                        onPointerDown={(e) => handlePointerDown(e, index, true)}
                      >
                        <GripVertical className="size-4" />
                      </div>
                      
                      {/* Preset info */}
                      <button
                        onClick={() => {
                          onActivate(preset.id);
                          setIsOpen(false);
                        }}
                        className="flex-1 flex items-center gap-2 text-left"
                      >
                        <Bookmark
                          className={`size-3.5 flex-shrink-0 ${
                            preset.id === activePresetId
                              ? 'text-[hsl(var(--color-primary))] fill-current'
                              : 'text-[hsl(var(--text-subtle))]'
                          }`}
                        />
                        <span
                          className={`font-body font-medium text-sm truncate ${
                            preset.id === activePresetId
                              ? 'text-[hsl(var(--color-primary))]'
                              : 'text-[hsl(var(--text-default))]'
                          }`}
                        >
                          {preset.name}
                        </span>
                        <span className="ml-auto flex-shrink-0 text-xs text-[hsl(var(--text-muted))] tabular-nums">
                          {preset.chordIds.length}
                        </span>
                      </button>
                      
                      {/* Delete button */}
                      <button
                        onClick={(e) => handleDeleteClick(e, preset.id)}
                        className="flex-shrink-0 size-7 flex items-center justify-center text-[hsl(var(--text-muted))] hover:text-[hsl(var(--semantic-error))] transition-colors"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Empty state
              <div className="px-4 py-8 text-center">
                <Bookmark className="size-6 mx-auto mb-2 text-[hsl(var(--text-muted))] opacity-50" />
                <p className="text-sm text-[hsl(var(--text-muted))]">No presets yet</p>
                <p className="text-xs text-[hsl(var(--text-subtle))] mt-1">
                  Save presets from the Chord Library
                </p>
              </div>
            )}
            
            {/* Footer hint */}
            <div className="px-4 py-2 border-t border-[hsl(var(--border-subtle))] bg-[hsl(var(--bg-surface))]">
              <p className="text-[10px] text-[hsl(var(--text-muted))] text-center">
                {presets.length > 1
                  ? 'Drag the grip handle to reorder'
                  : 'Save more presets from the Chord Library'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setDeleteConfirmId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              className="relative bg-[hsl(var(--bg-elevated))] border border-[hsl(var(--border-default))] rounded-xl p-6 max-w-[280px] shadow-2xl"
            >
              <h3 className="font-display font-bold text-base text-[hsl(var(--text-default))] mb-2">
                Delete preset?
              </h3>
              <p className="text-sm text-[hsl(var(--text-subtle))] mb-4">
                "{presets.find((p) => p.id === deleteConfirmId)?.name}" will be permanently removed.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 px-4 py-2 rounded-lg bg-[hsl(var(--bg-surface))] text-[hsl(var(--text-default))] font-body font-medium text-sm hover:bg-[hsl(var(--bg-overlay))] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-2 rounded-lg bg-[hsl(var(--semantic-error))] text-white font-body font-bold text-sm hover:bg-[hsl(var(--semantic-error)/0.9)] transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
