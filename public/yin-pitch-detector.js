/**
 * YIN Pitch Detection Algorithm - Audio Worklet Implementation
 * Enhanced with comprehensive diagnostics for mobile debugging
 * 
 * Based on: "YIN, a fundamental frequency estimator for speech and music"
 * by Alain de Cheveigné and Hideki Kawahara (2002)
 */

class YinPitchDetector extends AudioWorkletProcessor {
  constructor(options) {
    super();
    
    const processorOptions = options.processorOptions || {};
    
    // CRITICAL: Log all sample rate sources for debugging
    const requestedSampleRate = processorOptions.sampleRate;
    const workletGlobalSampleRate = sampleRate; // AudioWorkletGlobalScope.sampleRate
    const currentFrameSampleRate = currentFrame / currentTime; // Calculate from worklet time
    
    // Use requested rate if provided, otherwise fall back to worklet global
    this.sampleRate = requestedSampleRate || workletGlobalSampleRate;
    
    this.minFrequency = processorOptions.minFrequency || 70;
    this.maxFrequency = processorOptions.maxFrequency || 400;
    this.threshold = processorOptions.threshold || 0.15;
    this.calibrationHz = processorOptions.calibrationHz || 440;
    this.noiseGateThreshold = processorOptions.noiseGateThreshold || 0.01;
    
    // Diagnostic info
    this.diagnosticSent = false;
    this.firstDetectionDone = false;
    
    // Send comprehensive diagnostic data
    this.port.postMessage({
      type: 'diagnostic',
      stage: 'constructor',
      requestedSampleRate,
      workletGlobalSampleRate,
      selectedSampleRate: this.sampleRate,
      mismatch: requestedSampleRate && requestedSampleRate !== workletGlobalSampleRate,
      processorOptionsReceived: Object.keys(processorOptions),
    });
    
    // Calculate buffer size
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
    
    // Auto-calibration
    this.calibrationBuffer = [];
    this.calibrationBufferSize = 20;
    
    // Listen for config updates
    this.port.onmessage = (event) => {
      if (event.data.type === 'config') {
        this.updateConfig(event.data);
      }
    };
  }

  recalculateBufferSize() {
    const periodsRequired = 4;
    const minBufferSize = Math.ceil((periodsRequired / this.minFrequency) * this.sampleRate);
    this.bufferSize = Math.pow(2, Math.ceil(Math.log2(minBufferSize)));
    this.bufferSize = Math.max(4096, Math.min(16384, this.bufferSize));
    
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
    
    this.port.postMessage({
      type: 'diagnostic',
      stage: 'bufferCalculation',
      minBufferSize,
      actualBufferSize: this.bufferSize,
      sampleRate: this.sampleRate,
      minFrequency: this.minFrequency,
    });
  }

  updateConfig(config) {
    const oldSampleRate = this.sampleRate;
    
    this.minFrequency = config.minFrequency || this.minFrequency;
    this.maxFrequency = config.maxFrequency || this.maxFrequency;
    this.threshold = config.threshold !== undefined ? config.threshold : this.threshold;
    this.calibrationHz = config.calibrationHz || this.calibrationHz;
    this.noiseGateThreshold = config.noiseGateThreshold !== undefined ? config.noiseGateThreshold : this.noiseGateThreshold;
    
    if (config.sampleRate && config.sampleRate !== this.sampleRate) {
      this.sampleRate = config.sampleRate;
      this.recalculateBufferSize();
      
      this.port.postMessage({
        type: 'diagnostic',
        stage: 'configUpdate',
        message: `Sample rate changed: ${oldSampleRate} → ${this.sampleRate} Hz`,
        oldSampleRate,
        newSampleRate: this.sampleRate,
      });
    }
    
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
      
      if (this.bufferIndex >= this.bufferSize) {
        this.detectPitch();
        this.bufferIndex = 0;
      }
    }

