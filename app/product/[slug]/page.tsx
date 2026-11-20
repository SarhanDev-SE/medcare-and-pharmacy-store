'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  FileText,
  Flame,
  Heart,
  HelpCircle,
  Minus,
  Plus,
  RefreshCw,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Thermometer,
  Truck,
} from 'lucide-react';
import {
  formatMoney,
  getDefaultProductVariantIndex,
  getSubscriptionPrice,
} from '@/lib/store-logic';
import { useStore } from '@/context/StoreContext';
import ProductCard from '@/components/ProductCard';

type PdpTab =
  | 'description'
  | 'uses'
  | 'dosage'
  | 'side-effects'
  | 'safety'
  | 'reviews'
  | 'shipping';

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const {
    products,
    settings,
    currency,
    addToCart,
    wishlistIds,
    toggleWishlist,
    toggleCompare,
    recentlyViewedIds,
    markViewed,
    showToast,
  } = useStore();

  const product = products.find((p) => p.slug === slug) ?? products[0];
  const galleryImages =
    product.gallery.length > 0 ? product.gallery : [product.image];

  const defaultVarIdx = getDefaultProductVariantIndex(product);
  const [selectionState, setSelectionState] = useState<{
    id: string;
    thumb: number;
    variantIdx: number;
  }>({ id: product.id, thumb: 0, variantIdx: defaultVarIdx });
  const activeThumb = selectionState.id === product.id ? selectionState.thumb : 0;
  const selectedVariantIdx =
    selectionState.id === product.id ? selectionState.variantIdx : defaultVarIdx;
  const setActiveThumb = (thumb: number) =>
    setSelectionState({ id: product.id, thumb, variantIdx: selectedVariantIdx });
  const setSelectedVariantIdx = (variantIdx: number) =>
    setSelectionState({ id: product.id, thumb: activeThumb, variantIdx });

  const [purchaseMode, setPurchaseMode] = useState<'one-time' | 'subscription'>('one-time');
  const [subInterval, setSubInterval] = useState<30 | 60 | 90>(60);
  const [qty, setQty] = useState(1);
  const [zipInput, setZipInput] = useState('');
  const [zipMessage, setZipMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PdpTab>('description');
  const [bottomTab, setBottomTab] = useState<'related' | 'recent'>('related');

  // Review state keyed by product ID
  const [addedReviewsByProduct, setAddedReviewsByProduct] = useState<
    Record<string, typeof product.reviews>
  >({});
  const reviews = [...(addedReviewsByProduct[product.id] ?? []), ...product.reviews];
  const [revName, setRevName] = useState('');
  const [revRating, setRevRating] = useState(5);
  const [revComment, setRevComment] = useState('');

  useEffect(() => {
    queueMicrotask(() => markViewed(product.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const variant = product.variants[selectedVariantIdx] ?? product.variants[0];
  const oneTimePrice = variant?.price ?? product.price;
  const subPrice = getSubscriptionPrice(oneTimePrice);
  const activePrice = purchaseMode === 'subscription' ? subPrice : oneTimePrice;
  const isWishlisted = wishlistIds.includes(product.id);

  const substituteProducts = products.filter((p) => p.id !== product.id).slice(0, 4);
  const relatedProducts = products.filter(
    (p) => p.id !== product.id && p.category === product.category
  ).slice(0, 4);
  const recentlyViewedProducts = recentlyViewedIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  const handleZipCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = zipInput.trim();
    if (cleaned.length < 3) {
      setZipMessage('Enter a valid Pakistani city or 5-digit postal code (e.g., Karachi or 75600).');
      return;
    }
    setZipMessage(`Express delivery available to ${cleaned} — Arrives in 2–4 business days.`);
  };

  const handleAddAction = (goCheckout: boolean) => {
    if (!product.inStock) {
      showToast('This medicine is currently out of stock.');
      return;
    }
    addToCart(
      {
        productId: product.id,
        shopifyVariantId: variant?.shopifyVariantId,
        slug: product.slug,
        name: product.name,
        image: product.image,
        price: activePrice,
        originalPrice: oneTimePrice,
        quantity: qty,
        isRx: product.isRx,
        variantLabel:
          purchaseMode === 'subscription'
            ? `${subInterval} Days Supply (15% Off)`
            : variant?.label,
        purchaseMode,
        subscriptionIntervalDays: purchaseMode === 'subscription' ? subInterval : undefined,
      },
      !goCheckout
    );
    if (goCheckout) router.push('/checkout');
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revName.trim() || !revComment.trim()) {
      showToast('Please enter your name and review.');
      return;
    }
    setAddedReviewsByProduct((prev) => ({
      ...prev,
      [product.id]: [
        {
          id: `rev-${Date.now()}`,
          author: revName.trim(),
          rating: revRating,
          date: 'Just now',
          comment: revComment.trim(),
        },
        ...(prev[product.id] ?? []),
      ],
    }));
    setRevName('');
    setRevComment('');
    showToast('Thank you! Your review has been posted.');
  };

  return (
    <div className="bg-white">
      {/* Top Breadcrumb */}
      <div className="max-w-[1320px] mx-auto px-4 pt-6 pb-4 flex items-center justify-between gap-4">
        <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500">
          <Link href="/" className="hover:text-[#7B3CA1]">Home</Link>
          <span>›</span>
          <Link href="/shop" className="hover:text-[#7B3CA1]">Shop</Link>
          <span>›</span>
          <Link href={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-[#7B3CA1]">
            {product.category}
          </Link>
          <span>›</span>
          <span className="text-slate-800 font-medium truncate max-w-[220px]">{product.name}</span>
        </nav>
      </div>

      {/* Main PDP Split */}
      <section className="max-w-[1320px] mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left: Gallery */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-[#F8F9FC] border border-slate-200/80 rounded-2xl p-8 flex items-center justify-center h-[420px] sm:h-[480px]">
              <img
                src={galleryImages[activeThumb] ?? product.image}
                alt={product.name}
                className="max-h-96 w-auto object-contain"
              />
            </div>
            <div className="grid grid-cols-4 gap-3">
              {galleryImages.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveThumb(i)}
                  className={`h-20 rounded-xl bg-[#F8F9FC] p-2 border-2 flex items-center justify-center cursor-pointer transition-colors ${
                    activeThumb === i ? 'border-[#7B3CA1]' : 'border-transparent hover:border-slate-300'
                  }`}
                >
                  <img src={img} alt={`${product.name} view ${i + 1}`} className="max-h-16 object-contain rounded" />
                </button>
              ))}
            </div>
          </div>

          {/* Right: Contiguous Purchase Module */}
          <div className="lg:col-span-6 space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-[#7B3CA1]">
              {product.subcategory}
            </p>

            {/* Rx & Temp Badges */}
            <div className="flex items-center flex-wrap gap-2">
              {product.isRx && (
                <span className="inline-flex items-center gap-1 border border-red-200 bg-red-50 text-red-700 text-[11px] font-semibold px-2.5 py-0.5 rounded">
                  <FileText className="w-3 h-3" />
                  Rx Required
                </span>
              )}
              {product.isTempControlled && (
                <span className="inline-flex items-center gap-1 border border-teal-200 bg-teal-50 text-teal-700 text-[11px] font-semibold px-2.5 py-0.5 rounded">
                  <Thermometer className="w-3 h-3" />
                  Temp Controlled
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#082A66] leading-tight">
              {product.name}
            </h1>

            {/* Rating & Social Proof */}
            <div className="flex items-center flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="flex items-center text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <span className="text-slate-600 font-medium tabular-nums">({reviews.length || 3})</span>
              </div>
              <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                <Flame className="w-3.5 h-3.5" />
                {product.soldRecently ?? 5} sold in last 2 hours
              </span>
            </div>

            {/* Price Block */}
            <div className="flex items-baseline gap-3 tabular-nums pt-1">
              <span className="text-3xl font-extrabold text-[#7B3CA1]">
                {formatMoney(activePrice, currency)}
              </span>
              {product.originalPrice && (
                <span className="text-base text-slate-400 line-through">
                  {formatMoney(product.originalPrice, currency)}
                </span>
              )}
              {product.discountPercent && (
                <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-0.5 rounded">
                  -{product.discountPercent}%
                </span>
              )}
            </div>

            {/* Stock Tag */}
            <div>
              <span
                className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded ${
                  product.inStock ? 'bg-[#082A66] text-white' : 'bg-red-100 text-red-700'
                }`}
              >
                {product.inStock ? 'IN STOCK' : 'OUT OF STOCK'}
              </span>
            </div>

            {/* Spec Table */}
            <dl className="grid grid-cols-1 gap-1.5 text-xs border-y border-slate-200 py-3.5">
              <div className="flex gap-2">
                <dt className="text-slate-500">Expiry Date:</dt>
                <dd className="font-bold text-[#082A66]">{product.expiryDate}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-slate-500">Medicine Type:</dt>
                <dd className="font-bold text-[#082A66]">{product.medicineType}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-slate-500">Salt / Composition:</dt>
                <dd className="font-bold text-[#082A66]">{product.composition}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-slate-500">Manufacturer:</dt>
                <dd className="font-bold text-[#082A66]">{product.manufacturer}</dd>
              </div>
            </dl>

            <p className="text-xs text-[#082A66] font-medium flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#7B3CA1]" />
              <span className="tabular-nums">{product.viewingNow ?? 35}</span> People viewing this product right now!
            </p>

            {/* Variant Pills if multiple */}
            {product.variants.length > 1 && (
              <div>
                <p className="text-xs font-semibold text-[#082A66] mb-2">Pack Size:</p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v, idx) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariantIdx(idx)}
                      className={`px-3.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                        selectedVariantIdx === idx
                          ? 'border-[#7B3CA1] bg-[#F5F0FA] text-[#7B3CA1]'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Purchase Type Radio: One-Time vs Subscribe & Save */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-200">
              <label className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50">
                <span className="flex items-center gap-2.5 text-sm font-semibold text-[#082A66]">
                  <input
                    type="radio"
                    name="purchaseMode"
                    checked={purchaseMode === 'one-time'}
                    onChange={() => setPurchaseMode('one-time')}
                    className="accent-[#7B3CA1]"
                  />
                  One-Time Purchase
                </span>
                <span className="text-sm font-bold text-[#082A66] tabular-nums">
                  {formatMoney(oneTimePrice, currency)}
                </span>
              </label>

              {product.subscriptionEligible && (
                <div className="p-4 bg-[#FAF9FD]">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="flex items-center gap-2.5 text-sm font-semibold text-[#082A66]">
                      <input
                        type="radio"
                        name="purchaseMode"
                        checked={purchaseMode === 'subscription'}
                        onChange={() => setPurchaseMode('subscription')}
                        className="accent-[#7B3CA1]"
                      />
                      Subscribe &amp; Save
                    </span>
                    <span className="bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      Save up to 15%
                    </span>
                  </label>
                  {purchaseMode === 'subscription' && (
                    <div className="mt-3 pl-6 flex items-center gap-3 text-xs">
                      <span className="text-slate-600">Delivery Interval:</span>
                      <select
                        aria-label="Subscription delivery interval"
                        value={subInterval}
                        onChange={(e) => setSubInterval(Number(e.target.value) as 30 | 60 | 90)}
                        className="border border-slate-200 rounded-lg px-2.5 py-1 bg-white font-semibold text-[#082A66]"
                      >
                        <option value={30}>Every 30 Days</option>
                        <option value={60}>Every 60 Days</option>
                        <option value={90}>Every 90 Days</option>
                      </select>
                      <span className="font-bold text-[#7B3CA1] tabular-nums">
                        {formatMoney(subPrice, currency)} / cycle
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Qty & Primary Buy CTAs */}
            <div className="space-y-3 pt-1">
              <p className="text-xs font-semibold text-[#082A66]">Quantity:</p>
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center border border-slate-200 rounded-full h-11 px-3">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-7 h-7 flex items-center justify-center text-slate-600 cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-9 text-center text-sm font-bold tabular-nums">{qty}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => setQty((q) => q + 1)}
                    className="w-7 h-7 flex items-center justify-center text-slate-600 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  disabled={!product.inStock}
                  onClick={() => handleAddAction(false)}
                  className="flex-1 h-11 rounded-full bg-[#7B3CA1] hover:bg-[#662F87] disabled:opacity-50 text-white text-sm font-semibold transition-colors cursor-pointer"
                >
                  Add To Cart
                </button>
              </div>

              <button
                type="button"
                disabled={!product.inStock}
                onClick={() => handleAddAction(true)}
                className="w-full h-11 rounded-full bg-[#DC3545] hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                Buy It Now
              </button>
            </div>

            {/* Secondary Action Row */}
            <div className="flex items-center flex-wrap gap-5 text-xs font-medium text-[#082A66] pt-1">
              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                className={`inline-flex items-center gap-1.5 cursor-pointer ${
                  isWishlisted ? 'text-[#7B3CA1] font-bold' : 'hover:text-[#7B3CA1]'
                }`}
              >
                <Heart className="w-4 h-4" />
                {isWishlisted ? 'In Wishlist' : 'Add to wishlist'}
              </button>
              <button
                type="button"
                onClick={() => toggleCompare(product.id)}
                className="inline-flex items-center gap-1.5 hover:text-[#7B3CA1] cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Compare
              </button>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 hover:text-[#7B3CA1]"
              >
                <HelpCircle className="w-4 h-4" />
                Ask a Question
              </Link>
              <button
                type="button"
                onClick={() => {
                  if (typeof navigator !== 'undefined' && navigator.clipboard) {
                    navigator.clipboard.writeText(window.location.href).catch(() => {});
                  }
                  showToast('Product link copied to clipboard.');
                }}
                className="inline-flex items-center gap-1.5 hover:text-[#7B3CA1] cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>

            {/* Zip Code Delivery Checker */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-2.5">
              <p className="text-xs font-bold text-[#082A66]">Check Delivery</p>
              <form onSubmit={handleZipCheck} className="flex items-center gap-2">
                <input
                  type="text"
                  value={zipInput}
                  onChange={(e) => setZipInput(e.target.value)}
                  placeholder="Enter City or Postal Code (e.g., Karachi, 75600)"
                  aria-label="City or postal code for delivery check"
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#7B3CA1]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#7B3CA1] hover:bg-[#662F87] text-white text-xs font-semibold cursor-pointer"
                >
                  Check
                </button>
              </form>
              {zipMessage && (
                <p className="text-xs text-emerald-700 font-medium">{zipMessage}</p>
              )}
            </div>

            {/* Trust Mini Box */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-semibold text-[#082A66]">
                <div className="flex flex-col items-center gap-1">
                  <ShieldCheck className="w-5 h-5 text-slate-600" />
                  <span>100% Genuine</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Truck className="w-5 h-5 text-slate-600" />
                  <span>Fast Delivery</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <RefreshCw className="w-5 h-5 text-slate-600" />
                  <span>Easy Returns</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <CheckCircle2 className="w-5 h-5 text-slate-600" />
                  <span>Licensed</span>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-2.5 flex items-center justify-center flex-wrap gap-2 text-[10px]">
                <span className="text-slate-500 font-medium">Guaranteed Safe Checkout:</span>
                {['VISA', 'Mastercard', 'AMEX', 'PayPal', 'Discover'].map((c) => (
                  <span key={c} className="px-2 py-0.5 bg-slate-100 text-[#082A66] font-bold rounded">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7-Tab Information Section */}
      <section className="max-w-[1320px] mx-auto px-4 pb-12">
        <div
          role="tablist"
          aria-label="Product information tabs"
          className="flex items-center gap-6 overflow-x-auto border-b border-slate-200 mb-6"
        >
          {(
            [
              { id: 'description', label: 'Description' },
              { id: 'uses', label: 'Uses & Benefits' },
              { id: 'dosage', label: 'Dosage' },
              { id: 'side-effects', label: 'Side Effects' },
              { id: 'safety', label: 'Safety Advice' },
              { id: 'reviews', label: `Reviews (${reviews.length})` },
              { id: 'shipping', label: 'Shipping & Returns' },
            ] as { id: PdpTab; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={activeTab === t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`pb-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                activeTab === t.id
                  ? 'border-[#082A66] text-[#082A66]'
                  : 'border-transparent text-slate-400 hover:text-[#082A66]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'description' && (
          <div className="space-y-6">
            <p className="text-sm text-slate-600 leading-relaxed max-w-4xl">{product.description}</p>
            <div>
              <h3 className="text-sm font-bold text-[#082A66] mb-2">Key Features</h3>
              <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-600">
                {product.benefits.map((b) => (
                  <li key={b}>{b}</li>
                ))}
                <li>Trusted and widely used pharmacy formulation</li>
              </ul>
            </div>

            <div className="bg-[#F4F6FA] border border-slate-200/70 rounded-2xl p-6 space-y-2">
              <h3 className="text-base font-bold text-[#082A66]">Manufacturer Information</h3>
              <p className="text-xs text-slate-600">
                <span className="font-semibold">Name:</span>{' '}
                <strong className="text-[#082A66]">{product.manufacturer}</strong>
              </p>
              <p className="text-xs text-slate-600">
                <span className="font-semibold">Address:</span>{' '}
                <strong className="text-[#082A66]">{product.manufacturerAddress}</strong>
              </p>
              <p className="text-xs text-slate-600">
                <span className="font-semibold">Phone:</span>{' '}
                <strong className="text-[#082A66]">{product.manufacturerPhone}</strong>
              </p>
            </div>

            <div className="bg-[#FFF6EB] border border-amber-200/80 rounded-2xl p-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold text-[#082A66] mb-1">Medical Disclaimer</h3>
                <p className="text-xs italic text-slate-600 leading-relaxed">
                  The information provided on this website is for informational purposes only and is
                  not intended as a substitute for advice from your physician or other health care
                  professional. You should not use the information on this website for diagnosis or
                  treatment of any health problem or for prescription of any medication or other
                  treatment.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'uses' && (
          <p className="text-sm text-slate-600 leading-relaxed max-w-4xl">{product.usesAndBenefits}</p>
        )}
        {activeTab === 'dosage' && (
          <p className="text-sm text-slate-600 leading-relaxed max-w-4xl">{product.dosage}</p>
        )}
        {activeTab === 'side-effects' && (
          <p className="text-sm text-slate-600 leading-relaxed max-w-4xl">{product.sideEffects}</p>
        )}
        {activeTab === 'safety' && (
          <p className="text-sm text-slate-600 leading-relaxed max-w-4xl">{product.safetyAdvice}</p>
        )}
        {activeTab === 'shipping' && (
          <div className="text-sm text-slate-600 space-y-2 max-w-4xl">
            <p>Orders placed before 2:00 PM PKT ship same business day from our licensed Karachi &amp; Lahore pharmacy hubs.</p>
            <p>
              Temperature-controlled Rx formulations travel in insulated cold-chain pouches — free insured delivery across Pakistan on orders over{' '}
              {formatMoney(settings.freeShippingThreshold, currency)} ({formatMoney(settings.standardShippingFee, currency)} standard courier below threshold).
            </p>
            <p>30-day return policy applies to unopened non-prescription items.</p>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-4">
              {reviews.length === 0 ? (
                <p className="text-sm text-slate-500">No reviews yet. Be the first to review this formula!</p>
              ) : (
                reviews.map((r) => (
                  <div key={r.id} className="border border-slate-200 rounded-xl p-4 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-[#082A66]">{r.author}</p>
                      <span className="text-xs text-slate-400">{r.date}</span>
                    </div>
                    <p className="text-amber-400 text-xs">{'★'.repeat(r.rating)}</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{r.comment}</p>
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={handleReviewSubmit}
              className="lg:col-span-5 border border-slate-200 rounded-2xl p-5 space-y-3 h-fit"
            >
              <h3 className="text-base font-bold text-[#082A66]">Write a Review</h3>
              <div>
                <label htmlFor="pdp-rev-name" className="block text-xs font-medium text-slate-600 mb-1">
                  Your Name *
                </label>
                <input
                  id="pdp-rev-name"
                  type="text"
                  value={revName}
                  onChange={(e) => setRevName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label htmlFor="pdp-rev-rating" className="block text-xs font-medium text-slate-600 mb-1">
                  Rating
                </label>
                <select
                  id="pdp-rev-rating"
                  value={revRating}
                  onChange={(e) => setRevRating(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs"
                >
                  <option value={5}>5 Stars — Excellent</option>
                  <option value={4}>4 Stars — Good</option>
                  <option value={3}>3 Stars — Average</option>
                </select>
              </div>
              <div>
                <label htmlFor="pdp-rev-comment" className="block text-xs font-medium text-slate-600 mb-1">
                  Review *
                </label>
                <textarea
                  id="pdp-rev-comment"
                  rows={3}
                  value={revComment}
                  onChange={(e) => setRevComment(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2 rounded-full bg-[#7B3CA1] hover:bg-[#662F87] text-white text-xs font-semibold cursor-pointer"
              >
                Post Review
              </button>
            </form>
          </div>
        )}
      </section>

      {/* Substitute Medicines */}
      <section className="max-w-[1320px] mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-[#082A66] mb-6">Substitute Medicines</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {substituteProducts.map((p) => (
            <ProductCard key={p.id} product={p} quickAddLabel="Quick Add" />
          ))}
        </div>
      </section>

      {/* Related Products / Recently Viewed */}
      <section className="max-w-[1320px] mx-auto px-4 py-8">
        <div className="flex items-center justify-center gap-8 mb-6">
          <button
            type="button"
            onClick={() => setBottomTab('related')}
            className={`text-xl font-bold pb-1.5 border-b-2 transition-colors cursor-pointer ${
              bottomTab === 'related'
                ? 'border-[#082A66] text-[#082A66]'
                : 'border-transparent text-slate-400 hover:text-[#082A66]'
            }`}
          >
            Related Products
          </button>
          <button
            type="button"
            onClick={() => setBottomTab('recent')}
            className={`text-xl font-bold pb-1.5 border-b-2 transition-colors cursor-pointer ${
              bottomTab === 'recent'
                ? 'border-[#082A66] text-[#082A66]'
                : 'border-transparent text-slate-400 hover:text-[#082A66]'
            }`}
          >
            Recently Viewed
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {(bottomTab === 'related' ? relatedProducts : recentlyViewedProducts).map((p) => (
            <ProductCard key={p.id} product={p} quickAddLabel="Quick Add" />
          ))}
        </div>
      </section>
    </div>
  );
}
