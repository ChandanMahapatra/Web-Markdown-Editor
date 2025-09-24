import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';

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
        baseURL: 'http://localhost:1234/v1',
        models: ['local-model']
      },
      {
        id: 'ollama',
        name: 'Ollama (Local)',
        apiKeyRequired: false,
        baseURL: 'http://localhost:11434/v1',
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
  apiKey?: string,
  baseURL?: string
): Promise<EvaluationResult> {
  const effectiveBaseURL = baseURL || provider.baseURL;

  if (provider.id === 'anthropic') {
    const aiModel = anthropic(model, { apiKey: apiKey || '' });
    const result = await generateText({
      model: aiModel,
      prompt: `Evaluate the following markdown text for grammar, clarity, and overall quality. Provide scores out of 100 and up to 3 suggestions for improvement.

Format your response exactly like this:
Grammar: [score]
Clarity: [score]
Overall: [score]
Suggestions:
- [suggestion1]
- [suggestion2]
- [suggestion3]

Text:
${text}`,
    });
    return parseEvaluationResponse(result.text);
  } else {
    // Direct API call for OpenAI-compatible providers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey && apiKey.trim()) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(`${effectiveBaseURL}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: `Evaluate the following markdown text for grammar, clarity, and overall quality. Provide scores out of 100 and up to 3 suggestions for improvement.

Format your response exactly like this:
Grammar: [score]
Clarity: [score]
Overall: [score]
Suggestions:
- [suggestion1]
- [suggestion2]
- [suggestion3]

Text:
${text}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    return parseEvaluationResponse(content);
  }
}

function parseEvaluationResponse(response: string): EvaluationResult {
  const lines = response.split('\n').map(line => line.trim());

  let grammar = 0;
  let clarity = 0;
  let overall = 0;
  const suggestions: string[] = [];

  let inSuggestions = false;
  for (const line of lines) {
    if (line.toLowerCase().startsWith('grammar:')) {
      grammar = parseInt(line.split(':')[1]?.trim() || '0') || 0;
    } else if (line.toLowerCase().startsWith('clarity:')) {
      clarity = parseInt(line.split(':')[1]?.trim() || '0') || 0;
    } else if (line.toLowerCase().startsWith('overall:')) {
      overall = parseInt(line.split(':')[1]?.trim() || '0') || 0;
    } else if (line.toLowerCase().startsWith('suggestions:')) {
      inSuggestions = true;
    } else if (inSuggestions && line.startsWith('-')) {
      suggestions.push(line.substring(1).trim());
    }
  }

  return {
    scores: {
      grammar: Math.max(0, Math.min(100, grammar)),
      clarity: Math.max(0, Math.min(100, clarity)),
      overall: Math.max(0, Math.min(100, overall)),
    },
    suggestions,
  };
}
