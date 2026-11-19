'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  INITIAL_ORDERS,
  INITIAL_RX_REQUESTS,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_USER,
  PRODUCTS,
} from '@/lib/data';
import {
  calculateCartSummary,
  mergeCartLine,
  transitionSubscription,
  validateCouponCode,
} from '@/lib/store-logic';
import type {
  CartItem,
  CurrencyCode,
  MedicineSubscription,
  Order,
  PrescriptionFileMeta,
  PrescriptionRequest,
  Product,
  UserProfile,
} from '@/lib/types';

export type AuthModalMode = 'signin' | 'register' | null;

interface StoreContextValue {
  // Persisted User & Auth
  user: UserProfile | null;
  login: (emailOrUser: string, password: string, redirectBack?: boolean) => void;
  register: (emailOrUser: string, password: string) => void;
  logout: () => void;
  updateUserProfile: (patch: Partial<UserProfile>) => void;

  // Currency & Language
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  language: 'English' | 'Spanish' | 'French';
  setLanguage: (l: 'English' | 'Spanish' | 'French') => void;

  // Cart & Coupon
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'id'>, openDrawer?: boolean) => void;
  updateCartQty: (lineId: string, quantity: number) => void;
  removeFromCart: (lineId: string) => void;
  clearCart: () => void;
  couponCode: string | null;
  applyCoupon: (code: string) => { valid: boolean; message: string };
  removeCoupon: () => void;
  cartNotes: string;
  setCartNotes: (notes: string) => void;
  cartSummary: ReturnType<typeof calculateCartSummary>;

  // Wishlist, Compare & Recently Viewed
  wishlistIds: string[];
  toggleWishlist: (productId: string) => void;
  compareIds: string[];
  toggleCompare: (productId: string) => void;
  recentlyViewedIds: string[];
  markViewed: (productId: string) => void;

  // Orders, Rx Requests & Subscriptions
  orders: Order[];
  placeOrder: (payload: {
    billingName: string;
    billingEmail: string;
    billingPhone: string;
    shippingAddress: string;
    paymentMethod: string;
    orderNotes?: string;
    prescriptionFile?: PrescriptionFileMeta;
  }) => Order;
  payOrder: (orderId: string) => void;
  cancelOrder: (orderId: string) => void;

  rxRequests: PrescriptionRequest[];
  submitRxRequest: (payload: {
    fullName: string;
    phone: string;
    file: PrescriptionFileMeta;
  }) => PrescriptionRequest;

  subscriptions: MedicineSubscription[];
  updateSubscription: (
    subId: string,
    action: 'pause' | 'resume' | 'cancel' | { type: 'interval'; days: 30 | 60 | 90 }
  ) => void;

  // Overlays & Modals
  authModal: AuthModalMode;
  openAuthModal: (mode: 'signin' | 'register', returnTo?: string) => void;
  closeAuthModal: () => void;
  postAuthRedirect: string | null;
  clearPostAuthRedirect: () => void;

  quickViewProduct: Product | null;
  openQuickView: (product: Product) => void;
  closeQuickView: () => void;

  cartDrawerOpen: boolean;
  setCartDrawerOpen: (open: boolean) => void;

  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;

  newsletterOpen: boolean;
  setNewsletterOpen: (open: boolean) => void;

  historyModalSub: MedicineSubscription | null;
  setHistoryModalSub: (sub: MedicineSubscription | null) => void;

  rxPreviewFile: PrescriptionFileMeta | null;
  setRxPreviewFile: (file: PrescriptionFileMeta | null) => void;

  // Toast feedback
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

const STORAGE_KEY = 'xmedcar_store_v1';

