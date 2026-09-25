import { describe, expect, it } from 'vitest';
import { readEnvValue, upsertEnvValue } from './env-file';

describe('env file helpers (REQ-98)', () => {
  it('REQ-98: readEnvValue returns the non-empty value of a variable', () => {
    expect(readEnvValue('A=1\nOPENROUTER_API_KEY=sk-or-v1-abc\n', 'OPENROUTER_API_KEY')).toBe(
      'sk-or-v1-abc',
    );
    expect(readEnvValue('OPENROUTER_API_KEY="sk-q"\r\n', 'OPENROUTER_API_KEY')).toBe('sk-q');
    expect(readEnvValue('OPENROUTER_API_KEY=\n', 'OPENROUTER_API_KEY')).toBeUndefined();
    expect(readEnvValue('# OPENROUTER_API_KEY=old\n', 'OPENROUTER_API_KEY')).toBeUndefined();
    expect(readEnvValue('OPENROUTER_API_KEY_OLD=x\n', 'OPENROUTER_API_KEY')).toBeUndefined();
    expect(readEnvValue('', 'OPENROUTER_API_KEY')).toBeUndefined();
    expect(readEnvValue('OPENROUTER_API_KEY=a\nOPENROUTER_API_KEY=b\n', 'OPENROUTER_API_KEY')).toBe(
      'b',
    );
  });

  it('REQ-98: upsertEnvValue replaces or appends the line and keeps the others', () => {
    expect(upsertEnvValue('A=1\nK=old\nB=2\n', 'K', 'new')).toBe('A=1\nK=new\nB=2\n');
    expect(upsertEnvValue('A=1', 'K', 'v')).toBe('A=1\nK=v\n');
    expect(upsertEnvValue('', 'K', 'v')).toBe('K=v\n');
    expect(upsertEnvValue('A=1\r\nK=old\r\n', 'K', 'v')).toBe('A=1\r\nK=v\r\n');
    expect(upsertEnvValue('A=1\r\n', 'K', 'v')).toBe('A=1\r\nK=v\r\n');
    expect(upsertEnvValue('K=a\nK=b\n', 'K', 'v')).toBe('K=v\nK=v\n');
  });
});
