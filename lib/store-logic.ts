import type {
  CartItem,
  CurrencyCode,
  FilterState,
  MedicineSubscription,
  PrescriptionFileMeta,
  Product,
} from './types';

export const FREE_SHIPPING_THRESHOLD = 200;
export const STANDARD_SHIPPING_FEE = 12.99;

export const CURRENCY_RATES: Record<CurrencyCode, { symbol: string; rate: number }> = {
  USD: { symbol: '$', rate: 1 },
  EUR: { symbol: '€', rate: 0.92 },
  GBP: { symbol: '£', rate: 0.79 },
};

export const COUPONS: Record<string, { code: string; percentOff: number; description: string }> = {
  FIRST10: { code: 'FIRST10', percentOff: 10, description: '10% off your first purchase' },
  SAVE15: { code: 'SAVE15', percentOff: 15, description: '15% off pharmacy wellness orders' },
};

export function formatMoney(amountUsd: number, currency: CurrencyCode = 'USD'): string {
  const { symbol, rate } = CURRENCY_RATES[currency];
  const converted = amountUsd * rate;
  return `${symbol}${converted.toFixed(2)}`;
}

export function getSubscriptionPrice(basePrice: number): number {
  return Number((basePrice * 0.85).toFixed(2));
}

export function calculateCartSummary(
  items: CartItem[],
  couponCode: string | null,
  freeShippingEnabled = true
): {
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  total: number;
  amountToFreeShipping: number;
  freeShippingProgress: number;
  itemCount: number;
  hasRxItems: boolean;
} {
  const subtotal = Number(
    items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)
  );
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const hasRxItems = items.some((item) => item.isRx);

  let discountAmount = 0;
  if (couponCode) {
    const coupon = COUPONS[couponCode.trim().toUpperCase()];
    if (coupon) {
      discountAmount = Number(((subtotal * coupon.percentOff) / 100).toFixed(2));
    }
  }

  const discountedSubtotal = Math.max(0, Number((subtotal - discountAmount).toFixed(2)));
  const amountToFreeShipping = Math.max(
    0,
    Number((FREE_SHIPPING_THRESHOLD - discountedSubtotal).toFixed(2))
  );
  const freeShippingProgress = Math.min(
    100,
    Math.round((discountedSubtotal / FREE_SHIPPING_THRESHOLD) * 100)
  );

  const shippingCost =
    items.length === 0
      ? 0
      : freeShippingEnabled && discountedSubtotal >= FREE_SHIPPING_THRESHOLD
        ? 0
        : 0; // Store displays Free shipping in summary for SF/US standard or calculates above threshold

  const total = Number((discountedSubtotal + shippingCost).toFixed(2));

  return {
    subtotal,
    discountAmount,
    shippingCost,
    total,
    amountToFreeShipping,
    freeShippingProgress,
    itemCount,
    hasRxItems,
  };
}

export function partitionCartItems(items: CartItem[]): {
  regularItems: CartItem[];
  prescriptionItems: CartItem[];
} {
  return {
    regularItems: items.filter((item) => !item.isRx),
    prescriptionItems: items.filter((item) => item.isRx),
  };
}

export function validateCouponCode(code: string): {
  valid: boolean;
  normalizedCode: string | null;
  message: string;
} {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return { valid: false, normalizedCode: null, message: 'Please enter a coupon code.' };
  }
  const match = COUPONS[normalized];
  if (!match) {
    return {
      valid: false,
      normalizedCode: null,
      message: `Coupon "${normalized}" is invalid. Try FIRST10 or SAVE15.`,
    };
  }
  return {
    valid: true,
    normalizedCode: match.code,
    message: `Applied ${match.code}: ${match.description}.`,
  };
}

const ALLOWED_RX_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/pdf',
]);
const ALLOWED_RX_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.pdf'];
export const MAX_RX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

export function validatePrescriptionFile(file: {
  name: string;
  size: number;
  type: string;
}): { valid: boolean; error?: string } {
  const lowerName = file.name.toLowerCase();
  const hasValidExt = ALLOWED_RX_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  const hasValidMime = file.type ? ALLOWED_RX_MIME_TYPES.has(file.type.toLowerCase()) : false;

  if (!hasValidExt && !hasValidMime) {
    return {
      valid: false,
      error: 'Unsupported file format. Allowed types: PNG, JPEG, PDF.',
    };
  }
  if (file.size <= 0) {
    return { valid: false, error: 'Selected file appears to be empty.' };
  }
  if (file.size > MAX_RX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'File exceeds the 2MB maximum size limit.',
    };
  }
  return { valid: true };
}

export function estimateDataUrlByteSize(dataUrl: string): number {
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx === -1) return 0;
  const base64 = dataUrl.slice(commaIdx + 1).replace(/\s+/g, '');
  if (!base64) return 0;
  let padding = 0;
  if (base64.endsWith('==')) padding = 2;
  else if (base64.endsWith('=')) padding = 1;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}

