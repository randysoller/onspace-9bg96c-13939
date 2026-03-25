/**
 * YIN Pitch Detection Algorithm - Audio Worklet Implementation
 * 
 * Based on: "YIN, a fundamental frequency estimator for speech and music"
 * by Alain de Cheveigné and Hideki Kawahara (2002)
 * 
 * Mobile-Optimized with Critical Fixes:
 * - FIXED: Use actualSampleRate from AudioContext, not global sampleRate
 * - Enhanced sub-harmonic rejection for guitar tuning
 * - Adaptive threshold based on signal quality
 * - Robust octave error correction
 * - Auto-calibration support via reference frequency detection
 */

class YinPitchDetector extends AudioWorkletProcessor {
  constructor(options) {
    super();
    
    // CRITICAL FIX: Use sample rate from options, NOT global sampleRate
    // Global sampleRate might not match AudioContext's actual sample rate
    const processorOptions = options.processorOptions || {};
    this.sampleRate = processorOptions.sampleRate || sampleRate; // Fallback to global if not provided
    
    this.minFrequency = processorOptions.minFrequency || 70;
    this.maxFrequency = processorOptions.maxFrequency || 400;
    this.threshold = processorOptions.threshold || 0.15;
    this.calibrationHz = processorOptions.calibrationHz || 440;
    this.noiseGateThreshold = processorOptions.noiseGateThreshold || 0.01;
    
    // Adaptive buffer sizing based on ACTUAL sample rate
    this.recalculateBufferSize();
    
    // Performance tracking
    this.processCount = 0;
    this.totalProcessTime = 0;
    this.skipCount = 0;
    
    // Stability tracking
    this.lastFrequency = 0;
    this.lastTau = 0;
    this.stableCount = 0;
    
    // Audio level
    this.rmsLevel = 0;
    
    // Auto-calibration: Track detected frequencies for systematic offset detection
    this.calibrationBuffer = [];
    this.calibrationBufferSize = 20;
    
    // Send actual sample rate to main thread for verification
    this.port.postMessage({
      type: 'actualSampleRate',
      sampleRate: this.sampleRate,
      globalSampleRate: sampleRate, // For comparison
    });
    
    // Listen for config updates
    this.port.onmessage = (event) => {
      if (event.data.type === 'config') {
        this.updateConfig(event.data);
      }
    };
  }

  /**
   * Recalculate buffer size based on actual sample rate
   * CRITICAL: Buffer must contain 2-4 periods of lowest frequency for accurate detection
   */
  recalculateBufferSize() {
    // For 70 Hz (lowest guitar note - 3 semitones below low E), need ~4 periods
    const periodsRequired = 4;
    const minBufferSize = Math.ceil((periodsRequired / this.minFrequency) * this.sampleRate);
    
    // Round up to next power of 2
    this.bufferSize = Math.pow(2, Math.ceil(Math.log2(minBufferSize)));
    
    // Clamp between 4096 and 16384
    this.bufferSize = Math.max(4096, Math.min(16384, this.bufferSize));
    
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
    
    // Log for debugging
    this.port.postMessage({
      type: 'debug',
      message: `Buffer recalculated: ${this.bufferSize} samples @ ${this.sampleRate} Hz (global: ${sampleRate} Hz)`,
      minBufferSize,
      actualBufferSize: this.bufferSize,
      sampleRateMismatch: this.sampleRate !== sampleRate,
    });
  }

  updateConfig(config) {
    const oldSampleRate = this.sampleRate;
    
    this.minFrequency = config.minFrequency || this.minFrequency;
    this.maxFrequency = config.maxFrequency || this.maxFrequency;
    this.threshold = config.threshold !== undefined ? config.threshold : this.threshold;
    this.calibrationHz = config.calibrationHz || this.calibrationHz;
    this.noiseGateThreshold = config.noiseGateThreshold !== undefined ? config.noiseGateThreshold : this.noiseGateThreshold;
    
    // CRITICAL: If sample rate changed, recalculate buffer
    if (config.sampleRate && config.sampleRate !== this.sampleRate) {
      this.sampleRate = config.sampleRate;
      this.recalculateBufferSize();
      
      this.port.postMessage({
        type: 'debug',
        message: `Sample rate changed: ${oldSampleRate} → ${this.sampleRate} Hz`,
      });
    }
    
    // Manual buffer size override (for testing)
    if (config.bufferSize && config.bufferSize !== this.bufferSize) {
      this.bufferSize = config.bufferSize;
      this.buffer = new Float32Array(this.bufferSize);
      this.bufferIndex = 0;
    }
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    
    if (!input || !input[0]) {
      return true;
    }

    const samples = input[0];
    
    // Fill buffer
    for (let i = 0; i < samples.length; i++) {
      this.buffer[this.bufferIndex] = samples[i];
      this.bufferIndex++;
      
      // When buffer is full, detect pitch
      if (this.bufferIndex >= this.bufferSize) {
        this.detectPitch();
        this.bufferIndex = 0;
      }
    }

    return true;
  }

