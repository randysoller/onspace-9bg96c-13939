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
    // Authentic guitar harmonic series with natural amplitude distribution and inharmonicity
    const harmonics = [
      { freq: frequency, amp: 1.0, type: 'triangle' as OscillatorType, pan: 0, detune: 0 },           // Fundamental (centered)
      { freq: frequency * 2, amp: 0.6, type: 'triangle' as OscillatorType, pan: -0.1, detune: -3 }, // 2nd harmonic (subtle left)
      { freq: frequency * 2, amp: 0.6, type: 'triangle' as OscillatorType, pan: 0.1, detune: 3 },   // 2nd harmonic (subtle right, detuned for chorus)
      { freq: frequency * 3, amp: 0.4, type: 'sine' as OscillatorType, pan: 0.15, detune: 2 },        // 3rd harmonic (slight inharmonicity)
      { freq: frequency * 4, amp: 0.25, type: 'sine' as OscillatorType, pan: -0.15, detune: -2 },     // 4th harmonic (slight inharmonicity)
      { freq: frequency * 5, amp: 0.18, type: 'sine' as OscillatorType, pan: 0.2, detune: 4 },      // 5th harmonic (more inharmonicity)
      { freq: frequency * 6, amp: 0.12, type: 'sine' as OscillatorType, pan: -0.2, detune: -3 },    // 6th harmonic
      { freq: frequency * 7, amp: 0.08, type: 'sine' as OscillatorType, pan: 0, detune: 5 },         // 7th harmonic (shimmer)
      { freq: frequency * 8, amp: 0.04, type: 'sine' as OscillatorType, pan: 0.1, detune: -4 },     // 8th harmonic (air)
    ];

    harmonics.forEach(({ freq, amp, type, pan, detune }) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const lowPassFilter = ctx.createBiquadFilter();
      const bodyResonanceFilter = ctx.createBiquadFilter();
      const airResonanceFilter = ctx.createBiquadFilter();
      const midCutFilter = ctx.createBiquadFilter();
      const highShelfFilter = ctx.createBiquadFilter();
      const panNode = ctx.createStereoPanner();

      // Mix of waveforms for authentic guitar timbre
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(freq, now);
      oscillator.detune.setValueAtTime(detune, now); // Slight detuning for inharmonicity

      // Multi-stage EQ for authentic guitar tone
      // 1. Low-pass filter for warmth and natural rolloff
      lowPassFilter.type = 'lowpass';
      lowPassFilter.frequency.setValueAtTime(4200, now);
      lowPassFilter.Q.setValueAtTime(0.7, now);

      // 2. Body resonance (main body cavity ~100-200Hz)
      bodyResonanceFilter.type = 'peaking';
      bodyResonanceFilter.frequency.setValueAtTime(180, now);
      bodyResonanceFilter.Q.setValueAtTime(2.5, now);
      bodyResonanceFilter.gain.setValueAtTime(3, now); // Body thump

      // 3. Air resonance (soundhole ~400-500Hz)
      airResonanceFilter.type = 'peaking';
      airResonanceFilter.frequency.setValueAtTime(480, now);
      airResonanceFilter.Q.setValueAtTime(1.8, now);
      airResonanceFilter.gain.setValueAtTime(5, now); // Warmth and presence

      // 4. Upper-mid cut to reduce harsh frequencies (1500Hz)
      midCutFilter.type = 'peaking';
      midCutFilter.frequency.setValueAtTime(1500, now);
      midCutFilter.Q.setValueAtTime(1.5, now);
      midCutFilter.gain.setValueAtTime(-4, now); // Cut harshness

      // 5. High-shelf for air and sparkle
      highShelfFilter.type = 'highshelf';
      highShelfFilter.frequency.setValueAtTime(5000, now);
      highShelfFilter.gain.setValueAtTime(3, now); // Brightness and clarity

      // Stereo panning for width
      panNode.pan.setValueAtTime(pan, now);

      // Authentic guitar ADSR envelope with sharper attack
      // Attack: Very sharp pluck (3ms) with pre-emphasis
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume * amp * 1.4, now + 0.003);
      
      // Decay: Quick initial drop (120ms)
      gainNode.gain.exponentialRampToValueAtTime(volume * amp * 0.45, now + 0.12);
      
      // Sustain: Natural decay curve (3 seconds total)
      gainNode.gain.exponentialRampToValueAtTime(volume * amp * 0.18, now + 0.8);
      gainNode.gain.exponentialRampToValueAtTime(volume * amp * 0.05, now + 2.0);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 3.0);

      // Signal chain: oscillator → low-pass → body resonance → air resonance → mid cut → high-shelf → gain → pan → master
      oscillator.connect(lowPassFilter);
      lowPassFilter.connect(bodyResonanceFilter);
      bodyResonanceFilter.connect(airResonanceFilter);
      airResonanceFilter.connect(midCutFilter);
      midCutFilter.connect(highShelfFilter);
      highShelfFilter.connect(gainNode);
      gainNode.connect(panNode);
      panNode.connect(masterGain);

      oscillator.start(now);
      oscillator.stop(now + 3.0);

      activeNodesRef.current.push({ osc: oscillator, gain: gainNode });
    });

    // === Enhanced Pick Attack Noise (3-Layer System) ===
    
    // LAYER 1: Pick Scrape (bright, high-frequency attack transient)
    const scrapeBuffer = ctx.createBuffer(2, ctx.sampleRate * 0.015, ctx.sampleRate);
    const scrapeL = scrapeBuffer.getChannelData(0);
    const scrapeR = scrapeBuffer.getChannelData(1);
    
    for (let i = 0; i < scrapeL.length; i++) {
      // Very fast decay for initial scrape (5ms)
      const decay = Math.exp(-i / (ctx.sampleRate * 0.005));
      // Add slight pitch sweep to simulate pick sliding across string
      const sweep = 1 + (i / scrapeL.length) * 0.3;
      scrapeL[i] = (Math.random() * 2 - 1) * 0.35 * decay * sweep;
      scrapeR[i] = (Math.random() * 2 - 1) * 0.35 * decay * sweep;
    }

    const scrapeSource = ctx.createBufferSource();
    const scrapeGain = ctx.createGain();
    const scrapeFilter = ctx.createBiquadFilter();

    scrapeSource.buffer = scrapeBuffer;
    // Bright high-pass for pick-on-string scrape
    scrapeFilter.type = 'highpass';
    scrapeFilter.frequency.setValueAtTime(2800, now);
    scrapeFilter.Q.setValueAtTime(1.5, now);

    scrapeGain.gain.setValueAtTime(volume * 0.7, now);
    scrapeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

    scrapeSource.connect(scrapeFilter);
    scrapeFilter.connect(scrapeGain);
    scrapeGain.connect(masterGain);

    scrapeSource.start(now);
    scrapeSource.stop(now + 0.015);

    // LAYER 2: String Collision (mid-frequency thunk)
    const thunkBuffer = ctx.createBuffer(2, ctx.sampleRate * 0.025, ctx.sampleRate);
    const thunkL = thunkBuffer.getChannelData(0);
    const thunkR = thunkBuffer.getChannelData(1);
    
    for (let i = 0; i < thunkL.length; i++) {
      // Medium decay for string collision (10ms)
      const decay = Math.exp(-i / (ctx.sampleRate * 0.01));
      thunkL[i] = (Math.random() * 2 - 1) * 0.25 * decay;
      thunkR[i] = (Math.random() * 2 - 1) * 0.25 * decay;
    }

    const thunkSource = ctx.createBufferSource();
    const thunkGain = ctx.createGain();
    const thunkFilter = ctx.createBiquadFilter();

    thunkSource.buffer = thunkBuffer;
    // Bandpass for string collision "thunk"
    thunkFilter.type = 'bandpass';
    thunkFilter.frequency.setValueAtTime(frequency * 2.5, now);
    thunkFilter.Q.setValueAtTime(3, now);

    thunkGain.gain.setValueAtTime(volume * 0.6, now);
    thunkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    thunkSource.connect(thunkFilter);
    thunkFilter.connect(thunkGain);
    thunkGain.connect(masterGain);

    thunkSource.start(now);
    thunkSource.stop(now + 0.025);

    // LAYER 3: Finger Release Noise (subtle low-frequency rumble)
    const releaseBuffer = ctx.createBuffer(2, ctx.sampleRate * 0.04, ctx.sampleRate);
    const releaseL = releaseBuffer.getChannelData(0);
    const releaseR = releaseBuffer.getChannelData(1);
    
    for (let i = 0; i < releaseL.length; i++) {
      // Slower decay for finger release (15ms)
      const decay = Math.exp(-i / (ctx.sampleRate * 0.015));
      releaseL[i] = (Math.random() * 2 - 1) * 0.15 * decay;
      releaseR[i] = (Math.random() * 2 - 1) * 0.15 * decay;
    }

    const releaseSource = ctx.createBufferSource();
    const releaseGain = ctx.createGain();
    const releaseFilter = ctx.createBiquadFilter();

    releaseSource.buffer = releaseBuffer;
    // Low-pass for subtle finger noise
    releaseFilter.type = 'lowpass';
    releaseFilter.frequency.setValueAtTime(800, now);
    releaseFilter.Q.setValueAtTime(1, now);

    releaseGain.gain.setValueAtTime(volume * 0.3, now);
    releaseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    releaseSource.connect(releaseFilter);
    releaseFilter.connect(releaseGain);
    releaseGain.connect(masterGain);

    releaseSource.start(now);
    releaseSource.stop(now + 0.04);
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
