export function computePoints(actual: number, guess: number): number {
  const diff = Math.abs(actual - guess);
  if (diff === 0) return 10;
  if (diff === 1) return 8;
  if (diff === 2) return 5;
  if (diff === 3) return 2;
  return 0;
}
