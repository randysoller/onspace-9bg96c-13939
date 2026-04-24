/**
 * homeUIStore — persists Play Now card state across navigation.
 * Uses sessionStorage so state survives back/forward navigation within the tab
 * but resets when the tab is closed.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface HomeUIState {
  isPlayNowOpen: boolean;
  activeVaultIndex: number;
  setIsPlayNowOpen: (open: boolean) => void;
  setActiveVaultIndex: (index: number) => void;
}

export const useHomeUIStore = create<HomeUIState>()(
  persist(
    (set) => ({
      isPlayNowOpen: false,
      activeVaultIndex: 0,
      setIsPlayNowOpen: (open) => set({ isPlayNowOpen: open }),
      setActiveVaultIndex: (index) => set({ activeVaultIndex: index }),
    }),
    {
      name: 'guitar-growth-home-ui',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
