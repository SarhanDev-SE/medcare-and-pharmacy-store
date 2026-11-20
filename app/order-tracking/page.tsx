'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  ClipboardCheck,
  Package,
  Search,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useStore } from '@/context/StoreContext';
import { formatMoney } from '@/lib/store-logic';
import type { Order } from '@/lib/types';

export default function OrderTrackingPage() {
  const { orders, currency, settings } = useStore();
  const [orderInput, setOrderInput] = useState(orders[0]?.number ?? '#1002');
  const [emailInput, setEmailInput] = useState(orders[0]?.billingEmail ?? 'customer.xmedcar@gmail.com');
  const [matchedOrder, setMatchedOrder] = useState<Order | null>(orders[0] ?? null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = orderInput.trim().replace(/^#/, '');
    const cleanEmail = emailInput.trim().toLowerCase();

    if (!cleanNum) {
      setSearchError('Please enter your Order ID (for example: #1002).');
      setMatchedOrder(null);
      return;
    }

    setSearching(true);
    setSearchError(null);

    try {
      const params = new URLSearchParams({ number: cleanNum });
      if (cleanEmail) params.set('email', cleanEmail);
      const res = await fetch(`/api/shopify/orders?${params.toString()}`);
      if (res.ok) {
        const data = (await res.json()) as { ok?: boolean; order?: Order };
        if (data.ok && data.order) {
          setMatchedOrder(data.order);
          return;
        }
      }
    } catch {
      // Fall through to local session check
    } finally {
      setSearching(false);
    }

    const found = orders.find((o) => {
      const numMatch = o.number.replace(/^#/, '').toLowerCase() === cleanNum.toLowerCase();
      const emailMatch = !cleanEmail || o.billingEmail.toLowerCase() === cleanEmail;
      return numMatch && emailMatch;
    });

    if (!found) {
      setSearchError(
        `No Shopify order matching #${cleanNum}${cleanEmail ? ` for ${cleanEmail}` : ''}. Try order #1002 or #1003.`
      );
      setMatchedOrder(null);
      return;
    }

    setSearchError(null);
    setMatchedOrder(found);
  };

  const quickSelectOrder = (ord: Order) => {
    setOrderInput(ord.number);
    setEmailInput(ord.billingEmail);
    setMatchedOrder(ord);
    setSearchError(null);
  };

  const getStepIndex = (status: Order['status']) => {
    if (status === 'Pending payment') return 0;
    if (status === 'Processing') return 2;
    if (status === 'Completed') return 3;
    return -1;
  };

  const activeStep = matchedOrder ? getStepIndex(matchedOrder.status) : 0;

  return (
    <main className="bg-white pb-16">
      <Breadcrumbs
        items={[{ label: 'Home', href: '/' }, { label: 'Order Tracking' }]}
        title="Track Your Pharmacy Order"
        subtitle="Enter your Order ID and billing email to view real-time pharmacist review, temperature-controlled packaging, and delivery progress."
      />

      <div className="max-w-[1320px] mx-auto px-4 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Lookup Form */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-[#FAF8FC] p-6">
            <form onSubmit={handleTrack} className="space-y-4">
              <div>
                <label
                  htmlFor="track-order-id"
                  className="block text-xs font-semibold text-[#082A66] mb-1.5"
                >
                  Order ID <span className="text-[#DC3545]">*</span>
                </label>
                <input
                  id="track-order-id"
                  type="text"
                  value={orderInput}
                  onChange={(e) => setOrderInput(e.target.value)}
                  placeholder="e.g. #1002"
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:border-[#7B3CA1] font-mono"
                />
              </div>

              <div>
                <label
                  htmlFor="track-email"
                  className="block text-xs font-semibold text-[#082A66] mb-1.5"
                >
                  Billing Email
                </label>
                <input
                  id="track-email"
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="customer.xmedcar@gmail.com"
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:border-[#7B3CA1]"
                />
              </div>

              {searchError && (
                <p role="alert" className="text-xs text-[#DC3545] bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {searchError}
                </p>
              )}

              <button
                type="submit"
                disabled={searching}
                className="w-full h-11 rounded-lg bg-[#7B3CA1] hover:bg-[#662F87] disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Search className="w-4 h-4" />
                {searching ? 'Checking Shopify Order...' : 'Track Order'}
              </button>
            </form>

            {orders.length > 0 && (
              <div className="mt-6 pt-5 border-t border-slate-200">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                  Recent Orders In Your Session
                </p>
                <div className="flex flex-wrap gap-2">
                  {orders.slice(0, 5).map((ord) => (
                    <button
                      key={ord.id}
                      type="button"
                      onClick={() => quickSelectOrder(ord)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-colors cursor-pointer ${
                        matchedOrder?.id === ord.id
                          ? 'bg-[#082A66] text-white border-[#082A66]'
                          : 'bg-white text-[#082A66] border-slate-200 hover:border-[#7B3CA1]'
                      }`}
                    >
                      {ord.number} · {ord.status}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tracking Timeline & Details */}
          <div className="lg:col-span-7">
            {matchedOrder ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Order Reference
                    </p>
                    <h2 className="text-xl font-bold text-[#082A66] font-mono">
                      {matchedOrder.number}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Placed on {matchedOrder.date} · {matchedOrder.paymentMethod}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      matchedOrder.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : matchedOrder.status === 'Processing'
                          ? 'bg-purple-100 text-[#7B3CA1]'
                          : matchedOrder.status === 'Cancelled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {matchedOrder.status}
                  </span>
                </div>

                {matchedOrder.status === 'Cancelled' ? (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-800">
                    This order was cancelled. If you believe this was in error, please contact 24/7 support at {settings.phone}.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Order Placed', sub: 'Confirmed', icon: ClipboardCheck },
                      { label: 'Pharmacist Check', sub: 'Safety verified', icon: ShieldCheck },
                      { label: 'Dispatched', sub: 'Insulated parcel', icon: Package },
                      { label: 'Delivered', sub: 'Signed & complete', icon: Truck },
                    ].map((step, idx) => {
                      const Icon = step.icon;
                      const done = idx <= activeStep;
                      return (
                        <div
                          key={step.label}
                          className={`rounded-xl border p-3.5 ${
                            done
                              ? 'border-[#7B3CA1] bg-[#FAF8FC]'
                              : 'border-slate-200 bg-white opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Icon
                              className={`w-4 h-4 ${
                                done ? 'text-[#7B3CA1]' : 'text-slate-400'
                              }`}
                            />
                            {done && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                          </div>
                          <p className="text-xs font-bold text-[#082A66]">{step.label}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{step.sub}</p>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-bold text-[#082A66] mb-3">
                    Items In Shipment ({matchedOrder.items.length})
                  </h3>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {matchedOrder.items.map((item, idx) => (
                      <div
                        key={`${item.productId}-${idx}`}
                        className="p-3.5 flex items-center justify-between gap-4 bg-white"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-12 h-12 rounded-lg object-contain bg-[#FAF8FC] border border-slate-100 p-1 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#082A66] truncate">
                              {item.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              Qty: {item.quantity}
                              {item.variantLabel ? ` · ${item.variantLabel}` : ''}
                              {item.isRx ? ' · Rx Verified' : ''}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-[#082A66] tabular-nums shrink-0">
                          {formatMoney(item.price * item.quantity, currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 text-sm">
                  <div className="text-slate-600">
                    <span className="font-semibold text-[#082A66]">Ship To: </span>
                    {matchedOrder.shippingAddress}
                  </div>
                  <div className="font-bold text-[#082A66] tabular-nums">
                    Total: {formatMoney(matchedOrder.total, currency)}
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap gap-3">
                  <Link
                    href="/account?tab=orders"
                    className="inline-flex items-center px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-[#082A66] hover:border-[#7B3CA1] hover:text-[#7B3CA1] transition-colors"
                  >
                    Manage In My Account
                  </Link>
                  <Link
                    href="/shop"
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-[#082A66] text-white text-xs font-semibold hover:bg-[#7B3CA1] transition-colors"
                  >
                    Reorder Essentials
                  </Link>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-[#FAF8FC] p-10 text-center">
                <Package className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-base font-bold text-[#082A66]">
                  Enter An Order Number To Inspect Status
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Try Shopify order IDs like #1002 or #1003 using customer.xmedcar@gmail.com.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
