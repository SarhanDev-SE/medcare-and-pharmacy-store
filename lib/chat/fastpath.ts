import { FAQ_CATEGORIES, STORE_INFO } from '@/lib/data';

const GREETING =
  /^\s*(hi|hello|hey|salam|assalam[a-z ]*|good (morning|afternoon|evening)|thanks?|thank you)\b[\s!.?]*$/i;
const EMERGENCY =
  /\b(chest pain|can'?t breathe|cannot breathe|trouble breathing|overdos\w*|suicid\w*|kill myself|anaphyla\w*|severe allergic|stroke|seizure|unconscious|poison\w*)\b/i;

export const EMERGENCY_REPLY =
  'This sounds urgent. **Please call 911 (or your local emergency number) now.** ' +
  'If you are thinking about harming yourself, call or text **988** (US Suicide & Crisis Lifeline). ' +
  `Once you are safe, our pharmacists can help with medicines: ${STORE_INFO.phone}.`;

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

const FAQ_INDEX = FAQ_CATEGORIES.flatMap((c) => c.items).map((i) => ({
  a: i.a,
  t: content(i.q),
}));

export function matchFaq(text: string): string | null {
  const q = content(text);
  let best: { a: string; score: number } | null = null;
  for (const item of FAQ_INDEX) {
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

export function routeFast(userText: string): FastPath {
  if (EMERGENCY.test(userText)) return { kind: 'emergency', text: EMERGENCY_REPLY };
  if (GREETING.test(userText)) return { kind: 'greeting', text: GREETING_REPLY };
  const a = matchFaq(userText);
  return a ? { kind: 'faq', text: a } : null;
}
