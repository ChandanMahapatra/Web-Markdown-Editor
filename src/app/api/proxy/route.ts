import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key, x-proxy-target',
};

function isAllowedTarget(target: URL) {
  // Allow localhost and local 192.168.*.* subnets on the expected LM Studio port (1234)
  const hostname = target.hostname;
  const port = target.port || '80';
  if (port !== '1234') return false;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
  if (/^192\.168\./.test(hostname)) return true;
  return false;
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS });
}

async function proxyRequest(req: Request) {
  try {
    const url = new URL(req.url);
    const targetParam = url.searchParams.get('target') || req.headers.get('x-proxy-target') || '';
    if (!targetParam) {
      return new NextResponse(JSON.stringify({ error: 'Missing target parameter' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    let target: URL;
    try {
      target = new URL(targetParam);
    } catch {
      return new NextResponse(JSON.stringify({ error: 'Invalid target URL' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    if (!isAllowedTarget(target)) {
      return new NextResponse(JSON.stringify({ error: 'Target not allowed' }), {
        status: 403,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // Rebuild upstream URL preserving path and query if `target` only contains origin
    const incomingUrl = new URL(req.url);
    // If caller passed a full path in `target`, use it as-is. Otherwise, attach the incoming path.
    const upstream = target.pathname && target.pathname !== '/' ? target.toString() : (target.origin + incomingUrl.pathname + incomingUrl.search);
    
    console.log('Proxying request:', { method: req.method, upstream, target: target.toString() });

    const forwardHeaders: Record<string, string> = {};
    // Forward Authorization or x-api-key if present
    const auth = req.headers.get('authorization') || req.headers.get('x-api-key');
    if (auth) forwardHeaders['Authorization'] = auth;
    // Forward content-type
    const contentType = req.headers.get('content-type');
    if (contentType) forwardHeaders['Content-Type'] = contentType;

    const res = await fetch(upstream, {
      method: req.method,
      headers: forwardHeaders,
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.arrayBuffer(),
      cache: 'no-store',
    });

    const buffer = await res.arrayBuffer();
    const headers: Record<string, string> = { ...CORS_HEADERS };
    const contentTypeResp = res.headers.get('content-type');
    if (contentTypeResp) headers['Content-Type'] = contentTypeResp;

    return new NextResponse(Buffer.from(buffer), {
      status: res.status,
      headers,
    });
  } catch (err) {
    console.error('Proxy error:', err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorDetails = err instanceof Error ? err.stack : '';
    return new NextResponse(JSON.stringify({ 
      error: 'Proxy error', 
      details: errorMessage,
      stack: errorDetails 
    }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
}

export async function GET(req: Request) {
  return proxyRequest(req);
}

export async function POST(req: Request) {
  return proxyRequest(req);
}
