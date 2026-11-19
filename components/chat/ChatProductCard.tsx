'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, FileText, ShoppingCart, Star } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { buildCartLine, type ProductCardData } from '@/lib/chat/catalog';
import { formatMoney } from '@/lib/store-logic';

export function ChatProductCard({ p }: { p: ProductCardData }) {
  const { currency, addToCart } = useStore();
  const [variantId, setVariantId] = useState(p.defaultVariantId);
  const [added, setAdded] = useState(false);
  const variant = p.variants.find((v) => v.id === variantId) ?? p.variants[0];

  const add = () => {
    const built = buildCartLine({
      productId: p.id,
      variantId,
      quantity: 1,
      purchaseMode: 'one-time',
    });
    if (!built.ok) return;
    addToCart(built.line, false);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  return (
    <article
      role="listitem"
      className="flex h-full w-full flex-col gap-1.5 rounded-xl border border-slate-200 bg-white p-2.5 text-slate-900 shadow-xs"
    >
      <Link
        href={`/product/${p.slug}`}
        className="relative flex h-24 items-center justify-center rounded-lg bg-[#F7F8FC] p-2"
      >
        <img
          src={p.image}
          alt={p.name}
          loading="lazy"
          className="h-full w-full object-contain mix-blend-multiply"
        />
        {p.discountPercent ? (
          <span className="absolute left-1.5 top-1.5 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
            -{p.discountPercent}%
          </span>
        ) : null}
      </Link>

      <div className="min-h-[2rem]">
        <Link
          href={`/product/${p.slug}`}
          className="line-clamp-2 text-xs font-semibold leading-tight text-[#082A66] hover:underline"
        >
          {p.name}
        </Link>
        <p className="mt-0.5 truncate text-[10px] text-slate-500">
          {p.brand} · {p.medicineType}
        </p>
      </div>

      <div className="flex items-center gap-1 text-[10px] text-slate-600">
        <Star className="size-3 shrink-0 fill-amber-400 text-amber-400" aria-hidden />
        <span className="font-semibold">{p.rating.toFixed(1)}</span>
        <span>({p.reviewCount})</span>
        {p.isRx && (
          <span className="ml-auto inline-flex items-center gap-0.5 rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold text-[#662F87]">
            <FileText className="size-2.5" aria-hidden /> Rx
          </span>
        )}
      </div>

      {p.variants.length > 1 && (
        <select
          aria-label={`Size for ${p.name}`}
          value={variantId}
          onChange={(e) => setVariantId(e.target.value)}
          className="w-full truncate rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[10px] cursor-pointer"
        >
          {p.variants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label} — {formatMoney(v.price, currency)}
            </option>
          ))}
        </select>
      )}

      <div className="mt-auto flex items-baseline gap-1.5 pt-0.5">
        <span className="text-sm font-bold tabular-nums text-[#082A66]">
          {formatMoney(variant.price, currency)}
        </span>
        {variant.id === p.defaultVariantId && p.originalPrice && p.originalPrice > variant.price && (
          <span className="text-[11px] text-slate-400 line-through">
            {formatMoney(p.originalPrice, currency)}
          </span>
        )}
      </div>

      {!p.inStock ? (
        <p className="text-[10px] font-semibold text-rose-600">Out of stock</p>
      ) : p.stockCount <= 10 ? (
        <p className="text-[10px] font-semibold text-amber-600">
          Only {p.stockCount} left
        </p>
      ) : null}
      {p.isRx && (
        <p className="text-[10px] leading-snug text-slate-500">
          Rx upload at checkout.
        </p>
      )}

      <button
        type="button"
        onClick={add}
        disabled={!p.inStock}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#7B3CA1] px-2.5 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-[#662F87] disabled:cursor-not-allowed disabled:bg-slate-300 cursor-pointer"
      >
        {added ? (
          <>
            <Check className="size-3.5" aria-hidden /> Added
          </>
        ) : (
          <>
            <ShoppingCart className="size-3.5" aria-hidden /> Add to cart
          </>
        )}
      </button>
    </article>
  );
}

export function ProductCarousel({ cards }: { cards: ProductCardData[] }) {
  if (!cards.length) return null;
  return (
    <div
      className={
        cards.length === 1
          ? 'grid w-full max-w-[220px] grid-cols-1 gap-2.5'
          : 'grid w-full grid-cols-1 gap-2.5 min-[320px]:grid-cols-2'
      }
      role="list"
      aria-label="Products"
    >
      {cards.map((c) => (
        <ChatProductCard key={c.id} p={c} />
      ))}
    </div>
  );
}
