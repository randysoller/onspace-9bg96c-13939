/**
 * Audio Worklet Manager for Pitch Detection
 * Manages the pitch detection worklet node and message passing
 */

import { logger } from '../logger';

export interface PitchData {
  frequency: number;
  clarity: number;
  note: {
    name: string;
    octave: number;
    cents: number;
  };
  timestamp: number;
}

export interface WorkletConfig {
  sampleRate: number;
  minFrequency?: number;
  maxFrequency?: number;
  clarity?: number;
}

/**
 * Pitch Detection Worklet Manager
 */
export class PitchDetectionWorklet {
  private audioContext: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private isInitialized = false;
  private listeners: Set<(data: PitchData) => void> = new Set();
  private performanceListeners: Set<(stats: any) => void> = new Set();

  /**
   * Check if Audio Worklets are supported
   */
  static isSupported(): boolean {
    return 'AudioWorklet' in window && 'AudioContext' in window;
  }

  /**
   * Initialize the audio worklet
   */
  async initialize(stream: MediaStream, config: WorkletConfig): Promise<void> {
    try {
      if (this.isInitialized) {
        logger.warn('Pitch detection worklet already initialized');
        return;
      }

      // Create audio context
      this.audioContext = new AudioContext({ sampleRate: config.sampleRate });

      // Load worklet module
      await this.audioContext.audioWorklet.addModule('/pitch-detection-processor.js');

      // Create worklet node
      this.workletNode = new AudioWorkletNode(
        this.audioContext,
        'pitch-detection-processor',
        {
          numberOfInputs: 1,
          numberOfOutputs: 0,
          processorOptions: config,
        }
      );

      // Listen for messages from worklet
      this.workletNode.port.onmessage = (event) => {
        if (event.data.type === 'pitch') {
          this.listeners.forEach(listener => listener(event.data));
        } else if (event.data.type === 'performance') {
          this.performanceListeners.forEach(listener => listener(event.data));
        }
      };

      // Create source from media stream
      this.sourceNode = this.audioContext.createMediaStreamSource(stream);

      // Connect nodes: source → worklet
      this.sourceNode.connect(this.workletNode);

      // Send configuration to worklet
      this.workletNode.port.postMessage({
        type: 'config',
        ...config,
      });

      this.isInitialized = true;
      logger.info('Pitch detection worklet initialized', {
        sampleRate: config.sampleRate,
        contextState: this.audioContext.state,
      });

      // Resume context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
    } catch (error) {
      logger.error('Failed to initialize pitch detection worklet', error);
      throw error;
    }
  }

  /**
   * Update worklet configuration
   */
  updateConfig(config: Partial<WorkletConfig>): void {
    if (!this.workletNode) {
      logger.warn('Cannot update config: worklet not initialized');
      return;
    }

    this.workletNode.port.postMessage({
      type: 'config',
      ...config,
    });

    logger.debug('Updated worklet config', config);
  }

  /**
   * Add pitch detection listener
   */
  addPitchListener(listener: (data: PitchData) => void): void {
    this.listeners.add(listener);
  }

  /**
   * Remove pitch detection listener
   */
  removePitchListener(listener: (data: PitchData) => void): void {
    this.listeners.delete(listener);
  }

  /**
   * Add performance listener
   */
  addPerformanceListener(listener: (stats: any) => void): void {
    this.performanceListeners.add(listener);
  }

  /**
   * Remove performance listener
   */
  removePerformanceListener(listener: (stats: any) => void): void {
    this.performanceListeners.delete(listener);
  }

  /**
   * Get audio context state
   */
  getState(): AudioContextState | null {
    return this.audioContext?.state || null;
  }

  /**
   * Resume audio context
   */
  async resume(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
      logger.debug('Audio context resumed');
    }
  }

  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    try {
      this.listeners.clear();
      this.performanceListeners.clear();

      if (this.sourceNode) {
        this.sourceNode.disconnect();
        this.sourceNode = null;
      }

      if (this.workletNode) {
        this.workletNode.disconnect();
        this.workletNode.port.onmessage = null;
        this.workletNode = null;
      }

      if (this.audioContext) {
        await this.audioContext.close();
        this.audioContext = null;
      }

      this.isInitialized = false;
      logger.info('Pitch detection worklet cleaned up');
    } catch (error) {
      logger.error('Failed to cleanup pitch detection worklet', error);
    }
  }
}
