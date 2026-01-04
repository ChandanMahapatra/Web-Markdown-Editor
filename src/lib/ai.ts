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
  timeTaken: number; // in ms
  tokensUsed: number;
}

let providersCache: Provider[] | null = null;

export async function getProviders(): Promise<Provider[]> {
  if (providersCache) return providersCache;

  try {
    const isDeployedHTTPS = typeof window !== 'undefined' && 
      window.location.protocol === 'https:' && 
      window.location.hostname !== 'localhost';

    const allProviders = [
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
        id: 'openrouter',
        name: 'OpenRouter',
        apiKeyRequired: true,
        baseURL: 'https://openrouter.ai/api/v1',
        models: ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o', 'openai/gpt-4-turbo', 'google/gemini-pro-1.5', 'meta-llama/llama-3.1-405b-instruct']
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

    providersCache = isDeployedHTTPS 
      ? allProviders.filter(p => !p.baseURL?.startsWith('http://'))
      : allProviders;

    return providersCache;
  } catch (error) {
    console.error('Failed to fetch providers:', error);
    return [];
  }
}

export async function testConnection(
  provider: Provider,
  apiKey?: string,
  baseURL?: string
): Promise<boolean> {
  const effectiveBaseURL = baseURL || provider.baseURL;

  try {
    if (provider.id === 'anthropic') {
      if (!apiKey || !apiKey.trim()) return false;
      const response = await fetch(`${effectiveBaseURL}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'test' }],
        }),
      });
      return response.ok;
    } else if (provider.id === 'openrouter') {
      if (!apiKey || !apiKey.trim()) return false;
      const response = await fetch(`${effectiveBaseURL}/models`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      return response.ok;
    } else {
      const isBrowser = typeof window !== 'undefined';
      let fetchBase = effectiveBaseURL || '';
      try {
        if (isBrowser && effectiveBaseURL && effectiveBaseURL.startsWith('http://')) {
          const u = new URL(effectiveBaseURL);
          if (u.hostname === 'localhost' || u.hostname === '127.0.0.1' || u.hostname.startsWith('192.168.')) {
            fetchBase = `/api/proxy?target=${encodeURIComponent(effectiveBaseURL)}`;
          }
        }
      } catch {
        return false;
      }

      const headers: Record<string, string> = {};
      if (apiKey && apiKey.trim()) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(`${fetchBase}/models`, {
        method: 'GET',
        headers,
      }).catch(err => {
        console.error('Local provider connection failed:', err);
        return null;
      });
      
      return response !== null && response.ok;
    }
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
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

  const startTime = Date.now();
  try {
    if (provider.id === 'anthropic') {
      if (!apiKey) {
        throw new Error('API key is required for Anthropic');
      }

      const response = await fetch(`${effectiveBaseURL}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 500,
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
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const endTime = Date.now();
      const content = data.content?.[0]?.text || '';
      const timeTaken = endTime - startTime;
      const tokensUsed = data.usage?.output_tokens || 0;
      return { ...parseEvaluationResponse(content), timeTaken, tokensUsed };
    } else if (provider.id === 'openrouter') {
      if (!apiKey) {
        throw new Error('API key is required for OpenRouter');
      }

      console.log('Calling OpenRouter API:', { baseURL: effectiveBaseURL, model });
      const response = await fetch(`${effectiveBaseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
          'X-Title': 'Markdown Editor',
        },
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
        const errorText = await response.text();
        console.error('OpenRouter API error response:', errorText);
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('OpenRouter API response:', data);
      const endTime = Date.now();
      const content = data.choices?.[0]?.message?.content || '';
      const timeTaken = endTime - startTime;
      const tokensUsed = data.usage?.total_tokens || 0;
      return { ...parseEvaluationResponse(content), timeTaken, tokensUsed };
    } else {
      const isBrowser = typeof window !== 'undefined';
      let fetchBase = effectiveBaseURL;
      try {
        if (isBrowser && effectiveBaseURL && effectiveBaseURL.startsWith('http://')) {
          const u = new URL(effectiveBaseURL);
          if (u.hostname === 'localhost' || u.hostname === '127.0.0.1' || u.hostname.startsWith('192.168.')) {
            fetchBase = `/api/proxy?target=${encodeURIComponent(effectiveBaseURL)}`;
          }
        }
      } catch {
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (apiKey && apiKey.trim()) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(`${fetchBase}/chat/completions`, {
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
      const endTime = Date.now();
      const content = data.choices?.[0]?.message?.content || '';
      const timeTaken = endTime - startTime;
      const tokensUsed = data.usage?.total_tokens || 0;
      return { ...parseEvaluationResponse(content), timeTaken, tokensUsed };
    }
  } catch (error) {
    console.error('Evaluation failed:', error);
    throw error;
  }
}

function parseEvaluationResponse(response: string): Omit<EvaluationResult, 'timeTaken' | 'tokensUsed'> {
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
