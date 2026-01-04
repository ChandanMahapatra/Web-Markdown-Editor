import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const path = url.pathname || '';

  if (path.endsWith('/models') || path.endsWith('/api/mock/openrouter/models')) {
    return NextResponse.json({ data: [{ id: 'mock-model', name: 'Mock Model' }] });
  }

  return NextResponse.json({ message: 'Mock OpenRouter GET' });
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const path = url.pathname || '';

  if (path.endsWith('/chat/completions') || path.endsWith('/api/mock/openrouter/chat/completions')) {
    const body = await req.json().catch(() => ({}));
    return NextResponse.json({
      id: 'mock-response',
      choices: [
        {
          message: {
            role: 'assistant',
            content: 'Grammar: 90\nClarity: 85\nOverall: 88\nSuggestions:\n- Shorten sentences\n- Improve headings',
          },
        },
      ],
      usage: { total_tokens: 42 },
      echoedBody: body,
    });
  }

  return NextResponse.json({ message: 'Mock OpenRouter POST' });
}
