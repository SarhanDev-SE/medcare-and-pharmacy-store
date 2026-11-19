'use client';

import type { ReactNode } from 'react';
import { MessageResponse } from '@/components/ai-elements/message';
import { Shimmer } from '@/components/ai-elements/shimmer';
import type { ChatUIMessage } from '@/lib/chat/tools';
import { CartSummaryCard, CheckoutCard } from './CartCards';
import { ProductCarousel } from './ChatProductCard';

type Part = ChatUIMessage['parts'][number];

const Pending = ({ children }: { children: string }) => (
  <Shimmer className="text-xs">{children}</Shimmer>
);
const Note = ({
  children,
  tone = 'muted',
}: {
  children: ReactNode;
  tone?: 'muted' | 'warn';
}) => (
  <p className={tone === 'warn' ? 'text-xs font-medium text-amber-700' : 'text-xs text-slate-500'}>
    {children}
  </p>
);

export function renderPart(
  part: Part,
  role: ChatUIMessage['role'],
  onNavigate: () => void
): ReactNode {
  switch (part.type) {
    case 'text':
      return role === 'assistant' ? (
        <MessageResponse>{part.text}</MessageResponse>
      ) : (
        <span className="whitespace-pre-wrap">{part.text}</span>
      );

    case 'tool-searchProducts':
      if (part.state === 'output-available') {
        return part.output.products.length ? (
          <ProductCarousel cards={part.output.products} />
        ) : null;
      }
      return part.state === 'output-error' ? (
        <Note tone="warn">Search failed. Please try again.</Note>
      ) : (
        <Pending>Searching the catalog…</Pending>
      );

    case 'tool-compareProducts':
      return part.state === 'output-available' ? (
        <ProductCarousel cards={part.output.cards} />
      ) : (
        <Pending>Comparing products…</Pending>
      );

    case 'tool-getProductDetails':
      if (part.state === 'output-available') {
        return part.output.found ? <ProductCarousel cards={[part.output.card]} /> : null;
      }
      return part.state === 'output-error' ? null : <Pending>Reading the label…</Pending>;

    case 'tool-addToCart':
    case 'tool-updateCartItem':
      if (part.state === 'output-available') {
        return part.output.ok ? (
          <Note>✓ Cart updated · {part.output.cart.itemCount} item(s)</Note>
        ) : (
          <Note tone="warn">{part.output.reason}</Note>
        );
      }
      return part.state === 'output-error' ? (
        <Note tone="warn">Could not update the cart.</Note>
      ) : (
        <Pending>Updating your cart…</Pending>
      );

    case 'tool-viewCart':
      return part.state === 'output-available' ? (
        <CartSummaryCard cart={part.output} />
      ) : (
        <Pending>Checking your cart…</Pending>
      );

    case 'tool-applyCoupon':
      return part.state === 'output-available' ? (
        <Note tone={part.output.valid ? 'muted' : 'warn'}>{part.output.message}</Note>
      ) : (
        <Pending>Applying coupon…</Pending>
      );

    case 'tool-startCheckout':
      return part.state === 'output-available' ? (
        <CheckoutCard {...part.output} onNavigate={onNavigate} />
      ) : (
        <Pending>Preparing checkout…</Pending>
      );

    default:
      return null;
  }
}
