'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, FileText, Tag } from 'lucide-react';
import { formatMoney } from '@/lib/store-logic';
import { useStore } from '@/context/StoreContext';
import Breadcrumbs from '@/components/Breadcrumbs';
import PrescriptionUploader from '@/components/PrescriptionUploader';
import type { Order, PrescriptionFileMeta } from '@/lib/types';

export default function CheckoutPage() {
  const { user } = useStore();
  return <CheckoutForm key={user?.id ?? 'guest'} />;
}

function CheckoutForm() {
  const {
    user,
    defaultBillingUser,
    currency,
    cart,
    cartSummary,
    couponCode,
    applyCouponAsync,
    cartNotes,
    placeOrder,
    showToast,
  } = useStore();

  const defaults = user?.billingAddress ?? defaultBillingUser.billingAddress;

  const [firstName, setFirstName] = useState(defaults.firstName);
  const [lastName, setLastName] = useState(defaults.lastName);
  const [country, setCountry] = useState(defaults.country);
  const [street1, setStreet1] = useState(defaults.street1);
  const [street2, setStreet2] = useState(defaults.street2);
  const [city, setCity] = useState(defaults.city);
  const [stateName, setStateName] = useState(defaults.state);
  const [zip, setZip] = useState(defaults.zip);
  const [phone, setPhone] = useState(defaults.phone);
  const [email, setEmail] = useState(defaults.email);
  const [shipDifferent, setShipDifferent] = useState(false);
  const [altAddress, setAltAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState(cartNotes);

  const [showCouponBox, setShowCouponBox] = useState(false);
  const [couponInput, setCouponInput] = useState('');

  const [rxFile, setRxFile] = useState<PrescriptionFileMeta | null>(null);
  const [rxError, setRxError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<
    'Direct bank transfer' | 'Check payments' | 'Cash on delivery'
  >('Direct bank transfer');
  const [formError, setFormError] = useState<string | null>(null);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setFormError('Your cart is empty.');
      return;
    }
    if (!firstName.trim() || !lastName.trim() || !street1.trim() || !city.trim() || !zip.trim() || !email.trim()) {
      setFormError('Please fill in all required billing details.');
      return;
    }
    if (cartSummary.hasRxItems && !rxFile) {
      setRxError('Please upload a valid medical prescription for the Rx items in your cart.');
      setFormError('A valid medical prescription is required before placing this order.');
      return;
    }

    setFormError(null);
    setRxError(null);
    setSubmittingOrder(true);

    const shippingAddr =
      shipDifferent && altAddress.trim()
        ? altAddress.trim()
        : `${street1} ${street2}, ${city}, ${stateName} ${zip}, ${country}`;

    let shopifyOrderId: string | undefined;
    let shopifyOrderNumber: string | undefined;
    let shopifyOrderUrl: string | undefined;

    try {
      const res = await fetch('/api/shopify/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billingName: `${firstName.trim()} ${lastName.trim()}`,
          billingEmail: email.trim(),
          billingPhone: phone.trim(),
          shippingAddress: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            address1: shipDifferent && altAddress.trim() ? altAddress.trim() : street1.trim(),
            address2: shipDifferent ? '' : street2.trim(),
            city: city.trim(),
            province: stateName.trim(),
            zip: zip.trim(),
            country,
          },
          paymentMethod,
          orderNotes: orderNotes.trim() || undefined,
          couponCode,
          discountAmount: cartSummary.discountAmount,
          shippingCost: cartSummary.shippingCost,
          hasRx: cartSummary.hasRxItems,
          rxFileName: rxFile?.name,
          rxFile: rxFile ?? undefined,
          items: cart,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        shopifyOrderId?: string;
        shopifyOrderName?: string;
        shopifyCheckoutUrl?: string;
      };
      if (res.ok && data.ok) {
        shopifyOrderId = data.shopifyOrderId;
        shopifyOrderNumber = data.shopifyOrderName;
        shopifyOrderUrl = data.shopifyCheckoutUrl;
      }
    } catch {
      // Fallback cleanly to local order capture if transient network error occurs
    } finally {
      setSubmittingOrder(false);
    }

    const order = placeOrder({
      billingName: `${firstName.trim()} ${lastName.trim()}`,
      billingEmail: email.trim(),
      billingPhone: phone.trim(),
      shippingAddress: shippingAddr,
      paymentMethod,
      orderNotes: orderNotes.trim() || undefined,
      prescriptionFile: rxFile ?? undefined,
      shopifyOrderId,
      shopifyOrderNumber,
      shopifyOrderUrl,
    });

    setConfirmedOrder(order);
    showToast(`Order ${order.number} confirmed!`);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (confirmedOrder) {
    return (
      <div className="bg-white">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Checkout', href: '/checkout' },
            { label: 'Order Confirmed' },
          ]}
          title="Thank You! Order Confirmed"
        />
        <section className="max-w-3xl mx-auto px-4 pb-16">
          <div className="border border-emerald-200 bg-emerald-50/40 rounded-2xl p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Order {confirmedOrder.number} Confirmed — {confirmedOrder.status}
                </p>
                <h2 className="text-xl font-bold text-[#082A66]">
                  We&apos;ve received your order, {confirmedOrder.billingName}
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white border border-slate-200 rounded-xl p-4 text-xs">
              <div>
                <p className="text-slate-400">Order Number</p>
                <p className="font-bold text-[#082A66] mt-0.5">{confirmedOrder.number}</p>
              </div>
              <div>
                <p className="text-slate-400">Date</p>
                <p className="font-bold text-[#082A66] mt-0.5">{confirmedOrder.date}</p>
              </div>
              <div>
                <p className="text-slate-400">Total</p>
                <p className="font-bold text-[#082A66] mt-0.5 tabular-nums">
                  {formatMoney(confirmedOrder.total, currency)}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Payment</p>
                <p className="font-bold text-[#082A66] mt-0.5">{confirmedOrder.paymentMethod}</p>
              </div>
            </div>

            {confirmedOrder.prescriptionFile && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs flex items-center justify-between">
                <span className="font-semibold text-[#082A66]">
                  Attached Rx Document: {confirmedOrder.prescriptionFile.name}
                </span>
                <span className="text-emerald-700 font-bold">Verified for Pharmacist Review</span>
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              {confirmedOrder.shopifyOrderUrl && (
                <a
                  href={confirmedOrder.shopifyOrderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2.5 rounded-full bg-[#082A66] hover:bg-[#102B5C] text-white text-xs font-semibold transition-colors"
                >
                  Pay / View on Shopify Checkout
                </a>
              )}
              <Link
                href="/account?tab=orders"
                className="px-6 py-2.5 rounded-full bg-[#7B3CA1] hover:bg-[#662F87] text-white text-xs font-semibold transition-colors"
              >
                View Order in My Account
              </Link>
              <Link
                href="/shop"
                className="px-6 py-2.5 rounded-full border border-slate-200 hover:border-[#7B3CA1] text-[#082A66] text-xs font-semibold transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Shop', href: '/shop' },
          { label: 'Checkout' },
        ]}
        title="Checkout"
      />

      <section className="max-w-[1320px] mx-auto px-4 pb-16">
        {/* Coupon Prompt Banner */}
        <div className="bg-[#FAF8FC] border border-purple-100 rounded-xl px-5 py-3.5 mb-8">
          <div className="flex items-center gap-2 text-xs text-slate-700">
            <Tag className="w-4 h-4 text-[#7B3CA1]" />
            <span>Have a coupon?</span>
            <button
              type="button"
              onClick={() => setShowCouponBox((v) => !v)}
              className="font-bold text-[#082A66] hover:text-[#7B3CA1] underline cursor-pointer"
            >
              Click here to enter your code
            </button>
            {couponCode && (
              <span className="ml-auto font-bold text-emerald-700">Applied: {couponCode}</span>
            )}
          </div>
          {showCouponBox && (
            <div className="mt-3 flex items-center gap-2 max-w-md">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="Enter code (FIRST10 or SAVE15)"
                className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs"
              />
              <button
                type="button"
                onClick={async () => {
                  const res = await applyCouponAsync(couponInput);
                  showToast(res.message);
                }}
                className="px-4 py-2 rounded-lg bg-[#7B3CA1] text-white text-xs font-semibold cursor-pointer"
              >
                Apply
              </button>
            </div>
          )}
        </div>

        {formError && (
          <div
            role="alert"
            className="mb-6 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl px-4 py-3"
          >
            {formError}
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Billing Details */}
          <div className="lg:col-span-7 space-y-5">
            <h2 className="text-xl font-bold text-[#082A66]">Billing Details</h2>

            <div>
              <label htmlFor="chk-fn" className="block text-xs font-semibold text-[#082A66] mb-1.5">
                First name <span className="text-red-500">*</span>
              </label>
              <input
                id="chk-fn"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full border border-emerald-500/70 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#7B3CA1]"
              />
            </div>

            <div>
              <label htmlFor="chk-ln" className="block text-xs font-semibold text-[#082A66] mb-1.5">
                Last name <span className="text-red-500">*</span>
              </label>
              <input
                id="chk-ln"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#7B3CA1]"
              />
            </div>

            <div>
              <label htmlFor="chk-country" className="block text-xs font-semibold text-[#082A66] mb-1.5">
                Country / Region <span className="text-red-500">*</span>
              </label>
              <select
                id="chk-country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:border-[#7B3CA1]"
              >
                <option value="Pakistan">Pakistan</option>
                <option value="United States (US)">United States (US)</option>
                <option value="Canada">Canada</option>
                <option value="United Kingdom (UK)">United Kingdom (UK)</option>
              </select>
            </div>

            <div className="space-y-2.5">
              <label htmlFor="chk-st1" className="block text-xs font-semibold text-[#082A66]">
                Street address <span className="text-red-500">*</span>
              </label>
              <input
                id="chk-st1"
                type="text"
                required
                value={street1}
                onChange={(e) => setStreet1(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#7B3CA1]"
              />
              <input
                type="text"
                aria-label="Street address line 2"
                value={street2}
                onChange={(e) => setStreet2(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#7B3CA1]"
              />
            </div>

            <div>
              <label htmlFor="chk-city" className="block text-xs font-semibold text-[#082A66] mb-1.5">
                Town / City <span className="text-red-500">*</span>
              </label>
              <input
                id="chk-city"
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#7B3CA1]"
              />
            </div>

            <div>
              <label htmlFor="chk-state" className="block text-xs font-semibold text-[#082A66] mb-1.5">
                State <span className="text-red-500">*</span>
              </label>
              <input
                id="chk-state"
                type="text"
                required
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#7B3CA1]"
              />
            </div>

            <div>
              <label htmlFor="chk-zip" className="block text-xs font-semibold text-[#082A66] mb-1.5">
                ZIP Code <span className="text-red-500">*</span>
              </label>
              <input
                id="chk-zip"
                type="text"
                required
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#7B3CA1]"
              />
            </div>

            <div>
              <label htmlFor="chk-phone" className="block text-xs font-semibold text-[#082A66] mb-1.5">
                Phone (optional)
              </label>
              <input
                id="chk-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-emerald-500/70 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#7B3CA1]"
              />
            </div>

            <div>
              <label htmlFor="chk-email" className="block text-xs font-semibold text-[#082A66] mb-1.5">
                Email address <span className="text-red-500">*</span>
              </label>
              <input
                id="chk-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#7B3CA1]"
              />
            </div>

            <label className="flex items-center gap-2 text-sm font-bold text-[#082A66] cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={shipDifferent}
                onChange={(e) => setShipDifferent(e.target.checked)}
                className="rounded accent-[#7B3CA1]"
              />
              Ship To A Different Address?
            </label>

            {shipDifferent && (
              <div>
                <label htmlFor="chk-alt" className="block text-xs font-semibold text-[#082A66] mb-1.5">
                  Delivery Address
                </label>
                <input
                  id="chk-alt"
                  type="text"
                  value={altAddress}
                  onChange={(e) => setAltAddress(e.target.value)}
                  placeholder="Enter alternate street, city, state, and ZIP"
                  className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm"
                />
              </div>
            )}

            <div>
              <label htmlFor="chk-notes" className="block text-xs font-semibold text-[#082A66] mb-1.5">
                Order notes (optional)
              </label>
              <textarea
                id="chk-notes"
                rows={4}
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Notes about your order, e.g. special notes for delivery."
                className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#7B3CA1]"
              />
            </div>
          </div>

          {/* Right: Prescription Upload + Your Order */}
          <div className="lg:col-span-5 space-y-6">
            {/* Prescription Upload Card (Empty + Filled States) */}
            <div className="bg-[#FAF8FC] border border-purple-100 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-[#DC3545]">
                <FileText className="w-5 h-5" />
                <h2 className="text-base font-bold">
                  Prescription Upload {cartSummary.hasRxItems ? '(Required)' : '(Optional)'}
                </h2>
              </div>
              <p className="text-xs text-slate-600">
                {cartSummary.hasRxItems
                  ? 'This order contains items that require a valid medical prescription.'
                  : 'Attach a doctor prescription if you want our pharmacist to review co-medications.'}
              </p>
              <PrescriptionUploader
                value={rxFile}
                onChange={(f) => {
                  setRxFile(f);
                  if (f) setRxError(null);
                }}
                error={rxError}
              />
            </div>

            {/* Your Order Review Box */}
            <div className="border-2 border-[#7B3CA1] rounded-2xl p-6 space-y-5 bg-white">
              <h2 className="text-xl font-bold text-[#082A66]">Your Order</h2>

              <div className="flex items-center justify-between text-xs font-bold text-[#082A66] border-b border-slate-200 pb-2.5">
                <span>Product</span>
                <span>Subtotal</span>
              </div>

              <div className="divide-y divide-slate-100">
                {cart.map((item) => (
                  <div key={item.id} className="py-3 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-11 h-11 object-contain bg-[#F8F9FC] rounded-lg p-1 shrink-0"
                      />
                      <div className="text-xs">
                        <p className="font-bold text-[#082A66]">
                          {item.name} <span className="font-normal">× {item.quantity}</span>
                        </p>
                        {item.variantLabel && (
                          <p className="text-[11px] text-slate-500 mt-0.5">{item.variantLabel}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#082A66] tabular-nums shrink-0">
                      {formatMoney(item.price * item.quantity, currency)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2.5 text-xs border-t border-slate-200 pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold text-[#082A66]">Subtotal</span>
                  <span className="font-bold text-[#082A66] tabular-nums">
                    {formatMoney(cartSummary.subtotal, currency)}
                  </span>
                </div>
                {cartSummary.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span className="font-semibold">Coupon ({couponCode})</span>
                    <span className="font-bold tabular-nums">
                      -{formatMoney(cartSummary.discountAmount, currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-semibold text-[#082A66]">Shipment</span>
                  <span className="font-bold text-[#082A66] tabular-nums">
                    {cartSummary.shippingCost === 0
                      ? 'Free shipping'
                      : formatMoney(cartSummary.shippingCost, currency)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-base font-bold text-[#082A66]">Total</span>
                  <span className="text-xl font-extrabold text-[#082A66] tabular-nums">
                    {formatMoney(cartSummary.total, currency)}
                  </span>
                </div>
              </div>

              {/* Payment Method Radios */}
              <div className="space-y-2.5 pt-2">
                <div className="border border-slate-200 rounded-xl p-3.5">
                  <label className="flex items-center gap-2.5 text-xs font-bold text-[#082A66] cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'Direct bank transfer'}
                      onChange={() => setPaymentMethod('Direct bank transfer')}
                      className="accent-[#7B3CA1]"
                    />
                    Direct bank transfer
                  </label>
                  {paymentMethod === 'Direct bank transfer' && (
                    <p className="text-[11px] text-slate-600 mt-2 pl-6 leading-relaxed">
                      Make your payment directly into our bank account. Please use your Order ID as
                      the payment reference. Your order will not be shipped until the funds have
                      cleared in our account.
                    </p>
                  )}
                </div>

                {(['Check payments', 'Cash on delivery'] as const).map((pm) => (
                  <label
                    key={pm}
                    className="flex items-center gap-2.5 text-xs font-bold text-[#082A66] border border-slate-200 rounded-xl p-3.5 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === pm}
                      onChange={() => setPaymentMethod(pm)}
                      className="accent-[#7B3CA1]"
                    />
                    {pm}
                  </label>
                ))}
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Your personal data will be used to process your order, support your experience
                throughout this website, and for other purposes described in our{' '}
                <Link href="/privacy-policy" className="text-[#082A66] underline font-semibold">
                  privacy policy
                </Link>
                .
              </p>

              <button
                type="submit"
                disabled={cart.length === 0 || submittingOrder}
                className="w-full py-3 rounded-full bg-[#7B3CA1] hover:bg-[#662F87] disabled:opacity-50 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                {submittingOrder ? 'Creating Shopify Order...' : 'Place Order'}
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
