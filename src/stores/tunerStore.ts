import { create } from 'zustand';

export type TuningPreset = 'standard' | 'halfStep' | 'dropD' | 'openD' | 'openG' | 'dadgad';

export const TUNING_PRESETS: Record<TuningPreset, { name: string; notes: string[]; freqs: number[] }> = {
  standard: { 
    name: 'Standard', 
    notes: ['E', 'A', 'D', 'G', 'B', 'E'],
    freqs: [82.41, 110.00, 146.83, 196.00, 246.94, 329.63]
  },
  halfStep: { 
    name: 'Half Step Down', 
    notes: ['Eb', 'Ab', 'Db', 'Gb', 'Bb', 'Eb'],
    freqs: [77.78, 103.83, 138.59, 185.00, 233.08, 311.13]
  },
  dropD: { 
    name: 'Drop D', 
    notes: ['D', 'A', 'D', 'G', 'B', 'E'],
    freqs: [73.42, 110.00, 146.83, 196.00, 246.94, 329.63]
  },
  openD: { 
    name: 'Open D', 
    notes: ['D', 'A', 'D', 'F#', 'A', 'D'],
    freqs: [73.42, 110.00, 146.83, 185.00, 220.00, 293.66]
  },
  openG: { 
    name: 'Open G', 
    notes: ['D', 'G', 'D', 'G', 'B', 'D'],
    freqs: [73.42, 98.00, 146.83, 196.00, 246.94, 293.66]
  },
  dadgad: { 
    name: 'DADGAD', 
    notes: ['D', 'A', 'D', 'G', 'A', 'D'],
    freqs: [73.42, 110.00, 146.83, 196.00, 220.00, 293.66]
  },
};

interface TunerStore {
  isActive: boolean;
  currentNote: string;
  currentFrequency: number;
  centOffset: number;
  tuning: TuningPreset;
  targetString: number;
  calibrationHz: number; // A4 reference frequency (default 440)
  isCalibrating: boolean; // Calibration mode flag
  calibrationDetections: number[]; // Store multiple detections for averaging
  
  setIsActive: (active: boolean) => void;
  setCurrentNote: (note: string) => void;
  setCurrentFrequency: (freq: number) => void;
  setCentOffset: (offset: number) => void;
  setTuning: (tuning: TuningPreset) => void;
  setTargetString: (stringNum: number) => void;
  setCalibrationHz: (hz: number) => void;
  setIsCalibrating: (calibrating: boolean) => void;
  addCalibrationDetection: (freq: number) => void;
  resetCalibration: () => void;
  clearCalibrationDetections: () => void;
}

export const useTunerStore = create<TunerStore>((set) => ({
  isActive: false,
  currentNote: '',
  currentFrequency: 0,
  centOffset: 0,
  tuning: 'standard',
  targetString: 0,
  calibrationHz: 440, // Default A440
  isCalibrating: false,
  calibrationDetections: [],
  
  setIsActive: (active) => set({ isActive: active }),
  setCurrentNote: (note) => set({ currentNote: note }),
  setCurrentFrequency: (freq) => set({ currentFrequency: freq }),
  setCentOffset: (offset) => set({ centOffset: offset }),
  setTuning: (tuning) => set({ tuning }),
  setTargetString: (stringNum) => set({ targetString: stringNum }),
  setCalibrationHz: (hz) => set({ calibrationHz: hz }),
  setIsCalibrating: (calibrating) => set({ isCalibrating: calibrating, calibrationDetections: calibrating ? [] : [] }),
  addCalibrationDetection: (freq) => set((state) => ({
    calibrationDetections: [...state.calibrationDetections, freq].slice(-10) // Keep last 10
  })),
  resetCalibration: () => set({ calibrationHz: 440, calibrationDetections: [], isCalibrating: false }),
  clearCalibrationDetections: () => set({ calibrationDetections: [] }),
}));
