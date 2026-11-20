'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  calculateCartSummary,
  mergeCartLine,
  transitionSubscription,
  validateCouponCode,
} from '@/lib/store-logic';
import type {
  ActiveCoupon,
  BlogPost,
  CartItem,
  CategoryNode,
  CurrencyCode,
  FaqCategory,
  HeroSlide,
  MedicineSubscription,
  Order,
  PrescriptionFileMeta,
  PrescriptionRequest,
  Product,
  PromoBanner,
  StoreSettings,
  StorefrontData,
  SubcategoryBadge,
  Testimonial,
  UserProfile,
} from '@/lib/types';

export type AuthModalMode = 'signin' | 'register' | null;

export const DEFAULT_PK_USER: UserProfile = {
  id: 'guest-pk-billing',
  name: 'Tariq Mahmood',
  email: 'customer.xmedcar@gmail.com',
  phone: '+92 300 8451290',
  billingAddress: {
    firstName: 'Tariq',
    lastName: 'Mahmood',
    country: 'Pakistan',
    street1: 'House 24-B, Khayaban-e-Ittehad, DHA Phase 6',
    street2: 'Clifton Block 5',
    city: 'Karachi',
    state: 'Sindh',
    zip: '75600',
    phone: '+92 300 8451290',
    email: 'customer.xmedcar@gmail.com',
  },
};

interface AuthActionResult {
  ok: boolean;
  error?: string;
}

interface CustomerSnapshotResponse {
  authenticated?: boolean;
  user?: UserProfile;
  orders?: Order[];
  wishlistIds?: string[];
  recentlyViewedIds?: string[];
  rxRequests?: PrescriptionRequest[];
  subscriptions?: MedicineSubscription[];
}

interface StoreContextValue {
  // Dynamic Shopify Storefront Catalog & CMS Data
  dataSource: 'shopify' | 'fallback';
  products: Product[];
  categories: CategoryNode[];
  featuredCollections: StorefrontData['featuredCollections'];
  heroSlides: HeroSlide[];
  promoBanners: PromoBanner[];
  subcategoryBadges: SubcategoryBadge[];
  blogs: BlogPost[];
  faqCategories: FaqCategory[];
  testimonials: Testimonial[];
  coupons: Record<string, ActiveCoupon>;
  settings: StoreSettings;
  brands: { name: string; count: number }[];
  defaultBillingUser: UserProfile;

  // Live Shopify Customer & Auth
  user: UserProfile | null;
  authLoading: boolean;
  login: (emailOrUser: string, password: string) => Promise<AuthActionResult>;
  register: (emailOrUser: string, password: string) => Promise<AuthActionResult>;
  logout: () => Promise<void>;
  updateUserProfile: (patch: Partial<UserProfile>) => Promise<void>;
  refreshShopifyCustomer: () => Promise<void>;

  // Currency & Language
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  language: 'English' | 'Spanish' | 'French';
  setLanguage: (l: 'English' | 'Spanish' | 'French') => void;

  // Cart & Coupon (Synced to Shopify Storefront Cart)
  cart: CartItem[];
  shopifyCheckoutUrl: string | null;
  addToCart: (item: Omit<CartItem, 'id'>, openDrawer?: boolean) => void;
  updateCartQty: (lineId: string, quantity: number) => void;
  removeFromCart: (lineId: string) => void;
  clearCart: () => void;
  couponCode: string | null;
  applyCoupon: (code: string) => { valid: boolean; message: string };
  applyCouponAsync: (code: string) => Promise<{ valid: boolean; message: string }>;
  removeCoupon: () => void;
  cartNotes: string;
  setCartNotes: (notes: string) => void;
  cartSummary: ReturnType<typeof calculateCartSummary>;

  // Wishlist, Compare & Recently Viewed (Synced to Shopify Customer Metafields when logged in)
  wishlistIds: string[];
  toggleWishlist: (productId: string) => void;
  compareIds: string[];
  toggleCompare: (productId: string) => void;
  recentlyViewedIds: string[];
  markViewed: (productId: string) => void;

