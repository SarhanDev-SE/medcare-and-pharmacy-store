import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface Crumb {
  label: string;
  href?: string;
}

export default function Breadcrumbs({
  items,
  title,
  subtitle,
}: {
  items: Crumb[];
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="max-w-[1320px] mx-auto px-4 pt-6 pb-4">
      <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500 mb-3">
        {items.map((item, idx) => (
          <React.Fragment key={`${item.label}-${idx}`}>
            {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />}
            {item.href ? (
              <Link href={item.href} className="hover:text-[#7B3CA1] transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="text-slate-800 font-medium">{item.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>
      <h1 className="text-2xl sm:text-3xl font-bold text-[#082A66] tracking-tight">{title}</h1>
      {subtitle && <p className="text-sm text-slate-500 mt-1.5 max-w-2xl">{subtitle}</p>}
    </div>
  );
}
