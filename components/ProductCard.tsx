'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Eye,
  Heart,
  Leaf,
  Minus,
  Plus,
  Share2,
  SlidersHorizontal,
  Star,
  Thermometer,
} from 'lucide-react';
import { formatMoney, getDefaultProductVariant } from '@/lib/store-logic';
import { useStore } from '@/context/StoreContext';
import type { Product } from '@/lib/types';

interface ProductCardProps {
  product: Product;
  variant?: 'grid' | 'list' | 'compact-row';
  showStockBar?: boolean;
  quickAddLabel?: string;
}

export default function ProductCard({
  product,
  variant = 'grid',
  showStockBar = false,
  quickAddLabel = 'Add To Cart',
}: ProductCardProps) {
  const {
    currency,
    addToCart,
    wishlistIds,
    toggleWishlist,
    toggleCompare,
    openQuickView,
    showToast,
  } = useStore();

  const [listQty, setListQty] = useState(1);
  const isWishlisted = wishlistIds.includes(product.id);

  const handleAdd = (qty = 1) => {
    if (!product.inStock) {
      showToast('This medicine is currently out of stock.');
      return;
    }
    const defaultVar = getDefaultProductVariant(product);
    addToCart({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      price: defaultVar?.price ?? product.price,
      originalPrice: defaultVar?.originalPrice ?? product.originalPrice,
      quantity: qty,
      isRx: product.isRx,
      variantLabel: defaultVar?.label,
      purchaseMode: 'one-time',
    });
  };

  if (variant === 'compact-row') {
    return (
      <div className="group flex items-center gap-3.5 p-3 rounded-xl border border-slate-200 bg-white hover:border-[#7B3CA1] transition-colors">
        <Link
          href={`/product/${product.slug}`}
          className="relative w-20 h-20 rounded-lg bg-[#F7F8FC] shrink-0 flex items-center justify-center overflow-hidden p-1.5"
        >
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-200"
          />
          {product.discountPercent && (
            <span className="absolute top-1 left-1 bg-rose-100 text-rose-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
              -{product.discountPercent}%
            </span>
          )}
          {!product.discountPercent && product.isNew && (
            <span className="absolute top-1 left-1 bg-cyan-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              NEW
            </span>
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#7B3CA1]">
            {product.category.split(' ')[0]}
          </p>
          <Link
            href={`/product/${product.slug}`}
            className="text-sm font-semibold text-[#082A66] hover:text-[#7B3CA1] line-clamp-2 leading-snug"
          >
            {product.name}
          </Link>
          <div className="mt-1 flex items-center gap-2 tabular-nums">
            <span className="text-sm font-bold text-[#082A66]">
              {formatMoney(product.price, currency)}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-slate-400 line-through">
                {formatMoney(product.originalPrice, currency)}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <article className="group bg-white border border-slate-200 hover:border-[#7B3CA1] rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-stretch gap-5 transition-colors">
        {/* Left Thumbnail */}
        <div className="relative w-full md:w-56 h-52 bg-[#F8F9FC] rounded-xl flex items-center justify-center p-4 shrink-0 overflow-hidden">
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 z-10">
            {product.discountPercent && (
              <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded">
                -{product.discountPercent}%
              </span>
            )}
            {product.isNew && !product.discountPercent && (
              <span className="bg-cyan-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                NEW
              </span>
            )}
            {product.isRx && (
              <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                RX
              </span>
            )}
            {product.isNatural && (
              <span
                title="Natural Ingredients"
                className="bg-emerald-600 text-white p-1 rounded inline-flex items-center"
              >
                <Leaf className="w-3 h-3" />
              </span>
            )}
          </div>

          <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button
              type="button"
              onClick={() => toggleWishlist(product.id)}
              aria-label={`Save ${product.name} to wishlist`}
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                isWishlisted
                  ? 'bg-[#7B3CA1] border-[#7B3CA1] text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-[#7B3CA1] hover:text-[#7B3CA1]'
              }`}
            >
              <Heart className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => openQuickView(product)}
              aria-label={`Quick view ${product.name}`}
              className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-600 hover:border-[#7B3CA1] hover:text-[#7B3CA1] flex items-center justify-center transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>

          <Link href={`/product/${product.slug}`} className="w-full h-full flex items-center justify-center">
            <img
              src={product.image}
              alt={product.name}
              className="max-h-44 w-auto object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-200"
            />
          </Link>
        </div>

        {/* Center Details & Benefits */}
        <div className="flex-1 flex flex-col justify-center min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#7B3CA1] mb-1">
            {product.category}
          </p>
          <Link
            href={`/product/${product.slug}`}
            className="text-lg font-bold text-[#082A66] hover:text-[#7B3CA1] transition-colors mb-1.5"
          >
            {product.name}
          </Link>
          <div className="flex items-center gap-1.5 mb-3">
            <div className="flex items-center text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-current" />
              ))}
            </div>
            <span className="text-xs text-slate-500 tabular-nums">({product.reviewCount})</span>
          </div>
          <ul className="space-y-1.5">
            {product.benefits.map((b) => (
              <li key={b} className="flex items-center gap-2 text-xs text-slate-600">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#7B3CA1] shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Price, Qty & Actions */}
        <div className="md:w-64 md:border-l border-slate-100 md:pl-5 flex flex-col justify-center gap-3 shrink-0">
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-sm text-slate-500">Price:</span>
            <span className="text-xl font-bold text-[#082A66]">
              {formatMoney(product.price, currency)}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-slate-400 line-through">
                {formatMoney(product.originalPrice, currency)}
              </span>
            )}
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1.5">Quantity:</p>
            <div className="inline-flex items-center border border-slate-200 rounded-full h-9 px-2">
              <button
                type="button"
                aria-label={`Decrease quantity for ${product.name}`}
                onClick={() => setListQty((q) => Math.max(1, q - 1))}
                className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-[#082A66] cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center text-sm font-semibold tabular-nums">{listQty}</span>
              <button
                type="button"
                aria-label={`Increase quantity for ${product.name}`}
                onClick={() => setListQty((q) => q + 1)}
                className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-[#082A66] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <button
            type="button"
            disabled={!product.inStock}
            onClick={() => handleAdd(listQty)}
            className={`w-full py-2.5 px-4 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
              product.inStock
                ? 'bg-[#7B3CA1] hover:bg-[#662F87] text-white'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {product.inStock ? 'Add To Cart' : 'Out of Stock'}
          </button>

          <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
            <button
              type="button"
              onClick={() => toggleCompare(product.id)}
              className="inline-flex items-center gap-1 hover:text-[#7B3CA1] cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Compare
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                  navigator.clipboard.writeText(`${window.location.origin}/product/${product.slug}`).catch(() => {});
                }
                showToast('Product link copied to clipboard.');
              }}
              className="inline-flex items-center gap-1 hover:text-[#7B3CA1] cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share
            </button>
          </div>
        </div>
      </article>
    );
  }

  // Default Grid Card
  return (
    <article className="group bg-white border border-slate-200 hover:border-[#7B3CA1] rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div>
        {/* Image Frame */}
        <div className="relative h-52 bg-[#F8F9FC] rounded-xl flex items-center justify-center p-4 mb-3.5 overflow-hidden">
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 z-10">
            {product.discountPercent && (
              <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded">
                -{product.discountPercent}%
              </span>
            )}
            {product.isNew && !product.discountPercent && (
              <span className="bg-cyan-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                NEW
              </span>
            )}
            {product.isRx && (
              <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                RX
              </span>
            )}
            {product.isTempControlled && (
              <span
                title="Temperature Controlled"
                className="bg-teal-600 text-white p-1 rounded inline-flex items-center"
              >
                <Thermometer className="w-3 h-3" />
              </span>
            )}
            {product.isNatural && !product.isTempControlled && (
              <span
                title="Natural Ingredients"
                className="bg-emerald-600 text-white p-1 rounded inline-flex items-center"
              >
                <Leaf className="w-3 h-3" />
              </span>
            )}
          </div>

          <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button
              type="button"
              onClick={() => toggleWishlist(product.id)}
              aria-label={`Save ${product.name} to wishlist`}
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                isWishlisted
                  ? 'bg-[#7B3CA1] border-[#7B3CA1] text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-[#7B3CA1] hover:text-[#7B3CA1]'
              }`}
            >
              <Heart className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => openQuickView(product)}
              aria-label={`Quick view ${product.name}`}
              className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-600 hover:border-[#7B3CA1] hover:text-[#7B3CA1] flex items-center justify-center transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>

          <Link href={`/product/${product.slug}`} className="w-full h-full flex items-center justify-center">
            <img
              src={product.image}
              alt={product.name}
              className="max-h-44 w-auto object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-200"
            />
          </Link>
        </div>

        {/* Category Tag & Title */}
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#7B3CA1] mb-1 truncate">
          {product.category.split(' ')[0]}
        </p>
        <Link
          href={`/product/${product.slug}`}
          className="text-sm font-bold text-[#082A66] hover:text-[#7B3CA1] transition-colors line-clamp-2 min-h-[2.5rem] leading-snug"
        >
          {product.name}
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mt-2">
          <div className="flex items-center text-amber-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-current" />
            ))}
          </div>
          <span className="text-xs text-slate-400 tabular-nums">({product.reviewCount})</span>
        </div>
      </div>

      {/* Price & CTA */}
      <div className="mt-3 pt-2">
        <div className="flex items-baseline gap-2 tabular-nums mb-3">
          <span className="text-base font-bold text-[#082A66] group-hover:text-[#7B3CA1] transition-colors">
            {formatMoney(product.price, currency)}
          </span>
          {product.originalPrice && (
            <span className="text-xs text-slate-400 line-through">
              {formatMoney(product.originalPrice, currency)}
            </span>
          )}
        </div>

        {showStockBar && (
          <div className="mb-3">
            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden mb-1">
              <div
                className="h-full bg-[#DC3545] rounded-full"
                style={{ width: `${Math.min(100, Math.max(15, product.stockCount))}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 tabular-nums">
              <span>Available only:</span>
              <span className="font-bold text-[#082A66]">{product.stockCount}</span>
            </div>
          </div>
        )}

        <button
          type="button"
          disabled={!product.inStock}
          onClick={() => handleAdd(1)}
          className={`w-full py-2.5 px-4 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
            !product.inStock
              ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-white border-slate-200 text-[#082A66] group-hover:bg-[#7B3CA1] group-hover:border-[#7B3CA1] group-hover:text-white'
          }`}
        >
          {product.inStock ? quickAddLabel : 'Out Of Stock'}
        </button>
      </div>
    </article>
  );
}
