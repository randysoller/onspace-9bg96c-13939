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

    // Create master gain node for final stereo output
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(1.0, now);
    masterGain.connect(ctx.destination);

    // Guitar-like tone synthesis using multiple harmonics with subtle stereo spread
    // Authentic guitar harmonic series with natural amplitude distribution
    const harmonics = [
      { freq: frequency, amp: 1.0, type: 'triangle' as OscillatorType, pan: 0, detune: 0 },           // Fundamental (centered)
      { freq: frequency * 2, amp: 0.5, type: 'triangle' as OscillatorType, pan: -0.1, detune: -3 }, // 2nd harmonic (subtle left)
      { freq: frequency * 2, amp: 0.5, type: 'triangle' as OscillatorType, pan: 0.1, detune: 3 },   // 2nd harmonic (subtle right, detuned for chorus)
      { freq: frequency * 3, amp: 0.3, type: 'sine' as OscillatorType, pan: 0.15, detune: 0 },        // 3rd harmonic (subtle right)
      { freq: frequency * 4, amp: 0.2, type: 'sine' as OscillatorType, pan: -0.15, detune: 0 },       // 4th harmonic (subtle left)
      { freq: frequency * 5, amp: 0.15, type: 'sine' as OscillatorType, pan: 0.2, detune: 0 },      // 5th harmonic (subtle right)
      { freq: frequency * 6, amp: 0.1, type: 'sine' as OscillatorType, pan: -0.2, detune: 0 },      // 6th harmonic (subtle left)
      { freq: frequency * 7, amp: 0.05, type: 'sine' as OscillatorType, pan: 0, detune: 0 },         // 7th harmonic (shimmer, centered)
    ];

    harmonics.forEach(({ freq, amp, type, pan, detune }) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const lowPassFilter = ctx.createBiquadFilter();
      const lowMidBoostFilter = ctx.createBiquadFilter();
      const midCutFilter = ctx.createBiquadFilter();
      const highShelfFilter = ctx.createBiquadFilter();
      const panNode = ctx.createStereoPanner();

      // Mix of waveforms for authentic guitar timbre
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(freq, now);
      oscillator.detune.setValueAtTime(detune, now); // Slight detuning for chorus effect

      // Multi-stage EQ for guitar tone
      // 1. Low-pass filter for warmth and natural rolloff
      lowPassFilter.type = 'lowpass';
      lowPassFilter.frequency.setValueAtTime(3500 + (freq * 0.3), now);
      lowPassFilter.Q.setValueAtTime(0.5, now);

      // 2. Low-mid boost for body and warmth (300-600Hz)
      lowMidBoostFilter.type = 'peaking';
      lowMidBoostFilter.frequency.setValueAtTime(450, now);
      lowMidBoostFilter.Q.setValueAtTime(1.2, now);
      lowMidBoostFilter.gain.setValueAtTime(4, now); // Boost low mids by 4dB

      // 3. Upper-mid cut to reduce harsh frequencies (1500Hz)
      midCutFilter.type = 'peaking';
      midCutFilter.frequency.setValueAtTime(1500, now);
      midCutFilter.Q.setValueAtTime(1.5, now);
      midCutFilter.gain.setValueAtTime(-5, now); // Cut upper mids by 5dB

      // 4. High-shelf for air and sparkle
      highShelfFilter.type = 'highshelf';
      highShelfFilter.frequency.setValueAtTime(4000, now);
      highShelfFilter.gain.setValueAtTime(2, now); // Slight boost for clarity

      // Stereo panning for width
      panNode.pan.setValueAtTime(pan, now);

      // Authentic guitar ADSR envelope
      // Attack: Sharp pluck (5ms)
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume * amp * 1.2, now + 0.005);
      
      // Decay: Quick initial drop (150ms)
      gainNode.gain.exponentialRampToValueAtTime(volume * amp * 0.4, now + 0.15);
      
      // Sustain: Slower natural decay (3 seconds total)
      gainNode.gain.exponentialRampToValueAtTime(volume * amp * 0.15, now + 1.0);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 3.0);

      // Signal chain: oscillator → low-pass → low-mid boost → upper-mid cut → high-shelf → gain → pan → master output
      oscillator.connect(lowPassFilter);
      lowPassFilter.connect(lowMidBoostFilter);
      lowMidBoostFilter.connect(midCutFilter);
      midCutFilter.connect(highShelfFilter);
      highShelfFilter.connect(gainNode);
      gainNode.connect(panNode);
      panNode.connect(masterGain);

      oscillator.start(now);
      oscillator.stop(now + 3.0);

      activeNodesRef.current.push({ osc: oscillator, gain: gainNode });
    });

    // Add realistic pick attack noise (string scrape + pick collision) with stereo width
    const noiseBufferL = ctx.createBuffer(1, ctx.sampleRate * 0.03, ctx.sampleRate);
    const noiseBufferR = ctx.createBuffer(1, ctx.sampleRate * 0.03, ctx.sampleRate);
    const dataL = noiseBufferL.getChannelData(0);
    const dataR = noiseBufferR.getChannelData(0);
    
    for (let i = 0; i < dataL.length; i++) {
      const decay = Math.exp(-i / (ctx.sampleRate * 0.01));
      dataL[i] = (Math.random() * 2 - 1) * 0.15 * decay;
      dataR[i] = (Math.random() * 2 - 1) * 0.15 * decay; // Different random values for stereo width
    }

    // Left channel noise
    const noiseSourceL = ctx.createBufferSource();
    const noiseGainL = ctx.createGain();
    const noiseFilterL = ctx.createBiquadFilter();
    const noisePanL = ctx.createStereoPanner();

    noiseSourceL.buffer = noiseBufferL;
    noiseFilterL.type = 'bandpass';
    noiseFilterL.frequency.setValueAtTime(frequency * 3, now);
    noiseFilterL.Q.setValueAtTime(2, now);
    noisePanL.pan.setValueAtTime(-0.3, now);

    noiseGainL.gain.setValueAtTime(volume * 0.5, now);
    noiseGainL.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    noiseSourceL.connect(noiseFilterL);
    noiseFilterL.connect(noiseGainL);
    noiseGainL.connect(noisePanL);
    noisePanL.connect(masterGain);

    noiseSourceL.start(now);
    noiseSourceL.stop(now + 0.03);

    // Right channel noise
    const noiseSourceR = ctx.createBufferSource();
    const noiseGainR = ctx.createGain();
    const noiseFilterR = ctx.createBiquadFilter();
    const noisePanR = ctx.createStereoPanner();

    noiseSourceR.buffer = noiseBufferR;
    noiseFilterR.type = 'bandpass';
    noiseFilterR.frequency.setValueAtTime(frequency * 3.2, now); // Slightly different frequency for width
    noiseFilterR.Q.setValueAtTime(2, now);
    noisePanR.pan.setValueAtTime(0.3, now);

    noiseGainR.gain.setValueAtTime(volume * 0.5, now);
    noiseGainR.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    noiseSourceR.connect(noiseFilterR);
    noiseFilterR.connect(noiseGainR);
    noiseGainR.connect(noisePanR);
    noisePanR.connect(masterGain);

    noiseSourceR.start(now);
    noiseSourceR.stop(now + 0.03);
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
