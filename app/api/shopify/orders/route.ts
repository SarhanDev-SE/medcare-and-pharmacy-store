import { NextRequest, NextResponse } from 'next/server';
import { lookupShopifyOrderByNumberAndEmail } from '@/lib/shopify/customer';
import { getShopifyStorefrontData } from '@/lib/shopify/storefront';

export async function GET(req: NextRequest) {
  const number = req.nextUrl.searchParams.get('number')?.trim() || '';
  const email = req.nextUrl.searchParams.get('email')?.trim() || '';

  if (!number) {
    return NextResponse.json({ ok: false, error: 'Order number is required.' }, { status: 400 });
  }

  try {
    const storefront = await getShopifyStorefrontData();
    const order = await lookupShopifyOrderByNumberAndEmail(
      number,
      email || undefined,
      storefront.products
    );
    if (!order) {
      return NextResponse.json({ ok: false, order: null }, { status: 404 });
    }
    return NextResponse.json({ ok: true, order });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to look up Shopify order.';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
