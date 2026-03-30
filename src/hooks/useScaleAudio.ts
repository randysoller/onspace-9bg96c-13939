import { useEffect, useRef, useState } from 'react';
import { NOTE_FREQUENCIES } from '@/constants/scales';

// Mobile detection utility
const isMobileBrowser = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const MOBILE_CONTEXT_MAX_AGE_MS = 10000;

export const useScaleAudio = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const contextCreatedAtRef = useRef<number>(0);
  const lastPlaybackAtRef = useRef<number>(0);
  const activeNodesRef = useRef<{ oscillators: OscillatorNode[]; gains: GainNode[] }>({ oscillators: [], gains: [] });
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    contextCreatedAtRef.current = Date.now();
    console.log('🎵 ScaleAudio: AudioContext created');
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ ScaleAudio: Tab visible - context state:', audioContextRef.current?.state);
      } else if (document.visibilityState === 'hidden') {
        console.log('🙈 ScaleAudio: Tab hidden - marking for recreation');
        lastPlaybackAtRef.current = 0;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      console.log('🧹 ScaleAudio cleanup - keeping context alive');
      // Don't close context on cleanup
    };
  }, []);

  const playNote = (note: string, octave: number = 4, duration: number = 0.5) => {
    const now = Date.now();
    const contextAge = now - contextCreatedAtRef.current;
    const timeSinceLastPlayback = now - lastPlaybackAtRef.current;
    
    const isContextStale = (
      contextAge > MOBILE_CONTEXT_MAX_AGE_MS || 
      timeSinceLastPlayback > MOBILE_CONTEXT_MAX_AGE_MS
    );
    
    if (isContextStale && audioContextRef.current && audioContextRef.current.state !== 'closed') {
      console.log('⏰ ScaleAudio: Context stale - forcing recreation');
      
      // Clean up all active nodes
      activeNodesRef.current.oscillators.forEach(osc => { try { osc.stop(); osc.disconnect(); } catch {} });
      activeNodesRef.current.gains.forEach(gain => { try { gain.disconnect(); } catch {} });
      activeNodesRef.current = { oscillators: [], gains: [] };
      
      const oldContext = audioContextRef.current;
      audioContextRef.current = null;
      
      // Async close in background
      oldContext.close().catch(() => {/* ignore cleanup errors */});
    }
    
    let context = audioContextRef.current;
    if (!context) {
      context = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = context;
      contextCreatedAtRef.current = Date.now();
      console.log('🎵 ScaleAudio: New AudioContext created');
    }

    if (context.state === 'suspended') {
      console.log('⏸️ ScaleAudio: Creating fresh AudioContext...');
      
      // Clean up all active nodes
      activeNodesRef.current.oscillators.forEach(osc => { try { osc.stop(); osc.disconnect(); } catch {} });
      activeNodesRef.current.gains.forEach(gain => { try { gain.disconnect(); } catch {} });
      activeNodesRef.current = { oscillators: [], gains: [] };
      
      const oldContext = context;
      context = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = context;
      contextCreatedAtRef.current = Date.now();
      console.log('✅ ScaleAudio: Fresh AudioContext created');
      
      // Async close in background
      oldContext.close().catch(() => {/* ignore cleanup errors */});
    }
    
    lastPlaybackAtRef.current = Date.now();

    const baseFreq = NOTE_FREQUENCIES[note];
    if (!baseFreq) return;

    const frequency = baseFreq * Math.pow(2, octave);

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);

    // Use default volume of 0.5 for scale practice
    const volume = 0.5;
    gainNode.gain.setValueAtTime(0, context.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, context.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + duration);

    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + duration);
    
    // Track nodes for cleanup
    activeNodesRef.current.oscillators.push(oscillator);
    activeNodesRef.current.gains.push(gainNode);
    
    // Auto-cleanup after playback
    setTimeout(() => {
      try { oscillator.disconnect(); } catch {}
      try { gainNode.disconnect(); } catch {}
      activeNodesRef.current.oscillators = activeNodesRef.current.oscillators.filter(o => o !== oscillator);
      activeNodesRef.current.gains = activeNodesRef.current.gains.filter(g => g !== gainNode);
    }, (duration + 0.1) * 1000);
  };

  const playScale = async (rootNote: string, scaleIntervals: number[], bpm: number = 120) => {
    const context = audioContextRef.current;
    if (!context || isPlaying) return;

    setIsPlaying(true);

    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const rootIndex = noteNames.indexOf(rootNote);
    const noteDuration = 60 / bpm; // Duration per note in seconds

    for (let i = 0; i < scaleIntervals.length; i++) {
      const noteIndex = (rootIndex + scaleIntervals[i]) % 12;
      const noteName = noteNames[noteIndex];
      
      playNote(noteName, 4, noteDuration * 0.9);
      await new Promise(resolve => setTimeout(resolve, noteDuration * 1000));
    }

    // Play root note at end
    playNote(rootNote, 5, noteDuration * 1.5);
    await new Promise(resolve => setTimeout(resolve, noteDuration * 1500));

    setIsPlaying(false);
  };

  const stopScale = () => {
    setIsPlaying(false);
  };

  return {
    playNote,
    playScale,
    stopScale,
    isPlaying,
  };
};
