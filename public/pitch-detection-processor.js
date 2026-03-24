/**
 * Audio Worklet Processor for Pitch Detection
 * Runs pitch detection in a separate high-priority audio thread
 * 
 * NSDF (Normalized Square Difference Function) Algorithm
 * Reference: McLeod, P., & Wyvill, G. (2005). "A Smarter Way to Find Pitch"
 */

class PitchDetectionProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    
    // Configuration
    this.sampleRate = 48000; // Will be updated from main thread
    this.minFrequency = 60;
    this.maxFrequency = 1400;
    this.clarity = 0.85;
    
    // Buffers
    this.bufferSize = 4096;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
    
    // Performance tracking
    this.processCount = 0;
    this.totalProcessTime = 0;
    
    // Listen for configuration messages
    this.port.onmessage = (event) => {
      if (event.data.type === 'config') {
        this.sampleRate = event.data.sampleRate || this.sampleRate;
        this.minFrequency = event.data.minFrequency || this.minFrequency;
        this.maxFrequency = event.data.maxFrequency || this.maxFrequency;
        this.clarity = event.data.clarity || this.clarity;
      }
    };
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
   * Detect pitch using NSDF algorithm
   */
  detectPitch() {
    const startTime = currentTime;
    
    const result = this.nsdf(this.buffer);
    
    if (result.frequency > 0) {
      // Send pitch data to main thread
      this.port.postMessage({
        type: 'pitch',
        frequency: result.frequency,
        clarity: result.clarity,
        note: this.frequencyToNote(result.frequency),
        timestamp: currentTime,
      });
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
      });
    }
  }

  /**
   * NSDF (Normalized Square Difference Function)
   * Returns the detected frequency and clarity
   */
  nsdf(buffer) {
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
    
    // Find peaks
    const peaks = this.findPeaks(nsdfBuffer);
    
    if (peaks.length === 0) {
      return { frequency: 0, clarity: 0 };
    }
    
    // Get highest peak
    let maxPeak = peaks[0];
    for (let i = 1; i < peaks.length; i++) {
      if (nsdfBuffer[peaks[i]] > nsdfBuffer[maxPeak]) {
        maxPeak = peaks[i];
      }
    }
    
    const clarity = nsdfBuffer[maxPeak];
    
    // Check clarity threshold
    if (clarity < this.clarity) {
      return { frequency: 0, clarity };
    }
    
    // Parabolic interpolation for better frequency accuracy
    const period = this.parabolicInterpolation(nsdfBuffer, maxPeak);
    const frequency = this.sampleRate / period;
    
    // Validate frequency range
    if (frequency < this.minFrequency || frequency > this.maxFrequency) {
      return { frequency: 0, clarity };
    }
    
    return { frequency, clarity };
  }

  /**
   * Find peaks in NSDF buffer
   */
  findPeaks(buffer) {
    const peaks = [];
    const minPeriod = Math.floor(this.sampleRate / this.maxFrequency);
    const maxPeriod = Math.floor(this.sampleRate / this.minFrequency);
    
    for (let i = minPeriod; i < Math.min(maxPeriod, buffer.length - 1); i++) {
      if (buffer[i] > buffer[i - 1] && buffer[i] > buffer[i + 1] && buffer[i] > 0) {
        peaks.push(i);
      }
    }
    
    return peaks;
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
   * Convert frequency to note name
   */
  frequencyToNote(frequency) {
    const noteStrings = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const A4 = 440;
    const C0 = A4 * Math.pow(2, -4.75);
    
    const halfSteps = Math.round(12 * Math.log2(frequency / C0));
    const octave = Math.floor(halfSteps / 12);
    const noteIndex = halfSteps % 12;
    
    return {
      name: noteStrings[noteIndex],
      octave: octave,
      cents: 1200 * Math.log2(frequency / (C0 * Math.pow(2, halfSteps / 12))),
    };
  }
}

registerProcessor('pitch-detection-processor', PitchDetectionProcessor);
