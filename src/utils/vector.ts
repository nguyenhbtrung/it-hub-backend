export function l2Normalize(vector: number[]): number[] {
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));

  return vector.map((v) => v / norm);
}
