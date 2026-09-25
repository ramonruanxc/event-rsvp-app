/** Nearest-rank 95th percentile: ascending element ceil(95·n/100) − 1; 0 for no values (REQ-101). */
export function percentile95(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.ceil((95 * sorted.length) / 100) - 1];
}
