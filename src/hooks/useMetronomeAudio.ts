import { useEffect, useRef, useCallback } from 'react';
import { useMetronomeStore } from '@/stores/metronomeStore';
import { useAudioStore } from '@/stores/audioStore';
import { useVoiceSynthesisLatency } from './useVoiceSynthesisLatency';
import {
  generateClickSound,
  generateWoodBlockSound,
  generateHiHatSound,
  generateSideStickSound,
} from '@/lib/audio/metronome-sounds';

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
  
  // Voice synthesis latency compensation
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const { speakNumber } = useVoiceSynthesisLatency({ isMobile });

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    
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

    // Handle voice counting
    if (soundType === 'voiceCount' && beatNumber !== undefined) {
      speakNumber(beatNumber, context, now);
      return;
    }

    // Handle percussion sounds
    switch (soundType) {
      case 'click':
        generateClickSound(context, isAccent, volume, now);
        break;
      case 'woodBlock':
        generateWoodBlockSound(context, isAccent, volume, now);
        break;
      case 'hiHat':
        generateHiHatSound(context, isAccent, volume, now);
        break;
      case 'sideStick':
        generateSideStickSound(context, isAccent, volume, now);
        break;
    }
  }, [soundType, masterVolume, metronomeVolume, speakNumber]);

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
          ? initialState.subdivisionCounter === 0
          : initialState.beatsPerMeasure === 12 
            ? initialState.currentBeat % 3 === 0
            : initialState.currentBeat === 0
      );
      const initialBeatNumber = initialState.currentBeat + 1;
      playClick(isInitialAccent, initialBeatNumber);

      // Schedule subsequent beats
      intervalRef.current = window.setInterval(() => {
        incrementBeat();
        
        const state = useMetronomeStore.getState();
        const isAccent = state.accentFirstBeat && (
          state.subdivision === 'eighth' || state.subdivision === 'sixteenth'
            ? state.subdivisionCounter === 0
            : state.beatsPerMeasure === 12 
              ? state.currentBeat % 3 === 0
              : state.currentBeat === 0
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
