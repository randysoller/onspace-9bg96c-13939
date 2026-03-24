/**
 * A/B Testing Framework
 * Manages feature experiments and variant assignments
 */

import { logger } from './logger';
import { analytics } from './analytics';

/**
 * Experiment configuration
 */
export interface Experiment {
  id: string;
  name: string;
  variants: {
    id: string;
    name: string;
    weight: number; // 0-100
  }[];
  enabled: boolean;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Active experiments
 */
const EXPERIMENTS: Experiment[] = [
  {
    id: 'metronome-voice-count',
    name: 'Metronome Voice Counting Default',
    variants: [
      { id: 'control', name: 'Voice Off by Default', weight: 50 },
      { id: 'treatment', name: 'Voice On by Default', weight: 50 },
    ],
    enabled: false,
  },
  {
    id: 'practice-interval',
    name: 'Default Practice Interval',
    variants: [
      { id: 'control', name: '10 seconds', weight: 33 },
      { id: 'treatment-1', name: '15 seconds', weight: 33 },
      { id: 'treatment-2', name: '20 seconds', weight: 34 },
    ],
    enabled: false,
  },
  {
    id: 'chord-diagram-style',
    name: 'Chord Diagram Visual Style',
    variants: [
      { id: 'control', name: 'Standard Dots', weight: 50 },
      { id: 'treatment', name: 'Colored by Finger', weight: 50 },
    ],
    enabled: false,
  },
];

/**
 * A/B Testing Manager
 */
class ABTestingManager {
  private assignments: Map<string, string> = new Map();
  private storageKey = 'ab-test-assignments';

  constructor() {
    this.loadAssignments();
  }

  /**
   * Load assignments from localStorage
   */
  private loadAssignments() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.assignments = new Map(Object.entries(data));
      }
    } catch (error) {
      logger.error('Failed to load A/B test assignments', error);
    }
  }

  /**
   * Save assignments to localStorage
   */
  private saveAssignments() {
    try {
      const data = Object.fromEntries(this.assignments);
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      logger.error('Failed to save A/B test assignments', error);
    }
  }

  /**
   * Get variant for experiment
   */
  getVariant(experimentId: string): string {
    // Check if already assigned
    if (this.assignments.has(experimentId)) {
      return this.assignments.get(experimentId)!;
    }

    // Find experiment
    const experiment = EXPERIMENTS.find(exp => exp.id === experimentId);
    
    if (!experiment || !experiment.enabled) {
      return 'control';
    }

    // Check date range
    const now = new Date();
    if (experiment.startDate && now < experiment.startDate) {
      return 'control';
    }
    if (experiment.endDate && now > experiment.endDate) {
      return 'control';
    }

    // Assign variant based on weights
    const variant = this.assignVariant(experiment);
    this.assignments.set(experimentId, variant.id);
    this.saveAssignments();

    // Track assignment
    analytics.track('feature_enabled', {
      experiment: experimentId,
      variant: variant.id,
    });

    logger.info(`A/B Test: ${experimentId} → ${variant.id}`);

    return variant.id;
  }

  /**
   * Assign variant based on weighted distribution
   */
  private assignVariant(experiment: Experiment) {
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const variant of experiment.variants) {
      cumulative += variant.weight;
      if (random <= cumulative) {
        return variant;
      }
    }

    // Fallback to first variant
    return experiment.variants[0];
  }

  /**
   * Check if user is in variant
   */
  isVariant(experimentId: string, variantId: string): boolean {
    return this.getVariant(experimentId) === variantId;
  }

  /**
   * Get all active assignments
   */
  getAssignments(): Record<string, string> {
    return Object.fromEntries(this.assignments);
  }

  /**
   * Reset all assignments (for testing)
   */
  reset() {
    this.assignments.clear();
    localStorage.removeItem(this.storageKey);
  }
}

// Singleton instance
export const abTesting = new ABTestingManager();

/**
 * React hook for A/B testing
 */
export function useExperiment(experimentId: string): string {
  return abTesting.getVariant(experimentId);
}

/**
 * Helper to check if user is in treatment group
 */
export function isInTreatment(experimentId: string): boolean {
  return abTesting.getVariant(experimentId) !== 'control';
}
