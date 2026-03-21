import { useEffect, useRef } from 'react';
import { useAudioStore } from '@/stores/audioStore';

export const useReferenceTone = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const { masterVolume, tunerVolume } = useAudioStore();

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      stopTone();
      audioContextRef.current?.close();
    };
  }, []);

  const playTone = (frequency: number) => {
    if (!audioContextRef.current) return;

    stopTone();

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    const volume = masterVolume * tunerVolume * 0.3;
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();

    oscillatorRef.current = oscillator;
    gainNodeRef.current = gainNode;
  };

  const stopTone = () => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current = null;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }
  };

  return { playTone, stopTone };
};
