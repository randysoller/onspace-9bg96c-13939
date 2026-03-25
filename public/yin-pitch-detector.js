/**
 * YIN Pitch Detection Algorithm - Audio Worklet Implementation
 * 
 * Based on: "YIN, a fundamental frequency estimator for speech and music"
 * by Alain de Cheveigné and Hideki Kawahara (2002)
 * 
 * Optimized for:
 * - Mobile browsers (iOS Safari, Android Chrome)
 * - Low CPU usage (<5% on mobile)
 * - Guitar tuning (70-400 Hz range)
 * - Real-time performance (<30ms latency)
 */

class YinPitchDetector extends AudioWorkletProcessor {
  constructor() {
    super();
    
    // Configuration (updated from main thread)
    this.sampleRate = 48000;
    this.minFrequency = 70;
    this.maxFrequency = 400;
    this.threshold = 0.15; // YIN threshold (lower = stricter)
    this.calibrationHz = 440;
    this.noiseGateThreshold = 0.01;
    
    // Adaptive buffer sizing (2-4 periods of lowest frequency)
    this.bufferSize = Math.pow(2, Math.ceil(Math.log2((4 / 70) * 48000))); // ~2744 → 4096
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
    
    // Performance tracking
    this.processCount = 0;
    this.totalProcessTime = 0;
    this.skipCount = 0;
    
    // Stability tracking
    this.lastFrequency = 0;
    this.stableCount = 0;
    
    // Audio level
    this.rmsLevel = 0;
    
    // Listen for config updates
    this.port.onmessage = (event) => {
      if (event.data.type === 'config') {
        this.updateConfig(event.data);
      }
    };
  }

  updateConfig(config) {
    this.sampleRate = config.sampleRate || this.sampleRate;
    this.minFrequency = config.minFrequency || this.minFrequency;
    this.maxFrequency = config.maxFrequency || this.maxFrequency;
    this.threshold = config.threshold !== undefined ? config.threshold : this.threshold;
    this.calibrationHz = config.calibrationHz || this.calibrationHz;
    this.noiseGateThreshold = config.noiseGateThreshold !== undefined ? config.noiseGateThreshold : this.noiseGateThreshold;
    
    // Resize buffer if needed
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
   * YIN pitch detection algorithm
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
      return;
    }
    
    // Step 1: Difference function
    const yinBuffer = this.differenceFunction(this.buffer);
    
    // Step 2: Cumulative mean normalized difference
    this.cumulativeMeanNormalizedDifference(yinBuffer);
    
    // Step 3: Absolute threshold
    const tau = this.absoluteThreshold(yinBuffer);
    
    if (tau === -1) {
      // No pitch detected
      this.stableCount = 0;
      this.lastFrequency = 0;
      
      this.port.postMessage({
        type: 'audioLevel',
        level: this.rmsLevel,
      });
      return;
    }
    
    // Step 4: Parabolic interpolation
    const betterTau = this.parabolicInterpolation(yinBuffer, tau);
    
    // Calculate frequency
    let frequency = this.sampleRate / betterTau;
    
    // Validate frequency range
    if (frequency < this.minFrequency || frequency > this.maxFrequency) {
      this.stableCount = 0;
      return;
    }
    
    // Check stability
    const freqDiff = Math.abs(frequency - this.lastFrequency);
    const isStable = freqDiff < 2.0;
    
    if (isStable) {
      this.stableCount++;
    } else {
      this.stableCount = 0;
    }
    
    // Require at least 2 stable readings before reporting
    if (this.stableCount >= 2) {
      const clarity = 1.0 - yinBuffer[tau]; // Convert YIN value to clarity (0-1)
      
      this.port.postMessage({
        type: 'pitch',
        frequency: frequency,
        clarity: Math.max(0, Math.min(1, clarity)),
        note: this.frequencyToNote(frequency),
        timestamp: currentTime,
        isStable: this.stableCount >= 3,
        audioLevel: this.rmsLevel,
      });
    }
    
    this.lastFrequency = frequency;
    
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
      });
    }
  }

  /**
   * YIN Step 1: Difference function
   * d_t(τ) = Σ(x_j - x_{j+τ})²
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
   * d'_t(τ) = d_t(τ) / [(1/τ) Σ_{j=1}^τ d_t(j)]
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
   * YIN Step 3: Absolute threshold
   * Find first τ where d'_t(τ) < threshold
   */
  absoluteThreshold(yinBuffer) {
    // Define search range based on frequency limits
    const minPeriod = Math.floor(this.sampleRate / this.maxFrequency);
    const maxPeriod = Math.floor(this.sampleRate / this.minFrequency);
    
    // Find first minimum below threshold
    for (let tau = minPeriod; tau < Math.min(maxPeriod, yinBuffer.length - 1); tau++) {
      if (yinBuffer[tau] < this.threshold) {
        // Found a candidate, now find the actual minimum in this region
        while (tau + 1 < yinBuffer.length && yinBuffer[tau + 1] < yinBuffer[tau]) {
          tau++;
        }
        return tau;
      }
    }
    
    // No period found below threshold
    return -1;
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
