import { NextRequest, NextResponse } from 'next/server';
import {
  buildCustomerAccountSnapshot,
  createShopifyCustomerAccount,
  SESSION_COOKIE_NAME,
  signSessionToken,
} from '@/lib/shopify/customer';
import { getShopifyStorefrontData } from '@/lib/shopify/storefront';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { identifier?: string; password?: string };
    const identifier = typeof body.identifier === 'string' ? body.identifier.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!identifier || password.length < 4) {
      return NextResponse.json(
        { ok: false, error: 'Please provide an email/username and a password (min 4 characters).' },
        { status: 400 }
      );
    }

    const customer = await createShopifyCustomerAccount({ identifier, password });
    const storefront = await getShopifyStorefrontData();
    const snapshot = buildCustomerAccountSnapshot(customer, storefront.products);

    const token = signSessionToken({
      customerId: customer.id,
      email: customer.email || snapshot.user.email,
      exp: Date.now() + 30 * 86400_000,
    });

    const res = NextResponse.json({ ok: true, ...snapshot });
    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 86400,
    });
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to create Shopify account.';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
