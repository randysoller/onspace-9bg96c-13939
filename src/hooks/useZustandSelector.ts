/**
 * Custom hook for creating optimized Zustand selectors
 * Prevents unnecessary re-renders with shallow comparison
 * 
 * @example
 * ```ts
 * // Instead of:
 * const { currentChord, targetChord } = usePracticeStore();
 * 
 * // Use:
 * const { currentChord, targetChord } = useShallowPracticeStore(
 *   state => ({ currentChord: state.currentChord, targetChord: state.targetChord })
 * );
 * ```
 */

import { useRef } from 'react';
import { shallow } from 'zustand/shallow';
import type { StoreApi, UseBoundStore } from 'zustand';

/**
 * Shallow equality comparison for object properties
 * @param objA - First object
 * @param objB - Second object
 * @returns True if objects are shallow equal
 */
export function shallowEqual(objA: any, objB: any): boolean {
  if (Object.is(objA, objB)) return true;
  
  if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
    return false;
  }
  
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  
  if (keysA.length !== keysB.length) return false;
  
  for (let i = 0; i < keysA.length; i++) {
    if (!Object.prototype.hasOwnProperty.call(objB, keysA[i]) || !Object.is(objA[keysA[i]], objB[keysA[i]])) {
      return false;
    }
  }
  
  return true;
}

/**
 * Create selector hook with shallow comparison
 * Prevents re-renders when selected values haven't changed
 * 
 * @param useStore - Zustand store hook
 * @returns Hook function that accepts selector and returns selected value
 */
export function createShallowSelector<T extends UseBoundStore<StoreApi<any>>>(useStore: T) {
  return function useShallowSelector<U>(selector: (state: ReturnType<T>) => U): U {
    const prevRef = useRef<U>();
    
    const selected = useStore((state) => {
      const next = selector(state);
      
      if (prevRef.current === undefined || !shallowEqual(prevRef.current, next)) {
        prevRef.current = next;
      }
      
      return prevRef.current as U;
    });
    
    return selected;
  };
}

/**
 * Create selector hook with custom equality function
 * 
 * @param useStore - Zustand store hook
 * @param equalityFn - Custom equality comparison function
 * @returns Hook function that accepts selector
 */
export function createCustomSelector<T extends UseBoundStore<StoreApi<any>>>(
  useStore: T,
  equalityFn: (a: any, b: any) => boolean = Object.is
) {
  return function useCustomSelector<U>(selector: (state: ReturnType<T>) => U): U {
    return useStore(selector, equalityFn);
  };
}
