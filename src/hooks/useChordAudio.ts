import { useRef, useCallback, useEffect } from 'react';
import type { ChordData } from '@/types/chord';
import { useAudioStore } from '@/stores/audioStore';

// Mobile detection utility
const isMobileBrowser = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Context age threshold for mobile (10 seconds - recreate if older)
const MOBILE_CONTEXT_MAX_AGE_MS = 10000;

// Standard guitar tuning frequencies (E2, A2, D3, G3, B3, E4)
const STRING_FREQUENCIES = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63];
const SEMITONE_RATIO = Math.pow(2, 1 / 12);

function getNoteFrequency(stringIndex: number, fret: number): number {
  return STRING_FREQUENCIES[stringIndex] * Math.pow(SEMITONE_RATIO, fret);
}

function createPluck(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  volume: number,
  outputNode: AudioNode,
) {
  // Oscillator 1: Main tone — triangle wave for warm guitar-like timbre
  const osc1 = ctx.createOscillator();
  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(frequency, startTime);

  // Oscillator 2: Harmonic layer — quiet sine at octave above for brightness
  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(frequency * 2, startTime);

  // Oscillator 3: Sub harmonic — sine at half frequency for body
  const osc3 = ctx.createOscillator();
  osc3.type = 'sine';
  osc3.frequency.setValueAtTime(frequency * 0.5, startTime);

  // Main gain envelope (pluck shape)
  const mainGain = ctx.createGain();
  mainGain.gain.setValueAtTime(0, startTime);
  mainGain.gain.linearRampToValueAtTime(volume * 0.45, startTime + 0.008);       // 8ms attack
  mainGain.gain.exponentialRampToValueAtTime(volume * 0.18, startTime + 0.12);    // 120ms decay
  mainGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);        // fade to silence

  // Harmonic gain envelope (shorter)
  const harmonicGain = ctx.createGain();
  harmonicGain.gain.setValueAtTime(0, startTime);
  harmonicGain.gain.linearRampToValueAtTime(volume * 0.08, startTime + 0.005);   // 5ms attack
  harmonicGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.5); // dies at half duration

  // Sub gain envelope
  const subGain = ctx.createGain();
  subGain.gain.setValueAtTime(0, startTime);
  subGain.gain.linearRampToValueAtTime(volume * 0.12, startTime + 0.01);         // 10ms attack
  subGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.7);   // dies at 70% duration

  // Low-pass filter — softens tone, sweeps down over time
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(Math.min(frequency * 6, 5000), startTime);
  filter.frequency.exponentialRampToValueAtTime(
    Math.min(frequency * 2, 2000),
    startTime + duration * 0.4
  );
  filter.Q.setValueAtTime(1.2, startTime);

  // Routing: all oscillators → individual gains → shared filter → output
  osc1.connect(mainGain);
  osc2.connect(harmonicGain);
  osc3.connect(subGain);

  mainGain.connect(filter);
  harmonicGain.connect(filter);
  subGain.connect(filter);

  filter.connect(outputNode);

  osc1.start(startTime);
  osc2.start(startTime);
  osc3.start(startTime);
  osc1.stop(startTime + duration + 0.05);
  osc2.stop(startTime + duration + 0.05);
  osc3.stop(startTime + duration + 0.05);

  return [osc1, osc2, osc3];
}

