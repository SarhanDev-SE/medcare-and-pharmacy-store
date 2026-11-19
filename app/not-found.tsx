import Link from 'next/link';
import { ArrowLeft, Pill, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="bg-white py-20 px-4">
      <div className="max-w-xl mx-auto text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#F5F0FA] text-[#7B3CA1] flex items-center justify-center mx-auto mb-6">
          <Pill className="w-8 h-8" />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-[#7B3CA1] mb-2">
          Error 404
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#082A66] tracking-tight">
          Page Not Found In Our Pharmacy
        </h1>
        <p className="mt-3 text-sm text-slate-600 leading-relaxed">
          The medication formula, category, or wellness guide you requested may have moved or is no longer available. Let&apos;s get you back to our pharmacy aisles.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#082A66] hover:bg-[#7B3CA1] text-white text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back To Home
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-200 hover:border-[#7B3CA1] text-[#082A66] hover:text-[#7B3CA1] text-sm font-semibold transition-colors"
          >
            <Search className="w-4 h-4" />
            Browse All Medicines
          </Link>
        </div>
      </div>
    </main>
  );
}
