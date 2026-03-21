import { useEffect, useRef } from 'react';
import { useAudioStore } from '@/stores/audioStore';
import { ChordData } from '@/types/chord';

const NOTE_FREQUENCIES: Record<string, number> = {
  'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
  'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00,
  'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94, 'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13,
  'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
};

const STANDARD_TUNING = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'];

export const useChordAudio = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const { masterVolume, chordVolume } = useAudioStore();

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const playChord = (chord: ChordData) => {
    if (!audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    const volume = masterVolume * chordVolume * 0.15;

    chord.frets.forEach((fret, stringIndex) => {
      if (fret === null || fret === -1) return;

      const openString = STANDARD_TUNING[stringIndex];
      const baseFreq = NOTE_FREQUENCIES[openString];
      if (!baseFreq) return;

      const frequency = baseFreq * Math.pow(2, fret / 12);

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, now);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 2);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(now);
      oscillator.stop(now + 2);
    });
  };

  return { playChord };
};
