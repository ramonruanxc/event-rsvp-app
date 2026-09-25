import type { HttpFetch } from './keys-api';

/** One canned answer of the fake HTTP layer, matched on method and full URL. */
export interface FakeRoute {
  method: string;
  url: string;
  status: number;
  body: unknown;
}
/** One request received by the fake HTTP layer. */
export interface FakeCall {
  url: string;
  init: { method: string; headers: Record<string, string>; body?: string };
}

/** In-memory HTTP layer for tests: answers from `routes`, records every call, throws on an unknown route. */
export function fakeHttp(routes: FakeRoute[]): { fetch: HttpFetch; calls: FakeCall[] } {
  const calls: FakeCall[] = [];
  const fetch: HttpFetch = async (url, init) => {
    calls.push({ url, init });
    const route = routes.find((r) => r.method === init.method && r.url === url);
    if (!route) throw new Error(`fakeHttp: no route for ${init.method} ${url}`);
    return { status: route.status, json: async () => route.body };
  };
  return { fetch, calls };
}
