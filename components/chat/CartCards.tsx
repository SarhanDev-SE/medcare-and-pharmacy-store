'use client';

import { useRouter } from 'next/navigation';
import { FileText, ShoppingBag } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import type { CartSnapshot } from '@/lib/chat/tools';
import { formatMoney } from '@/lib/store-logic';

function Lines({ cart, max = 4 }: { cart: CartSnapshot; max?: number }) {
  const { currency } = useStore();
  return (
    <ul className="divide-y divide-slate-100 text-xs">
      {cart.items.slice(0, max).map((i) => (
        <li key={i.lineId} className="flex items-start justify-between gap-3 py-1.5">
          <span className="min-w-0">
            <span className="line-clamp-1 font-medium">{i.name}</span>
            <span className="text-slate-500">
              {i.variant ? `${i.variant} · ` : ''}×{i.qty}
              {i.isRx ? ' · Rx' : ''}
            </span>
          </span>
          <span className="tabular-nums">{formatMoney(i.unitPrice * i.qty, currency)}</span>
        </li>
      ))}
      {cart.items.length > max && (
        <li className="py-1.5 text-slate-500">+{cart.items.length - max} more</li>
      )}
    </ul>
  );
}

function Totals({ cart }: { cart: CartSnapshot }) {
  const { currency } = useStore();
  return (
    <dl className="space-y-0.5 border-t border-slate-200 pt-2 text-xs">
      {cart.discount > 0 && (
        <div className="flex justify-between text-emerald-700">
          <dt>Discount{cart.coupon ? ` (${cart.coupon})` : ''}</dt>
          <dd>-{formatMoney(cart.discount, currency)}</dd>
        </div>
      )}
      <div className="flex justify-between text-sm font-bold text-[#082A66]">
        <dt>Total</dt>
        <dd className="tabular-nums">{formatMoney(cart.total, currency)}</dd>
      </div>
    </dl>
  );
}

export function CartSummaryCard({ cart }: { cart: CartSnapshot }) {
  if (!cart.items.length) return <p className="text-xs text-slate-500">Your cart is empty.</p>;
  return (
    <section
      aria-label="Cart summary"
      className="w-full max-w-sm space-y-2 rounded-xl border border-slate-200 bg-white p-3 text-slate-900"
    >
      <h4 className="flex items-center gap-1.5 text-xs font-bold text-[#082A66]">
        <ShoppingBag className="size-3.5" aria-hidden /> Your cart ({cart.itemCount})
      </h4>
      <Lines cart={cart} />
      <Totals cart={cart} />
    </section>
  );
}

export function CheckoutCard(props: {
  ready: boolean;
  reason?: string;
  needsPrescription: boolean;
  cart: CartSnapshot;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const { cart, ready, needsPrescription } = props;
  if (!ready) {
    return (
      <p className="text-xs text-slate-500">{props.reason ?? 'Nothing to check out yet.'}</p>
    );
  }

  return (
    <section
      aria-label="Checkout summary"
      className="w-full max-w-sm space-y-2 rounded-xl border border-[#7B3CA1]/30 bg-white p-3 text-slate-900 shadow-xs"
    >
      <h4 className="text-xs font-bold text-[#082A66]">Ready to check out</h4>
      <Lines cart={cart} max={3} />
      <Totals cart={cart} />
      {needsPrescription && (
        <p className="flex items-start gap-1.5 rounded-lg bg-purple-50 p-2 text-[11px] leading-snug text-[#662F87]">
          <FileText className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Your cart has prescription (Rx) items. You will upload the prescription on the next page.
        </p>
      )}
      <button
        type="button"
        onClick={() => {
          props.onNavigate?.();
          router.push('/checkout');
        }}
        className="w-full rounded-lg bg-[#082A66] px-3 py-2 text-xs font-bold text-white hover:bg-[#102B5C] transition-colors cursor-pointer"
      >
        Go to secure checkout
      </button>
    </section>
  );
}