export function createCapturedRxFileMeta({
  dataUrl,
  mimeType = 'image/jpeg',
  capturedAt = new Date(),
}: {
  dataUrl: string;
  mimeType?: 'image/jpeg' | 'image/png';
  capturedAt?: Date;
}): { fileMeta?: PrescriptionFileMeta; error?: string } {
  const size = estimateDataUrlByteSize(dataUrl);
  const ext = mimeType === 'image/png' ? 'png' : 'jpg';
  const y = capturedAt.getFullYear();
  const m = String(capturedAt.getMonth() + 1).padStart(2, '0');
  const d = String(capturedAt.getDate()).padStart(2, '0');
  const hh = String(capturedAt.getHours()).padStart(2, '0');
  const mm = String(capturedAt.getMinutes()).padStart(2, '0');
  const ss = String(capturedAt.getSeconds()).padStart(2, '0');
  const name = `rx-scan-${y}${m}${d}-${hh}${mm}${ss}.${ext}`;

  const validation = validatePrescriptionFile({ name, size, type: mimeType });
  if (!validation.valid) {
    return { error: validation.error ?? 'Captured photo could not be validated.' };
  }

  const uploadedAt = capturedAt.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return {
    fileMeta: {
      name,
      size,
      type: mimeType,
      uploadedAt,
      previewDataUrl: dataUrl,
    },
  };
}

export function getCameraErrorMessage(err: unknown): string {
  const name =
    typeof err === 'object' && err !== null && 'name' in err
      ? String((err as { name: unknown }).name)
      : '';
  switch (name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return 'Camera access was denied. Enable camera permissions in your browser settings or upload a prescription image instead.';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'No camera was detected on this device. Please upload a PNG, JPEG, or PDF prescription file instead.';
    case 'NotReadableError':
    case 'TrackStartError':
      return 'Your camera is currently busy in another app. Close other camera sessions and try again.';
    case 'SecurityError':
      return 'Camera capture requires a secure HTTPS connection.';
    default:
      return 'Could not access your camera. Please try again or upload a prescription file from your device.';
  }
}

export function filterAndSortProducts(products: Product[], filters: FilterState): Product[] {
  const searchLower = filters.search.trim().toLowerCase();

  const filtered = products.filter((p) => {
    if (filters.categories.length > 0) {
      const catMatch = filters.categories.some(
        (c) =>
          p.category.toLowerCase() === c.toLowerCase() ||
          p.subcategory.toLowerCase() === c.toLowerCase()
      );
      if (!catMatch) return false;
    }

    if (filters.subcategory) {
      const subLower = filters.subcategory.toLowerCase();
      if (
        p.subcategory.toLowerCase() !== subLower &&
        p.category.toLowerCase() !== subLower
      ) {
        return false;
      }
    }

    if (p.price < filters.minPrice || p.price > filters.maxPrice) {
      return false;
    }

    if (filters.availability.length > 0) {
      const wantInStock = filters.availability.includes('in-stock');
      const wantOutOfStock = filters.availability.includes('out-of-stock');
      if (wantInStock && !wantOutOfStock && !p.inStock) return false;
      if (wantOutOfStock && !wantInStock && p.inStock) return false;
    }

    if (filters.brands.length > 0) {
      if (!filters.brands.some((b) => b.toLowerCase() === p.brand.toLowerCase())) {
        return false;
      }
    }

    if (filters.colors.length > 0) {
      const pColors = (p.colors ?? []).map((c) => c.toLowerCase());
      if (!filters.colors.some((c) => pColors.includes(c.toLowerCase()))) {
        return false;
      }
    }

    if (searchLower) {
      const haystack = `${p.name} ${p.category} ${p.subcategory} ${p.brand} ${p.composition}`.toLowerCase();
      if (!haystack.includes(searchLower)) return false;
    }

    return true;
  });

  const sorted = [...filtered];
  switch (filters.sort) {
    case 'price-asc':
      sorted.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      sorted.sort((a, b) => b.price - a.price);
      break;
    case 'rating':
      sorted.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
      break;
    case 'newest':
      sorted.sort((a, b) => Number(Boolean(b.isNew)) - Number(Boolean(a.isNew)));
      break;
    case 'best-selling':
    default:
      sorted.sort((a, b) => (b.soldRecently ?? 0) - (a.soldRecently ?? 0));
      break;
  }

  return sorted;
}

export function transitionSubscription(
  sub: MedicineSubscription,
  action: 'pause' | 'resume' | 'cancel' | { type: 'interval'; days: 30 | 60 | 90 }
): MedicineSubscription {
  if (typeof action === 'object' && action.type === 'interval') {
    return {
      ...sub,
      intervalDays: action.days,
    };
  }
  if (action === 'pause' && sub.status === 'ACTIVE') {
    return { ...sub, status: 'PAUSED' };
  }
  if (action === 'resume' && sub.status === 'PAUSED') {
    return { ...sub, status: 'ACTIVE' };
  }
  if (action === 'cancel' && sub.status !== 'CANCELLED') {
    return { ...sub, status: 'CANCELLED' };
  }
  return sub;
}

export function getDefaultProductVariant(product: Product) {
  return product.variants.find((v) => v.price === product.price) ?? product.variants[0];
}

export function getDefaultProductVariantIndex(product: Product): number {
  const idx = product.variants.findIndex((v) => v.price === product.price);
  return idx >= 0 ? idx : 0;
}

export function cartLineId(
  item: Pick<CartItem, 'productId' | 'variantLabel' | 'purchaseMode'>
): string {
  return `${item.productId}__${item.variantLabel ?? 'default'}__${item.purchaseMode}`;
}

export function mergeCartLine(cart: CartItem[], item: Omit<CartItem, 'id'>): CartItem[] {
  const id = cartLineId(item);
  return cart.some((c) => c.id === id)
    ? cart.map((c) => (c.id === id ? { ...c, quantity: c.quantity + item.quantity } : c))
    : [...cart, { ...item, id }];
}

