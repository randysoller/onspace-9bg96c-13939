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

    // Authentic plucked acoustic guitar tone - emphasis on odd harmonics
    // Real steel strings have inharmonic stretching (higher partials slightly sharp)
    const harmonics = [
      { freq: frequency, amp: 1.0, type: 'sawtooth' as OscillatorType, pan: 0, detune: 0 },         // Fundamental (rich base)
      { freq: frequency * 2, amp: 0.35, type: 'sine' as OscillatorType, pan: -0.08, detune: 8 },   // 2nd (weak even, inharmonic)
      { freq: frequency * 3, amp: 0.65, type: 'sine' as OscillatorType, pan: 0.08, detune: 12 },   // 3rd (strong odd, stretched)
      { freq: frequency * 4, amp: 0.22, type: 'sine' as OscillatorType, pan: -0.05, detune: 15 },  // 4th (weak even)
      { freq: frequency * 5, amp: 0.45, type: 'sine' as OscillatorType, pan: 0.05, detune: 18 },   // 5th (strong odd)
      { freq: frequency * 7, amp: 0.28, type: 'sine' as OscillatorType, pan: 0, detune: 22 },      // 7th (odd sparkle)
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

      // Waveform selection (sawtooth for fundamental adds richness, sine for clarity on overtones)
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(freq, now);
      oscillator.detune.setValueAtTime(detune, now); // Inharmonic stretching

      // Natural guitar EQ - subtle resonances, not synthetic keyboard peaks
      // 1. Organic low-pass rolloff (string physics)
      lowPassFilter.type = 'lowpass';
      lowPassFilter.frequency.setValueAtTime(3800, now);
      lowPassFilter.Q.setValueAtTime(0.5, now); // Gentle rolloff

      // 2. Subtle body resonance (wood cavity, not synth boost)
      bodyResonanceFilter.type = 'peaking';
      bodyResonanceFilter.frequency.setValueAtTime(195, now);
      bodyResonanceFilter.Q.setValueAtTime(1.8, now);
      bodyResonanceFilter.gain.setValueAtTime(1.5, now); // Very subtle warmth

      // 3. Gentle air resonance (soundhole character)
      airResonanceFilter.type = 'peaking';
      airResonanceFilter.frequency.setValueAtTime(520, now);
      airResonanceFilter.Q.setValueAtTime(1.2, now);
      airResonanceFilter.gain.setValueAtTime(2, now); // Natural presence

      // 4. Slight mid scoop for open, natural tone
      midCutFilter.type = 'peaking';
      midCutFilter.frequency.setValueAtTime(1800, now);
      midCutFilter.Q.setValueAtTime(1.0, now);
      midCutFilter.gain.setValueAtTime(-2.5, now); // Gentle scoop

      // 5. Subtle high-shelf for natural string brightness
      highShelfFilter.type = 'highshelf';
      highShelfFilter.frequency.setValueAtTime(4500, now);
      highShelfFilter.gain.setValueAtTime(1.5, now); // Natural air

      // Focused stereo image (not wide keyboard spread)
      panNode.pan.setValueAtTime(pan, now);

      // Plucked string envelope - percussive attack with organic multi-stage decay
      // Pre-attack: String displacement before full release (1ms)
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume * amp * 0.3, now + 0.001);
      
      // Attack: Sharp string release "bloom" (2ms total)
      gainNode.gain.linearRampToValueAtTime(volume * amp * 1.5, now + 0.003);
      
      // Initial decay: Fast drop as string loses initial energy (80ms)
      gainNode.gain.exponentialRampToValueAtTime(volume * amp * 0.5, now + 0.08);
      
      // Multi-stage sustain matching real string physics
      gainNode.gain.exponentialRampToValueAtTime(volume * amp * 0.28, now + 0.5);
      gainNode.gain.exponentialRampToValueAtTime(volume * amp * 0.12, now + 1.2);
      gainNode.gain.exponentialRampToValueAtTime(volume * amp * 0.04, now + 2.2);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 3.0);

      // Signal chain: oscillator → filters → gain → pan → master
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

    // === Natural Pick Attack Transient (focused, not overproduced) ===
    
    const pickBuffer = ctx.createBuffer(2, ctx.sampleRate * 0.012, ctx.sampleRate);
    const pickL = pickBuffer.getChannelData(0);
    const pickR = pickBuffer.getChannelData(1);
    
    for (let i = 0; i < pickL.length; i++) {
      // Exponential decay matching real pick contact (6ms)
      const decay = Math.exp(-i / (ctx.sampleRate * 0.006));
      // Subtle pitch content from string displacement
      const pitchMod = Math.sin((i / ctx.sampleRate) * frequency * 6.28) * 0.15;
      const noise = (Math.random() * 2 - 1) * 0.4;
      
      pickL[i] = (noise + pitchMod) * decay;
      pickR[i] = (noise + pitchMod) * decay;
    }

    const pickSource = ctx.createBufferSource();
    const pickGain = ctx.createGain();
    const pickFilter = ctx.createBiquadFilter();

    pickSource.buffer = pickBuffer;
    // Bandpass centered near fundamental for natural attack character
    pickFilter.type = 'bandpass';
    pickFilter.frequency.setValueAtTime(frequency * 3, now);
    pickFilter.Q.setValueAtTime(2.5, now);

    pickGain.gain.setValueAtTime(volume * 0.55, now);
    pickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.012);

    pickSource.connect(pickFilter);
    pickFilter.connect(pickGain);
    pickGain.connect(masterGain);

    pickSource.start(now);
    pickSource.stop(now + 0.012);
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
