/** OpenRouter's keys API base URL. */
export const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';

/** One OpenRouter API key as the provisioning script needs it. */
export interface KeyInfo {
  hash: string;
  name: string;
  limit: number | null;
  usage: number;
  disabled: boolean;
}

/** Minimal shape of a fetch response, so tests can fake it without a real HTTP layer. */
export interface HttpResponse {
  status: number;
  json(): Promise<unknown>;
}

/** A fetch-like function, injected so the keys API never needs a real HTTP call in tests. */
export type HttpFetch = (
  url: string,
  init: { method: string; headers: Record<string, string>; body?: string },
) => Promise<HttpResponse>;

/** Raised when a keys API call answers with a non-2xx status; never carries the response body. */
export class KeysApiError extends Error {
  constructor(
    readonly method: string,
    readonly path: string,
    readonly status: number,
  ) {
    super(`OpenRouter keys API ${method} ${path} failed: HTTP ${status}`);
    this.name = 'KeysApiError';
  }
}

/** OpenRouter keys API client authenticated with a management key (REQ-98). */
export interface KeysApi {
  list(): Promise<KeyInfo[]>;
  create(input: { name: string; limit: number }): Promise<{ info: KeyInfo; key: string }>;
  update(hash: string, input: { limit: number }): Promise<KeyInfo>;
  remove(hash: string): Promise<void>;
}

/** OpenRouter keys API client authenticated with a management key (REQ-98). */
export function createKeysApi(_deps: {
  fetch: HttpFetch;
  managementKey: string;
  baseUrl?: string;
}): KeysApi {
  return {
    async list() {
      throw new Error('not implemented');
    },
    async create() {
      throw new Error('not implemented');
    },
    async update() {
      throw new Error('not implemented');
    },
    async remove() {
      throw new Error('not implemented');
    },
  };
}
