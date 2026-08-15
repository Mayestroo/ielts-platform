import { describe, it, expect } from 'vitest';
import { roundToNearestHalfIELTS, calculateOverallBand } from '../src/scoring/rounding.js';

describe('Official IELTS Band Rounding', () => {
  it('correctly rounds across all 8 possible remainder fractions', () => {
    // 0.000 remainder -> unchanged
    expect(roundToNearestHalfIELTS(6.0)).toBe(6.0);

    // 0.125 remainder (< 0.25) -> rounds down to whole band
    expect(roundToNearestHalfIELTS(6.125)).toBe(6.0);

    // 0.250 remainder (>= 0.25 and < 0.75) -> rounds UP to half band (.5)
    expect(roundToNearestHalfIELTS(6.25)).toBe(6.5);

    // 0.375 remainder (>= 0.25 and < 0.75) -> rounds UP to half band (.5)
    expect(roundToNearestHalfIELTS(6.375)).toBe(6.5);

    // 0.500 remainder -> unchanged (.5)
    expect(roundToNearestHalfIELTS(6.5)).toBe(6.5);

    // 0.625 remainder (>= 0.25 and < 0.75) -> rounds DOWN to half band (.5)
    expect(roundToNearestHalfIELTS(6.625)).toBe(6.5);

    // 0.750 remainder (>= 0.75) -> rounds UP to next whole band (7.0)
    expect(roundToNearestHalfIELTS(6.75)).toBe(7.0);

    // 0.875 remainder (>= 0.75) -> rounds UP to next whole band (7.0)
    expect(roundToNearestHalfIELTS(6.875)).toBe(7.0);
  });

  it('clamps ceiling at Band 9.0', () => {
    expect(roundToNearestHalfIELTS(9.0)).toBe(9.0);
    expect(roundToNearestHalfIELTS(9.5)).toBe(9.0);
  });

  it('calculates composite overall band from 4 module scores', () => {
    // (6.5 + 6.5 + 6.0 + 6.0) / 4 = 6.25 -> 6.5
    expect(calculateOverallBand({ listening: 6.5, reading: 6.5, writing: 6.0, speaking: 6.0 })).toBe(6.5);

    // (7.0 + 7.5 + 6.5 + 6.0) / 4 = 6.75 -> 7.0
    expect(calculateOverallBand({ listening: 7.0, reading: 7.5, writing: 6.5, speaking: 6.0 })).toBe(7.0);

    // (8.0 + 8.0 + 7.5 + 7.0) / 4 = 7.625 -> 7.5
    expect(calculateOverallBand({ listening: 8.0, reading: 8.0, writing: 7.5, speaking: 7.0 })).toBe(7.5);
  });
});
