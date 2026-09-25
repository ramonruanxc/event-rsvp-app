/** Efforts accepted by the OpenRouter reasoning API (docs checked 2026-09-25) (REQ-99). */
export const REASONING_EFFORTS = [
  'max',
  'xhigh',
  'high',
  'medium',
  'low',
  'minimal',
  'none',
] as const;
/** One of REASONING_EFFORTS. */
export type ReasoningEffort = (typeof REASONING_EFFORTS)[number];
/** Every value of OPENROUTER_REASONING_EFFORT: an effort, or `omit` to send no `reasoning` field (REQ-99). */
export const REASONING_EFFORT_SETTINGS = [...REASONING_EFFORTS, 'omit'] as const;
/** One of REASONING_EFFORT_SETTINGS. */
export type ReasoningEffortSetting = (typeof REASONING_EFFORT_SETTINGS)[number];
/** Effort used when OPENROUTER_REASONING_EFFORT is unset, blank or unknown (amendment A4). */
export const DEFAULT_REASONING_EFFORT: ReasoningEffortSetting = 'low';
