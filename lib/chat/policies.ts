import { FAQ_CATEGORIES, STORE_INFO } from '@/lib/data';
import {
  COUPONS,
  FREE_SHIPPING_THRESHOLD,
  MAX_RX_FILE_SIZE_BYTES,
  STANDARD_SHIPPING_FEE,
  formatMoney,
} from '@/lib/store-logic';
import type { ActiveCoupon, FaqCategory, StoreSettings } from '@/lib/types';

export const POLICY_TOPICS = [
  'shipping',
  'returns',
  'payment',
  'hours',
  'contact',
  'coupons',
  'prescriptions',
] as const;
export type PolicyTopic = (typeof POLICY_TOPICS)[number];

export interface PolicyContext {
  faqCategories?: FaqCategory[];
  settings?: Partial<StoreSettings>;
  coupons?: Record<string, ActiveCoupon>;
}

const findFaq = (categories: FaqCategory[], q: string) =>
  categories
    .flatMap((c) => c.items)
    .find((i) => i.q.toLowerCase().startsWith(q.toLowerCase()))?.a ?? '';

export function getPolicyText(topic: PolicyTopic, ctx?: PolicyContext): string {
  const faqCategories = ctx?.faqCategories?.length ? ctx.faqCategories : FAQ_CATEGORIES;
  const phone = ctx?.settings?.phone ?? '+92 21 111 963 322';
  const email = ctx?.settings?.email ?? STORE_INFO.email;
  const contactAddress =
    ctx?.settings?.contactAddress ?? 'Suite 402, Clifton Medical Plaza, Karachi, Pakistan';
  const hoursWeekday = ctx?.settings?.hoursWeekday ?? '8:00am - 10:00pm PKT';
  const hoursSunday = ctx?.settings?.hoursSunday ?? '10:00am - 6:00pm PKT';
  const freeThreshold = ctx?.settings?.freeShippingThreshold ?? FREE_SHIPPING_THRESHOLD;
  const standardFee = ctx?.settings?.standardShippingFee ?? STANDARD_SHIPPING_FEE;
  const couponsMap = ctx?.coupons && Object.keys(ctx.coupons).length > 0 ? ctx.coupons : COUPONS;

  switch (topic) {
    case 'shipping':
      return `${findFaq(faqCategories, 'How long does shipping')} Standard courier delivery across Pakistan is ${formatMoney(standardFee, 'PKR')}, with Free Shipping on orders over ${formatMoney(freeThreshold, 'PKR')}.`;
    case 'returns':
      return findFaq(faqCategories, 'What is your return');
    case 'payment':
      return 'Checkout accepts Direct bank transfer (order ships after funds clear), Check payments, and Cash on delivery across Pakistan.';
    case 'hours':
      return `Mon–Sat ${hoursWeekday}; Sunday ${hoursSunday}.`;
    case 'contact':
      return `Phone ${phone}, email ${email}, ${contactAddress}.`;
    case 'coupons':
      return Object.values(couponsMap)
        .map((c) => `${c.code}: ${c.description}`)
        .join(' | ');
    case 'prescriptions':
      return `Rx items require a valid prescription (PNG, JPG or PDF, max ${MAX_RX_FILE_SIZE_BYTES / 1024 / 1024} MB) uploaded at checkout or on Order via Prescription; a licensed pharmacist reviews it before dispatch.`;
  }
}
