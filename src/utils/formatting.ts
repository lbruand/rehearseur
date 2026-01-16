/**
 * Formatting utilities for display purposes.
 */

/**
 * Formats a time value in milliseconds to MM:SS format.
 *
 * @param ms - Time in milliseconds
 * @returns Formatted time string (e.g., "1:05", "12:34")
 *
 * @example
 * formatTime(65000) // "1:05"
 * formatTime(754000) // "12:34"
 */
export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}