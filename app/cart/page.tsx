'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, Minus, Plus, Truck, X } from 'lucide-react';
import { formatMoney, partitionCartItems } from '@/lib/store-logic';
import { useStore } from '@/context/StoreContext';
import Breadcrumbs from '@/components/Breadcrumbs';
import type { CartItem } from '@/lib/types';

export default function CartPage() {
  const router = useRouter();
  const {
    settings,
    currency,
    cart,
    updateCartQty,
    removeFromCart,
    couponCode,
    applyCouponAsync,
    removeCoupon,
    cartSummary,
    showToast,
  } = useStore();

  const [couponInput, setCouponInput] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [showAddressEdit, setShowAddressEdit] = useState(false);
  const [shippingLocation, setShippingLocation] = useState(
    'House 24-B, Khayaban-e-Ittehad, DHA Phase 6, Karachi 75600, Pakistan.'
  );

  const { regularItems, prescriptionItems } = partitionCartItems(cart);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyingCoupon(true);
    try {
      const res = await applyCouponAsync(couponInput);
      setCouponMsg({ ok: res.valid, text: res.message });
      if (res.valid) setCouponInput('');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const renderCartRow = (item: CartItem) => (
    <tr key={item.id} className="border-b border-slate-100">
      <td className="py-4 pr-4">
        <div className="flex items-center gap-3.5">
          <div className="relative w-16 h-16 bg-[#F8F9FC] rounded-xl p-1.5 flex items-center justify-center shrink-0">
            {item.isRx && (
              <span className="absolute -top-1 -left-1 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                Rx
              </span>
            )}
            <img src={item.image} alt={item.name} className="max-h-14 object-contain" />
          </div>
          <div>
            <Link
              href={`/product/${item.slug}`}
              className="text-sm font-bold text-[#082A66] hover:text-[#7B3CA1]"
            >
              {item.name}
            </Link>
            {item.variantLabel && (
              <p className="text-xs text-slate-500 mt-0.5">
                {item.purchaseMode === 'subscription' ? 'Subscription: ' : 'Pack: '}
                <strong className="text-slate-700">{item.variantLabel}</strong>
              </p>
            )}
          </div>
        </div>
      </td>
      <td className="py-4 px-3 text-sm font-bold text-[#082A66] tabular-nums whitespace-nowrap">
        {formatMoney(item.price, currency)}
      </td>
      <td className="py-4 px-3">
        <div className="inline-flex items-center border border-slate-200 rounded-full h-9 px-2">
          <button
            type="button"
            aria-label={`Decrease quantity for ${item.name}`}
            onClick={() => updateCartQty(item.id, item.quantity - 1)}
            className="w-6 h-6 flex items-center justify-center text-slate-600 cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="w-8 text-center text-sm font-semibold tabular-nums">
            {item.quantity}
          </span>
          <button
            type="button"
            aria-label={`Increase quantity for ${item.name}`}
            onClick={() => updateCartQty(item.id, item.quantity + 1)}
            className="w-6 h-6 flex items-center justify-center text-slate-600 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
      <td className="py-4 px-3 text-sm font-bold text-[#082A66] tabular-nums whitespace-nowrap">
        {formatMoney(item.price * item.quantity, currency)}
      </td>
      <td className="py-4 pl-2 text-right">
        <button
          type="button"
          onClick={() => {
            removeFromCart(item.id);
            showToast(`Removed ${item.name} from cart.`);
          }}
          aria-label={`Remove ${item.name}`}
          className="w-6 h-6 rounded-full border border-red-200 text-red-500 hover:bg-red-50 inline-flex items-center justify-center cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  );

  return (
    <div className="bg-white">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Shop', href: '/shop' },
          { label: 'Cart' },
        ]}
        title="Cart"
      />

      <section className="max-w-[1320px] mx-auto px-4 pb-12">
        {cart.length === 0 ? (
          <div className="border border-slate-200 rounded-2xl p-12 text-center space-y-4">
            <h2 className="text-xl font-bold text-[#082A66]">Your shopping cart is empty</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Explore our prescription wellness formulas, daily vitamins, and diagnostic devices to get started.
            </p>
            <Link
              href="/shop"
              className="inline-block px-7 py-3 rounded-full bg-[#7B3CA1] hover:bg-[#662F87] text-white text-sm font-semibold transition-colors"
            >
              Browse Shop
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Cart Table */}
            <div className="lg:col-span-8 space-y-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[620px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-sm font-bold text-[#082A66]">
                      <th className="pb-3">Product</th>
                      <th className="pb-3 px-3">Price</th>
                      <th className="pb-3 px-3">Quantity</th>
                      <th className="pb-3 px-3">Subtotal</th>
                      <th className="pb-3 w-8">
                        <span className="sr-only">Remove</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {regularItems.map(renderCartRow)}

                    {prescriptionItems.length > 0 && (
                      <>
                        <tr>
                          <td colSpan={5} className="pt-4 pb-2">
                            <div className="bg-[#FAF8FC] border border-purple-100 rounded-lg px-4 py-2 text-xs font-bold text-[#082A66]">
                              Prescription Products
                            </div>
                          </td>
                        </tr>
                        {prescriptionItems.map(renderCartRow)}
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Coupon Input Bar */}
              <form
                onSubmit={handleApplyCoupon}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 border border-slate-200 rounded-full p-1.5 pl-4"
              >
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Coupon code (try FIRST10 or SAVE15)"
                  aria-label="Coupon code"
                  className="flex-1 text-sm focus:outline-none py-1.5"
                />
                <button
                  type="submit"
                  disabled={applyingCoupon}
                  className="px-6 py-2.5 rounded-full bg-[#7B3CA1] hover:bg-[#662F87] disabled:opacity-60 text-white text-xs font-semibold transition-colors cursor-pointer shrink-0"
                >
                  {applyingCoupon ? 'Checking...' : 'Apply Coupon'}
                </button>
              </form>

              {couponMsg && (
                <p className={`text-xs font-medium ${couponMsg.ok ? 'text-emerald-700' : 'text-red-600'}`}>
                  {couponMsg.text}
                </p>
              )}
              {couponCode && (
                <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                  <span>
                    Active Coupon: <strong>{couponCode}</strong> (-{formatMoney(cartSummary.discountAmount, currency)})
                  </span>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="ml-auto text-red-600 underline font-semibold cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Right Order Summary */}
            <aside className="lg:col-span-4 border border-slate-200 rounded-2xl p-6 space-y-5 bg-white">
              {/* Free Shipping Progress */}
              <div>
                <p className="text-xs text-slate-700 mb-3">
                  {cartSummary.amountToFreeShipping > 0 ? (
                    <>
                      Buy{' '}
                      <span className="font-bold text-[#7B3CA1] tabular-nums">
                        {formatMoney(cartSummary.amountToFreeShipping, currency)}
                      </span>{' '}
                      more to get <strong className="text-[#7B3CA1]">Free Shipping</strong> (
                      {formatMoney(settings.freeShippingThreshold, currency)})
                    </>
                  ) : (
                    <span className="font-semibold text-emerald-700">
                      Unlocked Free Shipping!
                    </span>
                  )}
                </p>
                <div className="relative h-1.5 bg-slate-200 rounded-full">
                  <div
                    className="h-full bg-[#7B3CA1] rounded-full transition-all"
                    style={{ width: `${cartSummary.freeShippingProgress}%` }}
                  />
                  <div
                    className="absolute -top-2.5 -translate-x-1/2 w-6 h-6 rounded-full bg-white border border-[#7B3CA1] text-[#7B3CA1] flex items-center justify-center shadow-xs"
                    style={{ left: `${Math.max(8, cartSummary.freeShippingProgress)}%` }}
                  >
                    <Truck className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              <h2 className="text-xl font-bold text-[#082A66] pt-2">Order Summary</h2>

              <div className="space-y-3 text-xs border-b border-slate-200 pb-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#082A66]">Subtotal</span>
                  <span className="font-bold text-[#082A66] tabular-nums">
                    {formatMoney(cartSummary.subtotal, currency)}
                  </span>
                </div>

                {cartSummary.discountAmount > 0 && (
                  <div className="flex items-center justify-between text-emerald-700">
                    <span className="font-semibold">Discount ({couponCode})</span>
                    <span className="font-bold tabular-nums">
                      -{formatMoney(cartSummary.discountAmount, currency)}
                    </span>
                  </div>
                )}

                <div className="flex items-start justify-between gap-4 pt-2 border-t border-slate-100">
                  <span className="font-semibold text-[#082A66]">Shipment</span>
                  <div className="text-right space-y-1">
                    <p className="font-bold text-[#082A66] tabular-nums">
                      {cartSummary.shippingCost === 0
                        ? 'Free shipping'
                        : formatMoney(cartSummary.shippingCost, currency)}
                    </p>
                    <p className="text-slate-500 leading-relaxed">
                      Shipping to <strong className="text-[#082A66]">{shippingLocation}</strong>
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAddressEdit((v) => !v)}
                      className="inline-flex items-center gap-1 font-bold text-[#082A66] hover:text-[#7B3CA1] cursor-pointer"
                    >
                      Change address
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {showAddressEdit && (
                  <div className="pt-2 space-y-2">
                    <input
                      type="text"
                      value={shippingLocation}
                      onChange={(e) => setShippingLocation(e.target.value)}
                      aria-label="Shipping address"
                      className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddressEdit(false);
                        showToast('Shipping destination updated.');
                      }}
                      className="px-3 py-1 rounded-lg bg-[#082A66] text-white text-xs font-semibold cursor-pointer"
                    >
                      Update
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-[#082A66]">Total</span>
                <span className="text-xl font-extrabold text-[#082A66] tabular-nums">
                  {formatMoney(cartSummary.total, currency)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => router.push('/checkout')}
                className="w-full py-3 rounded-full bg-[#7B3CA1] hover:bg-[#662F87] text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                Proceed To Checkout
              </button>
            </aside>
          </div>
        )}
      </section>
    </div>
  );
}
