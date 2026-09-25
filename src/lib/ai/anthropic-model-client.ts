import Anthropic, {
  AnthropicError,
  APIConnectionError,
  APIConnectionTimeoutError,
  APIError,
} from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { InvalidModelOutputError, outageReasonForStatus, ProviderUnavailableError } from './errors';
import { aiRawOutputSchema } from './output';
import { AI_TIMEOUT_MS, type AiModelClient } from './types';

/** Maps an Anthropic SDK error to the provider-agnostic failure types (REQ-88, REQ-89). */
function toFailure(error: unknown): unknown {
  if (error instanceof APIConnectionTimeoutError) return new ProviderUnavailableError('timeout');
  if (error instanceof APIConnectionError) return new ProviderUnavailableError('network');
  if (error instanceof APIError && typeof error.status === 'number') {
    if (error.status === 400 && /credit balance/i.test(error.message)) {
      return new ProviderUnavailableError('credit');
    }
    const reason = outageReasonForStatus(error.status); // 401/403 → 'auth' (TASK-191)
    return reason ? new ProviderUnavailableError(reason) : error;
  }
  if (
    error instanceof AnthropicError &&
    error.message.startsWith('Failed to parse structured output')
  ) {
    return new InvalidModelOutputError(error.message);
  }
  return error;
}

/** Structured-output model client backed by the Anthropic SDK; the SDK is created on first use. */
export function createAnthropicModelClient(client?: Anthropic): AiModelClient {
  let sdk = client;
  return {
    async complete({ system, user, model, timeoutMs }) {
      sdk ??= new Anthropic();
      const response = await sdk.messages
        .parse(
          {
            model,
            max_tokens: 1024,
            system,
            messages: [{ role: 'user', content: user }],
            output_config: { format: zodOutputFormat(aiRawOutputSchema) },
          },
          { timeout: timeoutMs ?? AI_TIMEOUT_MS, maxRetries: 0 },
        )
        .catch((error: unknown) => {
          throw toFailure(error);
        });
      if (response.parsed_output == null) {
        throw new InvalidModelOutputError('model returned no structured output');
      }
      return response.parsed_output;
    },
  };
}
