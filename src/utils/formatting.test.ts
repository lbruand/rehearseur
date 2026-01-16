import { describe, it, expect } from 'vitest';
import { formatTime } from './formatting';

describe('formatTime', () => {
  it('should format seconds to MM:SS', () => {
    expect(formatTime(5000)).toBe('0:05');
    expect(formatTime(15000)).toBe('0:15');
    expect(formatTime(45000)).toBe('0:45');
  });

  it('should format minutes and seconds correctly', () => {
    expect(formatTime(65000)).toBe('1:05');
    expect(formatTime(125000)).toBe('2:05');
    expect(formatTime(185000)).toBe('3:05');
  });

  it('should pad seconds with leading zero', () => {
    expect(formatTime(61000)).toBe('1:01');
    expect(formatTime(62000)).toBe('1:02');
    expect(formatTime(69000)).toBe('1:09');
  });

  it('should handle zero', () => {
    expect(formatTime(0)).toBe('0:00');
  });

  it('should handle large values', () => {
    expect(formatTime(600000)).toBe('10:00');
    expect(formatTime(754000)).toBe('12:34');
    expect(formatTime(3600000)).toBe('60:00'); // 1 hour displayed as 60 minutes
  });

  it('should handle values less than a second', () => {
    expect(formatTime(500)).toBe('0:00'); // Rounds down
    expect(formatTime(999)).toBe('0:00'); // Rounds down
  });

  it('should handle exact minute boundaries', () => {
    expect(formatTime(60000)).toBe('1:00');
    expect(formatTime(120000)).toBe('2:00');
    expect(formatTime(180000)).toBe('3:00');
  });

  it('should always show seconds with 2 digits', () => {
    expect(formatTime(1000)).toBe('0:01');
    expect(formatTime(10000)).toBe('0:10');
    expect(formatTime(100000)).toBe('1:40');
  });
});