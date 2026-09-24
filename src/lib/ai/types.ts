/** Fields the AI can fill on the event form, in the form's display order. */
export const AI_FIELDS = ['name', 'description', 'date', 'time', 'timezone', 'location'] as const;
/** One of AI_FIELDS. */
export type AiField = (typeof AI_FIELDS)[number];
/** Hard limit for one "Fill with AI" model call (BR-64). */
export const AI_TIMEOUT_MS = 10_000;

/** Outcome of parsing organizer text into event fields. */
export interface ParseEventResult {
  fields: Record<AiField, string | null>;
  missing: AiField[]; // always in AI_FIELDS order
  timezoneFromText: boolean;
  /** True when the text does not describe an event (BR-96): every field null, missing = AI_FIELDS. */
  notAnEvent: boolean;
}

/** Turns organizer-written text into event fields. */
export interface EventTextParser {
  /** Parses request.text, resolving the timezone against request.formTimezone as of request.now. */
  parse(request: { text: string; formTimezone: string | null; now: Date }): Promise<ParseEventResult>;
}

/** Low-level model call: returns the model's structured output (unvalidated). */
export interface AiModelClient {
  /** Sends the system and user messages to the given model and returns its raw structured output. */
  complete(request: { system: string; user: string; model: string }): Promise<unknown>;
}
