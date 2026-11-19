import { FAQ_CATEGORIES, STORE_INFO } from '@/lib/data';
import { COUPONS, FREE_SHIPPING_THRESHOLD, MAX_RX_FILE_SIZE_BYTES } from '@/lib/store-logic';

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

const faq = (q: string) =>
  FAQ_CATEGORIES.flatMap((c) => c.items).find((i) =>
    i.q.toLowerCase().startsWith(q.toLowerCase())
  )?.a ?? '';

export function getPolicyText(topic: PolicyTopic): string {
  switch (topic) {
    case 'shipping':
      return `${faq('How long does shipping')} Standard shipping is currently free on US orders, with free express threshold progress tracked at $${FREE_SHIPPING_THRESHOLD}.`;
    case 'returns':
      return faq('What is your return');
    case 'payment':
      return 'Checkout accepts Direct bank transfer (order ships after funds clear), Check payments, and Cash on delivery.';
    case 'hours':
      return `Mon–Sat ${STORE_INFO.hoursWeekday}; Sunday ${STORE_INFO.hoursSunday}.`;
    case 'contact':
      return `Phone ${STORE_INFO.phone}, email ${STORE_INFO.email}, ${STORE_INFO.contactAddress}.`;
    case 'coupons':
      return Object.values(COUPONS)
        .map((c) => `${c.code}: ${c.description}`)
        .join(' | ');
    case 'prescriptions':
      return `Rx items require a valid prescription (PNG, JPG or PDF, max ${MAX_RX_FILE_SIZE_BYTES / 1024 / 1024} MB) uploaded at checkout or on Order via Prescription; a pharmacist reviews it before dispatch.`;
  }
}
