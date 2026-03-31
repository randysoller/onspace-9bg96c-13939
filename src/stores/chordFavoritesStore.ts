/**
 * Chord Favorites Store
 * Persists favorited chord IDs (Set<string>) to localStorage via Zustand persist.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ChordFavoritesStore {
  favoriteIds: Set<string>;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

export const useChordFavoritesStore = create<ChordFavoritesStore>()(
  persist(
    (set, get) => ({
      favoriteIds: new Set<string>(),

      toggleFavorite: (id) =>
        set((state) => {
          const favoriteIds = new Set(state.favoriteIds);
          if (favoriteIds.has(id)) {
            favoriteIds.delete(id);
          } else {
            favoriteIds.add(id);
          }
          return { favoriteIds };
        }),

      isFavorite: (id) => get().favoriteIds.has(id),
    }),
    {
      name: 'fretmaster-chord-favorites',
      partialize: (state) => ({ favoriteIds: Array.from(state.favoriteIds) }),
      merge: (persisted: any, current) => ({
        ...current,
        favoriteIds: new Set<string>(persisted?.favoriteIds ?? []),
      }),
    }
  )
);
