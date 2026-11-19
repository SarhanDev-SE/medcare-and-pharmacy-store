'use client';

import type { ChatStatus } from 'ai';
import { ArrowUp, Square } from 'lucide-react';
import React, { createContext, useContext, useState } from 'react';
import { cn } from '@/lib/utils';

interface PromptInputContextValue {
  text: string;
  setText: (val: string) => void;
  submit: () => void;
}

const PromptInputContext = createContext<PromptInputContextValue>({
  text: '',
  setText: () => {},
  submit: () => {},
});

export function PromptInput({
  onSubmit,
  disabled = false,
  className,
  children,
}: {
  onSubmit: (payload: { text: string }) => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const [text, setText] = useState('');

  const submit = () => {
    if (disabled) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit({ text: trimmed });
    setText('');
  };

  return (
    <PromptInputContext.Provider value={{ text, setText, submit }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className={cn(
          'rounded-xl border border-slate-200 bg-white focus-within:border-[#7B3CA1] focus-within:ring-2 focus-within:ring-[#7B3CA1]/15 transition-all',
          className
        )}
      >
        {children}
      </form>
    </PromptInputContext.Provider>
  );
}

export function PromptInputTextarea({
  placeholder = 'Type a message…',
  maxLength = 600,
  className,
}: {
  placeholder?: string;
  maxLength?: number;
  className?: string;
}) {
  const { text, setText, submit } = useContext(PromptInputContext);

  return (
    <textarea
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          submit();
        }
      }}
      placeholder={placeholder}
      maxLength={maxLength}
      rows={2}
      aria-label="Ask Xmedcar assistant"
      className={cn(
        'w-full resize-none bg-transparent px-3 pt-2.5 pb-1 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none',
        className
      )}
    />
  );
}

export function PromptInputFooter({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 px-3 pb-2 pt-0.5',
        className
      )}
    >
      {children}
    </div>
  );
}

export function PromptInputSubmit({
  status,
  onStop,
  className,
}: {
  status: ChatStatus;
  onStop?: () => void;
  className?: string;
}) {
  const { text } = useContext(PromptInputContext);
  const isBusy = status === 'submitted' || status === 'streaming';

  if (isBusy) {
    return (
      <button
        type="button"
        onClick={onStop}
        aria-label="Stop generating"
        className={cn(
          'inline-flex size-8 items-center justify-center rounded-lg bg-[#082A66] text-white hover:bg-[#102B5C] transition-colors cursor-pointer',
          className
        )}
      >
        <Square className="size-3.5 fill-current" />
      </button>
    );
  }

  return (
    <button
      type="submit"
      disabled={!text.trim()}
      aria-label="Send message"
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-lg bg-[#7B3CA1] text-white hover:bg-[#662F87] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors cursor-pointer',
        className
      )}
    >
      <ArrowUp className="size-4" />
    </button>
  );
}
