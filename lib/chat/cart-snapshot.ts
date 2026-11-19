import { calculateCartSummary } from '@/lib/store-logic';
import type { CartItem } from '@/lib/types';
import type { CartSnapshot } from './tools';

export function snapshotCart(cart: CartItem[], coupon: string | null): CartSnapshot {
  const s = calculateCartSummary(cart, coupon);
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
