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
    const volume = tunerVolume * 0.65;

    // Create master gain node for final stereo output
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(1.0, now);
    masterGain.connect(ctx.destination);

    // Multi-harmonic synthesis with authentic guitar characteristics
    // Real steel strings exhibit inharmonicity - higher partials are progressively sharper
    const harmonics = [
      { freq: frequency, amp: 1.0, type: 'triangle' as OscillatorType, pan: 0, detune: 0 },           // Fundamental (warm base)
      { freq: frequency * 2, amp: 0.5, type: 'triangle' as OscillatorType, pan: -0.15, detune: 5 },   // 2nd harmonic (slightly sharp)
      { freq: frequency * 3, amp: 0.35, type: 'sine' as OscillatorType, pan: 0.12, detune: 8 },       // 3rd harmonic
      { freq: frequency * 4, amp: 0.25, type: 'sine' as OscillatorType, pan: -0.08, detune: 10 },     // 4th harmonic
      { freq: frequency * 5, amp: 0.18, type: 'sine' as OscillatorType, pan: 0.18, detune: 12 },      // 5th harmonic
      { freq: frequency * 6, amp: 0.12, type: 'sine' as OscillatorType, pan: -0.1, detune: 14 },      // 6th harmonic
      { freq: frequency * 7, amp: 0.08, type: 'sine' as OscillatorType, pan: 0.15, detune: 16 },      // 7th harmonic
      { freq: frequency * 8, amp: 0.05, type: 'sine' as OscillatorType, pan: -0.12, detune: 18 },     // 8th harmonic
      { freq: frequency * 9, amp: 0.03, type: 'sine' as OscillatorType, pan: 0.08, detune: 20 },      // 9th harmonic (subtle presence)
    ];

    harmonics.forEach(({ freq, amp, type, pan, detune }) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const lowPassFilter = ctx.createBiquadFilter();
      const bodyResonanceFilter = ctx.createBiquadFilter();
      const airResonanceFilter = ctx.createBiquadFilter();
      const lowMidBoostFilter = ctx.createBiquadFilter();
      const upperMidCutFilter = ctx.createBiquadFilter();
      const highShelfFilter = ctx.createBiquadFilter();
      const panNode = ctx.createStereoPanner();

      // Waveform selection
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(freq, now);
      oscillator.detune.setValueAtTime(detune, now); // Inharmonicity simulation

      // EQ chain matching acoustic guitar characteristics
      // 1. Low-pass filter for natural rolloff
      lowPassFilter.type = 'lowpass';
      lowPassFilter.frequency.setValueAtTime(4200, now);
      lowPassFilter.Q.setValueAtTime(0.7, now);

      // 2. Body resonance (wood cavity thump)
      bodyResonanceFilter.type = 'peaking';
      bodyResonanceFilter.frequency.setValueAtTime(180, now);
      bodyResonanceFilter.Q.setValueAtTime(2.0, now);
      bodyResonanceFilter.gain.setValueAtTime(3, now);

      // 3. Air/soundhole resonance (warmth)
      airResonanceFilter.type = 'peaking';
      airResonanceFilter.frequency.setValueAtTime(480, now);
      airResonanceFilter.Q.setValueAtTime(1.5, now);
      airResonanceFilter.gain.setValueAtTime(5, now);

      // 4. Low-mid boost for body
      lowMidBoostFilter.type = 'peaking';
      lowMidBoostFilter.frequency.setValueAtTime(450, now);
      lowMidBoostFilter.Q.setValueAtTime(1.0, now);
      lowMidBoostFilter.gain.setValueAtTime(4, now);

      // 5. Upper-mid cut for smoothness
      upperMidCutFilter.type = 'peaking';
      upperMidCutFilter.frequency.setValueAtTime(1500, now);
      upperMidCutFilter.Q.setValueAtTime(1.2, now);
      upperMidCutFilter.gain.setValueAtTime(-5, now);

      // 6. High-shelf for brightness and air
      highShelfFilter.type = 'highshelf';
      highShelfFilter.frequency.setValueAtTime(5000, now);
      highShelfFilter.gain.setValueAtTime(3, now);

      // Stereo positioning for width (narrower spread for more focused image)
      panNode.pan.setValueAtTime(pan * 0.8, now);

      // Attack/sustain envelope (sharp attack with long sustain)
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume * amp * 1.4, now + 0.003);
      gainNode.gain.exponentialRampToValueAtTime(volume * amp * 0.5, now + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(volume * amp * 0.25, now + 0.6);
      gainNode.gain.exponentialRampToValueAtTime(volume * amp * 0.1, now + 1.5);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 3.0);

      // Signal chain: oscillator → filters → gain → pan → master
      oscillator.connect(lowPassFilter);
      lowPassFilter.connect(bodyResonanceFilter);
      bodyResonanceFilter.connect(airResonanceFilter);
      airResonanceFilter.connect(lowMidBoostFilter);
      lowMidBoostFilter.connect(upperMidCutFilter);
      upperMidCutFilter.connect(highShelfFilter);
      highShelfFilter.connect(gainNode);
      gainNode.connect(panNode);
      panNode.connect(masterGain);

      oscillator.start(now);
      oscillator.stop(now + 3.0);

      activeNodesRef.current.push({ osc: oscillator, gain: gainNode });
    });

    // === 3-Layer Pick Attack System ===
    
    // Layer 1: Pick scrape (high-frequency noise from pick sliding across string)
    const scrapeBuffer = ctx.createBuffer(2, ctx.sampleRate * 0.015, ctx.sampleRate);
    const scrapeL = scrapeBuffer.getChannelData(0);
    const scrapeR = scrapeBuffer.getChannelData(1);
    
    for (let i = 0; i < scrapeL.length; i++) {
      const decay = Math.exp(-i / (ctx.sampleRate * 0.008));
      const noise = Math.random() * 2 - 1;
      scrapeL[i] = noise * decay * 0.3;
      scrapeR[i] = noise * decay * 0.3;
    }

    const scrapeSource = ctx.createBufferSource();
    const scrapeGain = ctx.createGain();
    const scrapeFilter = ctx.createBiquadFilter();

    scrapeSource.buffer = scrapeBuffer;
    scrapeFilter.type = 'highpass';
    scrapeFilter.frequency.setValueAtTime(2800, now);
    scrapeFilter.Q.setValueAtTime(1.0, now);

    scrapeGain.gain.setValueAtTime(volume * 0.4, now);
    scrapeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

    scrapeSource.connect(scrapeFilter);
    scrapeFilter.connect(scrapeGain);
    scrapeGain.connect(masterGain);

    scrapeSource.start(now);
    scrapeSource.stop(now + 0.015);

    // Layer 2: String collision (mid-frequency thunk)
    const thunkBuffer = ctx.createBuffer(2, ctx.sampleRate * 0.025, ctx.sampleRate);
    const thunkL = thunkBuffer.getChannelData(0);
    const thunkR = thunkBuffer.getChannelData(1);
    
    for (let i = 0; i < thunkL.length; i++) {
      const decay = Math.exp(-i / (ctx.sampleRate * 0.012));
      const pitch = Math.sin((i / ctx.sampleRate) * frequency * 2.5 * 6.28);
      const noise = (Math.random() * 2 - 1) * 0.3;
      thunkL[i] = (pitch + noise) * decay * 0.5;
      thunkR[i] = (pitch + noise) * decay * 0.5;
    }

    const thunkSource = ctx.createBufferSource();
    const thunkGain = ctx.createGain();

    thunkSource.buffer = thunkBuffer;
    thunkGain.gain.setValueAtTime(volume * 0.6, now);
    thunkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    thunkSource.connect(thunkGain);
    thunkGain.connect(masterGain);

    thunkSource.start(now + 0.002);
    thunkSource.stop(now + 0.027);

    // Layer 3: Finger release rumble (low-frequency body thump)
    const rumbleBuffer = ctx.createBuffer(2, ctx.sampleRate * 0.04, ctx.sampleRate);
    const rumbleL = rumbleBuffer.getChannelData(0);
    const rumbleR = rumbleBuffer.getChannelData(1);
    
    for (let i = 0; i < rumbleL.length; i++) {
      const decay = Math.exp(-i / (ctx.sampleRate * 0.02));
      const noise = (Math.random() * 2 - 1) * 0.6;
      rumbleL[i] = noise * decay;
      rumbleR[i] = noise * decay;
    }

    const rumbleSource = ctx.createBufferSource();
    const rumbleGain = ctx.createGain();
    const rumbleFilter = ctx.createBiquadFilter();

    rumbleSource.buffer = rumbleBuffer;
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.setValueAtTime(800, now);
    rumbleFilter.Q.setValueAtTime(2.0, now);

    rumbleGain.gain.setValueAtTime(volume * 0.35, now);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    rumbleSource.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(masterGain);

    rumbleSource.start(now + 0.005);
    rumbleSource.stop(now + 0.045);
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
