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
  isSongbookOpen: boolean;
  activeSongbookIndex: number;
  setIsSongbookOpen: (open: boolean) => void;
  setActiveSongbookIndex: (index: number) => void;
  isSkillBoostOpen: boolean;
  activeSkillBoostIndex: number;
  setIsSkillBoostOpen: (open: boolean) => void;
  setActiveSkillBoostIndex: (index: number) => void;
  isJamInstantlyOpen: boolean;
  activeJamInstantlyIndex: number;
  setIsJamInstantlyOpen: (open: boolean) => void;
  setActiveJamInstantlyIndex: (index: number) => void;
  isLearnGrowOpen: boolean;
  activeLearnGrowIndex: number;
  setIsLearnGrowOpen: (open: boolean) => void;
  setActiveLearnGrowIndex: (index: number) => void;
  isDailyProgressOpen: boolean;
  activeDailyProgressIndex: number;
  setIsDailyProgressOpen: (open: boolean) => void;
  setActiveDailyProgressIndex: (index: number) => void;
  isPickControlOpen: boolean;
  activePickControlIndex: number;
  setIsPickControlOpen: (open: boolean) => void;
  setActivePickControlIndex: (index: number) => void;
}

export const useHomeUIStore = create<HomeUIState>()(
  persist(
    (set) => ({
      isPlayNowOpen: false,
      activeVaultIndex: 0,
      setIsPlayNowOpen: (open) => set({ isPlayNowOpen: open }),
      setActiveVaultIndex: (index) => set({ activeVaultIndex: index }),
      isSongbookOpen: false,
      activeSongbookIndex: 0,
      setIsSongbookOpen: (open) => set({ isSongbookOpen: open }),
      setActiveSongbookIndex: (index) => set({ activeSongbookIndex: index }),
      isSkillBoostOpen: false,
      activeSkillBoostIndex: 0,
      setIsSkillBoostOpen: (open) => set({ isSkillBoostOpen: open }),
      setActiveSkillBoostIndex: (index) => set({ activeSkillBoostIndex: index }),
      isJamInstantlyOpen: false,
      activeJamInstantlyIndex: 0,
      setIsJamInstantlyOpen: (open) => set({ isJamInstantlyOpen: open }),
      setActiveJamInstantlyIndex: (index) => set({ activeJamInstantlyIndex: index }),
      isLearnGrowOpen: false,
      activeLearnGrowIndex: 0,
      setIsLearnGrowOpen: (open) => set({ isLearnGrowOpen: open }),
      setActiveLearnGrowIndex: (index) => set({ activeLearnGrowIndex: index }),
      isDailyProgressOpen: false,
      activeDailyProgressIndex: 0,
      setIsDailyProgressOpen: (open) => set({ isDailyProgressOpen: open }),
      setActiveDailyProgressIndex: (index) => set({ activeDailyProgressIndex: index }),
      isPickControlOpen: false,
      activePickControlIndex: 0,
      setIsPickControlOpen: (open) => set({ isPickControlOpen: open }),
      setActivePickControlIndex: (index) => set({ activePickControlIndex: index }),
    }),
    {
      name: 'guitar-growth-home-ui',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
