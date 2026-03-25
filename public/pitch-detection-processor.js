/**
 * Audio Worklet Processor for Pitch Detection
 * Runs pitch detection in a separate high-priority audio thread
 * 
 * Enhanced NSDF Algorithm with:
 * - Sub-harmonic rejection for guitar tuning
 * - Octave error correction
 * - Better peak selection
 * - Adaptive buffer sizing
 * 
 * Reference: McLeod, P., & Wyvill, G. (2005). "A Smarter Way to Find Pitch"
 */

class PitchDetectionProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    
    // Configuration (will be updated from main thread)
    this.sampleRate = 48000;
    this.minFrequency = 70;
    this.maxFrequency = 400;
    this.clarity = 0.85;
    this.calibrationHz = 440; // A4 reference frequency
    this.noiseGateThreshold = 0.01; // RMS threshold
    
    // Buffers - dynamic sizing
    this.bufferSize = 8192;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
    
    // Performance tracking
    this.processCount = 0;
    this.totalProcessTime = 0;
    
    // Pitch tracking for stability
    this.lastFrequency = 0;
    this.lastClarity = 0;
    this.stableCount = 0;
    
    // Audio level tracking
    this.rmsLevel = 0;
    
    // Listen for configuration messages
    this.port.onmessage = (event) => {
      if (event.data.type === 'config') {
        this.updateConfig(event.data);
      }
    };
  }

  /**
   * Update configuration and resize buffers if needed
   */
  updateConfig(config) {
    this.sampleRate = config.sampleRate || this.sampleRate;
    this.minFrequency = config.minFrequency || this.minFrequency;
    this.maxFrequency = config.maxFrequency || this.maxFrequency;
    this.clarity = config.clarity || this.clarity;
    this.calibrationHz = config.calibrationHz || this.calibrationHz;
    this.noiseGateThreshold = config.noiseGateThreshold !== undefined ? config.noiseGateThreshold : this.noiseGateThreshold;
    
    // Resize buffer if needed
    if (config.bufferSize && config.bufferSize !== this.bufferSize) {
      this.bufferSize = config.bufferSize;
      this.buffer = new Float32Array(this.bufferSize);
      this.bufferIndex = 0;
    }
  }

  /**
   * Process audio samples
   */
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
   * Calculate RMS (Root Mean Square) level of buffer
   */
  calculateRMS(buffer) {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    return Math.sqrt(sum / buffer.length);
  }

  /**
   * Detect pitch using enhanced NSDF algorithm
   */
  detectPitch() {
    const startTime = currentTime;
    
    // Calculate audio level (RMS)
    this.rmsLevel = this.calculateRMS(this.buffer);
    
    // Noise gate: skip processing if signal is too weak
    if (this.rmsLevel < this.noiseGateThreshold) {
      // Send audio level update even when below threshold
      this.port.postMessage({
        type: 'audioLevel',
        level: this.rmsLevel,
      });
      
      // Reset stability when below noise gate
      this.stableCount = 0;
      this.lastFrequency = 0;
      return;
    }
    
    const result = this.enhancedNSDF(this.buffer);
    
    if (result.frequency > 0) {
      // Check for stability
      const freqDiff = Math.abs(result.frequency - this.lastFrequency);
      const isStable = freqDiff < 2.0 && result.clarity > this.clarity;
      
      if (isStable) {
        this.stableCount++;
      } else {
        this.stableCount = 0;
      }
      
      // Only send if reasonably stable (at least 2 consecutive stable readings)
      if (this.stableCount >= 1) {
        this.port.postMessage({
          type: 'pitch',
          frequency: result.frequency,
          clarity: result.clarity,
          note: this.frequencyToNote(result.frequency),
          timestamp: currentTime,
          isStable: this.stableCount >= 3,
          audioLevel: this.rmsLevel,
        });
      }
      
      this.lastFrequency = result.frequency;
      this.lastClarity = result.clarity;
    } else {
      // No pitch detected - reset stability counter
      this.stableCount = 0;
      this.lastFrequency = 0;
    }
    
    // Performance tracking
    this.processCount++;
    this.totalProcessTime += (currentTime - startTime) * 1000;
    
    // Send performance stats every 100 detections
    if (this.processCount % 100 === 0) {
      this.port.postMessage({
        type: 'performance',
        avgProcessTime: this.totalProcessTime / this.processCount,
        processCount: this.processCount,
        bufferSize: this.bufferSize,
      });
    }
  }

  /**
   * Enhanced NSDF with sub-harmonic rejection and better peak selection
   */
  enhancedNSDF(buffer) {
    const size = buffer.length;
    const nsdfBuffer = new Float32Array(size);
    
    // Calculate NSDF
    for (let tau = 0; tau < size; tau++) {
      let acf = 0;
      let divisorM = 0;
      
      for (let i = 0; i < size - tau; i++) {
        acf += buffer[i] * buffer[i + tau];
        divisorM += buffer[i] * buffer[i] + buffer[i + tau] * buffer[i + tau];
      }
      
      nsdfBuffer[tau] = divisorM > 0 ? (2 * acf) / divisorM : 0;
    }
    
    // Find all peaks above threshold
    const peaks = this.findPeaksAboveThreshold(nsdfBuffer, this.clarity * 0.8);
    
    if (peaks.length === 0) {
      return { frequency: 0, clarity: 0 };
    }
    
    // Enhanced peak selection: reject sub-harmonics and select best peak
    const bestPeak = this.selectBestPeak(nsdfBuffer, peaks);
    
    if (!bestPeak) {
      return { frequency: 0, clarity: 0 };
    }
    
    const clarity = nsdfBuffer[bestPeak];
    
    // Check clarity threshold
    if (clarity < this.clarity) {
      return { frequency: 0, clarity };
    }
    
    // Parabolic interpolation for sub-sample accuracy
    const period = this.parabolicInterpolation(nsdfBuffer, bestPeak);
    let frequency = this.sampleRate / period;
    
    // Octave error correction
    frequency = this.correctOctaveError(frequency);
    
    // Validate frequency range
    if (frequency < this.minFrequency || frequency > this.maxFrequency) {
      return { frequency: 0, clarity };
    }
    
    return { frequency, clarity };
  }

  /**
   * Find all peaks above a threshold
   */
  findPeaksAboveThreshold(buffer, threshold) {
    const peaks = [];
    const minPeriod = Math.floor(this.sampleRate / this.maxFrequency);
    const maxPeriod = Math.floor(this.sampleRate / this.minFrequency);
    
    for (let i = minPeriod; i < Math.min(maxPeriod, buffer.length - 1); i++) {
      if (buffer[i] > threshold && 
          buffer[i] > buffer[i - 1] && 
          buffer[i] > buffer[i + 1]) {
        peaks.push(i);
      }
    }
    
    return peaks;
  }

  /**
   * Select best peak, rejecting sub-harmonics
   * Sub-harmonic: If peak at 2x, 3x period exists with similar strength, use shorter period
   */
  selectBestPeak(nsdfBuffer, peaks) {
    if (peaks.length === 0) return null;
    if (peaks.length === 1) return peaks[0];
    
    // Sort peaks by strength
    const sortedPeaks = peaks.sort((a, b) => nsdfBuffer[b] - nsdfBuffer[a]);
    
    // Check for sub-harmonics: if strongest peak is at 2x or 3x a weaker peak, use the weaker
    const strongestPeak = sortedPeaks[0];
    const strongestValue = nsdfBuffer[strongestPeak];
    
    for (let i = 1; i < sortedPeaks.length; i++) {
      const candidatePeak = sortedPeaks[i];
      const candidateValue = nsdfBuffer[candidatePeak];
      
      // Check if strongest is ~2x candidate (sub-harmonic)
      const ratio = strongestPeak / candidatePeak;
      const isSubHarmonic = Math.abs(ratio - 2.0) < 0.1 || Math.abs(ratio - 3.0) < 0.1;
      
      // If candidate is strong enough and strongest is its sub-harmonic, use candidate
      if (isSubHarmonic && candidateValue > strongestValue * 0.7) {
        return candidatePeak;
      }
    }
    
    return strongestPeak;
  }

  /**
   * Correct common octave errors in guitar tuning
   */
  correctOctaveError(frequency) {
    // For guitar tuning, most common error is detecting one octave too high
    // Low E should be ~82 Hz, not 164 Hz
    // High E should be ~330 Hz, not 660 Hz
    
    // If frequency is above expected range, try dividing by 2
    if (frequency > this.maxFrequency && frequency / 2 >= this.minFrequency) {
      const halfFreq = frequency / 2;
      // Check if half frequency is in valid range
      if (halfFreq >= this.minFrequency && halfFreq <= this.maxFrequency) {
        return halfFreq;
      }
    }
    
    return frequency;
  }

  /**
   * Parabolic interpolation for sub-sample accuracy
   */
  parabolicInterpolation(buffer, index) {
    if (index === 0 || index === buffer.length - 1) {
      return index;
    }
    
    const alpha = buffer[index - 1];
    const beta = buffer[index];
    const gamma = buffer[index + 1];
    
    const peak = 0.5 * (alpha - gamma) / (alpha - 2 * beta + gamma);
    return index + peak;
  }

  /**
   * Convert frequency to note name with cents offset
   * Uses calibrationHz for A4 reference (supports non-standard tunings)
   */
  frequencyToNote(frequency) {
    const noteStrings = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const A4 = this.calibrationHz; // Use calibration setting instead of fixed 440
    const C0 = A4 * Math.pow(2, -4.75);
    
    const halfSteps = 12 * Math.log2(frequency / C0);
    const halfStepsRounded = Math.round(halfSteps);
    const octave = Math.floor(halfStepsRounded / 12);
    const noteIndex = halfStepsRounded % 12;
    
    // Calculate cents offset from nearest note
    const cents = Math.round((halfSteps - halfStepsRounded) * 100);
    
    return {
      name: noteStrings[noteIndex],
      octave: octave,
      cents: cents,
    };
  }
}

registerProcessor('pitch-detection-processor', PitchDetectionProcessor);
