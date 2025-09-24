export interface Provider {
  id: string;
  name: string;
  apiKeyRequired: boolean;
  baseURL?: string;
  models: string[];
}

export interface EvaluationResult {
  scores: {
    grammar: number;
    clarity: number;
    overall: number;
  };
  suggestions: string[];
}

let providersCache: Provider[] | null = null;

export async function getProviders(): Promise<Provider[]> {
  if (providersCache) return providersCache;

  try {
    // In a real implementation, fetch from https://ai-sdk.dev/providers/ai-sdk-providers
    // For now, mock some providers
    providersCache = [
      {
        id: 'openai',
        name: 'OpenAI',
        apiKeyRequired: true,
        baseURL: 'https://api.openai.com/v1',
        models: ['gpt-4', 'gpt-3.5-turbo']
      },
      {
        id: 'anthropic',
        name: 'Anthropic',
        apiKeyRequired: true,
        baseURL: 'https://api.anthropic.com',
        models: ['claude-3-sonnet', 'claude-3-haiku']
      },
      {
        id: 'lmstudio',
        name: 'LM Studio (Local)',
        apiKeyRequired: false,
        baseURL: 'http://localhost:1234',
        models: ['local-model']
      },
      {
        id: 'ollama',
        name: 'Ollama (Local)',
        apiKeyRequired: false,
        baseURL: 'http://localhost:11434',
        models: ['llama2', 'codellama', 'mistral']
      }
    ];
    return providersCache;
  } catch (error) {
    console.error('Failed to fetch providers:', error);
    return [];
  }
}

export async function evaluateText(
  text: string,
  provider: Provider,
  model: string,
  apiKey?: string
): Promise<EvaluationResult> {
  // Mock implementation - in real app, call the provider's API
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call

  // Simple mock scoring
  const wordCount = text.split(/\s+/).length;
  const grammar = Math.min(100, 80 + Math.random() * 20);
  const clarity = Math.max(0, 100 - wordCount / 10);
  const overall = (grammar + clarity) / 2;

  const suggestions = [
    'Consider using more active voice.',
    'Some sentences are quite long.',
    'Try to vary your sentence structure.'
  ];

  return {
    scores: {
      grammar: Math.round(grammar),
      clarity: Math.round(clarity),
      overall: Math.round(overall)
    },
    suggestions
  };
}
