'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export function Suggestions({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn('flex flex-wrap items-center gap-1.5', className)}
      role="group"
      aria-label="Suggested questions"
    >
      {children}
    </div>
  );
}

export function Suggestion({
  suggestion,
  onClick,
  className,
}: {
  suggestion: string;
  onClick: (suggestion: string) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(suggestion)}
      className={cn(
        'shrink-0 rounded-full border border-purple-200 bg-[#FAF8FC] px-3 py-1.5 text-[11px] font-semibold text-[#082A66] hover:border-[#7B3CA1] hover:bg-purple-50 transition-colors cursor-pointer',
        className
      )}
    >
      {suggestion}
    </button>
  );
}
