import { useEffect, useRef } from 'react';
import { useAudioStore } from '@/stores/audioStore';

export const useReferenceTone = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeNodesRef = useRef<Array<{ osc: OscillatorNode; gain: GainNode }>>([]);
  const { tunerVolume } = useAudioStore();

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const playTone = (frequency: number) => {
    if (!audioContextRef.current) return;

    // Stop any existing tones
    stopTone();

    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    const volume = tunerVolume * 0.25;

    // Guitar-like tone synthesis using multiple harmonics
    // Fundamental + harmonics at decreasing amplitudes
    const harmonics = [
      { freq: frequency, amp: 1.0 },        // Fundamental
      { freq: frequency * 2, amp: 0.4 },    // 2nd harmonic (octave)
      { freq: frequency * 3, amp: 0.25 },   // 3rd harmonic (perfect fifth)
      { freq: frequency * 4, amp: 0.15 },   // 4th harmonic (two octaves)
      { freq: frequency * 5, amp: 0.1 },    // 5th harmonic (major third)
      { freq: frequency * 6, amp: 0.05 },   // 6th harmonic
    ];

    harmonics.forEach(({ freq, amp }) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      // Use triangle wave for warmer, more guitar-like tone
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(freq, now);

      // ADSR Envelope for guitar-like pluck
      // Attack: Quick pluck (10ms)
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume * amp, now + 0.01);
      
      // Decay: Natural string decay (2 seconds)
      gainNode.gain.exponentialRampToValueAtTime(volume * amp * 0.3, now + 0.3);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(now);
      oscillator.stop(now + 2.0);

      activeNodesRef.current.push({ osc: oscillator, gain: gainNode });
    });

    // Add subtle noise for pluck attack (initial pick sound)
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.1; // Low-amplitude noise
    }

    const noiseSource = ctx.createBufferSource();
    const noiseGain = ctx.createGain();
    const noiseFilter = ctx.createBiquadFilter();

    noiseSource.buffer = noiseBuffer;
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(frequency * 4, now); // High-frequency click
    noiseFilter.Q.setValueAtTime(5, now);

    noiseGain.gain.setValueAtTime(volume * 0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noiseSource.start(now);
    noiseSource.stop(now + 0.05);
  };

  const stopTone = () => {
    if (audioContextRef.current && activeNodesRef.current.length > 0) {
      const now = audioContextRef.current.currentTime;
      
      // Fade out all active nodes
      activeNodesRef.current.forEach(({ osc, gain }) => {
        try {
          gain.gain.cancelScheduledValues(now);
          gain.gain.setValueAtTime(gain.gain.value, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          osc.stop(now + 0.1);
        } catch (e) {
          // Node may already be stopped
        }
      });
      
      activeNodesRef.current = [];
    }
  };

  return { playTone, stopTone };
};
