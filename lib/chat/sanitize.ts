import { tools, type ChatUIMessage } from './tools';

const TOOL_PARTS = new Set(Object.keys(tools).map((n) => `tool-${n}`));
export const MAX_TEXT_PER_MESSAGE = 600;
export const MAX_TOTAL_CHARS = 8_000;

export function sanitizeMessages(input: ChatUIMessage[]): ChatUIMessage[] | null {
  const out: ChatUIMessage[] = [];
  let total = 0;
  for (const m of input) {
    if (m.role === 'system') continue;
    const parts = m.parts.filter((p) =>
      m.role === 'user'
        ? p.type === 'text'
        : p.type === 'text' || p.type === 'step-start' || TOOL_PARTS.has(p.type)
    );
    for (const p of parts) {
      if (p.type !== 'text') continue;
      if (m.role === 'user' && p.text.length > MAX_TEXT_PER_MESSAGE) return null;
      total += p.text.length;
    }
    if (total > MAX_TOTAL_CHARS) return null;
    if (parts.length) out.push({ ...m, parts });
  }
  return out;
}
