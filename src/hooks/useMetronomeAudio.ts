import { useEffect, useRef, useCallback } from 'react';
import { useMetronomeStore } from '@/stores/metronomeStore';
import { useAudioStore } from '@/stores/audioStore';

export const useMetronomeAudio = () => {
  const { 
    isPlaying, 
    bpm, 
    beatsPerMeasure, 
    currentBeat, 
    soundType, 
    accentFirstBeat,
    incrementBeat,
    setCurrentBeat,
  } = useMetronomeStore();
  
  const { masterVolume, metronomeVolume } = useAudioStore();
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);
  const nextBeatTimeRef = useRef<number>(0);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      audioContextRef.current?.close();
    };
  }, []);

  const playClick = useCallback((isAccent: boolean = false) => {
    const context = audioContextRef.current;
    if (!context) return;

    const now = context.currentTime;
    const volume = masterVolume * metronomeVolume * (isAccent ? 0.8 : 0.5);

    switch (soundType) {
      case 'click': {
        // Classic metronome click using oscillator
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        oscillator.frequency.setValueAtTime(isAccent ? 1000 : 800, now);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(volume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        oscillator.start(now);
        oscillator.stop(now + 0.05);
        break;
      }

      case 'woodBlock': {
        // Wood block sound using noise and filtering
        const bufferSize = context.sampleRate * 0.05;
        const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
        const data = buffer.getChannelData(0);

        // Generate noise
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = context.createBufferSource();
        const filter = context.createBiquadFilter();
        const gainNode = context.createGain();

        noise.buffer = buffer;
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(isAccent ? 400 : 350, now);
        filter.Q.setValueAtTime(10, now);

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(context.destination);

        gainNode.gain.setValueAtTime(volume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        noise.start(now);
        noise.stop(now + 0.05);
        break;
      }

      case 'hiHat': {
        // Hi-hat sound using filtered noise
        const bufferSize = context.sampleRate * 0.08;
        const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = context.createBufferSource();
        const filter = context.createBiquadFilter();
        const gainNode = context.createGain();

        noise.buffer = buffer;
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(isAccent ? 7000 : 6000, now);

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(context.destination);

        gainNode.gain.setValueAtTime(volume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        noise.start(now);
        noise.stop(now + 0.08);
        break;
      }

      case 'sideStick': {
        // Side stick sound - short, sharp transient
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        oscillator.frequency.setValueAtTime(isAccent ? 250 : 200, now);
        oscillator.type = 'square';

        gainNode.gain.setValueAtTime(volume * 0.8, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.03);

        oscillator.start(now);
        oscillator.stop(now + 0.03);
        break;
      }

      case 'voice': {
        // Voice-like metronome using multiple oscillators
        const oscillator1 = context.createOscillator();
        const oscillator2 = context.createOscillator();
        const gainNode = context.createGain();

        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(context.destination);

        const baseFreq = isAccent ? 600 : 500;
        oscillator1.frequency.setValueAtTime(baseFreq, now);
        oscillator2.frequency.setValueAtTime(baseFreq * 1.5, now);
        oscillator1.type = 'triangle';
        oscillator2.type = 'triangle';

        gainNode.gain.setValueAtTime(volume * 0.6, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        oscillator1.start(now);
        oscillator2.start(now);
        oscillator1.stop(now + 0.1);
        oscillator2.stop(now + 0.1);
        break;
      }
    }
  }, [soundType, masterVolume, metronomeVolume]);

  const scheduleBeat = useCallback(() => {
    const context = audioContextRef.current;
    if (!context) return;

    const now = context.currentTime;
    const interval = 60 / bpm;

    // Schedule next beat
    if (nextBeatTimeRef.current <= now) {
      nextBeatTimeRef.current = now + interval;
    }

    const isAccent = accentFirstBeat && currentBeat === 0;
    playClick(isAccent);
    
    // Increment beat for next time
    incrementBeat();
  }, [bpm, currentBeat, accentFirstBeat, playClick, incrementBeat]);

  useEffect(() => {
    if (isPlaying) {
      const context = audioContextRef.current;
      if (!context) return;

      // Reset beat and timing
      setCurrentBeat(0);
      nextBeatTimeRef.current = context.currentTime;

      // Initial beat
      scheduleBeat();

      // Schedule subsequent beats
      const interval = (60 / bpm) * 1000; // Convert to milliseconds
      intervalRef.current = window.setInterval(() => {
        scheduleBeat();
      }, interval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setCurrentBeat(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, bpm, scheduleBeat, setCurrentBeat]);

  return {
    playClick,
  };
};
