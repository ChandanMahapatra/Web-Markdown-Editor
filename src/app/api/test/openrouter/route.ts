import { NextResponse } from 'next/server';
import { testConnection, Provider } from '@/lib/ai';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const target = url.searchParams.get('target');
    const apiKey = url.searchParams.get('key') || undefined;
    if (!target) {
      return NextResponse.json({ error: 'Missing target parameter' }, { status: 400 });
    }

    // Create a minimal provider-like object for testing
    const provider = {
      id: 'openrouter',
      name: 'OpenRouter',
      apiKeyRequired: true,
      baseURL: target,
      models: [],
    };

    const ok = await testConnection(provider as Provider, apiKey, target);
    return NextResponse.json({ ok });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
