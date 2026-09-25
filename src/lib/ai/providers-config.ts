import {
  AI_PROVIDER_NAMES,
  type AiModelClient,
  type AiProvider,
  type AiProviderName,
} from './types';

/** Environment variables as read by the provider configuration. */
export type ProviderEnv = Readonly<Record<string, string | undefined>>;
/** Providers used when AI_PROVIDERS is unset or blank: OpenRouter only; Anthropic must be listed (BR-119, amended 2026-09-25). */
export const DEFAULT_AI_PROVIDERS: readonly AiProviderName[] = ['openrouter'];
/** Environment variable holding each provider's API key (BR-120). */
export const PROVIDER_KEY_ENV: Record<AiProviderName, string> = {
  anthropic: 'ANTHROPIC_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
};
/** Environment variable holding each provider's model id. */
export const PROVIDER_MODEL_ENV: Record<AiProviderName, string> = {
  anthropic: 'AI_MODEL',
  openrouter: 'OPENROUTER_MODEL',
};
/** Model used when the provider's model variable is unset or blank. */
export const DEFAULT_MODELS: Record<AiProviderName, string> = {
  anthropic: 'claude-haiku-4-5',
  openrouter: 'anthropic/claude-haiku-4.5',
};

/** Reads the ordered provider list from AI_PROVIDERS: trimmed, lower-cased, known names only, first occurrence kept. */
export function parseAiProviders(value: string | undefined): AiProviderName[] {
  if (value === undefined || value.trim() === '') return [...DEFAULT_AI_PROVIDERS];
  const names: AiProviderName[] = [];
  for (const item of value.split(',')) {
    const name = item.trim().toLowerCase() as AiProviderName;
    if ((AI_PROVIDER_NAMES as readonly string[]).includes(name) && !names.includes(name))
      names.push(name);
  }
  return names;
}

/** Builds the provider list in AI_PROVIDERS order, skipping providers without a key (BR-119, BR-120). */
export function buildAiProviders(
  env: ProviderEnv,
  factories: Record<AiProviderName, () => AiModelClient>,
): AiProvider[] {
  return parseAiProviders(env.AI_PROVIDERS)
    .filter((name) => (env[PROVIDER_KEY_ENV[name]] ?? '').trim() !== '')
    .map((name) => ({
      name,
      client: factories[name](),
      model: env[PROVIDER_MODEL_ENV[name]]?.trim() || DEFAULT_MODELS[name],
    }));
}
