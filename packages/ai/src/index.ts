import { AIProvider } from './interface.js';
import { OpenAIProvider } from './providers/openai.js';
import { MockAIProvider } from './providers/mock.js';

export * from './interface.js';
export * from './prompts/templates.js';
export * from './providers/mock.js';
export * from './providers/openai.js';
export * from './pipeline/chunker.js';
export * from './pipeline/grounding.js';
export * from './pipeline/dedupe.js';
export * from './pipeline/critic.js';
export * from './pipeline/card-generator.js';

/**
 * AI Provider Factory with automatic fallback
 */
export function getAIClient(preferredProvider?: string): AIProvider {
  const provider = preferredProvider || process.env.AI_PROVIDER || 'mock';

  if (provider === 'openai' && process.env.OPENAI_API_KEY) {
    return new OpenAIProvider();
  }

  // Fallback to high-fidelity mock provider if no API key is configured
  return new MockAIProvider();
}
