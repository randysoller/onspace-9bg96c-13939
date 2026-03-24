/**
 * History management hook for undo/redo functionality
 * Tracks state changes with a configurable history limit
 * 
 * @example
 * ```tsx
 * const { state, setState, undo, redo, canUndo, canRedo, clear } = useHistory({
 *   markers: [],
 *   barres: [],
 * }, 50);
 * ```
 */

import { useState, useCallback, useRef } from 'react';

interface UseHistoryOptions<T> {
  limit?: number;
  initialState: T;
}

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

/**
 * Hook for managing undo/redo history
 * @param initialState - Initial state value
 * @param limit - Maximum number of history items (default: 50)
 * @returns History controls and current state
 */
export function useHistory<T>(
  initialState: T,
  limit: number = 50
) {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  const lastStateRef = useRef<T>(initialState);

  /**
   * Set new state and add current state to history
   */
  const setState = useCallback((newState: T | ((prev: T) => T)) => {
    setHistory(({ past, present, future }) => {
      const nextState = typeof newState === 'function' 
        ? (newState as (prev: T) => T)(present)
        : newState;

      // Don't add to history if state hasn't actually changed
      if (JSON.stringify(nextState) === JSON.stringify(present)) {
        return { past, present, future };
      }

      const newPast = [...past, present];
      
      // Limit history size
      if (newPast.length > limit) {
        newPast.shift();
      }

      lastStateRef.current = nextState;

      return {
        past: newPast,
        present: nextState,
        future: [], // Clear future when new state is set
      };
    });
  }, [limit]);

  /**
   * Undo last action
   */
  const undo = useCallback(() => {
    setHistory(({ past, present, future }) => {
      if (past.length === 0) return { past, present, future };

      const previous = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);
      const newFuture = [present, ...future];

      lastStateRef.current = previous;

      return {
        past: newPast,
        present: previous,
        future: newFuture,
      };
    });
  }, []);

  /**
   * Redo last undone action
   */
  const redo = useCallback(() => {
    setHistory(({ past, present, future }) => {
      if (future.length === 0) return { past, present, future };

      const next = future[0];
      const newFuture = future.slice(1);
      const newPast = [...past, present];

      lastStateRef.current = next;

      return {
        past: newPast,
        present: next,
        future: newFuture,
      };
    });
  }, []);

  /**
   * Clear all history
   */
  const clear = useCallback((newState?: T) => {
    const resetState = newState || history.present;
    setHistory({
      past: [],
      present: resetState,
      future: [],
    });
    lastStateRef.current = resetState;
  }, [history.present]);

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    setHistory({
      past: [],
      present: initialState,
      future: [],
    });
    lastStateRef.current = initialState;
  }, [initialState]);

  return {
    state: history.present,
    setState,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    clear,
    reset,
    historySize: history.past.length,
  };
}
