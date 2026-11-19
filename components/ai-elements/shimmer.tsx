'use client';

import { Loader2 } from 'lucide-react';
import React from 'react';
import { cn } from '@/lib/utils';

export function Shimmer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-slate-500 animate-pulse font-medium',
        className
      )}
    >
      <Loader2 className="size-3.5 animate-spin text-[#7B3CA1]" aria-hidden />
      <span>{children}</span>
    </span>
  );
}
