import { useEffect, useRef, useState } from 'react';
import { useAudioStore } from '@/stores/audioStore';
import { NOTE_FREQUENCIES } from '@/constants/scales';

export const useScaleAudio = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const { chordVolume } = useAudioStore();
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const playNote = (note: string, octave: number = 4, duration: number = 0.5) => {
    const context = audioContextRef.current;
    if (!context) return;

    const baseFreq = NOTE_FREQUENCIES[note];
    if (!baseFreq) return;

    const frequency = baseFreq * Math.pow(2, octave);

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);

    gainNode.gain.setValueAtTime(0, context.currentTime);
    gainNode.gain.linearRampToValueAtTime(chordVolume, context.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + duration);

    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + duration);
  };

  const playScale = async (rootNote: string, scaleIntervals: number[], bpm: number = 120) => {
    const context = audioContextRef.current;
    if (!context || isPlaying) return;

    setIsPlaying(true);

    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const rootIndex = noteNames.indexOf(rootNote);
    const noteDuration = 60 / bpm; // Duration per note in seconds

    for (let i = 0; i < scaleIntervals.length; i++) {
      const noteIndex = (rootIndex + scaleIntervals[i]) % 12;
      const noteName = noteNames[noteIndex];
      
      playNote(noteName, 4, noteDuration * 0.9);
      await new Promise(resolve => setTimeout(resolve, noteDuration * 1000));
    }

    // Play root note at end
    playNote(rootNote, 5, noteDuration * 1.5);
    await new Promise(resolve => setTimeout(resolve, noteDuration * 1500));

    setIsPlaying(false);
  };

  const stopScale = () => {
    setIsPlaying(false);
  };

  return {
    playNote,
    playScale,
    stopScale,
    isPlaying,
  };
};
