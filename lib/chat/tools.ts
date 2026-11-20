import { tool, type InferUITools, type UIMessage } from 'ai';
import { z } from 'zod';
import type { StorefrontData } from '@/lib/types';
import {
  FALLBACK_PKR_PRODUCTS,
  getProduct,
  searchCatalog,
  toCard,
  toSlimLine,
} from './catalog';
import { POLICY_TOPICS, getPolicyText } from './policies';

const productId = z.string().min(1).max(64).describe('Product id from searchProducts');

export const cartSnapshot = z.object({
  items: z.array(
    z.object({
      lineId: z.string(),
      name: z.string(),
      variant: z.string().optional(),
      qty: z.number(),
      unitPrice: z.number(),
      isRx: z.boolean(),
    })
  ),
  itemCount: z.number(),
  subtotal: z.number(),
  discount: z.number(),
  total: z.number(),
  hasRx: z.boolean(),
  coupon: z.string().nullable(),
});
export type CartSnapshot = z.infer<typeof cartSnapshot>;

const cartMutationResult = z.discriminatedUnion('ok', [
  z.object({ ok: z.literal(true), addedName: z.string().optional(), cart: cartSnapshot }),
  z.object({ ok: z.literal(false), reason: z.string() }),
]);

const SECTION_KEY = {
  uses: 'usesAndBenefits',
  dosage: 'dosage',
  composition: 'composition',
  sideEffects: 'sideEffects',
  safety: 'safetyAdvice',
} as const;

export function createChatTools(storeData?: Partial<StorefrontData>) {
  const catalog = storeData?.products?.length ? storeData.products : FALLBACK_PKR_PRODUCTS;

  return {
    /* ── SERVER tools: have `execute` ── */
    searchProducts: tool({
      description:
        'Search the catalog. Up to 4 results are shown to the customer as product cards.',
      inputSchema: z.object({
        query: z
          .string()
          .max(100)
          .optional()
          .describe('Product, brand, ingredient or need, e.g. "vitamin d" or "sleep"'),
        category: z.string().max(60).optional(),
        maxPrice: z.number().positive().max(1_000_000).optional(),
        rx: z.enum(['any', 'otc-only']).default('any'),
        inStockOnly: z.boolean().default(true),
      }),
      execute: async (args) => searchCatalog({ ...args, limit: 4 }, catalog),
      toModelOutput: ({ output }) => ({
        type: 'text',
        value: output.products.length
          ? `${output.total} match(es), showing ${output.products.length}. id|name|price|rating|rx|stock|variants\n` +
            output.products.map(toSlimLine).join('\n')
          : 'No matching products.',
      }),
    }),

    getProductDetails: tool({
      description:
        'Label information for ONE product. Ask only for the sections needed to answer.',
      inputSchema: z.object({
        productId,
        sections: z
          .array(z.enum(['uses', 'dosage', 'composition', 'sideEffects', 'safety']))
          .min(1)
          .max(3),
      }),
      execute: async ({ productId, sections }) => {
        const p = getProduct(productId, catalog);
        if (!p) return { found: false as const };
        return {
          found: true as const,
          card: toCard(p),
          sections: Object.fromEntries(
            sections.map((s) => [s, p[SECTION_KEY[s]]])
          ) as Record<string, string>,
        };
      },
      toModelOutput: ({ output }) => ({
        type: 'text',
        value: output.found
          ? `${output.card.name} (${output.card.isRx ? 'Rx' : 'OTC'})\n` +
            Object.entries(output.sections)
              .map(([k, v]) => `${k}: ${v.slice(0, 450)}`)
              .join('\n')
          : 'Product not found.',
      }),
    }),

    compareProducts: tool({
      description: 'Compare 2–3 products side by side. Shown to the customer as cards.',
      inputSchema: z.object({ productIds: z.array(productId).min(2).max(3) }),
      execute: async ({ productIds }) => ({
        cards: productIds
          .map((id) => getProduct(id, catalog))
          .filter((p): p is NonNullable<typeof p> => Boolean(p))
          .map((p) => toCard(p)),
      }),
      toModelOutput: ({ output }) => ({
        type: 'text',
        value: output.cards.map(toSlimLine).join('\n'),
      }),
    }),

    getStoreInfo: tool({
      description:
        'Official store policy text: shipping, returns, payment, hours, contact, coupons, prescriptions.',
      inputSchema: z.object({ topic: z.enum(POLICY_TOPICS) }),
      execute: async ({ topic }) => ({
        topic,
        text: getPolicyText(topic, {
          faqCategories: storeData?.faqCategories,
          settings: storeData?.settings,
          coupons: storeData?.coupons,
        }),
      }),
    }),

    /* ── CLIENT tools: NO `execute`. The browser runs them against StoreContext. ── */
    addToCart: tool({
      description:
        'Add a product to the customer cart. Price is resolved by the store, never by you.',
      inputSchema: z.object({
        productId,
        variantId: z
          .string()
          .max(32)
          .optional()
          .describe('Variant id; omit for the default variant'),
        quantity: z.number().int().min(1).max(10).default(1),
        purchaseMode: z.enum(['one-time', 'subscription']).default('one-time'),
        intervalDays: z.union([z.literal(30), z.literal(60), z.literal(90)]).optional(),
      }),
      outputSchema: cartMutationResult,
    }),

    updateCartItem: tool({
      description:
        'Change quantity of a cart line, or remove it with quantity 0. Get lineId from viewCart.',
      inputSchema: z.object({
        lineId: z.string().max(128),
        quantity: z.number().int().min(0).max(10),
      }),
      outputSchema: cartMutationResult,
    }),

    viewCart: tool({
      description: 'Read the current cart (items, totals, whether it contains Rx items).',
      inputSchema: z.object({}),
      outputSchema: cartSnapshot,
    }),

    applyCoupon: tool({
      description: 'Apply a coupon code the customer provided.',
      inputSchema: z.object({ code: z.string().min(2).max(24) }),
      outputSchema: z.object({
        valid: z.boolean(),
        message: z.string(),
        cart: cartSnapshot,
      }),
    }),

    startCheckout: tool({
      description:
        'Prepare checkout. Shows the customer a summary card with a button to the checkout page.',
      inputSchema: z.object({}),
      outputSchema: z.object({
        ready: z.boolean(),
        reason: z.string().optional(),
        needsPrescription: z.boolean(),
        cart: cartSnapshot,
      }),
    }),
  };
}

export const tools = createChatTools();

export type ChatTools = InferUITools<typeof tools>;
export type ChatUIMessage = UIMessage<never, never, ChatTools>;