  /**
   * Calculate RMS level for noise gate
   */
  calculateRMS(buffer) {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    return Math.sqrt(sum / buffer.length);
  }

  /**
   * YIN pitch detection algorithm with mobile-optimized enhancements
   */
  detectPitch() {
    const startTime = currentTime;
    
    // Calculate audio level
    this.rmsLevel = this.calculateRMS(this.buffer);
    
    // Noise gate: skip processing if too quiet
    if (this.rmsLevel < this.noiseGateThreshold) {
      this.port.postMessage({
        type: 'audioLevel',
        level: this.rmsLevel,
      });
      this.skipCount++;
      this.stableCount = 0;
      this.lastFrequency = 0;
      this.lastTau = 0;
      return;
    }
    
    // Step 1: Difference function
    const yinBuffer = this.differenceFunction(this.buffer);
    
    // Step 2: Cumulative mean normalized difference
    this.cumulativeMeanNormalizedDifference(yinBuffer);
    
    // Step 3: Adaptive threshold based on signal quality
    const adaptiveThreshold = this.calculateAdaptiveThreshold(yinBuffer);
    
    // Step 4: Absolute threshold with enhanced peak selection
    const tau = this.absoluteThresholdWithPeakSelection(yinBuffer, adaptiveThreshold);
    
    if (tau === -1) {
      // No pitch detected
      this.stableCount = 0;
      this.lastFrequency = 0;
      this.lastTau = 0;
      
      this.port.postMessage({
        type: 'audioLevel',
        level: this.rmsLevel,
      });
      return;
    }
    
    // Step 5: Parabolic interpolation
    const betterTau = this.parabolicInterpolation(yinBuffer, tau);
    
    // Calculate frequency (USING CORRECT SAMPLE RATE FROM CONFIG)
    let frequency = this.sampleRate / betterTau;
    
    // CRITICAL: Sub-harmonic rejection for guitar tuning
    frequency = this.rejectSubHarmonics(frequency, yinBuffer, betterTau);
    
    // CRITICAL: Octave error correction (handles 2x, 0.5x errors)
    frequency = this.correctOctaveErrors(frequency);
    
    // Auto-calibration: Track frequency offset from expected guitar strings
    this.trackCalibrationOffset(frequency);
    
    // Validate frequency range
    if (frequency < this.minFrequency || frequency > this.maxFrequency) {
      this.stableCount = 0;
      return;
    }
    
    // Check stability
    const freqDiff = Math.abs(frequency - this.lastFrequency);
    const tauDiff = Math.abs(betterTau - this.lastTau);
    const isStable = freqDiff < 2.0 && tauDiff < 2.0;
    
    if (isStable) {
      this.stableCount++;
    } else {
      this.stableCount = 0;
    }
    
    // Require at least 2 stable readings before reporting
    if (this.stableCount >= 2) {
      const clarity = 1.0 - yinBuffer[tau];
      
      this.port.postMessage({
        type: 'pitch',
        frequency: frequency,
        clarity: Math.max(0, Math.min(1, clarity)),
        note: this.frequencyToNote(frequency),
        timestamp: currentTime,
        isStable: this.stableCount >= 3,
        audioLevel: this.rmsLevel,
        // Debug info
        tau: betterTau,
        yinValue: yinBuffer[tau],
      });
    }
    
    this.lastFrequency = frequency;
    this.lastTau = betterTau;
    
    // Performance tracking
    this.processCount++;
    this.totalProcessTime += (currentTime - startTime) * 1000;
    
    if (this.processCount % 100 === 0) {
      this.port.postMessage({
        type: 'performance',
        avgProcessTime: this.totalProcessTime / this.processCount,
        processCount: this.processCount,
        skipCount: this.skipCount,
        bufferSize: this.bufferSize,
        sampleRate: this.sampleRate,
      });
    }
  }

