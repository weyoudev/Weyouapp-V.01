import { type NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api';

/** Forward request to the real API so the browser stays same-origin (avoids CORS). */
async function proxy(request: NextRequest, pathSegments: string[]) {
  const path = pathSegments.join('/');
  const base = API_BASE.replace(/\/$/, '');
  const url = new URL(`${base}/${path}${request.nextUrl.search}`);

  const headers = new Headers();
  const auth = request.headers.get('authorization');
  if (auth) headers.set('Authorization', auth);
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('Content-Type', contentType);

  let body: BodyInit | undefined;
  const method = request.method;
  if (method !== 'GET' && method !== 'HEAD') {
    try {
      body = await request.text();
    } catch {
      // no body
    }
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body || undefined,
    signal: AbortSignal.timeout(65000), // slightly above client timeout
  });

  const responseHeaders = new Headers();
  const contentTypeRes = res.headers.get('content-type');
  if (contentTypeRes) responseHeaders.set('Content-Type', contentTypeRes);

  const responseBody = await res.text();
  return new NextResponse(responseBody, {
    status: res.status,
    statusText: res.statusText,
    headers: responseHeaders,
  });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxy(request, path);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxy(request, path);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxy(request, path);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxy(request, path);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxy(request, path);
}

export async function OPTIONS(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxy(request, path);
}

export async function HEAD(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxy(request, path);
}
