/**
 * LLM Configuration for Moonshot API (Kimi K2.5)
 * 
 * This module provides a centralized LLM client using Moonshot API
 * which is OpenAI-compatible. It can be used for chat, content generation,
 * and other AI features throughout the application.
 * 
 * Environment Variables:
 * - MOONSHOT_API_KEY: Moonshot API key (required)
 * - MOONSHOT_BASE_URL: Moonshot API base URL (default: https://api.moonshot.cn/v1)
 * - MOONSHOT_MODEL: Model to use (default: kimi-k2-5)
 */

import OpenAI from 'openai';

// Moonshot API configuration
const MOONSHOT_API_KEY = process.env.MOONSHOT_API_KEY || '';
const MOONSHOT_BASE_URL = process.env.MOONSHOT_BASE_URL || 'https://api.moonshot.cn/v1';
const MOONSHOT_MODEL = process.env.MOONSHOT_MODEL || 'kimi-k2.5';

// Available Moonshot models
export const MOONSHOT_MODELS = {
  // Kimi K2.5 models (latest, most capable)
  KIMI_K2_5: 'kimi-k2.5', // Kimi K2.5 - most intelligent, 262K context
  KIMI_K2_THINKING: 'kimi-k2-thinking', // Kimi K2 with thinking mode
  KIMI_K2_TURBO: 'kimi-k2-turbo-preview', // Kimi K2 Turbo preview
  
  // Moonshot V1 models (legacy)
  V1_8K: 'moonshot-v1-8k',
  V1_32K: 'moonshot-v1-32k',
  V1_128K: 'moonshot-v1-128k',
} as const;

// Create OpenAI client configured for Moonshot API
function createMoonshotClient(): OpenAI {
  if (!MOONSHOT_API_KEY) {
    throw new Error('MOONSHOT_API_KEY environment variable is required');
  }

  return new OpenAI({
    apiKey: MOONSHOT_API_KEY,
    baseURL: MOONSHOT_BASE_URL,
  });
}

// Singleton client instance
let _client: OpenAI | null = null;

/**
 * Get the Moonshot LLM client
 * Uses singleton pattern to avoid creating multiple clients
 */
export function getLLMClient(): OpenAI {
  if (!_client) {
    _client = createMoonshotClient();
  }
  return _client;
}

/**
 * Get the configured model name
 */
export function getModel(): string {
  return MOONSHOT_MODEL;
}

/**
 * Chat message type
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Stream callback type
 */
export type StreamCallback = (chunk: string) => void;

/**
 * Check if the model requires temperature = 1
 * Kimi K2.5 and related models only accept temperature = 1
 */
function isKimiModel(model: string): boolean {
  return model.startsWith('kimi-');
}

/**
 * Get the effective temperature for the model
 * Kimi models only accept temperature = 1
 */
function getEffectiveTemperature(model: string, requestedTemp?: number): number {
  if (isKimiModel(model)) {
    // Kimi models only accept temperature = 1
    return 1;
  }
  return requestedTemp ?? 0.7;
}

/**
 * Invoke LLM with messages and return the full response
 */
export async function invokeLLM(
  messages: ChatMessage[],
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<string> {
  const client = getLLMClient();
  const model = options.model || getModel();
  const temperature = getEffectiveTemperature(model, options.temperature);

  const response = await client.chat.completions.create({
    model,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
    temperature,
    max_tokens: options.maxTokens,
  });

  return response.choices[0]?.message?.content || '';
}

/**
 * Stream LLM response
 * Yields chunks of content as they arrive
 */
export async function* streamLLM(
  messages: ChatMessage[],
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
): AsyncGenerator<string> {
  const client = getLLMClient();
  const model = options.model || getModel();
  const temperature = getEffectiveTemperature(model, options.temperature);

  const stream = await client.chat.completions.create({
    model,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
    temperature,
    max_tokens: options.maxTokens,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}

/**
 * Stream LLM response with callback
 * Calls the callback for each chunk and returns the full response
 */
export async function streamLLMWithCallback(
  messages: ChatMessage[],
  callback: StreamCallback,
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<string> {
  let fullResponse = '';
  
  for await (const chunk of streamLLM(messages, options)) {
    fullResponse += chunk;
    callback(chunk);
  }

  return fullResponse;
}

// Export the client creation function for advanced use cases
export { createMoonshotClient };

// Default export
const LLM = {
  getClient: getLLMClient,
  getModel,
  invoke: invokeLLM,
  stream: streamLLM,
  streamWithCallback: streamLLMWithCallback,
  models: MOONSHOT_MODELS,
};

export default LLM;
