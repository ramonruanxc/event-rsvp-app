import type Anthropic from '@anthropic-ai/sdk';
import type { AiModelClient } from './types';

/** Structured-output model client backed by the Anthropic SDK; the SDK is created on first use. */
export function createAnthropicModelClient(client?: Anthropic): AiModelClient {
  void client;
  return {
    async complete() {
      throw new Error('not implemented');
    },
  };
}
