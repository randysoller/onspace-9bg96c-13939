import { useRef, useCallback, useEffect } from 'react';
import type { ChordData } from '@/types/chord';

// Mobile detection utility
const isMobileBrowser = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

const OPEN_STRING_MIDI = [40, 45, 50, 55, 59, 64];
// E2=40, A2=45, D3=50, G3=55, B3=59, E4=64

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function useReferenceTone() {
  const contextRef = useRef<AudioContext | null>(null);
  const activeNodesRef = useRef<{ oscs: OscillatorNode[]; master: GainNode } | null>(null);
  const isPlayingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopTone = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    const nodes = activeNodesRef.current;
    const ctx = contextRef.current;
    if (!nodes || !ctx) { isPlayingRef.current = false; return; }

    const now = ctx.currentTime;
    try {
      nodes.master.gain.cancelScheduledValues(now);
      nodes.master.gain.setValueAtTime(nodes.master.gain.value, now);
      nodes.master.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    } catch {}

    setTimeout(() => {
      nodes.oscs.forEach(o => { try { o.stop(); o.disconnect(); } catch {} });
      try { nodes.master.disconnect(); } catch {}
      activeNodesRef.current = null;
      isPlayingRef.current = false;
    }, 300);
  }, []);

  const playChordTone = useCallback(async (chord: ChordData, duration = 2.5) => {
    if (isPlayingRef.current) stopTone();

    let ctx = contextRef.current ?? new AudioContext();
    contextRef.current = ctx;
    
    // MOBILE FIX: On mobile, close suspended context and create fresh one
    if (ctx.state === 'suspended') {
      if (isMobileBrowser) {
        console.log('📱 ReferenceTone Mobile: Closing suspended AudioContext...');
        try {
          await ctx.close();
          ctx = new AudioContext();
          contextRef.current = ctx;
          console.log('✅ ReferenceTone Mobile: Fresh AudioContext created');
        } catch (err) {
          console.error('❌ ReferenceTone Mobile: Failed to recreate AudioContext:', err);
          return;
        }
      } else {
        console.log('🖥️ ReferenceTone Desktop: Resuming AudioContext...');
        try {
          await ctx.resume();
          console.log('✅ ReferenceTone Desktop: AudioContext resumed');
        } catch (err) {
          console.error('❌ ReferenceTone Desktop: Failed to resume:', err);
          return;
        }
      }
    }

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.18;
    masterGain.connect(ctx.destination);

    const oscs: OscillatorNode[] = [];
    const now = ctx.currentTime;

    // Collect active strings
    const activeStrings: { midi: number; stringIdx: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const fret = chord.frets[i];
      if (fret < 0) continue;
      activeStrings.push({ midi: OPEN_STRING_MIDI[i] + fret, stringIdx: i });
    }

    if (activeStrings.length === 0) return;

    // Volume balancing: louder per string when fewer strings active
    const perStringGain = Math.min(0.9, 1.2 / activeStrings.length);

    activeStrings.forEach(({ midi, stringIdx }, idx) => {
      const freq = midiToFreq(midi);

      // Stagger: 15ms per active string (strum simulation)
      const strumDelay = idx * 0.015;
      const startTime = now + strumDelay;

      // Primary oscillator: triangle wave
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      // Natural detuning per string for realism
      osc.detune.value = (stringIdx - 2.5) * 1.2;

      const env = ctx.createGain();
      env.gain.setValueAtTime(0.001, startTime);
      env.gain.exponentialRampToValueAtTime(perStringGain, startTime + 0.04);      // 40ms attack
      env.gain.setValueAtTime(perStringGain, startTime + 0.04);
      env.gain.exponentialRampToValueAtTime(perStringGain * 0.6, startTime + duration * 0.4);  // sustain decay
      env.gain.exponentialRampToValueAtTime(0.001, startTime + duration);          // release

      osc.connect(env);
      env.connect(masterGain);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.1);

      oscs.push(osc);

      // 2nd harmonic: quiet sine at octave above for warmth
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = freq * 2;
      osc2.detune.value = (stringIdx - 2.5) * 0.8;

      const env2 = ctx.createGain();
      env2.gain.setValueAtTime(0.001, startTime);
      env2.gain.exponentialRampToValueAtTime(perStringGain * 0.15, startTime + 0.04);  // 15% of main volume
      env2.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.7);       // dies at 70% duration

      osc2.connect(env2);
      env2.connect(masterGain);
      osc2.start(startTime);
      osc2.stop(startTime + duration + 0.1);

      oscs.push(osc2);
    });

    activeNodesRef.current = { oscs, master: masterGain };
    isPlayingRef.current = true;

    // Auto-cleanup timer
    timeoutRef.current = setTimeout(() => {
      activeNodesRef.current = null;
      isPlayingRef.current = false;
      timeoutRef.current = null;
    }, (duration + 0.3) * 1000);
  }, [stopTone]);

  // Page Visibility API: Resume AudioContext when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && contextRef.current) {
        if (contextRef.current.state === 'suspended') {
          console.log('👁️ ReferenceTone: Tab visible - resuming AudioContext...');
          contextRef.current.resume()
            .then(() => console.log('✅ ReferenceTone: AudioContext resumed on visibility change'))
            .catch((err) => console.error('❌ ReferenceTone: Failed to resume on visibility change:', err));
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Cleanup: Stop tone and close context
      stopTone();
      if (contextRef.current && contextRef.current.state !== 'closed') {
        contextRef.current.close();
      }
    };
  }, [stopTone]);

  return { playChordTone, stopTone, isPlaying: isPlayingRef };
}
