
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
  
  // Voice counting with advanced latency compensation
  const voiceUtterancesRef = useRef<Map<number, SpeechSynthesisUtterance>>(new Map());
  // Mobile detection for platform-specific latency estimates
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const initialLatencyEstimate = isMobile ? 0.050 : 0.090; // 50ms mobile, 90ms desktop
  const speechLatencyOffsetRef = useRef<number>(initialLatencyEstimate);
  const latencyHistoryRef = useRef<number[]>([]); // Track last 10 measurements for predictive modeling
  const lastSpeechStartTimeRef = useRef<number>(0);
  const lastScheduledTimeRef = useRef<number>(0);
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);
  const optimalVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const isVoiceCalibratedRef = useRef<boolean>(false);
  const calibrationAttemptsRef = useRef<number>(0);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    speechSynthRef.current = window.speechSynthesis;
    
    // Select optimal voice for fastest response
    const selectOptimalVoice = () => {
      const voices = speechSynthRef.current?.getVoices() || [];
      
      // Priority: Local > English > Fast-sounding names
      // Local voices typically have lower latency than network voices
      const preferredVoices = voices.filter(v => 
        v.localService && 
        v.lang.startsWith('en')
      );
      
      if (preferredVoices.length > 0) {
        // Prefer voices with "compact" or "premium" in name (typically faster)
        const fastVoice = preferredVoices.find(v => 
          v.name.toLowerCase().includes('compact') || 
          v.name.toLowerCase().includes('premium') ||
          v.name.toLowerCase().includes('samantha') // macOS fast voice
        ) || preferredVoices[0];
        
        optimalVoiceRef.current = fastVoice;
        console.log(`🎯 Selected optimal voice: ${fastVoice.name} (local: ${fastVoice.localService})`);
      } else if (voices.length > 0) {
        // Fallback to any English voice
        const fallbackVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
        optimalVoiceRef.current = fallbackVoice;
        console.log(`⚠️ Using fallback voice: ${fallbackVoice.name}`);
      }
    };

    // Pre-create and cache SpeechSynthesisUtterance objects for numbers 1-12
    // This reduces per-call overhead and improves timing consistency
    const initVoiceUtterances = () => {
      console.log('🎤 Initializing voice count utterances...');
      
      // Select best voice first
      selectOptimalVoice();
      
      for (let i = 1; i <= 12; i++) {
        const utterance = new SpeechSynthesisUtterance(i.toString());
        
        // Configure utterance for minimal latency and punchy delivery
        utterance.rate = 1.3;     // Faster for more percussive delivery (was 1.1)
        utterance.pitch = 1.05;   // Slightly higher pitch for clarity
        utterance.volume = 1.0;   // Full volume (controlled by audio store)
        utterance.lang = 'en-US'; // Explicit language for consistency
        
        // Use optimal voice if available
        if (optimalVoiceRef.current) {
          utterance.voice = optimalVoiceRef.current;
        }
        
        // Attach timing measurement callback with predictive modeling
        utterance.addEventListener('start', () => {
          const actualStartTime = performance.now();
          const scheduledTime = lastScheduledTimeRef.current;
          const measuredLatency = (actualStartTime - scheduledTime) / 1000; // Convert to seconds
          
          // Predictive latency modeling with historical data
          if (scheduledTime > 0 && measuredLatency > 0 && measuredLatency < 1.0) {
            // Add to history (keep last 10 measurements)
            latencyHistoryRef.current.push(measuredLatency);
            if (latencyHistoryRef.current.length > 10) {
              latencyHistoryRef.current.shift();
            }
            
            // Conservative calibration phase: gradual learning over 8 measurements
            calibrationAttemptsRef.current++;
            const isCalibrating = calibrationAttemptsRef.current <= 8;
            
            if (isCalibrating) {
              // During calibration: use conservative weighted average (70% old, 30% new)
              // This prevents overcorrection from single measurements
              speechLatencyOffsetRef.current = 
                speechLatencyOffsetRef.current * 0.70 + measuredLatency * 0.30;
              
              console.log(`🎯 Calibration ${calibrationAttemptsRef.current}/8 | Measured: ${(measuredLatency * 1000).toFixed(1)}ms | Offset: ${(speechLatencyOffsetRef.current * 1000).toFixed(1)}ms | Platform: ${isMobile ? 'Mobile' : 'Desktop'}`);
              
              if (calibrationAttemptsRef.current === 8) {
                isVoiceCalibratedRef.current = true;
                console.log(`✅ Voice calibration complete! Final offset: ${(speechLatencyOffsetRef.current * 1000).toFixed(1)}ms`);
              }
            } else {
              // After calibration: use very conservative EMA with outlier rejection
              // Reject measurements that differ by more than 40% from current offset
              const deviation = Math.abs(measuredLatency - speechLatencyOffsetRef.current) / speechLatencyOffsetRef.current;
              
              if (deviation < 0.4) {
                // Good measurement - use 85/15 EMA (very stable)
                speechLatencyOffsetRef.current = 
                  speechLatencyOffsetRef.current * 0.85 + measuredLatency * 0.15;
              } else {
                console.log(`⚠️ Outlier rejected: ${(measuredLatency * 1000).toFixed(1)}ms (deviation: ${(deviation * 100).toFixed(0)}%)`);
              }
            }
            
            if (calibrationAttemptsRef.current % 4 === 0) {
              console.log(`📊 Offset: ${(speechLatencyOffsetRef.current * 1000).toFixed(1)}ms | History: [${latencyHistoryRef.current.map(l => (l * 1000).toFixed(0)).join(', ')}]ms`);
            }
          }
          
          lastSpeechStartTimeRef.current = actualStartTime;
        });
        
        voiceUtterancesRef.current.set(i, utterance);
      }
      
      console.log(`✅ Created ${voiceUtterancesRef.current.size} voice utterances with ${optimalVoiceRef.current?.name || 'default voice'}`);
      console.log(`📱 Platform: ${isMobile ? 'Mobile' : 'Desktop'} | Initial latency estimate: ${(initialLatencyEstimate * 1000).toFixed(1)}ms`);
      
      // Simple pre-warm with single silent utterance to initialize TTS engine
      // No pre-calibration - let actual metronome beats calibrate timing
      if (speechSynthRef.current) {
        console.log('🔥 Pre-warming speech synthesis engine...');
        const warmupUtterance = new SpeechSynthesisUtterance('1');
        warmupUtterance.volume = 0.01; // Nearly silent
        warmupUtterance.rate = 2.0;    // Fast
        warmupUtterance.lang = 'en-US';
        
        if (optimalVoiceRef.current) {
          warmupUtterance.voice = optimalVoiceRef.current;
        }
        
        speechSynthRef.current.speak(warmupUtterance);
        console.log('✅ TTS engine initialized - timing will calibrate during playback');
      }
    };
    
    // Initialize voices when available
    if (speechSynthRef.current) {
      // Wait for voices to load (async in some browsers)
      if (speechSynthRef.current.getVoices().length > 0) {
        initVoiceUtterances();
      } else {
        speechSynthRef.current.addEventListener('voiceschanged', initVoiceUtterances, { once: true });
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      audioContextRef.current?.close();
    };
  }, []);

  const playClick = useCallback((isAccent: boolean = false, beatNumber?: number) => {
    const context = audioContextRef.current;
    if (!context) return;

    const now = context.currentTime;
    const baseVolume = masterVolume * metronomeVolume;
    const volume = isAccent ? baseVolume * 1.0 : baseVolume * 0.65;

    // Handle voice counting with advanced latency compensation
    if (soundType === 'voiceCount') {
      if (beatNumber !== undefined && speechSynthRef.current) {
        const utterance = voiceUtterancesRef.current.get(beatNumber);
        
        if (utterance) {
          // Calculate total system latency:
          // 1. Web Audio API processing latency (baseLatency + outputLatency)
          // 2. Empirically measured speech synthesis latency (adaptive with predictive modeling)
          const audioLatency = (context.baseLatency || 0) + (context.outputLatency || 0);
          
          // Predictive compensation: use median of recent measurements if available
          let predictedSpeechLatency = speechLatencyOffsetRef.current;
          if (latencyHistoryRef.current.length >= 3) {
            const sortedHistory = [...latencyHistoryRef.current].sort((a, b) => a - b);
            const medianIndex = Math.floor(sortedHistory.length / 2);
            predictedSpeechLatency = sortedHistory[medianIndex]; // Median is more robust to outliers
          }
          
          // Per-number latency adjustment based on word length and syllables:
          // Shorter words process faster and need less latency compensation
          // "One" (1 syllable, very short) - needs 30% less compensation
          // "Four" (1 syllable, short) - needs 15% less compensation  
          // Longer numbers like "seven" (2 syllables) or "eleven" (3 syllables) use full compensation
          const getNumberAdjustment = (num: number): number => {
            if (num === 1) return 0.70;  // "One" - very short
            if (num === 4) return 0.85;  // "Four" - short
            return 1.0;                   // All other numbers
          };
          const numberAdjustment = getNumberAdjustment(beatNumber);
          const totalLatency = audioLatency + (predictedSpeechLatency * numberAdjustment);
          
          // Advanced scheduling: calculate precise trigger time
          // We want speech to START at audioContext.currentTime (the beat)
          // So we need to trigger it earlier by totalLatency
          const beatTime = now; // When the beat should sound
          const triggerTime = beatTime - totalLatency; // When to call speak()
          const currentTime = context.currentTime;
          const msUntilSpeech = Math.max(0, (triggerTime - currentTime) * 1000);
          
          // Log during calibration or every 8th beat
          if (!isVoiceCalibratedRef.current || beatNumber % 8 === 1) {
            console.log(`🎤 Beat ${beatNumber} | Audio: ${(audioLatency * 1000).toFixed(1)}ms | Speech: ${(predictedSpeechLatency * 1000).toFixed(1)}ms | Adjust: ${(numberAdjustment * 100).toFixed(0)}% | Total: ${(totalLatency * 1000).toFixed(1)}ms | Trigger in: ${msUntilSpeech.toFixed(1)}ms | ${isMobile ? '📱' : '💻'}`);
          }
          
          // Use high-precision setTimeout for scheduling
          setTimeout(() => {
            if (speechSynthRef.current) {
              // Record when we trigger speech for latency measurement
              lastScheduledTimeRef.current = performance.now();
              
              // Cancel any pending speech to avoid overlap
              speechSynthRef.current.cancel();
              
              // Speak the number
              speechSynthRef.current.speak(utterance);
            }
          }, msUntilSpeech);
        } else {
          console.warn(`⚠️ No utterance cached for beat ${beatNumber}`);
        }
      }
      return;
    }

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

        // Generate percussive attack with woody body resonance
        for (let i = 0; i < bufferSize; i++) {
          const t = i / context.sampleRate;
          const attack = Math.exp(-i / (context.sampleRate * 0.003)); // Sharp attack
          const bodyDecay = Math.exp(-i / (context.sampleRate * 0.018)); // Hollow body resonance
          const noise = (Math.random() * 2 - 1) * 0.4;
          
          // Resonant frequencies for wood character
          const fundamental = isAccent ? 920 : 720;
          const harmonic2 = fundamental * 2.1;  // Slightly inharmonic for wood
          const harmonic3 = fundamental * 3.3;
          const harmonic4 = fundamental * 4.8;
          
          const res1 = Math.sin(t * fundamental * 6.28) * 0.5;
          const res2 = Math.sin(t * harmonic2 * 6.28) * 0.25;
          const res3 = Math.sin(t * harmonic3 * 6.28) * 0.12;
          const res4 = Math.sin(t * harmonic4 * 6.28) * 0.06;
          
          // Combine attack noise with sustained resonance
          const signal = (noise * attack * 0.6) + ((res1 + res2 + res3 + res4) * bodyDecay);
          
          dataL[i] = signal;
          dataR[i] = signal * 0.97; // Slight stereo variation
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
        
        // Peaking filter for woody mid-range character
        filter2.type = 'peaking';
        filter2.frequency.setValueAtTime(isAccent ? 1800 : 1400, now);
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

        gainNode.gain.setValueAtTime(volume * 0.95, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        bufferSource.start(now);
        bufferSource.stop(now + 0.08);
        break;
      }

      case 'hiHat': {
        // Realistic closed hi-hat with "shh" noise character and 500ms sustain
        const duration = 0.5; // 500ms sustain
        const bufferSize = context.sampleRate * duration;
        const buffer = context.createBuffer(2, bufferSize, context.sampleRate);
        const dataL = buffer.getChannelData(0);
        const dataR = buffer.getChannelData(1);

        // Generate noise-dominated "shh" sound with subtle metallic shimmer
        for (let i = 0; i < bufferSize; i++) {
          const t = i / context.sampleRate;
          const attack = Math.exp(-i / (context.sampleRate * 0.002)); // Very sharp attack
          const sustain = Math.exp(-i / (context.sampleRate * (isAccent ? 0.15 : 0.12))); // Long sustain with gradual decay
          const noise = Math.random() * 2 - 1;
          
          // Subtle high-frequency metallic shimmer (reduced amplitude)
          const freq1 = 8500;
          const freq2 = 11000;
          const freq3 = 14500;
          
          const shimmer1 = Math.sin(t * freq1 * 6.28) * 0.08;
          const shimmer2 = Math.sin(t * freq2 * 6.28) * 0.06;
          const shimmer3 = Math.sin(t * freq3 * 6.28) * 0.04;
          
          // Noise-dominated with subtle shimmer
          const signal = (noise * 0.85 * attack) + ((shimmer1 + shimmer2 + shimmer3) * sustain * 0.4);
          
          dataL[i] = signal;
          dataR[i] = signal * 0.88 + (Math.random() * 2 - 1) * 0.12 * sustain; // Wide stereo noise
        }

        const bufferSource = context.createBufferSource();
        const highpass = context.createBiquadFilter();
        const highShelf = context.createBiquadFilter();
        const gainNode = context.createGain();

        bufferSource.buffer = buffer;
        
        // High-pass to emphasize high frequencies
        highpass.type = 'highpass';
        highpass.frequency.setValueAtTime(7000, now);
        highpass.Q.setValueAtTime(0.5, now);
        
        // Boost ultra-high frequencies for more "shh"
        highShelf.type = 'highshelf';
        highShelf.frequency.setValueAtTime(10000, now);
        highShelf.gain.setValueAtTime(6, now);

        bufferSource.connect(highpass);
        highpass.connect(highShelf);
        highShelf.connect(gainNode);
        gainNode.connect(context.destination);

        // Accent beats are 15% louder than regular beats
        const hiHatVolume = isAccent ? volume * 0.68 * 1.15 : volume * 0.68;
        gainNode.gain.setValueAtTime(hiHatVolume, now);
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
      const initialBeatNumber = initialState.currentBeat + 1;
      playClick(isInitialAccent, initialBeatNumber);
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
        const beatNumber = state.currentBeat + 1;
        
        playClick(isAccent, beatNumber);
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
