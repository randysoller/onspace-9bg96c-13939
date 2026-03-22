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
    subdivision,
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
    const baseVolume = masterVolume * metronomeVolume;
    const volume = isAccent ? baseVolume * 1.0 : baseVolume * 0.65;

    switch (soundType) {
      case 'click': {
        // Classic mechanical metronome click - sharp transient with body resonance
        const oscillator1 = context.createOscillator();
        const oscillator2 = context.createOscillator();
        const gainNode = context.createGain();
        const filter = context.createBiquadFilter();

        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(filter);
        filter.connect(context.destination);

        // Accent click is higher and brighter
        oscillator1.frequency.setValueAtTime(isAccent ? 2400 : 1800, now);
        oscillator2.frequency.setValueAtTime(isAccent ? 3200 : 2400, now);
        oscillator1.type = 'square';
        oscillator2.type = 'square';

        // Bandpass filter for mechanical character
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(isAccent ? 2800 : 2000, now);
        filter.Q.setValueAtTime(3.0, now);

        // Sharp attack, quick decay
        gainNode.gain.setValueAtTime(volume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

        oscillator1.start(now);
        oscillator2.start(now);
        oscillator1.stop(now + 0.03);
        oscillator2.stop(now + 0.03);
        break;
      }

      case 'woodBlock': {
        // Authentic wood block - percussive resonant tone with noise attack
        const bufferSize = context.sampleRate * 0.06;
        const buffer = context.createBuffer(2, bufferSize, context.sampleRate);
        const dataL = buffer.getChannelData(0);
        const dataR = buffer.getChannelData(1);

        // Generate noise attack with body resonance
        for (let i = 0; i < bufferSize; i++) {
          const decay = Math.exp(-i / (context.sampleRate * 0.012));
          const noise = (Math.random() * 2 - 1) * 0.4;
          
          // Add resonant frequency for wood character
          const freq = isAccent ? 850 : 650;
          const resonance = Math.sin((i / context.sampleRate) * freq * 6.28) * 0.6;
          
          dataL[i] = (noise + resonance) * decay;
          dataR[i] = (noise + resonance) * decay;
        }

        const bufferSource = context.createBufferSource();
        const filter1 = context.createBiquadFilter();
        const filter2 = context.createBiquadFilter();
        const gainNode = context.createGain();

        bufferSource.buffer = buffer;
        
        // Bandpass for fundamental resonance
        filter1.type = 'bandpass';
        filter1.frequency.setValueAtTime(isAccent ? 850 : 650, now);
        filter1.Q.setValueAtTime(8, now);
        
        // High-pass to remove low mud
        filter2.type = 'highpass';
        filter2.frequency.setValueAtTime(300, now);

        bufferSource.connect(filter1);
        filter1.connect(filter2);
        filter2.connect(gainNode);
        gainNode.connect(context.destination);

        gainNode.gain.setValueAtTime(volume * 0.9, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        bufferSource.start(now);
        bufferSource.stop(now + 0.06);
        break;
      }

      case 'hiHat': {
        // Authentic closed hi-hat - metallic sizzle with sharp attack
        const bufferSize = context.sampleRate * (isAccent ? 0.12 : 0.08);
        const buffer = context.createBuffer(2, bufferSize, context.sampleRate);
        const dataL = buffer.getChannelData(0);
        const dataR = buffer.getChannelData(1);

        // Generate metallic noise with multiple frequency components
        for (let i = 0; i < bufferSize; i++) {
          const decay = Math.exp(-i / (context.sampleRate * (isAccent ? 0.03 : 0.02)));
          const noise = Math.random() * 2 - 1;
          
          // Add metallic harmonics
          const metal1 = Math.sin((i / context.sampleRate) * 8500 * 6.28) * 0.3;
          const metal2 = Math.sin((i / context.sampleRate) * 11000 * 6.28) * 0.2;
          
          dataL[i] = (noise * 0.7 + metal1 + metal2) * decay;
          dataR[i] = (noise * 0.7 + metal1 * 0.9 + metal2 * 1.1) * decay; // Slight stereo difference
        }

        const bufferSource = context.createBufferSource();
        const highpass = context.createBiquadFilter();
        const bandpass = context.createBiquadFilter();
        const gainNode = context.createGain();

        bufferSource.buffer = buffer;
        
        // High-pass for metallic character
        highpass.type = 'highpass';
        highpass.frequency.setValueAtTime(7000, now);
        highpass.Q.setValueAtTime(0.7, now);
        
        // Bandpass for sizzle resonance
        bandpass.type = 'bandpass';
        bandpass.frequency.setValueAtTime(9500, now);
        bandpass.Q.setValueAtTime(2.0, now);

        bufferSource.connect(highpass);
        highpass.connect(bandpass);
        bandpass.connect(gainNode);
        gainNode.connect(context.destination);

        gainNode.gain.setValueAtTime(volume * 0.75, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + (isAccent ? 0.12 : 0.08));

        bufferSource.start(now);
        bufferSource.stop(now + (isAccent ? 0.12 : 0.08));
        break;
      }

      case 'sideStick': {
        // Authentic side stick - short, sharp, woody transient
        const bufferSize = context.sampleRate * 0.025;
        const buffer = context.createBuffer(2, bufferSize, context.sampleRate);
        const dataL = buffer.getChannelData(0);
        const dataR = buffer.getChannelData(1);

        // Generate sharp transient with resonance
        for (let i = 0; i < bufferSize; i++) {
          const decay = Math.exp(-i / (context.sampleRate * 0.005));
          const noise = (Math.random() * 2 - 1) * 0.6;
          
          // Add click resonance
          const freq = isAccent ? 1200 : 950;
          const click = Math.sin((i / context.sampleRate) * freq * 6.28) * 0.4;
          
          dataL[i] = (noise + click) * decay;
          dataR[i] = (noise + click) * decay;
        }

        const bufferSource = context.createBufferSource();
        const filter = context.createBiquadFilter();
        const gainNode = context.createGain();

        bufferSource.buffer = buffer;
        
        // Bandpass for stick character
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(isAccent ? 1200 : 950, now);
        filter.Q.setValueAtTime(4, now);

        bufferSource.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(context.destination);

        gainNode.gain.setValueAtTime(volume * 0.85, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

        bufferSource.start(now);
        bufferSource.stop(now + 0.025);
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

  const scheduleBeat = useCallback(() => {
    const context = audioContextRef.current;
    if (!context) return;

    const now = context.currentTime;
    
    // Calculate interval based on subdivision
    let subdivisionMultiplier = 1;
    if (subdivision === 'eighth') subdivisionMultiplier = 2;
    if (subdivision === 'sixteenth') subdivisionMultiplier = 4;
    
    const interval = 60 / (bpm * subdivisionMultiplier);

    // Schedule next beat
    if (nextBeatTimeRef.current <= now) {
      nextBeatTimeRef.current = now + interval;
    }

    // Accent logic based on time signature:
    // - 12/8: accent on beats 1, 4, 7, 10 (0-indexed: 0, 3, 6, 9)
    // - All others: accent on beat 1 (0-indexed: 0)
    const isAccent = accentFirstBeat && (
      beatsPerMeasure === 12 
        ? currentBeat % 3 === 0  // Every 3rd beat starting from 0
        : currentBeat === 0      // Only first beat
    );
    playClick(isAccent);
    
    // Increment beat for next time
    incrementBeat();
  }, [bpm, beatsPerMeasure, currentBeat, accentFirstBeat, subdivision, playClick, incrementBeat]);

  useEffect(() => {
    if (isPlaying) {
      const context = audioContextRef.current;
      if (!context) return;

      // Reset beat and timing
      setCurrentBeat(0);
      nextBeatTimeRef.current = context.currentTime;

      // Initial beat
      scheduleBeat();

      // Calculate interval based on subdivision
      let subdivisionMultiplier = 1;
      if (subdivision === 'eighth') subdivisionMultiplier = 2;
      if (subdivision === 'sixteenth') subdivisionMultiplier = 4;
      
      // Schedule subsequent beats
      const interval = (60 / (bpm * subdivisionMultiplier)) * 1000; // Convert to milliseconds
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
  }, [isPlaying, bpm, subdivision, scheduleBeat, setCurrentBeat]);

  return {
    playClick,
  };
};
