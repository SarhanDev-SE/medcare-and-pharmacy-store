import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const secret = process.env.SHOPIFY_REVALIDATE_SECRET;
  if (secret) {
    const provided =
      req.nextUrl.searchParams.get('secret') || req.headers.get('x-revalidate-secret');
    if (provided !== secret) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }
  }

  revalidateTag('shopify');
  return NextResponse.json({
    ok: true,
    revalidated: true,
    tag: 'shopify',
    timestamp: new Date().toISOString(),
  });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
