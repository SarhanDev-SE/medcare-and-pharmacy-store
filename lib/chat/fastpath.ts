import { FAQ_CATEGORIES } from '@/lib/data';
import type { FaqCategory, StoreSettings } from '@/lib/types';

const GREETING =
  /^\s*(hi|hello|hey|salam|assalam[a-z ]*|good (morning|afternoon|evening)|thanks?|thank you)\b[\s!.?]*$/i;
const EMERGENCY =
  /\b(chest pain|can'?t breathe|cannot breathe|trouble breathing|overdos\w*|suicid\w*|kill myself|anaphyla\w*|severe allergic|stroke|seizure|unconscious|poison\w*)\b/i;

export function getEmergencyReply(phone = '+92 21 111 963 322'): string {
  return (
    'This sounds urgent. **Please call emergency services (1122 / 911 or your local emergency number) now.** ' +
    'If you are thinking about harming yourself, seek urgent medical care or call your national crisis helpline immediately. ' +
    `Once you are safe, our pharmacists can help with medicines: ${phone}.`
  );
}

export const EMERGENCY_REPLY = getEmergencyReply();

export const GREETING_REPLY =
  'Hi! I can help you find products, check details, and add things to your cart. What do you need today?';

const FILLER = new Set([
  'how', 'what', 'when', 'where', 'why', 'who', 'does', 'did', 'can', 'could',
  'should', 'would', 'are', 'is', 'you', 'your', 'our', 'the', 'and', 'for',
  'with', 'this', 'that', 'these', 'those', 'long', 'take', 'any', 'have',
  'there', 'about', 'use',
]);

const stem = (w: string) => w.replace(/(ing|es|s)$/, '');
const content = (s: string) =>
  new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !FILLER.has(w))
      .map(stem)
  );

function buildFaqIndex(faqCategories: FaqCategory[]) {
  return faqCategories.flatMap((c) => c.items).map((i) => ({
    a: i.a,
    t: content(i.q),
  }));
}

export function matchFaq(
  text: string,
  faqCategories: FaqCategory[] = FAQ_CATEGORIES
): string | null {
  const q = content(text);
  let best: { a: string; score: number } | null = null;
  for (const item of buildFaqIndex(faqCategories)) {
    let hit = 0;
    for (const w of item.t) if (q.has(w)) hit++;
    const coverage = hit / item.t.size;
    const precision = hit / Math.max(q.size, 1);
    if (hit >= 2 && coverage >= 0.6 && precision >= 0.6 && (!best || coverage > best.score)) {
      best = { a: item.a, score: coverage };
    }
  }
  return best?.a ?? null;
}

export type FastPath = { kind: 'emergency' | 'greeting' | 'faq'; text: string } | null;

export function routeFast(
  userText: string,
  ctx?: { faqCategories?: FaqCategory[]; settings?: Partial<StoreSettings> }
): FastPath {
  if (EMERGENCY.test(userText)) {
    return { kind: 'emergency', text: getEmergencyReply(ctx?.settings?.phone) };
  }
  if (GREETING.test(userText)) return { kind: 'greeting', text: GREETING_REPLY };
  const a = matchFaq(userText, ctx?.faqCategories);
  return a ? { kind: 'faq', text: a } : null;
}
