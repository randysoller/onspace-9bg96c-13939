// Audio-related type definitions

export interface AudioContextState {
  context: AudioContext | null;
  isInitialized: boolean;
}

export interface MetronomeAudioConfig {
  bpm: number;
  volume: number;
  soundType: string;
  subdivision: string;
}

export interface VoiceSynthesisConfig {
  isMobile: boolean;
  onLatencyUpdate?: (latency: number) => void;
}

export interface VoiceSynthesisResult {
  speakNumber: (beatNumber: number, audioContext: AudioContext, currentTime: number) => void;
  isCalibrated: boolean;
  currentLatency: number;
}

export interface SoundGeneratorFunction {
  (context: AudioContext, isAccent: boolean, volume: number, now: number): void;
}

export interface PitchDetectionResult {
  frequency: number;
  note: string;
  cents: number;
  confidence: number;
}

export interface AudioError {
  code: string;
  message: string;
  timestamp: number;
}
