
import { useEffect, useRef, useCallback } from 'react';
import { useMetronomeStore } from '@/stores/metronomeStore';
import { useAudioStore } from '@/stores/audioStore';

export const useMetronomeAudio = () => {
  const { 
    isPlaying, 
    bpm, 
    soundType, 
    subdivision,
    incrementBeat,
    setCurrentBeat,
    setSubdivisionCounter,
  } = useMetronomeStore();
  
  const { masterVolume, metronomeVolume } = useAudioStore();
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);

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
    const baseVolume = masterVolume * metronomeVolume;
    const volume = isAccent ? baseVolume * 1.0 : baseVolume * 0.65;

    switch (soundType) {
      case 'click': {
        // Realistic mechanical metronome click with metal strike transient
        const bufferSize = context.sampleRate * 0.04;
        const buffer = context.createBuffer(2, bufferSize, context.sampleRate);
        const dataL = buffer.getChannelData(0);
        const dataR = buffer.getChannelData(1);

        // Generate sharp metallic transient with multiple harmonics
        for (let i = 0; i < bufferSize; i++) {
          const decay = Math.exp(-i / (context.sampleRate * 0.008));
          const noise = (Math.random() * 2 - 1) * 0.3;
          
          // Multiple frequency components for metallic character
          const freq1 = isAccent ? 2800 : 2200;
          const freq2 = isAccent ? 4200 : 3400;
          const freq3 = isAccent ? 5600 : 4800;
          
          const click1 = Math.sin((i / context.sampleRate) * freq1 * 6.28) * 0.5;
          const click2 = Math.sin((i / context.sampleRate) * freq2 * 6.28) * 0.3;
          const click3 = Math.sin((i / context.sampleRate) * freq3 * 6.28) * 0.2;
          
          dataL[i] = (noise + click1 + click2 + click3) * decay;
          dataR[i] = (noise + click1 + click2 + click3) * decay;
        }

        const bufferSource = context.createBufferSource();
        const filter = context.createBiquadFilter();
        const gainNode = context.createGain();

        bufferSource.buffer = buffer;
        
        // High-pass for crisp metallic sound
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1800, now);
        filter.Q.setValueAtTime(1.5, now);

        bufferSource.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(context.destination);

        gainNode.gain.setValueAtTime(volume * 0.95, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        bufferSource.start(now);
        bufferSource.stop(now + 0.04);
        break;
      }

      case 'woodBlock': {
        // Realistic wood block with hollow body resonance and sharp attack
        const bufferSize = context.sampleRate * 0.08;
        const buffer = context.createBuffer(2, bufferSize, context.sampleRate);
        const dataL = buffer.getChannelData(0);
        const dataR = buffer.getChannelData(1);

        // Generate percussive attack with wood body resonance
        for (let i = 0; i < bufferSize; i++) {
          const t = i / context.sampleRate;
          const attack = Math.exp(-i / (context.sampleRate * 0.003)); // Sharp attack
          const bodyDecay = Math.exp(-i / (context.sampleRate * 0.018)); // Longer body resonance
          const noise = (Math.random() * 2 - 1) * 0.35;
          
          // Multiple resonant frequencies for wood character
          const fundamental = isAccent ? 920 : 720;
          const harmonic2 = fundamental * 1.8;
          const harmonic3 = fundamental * 2.7;
          
          const res1 = Math.sin(t * fundamental * 6.28) * 0.5;
          const res2 = Math.sin(t * harmonic2 * 6.28) * 0.25;
          const res3 = Math.sin(t * harmonic3 * 6.28) * 0.15;
          
          // Combine attack noise with sustained resonance
          const signal = (noise * attack * 0.7) + ((res1 + res2 + res3) * bodyDecay);
          
          dataL[i] = signal;
          dataR[i] = signal * 0.98; // Slight stereo variation
        }

        const bufferSource = context.createBufferSource();
        const filter1 = context.createBiquadFilter();
        const filter2 = context.createBiquadFilter();
        const filter3 = context.createBiquadFilter();
        const gainNode = context.createGain();

        bufferSource.buffer = buffer;
        
        // Bandpass for fundamental resonance
        filter1.type = 'bandpass';
        filter1.frequency.setValueAtTime(isAccent ? 920 : 720, now);
        filter1.Q.setValueAtTime(10, now);
        
        // Peaking filter for upper harmonics
        filter2.type = 'peaking';
        filter2.frequency.setValueAtTime(isAccent ? 1650 : 1300, now);
        filter2.Q.setValueAtTime(4, now);
        filter2.gain.setValueAtTime(6, now);
        
        // High-pass to clean up lows
        filter3.type = 'highpass';
        filter3.frequency.setValueAtTime(400, now);

        bufferSource.connect(filter1);
        filter1.connect(filter2);
        filter2.connect(filter3);
        filter3.connect(gainNode);
        gainNode.connect(context.destination);

        gainNode.gain.setValueAtTime(volume * 0.92, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        bufferSource.start(now);
        bufferSource.stop(now + 0.08);
        break;
      }

      case 'hiHat': {
        // Realistic closed hi-hat with complex metallic spectrum
        const duration = isAccent ? 0.15 : 0.09;
        const bufferSize = context.sampleRate * duration;
        const buffer = context.createBuffer(2, bufferSize, context.sampleRate);
        const dataL = buffer.getChannelData(0);
        const dataR = buffer.getChannelData(1);

        // Generate complex metallic noise spectrum
        for (let i = 0; i < bufferSize; i++) {
          const t = i / context.sampleRate;
          const attack = Math.exp(-i / (context.sampleRate * 0.003)); // Sharp attack
          const sustain = Math.exp(-i / (context.sampleRate * (isAccent ? 0.04 : 0.025))); // Body decay
          const noise = Math.random() * 2 - 1;
          
          // Multiple inharmonic metal frequencies
          const freq1 = 7800;
          const freq2 = 9500;
          const freq3 = 11200;
          const freq4 = 13500;
          const freq5 = 15800;
          
          const metal1 = Math.sin(t * freq1 * 6.28) * 0.25;
          const metal2 = Math.sin(t * freq2 * 6.28) * 0.20;
          const metal3 = Math.sin(t * freq3 * 6.28) * 0.15;
          const metal4 = Math.sin(t * freq4 * 6.28) * 0.12;
          const metal5 = Math.sin(t * freq5 * 6.28) * 0.08;
          
          // Sharp attack noise + sustained metallic ring
          const signal = (noise * 0.6 * attack) + ((metal1 + metal2 + metal3 + metal4 + metal5) * sustain);
          
          dataL[i] = signal;
          dataR[i] = signal * 0.92 + (Math.random() * 2 - 1) * 0.08 * sustain; // Stereo shimmer
        }

        const bufferSource = context.createBufferSource();
        const highpass = context.createBiquadFilter();
        const peaking1 = context.createBiquadFilter();
        const peaking2 = context.createBiquadFilter();
        const gainNode = context.createGain();

        bufferSource.buffer = buffer;
        
        // High-pass to remove lows
        highpass.type = 'highpass';
        highpass.frequency.setValueAtTime(6500, now);
        highpass.Q.setValueAtTime(0.7, now);
        
        // Enhance sizzle frequencies
        peaking1.type = 'peaking';
        peaking1.frequency.setValueAtTime(9500, now);
        peaking1.Q.setValueAtTime(2.5, now);
        peaking1.gain.setValueAtTime(8, now);
        
        peaking2.type = 'peaking';
        peaking2.frequency.setValueAtTime(13000, now);
        peaking2.Q.setValueAtTime(1.8, now);
        peaking2.gain.setValueAtTime(5, now);

        bufferSource.connect(highpass);
        highpass.connect(peaking1);
        peaking1.connect(peaking2);
        peaking2.connect(gainNode);
        gainNode.connect(context.destination);

        gainNode.gain.setValueAtTime(volume * 0.72, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

        bufferSource.start(now);
        bufferSource.stop(now + duration);
        break;
      }

      case 'sideStick': {
        // Realistic side stick - sharp rim shot with wood and metal character
        const bufferSize = context.sampleRate * 0.03;
        const buffer = context.createBuffer(2, bufferSize, context.sampleRate);
        const dataL = buffer.getChannelData(0);
        const dataR = buffer.getChannelData(1);

        // Generate sharp stick-on-rim transient
        for (let i = 0; i < bufferSize; i++) {
          const t = i / context.sampleRate;
          const attack = Math.exp(-i / (context.sampleRate * 0.002)); // Very sharp attack
          const decay = Math.exp(-i / (context.sampleRate * 0.008)); // Quick decay
          const noise = (Math.random() * 2 - 1) * 0.7;
          
          // Wood stick resonance + metal rim ring
          const woodFreq = isAccent ? 1400 : 1100;
          const rimFreq = isAccent ? 3200 : 2600;
          
          const wood = Math.sin(t * woodFreq * 6.28) * 0.4;
          const rim = Math.sin(t * rimFreq * 6.28) * 0.35;
          const highClick = Math.sin(t * 5500 * 6.28) * 0.15;
          
          // Sharp attack noise + resonant body
          const signal = (noise * attack * 0.8) + ((wood + rim + highClick) * decay);
          
          dataL[i] = signal;
          dataR[i] = signal;
        }

        const bufferSource = context.createBufferSource();
        const highpass = context.createBiquadFilter();
        const peaking = context.createBiquadFilter();
        const gainNode = context.createGain();

        bufferSource.buffer = buffer;
        
        // High-pass for crisp character
        highpass.type = 'highpass';
        highpass.frequency.setValueAtTime(800, now);
        highpass.Q.setValueAtTime(0.7, now);
        
        // Enhance the crack frequency
        peaking.type = 'peaking';
        peaking.frequency.setValueAtTime(isAccent ? 2800 : 2200, now);
        peaking.Q.setValueAtTime(5, now);
        peaking.gain.setValueAtTime(10, now);

        bufferSource.connect(highpass);
        highpass.connect(peaking);
        peaking.connect(gainNode);
        gainNode.connect(context.destination);

        gainNode.gain.setValueAtTime(volume * 0.88, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

        bufferSource.start(now);
        bufferSource.stop(now + 0.03);
        break;
      }

      case 'voice': {
        // Vocal "tick" and "tock" using formant synthesis
        const osc1 = context.createOscillator();
        const osc2 = context.createOscillator();
        const osc3 = context.createOscillator();
        const formant1 = context.createBiquadFilter();
        const formant2 = context.createBiquadFilter();
        const gainNode = context.createGain();

        osc1.connect(formant1);
        osc2.connect(formant1);
        osc3.connect(formant1);
        formant1.connect(formant2);
        formant2.connect(gainNode);
        gainNode.connect(context.destination);

        // Accent = "TOCK" (lower), normal = "tick" (higher)
        const baseFreq = isAccent ? 280 : 420;
        osc1.frequency.setValueAtTime(baseFreq, now);
        osc2.frequency.setValueAtTime(baseFreq * 2, now);
        osc3.frequency.setValueAtTime(baseFreq * 3, now);
        osc1.type = 'sawtooth';
        osc2.type = 'sawtooth';
        osc3.type = 'sawtooth';

        // Formant filters for vocal character
        formant1.type = 'bandpass';
        formant1.frequency.setValueAtTime(isAccent ? 650 : 1200, now);
        formant1.Q.setValueAtTime(8, now);
        
        formant2.type = 'bandpass';
        formant2.frequency.setValueAtTime(isAccent ? 1100 : 2400, now);
        formant2.Q.setValueAtTime(6, now);

        // Quick attack, moderate decay
        gainNode.gain.setValueAtTime(volume * 0.55, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc1.start(now);
        osc2.start(now);
        osc3.start(now);
        osc1.stop(now + 0.08);
        osc2.stop(now + 0.08);
        osc3.stop(now + 0.08);
        break;
      }
    }
  }, [soundType, masterVolume, metronomeVolume]);

  useEffect(() => {
    if (isPlaying) {
      const context = audioContextRef.current;
      if (!context) return;

      // Reset beat and timing
      setCurrentBeat(0);
      setSubdivisionCounter(0);

      // Calculate interval based on subdivision
      let subdivisionMultiplier = 1;
      if (subdivision === 'eighth') subdivisionMultiplier = 2;
      if (subdivision === 'sixteenth') subdivisionMultiplier = 4;
      
      const intervalMs = (60 / (bpm * subdivisionMultiplier)) * 1000;

      // Play initial beat immediately (beat 1, currentBeat = 0)
      const initialState = useMetronomeStore.getState();
      const isInitialAccent = initialState.accentFirstBeat && (
        initialState.subdivision === 'eighth' || initialState.subdivision === 'sixteenth'
          ? initialState.subdivisionCounter === 0  // Accent on downbeat (every 2nd click for eighth, every 4th for sixteenth)
          : initialState.beatsPerMeasure === 12 
            ? initialState.currentBeat % 3 === 0  // Beats 1, 4, 7, 10 (indices 0, 3, 6, 9)
            : initialState.currentBeat === 0      // Beat 1 only
      );
      playClick(isInitialAccent);
      // Don't increment yet - let UI show beat 1 first

      // Schedule subsequent beats - read fresh state on each tick
      intervalRef.current = window.setInterval(() => {
        // Increment to next beat first
        incrementBeat();
        
        // Then play the new beat
        const state = useMetronomeStore.getState();
        const isAccent = state.accentFirstBeat && (
          state.subdivision === 'eighth' || state.subdivision === 'sixteenth'
            ? state.subdivisionCounter === 0  // Accent on downbeat (every 2nd click for eighth, every 4th for sixteenth)
            : state.beatsPerMeasure === 12 
              ? state.currentBeat % 3 === 0  // Accent on beats 0, 3, 6, 9 (displayed as 1, 4, 7, 10)
              : state.currentBeat === 0      // Accent only on first beat
        );
        
        playClick(isAccent);
      }, intervalMs);
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
  }, [isPlaying, bpm, subdivision, setCurrentBeat, incrementBeat, playClick]);

  return {
    playClick,
  };
};