export function useChordAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const contextCreatedAtRef = useRef<number>(0);
  const lastPlaybackAtRef = useRef<number>(0);
  const activeOscillators = useRef<OscillatorNode[]>([]);
  const getEffectiveVolume = useAudioStore((s) => s.getEffectiveVolume);

  const getContext = useCallback(async () => {
    const now = Date.now();
    const contextAge = now - contextCreatedAtRef.current;
    const timeSinceLastPlayback = now - lastPlaybackAtRef.current;
    
    // CRITICAL MOBILE FIX: Check for stale context
    // Mobile browsers invalidate AudioContexts after idle, but state might still show 'running'
    const isContextStale = isMobileBrowser && (
      contextAge > MOBILE_CONTEXT_MAX_AGE_MS || 
      timeSinceLastPlayback > MOBILE_CONTEXT_MAX_AGE_MS
    );
    
    if (isContextStale && ctxRef.current && ctxRef.current.state !== 'closed') {
      console.log('⏰ Mobile: AudioContext is stale (age:', contextAge, 'ms, idle:', timeSinceLastPlayback, 'ms) - forcing recreation');
      const oldContext = ctxRef.current;
      ctxRef.current = null;
      oldContext.close().catch(() => {/* ignore cleanup errors */});
    }
    
    // Check if context is suspended or closed
    if (ctxRef.current && ctxRef.current.state === 'suspended') {
      if (isMobileBrowser) {
        console.log('📱 Mobile: AudioContext suspended - creating fresh one synchronously...');
        const oldContext = ctxRef.current;
        ctxRef.current = new AudioContext();
        contextCreatedAtRef.current = Date.now();
        console.log('✅ Mobile: Fresh AudioContext created (state:', ctxRef.current.state, ')');
        oldContext.close().catch(() => {/* ignore cleanup errors */});
        return ctxRef.current;
      } else {
        console.log('🖥️ Desktop: Resuming suspended AudioContext...');
        try {
          await ctxRef.current.resume();
          console.log('✅ Desktop: AudioContext resumed successfully');
          return ctxRef.current;
        } catch (err) {
          console.error('❌ Desktop: Failed to resume AudioContext:', err);
          throw new Error('Audio playback unavailable - context resume failed');
        }
      }
    }
    
    // Create new context if none exists or if closed
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new AudioContext();
      contextCreatedAtRef.current = Date.now();
      console.log('🎵 AudioContext created:', {
        state: ctxRef.current.state,
        sampleRate: ctxRef.current.sampleRate,
        platform: isMobileBrowser ? 'mobile' : 'desktop',
      });
      
      // VALIDATION: Test if context is actually working
      if (ctxRef.current.state !== 'running') {
        console.warn('⚠️ AudioContext created but not in running state:', ctxRef.current.state);
      }
    }
    
    return ctxRef.current;
  }, []);

  const stopCurrent = useCallback(() => {
    activeOscillators.current.forEach((osc) => {
      try { osc.stop(); } catch { /* already stopped */ }
    });
    activeOscillators.current = [];
  }, []);

  const playChord = useCallback(async (chord: ChordData) => {
    const masterVol = getEffectiveVolume();
    if (masterVol === 0) return;

    stopCurrent();
    
    let ctx: AudioContext;
    try {
      ctx = await getContext();
      console.log('🎸 Playing chord:', chord.name, '| Context state:', ctx.state, '| Platform:', isMobileBrowser ? 'mobile' : 'desktop');
    } catch (err) {
      console.error('❌ Cannot play chord - AudioContext unavailable:', err);
      return;
    }
    
    // VALIDATION: Final state check before playback
    if (ctx.state === 'suspended') {
      console.error('❌ AudioContext still suspended after getContext() - attempting emergency resume...');
      try {
        await ctx.resume();
        console.log('✅ Emergency resume successful');
      } catch (resumeErr) {
        console.error('❌ Emergency resume failed:', resumeErr);
        return;
      }
    }
    
    if (ctx.state === 'closed') {
      console.error('❌ AudioContext is closed - cannot play');
      return;
    }
    
    // Update last playback timestamp
    lastPlaybackAtRef.current = Date.now();

    // Master gain: applies volume with boost curve
    // Formula: v^1.2 * 10.0 (+4 dB total from original 6.3)
    const masterGain = ctx.createGain();
    const gain = Math.pow(masterVol, 1.2) * 10.0;
    masterGain.gain.value = gain;
    masterGain.connect(ctx.destination);

    const now = ctx.currentTime + 0.05;
    const strumDelay = 0.035;
    const noteDuration = 2.5;
    const allOscs: OscillatorNode[] = [];

    try {
      // Strum low E to high E (index 0 → 5)
      let strumIndex = 0;
      for (let i = 0; i < 6; i++) {
        const fret = chord.frets[i];
        if (fret === -1) continue;

        const freq = getNoteFrequency(i, fret);
        const vol = 0.3 - i * 0.015;
        const startTime = now + strumIndex * strumDelay;
        const oscs = createPluck(ctx, freq, startTime, noteDuration, vol, masterGain);
        allOscs.push(...oscs);
        strumIndex++;
      }

      activeOscillators.current = allOscs;
      console.log('✅ Chord playback started successfully - oscillators:', allOscs.length);
    } catch (playbackErr) {
      console.error('❌ Error during oscillator creation/playback:', playbackErr);
      // Clean up any created oscillators
      allOscs.forEach(osc => {
        try { osc.stop(); osc.disconnect(); } catch {/* ignore */}
      });
      throw playbackErr;
    }
  }, [getContext, stopCurrent, getEffectiveVolume]);

  // Page Visibility API: Track visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Tab visible - context state:', ctxRef.current?.state);
        // Don't try to resume here - let getContext() handle it on next playback
        // This preserves the user gesture requirement on mobile
      } else if (document.visibilityState === 'hidden') {
        console.log('🙈 Tab hidden - context will likely suspend');
        // Update timestamp to force recreation on next playback
        lastPlaybackAtRef.current = 0;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // CRITICAL FIX: Don't close context on cleanup - it prevents playback after remount
      // Just stop active oscillators
      console.log('🧹 useChordAudio cleanup - stopping oscillators but keeping context alive');
      stopCurrent();
      // Context will be closed when browser tab/window actually closes
    };
  }, [stopCurrent]);

  return { playChord, stopCurrent };
}
