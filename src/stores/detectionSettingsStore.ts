/**
 * Detection Settings Store - Sensitivity and advanced parameter overrides
 * Persists to localStorage
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AdvancedDetectionSettings {
  noiseGate: number;       // 0-100
  harmonicBoost: number;   // 0-100
  fluxTolerance: number;   // 0-100
}

interface CalibrationProfile {
  id: string;
  name: string;
  settings: AdvancedDetectionSettings;
  createdAt: number;
}

interface DetectionSettingsState {
  sensitivity: number;                    // 1-10
  advancedEnabled: boolean;
  advancedValues: AdvancedDetectionSettings;
  
  setSensitivity: (value: number) => void;
  setAdvancedEnabled: (enabled: boolean) => void;
  setAdvancedValues: (values: AdvancedDetectionSettings) => void;
  resetAdvancedValues: () => void;
  applyCalibrationProfile: (profile: CalibrationProfile) => void;
}

const DEFAULT_ADVANCED: AdvancedDetectionSettings = {
  noiseGate: 50,
  harmonicBoost: 50,
  fluxTolerance: 50,
};

export const useDetectionSettingsStore = create<DetectionSettingsState>()(
  persist(
    (set) => ({
      sensitivity: 6,
      advancedEnabled: false,
      advancedValues: DEFAULT_ADVANCED,
      
      setSensitivity: (value) => set({ sensitivity: Math.max(1, Math.min(10, value)) }),
      
      setAdvancedEnabled: (enabled) => set({ advancedEnabled: enabled }),
      
      setAdvancedValues: (values) => set({ advancedValues: values }),
      
      resetAdvancedValues: () => set({ advancedValues: DEFAULT_ADVANCED }),
      
      applyCalibrationProfile: (profile) => set({
        advancedEnabled: true,
        advancedValues: profile.settings,
      }),
    }),
    {
      name: 'fretmaster-detection-settings',
      version: 1,
    }
  )
);
