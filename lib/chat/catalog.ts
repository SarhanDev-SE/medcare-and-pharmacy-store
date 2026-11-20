import { PRODUCTS } from '@/lib/data';
import { getDefaultProductVariant, getSubscriptionPrice, usdToPkr } from '@/lib/store-logic';
import type { CartItem, Product, ProductVariant } from '@/lib/types';

export interface ProductCardData {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  image: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  rating: number;
  reviewCount: number;
  isRx: boolean;
  inStock: boolean;
  stockCount: number;
  medicineType: string;
  subscriptionEligible: boolean;
  defaultVariantId: string;
  variants: Pick<ProductVariant, 'id' | 'shopifyVariantId' | 'label' | 'price'>[];
  highlights: string[];
}

export const FALLBACK_PKR_PRODUCTS: Product[] = PRODUCTS.map((p) => ({
  ...p,
  price: usdToPkr(p.price),
  ...(p.originalPrice ? { originalPrice: usdToPkr(p.originalPrice) } : {}),
  variants: p.variants.map((v) => ({
    ...v,
    price: usdToPkr(v.price),
    ...(v.originalPrice ? { originalPrice: usdToPkr(v.originalPrice) } : {}),
  })),
}));

export const getProduct = (id: string, catalog: Product[] = FALLBACK_PKR_PRODUCTS) =>
  catalog.find((p) => p.id === id);

/** The variant that product.price refers to (variants[0] is NOT always it). */
export const defaultVariant = (p: Product): ProductVariant => getDefaultProductVariant(p);

export function toCard(p: Product): ProductCardData {
  const dv = defaultVariant(p);
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    category: p.category,
    image: p.image,
    price: dv.price,
    originalPrice: dv.originalPrice ?? p.originalPrice,
    discountPercent: p.discountPercent,
    rating: p.rating,
    reviewCount: p.reviewCount,
    isRx: p.isRx,
    inStock: p.inStock,
    stockCount: p.stockCount,
    medicineType: p.medicineType,
    subscriptionEligible: p.subscriptionEligible,
    defaultVariantId: dv.id,
    variants: p.variants.map(({ id, shopifyVariantId, label, price }) => ({
      id,
      shopifyVariantId,
      label,
      price,
    })),
    highlights: p.benefits.slice(0, 2),
  };
}

/** ~35 tokens per product instead of ~740 for the raw record. This is what the MODEL sees. */
export const toSlimLine = (c: ProductCardData) =>
  `${c.id}|${c.name}|Rs. ${c.price}|${c.rating}★|${c.isRx ? 'Rx' : 'OTC'}|` +
  `${c.inStock ? 'in stock' : 'OUT OF STOCK'}|variants:${c.variants.map((v) => `${v.id}=Rs.${v.price}`).join(',')}`;

/* ---------- search ---------- */
const STOP = new Set([
  'a', 'an', 'the', 'for', 'to', 'of', 'and', 'or', 'with', 'my', 'me', 'i',
  'need', 'want', 'show', 'find', 'any', 'some', 'good', 'best', 'please', 'have', 'you', 'do',
]);
const SYNONYMS: Record<string, string[]> = {
  sleep: ['relax', 'calm', 'tincture'],
  stress: ['relax', 'calm'],
  anxiety: ['relax', 'calm'],
  tummy: ['stomach', 'gut', 'probiotic'],
  digestion: ['stomach', 'gut', 'probiotic', 'enzymes'],
  bp: ['blood pressure'],
  kids: ['children', 'pediatric', 'baby'],
};

const norm = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Whole-word-prefix match: "vitamin" matches "vitamins", but "d" never matches "and".
const hasWord = (text: string, term: string) => new RegExp(`\\b${esc(term)}`).test(text);