const DEFAULT_CART: CartItem[] = [
  {
    id: 'incite-vitamin-d3__400 Tablets (Full Supply)__one-time',
    productId: 'incite-vitamin-d3',
    slug: 'incite-nutrition-vitamin-d-5000-iu',
    name: 'Incite Nutrition Vitamin D 5000 IU',
    image: '/images/products/incite-vitamin-d3.png',
    price: 39.99,
    quantity: 1,
    isRx: false,
    variantLabel: '400 Tablets (Full Supply)',
    purchaseMode: 'one-time',
  },
  {
    id: 'gaia-relax-gummies__60ct__subscription',
    productId: 'gaia-relax-gummies',
    slug: 'gaia-herbs-relax-gummies',
    name: 'Helps maintain emotional well-being Relax Gummies',
    image: '/images/products/gaia-relax-gummies.png',
    price: 44.99,
    quantity: 1,
    isRx: true,
    variantLabel: '60 Days Supply (10% Off)',
    purchaseMode: 'subscription',
    subscriptionIntervalDays: 60,
  },
  {
    id: 'gaia-turmeric-supreme__60caps__one-time',
    productId: 'gaia-turmeric-supreme',
    slug: 'gaia-herbs-turmeric-supreme-extra-strength',
    name: 'Turmeric Supreme Extra Strength',
    image: '/images/products/gaia-turmeric-supreme.png',
    price: 24.99,
    quantity: 1,
    isRx: true,
    purchaseMode: 'one-time',
  },
];

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [language, setLanguage] = useState<'English' | 'Spanish' | 'French'>('English');
  const [cart, setCart] = useState<CartItem[]>(DEFAULT_CART);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [cartNotes, setCartNotes] = useState('');
  const [wishlistIds, setWishlistIds] = useState<string[]>(['gaia-relax-gummies', 'incite-vitamin-d3']);
  const [compareIds, setCompareIds] = useState<string[]>(['gaia-relax-gummies', 'gaia-turmeric-supreme']);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([
    'gaia-relax-gummies',
    'gaia-turmeric-supreme',
    'incite-vitamin-d3',
    'stone-breaker',
  ]);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [rxRequests, setRxRequests] = useState<PrescriptionRequest[]>(INITIAL_RX_REQUESTS);
  const [subscriptions, setSubscriptions] = useState<MedicineSubscription[]>(INITIAL_SUBSCRIPTIONS);

  // Overlays
  const [authModal, setAuthModal] = useState<AuthModalMode>(null);
  const [postAuthRedirect, setPostAuthRedirect] = useState<string | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [newsletterOpen, setNewsletterOpen] = useState(false);
  const [historyModalSub, setHistoryModalSub] = useState<MedicineSubscription | null>(null);
  const [rxPreviewFile, setRxPreviewFile] = useState<PrescriptionFileMeta | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.user !== undefined) setUser(parsed.user);
          if (parsed.cart) setCart(parsed.cart);
          if (parsed.couponCode !== undefined) setCouponCode(parsed.couponCode);
          if (parsed.wishlistIds) setWishlistIds(parsed.wishlistIds);
          if (parsed.compareIds) setCompareIds(parsed.compareIds);
          if (parsed.recentlyViewedIds) setRecentlyViewedIds(parsed.recentlyViewedIds);
          if (parsed.orders) setOrders(parsed.orders);
          if (parsed.rxRequests) setRxRequests(parsed.rxRequests);
          if (parsed.subscriptions) setSubscriptions(parsed.subscriptions);
          if (parsed.currency) setCurrency(parsed.currency);
        }
      } catch {
        // Ignore storage parse error
      }
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          user,
          cart,
          couponCode,
          wishlistIds,
          compareIds,
          recentlyViewedIds,
          orders,
          rxRequests,
          subscriptions,
          currency,
        })
      );
    } catch {
      // Ignore quota exceeded
    }
  }, [
    hydrated,
    user,
    cart,
    couponCode,
    wishlistIds,
    compareIds,
    recentlyViewedIds,
    orders,
    rxRequests,
    subscriptions,
    currency,
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const t = window.setTimeout(() => setToastMessage(null), 3200);
    return () => window.clearTimeout(t);
  }, [toastMessage]);

  const cartSummary = useMemo(
    () => calculateCartSummary(cart, couponCode),
    [cart, couponCode]
  );

  const login = (emailOrUser: string) => {
    const clean = emailOrUser.trim();
    const displayName = clean.includes('@') ? clean.split('@')[0] : clean || INITIAL_USER.name;
    setUser({
      ...INITIAL_USER,
      name: displayName,
      email: clean.includes('@') ? clean : INITIAL_USER.email,
    });
    setAuthModal(null);
    showToast(`Welcome back, ${displayName}!`);
  };

  const register = (emailOrUser: string) => {
    const clean = emailOrUser.trim();
    const displayName = clean.includes('@') ? clean.split('@')[0] : clean || 'New Member';
    setUser({
      ...INITIAL_USER,
      name: displayName,
      email: clean.includes('@') ? clean : `${displayName.toLowerCase()}@xmedcar.com`,
    });
    setAuthModal(null);
    showToast(`Account created for ${displayName}!`);
  };

  const logout = () => {
    setUser(null);
    showToast('You have been logged out.');
  };

  const updateUserProfile = (patch: Partial<UserProfile>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
    showToast('Account profile updated.');
  };

  const addToCart = (item: Omit<CartItem, 'id'>, openDrawer = true) => {
    setCart((prev) => mergeCartLine(prev, item));
    if (openDrawer) {
      setCartDrawerOpen(true);
    } else {
      showToast(`Added "${item.name}" to cart.`);
    }
  };

  const updateCartQty = (lineId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(lineId);
      return;
    }
    setCart((prev) => prev.map((c) => (c.id === lineId ? { ...c, quantity } : c)));
  };

  const removeFromCart = (lineId: string) => {
    setCart((prev) => prev.filter((c) => c.id !== lineId));
  };

  const clearCart = () => {
    setCart([]);
    setCouponCode(null);
  };

  const applyCoupon = (code: string) => {
    const res = validateCouponCode(code);
    if (res.valid && res.normalizedCode) {
      setCouponCode(res.normalizedCode);
    }
    return { valid: res.valid, message: res.message };
  };

  const removeCoupon = () => setCouponCode(null);

  const toggleWishlist = (productId: string) => {
    setWishlistIds((prev) => {
      const exists = prev.includes(productId);
      const next = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      showToast(exists ? 'Removed from Wishlist' : 'Saved to Wishlist');
      return next;
    });
  };

  const toggleCompare = (productId: string) => {
    setCompareIds((prev) => {
      const exists = prev.includes(productId);
      const next = exists ? prev.filter((id) => id !== productId) : [...prev.slice(-3), productId];
      showToast(exists ? 'Removed from Compare' : 'Added to Compare');
      return next;
    });
  };

  const markViewed = (productId: string) => {
    setRecentlyViewedIds((prev) => [productId, ...prev.filter((id) => id !== productId)].slice(0, 8));
  };

  const placeOrder: StoreContextValue['placeOrder'] = (payload) => {
    const nextNum = 437 + orders.length;
    const orderNumber = `#${nextNum}`;
    const todayStr = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const newOrder: Order = {
      id: `ord-${nextNum}`,
      number: orderNumber,
      date: todayStr,
      status: 'Processing',
      subtotal: cartSummary.subtotal,
      discount: cartSummary.discountAmount,
      shipping: cartSummary.shippingCost,
      total: cartSummary.total,
      paymentMethod: payload.paymentMethod,
      billingName: payload.billingName,
      billingEmail: payload.billingEmail,
      billingPhone: payload.billingPhone,
      shippingAddress: payload.shippingAddress,
      prescriptionFile: payload.prescriptionFile,
      orderNotes: payload.orderNotes,
      items: cart.map((c) => ({
        productId: c.productId,
        name: c.name,
        quantity: c.quantity,
        price: c.price,
        image: c.image,
        isRx: c.isRx,
        variantLabel: c.variantLabel,
        purchaseMode: c.purchaseMode,
      })),
    };

    setOrders((prev) => [newOrder, ...prev]);

    // If any cart items are subscriptions, add them to Medicine Subscriptions
    const subItems = cart.filter((c) => c.purchaseMode === 'subscription');
    if (subItems.length > 0) {
      const renewalDate = new Date(Date.now() + 30 * 86400_000).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      const newSubs: MedicineSubscription[] = subItems.map((c, idx) => ({
        id: `sub-${Date.now()}-${idx}`,
        productId: c.productId,
        productName: c.name,
        image: c.image,
        intervalDays: c.subscriptionIntervalDays ?? 30,
        quantity: c.quantity,
        pricePerCycle: c.price,
        nextRenewal: renewalDate,
        status: 'ACTIVE',
        history: [
          {
            orderNumber,
            label: 'Initial',
            date: todayStr,
            status: 'Processing',
          },
        ],
      }));
      setSubscriptions((prev) => [...newSubs, ...prev]);
    }

    clearCart();
    return newOrder;
  };

  const payOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'Processing' } : o))
    );
    showToast('Payment completed! Order is now processing.');
  };

  const cancelOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'Cancelled' } : o))
    );
    showToast('Order cancelled.');
  };

  const submitRxRequest: StoreContextValue['submitRxRequest'] = (payload) => {
    const nextNum = 418 + rxRequests.length;
    const requestNumber = `#${nextNum}`;
    const todayStr = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    const newReq: PrescriptionRequest = {
      id: `rx-${nextNum}`,
      requestNumber,
      date: todayStr,
      fullName: payload.fullName,
      phone: payload.phone,
      status: 'Pending',
      file: payload.file,
    };
    setRxRequests((prev) => [newReq, ...prev]);
    showToast(`Prescription request ${requestNumber} submitted for pharmacist review.`);
    return newReq;
  };

  const updateSubscription: StoreContextValue['updateSubscription'] = (subId, action) => {
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === subId ? transitionSubscription(s, action) : s))
    );
    if (action === 'pause') showToast('Subscription paused.');
    else if (action === 'resume') showToast('Subscription resumed.');
    else if (action === 'cancel') showToast('Subscription cancelled.');
    else showToast('Delivery interval updated.');
  };

  const openAuthModal = (mode: 'signin' | 'register', returnTo?: string) => {
    setAuthModal(mode);
    if (returnTo) setPostAuthRedirect(returnTo);
  };

  const closeAuthModal = () => setAuthModal(null);
  const clearPostAuthRedirect = () => setPostAuthRedirect(null);

  const openQuickView = (product: Product) => {
    markViewed(product.id);
    setQuickViewProduct(product);
  };

  const closeQuickView = () => setQuickViewProduct(null);

  const value: StoreContextValue = {
    user,
    login,
    register,
    logout,
    updateUserProfile,
    currency,
    setCurrency,
    language,
    setLanguage,
    cart,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    couponCode,
    applyCoupon,
    removeCoupon,
    cartNotes,
    setCartNotes,
    cartSummary,
    wishlistIds,
    toggleWishlist,
    compareIds,
    toggleCompare,
    recentlyViewedIds,
    markViewed,
    orders,
    placeOrder,
    payOrder,
    cancelOrder,
    rxRequests,
    submitRxRequest,
    subscriptions,
    updateSubscription,
    authModal,
    openAuthModal,
    closeAuthModal,
    postAuthRedirect,
    clearPostAuthRedirect,
    quickViewProduct,
    openQuickView,
    closeQuickView,
    cartDrawerOpen,
    setCartDrawerOpen,
    searchOpen,
    setSearchOpen,
    newsletterOpen,
    setNewsletterOpen,
    historyModalSub,
    setHistoryModalSub,
    rxPreviewFile,
    setRxPreviewFile,
    toastMessage,
    showToast,
  };

  // Expose helper to ensure initial products are referenced cleanly
  void PRODUCTS;

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
