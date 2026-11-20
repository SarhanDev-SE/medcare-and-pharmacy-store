import {
  COUPONS,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_FEE,
  calculateCartSummary,
} from '@/lib/store-logic';
import type { ActiveCoupon, CartItem } from '@/lib/types';
import type { CartSnapshot } from './tools';

export function snapshotCart(
  cart: CartItem[],
  coupon: string | null,
  couponsMap: Record<string, ActiveCoupon> = COUPONS,
  freeShippingThreshold: number = FREE_SHIPPING_THRESHOLD,
  standardShippingFee: number = STANDARD_SHIPPING_FEE
): CartSnapshot {
  const s = calculateCartSummary(
    cart,
    coupon,
    true,
    couponsMap,
    freeShippingThreshold,
    standardShippingFee
  );
  return {
    items: cart.map((c) => ({
      lineId: c.id,
      name: c.name,
      variant: c.variantLabel,
      qty: c.quantity,
      unitPrice: c.price,
      isRx: c.isRx,
    })),
    itemCount: s.itemCount,
    subtotal: s.subtotal,
    discount: s.discountAmount,
    total: s.total,
    hasRx: s.hasRxItems,
    coupon,
  };
}
