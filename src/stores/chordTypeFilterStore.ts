/**
 * Zustand store for chord type filtering preferences
 * Controls which chord categories are used in detection
 */

import { create } from 'zustand';
import type { ChordTemplate } from '@/lib/audio/chord-templates';

export type ChordCategory = ChordTemplate['category'];

export type FilterPreset = 'beginner' | 'intermediate' | 'advanced' | 'jazz' | 'custom';

export interface ChordTypeFilterState {
  // Active categories
  allowedCategories: Set<ChordCategory>;
  
  // Current preset
  activePreset: FilterPreset;
  
  // Actions
  setAllowedCategories: (categories: Set<ChordCategory>) => void;
  toggleCategory: (category: ChordCategory) => void;
  setPreset: (preset: FilterPreset) => void;
  resetToAll: () => void;
}

/**
 * Preset configurations
 */
export const FILTER_PRESETS: Record<FilterPreset, Set<ChordCategory>> = {
  beginner: new Set<ChordCategory>(['major', 'minor']),
  intermediate: new Set<ChordCategory>(['major', 'minor', 'dominant']),
  advanced: new Set<ChordCategory>(['major', 'minor', 'dominant', 'diminished', 'augmented']),
  jazz: new Set<ChordCategory>(['dominant', 'diminished', 'extended']),
  custom: new Set<ChordCategory>(['major', 'minor', 'dominant', 'diminished', 'augmented', 'extended']),
};

/**
 * Load saved preferences from localStorage
 */
function loadSavedPreferences(): {
  categories: Set<ChordCategory>;
  preset: FilterPreset;
} {
  try {
    const saved = localStorage.getItem('chordTypeFilter');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        categories: new Set(parsed.categories || []),
        preset: parsed.preset || 'custom',
      };
    }
  } catch (error) {
    console.error('Failed to load chord filter preferences:', error);
  }
  
  // Default: all categories enabled
  return {
    categories: new Set<ChordCategory>(['major', 'minor', 'dominant', 'diminished', 'augmented', 'extended']),
    preset: 'custom',
  };
}

/**
 * Save preferences to localStorage
 */
function savePreferences(categories: Set<ChordCategory>, preset: FilterPreset) {
  try {
    localStorage.setItem('chordTypeFilter', JSON.stringify({
      categories: Array.from(categories),
      preset,
    }));
  } catch (error) {
    console.error('Failed to save chord filter preferences:', error);
  }
}

/**
 * Chord type filter store
 */
export const useChordTypeFilterStore = create<ChordTypeFilterState>((set, get) => {
  const { categories, preset } = loadSavedPreferences();
  
  return {
    allowedCategories: categories,
    activePreset: preset,
    
    setAllowedCategories: (categories) => {
      set({ allowedCategories: categories, activePreset: 'custom' });
      savePreferences(categories, 'custom');
    },
    
    toggleCategory: (category) => {
      const current = get().allowedCategories;
      const updated = new Set(current);
      
      if (updated.has(category)) {
        updated.delete(category);
      } else {
        updated.add(category);
      }
      
      set({ allowedCategories: updated, activePreset: 'custom' });
      savePreferences(updated, 'custom');
    },
    
    setPreset: (preset) => {
      const categories = FILTER_PRESETS[preset];
      set({ allowedCategories: new Set(categories), activePreset: preset });
      savePreferences(categories, preset);
    },
    
    resetToAll: () => {
      const allCategories = new Set<ChordCategory>([
        'major', 'minor', 'dominant', 'diminished', 'augmented', 'extended'
      ]);
      set({ allowedCategories: allCategories, activePreset: 'custom' });
      savePreferences(allCategories, 'custom');
    },
  };
});
