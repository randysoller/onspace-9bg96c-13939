/**
 * Metronome percussion sound generators using Web Audio API
 * Each generator creates synthesized percussion sounds with accent variations
 * Optimized for musical timing and realistic acoustic characteristics
 */

import type { SoundGeneratorFunction } from '@/types/audio';

/**
 * Generate classic metronome click sound
 * Combines high-frequency tones with noise for crisp attack
 * 
 * @param context - Web Audio API context
 * @param isAccent - True for accented beat (louder, higher pitch)
 * @param volume - Master volume multiplier (0-1)
 * @param now - Audio context current time for scheduling
 * 
 * @example
 * ```ts
 * const context = new AudioContext();
 * generateClickSound(context, true, 0.8, context.currentTime);
 * ```
 */
export const generateClickSound: SoundGeneratorFunction = (
  context: AudioContext,
  isAccent: boolean,
  volume: number,
  now: number
): void => {
  const bufferSize = context.sampleRate * 0.04;
  const buffer = context.createBuffer(2, bufferSize, context.sampleRate);
  const dataL = buffer.getChannelData(0);
  const dataR = buffer.getChannelData(1);

  for (let i = 0; i < bufferSize; i++) {
    const decay = Math.exp(-i / (context.sampleRate * 0.008));
    const noise = (Math.random() * 2 - 1) * 0.3;
    
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
  
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(1800, now);
  filter.Q.setValueAtTime(1.5, now);

  bufferSource.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(context.destination);

  gainNode.gain.setValueAtTime(volume * 1.60, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

  bufferSource.start(now);
  bufferSource.stop(now + 0.04);
};

/**
 * Generate wood block percussion sound
 * Resonant body with harmonic overtones for warm, woody timbre
 * 
 * @param context - Web Audio API context
 * @param isAccent - True for accented beat (higher fundamental frequency)
 * @param volume - Master volume multiplier (0-1)
 * @param now - Audio context current time for scheduling
 */
export const generateWoodBlockSound: SoundGeneratorFunction = (
  context: AudioContext,
  isAccent: boolean,
  volume: number,
  now: number
): void => {
  const bufferSize = context.sampleRate * 0.08;
  const buffer = context.createBuffer(2, bufferSize, context.sampleRate);
  const dataL = buffer.getChannelData(0);
  const dataR = buffer.getChannelData(1);

  for (let i = 0; i < bufferSize; i++) {
    const t = i / context.sampleRate;
    const attack = Math.exp(-i / (context.sampleRate * 0.003));
    const bodyDecay = Math.exp(-i / (context.sampleRate * 0.018));
    const noise = (Math.random() * 2 - 1) * 0.4;
    
    const fundamental = isAccent ? 920 : 720;
    const harmonic2 = fundamental * 2.1;
    const harmonic3 = fundamental * 3.3;
    const harmonic4 = fundamental * 4.8;
    
    const res1 = Math.sin(t * fundamental * 6.28) * 0.5;
    const res2 = Math.sin(t * harmonic2 * 6.28) * 0.25;
    const res3 = Math.sin(t * harmonic3 * 6.28) * 0.12;
    const res4 = Math.sin(t * harmonic4 * 6.28) * 0.06;
    
    const signal = (noise * attack * 0.6) + ((res1 + res2 + res3 + res4) * bodyDecay);
    
    dataL[i] = signal;
    dataR[i] = signal * 0.97;
  }

  const bufferSource = context.createBufferSource();
  const filter1 = context.createBiquadFilter();
  const filter2 = context.createBiquadFilter();
  const filter3 = context.createBiquadFilter();
  const gainNode = context.createGain();

  bufferSource.buffer = buffer;
  
  filter1.type = 'bandpass';
  filter1.frequency.setValueAtTime(isAccent ? 920 : 720, now);
  filter1.Q.setValueAtTime(10, now);
  
  filter2.type = 'peaking';
  filter2.frequency.setValueAtTime(isAccent ? 1800 : 1400, now);
  filter2.Q.setValueAtTime(4, now);
  filter2.gain.setValueAtTime(6, now);
  
  filter3.type = 'highpass';
  filter3.frequency.setValueAtTime(400, now);

  bufferSource.connect(filter1);
  filter1.connect(filter2);
  filter2.connect(filter3);
  filter3.connect(gainNode);
  gainNode.connect(context.destination);

  gainNode.gain.setValueAtTime(volume * 1.60, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  bufferSource.start(now);
  bufferSource.stop(now + 0.08);
};

/**
 * Generate hi-hat cymbal sound
 * High-frequency noise with metallic shimmer and sustain
 * 
 * @param context - Web Audio API context
 * @param isAccent - True for accented beat (15% louder, longer sustain)
 * @param volume - Master volume multiplier (0-1)
 * @param now - Audio context current time for scheduling
 */
export const generateHiHatSound: SoundGeneratorFunction = (
  context: AudioContext,
  isAccent: boolean,
  volume: number,
  now: number
): void => {
  const duration = 0.5;
  const bufferSize = context.sampleRate * duration;
  const buffer = context.createBuffer(2, bufferSize, context.sampleRate);
  const dataL = buffer.getChannelData(0);
  const dataR = buffer.getChannelData(1);

  for (let i = 0; i < bufferSize; i++) {
    const t = i / context.sampleRate;
    const attack = Math.exp(-i / (context.sampleRate * 0.002));
    const sustain = Math.exp(-i / (context.sampleRate * (isAccent ? 0.15 : 0.12)));
    const noise = Math.random() * 2 - 1;
    
    const freq1 = 8500;
    const freq2 = 11000;
    const freq3 = 14500;
    
    const shimmer1 = Math.sin(t * freq1 * 6.28) * 0.08;
    const shimmer2 = Math.sin(t * freq2 * 6.28) * 0.06;
    const shimmer3 = Math.sin(t * freq3 * 6.28) * 0.04;
    
    const signal = (noise * 0.85 * attack) + ((shimmer1 + shimmer2 + shimmer3) * sustain * 0.4);
    
    dataL[i] = signal;
    dataR[i] = signal * 0.88 + (Math.random() * 2 - 1) * 0.12 * sustain;
  }

  const bufferSource = context.createBufferSource();
  const highpass = context.createBiquadFilter();
  const highShelf = context.createBiquadFilter();
  const gainNode = context.createGain();

  bufferSource.buffer = buffer;
  
  highpass.type = 'highpass';
  highpass.frequency.setValueAtTime(7000, now);
  highpass.Q.setValueAtTime(0.5, now);
  
  highShelf.type = 'highshelf';
  highShelf.frequency.setValueAtTime(10000, now);
  highShelf.gain.setValueAtTime(6, now);

  bufferSource.connect(highpass);
  highpass.connect(highShelf);
  highShelf.connect(gainNode);
  gainNode.connect(context.destination);

  const hiHatVolume = isAccent ? volume * 1.50 * 1.15 : volume * 1.50;
  gainNode.gain.setValueAtTime(hiHatVolume, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

  bufferSource.start(now);
  bufferSource.stop(now + duration);
};

/**
 * Generate side stick (cross-stick) sound
 * Short, sharp attack combining wood resonance with rim click
 * 
 * @param context - Web Audio API context
 * @param isAccent - True for accented beat (higher frequencies)
 * @param volume - Master volume multiplier (0-1)
 * @param now - Audio context current time for scheduling
 */
export const generateSideStickSound: SoundGeneratorFunction = (
  context: AudioContext,
  isAccent: boolean,
  volume: number,
  now: number
): void => {
  const bufferSize = context.sampleRate * 0.03;
  const buffer = context.createBuffer(2, bufferSize, context.sampleRate);
  const dataL = buffer.getChannelData(0);
  const dataR = buffer.getChannelData(1);

  for (let i = 0; i < bufferSize; i++) {
    const t = i / context.sampleRate;
    const attack = Math.exp(-i / (context.sampleRate * 0.002));
    const decay = Math.exp(-i / (context.sampleRate * 0.008));
    const noise = (Math.random() * 2 - 1) * 0.7;
    
    const woodFreq = isAccent ? 1400 : 1100;
    const rimFreq = isAccent ? 3200 : 2600;
    
    const wood = Math.sin(t * woodFreq * 6.28) * 0.4;
    const rim = Math.sin(t * rimFreq * 6.28) * 0.35;
    const highClick = Math.sin(t * 5500 * 6.28) * 0.15;
    
    const signal = (noise * attack * 0.8) + ((wood + rim + highClick) * decay);
    
    dataL[i] = signal;
    dataR[i] = signal;
  }

  const bufferSource = context.createBufferSource();
  const highpass = context.createBiquadFilter();
  const peaking = context.createBiquadFilter();
  const gainNode = context.createGain();

  bufferSource.buffer = buffer;
  
  highpass.type = 'highpass';
  highpass.frequency.setValueAtTime(800, now);
  highpass.Q.setValueAtTime(0.7, now);
  
  peaking.type = 'peaking';
  peaking.frequency.setValueAtTime(isAccent ? 2800 : 2200, now);
  peaking.Q.setValueAtTime(5, now);
  peaking.gain.setValueAtTime(10, now);

  bufferSource.connect(highpass);
  highpass.connect(peaking);
  peaking.connect(gainNode);
  gainNode.connect(context.destination);

  gainNode.gain.setValueAtTime(volume * 1.55, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

  bufferSource.start(now);
  bufferSource.stop(now + 0.03);
};