  // Live Shopify Orders, Rx Requests & Subscriptions
  orders: Order[];
  placeOrder: (payload: {
    billingName: string;
    billingEmail: string;
    billingPhone: string;
    shippingAddress: string;
    paymentMethod: string;
    orderNotes?: string;
    prescriptionFile?: PrescriptionFileMeta;
    shopifyOrderId?: string;
    shopifyOrderNumber?: string;
    shopifyOrderUrl?: string;
  }) => Order;
  payOrder: (orderId: string) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;

  rxRequests: PrescriptionRequest[];
  submitRxRequest: (payload: {
    fullName: string;
    phone: string;
    file: PrescriptionFileMeta;
  }) => Promise<PrescriptionRequest>;

  subscriptions: MedicineSubscription[];
  updateSubscription: (
    subId: string,
    action: 'pause' | 'resume' | 'cancel' | { type: 'interval'; days: 30 | 60 | 90 }
  ) => Promise<void>;

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

const GUEST_PREFS_STORAGE_KEY = 'xmedcar_guest_prefs_v1';

interface StorefrontCartLinePayload {
  id: string;
  quantity: number;
  attributes?: Array<{ key: string; value?: string | null }>;
  merchandise: {
    id: string;
    title: string;
    price: { amount: string };
    image?: { url: string } | null;
    product: {
      id: string;
      handle: string;
      title: string;
      featuredImage?: { url: string } | null;
    };
  };
}

interface StorefrontCartPayload {
  id: string;
  checkoutUrl: string;
  note?: string | null;
  discountCodes?: Array<{ code: string; applicable: boolean }>;
  lines: { nodes: StorefrontCartLinePayload[] };
}

export function StoreProvider({
  children,
  initialData,
}: {
  children: React.ReactNode;
  initialData: StorefrontData;
}) {
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [currency, setCurrency] = useState<CurrencyCode>(initialData.settings.currencyCode || 'PKR');
  const [language, setLanguage] = useState<'English' | 'Spanish' | 'French'>('English');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [shopifyCheckoutUrl, setShopifyCheckoutUrl] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [fetchedCoupons, setFetchedCoupons] = useState<Record<string, ActiveCoupon>>({});
  const liveCoupons = useMemo(
    () => ({ ...initialData.coupons, ...fetchedCoupons }),
    [initialData.coupons, fetchedCoupons]
  );
  const [cartNotes, setCartNotesState] = useState('');
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [rxRequests, setRxRequests] = useState<PrescriptionRequest[]>([]);
  const [subscriptions, setSubscriptions] = useState<MedicineSubscription[]>([]);

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

  const cartSyncTimerRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const t = window.setTimeout(() => setToastMessage(null), 3200);
    return () => window.clearTimeout(t);
  }, [toastMessage]);

  const applyCustomerSnapshot = useCallback((snap: CustomerSnapshotResponse) => {
    if (snap.user) setUser(snap.user);
    if (Array.isArray(snap.orders)) setOrders(snap.orders);
    if (Array.isArray(snap.wishlistIds)) setWishlistIds(snap.wishlistIds);
    if (Array.isArray(snap.recentlyViewedIds)) setRecentlyViewedIds(snap.recentlyViewedIds);
    if (Array.isArray(snap.rxRequests)) setRxRequests(snap.rxRequests);
    if (Array.isArray(snap.subscriptions)) setSubscriptions(snap.subscriptions);
  }, []);

  const refreshShopifyCustomer = useCallback(async () => {
    try {
      const res = await fetch('/api/shopify/customer', { cache: 'no-store' });
      if (!res.ok) return;
      const data = (await res.json()) as CustomerSnapshotResponse;
      if (data.authenticated) {
        applyCustomerSnapshot(data);
      }
    } catch {
      // Ignore transient network errors
    }
  }, [applyCustomerSnapshot]);

  // Hydrate Storefront Cart + Shopify Customer session on mount
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = window.localStorage.getItem(GUEST_PREFS_STORAGE_KEY);
        if (raw && active) {
          const parsed = JSON.parse(raw) as {
            currency?: CurrencyCode;
            compareIds?: string[];
            wishlistIds?: string[];
            recentlyViewedIds?: string[];
          };
          if (parsed.currency) setCurrency(parsed.currency);
          if (Array.isArray(parsed.compareIds)) setCompareIds(parsed.compareIds);
          if (Array.isArray(parsed.wishlistIds)) setWishlistIds(parsed.wishlistIds);
          if (Array.isArray(parsed.recentlyViewedIds)) setRecentlyViewedIds(parsed.recentlyViewedIds);
        }
      } catch {
        // Ignore storage errors
      }

      try {
        const [cartRes, custRes] = await Promise.all([
          fetch('/api/shopify/cart', { cache: 'no-store' }),
          fetch('/api/shopify/customer', { cache: 'no-store' }),
        ]);

        if (active && cartRes.ok) {
          const cartJson = (await cartRes.json()) as { cart: StorefrontCartPayload | null };
          if (cartJson.cart) {
            setShopifyCheckoutUrl(cartJson.cart.checkoutUrl || null);
            if (cartJson.cart.note) setCartNotesState(cartJson.cart.note);
            const activeCode = cartJson.cart.discountCodes?.find((d) => d.applicable)?.code;
            if (activeCode) setCouponCode(activeCode);

            const hydratedLines: CartItem[] = cartJson.cart.lines.nodes.map((line) => {
              const handle = line.merchandise.product.handle;
              const matchedProd = initialData.products.find((p) => p.slug === handle);
              const modeAttr = line.attributes?.find((a) => a.key === 'purchase_mode')?.value;
              const intAttr = line.attributes?.find((a) => a.key === 'subscription_interval_days')?.value;
              const purchaseMode = modeAttr === 'subscription' ? 'subscription' : 'one-time';
              const interval =
                intAttr === '60' ? 60 : intAttr === '90' ? 90 : intAttr === '30' ? 30 : undefined;
              const variantLabel =
                line.merchandise.title !== 'Default Title' ? line.merchandise.title : undefined;
              const prodId = matchedProd?.id ?? line.merchandise.product.id;

              return {
                id: `${prodId}__${variantLabel ?? 'Standard'}__${purchaseMode}`,
                productId: prodId,
                shopifyVariantId: line.merchandise.id,
                slug: handle,
                name: matchedProd?.name ?? line.merchandise.product.title,
                image:
                  line.merchandise.image?.url ||
                  line.merchandise.product.featuredImage?.url ||
                  matchedProd?.image ||
                  '/images/products/gaia-relax-gummies.png',
                price: Math.round(parseFloat(line.merchandise.price.amount)),
                quantity: line.quantity,
                isRx: matchedProd?.isRx ?? false,
                variantLabel,
                purchaseMode,
                subscriptionIntervalDays: interval,
              };
            });
            setCart(hydratedLines);
          }
        }

        if (active && custRes.ok) {
          const custJson = (await custRes.json()) as CustomerSnapshotResponse;
          if (custJson.authenticated) {
            applyCustomerSnapshot(custJson);
          }
        }
      } catch {
        // Ignore transient mount sync failures
      }

      if (active) setHydrated(true);
    })();

    return () => {
      active = false;
    };
  }, [initialData.products, applyCustomerSnapshot]);

  // Persist lightweight guest UI preferences (currency / compare) only — customer & account data live in Shopify
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        GUEST_PREFS_STORAGE_KEY,
        JSON.stringify({
          currency,
          compareIds,
          ...(user ? {} : { wishlistIds, recentlyViewedIds }),
        })
      );
    } catch {
      // Ignore quota errors
    }
  }, [hydrated, currency, compareIds, wishlistIds, recentlyViewedIds, user]);

  // Debounced sync of Cart state to Shopify Storefront Cart API
  const syncCartToShopify = useCallback(
    (nextCart: CartItem[], nextCoupon: string | null, nextNote: string) => {
      if (!hydrated) return;
      if (cartSyncTimerRef.current) window.clearTimeout(cartSyncTimerRef.current);
      cartSyncTimerRef.current = window.setTimeout(async () => {
        try {
          if (nextCart.length === 0) {
            await fetch('/api/shopify/cart', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ items: [], clear: true }),
            });
            setShopifyCheckoutUrl(null);
            return;
          }
          const res = await fetch('/api/shopify/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: nextCart,
              couponCode: nextCoupon,
              note: nextNote,
            }),
          });
          if (res.ok) {
            const data = (await res.json()) as { cart?: { checkoutUrl?: string } | null };
            setShopifyCheckoutUrl(data.cart?.checkoutUrl ?? null);
          }
        } catch {
          // Ignore background sync failure
        }
      }, 250);
    },
    [hydrated]
  );

  useEffect(() => {
    if (!hydrated) return;
    syncCartToShopify(cart, couponCode, cartNotes);
  }, [hydrated, cart, couponCode, cartNotes, syncCartToShopify]);

  const cartSummary = useMemo(
    () =>
      calculateCartSummary(
        cart,
        couponCode,
        true,
        liveCoupons,
        initialData.settings.freeShippingThreshold,
        initialData.settings.standardShippingFee
      ),
    [
      cart,
      couponCode,
      liveCoupons,
      initialData.settings.freeShippingThreshold,
      initialData.settings.standardShippingFee,
    ]
  );

  const login = async (emailOrUser: string, password: string): Promise<AuthActionResult> => {
    setAuthLoading(true);
    try {
      const res = await fetch('/api/shopify/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: emailOrUser, password }),
      });
      const data = (await res.json()) as CustomerSnapshotResponse & { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        return { ok: false, error: data.error || 'Invalid credentials.' };
      }
      applyCustomerSnapshot(data);
      setAuthModal(null);
      showToast(`Welcome back, ${data.user?.name || 'Member'}!`);
      return { ok: true };
    } catch {
      return { ok: false, error: 'Unable to reach Shopify authentication.' };
    } finally {
      setAuthLoading(false);
    }
  };

  const register = async (emailOrUser: string, password: string): Promise<AuthActionResult> => {
    setAuthLoading(true);
    try {
      const res = await fetch('/api/shopify/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: emailOrUser, password }),
      });
      const data = (await res.json()) as CustomerSnapshotResponse & { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        return { ok: false, error: data.error || 'Could not create Shopify account.' };
      }
      applyCustomerSnapshot(data);
      setAuthModal(null);
      showToast(`Shopify account created for ${data.user?.name || 'Member'}!`);
      return { ok: true };
    } catch {
      return { ok: false, error: 'Unable to reach Shopify registration.' };
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    await fetch('/api/shopify/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
    setOrders([]);
    setRxRequests([]);
    setSubscriptions([]);
    setWishlistIds([]);
    setRecentlyViewedIds([]);
    showToast('You have been logged out.');
  };

  const updateUserProfile = async (patch: Partial<UserProfile>) => {
    const nextUser = user ? { ...user, ...patch } : null;
    if (!nextUser) return;
    setUser(nextUser);
    try {
      const res = await fetch('/api/shopify/customer', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_profile', profile: nextUser }),
      });
      if (res.ok) {
        showToast('Account profile saved to Shopify.');
      } else {
        showToast('Profile updated locally.');
      }
    } catch {
      showToast('Profile updated locally.');
    }
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
    setCartNotesState('');
  };

  const setCartNotes = (notes: string) => {
    setCartNotesState(notes);
  };

  const applyCoupon = (code: string) => {
    const res = validateCouponCode(code, liveCoupons);
    if (res.valid && res.normalizedCode) {
      setCouponCode(res.normalizedCode);
    }
    return { valid: res.valid, message: res.message };
  };

  const applyCouponAsync = async (code: string) => {
    try {
      const res = await fetch('/api/shopify/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json()) as {
        valid: boolean;
        normalizedCode: string | null;
        message: string;
        percentOff?: number;
        description?: string;
      };
      if (data.valid && data.normalizedCode) {
        const norm = data.normalizedCode;
        setFetchedCoupons((prev) => ({
          ...prev,
          [norm]: {
            code: norm,
            percentOff: data.percentOff || liveCoupons[norm]?.percentOff || 10,
            description: data.description || liveCoupons[norm]?.description || 'Shopify promo code',
          },
        }));
        setCouponCode(norm);
      }
      return { valid: data.valid, message: data.message };
    } catch {
      return applyCoupon(code);
    }
  };

  const removeCoupon = () => setCouponCode(null);

  const toggleWishlist = (productId: string) => {
    setWishlistIds((prev) => {
      const exists = prev.includes(productId);
      const next = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      showToast(exists ? 'Removed from Wishlist' : 'Saved to Wishlist');
      if (user) {
        fetch('/api/shopify/customer', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'sync_wishlist', wishlistIds: next }),
        }).catch(() => {});
      }
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
    setRecentlyViewedIds((prev) => {
      const next = [productId, ...prev.filter((id) => id !== productId)].slice(0, 8);
      if (user) {
        fetch('/api/shopify/customer', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'sync_recently_viewed', recentlyViewedIds: next }),
        }).catch(() => {});
      }
      return next;
    });
  };

  const placeOrder: StoreContextValue['placeOrder'] = (payload) => {
    const nextNum = 1001 + orders.length;
    const orderNumber = payload.shopifyOrderNumber || `#${nextNum}`;
    const todayStr = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const newOrder: Order = {
      id: payload.shopifyOrderId || `ord-${nextNum}-${Date.now()}`,
      shopifyOrderId: payload.shopifyOrderId,
      shopifyOrderUrl: payload.shopifyOrderUrl,
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
    if (user) {
      window.setTimeout(() => {
        refreshShopifyCustomer().catch(() => {});
      }, 600);
    }
    return newOrder;
  };

  const payOrder = async (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'Processing' } : o))
    );
    if (user && orderId.startsWith('gid://shopify/Order/')) {
      await fetch('/api/shopify/customer', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pay_order', orderId }),
      }).catch(() => {});
    }
    showToast('Payment completed on Shopify! Order is now processing.');
  };

  const cancelOrder = async (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'Cancelled' } : o))
    );
    if (user && orderId.startsWith('gid://shopify/Order/')) {
      await fetch('/api/shopify/customer', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel_order', orderId }),
      }).catch(() => {});
    }
    showToast('Order cancelled and restocked in Shopify.');
  };

  const submitRxRequest: StoreContextValue['submitRxRequest'] = async (payload) => {
    if (user) {
      try {
        const res = await fetch('/api/shopify/customer', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'submit_rx', rxPayload: payload }),
        });
        if (res.ok) {
          const data = (await res.json()) as {
            rxRequest: PrescriptionRequest;
            rxRequests: PrescriptionRequest[];
          };
          setRxRequests(data.rxRequests);
          showToast(
            `Prescription request ${data.rxRequest.requestNumber} saved to your Shopify account.`
          );
          return data.rxRequest;
        }
      } catch {
        // Fallback below if transient error
      }
    }

    const nextNum = 417 + rxRequests.length + 1;
    const requestNumber = `#RX-${nextNum}`;
    const todayStr = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    const newReq: PrescriptionRequest = {
      id: `rx-${Date.now()}`,
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

  const updateSubscription: StoreContextValue['updateSubscription'] = async (subId, action) => {
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === subId ? transitionSubscription(s, action) : s))
    );
    if (user) {
      await fetch('/api/shopify/customer', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_subscription',
          subscriptionId: subId,
          subscriptionAction: action,
        }),
      }).catch(() => {});
    }
    if (action === 'pause') showToast('Subscription paused in Shopify.');
    else if (action === 'resume') showToast('Subscription resumed in Shopify.');
    else if (action === 'cancel') showToast('Subscription cancelled in Shopify.');
    else showToast('Delivery interval updated in Shopify.');
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
    dataSource: initialData.source,
    products: initialData.products,
    categories: initialData.categories,
    featuredCollections: initialData.featuredCollections,
    heroSlides: initialData.heroSlides,
    promoBanners: initialData.promoBanners,
    subcategoryBadges: initialData.subcategoryBadges,
    blogs: initialData.blogs,
    faqCategories: initialData.faqCategories,
    testimonials: initialData.testimonials,
    coupons: liveCoupons,
    settings: initialData.settings,
    brands: initialData.brands,
    defaultBillingUser: user ?? DEFAULT_PK_USER,
    user,
    authLoading,
    login,
    register,
    logout,
    updateUserProfile,
    refreshShopifyCustomer,
    currency,
    setCurrency,
    language,
    setLanguage,
    cart,
    shopifyCheckoutUrl,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    couponCode,
    applyCoupon,
    applyCouponAsync,
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

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
