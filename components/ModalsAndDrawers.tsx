'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  Flame,
  Minus,
  Plus,
  Search,
  StickyNote,
  Tag,
  Truck,
  X,
} from 'lucide-react';
import {
  formatMoney,
  getDefaultProductVariantIndex,
} from '@/lib/store-logic';
import { useStore } from '@/context/StoreContext';
import ProductCard from './ProductCard';

export default function ModalsAndDrawers() {
  const router = useRouter();
  const {
    products,
    settings,
    currency,
    authLoading,
    login,
    register,
    authModal,
    openAuthModal,
    closeAuthModal,
    postAuthRedirect,
    clearPostAuthRedirect,
    quickViewProduct,
    closeQuickView,
    cart,
    shopifyCheckoutUrl,
    addToCart,
    updateCartQty,
    removeFromCart,
    cartSummary,
    cartDrawerOpen,
    setCartDrawerOpen,
    cartNotes,
    setCartNotes,
    applyCoupon,
    couponCode,
    searchOpen,
    setSearchOpen,
    recentlyViewedIds,
    newsletterOpen,
    setNewsletterOpen,
    historyModalSub,
    setHistoryModalSub,
    rxPreviewFile,
    setRxPreviewFile,
    toastMessage,
    showToast,
  } = useStore();

  // Auth form states
  const [authIdentifier, setAuthIdentifier] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [authErrorState, setAuthErrorState] = useState<{ mode: string | null; msg: string } | null>(null);
  const authError = authErrorState?.mode === authModal ? authErrorState.msg : null;

  // Quick View state keyed by product ID
  const [qvState, setQvState] = useState<{ id: string; variantIdx: number; qty: number }>({
    id: '',
    variantIdx: 0,
    qty: 1,
  });
  const qvVariantIdx =
    qvState.id === quickViewProduct?.id
      ? qvState.variantIdx
      : quickViewProduct
        ? getDefaultProductVariantIndex(quickViewProduct)
        : 0;
  const qvQty = qvState.id === quickViewProduct?.id ? qvState.qty : 1;

  // Cart Drawer tab state
  const [cartTab, setCartTab] = useState<'note' | 'shipping' | 'coupon' | null>(null);
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [drawerCouponInput, setDrawerCouponInput] = useState('');
  const [zipEstimate, setZipEstimate] = useState('75600');

  // Search overlay state
  const [overlayQuery, setOverlayQuery] = useState('');

  // Newsletter modal state
  const [newsEmail, setNewsEmail] = useState('');

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authIdentifier.trim() || !authPassword.trim()) {
      setAuthErrorState({ mode: authModal, msg: 'Please enter your username/email and password.' });
      return;
    }
    setAuthErrorState(null);
    const res = await login(authIdentifier, authPassword);
    if (!res.ok) {
      setAuthErrorState({ mode: authModal, msg: res.error || 'Invalid credentials.' });
      return;
    }
    if (postAuthRedirect) {
      const target = postAuthRedirect;
      clearPostAuthRedirect();
      router.push(target);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authIdentifier.trim() || authPassword.length < 4) {
      setAuthErrorState({
        mode: authModal,
        msg: 'Please provide an email/username and a password (min 4 characters).',
      });
      return;
    }
    if (authPassword !== authConfirmPassword) {
      setAuthErrorState({ mode: authModal, msg: 'Passwords do not match.' });
      return;
    }
    setAuthErrorState(null);
    const res = await register(authIdentifier, authPassword);
    if (!res.ok) {
      setAuthErrorState({ mode: authModal, msg: res.error || 'Unable to create Shopify account.' });
      return;
    }
    if (postAuthRedirect) {
      const target = postAuthRedirect;
      clearPostAuthRedirect();
      router.push(target);
    }
  };

  const qvVariant =
    quickViewProduct?.variants[qvVariantIdx] ?? quickViewProduct?.variants[0];
  const qvPrice = qvVariant?.price ?? quickViewProduct?.price ?? 0;

  const searchMatches = overlayQuery.trim()
    ? products.filter((p) =>
        `${p.name} ${p.category} ${p.subcategory} ${p.brand}`
          .toLowerCase()
          .includes(overlayQuery.trim().toLowerCase())
      ).slice(0, 4)
    : recentlyViewedIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p))
        .slice(0, 4);

  return (
    <>
      {/* 1. Sign In / Register Modal (Screens 21 & 22) */}
      {authModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative">
            <button
              type="button"
              onClick={closeAuthModal}
              aria-label="Close authentication modal"
              className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <h2 id="auth-modal-title" className="text-2xl font-bold text-[#082A66]">
                {authModal === 'signin' ? 'Sign In' : 'Create Account'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {authModal === 'signin'
                  ? 'Sign in to access your personalized experience.'
                  : 'Be part of our growing family of new customers!'}
              </p>
            </div>

            {authError && (
              <p
                role="alert"
                className="mb-4 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
              >
                {authError}
              </p>
            )}

            {authModal === 'signin' ? (
              <form onSubmit={handleSignInSubmit} className="space-y-4">
                <div>
                  <label htmlFor="signin-id" className="block text-xs font-medium text-slate-700 mb-1">
                    Username or email address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="signin-id"
                    type="text"
                    value={authIdentifier}
                    onChange={(e) => setAuthIdentifier(e.target.value)}
                    placeholder="customer.xmedcar@gmail.com"
                    className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#7B3CA1]"
                  />
                </div>

                <div>
                  <label htmlFor="signin-pw" className="block text-xs font-medium text-slate-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="signin-pw"
                      type={showPassword ? 'text' : 'password'}
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 pr-10 text-sm focus:outline-none focus:border-[#7B3CA1]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded accent-[#082A66]"
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthIdentifier('customer.xmedcar@gmail.com');
                      setAuthPassword('xmedcar123');
                      setAuthErrorState(null);
                    }}
                    className="text-[#7B3CA1] font-semibold underline cursor-pointer"
                  >
                    Use Demo Member
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 rounded-full bg-[#7B3CA1] hover:bg-[#662F87] disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer"
                >
                  {authLoading ? 'Signing In...' : 'Login'}
                </button>
                <button
                  type="button"
                  onClick={() => openAuthModal('register')}
                  className="w-full py-2.5 rounded-full border border-slate-200 hover:border-[#7B3CA1] text-[#082A66] text-sm font-semibold transition-colors cursor-pointer"
                >
                  Create Account
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label htmlFor="reg-id" className="block text-xs font-medium text-slate-700 mb-1">
                    Username or email address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="reg-id"
                    type="text"
                    value={authIdentifier}
                    onChange={(e) => setAuthIdentifier(e.target.value)}
                    placeholder="Username or email address"
                    className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#7B3CA1]"
                  />
                </div>
                <div>
                  <label htmlFor="reg-pw" className="block text-xs font-medium text-slate-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="reg-pw"
                    type={showPassword ? 'text' : 'password'}
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#7B3CA1]"
                  />
                </div>
                <div>
                  <label htmlFor="reg-pw2" className="block text-xs font-medium text-slate-700 mb-1">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="reg-pw2"
                    type={showPassword ? 'text' : 'password'}
                    value={authConfirmPassword}
                    onChange={(e) => setAuthConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                    className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#7B3CA1]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 rounded-full bg-[#7B3CA1] hover:bg-[#662F87] disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer"
                >
                  {authLoading ? 'Creating Account...' : 'Create Account'}
                </button>
                <button
                  type="button"
                  onClick={() => openAuthModal('signin')}
                  className="w-full py-2.5 rounded-full border border-slate-200 hover:border-[#7B3CA1] text-[#082A66] text-sm font-semibold transition-colors cursor-pointer"
                >
                  Login
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 2. Search Overlay (Screen 23) */}
      {searchOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Product Search"
          className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto"
        >
          <div className="bg-white rounded-2xl w-full max-w-5xl p-6 shadow-2xl relative mb-10">
            <div className="flex items-center justify-between gap-4 border border-slate-200 rounded-xl px-4 py-2.5 mb-5 focus-within:border-[#7B3CA1]">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                autoFocus
                value={overlayQuery}
                onChange={(e) => setOverlayQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && overlayQuery.trim()) {
                    setSearchOpen(false);
                    router.push(`/shop?q=${encodeURIComponent(overlayQuery.trim())}`);
                  }
                }}
                placeholder="Search medicines, vitamins, compositions, or brands..."
                className="flex-1 text-sm text-slate-900 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search overlay"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-bold text-[#082A66] mb-2.5">Feature Keywords Today</h3>
              <div className="flex items-center flex-wrap gap-2">
                {settings.featuredKeywords.map(
                  (kw) => (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => {
                        setSearchOpen(false);
                        router.push(`/shop?q=${encodeURIComponent(kw)}`);
                      }}
                      className="px-3.5 py-1.5 rounded-full border border-slate-200 text-xs font-medium text-slate-700 hover:border-[#7B3CA1] hover:text-[#7B3CA1] transition-colors cursor-pointer"
                    >
                      {kw}
                    </button>
                  )
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-[#082A66] mb-3">
                {overlayQuery.trim() ? 'Matching Products' : 'Recently Viewed Products'}
              </h3>
              {searchMatches.length === 0 ? (
                <p className="text-sm text-slate-500 py-6 text-center">
                  No products matched &ldquo;{overlayQuery}&rdquo;. Try searching for Vitamins or Gaia.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {searchMatches.map((prod) => (
                    <div key={prod.id} onClick={() => setSearchOpen(false)}>
                      <ProductCard product={prod} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Newsletter 10% OFF Popup (Screen 24) */}
      {newsletterOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="newsletter-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl grid grid-cols-1 sm:grid-cols-2 relative">
            <button
              type="button"
              onClick={() => setNewsletterOpen(false)}
              aria-label="Close newsletter popup"
              className="absolute right-3 top-3 z-10 p-1.5 rounded-full bg-white/90 text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="bg-[#EEF3F9] flex items-center justify-center min-h-[220px]">
              <img
                src={settings.newsletterImage}
                alt="Xmedcar Wellness Kit"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 sm:p-8 flex flex-col justify-center">
              <p className="text-xs font-bold text-[#082A66] uppercase tracking-wide mb-1">
                Subscribe &amp; Enjoy
              </p>
              <h2 id="newsletter-modal-title" className="text-4xl font-extrabold text-[#7B3CA1] mb-2">
                10% OFF
              </h2>
              <p className="text-xs text-slate-600 mb-5 leading-relaxed">
                Join our email list &amp; be first to receive 10% OFF your next order, exclusive
                offers &amp; more!
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newsEmail.includes('@')) {
                    showToast('Please enter a valid email address.');
                    return;
                  }
                  applyCoupon(settings.promoCode);
                  setNewsletterOpen(false);
                  showToast(`Code ${settings.promoCode} applied! Enjoy 10% off your order.`);
                  setNewsEmail('');
                }}
                className="relative"
              >
                <input
                  type="email"
                  required
                  value={newsEmail}
                  onChange={(e) => setNewsEmail(e.target.value)}
                  placeholder="Your email address"
                  aria-label="Email address for 10% off coupon"
                  className="w-full border border-[#7B3CA1] rounded-full py-2.5 pl-4 pr-11 text-xs focus:outline-none"
                />
                <button
                  type="submit"
                  aria-label="Claim 10% off coupon"
                  className="absolute right-1 top-1 w-8 h-8 rounded-full bg-[#7B3CA1] text-white flex items-center justify-center hover:bg-[#662F87] cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
              <p className="text-[11px] text-slate-400 mt-3">
                Don&apos;t worry, we hate spam as much as you do.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Quick View Right Drawer (Screen 11) */}
      {quickViewProduct && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Quick view ${quickViewProduct.name}`}
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/45 backdrop-blur-xs"
        >
          <div className="bg-white w-full max-w-2xl h-full overflow-y-auto shadow-2xl p-6 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5">
              <h2 className="text-lg font-bold text-[#082A66]">Quick View</h2>
              <button
                type="button"
                onClick={closeQuickView}
                aria-label="Close quick view"
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="bg-[#F8F9FC] rounded-xl p-6 flex items-center justify-center h-64">
                  <img
                    src={quickViewProduct.image}
                    alt={quickViewProduct.name}
                    className="max-h-52 object-contain mix-blend-multiply"
                  />
                </div>
                {quickViewProduct.gallery.slice(0, 2).map((img, i) => (
                  <div key={i} className="bg-[#F8F9FC] rounded-xl p-3 flex items-center justify-center h-36">
                    <img src={img} alt="" className="max-h-28 object-contain mix-blend-multiply rounded-lg" />
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#7B3CA1]">
                  {quickViewProduct.category}
                </p>
                <h3 className="text-xl font-bold text-[#082A66] mt-1 leading-snug">
                  {quickViewProduct.name}
                </h3>

                <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                  <span className="text-amber-400">★★★★★</span>
                  <span className="tabular-nums">({quickViewProduct.reviewCount})</span>
                  <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                    <Flame className="w-3.5 h-3.5" />
                    {quickViewProduct.soldRecently ?? 18} sold in last 32 hours
                  </span>
                </div>

                <div className="flex items-baseline gap-2.5 mt-4 tabular-nums">
                  <span className="text-sm text-slate-500">Price:</span>
                  <span className="text-2xl font-bold text-[#7B3CA1]">
                    {formatMoney(qvPrice, currency)}
                  </span>
                  {(qvVariant?.originalPrice ?? quickViewProduct.originalPrice) && (
                    <span className="text-sm text-slate-400 line-through">
                      {formatMoney(
                        (qvVariant?.originalPrice ?? quickViewProduct.originalPrice)!,
                        currency
                      )}
                    </span>
                  )}
                  {quickViewProduct.discountPercent && (
                    <span className="bg-rose-100 text-rose-700 text-[11px] font-bold px-2 py-0.5 rounded">
                      -{quickViewProduct.discountPercent}%
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                  We protect you and the plant&apos;s purity before bottling and shipping.
                </p>

                <p className="mt-3 text-xs text-[#082A66] font-medium flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-[#7B3CA1]" />
                  {quickViewProduct.viewingNow ?? 28} people are viewing this right now
                </p>

                {/* Variant Size Selector */}
                {quickViewProduct.variants.length > 0 && (
                  <div className="mt-5">
                    <p className="text-xs font-semibold text-[#082A66] mb-2">
                      Size: <span className="font-bold">{qvVariant?.label}</span>
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {quickViewProduct.variants.map((v, idx) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() =>
                            setQvState({ id: quickViewProduct.id, variantIdx: idx, qty: qvQty })
                          }
                          className={`text-left px-3.5 py-2.5 rounded-xl border transition-colors cursor-pointer ${
                            idx === qvVariantIdx
                              ? 'border-[#7B3CA1] bg-[#FAF7FC]'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <p className="text-xs font-bold text-[#082A66]">{v.label}</p>
                          <p className="text-[11px] text-slate-500 tabular-nums">
                            {formatMoney(v.price, currency)}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Qty + Add to Cart + Buy It Now */}
                <div className="mt-5 space-y-3">
                  <p className="text-xs font-semibold text-[#082A66]">Quantity:</p>
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center border border-slate-200 rounded-full h-10 px-2">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() =>
                          setQvState({
                            id: quickViewProduct.id,
                            variantIdx: qvVariantIdx,
                            qty: Math.max(1, qvQty - 1),
                          })
                        }
                        className="w-7 h-7 flex items-center justify-center text-slate-600 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold tabular-nums">
                        {qvQty}
                      </span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() =>
                          setQvState({
                            id: quickViewProduct.id,
                            variantIdx: qvVariantIdx,
                            qty: qvQty + 1,
                          })
                        }
                        className="w-7 h-7 flex items-center justify-center text-slate-600 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        addToCart({
                          productId: quickViewProduct.id,
                          shopifyVariantId: qvVariant?.shopifyVariantId,
                          slug: quickViewProduct.slug,
                          name: quickViewProduct.name,
                          image: quickViewProduct.image,
                          price: qvPrice,
                          originalPrice: qvVariant?.originalPrice ?? quickViewProduct.originalPrice,
                          quantity: qvQty,
                          isRx: quickViewProduct.isRx,
                          variantLabel: qvVariant?.label,
                          purchaseMode: 'one-time',
                        });
                        closeQuickView();
                      }}
                      className="flex-1 py-2.5 px-4 rounded-full bg-[#7B3CA1] hover:bg-[#662F87] text-white text-xs font-semibold transition-colors cursor-pointer tabular-nums"
                    >
                      Add To Cart - {formatMoney(qvPrice * qvQty, currency)}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      addToCart(
                        {
                          productId: quickViewProduct.id,
                          shopifyVariantId: qvVariant?.shopifyVariantId,
                          slug: quickViewProduct.slug,
                          name: quickViewProduct.name,
                          image: quickViewProduct.image,
                          price: qvPrice,
                          originalPrice: qvVariant?.originalPrice ?? quickViewProduct.originalPrice,
                          quantity: qvQty,
                          isRx: quickViewProduct.isRx,
                          variantLabel: qvVariant?.label,
                          purchaseMode: 'one-time',
                        },
                        false
                      );
                      closeQuickView();
                      router.push('/checkout');
                    }}
                    className="w-full py-2.5 px-4 rounded-full bg-[#DC3545] hover:bg-red-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Buy It Now
                  </button>

                  <Link
                    href={`/product/${quickViewProduct.slug}`}
                    onClick={closeQuickView}
                    className="block text-center text-xs font-semibold text-[#082A66] hover:text-[#7B3CA1] underline pt-1"
                  >
                    View Full Product Details →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Mini Cart Slide-Out Drawer (Screen 13) */}
      {cartDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Shopping Cart"
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/45 backdrop-blur-xs"
        >
          <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-[#082A66]">Shopping Cart</h2>
              <button
                type="button"
                onClick={() => setCartDrawerOpen(false)}
                aria-label="Close shopping cart"
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Free Shipping Bar */}
            <div className="px-6 py-4 bg-[#FAF9FC] border-b border-slate-200">
              <p className="text-xs text-slate-700 mb-2">
                {cartSummary.amountToFreeShipping > 0 ? (
                  <>
                    Buy{' '}
                    <span className="font-bold text-[#7B3CA1] tabular-nums">
                      {formatMoney(cartSummary.amountToFreeShipping, currency)}
                    </span>{' '}
                    more to get Free Shipping (threshold {formatMoney(settings.freeShippingThreshold, currency)})
                  </>
                ) : (
                  <span className="font-semibold text-emerald-700">
                    You unlocked Free Express Pharmacy Shipping!
                  </span>
                )}
              </p>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#7B3CA1] rounded-full transition-all duration-300"
                  style={{ width: `${cartSummary.freeShippingProgress}%` }}
                />
              </div>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-slate-100">
              {cart.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <p className="text-sm font-semibold text-[#082A66]">Your cart is currently empty.</p>
                  <Link
                    href="/shop"
                    onClick={() => setCartDrawerOpen(false)}
                    className="inline-block px-5 py-2 rounded-full bg-[#7B3CA1] text-white text-xs font-semibold"
                  >
                    Browse Medicines
                  </Link>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="py-4 flex items-center gap-3.5">
                    <Link
                      href={`/product/${item.slug}`}
                      onClick={() => setCartDrawerOpen(false)}
                      className="w-16 h-16 bg-[#F8F9FC] rounded-lg p-1.5 flex items-center justify-center shrink-0"
                    >
                      <img src={item.image} alt={item.name} className="max-h-14 object-contain mix-blend-multiply" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/product/${item.slug}`}
                          onClick={() => setCartDrawerOpen(false)}
                          className="text-xs font-bold text-[#082A66] hover:text-[#7B3CA1] line-clamp-1"
                        >
                          {item.name}
                        </Link>
                        <span className="text-xs font-bold text-[#082A66] whitespace-nowrap tabular-nums">
                          {item.quantity} × {formatMoney(item.price, currency)}
                        </span>
                      </div>
                      {item.variantLabel && (
                        <p className="text-[11px] text-slate-500 mt-0.5">{item.variantLabel}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <div className="inline-flex items-center border border-slate-200 rounded-full h-7 px-1.5">
                          <button
                            type="button"
                            aria-label={`Decrease quantity of ${item.name}`}
                            onClick={() => updateCartQty(item.id, item.quantity - 1)}
                            className="w-5 h-5 flex items-center justify-center text-slate-600 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-semibold tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label={`Increase quantity of ${item.name}`}
                            onClick={() => updateCartQty(item.id, item.quantity + 1)}
                            className="w-5 h-5 flex items-center justify-center text-slate-600 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="text-[11px] text-red-600 underline hover:text-red-700 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Utility Tabs & Totals */}
            <div className="border-t border-slate-200 p-6 bg-white space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCartTab(cartTab === 'note' ? null : 'note')}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                    cartTab === 'note'
                      ? 'bg-[#7B3CA1] border-[#7B3CA1] text-white'
                      : 'border-slate-200 text-slate-700 hover:border-[#7B3CA1]'
                  }`}
                >
                  <StickyNote className="w-3.5 h-3.5" />
                  Note
                </button>
                <button
                  type="button"
                  onClick={() => setCartTab(cartTab === 'shipping' ? null : 'shipping')}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                    cartTab === 'shipping'
                      ? 'bg-[#7B3CA1] border-[#7B3CA1] text-white'
                      : 'border-slate-200 text-slate-700 hover:border-[#7B3CA1]'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  Shipping
                </button>
                <button
                  type="button"
                  onClick={() => setCartTab(cartTab === 'coupon' ? null : 'coupon')}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                    cartTab === 'coupon'
                      ? 'bg-[#7B3CA1] border-[#7B3CA1] text-white'
                      : 'border-slate-200 text-slate-700 hover:border-[#7B3CA1]'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  Coupon
                </button>
              </div>

              {cartTab === 'note' && (
                <textarea
                  rows={2}
                  value={cartNotes}
                  onChange={(e) => setCartNotes(e.target.value)}
                  placeholder="Add delivery or pharmacist instructions..."
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#7B3CA1]"
                />
              )}
              {cartTab === 'shipping' && (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={zipEstimate}
                    onChange={(e) => setZipEstimate(e.target.value)}
                    placeholder="City or Postal Code"
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs"
                  />
                  <span className="text-xs font-semibold text-emerald-700">
                    {cartSummary.shippingCost === 0
                      ? 'Free Delivery'
                      : formatMoney(cartSummary.shippingCost, currency)}
                  </span>
                </div>
              )}
              {cartTab === 'coupon' && (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={drawerCouponInput}
                    onChange={(e) => setDrawerCouponInput(e.target.value)}
                    placeholder="Try FIRST10 or SAVE15"
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const res = applyCoupon(drawerCouponInput);
                      showToast(res.message);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#7B3CA1] text-white text-xs font-semibold cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-bold text-[#082A66]">
                  Subtotal {couponCode ? `(${couponCode})` : ''}
                </span>
                <span className="text-lg font-bold text-[#082A66] tabular-nums">
                  {formatMoney(cartSummary.total, currency)}
                </span>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="rounded accent-[#082A66]"
                />
                <span>
                  I agree with{' '}
                  <Link
                    href="/privacy-policy"
                    onClick={() => setCartDrawerOpen(false)}
                    className="text-[#082A66] underline font-medium"
                  >
                    Terms &amp; Conditions
                  </Link>
                </span>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/cart"
                  onClick={() => setCartDrawerOpen(false)}
                  className="text-center py-2.5 rounded-full border border-slate-200 hover:border-[#7B3CA1] text-xs font-semibold text-[#082A66] transition-colors"
                >
                  View Cart
                </Link>
                <button
                  type="button"
                  disabled={!agreedTerms || cart.length === 0}
                  onClick={() => {
                    setCartDrawerOpen(false);
                    router.push('/checkout');
                  }}
                  className="py-2.5 rounded-full bg-[#7B3CA1] hover:bg-[#662F87] disabled:opacity-50 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Check Out
                </button>
              </div>
              {shopifyCheckoutUrl && cart.length > 0 && (
                <a
                  href={shopifyCheckoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center text-[11px] font-semibold text-[#7B3CA1] hover:underline"
                >
                  Express Pay on Hosted Shopify Checkout ↗
                </a>
              )}
              <button
                type="button"
                onClick={() => setCartDrawerOpen(false)}
                className="w-full text-center text-xs font-semibold text-[#082A66] hover:text-[#7B3CA1] cursor-pointer"
              >
                Or Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Subscription Order History Modal (Screen 20) */}
      {historyModalSub && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="sub-history-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h2 id="sub-history-title" className="text-lg font-bold text-[#082A66]">
                Subscription Order History
              </h2>
              <button
                type="button"
                onClick={() => setHistoryModalSub(null)}
                aria-label="Close subscription history"
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">{historyModalSub.productName}</p>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[#082A66]">
                  <th className="py-2 font-bold">Order ID</th>
                  <th className="py-2 font-bold">Date</th>
                  <th className="py-2 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyModalSub.history.map((h) => (
                  <tr key={h.orderNumber}>
                    <td className="py-3 font-semibold text-[#082A66]">
                      <Link
                        href="/account?tab=orders"
                        onClick={() => setHistoryModalSub(null)}
                        className="hover:underline"
                      >
                        {h.orderNumber}
                      </Link>{' '}
                      <span className="font-normal text-slate-500">({h.label})</span>
                    </td>
                    <td className="py-3 text-slate-600">{h.date}</td>
                    <td className="py-3">
                      <span className="inline-block bg-emerald-100 text-emerald-700 font-bold text-[10px] uppercase px-2 py-0.5 rounded">
                        {h.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. Prescription File Preview Modal (Screen 18 View File) */}
      {rxPreviewFile && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Prescription Document Preview"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#7B3CA1]" />
                <h2 className="text-base font-bold text-[#082A66]">Prescription Document</h2>
              </div>
              <button
                type="button"
                onClick={() => setRxPreviewFile(null)}
                aria-label="Close document preview"
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-[#F8F9FC] border border-slate-200 rounded-xl p-5 text-center space-y-3">
              {rxPreviewFile.previewDataUrl ? (
                <img
                  src={rxPreviewFile.previewDataUrl}
                  alt={rxPreviewFile.name}
                  className="max-h-72 mx-auto rounded-lg border border-slate-200"
                />
              ) : (
                <div className="py-10">
                  <FileText className="w-12 h-12 mx-auto text-[#7B3CA1] mb-2" />
                  <p className="text-sm font-bold text-[#082A66]">{rxPreviewFile.name}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Verified PDF Document · {(rxPreviewFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              )}
              <p className="text-xs text-slate-500">
                Uploaded {rxPreviewFile.uploadedAt} · Encrypted HIPAA-Compliant Storage
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 8. Global Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 right-6 z-50 max-w-[calc(100vw-3rem)] sm:max-w-sm flex items-center gap-2.5 bg-[#082A66] text-white text-xs font-medium px-4 py-3 rounded-xl shadow-xl border border-white/10"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
}
