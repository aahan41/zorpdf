import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Only allow proxying images that actually came back from BRIA, to prevent
// this route being abused as an open image proxy / SSRF vector.
const ALLOWED_HOSTS = ['bria.ai', 'bria-api.com'];

function isAllowedHost(hostname: string) {
  return ALLOWED_HOSTS.some((allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`));
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'url query param zaroori hai' }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  if (!isAllowedHost(parsed.hostname)) {
    return NextResponse.json({ error: 'Ye host allowed nahi hai' }, { status: 403 });
  }

  try {
    const upstream = await fetch(parsed.toString());
    if (!upstream.ok) {
      return NextResponse.json({ error: 'Image fetch nahi ho payi' }, { status: 502 });
    }

    const contentType = upstream.headers.get('content-type') || 'image/png';
    const bytes = await upstream.arrayBuffer();

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err) {
    console.error('proxy-image error:', err);
    return NextResponse.json({ error: 'Image proxy fail ho gaya' }, { status: 500 });
  }
}
