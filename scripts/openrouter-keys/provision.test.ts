import { describe, expect, it, vi } from 'vitest';
import type { KeyInfo } from './keys-api';
import { ProvisionError, provisionKey, type ProvisionInput } from './provision';

const info = (extra: Partial<KeyInfo> = {}): KeyInfo => ({
  hash: 'h1',
  name: 'event-rsvp-app',
  limit: 3,
  usage: 0.12,
  disabled: false,
  ...extra,
});
const fakeApi = (keys: KeyInfo[]) => ({
  list: vi.fn(async () => keys),
  create: vi.fn(async (input: { name: string; limit: number }) => ({
    info: { hash: 'h-new', name: input.name, limit: input.limit, usage: 0, disabled: false },
    key: 'sk-or-v1-new',
  })),
  update: vi.fn(async (hash: string, input: { limit: number }) => ({
    ...(keys.find((k) => k.hash === hash) as KeyInfo),
    limit: input.limit,
  })),
  remove: vi.fn(async () => {}),
});
const INPUT: ProvisionInput = {
  name: 'event-rsvp-app',
  limit: 3,
  rotate: false,
  existingApiKey: undefined,
};

describe('provisionKey (REQ-98)', () => {
  it('REQ-98: creates the key when none has that name', async () => {
    const api = fakeApi([info({ hash: 'h0', name: 'other' })]);
    await expect(provisionKey(api, INPUT)).resolves.toEqual({
      action: 'created',
      info: { hash: 'h-new', name: 'event-rsvp-app', limit: 3, usage: 0, disabled: false },
      newKey: 'sk-or-v1-new',
    });
    expect(api.create).toHaveBeenCalledWith({ name: 'event-rsvp-app', limit: 3 });
  });

  it('REQ-98: reuses the named key when its value is already in the env file', async () => {
    const api = fakeApi([info()]);
    await expect(provisionKey(api, { ...INPUT, existingApiKey: 'sk-or-v1-old' })).resolves.toEqual({
      action: 'reused',
      info: info(),
    });
    expect(api.create).not.toHaveBeenCalled();
    expect(api.update).not.toHaveBeenCalled();
    expect(api.remove).not.toHaveBeenCalled();
  });

  it('REQ-98: updates the spend limit of the named key when it differs', async () => {
    const api = fakeApi([info({ limit: 5 })]);
    const result = await provisionKey(api, { ...INPUT, existingApiKey: 'sk-or-v1-old' });
    expect(result.action).toBe('limit-updated');
    expect(result.info.limit).toBe(3);
    expect(result.newKey).toBeUndefined();
    expect(api.update).toHaveBeenCalledWith('h1', { limit: 3 });
  });

  it('REQ-98: an existing key is never replaced without --rotate', async () => {
    const api = fakeApi([info()]);
    await expect(provisionKey(api, INPUT)).rejects.toThrow(ProvisionError);
    await expect(provisionKey(api, INPUT)).rejects.toThrow(
      'Key "event-rsvp-app" exists but OPENROUTER_API_KEY is not in the env file — re-run with --rotate to replace it.',
    );
    expect(api.create).not.toHaveBeenCalled();
    expect(api.remove).not.toHaveBeenCalled();

    const disabledApi = fakeApi([info({ disabled: true })]);
    await expect(
      provisionKey(disabledApi, { ...INPUT, existingApiKey: 'sk-or-v1-old' }),
    ).rejects.toThrow('Key "event-rsvp-app" is disabled — re-run with --rotate to replace it.');
    expect(disabledApi.create).not.toHaveBeenCalled();
    expect(disabledApi.remove).not.toHaveBeenCalled();
  });

  it('REQ-98: --rotate deletes the named key and creates a new one', async () => {
    const api = fakeApi([info()]);
    const result = await provisionKey(api, {
      ...INPUT,
      rotate: true,
      existingApiKey: 'sk-or-v1-old',
    });
    expect(result.action).toBe('rotated');
    expect(result.newKey).toBe('sk-or-v1-new');
    expect(api.remove).toHaveBeenCalledWith('h1');
    expect(api.remove.mock.invocationCallOrder[0]).toBeLessThan(
      api.create.mock.invocationCallOrder[0],
    );
  });
});
