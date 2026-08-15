/**
 * Official IELTS Band Rounding Algorithm.
 *
 * Rules:
 * - A fractional remainder < 0.25 rounds down to the nearest whole band (e.g. 6.125 -> 6.0)
 * - A fractional remainder >= 0.25 and < 0.75 rounds to the half band (e.g. 6.25 -> 6.5, 6.375 -> 6.5, 6.625 -> 6.5)
 * - A fractional remainder >= 0.75 rounds up to the next whole band (e.g. 6.75 -> 7.0, 6.875 -> 7.0)
 *
 * @param averageScore - The raw average of the 4 IELTS module bands (or 2-3 modules in practice)
 * @returns The official IELTS band score (between 0.0 and 9.0 in 0.5 increments)
 */
export function roundToNearestHalfIELTS(averageScore: number): number {
  if (isNaN(averageScore) || averageScore <= 0) return 0;
  if (averageScore >= 9.0) return 9.0;

  // Use precision tolerance for floating point representations (e.g. 6.2500000001)
  const EPSILON = 0.00001;
  const floorVal = Math.floor(averageScore);
  const remainder = averageScore - floorVal;

  if (remainder < 0.25 - EPSILON) {
    return floorVal;
  } else if (remainder < 0.75 - EPSILON) {
    return floorVal + 0.5;
  } else {
    return Math.min(9.0, floorVal + 1.0);
  }
}

/**
 * Computes overall IELTS band from 4 individual module bands.
 */
export function calculateOverallBand(bands: {
  listening?: number | null;
  reading?: number | null;
  writing?: number | null;
  speaking?: number | null;
}): number {
  const validBands = Object.values(bands).filter(
    (b): b is number => typeof b === 'number' && !isNaN(b)
  );

  if (validBands.length === 0) return 0;

  const sum = validBands.reduce((acc, curr) => acc + curr, 0);
  const avg = sum / validBands.length;

  return roundToNearestHalfIELTS(avg);
}
