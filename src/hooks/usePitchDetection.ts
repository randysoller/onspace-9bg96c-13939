import { useState, useRef, useCallback, useEffect } from 'react';

export interface PitchDetectionResult {
  frequency: number;
  noteName: string;
  cents: number;
  octave: number;
}

interface UsePitchDetectionOptions {
  sensitivity?: number;
  autoStart?: boolean;
  onPitchDetected?: (result: PitchDetectionResult) => void;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// NSDF (Normalized Square Difference Function) for pitch detection
function detectPitch(buffer: Float32Array, sampleRate: number): number | null {
  const SIZE = buffer.length;
  const MAX_SAMPLES = Math.floor(SIZE / 2);
  const nsdf = new Float32Array(MAX_SAMPLES);
  
  // Calculate NSDF
  for (let tau = 0; tau < MAX_SAMPLES; tau++) {
    let acf = 0;
    let divisorM = 0;
    
    for (let i = 0; i < MAX_SAMPLES; i++) {
      acf += buffer[i] * buffer[i + tau];
      divisorM += buffer[i] * buffer[i] + buffer[i + tau] * buffer[i + tau];
    }
    
    nsdf[tau] = divisorM > 0 ? (2 * acf) / divisorM : 0;
  }
  
  // Find peaks in NSDF
  const peaks: number[] = [];
  let prevValue = nsdf[0];
  
  for (let i = 1; i < nsdf.length - 1; i++) {
    const currentValue = nsdf[i];
    const nextValue = nsdf[i + 1];
    
    if (currentValue > prevValue && currentValue > nextValue && currentValue > 0) {
      peaks.push(i);
    }
    
    prevValue = currentValue;
  }
  
  // FIXED: Lower threshold for better desktop detection
  // Old value 0.1 was too high and prevented detection on some systems
  let bestPeak = -1;
  let bestValue = 0.05; // Lowered threshold from 0.1 to 0.05
  
  for (const peak of peaks) {
    if (nsdf[peak] > bestValue) {
      bestValue = nsdf[peak];
      bestPeak = peak;
    }
  }
  
  if (bestPeak === -1) return null;
  
  // Parabolic interpolation for better accuracy
  const y1 = nsdf[bestPeak - 1];
  const y2 = nsdf[bestPeak];
  const y3 = nsdf[bestPeak + 1];
  const betterPeak = bestPeak + (y3 - y1) / (2 * (2 * y2 - y1 - y3));
  
  return sampleRate / betterPeak;
}

function getNoteInfo(frequency: number): { noteName: string; cents: number; octave: number } {
  const A4 = 440;
  const C0 = A4 * Math.pow(2, -4.75);
  
  // Calculate semitones from C0
  const halfSteps = 12 * Math.log2(frequency / C0);
  const roundedHalfSteps = Math.round(halfSteps);
  
  // Calculate octave and note
  const octave = Math.floor(roundedHalfSteps / 12);
  const noteIndex = roundedHalfSteps % 12;
  const noteName = NOTE_NAMES[noteIndex];
  
  // Calculate cents offset (how far from the nearest note)
  const cents = Math.round((halfSteps - roundedHalfSteps) * 100);
  
  return { noteName, cents, octave };
}

export function usePitchDetection({
  sensitivity = 6,
  autoStart = false,
  onPitchDetected,
}: UsePitchDetectionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [currentPitch, setCurrentPitch] = useState<PitchDetectionResult | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current || !audioContextRef.current) {
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
      return;
    }

    const analyser = analyserRef.current;
    const bufferLength = analyser.fftSize;
    const buffer = new Float32Array(bufferLength);
    
    analyser.getFloatTimeDomainData(buffer);
    
    // Calculate signal amplitude
    const maxAmplitude = Math.max(...buffer.map(Math.abs));
    
    // FIXED: More permissive noise gate for desktop microphones
    // Lower sensitivity value = higher threshold, more noise filtering
    const noiseGate = Math.max(0.005, 0.03 - (sensitivity * 0.003));
    
    if (maxAmplitude < noiseGate) {
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
      return;
    }
    
    // Detect pitch
    const frequency = detectPitch(buffer, audioContextRef.current.sampleRate);
    
    // FIXED: Wider frequency range for guitar (82Hz E2 to 1319Hz E6)
    if (frequency && frequency > 60 && frequency < 1400) {
      const noteInfo = getNoteInfo(frequency);
      const result: PitchDetectionResult = {
        frequency,
        noteName: noteInfo.noteName,
        cents: noteInfo.cents,
        octave: noteInfo.octave,
      };
      
      setCurrentPitch(result);
      
      if (onPitchDetected) {
        onPitchDetected(result);
      }
    } else {
      setCurrentPitch(null);
    }
    
    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
  }, [sensitivity, onPitchDetected]);

  const stopListening = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
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
    setCurrentPitch(null);
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
      
      // CRITICAL FIX: Resume AudioContext if suspended (common on desktop Chrome/Firefox)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0.8;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      streamRef.current = stream;
      setIsListening(true);
      setPermissionDenied(false);
      
      console.log('🎤 Microphone initialized:', {
        sampleRate: audioContext.sampleRate,
        state: audioContext.state,
        fftSize: analyser.fftSize,
      });
      
      // Start analysis loop
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    } catch (error) {
      console.error('❌ Microphone access denied:', error);
      setPermissionDenied(true);
    }
  }, [analyzeAudio]);

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
    currentPitch,
    permissionDenied,
    startListening,
    stopListening,
  };
}
