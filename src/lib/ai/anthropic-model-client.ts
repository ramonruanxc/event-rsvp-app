import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { aiRawOutputSchema } from './output';
import { AI_TIMEOUT_MS, type AiModelClient } from './types';

/** Structured-output model client backed by the Anthropic SDK; the SDK is created on first use. */
export function createAnthropicModelClient(client?: Anthropic): AiModelClient {
  let sdk = client;
  return {
    async complete({ system, user, model, timeoutMs }) {
      sdk ??= new Anthropic();
      const response = await sdk.messages.parse(
        {
          model,
          max_tokens: 1024,
          system,
          messages: [{ role: 'user', content: user }],
          output_config: { format: zodOutputFormat(aiRawOutputSchema) },
        },
        { timeout: timeoutMs ?? AI_TIMEOUT_MS, maxRetries: 0 },
      );
      if (response.parsed_output == null) throw new Error('model returned no structured output');
      return response.parsed_output;
    },
  };
}