    return true;
  }

  calculateRMS(buffer) {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    return Math.sqrt(sum / buffer.length);
  }

  detectPitch() {
    const startTime = currentTime;
    
    this.rmsLevel = this.calculateRMS(this.buffer);
    
    // Noise gate
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
    
    // YIN algorithm
    const yinBuffer = this.differenceFunction(this.buffer);
    this.cumulativeMeanNormalizedDifference(yinBuffer);
    const adaptiveThreshold = this.calculateAdaptiveThreshold(yinBuffer);
    const tau = this.absoluteThresholdWithPeakSelection(yinBuffer, adaptiveThreshold);
    
    if (tau === -1) {
      this.stableCount = 0;
      this.lastFrequency = 0;
      this.lastTau = 0;
      
      this.port.postMessage({
        type: 'audioLevel',
        level: this.rmsLevel,
      });
      return;
    }
    
    const betterTau = this.parabolicInterpolation(yinBuffer, tau);
    
    // CRITICAL: Calculate frequency using THIS.sampleRate (not global)
    let frequency = this.sampleRate / betterTau;
    
    // Log first detection for verification
    if (!this.firstDetectionDone) {
      this.firstDetectionDone = true;
      this.port.postMessage({
        type: 'diagnostic',
        stage: 'firstDetection',
        rawFrequency: frequency,
        tau: betterTau,
        sampleRateUsed: this.sampleRate,
        calculation: `${this.sampleRate} / ${betterTau} = ${frequency}`,
        expectedE2: 82.41,
        expectedA2: 110.00,
        deviation: frequency > 100 && frequency < 120 ? `${((frequency / 110) - 1) * 100}% from A2` : 'N/A',
      });
    }
    
    // Sub-harmonic rejection
    frequency = this.rejectSubHarmonics(frequency, yinBuffer, betterTau);
    
    // Octave error correction
    const preOctaveFreq = frequency;
    frequency = this.correctOctaveErrors(frequency);
    
    if (preOctaveFreq !== frequency) {
      this.port.postMessage({
        type: 'diagnostic',
        stage: 'octaveCorrection',
        before: preOctaveFreq,
        after: frequency,
        ratio: preOctaveFreq / frequency,
      });
    }
    
    // Calibration tracking
    this.trackCalibrationOffset(frequency);
    
    // Validate range
    if (frequency < this.minFrequency || frequency > this.maxFrequency) {
      this.stableCount = 0;
      return;
    }
    
    // Stability check
    const freqDiff = Math.abs(frequency - this.lastFrequency);
    const tauDiff = Math.abs(betterTau - this.lastTau);
    const isStable = freqDiff < 2.0 && tauDiff < 2.0;
    
    if (isStable) {
      this.stableCount++;
    } else {
      this.stableCount = 0;
    }
    
    // Report if stable
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

  trackCalibrationOffset(detectedFreq) {
    const guitarStringFreqs = [82.41, 110.00, 146.83, 196.00, 246.94, 329.63];
    
    let closestExpected = guitarStringFreqs[0];
    let minDiff = Math.abs(detectedFreq - closestExpected);
    
    for (const expectedFreq of guitarStringFreqs) {
      const diff = Math.abs(detectedFreq - expectedFreq);
      if (diff < minDiff) {
        minDiff = diff;
        closestExpected = expectedFreq;
      }
    }
    
    if (minDiff < 20) {
      const ratio = detectedFreq / closestExpected;
      
      this.calibrationBuffer.push({
        detected: detectedFreq,
        expected: closestExpected,
        ratio: ratio,
        timestamp: currentTime,
      });
      
      if (this.calibrationBuffer.length > this.calibrationBufferSize) {
        this.calibrationBuffer.shift();
      }
      
      if (this.calibrationBuffer.length >= 10) {
        const avgRatio = this.calibrationBuffer.reduce((sum, item) => sum + item.ratio, 0) / this.calibrationBuffer.length;
        const deviation = Math.abs(avgRatio - 1.0);
        
        if (deviation > 0.02) {
          this.port.postMessage({
            type: 'calibrationSuggestion',
            averageRatio: avgRatio,
            deviation: deviation,
            recommendedCalibrationHz: this.calibrationHz * avgRatio,
            detectedSamples: this.calibrationBuffer.length,
            diagnosticDetails: {
              closestExpected,
              detectedFreq,
              sampleRateUsed: this.sampleRate,
              possibleSampleRateMismatch: deviation > 0.08, // ~1.5 semitones
            },
          });
        }
      }
    }
  }

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

  cumulativeMeanNormalizedDifference(yinBuffer) {
    yinBuffer[0] = 1;
    
    let runningSum = 0;
    for (let tau = 1; tau < yinBuffer.length; tau++) {
      runningSum += yinBuffer[tau];
      yinBuffer[tau] = yinBuffer[tau] * tau / runningSum;
    }
  }

  calculateAdaptiveThreshold(yinBuffer) {
    const minPeriod = Math.floor(this.sampleRate / this.maxFrequency);
    const maxPeriod = Math.floor(this.sampleRate / this.minFrequency);
    
    let globalMin = 1.0;
    for (let tau = minPeriod; tau < Math.min(maxPeriod, yinBuffer.length); tau++) {
      if (yinBuffer[tau] < globalMin) {
        globalMin = yinBuffer[tau];
      }
    }
    
    let adaptiveThreshold = this.threshold;
    
    if (globalMin < 0.1) {
      adaptiveThreshold = 0.10;
    } else if (globalMin > 0.3) {
      adaptiveThreshold = 0.25;
    } else {
      adaptiveThreshold = 0.10 + (globalMin - 0.1) * (0.25 - 0.10) / (0.3 - 0.1);
    }
    
    return adaptiveThreshold;
  }

  absoluteThresholdWithPeakSelection(yinBuffer, threshold) {
    const minPeriod = Math.floor(this.sampleRate / this.maxFrequency);
    const maxPeriod = Math.floor(this.sampleRate / this.minFrequency);
    
    const candidates = [];
    
    for (let tau = minPeriod; tau < Math.min(maxPeriod, yinBuffer.length - 1); tau++) {
      if (yinBuffer[tau] < threshold) {
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
    
    candidates.sort((a, b) => a.value - b.value);
    const bestCandidate = candidates[0];
    
    for (let i = 1; i < Math.min(5, candidates.length); i++) {
      const candidate = candidates[i];
      const ratio = bestCandidate.tau / candidate.tau;
      
      if (Math.abs(ratio - 2.0) < 0.15) {
        if (candidate.value < bestCandidate.value * 1.2) {
          return candidate.tau;
        }
      } else if (Math.abs(ratio - 3.0) < 0.15) {
        if (candidate.value < bestCandidate.value * 1.3) {
          return candidate.tau;
        }
      }
    }
    
    return bestCandidate.tau;
  }

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

  rejectSubHarmonics(frequency, yinBuffer, tau) {
    const halfTau = tau * 2;
    const thirdTau = tau * 3;
    
    if (halfTau < yinBuffer.length) {
      const halfFreq = this.sampleRate / halfTau;
      if (halfFreq >= this.minFrequency && halfFreq <= this.maxFrequency) {
        if (yinBuffer[Math.floor(halfTau)] < yinBuffer[Math.floor(tau)] * 1.5) {
          return halfFreq;
        }
      }
    }
    
    return frequency;
  }

  correctOctaveErrors(frequency) {
    while (frequency > this.maxFrequency && frequency / 2 >= this.minFrequency) {
      frequency = frequency / 2;
    }
    
    while (frequency < this.minFrequency && frequency * 2 <= this.maxFrequency) {
      frequency = frequency * 2;
    }
    
    const guitarStringFreqs = [82.41, 110.00, 146.83, 196.00, 246.94, 329.63];
    for (const stringFreq of guitarStringFreqs) {
      if (Math.abs(frequency - stringFreq) < 10) {
        return frequency;
      }
      
      if (Math.abs(frequency - stringFreq * 2) < 10) {
        return stringFreq;
      }
      if (Math.abs(frequency - stringFreq / 2) < 10) {
        return stringFreq;
      }
    }
    
    return frequency;
  }

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
