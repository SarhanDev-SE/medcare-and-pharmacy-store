'use client';

import { useChat, type UseChatHelpers } from '@ai-sdk/react';
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from 'ai';
import { RotateCcw, ShieldCheck, Sparkles, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from '@/components/ai-elements/prompt-input';
import { Shimmer } from '@/components/ai-elements/shimmer';
import { Suggestion, Suggestions as QuickReplies } from '@/components/ai-elements/suggestion';
import { useStore } from '@/context/StoreContext';
import { searchCatalog } from '@/lib/chat/catalog';
import type { ChatUIMessage } from '@/lib/chat/tools';
import { renderPart } from './MessageParts';
import { useCartToolRunner } from './use-cart-tools';

// The FAQ chip text equals a real FAQ question, so the server fast path answers it with no model call.
const SUGGESTIONS = [
  'Show me bestsellers',
  'Vitamin D options',
  'Something to help me sleep',
  'How long does shipping usually take?',
  'Do I need a prescription?',
];

const sessionId = () => {
  try {
    const k = 'xmedcar_chat_sid';
    const v = sessionStorage.getItem(k) ?? crypto.randomUUID();
    sessionStorage.setItem(k, v);
    return v;
  } catch {
    return 'anon';
  }
};

const friendly = (e: Error) => {
  try {
    const parsed = JSON.parse(e.message) as { error?: string };
    if (parsed?.error) return parsed.error;
  } catch {
    // Plain string error emitted by UIMessageStream onError
  }
  return e.message && e.message.length < 220
    ? e.message
    : 'Something went wrong. Please try again.';
};

const isGridToolPart = (part: ChatUIMessage['parts'][number]) =>
  part.type === 'tool-searchProducts' || part.type === 'tool-compareProducts';

export function ChatPanel({ onClose }: { onClose: () => void }) {
  const { products, settings } = useStore();
  const runCartTool = useCartToolRunner();
  const [transport] = useState(
    () =>
      new DefaultChatTransport({
        api: '/api/chat',
        headers: () => ({ 'x-session-id': sessionId() }),
      })
  );

  const chat: UseChatHelpers<ChatUIMessage> = useChat<ChatUIMessage>({
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onToolCall: ({ toolCall }) => runCartTool(toolCall, chat.addToolOutput),
  });
  const { messages, setMessages, sendMessage, status, stop, error, regenerate } = chat;

  /** Zero-token chip: answer "bestsellers" locally by injecting a synthetic tool result. */
  const showBestsellers = () => {
    const out = searchCatalog({ inStockOnly: true, limit: 4 }, products);
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: 'user',
        parts: [{ type: 'text', text: 'Show me bestsellers' }],
      },
      {
        id: 'bestsellers-' + crypto.randomUUID(),
        role: 'assistant',
        parts: [
          {
            type: 'tool-searchProducts',
            toolCallId: crypto.randomUUID(),
            state: 'output-available',
            input: { rx: 'any', inStockOnly: true },
            output: out,
          },
          {
            type: 'text',
            text: 'These are our current bestsellers. Tell me what you need and I can narrow it down.',
          },
        ],
      },
    ]);
  };

  const onSuggestion = (text: string) =>
    text === SUGGESTIONS[0] ? showBestsellers() : sendMessage({ text });

  const isBusy = status === 'submitted' || status === 'streaming';

  return (
    <div className="flex h-full flex-col bg-white text-slate-900">
      <header className="flex items-center justify-between border-b border-slate-200 bg-[#082A66] px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4" aria-hidden />
          <div>
            <h2 className="text-sm font-bold leading-none">Xmedcar Assistant</h2>
            <p className="mt-1 text-[10px] opacity-80">AI shopping help · not medical advice</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="New chat"
            onClick={() => {
              stop();
              setMessages([]);
            }}
            className="rounded-md p-1.5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <RotateCcw className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Close chat"
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>
      </header>

      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="gap-5 p-4">
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={<ShieldCheck className="size-6 text-[#7B3CA1]" />}
              title="How can I help?"
              description="Ask about products, add items to your cart, or check out. For dosage or interactions, ask our pharmacist."
            />
          ) : (
            messages.map((m, idx) => {
              const isLatestAssistant = idx === messages.length - 1 && m.role === 'assistant';
              const hasGridTool = m.parts.some(isGridToolPart);
              const holdForSimultaneousReveal = isBusy && isLatestAssistant && hasGridTool;

              return (
                <Message key={m.id} from={m.role}>
                  <MessageContent>
                    {holdForSimultaneousReveal ? (
                      <Shimmer className="text-xs">Finding matching products…</Shimmer>
                    ) : hasGridTool && m.role === 'assistant' ? (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                        className="flex w-full flex-col gap-2.5"
                      >
                        {m.parts.map((p, i) => {
                          const node = renderPart(p, m.role, onClose);
                          return node ? (
                            <div key={`${m.id}-${i}`} className="min-w-0">
                              {node}
                            </div>
                          ) : null;
                        })}
                      </motion.div>
                    ) : (
                      m.parts.map((p, i) => {
                        const node = renderPart(p, m.role, onClose);
                        return node ? (
                          <div key={`${m.id}-${i}`} className="min-w-0">
                            {node}
                          </div>
                        ) : null;
                      })
                    )}
                  </MessageContent>
                </Message>
              );
            })
          )}
          {status === 'submitted' && <Shimmer className="text-xs">Thinking…</Shimmer>}
          {error && (
            <div
              role="alert"
              className="flex items-center justify-between gap-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-700"
            >
              <span>{friendly(error)}</span>
              <button
                type="button"
                onClick={() => regenerate()}
                className="font-bold underline cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="space-y-2 border-t border-slate-200 p-3">
        {messages.length === 0 && (
          <QuickReplies>
            {SUGGESTIONS.map((s) => (
              <Suggestion key={s} suggestion={s} onClick={onSuggestion} />
            ))}
          </QuickReplies>
        )}
        <PromptInput
          disabled={status === 'submitted' || status === 'streaming'}
          onSubmit={({ text }) => {
            if (text.trim()) sendMessage({ text });
          }}
        >
          <PromptInputTextarea placeholder="Ask about a product…" maxLength={600} />
          <PromptInputFooter>
            <span className="text-[10px] text-slate-400">
              Emergency? Call 1122 / 911 · Pharmacist: {settings.phone}
            </span>
            <PromptInputSubmit status={status} onStop={stop} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
