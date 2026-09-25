/** Formats a 0..1 rate as a rounded percentage, e.g. `0.753 → '75%'`. */
export function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

/** Formats milliseconds as seconds with one decimal, e.g. `10000 → '10.0 s'`. */
export function seconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)} s`;
}
