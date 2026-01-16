/**
 * Utility functions for working with annotations.
 */

import type { Annotation } from '../types/annotations';

/**
 * Finds the most recent annotation that has occurred before or at the current time.
 * Assumes annotations are sorted by timestamp in ascending order.
 *
 * @param annotations - Array of annotations sorted by timestamp
 * @param currentTime - Current playback time in milliseconds
 * @returns ID of the active annotation, or null if none
 *
 * @example
 * const annotations = [
 *   { id: 'a1', timestamp: 1000, ... },
 *   { id: 'a2', timestamp: 5000, ... },
 *   { id: 'a3', timestamp: 10000, ... },
 * ];
 * findActiveAnnotation(annotations, 6000) // "a2"
 * findActiveAnnotation(annotations, 500) // null
 */
export function findActiveAnnotation(
  annotations: Annotation[],
  currentTime: number
): string | null {
  let active: Annotation | null = null;
  for (const annotation of annotations) {
    if (annotation.timestamp <= currentTime) {
      active = annotation;
    } else {
      break;
    }
  }
  return active?.id ?? null;
}