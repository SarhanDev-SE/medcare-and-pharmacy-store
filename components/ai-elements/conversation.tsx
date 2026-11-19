'use client';

import { ArrowDown } from 'lucide-react';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { cn } from '@/lib/utils';

interface ConversationContextValue {
  isAtBottom: boolean;
  scrollToBottom: () => void;
}

const ConversationContext = createContext<ConversationContextValue>({
  isAtBottom: true,
  scrollToBottom: () => {},
});

export function Conversation({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const shouldStickRef = useRef(true);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distance <= 32;
    shouldStickRef.current = atBottom;
    setIsAtBottom(atBottom);
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    shouldStickRef.current = true;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    setIsAtBottom(true);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const observer = new MutationObserver(() => {
      if (shouldStickRef.current) {
        el.scrollTop = el.scrollHeight;
      }
    });

    observer.observe(el, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  return (
    <ConversationContext.Provider value={{ isAtBottom, scrollToBottom }}>
      <div className={cn('relative flex flex-col overflow-hidden', className)}>
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex-1 overflow-y-auto overscroll-contain"
        >
          {children}
        </div>
      </div>
    </ConversationContext.Provider>
  );
}

export function ConversationContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn('flex flex-col', className)}>{children}</div>;
}

export function ConversationEmptyState({
  icon,
  title,
  description,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-8 px-4 space-y-3',
        className
      )}
    >
      {icon && (
        <div className="w-12 h-12 rounded-2xl bg-[#FAF8FC] border border-purple-100 flex items-center justify-center">
          {icon}
        </div>
      )}
      <div className="space-y-1 max-w-xs">
        <h3 className="text-base font-bold text-[#082A66]">{title}</h3>
        <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export function ConversationScrollButton({ className }: { className?: string }) {
  const { isAtBottom, scrollToBottom } = useContext(ConversationContext);
  if (isAtBottom) return null;

  return (
    <button
      type="button"
      onClick={scrollToBottom}
      aria-label="Scroll to latest message"
      className={cn(
        'absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center size-8 rounded-full bg-white border border-slate-200 text-[#082A66] shadow-md hover:border-[#7B3CA1] hover:text-[#7B3CA1] transition-colors cursor-pointer',
        className
      )}
    >
      <ArrowDown className="size-4" />
    </button>
  );
}
