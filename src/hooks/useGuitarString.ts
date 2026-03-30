import { useRef, useCallback, useEffect } from 'react';

// Mobile detection utility
const isMobileBrowser = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

/**
 * Realistic guitar string synthesis hook
 * 
 * Features:
 * - 10 harmonic partials with physical modeling
 * - Pluck noise synthesis
 * - Body resonance EQ (low/mid/high/air)
 * - Dynamic compression
 * - Thump and buzz effects
 * 
 * Use for: Tuner reference tones, scale practice, ear training
 */

interface GuitarStringParams {
  frequency: number;
  duration?: number;
  volume?: number;
}

export function useGuitarString() {
  const contextRef = useRef<AudioContext | null>(null);
  const isPlayingRef = useRef(false);

  const getContext = useCallback(async () => {
    // MOBILE FIX: On mobile, recreate suspended contexts SYNCHRONOUSLY
    if (contextRef.current && contextRef.current.state === 'suspended') {
      if (isMobileBrowser) {
        console.log('📱 GuitarString Mobile: Creating fresh AudioContext synchronously...');
        const oldContext = contextRef.current;
        contextRef.current = new AudioContext();
        console.log('✅ GuitarString Mobile: Fresh AudioContext created');
        oldContext.close().catch(() => {/* ignore cleanup errors */});
        return contextRef.current;
      } else {
        console.log('🖥️ GuitarString Desktop: Resuming AudioContext...');
        try {
          await contextRef.current.resume();
          console.log('✅ GuitarString Desktop: AudioContext resumed');
          return contextRef.current;
        } catch (err) {
          console.error('❌ GuitarString Desktop: Failed to resume:', err);
          throw err;
        }
      }
    }
    
    if (!contextRef.current || contextRef.current.state === 'closed') {
      contextRef.current = new AudioContext();
    }
    
    return contextRef.current;
  }, []);

  const playString = useCallback(async ({ frequency, duration = 3.0, volume = 1.0 }: GuitarStringParams) => {
    let ctx: AudioContext;
    try {
      ctx = await getContext();
    } catch (err) {
      console.error('❌ GuitarString: Cannot play - AudioContext unavailable:', err);
      return;
    }
    const now = ctx.currentTime;

    // ─── Master Chain with Compression ───
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-12, now);
    compressor.knee.setValueAtTime(6, now);
    compressor.ratio.setValueAtTime(4, now);
    compressor.attack.setValueAtTime(0.002, now);
    compressor.release.setValueAtTime(0.15, now);
    compressor.connect(ctx.destination);

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(volume, now + 0.002);
    masterGain.gain.setTargetAtTime(0.0001, now + 0.005, duration * 0.32);
    masterGain.connect(compressor);

    // ─── Body Resonance EQ Chain ───
    const bodyLow = ctx.createBiquadFilter();
    bodyLow.type = 'peaking';
    bodyLow.frequency.value = 120;
    bodyLow.Q.value = 2.5;
    bodyLow.gain.value = 6;

    const bodyMid = ctx.createBiquadFilter();
    bodyMid.type = 'peaking';
    bodyMid.frequency.value = 400;
    bodyMid.Q.value = 1.2;
    bodyMid.gain.value = 3;

    const bodyHigh = ctx.createBiquadFilter();
    bodyHigh.type = 'peaking';
    bodyHigh.frequency.value = 2800;
    bodyHigh.Q.value = 1.0;
    bodyHigh.gain.value = -4;

    const airRoll = ctx.createBiquadFilter();
    airRoll.type = 'lowpass';
    airRoll.frequency.value = 6000;
    airRoll.Q.value = 0.7;

    bodyLow.connect(bodyMid);
    bodyMid.connect(bodyHigh);
    bodyHigh.connect(airRoll);
    airRoll.connect(masterGain);

    // ─── Harmonic Partials (Physical Modeling) ───
    const harmonics = [
      { h: 1, amp: 1.00, decay: 0.38 },
      { h: 2, amp: 0.72, decay: 0.32 },
      { h: 3, amp: 0.50, decay: 0.26 },
      { h: 4, amp: 0.38, decay: 0.22 },
      { h: 5, amp: 0.25, decay: 0.18 },
      { h: 6, amp: 0.18, decay: 0.14 },
      { h: 7, amp: 0.10, decay: 0.11 },
      { h: 8, amp: 0.06, decay: 0.09 },
      { h: 9, amp: 0.03, decay: 0.07 },
      { h: 10, amp: 0.015, decay: 0.06 },
    ];

    harmonics.forEach(({ h, amp, decay }) => {
      const partialFreq = frequency * h;
      if (partialFreq > 10000) return;

      const osc = ctx.createOscillator();
      osc.type = h <= 3 ? 'triangle' : 'sine';
      osc.frequency.value = partialFreq * (1 + 0.00005 * h * h);

      const pGain = ctx.createGain();
      const attackAmp = amp * 0.65;
      pGain.gain.setValueAtTime(0, now);
      pGain.gain.linearRampToValueAtTime(attackAmp, now + 0.001);
      pGain.gain.setTargetAtTime(attackAmp * 0.5, now + 0.002, 0.03);
      pGain.gain.setTargetAtTime(0.0001, now + 0.06, duration * decay);

      osc.connect(pGain);
      pGain.connect(bodyLow);
      osc.start(now);
      osc.stop(now + duration);
    });

    // ─── Pluck Noise (Attack Transient) ───
    const pluckLen = Math.floor(ctx.sampleRate * 0.035);
    const pluckBuf = ctx.createBuffer(1, pluckLen, ctx.sampleRate);
    const pluckData = pluckBuf.getChannelData(0);
    for (let i = 0; i < pluckLen; i++) {
      const env = 1 - (i / pluckLen);
      pluckData[i] = (Math.random() * 2 - 1) * env * env * 0.8;
    }
    const pluckSrc = ctx.createBufferSource();
    pluckSrc.buffer = pluckBuf;

    const pluckFilter = ctx.createBiquadFilter();
    pluckFilter.type = 'bandpass';
    pluckFilter.frequency.value = Math.min(frequency * 4, 5000);
    pluckFilter.Q.value = 1.8;

    const pluckGain = ctx.createGain();
    pluckGain.gain.setValueAtTime(0.55, now);
    pluckGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    pluckSrc.connect(pluckFilter);
    pluckFilter.connect(pluckGain);
    pluckGain.connect(masterGain);
    pluckSrc.start(now);

    // ─── Thump (Low-Frequency Attack) ───
    const thumpOsc = ctx.createOscillator();
    thumpOsc.type = 'sine';
    thumpOsc.frequency.setValueAtTime(frequency * 0.5, now);
    thumpOsc.frequency.exponentialRampToValueAtTime(frequency * 0.25, now + 0.08);
    const thumpGain = ctx.createGain();
    thumpGain.gain.setValueAtTime(0.25, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    thumpOsc.connect(thumpGain);
    thumpGain.connect(masterGain);
    thumpOsc.start(now);
    thumpOsc.stop(now + 0.15);

    // ─── Buzz (High-Frequency Fret Noise) ───
    const buzzLen = Math.floor(ctx.sampleRate * 0.008);
    const buzzBuf = ctx.createBuffer(1, buzzLen, ctx.sampleRate);
    const buzzData = buzzBuf.getChannelData(0);
    for (let i = 0; i < buzzLen; i++) buzzData[i] = (Math.random() * 2 - 1) * 0.15;
    const buzzSrc = ctx.createBufferSource();
    buzzSrc.buffer = buzzBuf;
    const buzzHP = ctx.createBiquadFilter();
    buzzHP.type = 'highpass';
    buzzHP.frequency.value = 3000;
    const buzzGain = ctx.createGain();
    buzzGain.gain.setValueAtTime(0.2, now);
    buzzGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
    buzzSrc.connect(buzzHP);
    buzzHP.connect(buzzGain);
    buzzGain.connect(masterGain);
    buzzSrc.start(now);

    isPlayingRef.current = true;

    // Auto-cleanup
    setTimeout(() => {
      isPlayingRef.current = false;
      ctx.close();
    }, (duration + 0.5) * 1000);
  }, [getContext]);

  const stop = useCallback(() => {
    if (contextRef.current) {
      contextRef.current.close();
      contextRef.current = null;
    }
    isPlayingRef.current = false;
  }, []);

  // Page Visibility API: Resume AudioContext when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && contextRef.current) {
        if (contextRef.current.state === 'suspended') {
          console.log('👁️ GuitarString: Tab visible - resuming AudioContext...');
          contextRef.current.resume()
            .then(() => console.log('✅ GuitarString: AudioContext resumed'))
            .catch((err) => console.error('❌ GuitarString: Failed to resume:', err));
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stop();
    };
  }, [stop]);

  return {
    playString,
    stop,
    isPlaying: isPlayingRef.current,
  };
}
