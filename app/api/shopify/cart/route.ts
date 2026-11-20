import { NextRequest, NextResponse } from 'next/server';
import { getShopifyConfig, shopifyStorefrontQuery } from '@/lib/shopify/client';
import { CART_COOKIE_NAME } from '@/lib/shopify/customer';
import type { CartItem } from '@/lib/types';

interface StorefrontCartResponse {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  note?: string | null;
  discountCodes?: Array<{ code: string; applicable: boolean }>;
  lines: {
    nodes: Array<{
      id: string;
      quantity: number;
      attributes?: Array<{ key: string; value?: string | null }>;
      merchandise: {
        id: string;
        title: string;
        price: { amount: string; currencyCode: string };
        compareAtPrice?: { amount: string; currencyCode: string } | null;
        image?: { url: string } | null;
        product: {
          id: string;
          handle: string;
          title: string;
          featuredImage?: { url: string } | null;
        };
      };
    }>;
  };
}

const CART_FRAGMENT = `
  id
  checkoutUrl
  totalQuantity
  note
  discountCodes { code applicable }
  lines(first: 50) {
    nodes {
      id
      quantity
      attributes { key value }
      merchandise {
        ... on ProductVariant {
          id
          title
          price { amount currencyCode }
          compareAtPrice { amount currencyCode }
          image { url }
          product {
            id
            handle
            title
            featuredImage { url }
          }
        }
      }
    }
  }
`;

export async function GET(req: NextRequest) {
  const { domain, storefrontToken } = getShopifyConfig();
  const cartId = req.cookies.get(CART_COOKIE_NAME)?.value;
  if (!domain || !storefrontToken || !cartId) {
    return NextResponse.json({ cart: null });
  }

  try {
    const res = await shopifyStorefrontQuery<{ cart: StorefrontCartResponse | null }>(
      `query($id: ID!) {
        cart(id: $id) {
          ${CART_FRAGMENT}
        }
      }`,
      { id: cartId },
      { cache: 'no-store' }
    );
    return NextResponse.json({ cart: res.cart });
  } catch {
    return NextResponse.json({ cart: null });
  }
}

export async function POST(req: NextRequest) {
  const { domain, storefrontToken } = getShopifyConfig();
  if (!domain || !storefrontToken) {
    return NextResponse.json({ ok: false, cart: null });
  }

  try {
    const body = (await req.json()) as {
      items: CartItem[];
      couponCode?: string | null;
      note?: string;
      clear?: boolean;
    };

    if (body.clear) {
      const res = NextResponse.json({ ok: true, cart: null });
      res.cookies.set(CART_COOKIE_NAME, '', { path: '/', maxAge: 0, sameSite: 'lax' });
      return res;
    }

    const lines = (body.items || [])
      .filter((i) => i.shopifyVariantId)
      .map((i) => ({
        merchandiseId: i.shopifyVariantId!,
        quantity: i.quantity,
        attributes: [
          { key: 'purchase_mode', value: i.purchaseMode },
          ...(i.subscriptionIntervalDays
            ? [{ key: 'subscription_interval_days', value: String(i.subscriptionIntervalDays) }]
            : []),
        ],
      }));

    const cartRes = await shopifyStorefrontQuery<{
      cartCreate: {
        cart: StorefrontCartResponse | null;
        userErrors: Array<{ message: string }>;
      };
    }>(
      `mutation($input: CartInput!) {
        cartCreate(input: $input) {
          cart { ${CART_FRAGMENT} }
          userErrors { message }
        }
      }`,
      {
        input: {
          lines,
          ...(body.note ? { note: body.note } : {}),
          ...(body.couponCode ? { discountCodes: [body.couponCode] } : {}),
          buyerIdentity: { countryCode: 'PK' },
        },
      },
      { cache: 'no-store' }
    );

    const created = cartRes.cartCreate.cart;
    const res = NextResponse.json({ ok: Boolean(created), cart: created });
    if (created?.id) {
      res.cookies.set(CART_COOKIE_NAME, created.id, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 14 * 86400,
      });
    }
    return res;
  } catch (err) {
    console.warn('[Shopify Cart Sync Warning]', err);
    return NextResponse.json({ ok: false, cart: null });
  }
}
