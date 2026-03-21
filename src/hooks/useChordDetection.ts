import { useState, useRef, useCallback, useEffect } from 'react';
import type { ChordData } from '@/types/chord';

export type DetectionResult = 'correct' | 'wrong' | null;

export interface AdvancedDetectionSettings {
  noiseGate: number;
  harmonicBoost: number;
  fluxTolerance: number;
}

interface UseChordDetectionOptions {
  onCorrect?: () => void;
  onWrongDetected?: (detectedSymbol: string) => void;
  targetChord?: ChordData | null;
  sensitivity?: number;
  autoStart?: boolean;
  advancedSettings?: AdvancedDetectionSettings | null;
}

export function useChordDetection({
  onCorrect,
  onWrongDetected,
  targetChord,
  sensitivity = 6,
  autoStart = false,
  advancedSettings = null,
}: UseChordDetectionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [result, setResult] = useState<DetectionResult>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopListening = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setIsListening(false);
    setResult(null);
  }, []);

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      streamRef.current = stream;
      setIsListening(true);
      setPermissionDenied(false);
    } catch (error) {
      console.error('Microphone access denied:', error);
      setPermissionDenied(true);
    }
  }, []);

  useEffect(() => {
    if (autoStart) {
      startListening();
    }
    return () => {
      stopListening();
    };
  }, [autoStart, startListening, stopListening]);

  return {
    isListening,
    result,
    permissionDenied,
    startListening,
    stopListening,
  };
}