  /**
   * Auto-calibration: Track frequency offset from expected guitar strings
   * Detects systematic errors (e.g., sample rate mismatch causing 1 semitone offset)
   */
  trackCalibrationOffset(detectedFreq) {
    // Standard guitar string frequencies (E2, A2, D3, G3, B3, E4)
    const guitarStringFreqs = [82.41, 110.00, 146.83, 196.00, 246.94, 329.63];
    
    // Find closest expected frequency
    let closestExpected = guitarStringFreqs[0];
    let minDiff = Math.abs(detectedFreq - closestExpected);
    
    for (const expectedFreq of guitarStringFreqs) {
      const diff = Math.abs(detectedFreq - expectedFreq);
      if (diff < minDiff) {
        minDiff = diff;
        closestExpected = expectedFreq;
      }
    }
    
    // If we're within 20 Hz of a guitar string, calculate the ratio
    if (minDiff < 20) {
      const ratio = detectedFreq / closestExpected;
      
      // Add to calibration buffer
      this.calibrationBuffer.push({
        detected: detectedFreq,
        expected: closestExpected,
        ratio: ratio,
        timestamp: currentTime,
      });
      
      // Keep buffer size limited
      if (this.calibrationBuffer.length > this.calibrationBufferSize) {
        this.calibrationBuffer.shift();
      }
      
      // If we have enough samples, check for systematic offset
      if (this.calibrationBuffer.length >= 10) {
        const avgRatio = this.calibrationBuffer.reduce((sum, item) => sum + item.ratio, 0) / this.calibrationBuffer.length;
        
        // Check if there's a consistent offset (>2% deviation from 1.0)
        const deviation = Math.abs(avgRatio - 1.0);
        if (deviation > 0.02) {
          // Suggest calibration correction
          this.port.postMessage({
            type: 'calibrationSuggestion',
            averageRatio: avgRatio,
            deviation: deviation,
            recommendedCalibrationHz: this.calibrationHz * avgRatio,
            detectedSamples: this.calibrationBuffer.length,
          });
        }
      }
    }
  }

  /**
   * YIN Step 1: Difference function
   */
  differenceFunction(buffer) {
    const yinBuffer = new Float32Array(buffer.length / 2);
    
    for (let tau = 0; tau < yinBuffer.length; tau++) {
      let sum = 0;
      for (let i = 0; i < yinBuffer.length; i++) {
        const delta = buffer[i] - buffer[i + tau];
        sum += delta * delta;
      }
      yinBuffer[tau] = sum;
    }
    
    return yinBuffer;
  }

  /**
   * YIN Step 2: Cumulative mean normalized difference
   */
  cumulativeMeanNormalizedDifference(yinBuffer) {
    yinBuffer[0] = 1;
    
    let runningSum = 0;
    for (let tau = 1; tau < yinBuffer.length; tau++) {
      runningSum += yinBuffer[tau];
      yinBuffer[tau] = yinBuffer[tau] * tau / runningSum;
    }
  }

  /**
   * Calculate adaptive threshold based on signal quality
   * Mobile devices have noisier signals, so we need to be more lenient
   */
  calculateAdaptiveThreshold(yinBuffer) {
    // Find the global minimum in the valid range
    const minPeriod = Math.floor(this.sampleRate / this.maxFrequency);
    const maxPeriod = Math.floor(this.sampleRate / this.minFrequency);
    
    let globalMin = 1.0;
    for (let tau = minPeriod; tau < Math.min(maxPeriod, yinBuffer.length); tau++) {
      if (yinBuffer[tau] < globalMin) {
        globalMin = yinBuffer[tau];
      }
    }
    
    // If signal is very clear (globalMin < 0.1), use strict threshold
    // If signal is noisy (globalMin > 0.3), use lenient threshold
    let adaptiveThreshold = this.threshold;
    
    if (globalMin < 0.1) {
      adaptiveThreshold = 0.10; // Strict for clean signals
    } else if (globalMin > 0.3) {
      adaptiveThreshold = 0.25; // Lenient for noisy signals (mobile)
    } else {
      // Interpolate
      adaptiveThreshold = 0.10 + (globalMin - 0.1) * (0.25 - 0.10) / (0.3 - 0.1);
    }
    
    return adaptiveThreshold;
  }

  /**
   * YIN Step 3: Absolute threshold with enhanced peak selection
   * CRITICAL: Rejects sub-harmonics by checking for better peaks at shorter periods
   */
  absoluteThresholdWithPeakSelection(yinBuffer, threshold) {
    const minPeriod = Math.floor(this.sampleRate / this.maxFrequency);
    const maxPeriod = Math.floor(this.sampleRate / this.minFrequency);
    
    // Find ALL peaks below threshold
    const candidates = [];
    
    for (let tau = minPeriod; tau < Math.min(maxPeriod, yinBuffer.length - 1); tau++) {
      if (yinBuffer[tau] < threshold) {
        // Found a candidate, find the actual minimum in this region
        let localMin = tau;
        while (tau + 1 < yinBuffer.length && yinBuffer[tau + 1] < yinBuffer[tau]) {
          tau++;
          localMin = tau;
        }
        
        candidates.push({
          tau: localMin,
          value: yinBuffer[localMin],
        });
      }
    }
    
    if (candidates.length === 0) {
      return -1;
    }
    
    // Sort by YIN value (lower is better)
    candidates.sort((a, b) => a.value - b.value);
    
    // CRITICAL: Check if the best candidate is a sub-harmonic of a better candidate
    const bestCandidate = candidates[0];
    
    for (let i = 1; i < Math.min(5, candidates.length); i++) {
      const candidate = candidates[i];
      
      // Check if bestCandidate is approximately 2x or 3x this candidate (sub-harmonic)
      const ratio = bestCandidate.tau / candidate.tau;
      
      if (Math.abs(ratio - 2.0) < 0.15) {
        // bestCandidate is likely the octave below, use candidate instead
        if (candidate.value < bestCandidate.value * 1.2) {
          return candidate.tau;
        }
      } else if (Math.abs(ratio - 3.0) < 0.15) {
        // bestCandidate is likely a harmonic, use candidate instead
        if (candidate.value < bestCandidate.value * 1.3) {
          return candidate.tau;
        }
      }
    }
    
    return bestCandidate.tau;
  }

