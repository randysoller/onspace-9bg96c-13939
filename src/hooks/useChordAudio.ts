/**
 * Chord Audio Playback Hook - Synthesized guitar chord pluck
 * 
 * Synthesis Architecture:
 * - 3 oscillators per string (primary triangle, 2x harmonic sine, 0.5x sub sine)
 * - Per-string envelope: 8ms attack, 120ms decay, 2.5s sustain-to-silence
 * - Low-pass filter: starts at min(freq*6, 5000), decays to min(freq*2, 2000)
 * - 35ms strum delay between strings (low E → high E)
 * - Volume per string: 0.3 - stringIndex * 0.015
 * - Master gain: volume^1.2 * 8
 */

import { useCallback, useRef } from 'react';
import { useAudioStore } from '@/stores/audioStore';
import type { ChordData } from '@/types/chord';

const STRING_FREQUENCIES = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63]; // E2, A2, D3, G3, B3, E4
const SEMITONE_RATIO = Math.pow(2, 1 / 12);
const STRUM_DELAY = 0.035; // 35ms between strings

export function useChordAudio() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeNodesRef = useRef<(OscillatorNode | GainNode)[]>([]);
  
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ sampleRate: 48000 });
    }
    return audioContextRef.current;
  }, []);
  
  const stopCurrent = useCallback(() => {
    activeNodesRef.current.forEach(node => {
      try {
        if ('stop' in node) {
          node.stop();
        }
        node.disconnect();
      } catch {}
    });
    activeNodesRef.current = [];
  }, []);
  
  const playChord = useCallback((chord: ChordData) => {
    stopCurrent();
    
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    const effectiveVolume = useAudioStore.getState().getEffectiveVolume();
    const masterGain = Math.pow(effectiveVolume, 1.2) * 8;
    
    const now = ctx.currentTime;
    const nodes: (OscillatorNode | GainNode)[] = [];
    
    for (let i = 0; i < 6; i++) {
      const fret = chord.frets[i];
      if (fret === null || fret === -1) continue; // Muted string
      
      const freq = STRING_FREQUENCIES[i] * Math.pow(SEMITONE_RATIO, fret);
      const startTime = now + i * STRUM_DELAY;
      const stringVolume = 0.3 - i * 0.015;
      
      // Create 3 oscillators per string
      const primary = ctx.createOscillator();
      const harmonic = ctx.createOscillator();
      const sub = ctx.createOscillator();
      
      primary.type = 'triangle';
      harmonic.type = 'sine';
      sub.type = 'sine';
      
      primary.frequency.value = freq;
      harmonic.frequency.value = freq * 2;
      sub.frequency.value = freq * 0.5;
      
      // Per-string gain
      const stringGain = ctx.createGain();
      stringGain.gain.value = 0;
      
      // Attack: linear ramp to volume in 8ms
      stringGain.gain.setValueAtTime(0, startTime);
      stringGain.gain.linearRampToValueAtTime(stringVolume * masterGain, startTime + 0.008);
      
      // Decay: exponential to 18% in 120ms
      stringGain.gain.setValueAtTime(stringVolume * masterGain, startTime + 0.008);
      stringGain.gain.exponentialRampToValueAtTime(stringVolume * masterGain * 0.18, startTime + 0.128);
      
      // Sustain-to-silence: exponential to 0.001 over 2.5s
      stringGain.gain.exponentialRampToValueAtTime(0.001, startTime + 2.628);
      
      // Low-pass filter
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.Q.value = 0.7;
      
      const filterStart = Math.min(freq * 6, 5000);
      const filterEnd = Math.min(freq * 2, 2000);
      
      filter.frequency.setValueAtTime(filterStart, startTime);
      filter.frequency.exponentialRampToValueAtTime(filterEnd, startTime + 2.628);
      
      // Mix oscillators
      const mixGain = ctx.createGain();
      mixGain.gain.value = 1;
      
      const harmonicGain = ctx.createGain();
      harmonicGain.gain.value = 0.08;
      
      const subGain = ctx.createGain();
      subGain.gain.value = 0.12;
      
      primary.connect(mixGain);
      harmonic.connect(harmonicGain).connect(mixGain);
      sub.connect(subGain).connect(mixGain);
      
      mixGain.connect(filter);
      filter.connect(stringGain);
      stringGain.connect(ctx.destination);
      
      primary.start(startTime);
      harmonic.start(startTime);
      sub.start(startTime);
      
      primary.stop(startTime + 2.7);
      harmonic.stop(startTime + 2.7);
      sub.stop(startTime + 2.7);
      
      nodes.push(primary, harmonic, sub, stringGain, mixGain, harmonicGain, subGain);
    }
    
    activeNodesRef.current = nodes;
  }, [getAudioContext, stopCurrent]);
  
  return {
    playChord,
    stopCurrent,
  };
}
