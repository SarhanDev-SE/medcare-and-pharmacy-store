'use client';

import React, { createContext, useContext } from 'react';
import Markdown from 'react-markdown';
import { cn } from '@/lib/utils';

type Role = 'user' | 'assistant' | 'system';

const RoleContext = createContext<Role>('assistant');

export function Message({
  from,
  className,
  children,
}: {
  from: Role;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <RoleContext.Provider value={from}>
      <div
        className={cn(
          'flex w-full flex-col gap-1.5',
          from === 'user' ? 'items-end' : 'items-start',
          className
        )}
      >
        {children}
      </div>
    </RoleContext.Provider>
  );
}

export function MessageContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const role = useContext(RoleContext);

  if (role === 'user') {
    return (
      <div
        className={cn(
          'max-w-[85%] rounded-2xl rounded-br-sm bg-[#082A66] px-3.5 py-2.5 text-[13px] leading-relaxed text-white shadow-xs',
          className
        )}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex w-full max-w-full flex-col gap-2.5 text-[13px] leading-relaxed text-slate-800',
        className
      )}
    >
      {children}
    </div>
  );
}

export function MessageResponse({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl rounded-bl-sm bg-[#F7F8FC] border border-slate-100 px-3.5 py-2.5 text-[13px] leading-relaxed text-slate-800 [&_p+p]:mt-2 [&_ul]:mt-1.5 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:space-y-1 [&_ol]:mt-1.5 [&_ol]:list-decimal [&_ol]:pl-4 [&_strong]:font-bold [&_strong]:text-[#082A66]',
        className
      )}
    >
      <Markdown>{children}</Markdown>
    </div>
  );
}
