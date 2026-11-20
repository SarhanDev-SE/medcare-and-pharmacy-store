import { NextRequest, NextResponse } from 'next/server';
import { fetchActiveCouponsFromShopify } from '@/lib/shopify/storefront';
import { validateCouponCode } from '@/lib/store-logic';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { code?: string };
    const code = typeof body.code === 'string' ? body.code : '';
    const coupons = await fetchActiveCouponsFromShopify();
    const validation = validateCouponCode(code, coupons);

    const matched = validation.normalizedCode ? coupons[validation.normalizedCode] : undefined;
    return NextResponse.json({
      ...validation,
      percentOff: matched?.percentOff ?? 0,
      description: matched?.description ?? '',
    });
  } catch (err) {
    console.error('[Coupon Validation Error]', err);
    return NextResponse.json(
      { valid: false, normalizedCode: null, message: 'Could not validate coupon code.' },
      { status: 500 }
    );
  }
}
