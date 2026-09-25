import { z } from 'zod';

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

const keyInfoSchema = z.object({
  hash: z.string(),
  name: z.string(),
  limit: z.number().nullable().default(null),
  usage: z.number().default(0),
  disabled: z.boolean().default(false),
});
const listSchema = z.object({ data: z.array(keyInfoSchema) });
const oneSchema = z.object({ data: keyInfoSchema });
const createdSchema = z.object({ data: keyInfoSchema, key: z.string() });
const MAX_PAGES = 50;

/** OpenRouter keys API client authenticated with a management key (REQ-98). */
export function createKeysApi(deps: {
  fetch: HttpFetch;
  managementKey: string;
  baseUrl?: string;
}): KeysApi {
  const base = (deps.baseUrl ?? OPENROUTER_API_URL).replace(/\/+$/, '');
  const call = async (method: string, path: string, body?: unknown): Promise<unknown> => {
    const response = await deps.fetch(`${base}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${deps.managementKey}`,
        'Content-Type': 'application/json',
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status < 200 || response.status >= 300) {
      throw new KeysApiError(method, path.split('?')[0], response.status);
    }
    return response.json();
  };
  return {
    async list() {
      const keys: KeyInfo[] = [];
      for (let page = 0; page < MAX_PAGES; page++) {
        const { data } = listSchema.parse(
          await call('GET', `/keys?include_disabled=true&offset=${keys.length}`),
        );
        if (data.length === 0) break;
        keys.push(...data);
      }
      return keys;
    },
    async create(input) {
      const { data, key } = createdSchema.parse(
        await call('POST', '/keys', { name: input.name, limit: input.limit }),
      );
      return { info: data, key };
    },
    async update(hash, input) {
      return oneSchema.parse(
        await call('PATCH', `/keys/${encodeURIComponent(hash)}`, { limit: input.limit }),
      ).data;
    },
    async remove(hash) {
      await call('DELETE', `/keys/${encodeURIComponent(hash)}`);
    },
  };
}