function score(p: Product, q: string, terms: string[], synonyms: string[]): number {
  const fields: [string, number][] = [
    [norm(p.name), 5],
    [norm(p.brand), 3],
    [norm(`${p.category} ${p.subcategory}`), 3],
    [norm(p.composition), 3],
    [norm(p.medicineType), 2],
    [norm(p.benefits.join(' ')), 2],
    [norm(p.description), 1],
  ];
  let s = 0;
  if (terms.length > 1 && fields.some(([t]) => t.includes(q))) s += 10;
  for (const t of terms) {
    const hit = fields.find(([text]) => hasWord(text, t));
    if (hit) s += hit[1];
  }
  for (const t of synonyms) {
    const hit = fields.find(([text]) => hasWord(text, t));
    if (hit) s += hit[1] * 0.5;
  }
  return s;
}

export interface SearchArgs {
  query?: string;
  category?: string;
  maxPrice?: number;
  rx?: 'any' | 'otc-only';
  inStockOnly?: boolean;
  limit?: number;
}

export function searchCatalog(
  {
    query = '',
    category,
    maxPrice,
    rx = 'any',
    inStockOnly = false,
    limit = 4,
  }: SearchArgs,
  catalog: Product[] = FALLBACK_PKR_PRODUCTS
) {
  const q = norm(query);
  const terms = q
    .split(' ')
    .filter((t) => (t.length >= 2 && !STOP.has(t)) || /^[a-z]\d+$/.test(t));
  const synonyms = [...new Set(terms.flatMap((t) => SYNONYMS[t] ?? []))];

  const scored = catalog
    .filter(
      (p) =>
        !category ||
        `${p.category} ${p.subcategory}`.toLowerCase().includes(category.toLowerCase())
    )
    .filter((p) => maxPrice === undefined || defaultVariant(p).price <= maxPrice)
    .filter((p) => rx === 'any' || !p.isRx)
    .filter((p) => !inStockOnly || p.inStock)
    .map((p) => ({ p, s: terms.length ? score(p, q, terms, synonyms) : 1 }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || (b.p.soldRecently ?? 0) - (a.p.soldRecently ?? 0));

  const top = scored[0]?.s ?? 0;
  const ranked = scored.filter((x) => x.s >= top * 0.4);
  return {
    total: ranked.length,
    products: ranked.slice(0, Math.min(limit, 6)).map((x) => toCard(x.p)),
  };
}

/* ---------- cart line: single source of truth for pricing ---------- */
export type BuildLineResult =
  | { ok: true; line: Omit<CartItem, 'id'> }
  | { ok: false; reason: string };

export function buildCartLine(
  args: {
    productId: string;
    variantId?: string;
    quantity: number;
    purchaseMode: 'one-time' | 'subscription';
    intervalDays?: 30 | 60 | 90;
  },
  catalog: Product[] = FALLBACK_PKR_PRODUCTS
): BuildLineResult {
  const p = getProduct(args.productId, catalog);
  if (!p) return { ok: false, reason: 'Unknown product.' };
  if (!p.inStock) return { ok: false, reason: `${p.name} is out of stock.` };
  const max = Math.min(10, p.stockCount);
  if (args.quantity < 1 || args.quantity > max) {
    return { ok: false, reason: `Quantity must be between 1 and ${max}.` };
  }
  const v = args.variantId ? p.variants.find((x) => x.id === args.variantId) : defaultVariant(p);
  if (!v) {
    return {
      ok: false,
      reason: `Unknown variant. Options: ${p.variants.map((x) => x.id).join(', ')}.`,
    };
  }
  if (args.purchaseMode === 'subscription' && !p.subscriptionEligible) {
    return { ok: false, reason: `${p.name} is not eligible for subscription.` };
  }
  const sub = args.purchaseMode === 'subscription';
  const days = args.intervalDays ?? 30;
  return {
    ok: true,
    line: {
      productId: p.id,
      shopifyVariantId: v.shopifyVariantId,
      slug: p.slug,
      name: p.name,
      image: p.image,
      price: sub ? getSubscriptionPrice(v.price) : v.price,
      originalPrice: v.price,
      quantity: args.quantity,
      isRx: p.isRx,
      variantLabel: sub ? `${days} Days Supply (15% Off)` : v.label,
      purchaseMode: args.purchaseMode,
      subscriptionIntervalDays: sub ? days : undefined,
    },
  };
}