  /**
   * YIN Step 4: Parabolic interpolation for sub-sample accuracy
   */
  parabolicInterpolation(yinBuffer, tau) {
    if (tau === 0 || tau === yinBuffer.length - 1) {
      return tau;
    }
    
    const s0 = yinBuffer[tau - 1];
    const s1 = yinBuffer[tau];
    const s2 = yinBuffer[tau + 1];
    
    const adjustment = (s2 - s0) / (2 * (2 * s1 - s2 - s0));
    
    return tau + adjustment;
  }

  /**
   * CRITICAL: Reject sub-harmonics for guitar tuning
   * Guitar strings produce strong harmonics that can fool pitch detectors
   */
  rejectSubHarmonics(frequency, yinBuffer, tau) {
    // Check if half or third of this frequency would also be a valid peak
    const halfTau = tau * 2;
    const thirdTau = tau * 3;
    
    // If half-frequency would be in valid range and has a good YIN value, use it instead
    if (halfTau < yinBuffer.length) {
      const halfFreq = this.sampleRate / halfTau;
      if (halfFreq >= this.minFrequency && halfFreq <= this.maxFrequency) {
        if (yinBuffer[Math.floor(halfTau)] < yinBuffer[Math.floor(tau)] * 1.5) {
          // The half-frequency is also a strong candidate, use it
          return halfFreq;
        }
      }
    }
    
    return frequency;
  }

  /**
   * CRITICAL: Correct octave errors (2x, 0.5x)
   * Handles common guitar tuning errors where detector picks wrong octave
   */
  correctOctaveErrors(frequency) {
    // Guitar tuning range: E2 (82.41 Hz) to E4 (329.63 Hz)
    // With margin: 70-400 Hz
    
    // If frequency is too high (detected octave above), divide by 2
    while (frequency > this.maxFrequency && frequency / 2 >= this.minFrequency) {
      frequency = frequency / 2;
      this.port.postMessage({
        type: 'debug',
        message: `Octave corrected DOWN: ${(frequency * 2).toFixed(2)} → ${frequency.toFixed(2)} Hz`,
      });
    }
    
    // If frequency is too low (detected octave below), multiply by 2
    while (frequency < this.minFrequency && frequency * 2 <= this.maxFrequency) {
      frequency = frequency * 2;
      this.port.postMessage({
        type: 'debug',
        message: `Octave corrected UP: ${(frequency / 2).toFixed(2)} → ${frequency.toFixed(2)} Hz`,
      });
    }
    
    // Additional check: if frequency is close to a known guitar string frequency,
    // snap to it if within 10 Hz
    const guitarStringFreqs = [82.41, 110.00, 146.83, 196.00, 246.94, 329.63];
    for (const stringFreq of guitarStringFreqs) {
      if (Math.abs(frequency - stringFreq) < 10) {
        return frequency; // Already close, no correction needed
      }
      
      // Check octave variants
      if (Math.abs(frequency - stringFreq * 2) < 10) {
        // Detected one octave high
        return stringFreq;
      }
      if (Math.abs(frequency - stringFreq / 2) < 10) {
        // Detected one octave low
        return stringFreq;
      }
    }
    
    return frequency;
  }

  /**
   * Convert frequency to note with calibration support
   */
  frequencyToNote(frequency) {
    const noteStrings = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const A4 = this.calibrationHz;
    const C0 = A4 * Math.pow(2, -4.75);
    
    const halfSteps = 12 * Math.log2(frequency / C0);
    const halfStepsRounded = Math.round(halfSteps);
    const octave = Math.floor(halfStepsRounded / 12);
    const noteIndex = halfStepsRounded % 12;
    
    const cents = Math.round((halfSteps - halfStepsRounded) * 100);
    
    return {
      name: noteStrings[noteIndex],
      octave: octave,
      cents: cents,
    };
  }
}

registerProcessor('yin-pitch-detector', YinPitchDetector);
