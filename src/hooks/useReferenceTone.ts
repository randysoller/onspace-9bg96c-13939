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
    const volume = tunerVolume * 0.65; // Louder default volume

    // Guitar-like tone synthesis using multiple harmonics
    // Authentic guitar harmonic series with natural amplitude distribution
    const harmonics = [
      { freq: frequency, amp: 1.0, type: 'triangle' as OscillatorType },      // Fundamental (warm)
      { freq: frequency * 2, amp: 0.5, type: 'triangle' as OscillatorType },  // 2nd harmonic (octave)
      { freq: frequency * 3, amp: 0.3, type: 'sine' as OscillatorType },      // 3rd harmonic (perfect fifth)
      { freq: frequency * 4, amp: 0.2, type: 'sine' as OscillatorType },      // 4th harmonic
      { freq: frequency * 5, amp: 0.15, type: 'sine' as OscillatorType },     // 5th harmonic (brightness)
      { freq: frequency * 6, amp: 0.1, type: 'sine' as OscillatorType },      // 6th harmonic
      { freq: frequency * 7, amp: 0.05, type: 'sine' as OscillatorType },     // 7th harmonic (shimmer)
    ];

    harmonics.forEach(({ freq, amp, type }) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Mix of waveforms for authentic guitar timbre
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(freq, now);

      // Low-pass filter for natural tone shaping
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3000 + (freq * 0.5), now); // Adaptive brightness
      filter.Q.setValueAtTime(0.7, now);

      // Authentic guitar ADSR envelope
      // Attack: Sharp pluck (5ms)
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume * amp * 1.2, now + 0.005);
      
      // Decay: Quick initial drop (150ms)
      gainNode.gain.exponentialRampToValueAtTime(volume * amp * 0.4, now + 0.15);
      
      // Sustain: Slower natural decay (3 seconds total)
      gainNode.gain.exponentialRampToValueAtTime(volume * amp * 0.15, now + 1.0);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 3.0);

      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(now);
      oscillator.stop(now + 3.0);

      activeNodesRef.current.push({ osc: oscillator, gain: gainNode });
    });

    // Add realistic pick attack noise (string scrape + pick collision)
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.03, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      // Exponentially decaying noise for realistic pick sound
      const decay = Math.exp(-i / (ctx.sampleRate * 0.01));
      data[i] = (Math.random() * 2 - 1) * 0.2 * decay;
    }

    const noiseSource = ctx.createBufferSource();
    const noiseGain = ctx.createGain();
    const noiseFilter = ctx.createBiquadFilter();

    noiseSource.buffer = noiseBuffer;
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(frequency * 3, now); // Pick frequency range
    noiseFilter.Q.setValueAtTime(2, now); // Moderate resonance

    noiseGain.gain.setValueAtTime(volume * 0.6, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noiseSource.start(now);
    noiseSource.stop(now + 0.03);
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
