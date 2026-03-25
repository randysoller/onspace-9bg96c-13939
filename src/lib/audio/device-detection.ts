/**
 * Device Detection and Adaptive Audio Settings
 * Optimizes audio processing parameters based on device capabilities
 */

export interface DeviceCapabilities {
  isMobile: boolean;
  isLowEndDevice: boolean;
  recommendedBufferSize: number;
  recommendedSampleRate: number;
  recommendedUpdateInterval: number;
  maxConcurrentProcessing: number;
}

/**
 * Detect device type and capabilities
 */
export function detectDeviceCapabilities(): DeviceCapabilities {
  // Check if mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth < 768;

  // Detect low-end device using available cores and memory
  const cores = navigator.hardwareConcurrency || 2;
  const memory = (navigator as any).deviceMemory || 4; // GB
  const isLowEndDevice = cores <= 2 || memory <= 2;

  // Adaptive settings based on device
  let recommendedBufferSize: number;
  let recommendedSampleRate: number;
  let recommendedUpdateInterval: number;
  let maxConcurrentProcessing: number;

  if (isMobile) {
    if (isLowEndDevice) {
      // Low-end mobile: prioritize battery/performance
      recommendedBufferSize = 2048;
      recommendedSampleRate = 22050;
      recommendedUpdateInterval = 100; // 10 Hz update rate
      maxConcurrentProcessing = 1;
    } else {
      // High-end mobile: balance accuracy and performance
      recommendedBufferSize = 4096;
      recommendedSampleRate = 44100;
      recommendedUpdateInterval = 50; // 20 Hz update rate
      maxConcurrentProcessing = 2;
    }
  } else {
    // Desktop: prioritize accuracy
    recommendedBufferSize = 8192; // Better low-frequency resolution
    recommendedSampleRate = 48000;
    recommendedUpdateInterval = 33; // 30 Hz update rate
    maxConcurrentProcessing = 4;
  }

  return {
    isMobile,
    isLowEndDevice,
    recommendedBufferSize,
    recommendedSampleRate,
    recommendedUpdateInterval,
    maxConcurrentProcessing,
  };
}

/**
 * Calculate optimal buffer size for a given frequency range
 * 
 * Rule of thumb: Buffer should contain at least 2-3 periods of lowest frequency
 * For guitar tuning (82 Hz low E), we need buffer >= 2/82 * sampleRate
 */
export function calculateOptimalBufferSize(
  minFrequency: number,
  sampleRate: number,
  periodsRequired: number = 3
): number {
  const minBufferSize = Math.ceil((periodsRequired / minFrequency) * sampleRate);
  
  // Round up to next power of 2 for FFT efficiency
  const bufferSize = Math.pow(2, Math.ceil(Math.log2(minBufferSize)));
  
  // Clamp between 2048 and 16384
  return Math.max(2048, Math.min(16384, bufferSize));
}

/**
 * Get optimized settings for guitar tuner
 */
export function getGuitarTunerSettings(): {
  bufferSize: number;
  sampleRate: number;
  updateInterval: number;
  minFrequency: number;
  maxFrequency: number;
  smoothingFactor: number;
} {
  const device = detectDeviceCapabilities();
  
  // Guitar tuning range: Low E (82 Hz) to High E (330 Hz)
  // Add margin for tuning down: 70-400 Hz
  const minFrequency = 70;
  const maxFrequency = 400;
  
  // Calculate optimal buffer size for low E string (82 Hz)
  const optimalBufferSize = calculateOptimalBufferSize(
    82,
    device.recommendedSampleRate,
    3
  );
  
  // Use device-recommended buffer size, but ensure it's optimal for guitar
  const bufferSize = Math.max(optimalBufferSize, device.recommendedBufferSize);
  
  // Adaptive smoothing: less smoothing on desktop for responsiveness
  const smoothingFactor = device.isMobile ? 0.3 : 0.2;
  
  return {
    bufferSize,
    sampleRate: device.recommendedSampleRate,
    updateInterval: device.recommendedUpdateInterval,
    minFrequency,
    maxFrequency,
    smoothingFactor,
  };
}
