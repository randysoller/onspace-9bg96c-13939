import { useRef, useEffect, useCallback } from 'react';

interface VoiceSynthesisConfig {
  isMobile: boolean;
  onLatencyUpdate?: (latency: number) => void;
}

export const useVoiceSynthesisLatency = ({ isMobile, onLatencyUpdate }: VoiceSynthesisConfig) => {
  const voiceUtterancesRef = useRef<Map<number, SpeechSynthesisUtterance>>(new Map());
  const initialLatencyEstimate = isMobile ? 0.070 : 0.090;
  const speechLatencyOffsetRef = useRef<number>(initialLatencyEstimate);
  const latencyHistoryRef = useRef<number[]>([]);
  const lastSpeechStartTimeRef = useRef<number>(0);
  const lastScheduledTimeRef = useRef<number>(0);
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);
  const optimalVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const isVoiceCalibratedRef = useRef<boolean>(false);
  const calibrationAttemptsRef = useRef<number>(0);

  // Store callback in ref to avoid re-running effect when it changes
  const onLatencyUpdateRef = useRef(onLatencyUpdate);
  useEffect(() => {
    onLatencyUpdateRef.current = onLatencyUpdate;
  });

  useEffect(() => {
    speechSynthRef.current = window.speechSynthesis;

    const selectOptimalVoice = () => {
      const voices = speechSynthRef.current?.getVoices() || [];
      
      const preferredVoices = voices.filter(v => 
        v.localService && v.lang.startsWith('en')
      );
      
      if (preferredVoices.length > 0) {
        const fastVoice = preferredVoices.find(v => 
          v.name.toLowerCase().includes('compact') || 
          v.name.toLowerCase().includes('premium') ||
          v.name.toLowerCase().includes('samantha')
        ) || preferredVoices[0];
        
        optimalVoiceRef.current = fastVoice;
        console.log(`🎯 Selected optimal voice: ${fastVoice.name} (local: ${fastVoice.localService})`);
      } else if (voices.length > 0) {
        const fallbackVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
        optimalVoiceRef.current = fallbackVoice;
        console.log(`⚠️ Using fallback voice: ${fallbackVoice.name}`);
      }
    };

    const initVoiceUtterances = () => {
      console.log('🎤 Initializing voice count utterances...');
      
      selectOptimalVoice();
      
      for (let i = 1; i <= 12; i++) {
        const utterance = new SpeechSynthesisUtterance(i.toString());
        
        utterance.rate = 1.3;
        utterance.pitch = 1.05;
        utterance.volume = 1.0;
        utterance.lang = 'en-US';
        
        if (optimalVoiceRef.current) {
          utterance.voice = optimalVoiceRef.current;
        }
        
        utterance.addEventListener('start', () => {
          const actualStartTime = performance.now();
          const scheduledTime = lastScheduledTimeRef.current;
          const measuredLatency = (actualStartTime - scheduledTime) / 1000;
          
          if (scheduledTime > 0 && measuredLatency > 0 && measuredLatency < 1.0) {
            latencyHistoryRef.current.push(measuredLatency);
            if (latencyHistoryRef.current.length > 10) {
              latencyHistoryRef.current.shift();
            }
            
            calibrationAttemptsRef.current++;
            const isCalibrating = calibrationAttemptsRef.current <= 8;
            
            if (isCalibrating) {
              speechLatencyOffsetRef.current = 
                speechLatencyOffsetRef.current * 0.70 + measuredLatency * 0.30;
              
              console.log(`🎯 Calibration ${calibrationAttemptsRef.current}/8 | Measured: ${(measuredLatency * 1000).toFixed(1)}ms | Offset: ${(speechLatencyOffsetRef.current * 1000).toFixed(1)}ms`);
              
              if (calibrationAttemptsRef.current === 8) {
                isVoiceCalibratedRef.current = true;
                console.log(`✅ Voice calibration complete! Final offset: ${(speechLatencyOffsetRef.current * 1000).toFixed(1)}ms`);
              }
            } else {
              const deviation = Math.abs(measuredLatency - speechLatencyOffsetRef.current) / speechLatencyOffsetRef.current;
              
              if (deviation < 0.4) {
                speechLatencyOffsetRef.current = 
                  speechLatencyOffsetRef.current * 0.85 + measuredLatency * 0.15;
              } else {
                console.log(`⚠️ Outlier rejected: ${(measuredLatency * 1000).toFixed(1)}ms (deviation: ${(deviation * 100).toFixed(0)}%)`);
              }
            }

            if (onLatencyUpdateRef.current) {
              onLatencyUpdateRef.current(speechLatencyOffsetRef.current);
            }
          }
          
          lastSpeechStartTimeRef.current = actualStartTime;
        });
        
        voiceUtterancesRef.current.set(i, utterance);
      }
      
      console.log(`✅ Created ${voiceUtterancesRef.current.size} voice utterances`);
      
      // Pre-warm TTS engine
      if (speechSynthRef.current) {
        console.log('🔥 Pre-warming speech synthesis engine...');
        const warmupUtterance = new SpeechSynthesisUtterance('1');
        warmupUtterance.volume = 0.01;
        warmupUtterance.rate = 2.0;
        warmupUtterance.lang = 'en-US';
        
        if (optimalVoiceRef.current) {
          warmupUtterance.voice = optimalVoiceRef.current;
        }
        
        speechSynthRef.current.speak(warmupUtterance);
        console.log('✅ TTS engine initialized');
      }
    };
    
    if (speechSynthRef.current) {
      if (speechSynthRef.current.getVoices().length > 0) {
        initVoiceUtterances();
      } else {
        speechSynthRef.current.addEventListener('voiceschanged', initVoiceUtterances, { once: true });
      }
    }
  }, [isMobile]);

  const speakNumber = useCallback((
    beatNumber: number,
    audioContext: AudioContext,
    currentTime: number
  ) => {
    if (!speechSynthRef.current) return;

    const utterance = voiceUtterancesRef.current.get(beatNumber);
    if (!utterance) return;

    const audioLatency = (audioContext.baseLatency || 0) + (audioContext.outputLatency || 0);
    
    let predictedSpeechLatency = speechLatencyOffsetRef.current;
    if (latencyHistoryRef.current.length >= 3) {
      const sortedHistory = [...latencyHistoryRef.current].sort((a, b) => a - b);
      const medianIndex = Math.floor(sortedHistory.length / 2);
      predictedSpeechLatency = sortedHistory[medianIndex];
    }
    
    let perNumberAdjustment = 0;
    if (isMobile && beatNumber === 4) {
      perNumberAdjustment = -0.020;
    } else if (isMobile && beatNumber === 3) {
      perNumberAdjustment = 0.020;
    }
    
    const totalLatency = audioLatency + predictedSpeechLatency + perNumberAdjustment;
    const beatTime = currentTime;
    const triggerTime = beatTime - totalLatency;
    const msUntilSpeech = Math.max(0, (triggerTime - audioContext.currentTime) * 1000);
    
    if (!isVoiceCalibratedRef.current || beatNumber % 8 === 1) {
      console.log(`🎤 Beat ${beatNumber} | Audio: ${(audioLatency * 1000).toFixed(1)}ms | Speech: ${(predictedSpeechLatency * 1000).toFixed(1)}ms | Total: ${(totalLatency * 1000).toFixed(1)}ms | Trigger in: ${msUntilSpeech.toFixed(1)}ms`);
    }
    
    setTimeout(() => {
      if (speechSynthRef.current) {
        lastScheduledTimeRef.current = performance.now();
        speechSynthRef.current.cancel();
        speechSynthRef.current.speak(utterance);
      }
    }, msUntilSpeech);
  }, [isMobile]);

  return {
    speakNumber,
    isCalibrated: isVoiceCalibratedRef.current,
    currentLatency: speechLatencyOffsetRef.current,
  };
};
