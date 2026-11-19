'use client';

import React, { useState } from 'react';
import { ChevronDown, CheckCircle2 } from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import { FAQ_CATEGORIES } from '@/lib/data';
import { useStore } from '@/context/StoreContext';

export default function FaqsPage() {
  const { showToast } = useStore();
  const [openKey, setOpenKey] = useState<string | null>('0-0');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = (key: string) => {
    setOpenKey((prev) => (prev === key ? null : key));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please complete your name, email address, and question.');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setError(null);
    setSubmitted(true);
    setName('');
    setEmail('');
    setMessage('');
    showToast('Your question has been routed to our pharmacy support team.');
  };

  return (
    <main className="bg-white pb-16">
      <Breadcrumbs
        items={[{ label: 'Home', href: '/' }, { label: 'FAQs' }]}
        title="Frequently Asked Questions"
        subtitle="Find quick answers to common questions with clear clinical and fulfillment guidance."
      />

      <div className="max-w-[1320px] mx-auto px-4 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left 3 Categorized Accordions */}
          <div className="lg:col-span-8 space-y-10">
            {FAQ_CATEGORIES.map((group, groupIdx) => (
              <section key={group.category} aria-labelledby={`faq-cat-${groupIdx}`}>
                <h2
                  id={`faq-cat-${groupIdx}`}
                  className="text-xl font-bold text-[#082A66] mb-4"
                >
                  {group.category}
                </h2>
                <div className="divide-y divide-slate-200 border-t border-b border-slate-200">
                  {group.items.map((item, itemIdx) => {
                    const key = `${groupIdx}-${itemIdx}`;
                    const isOpen = openKey === key;
                    return (
                      <div key={item.q}>
                        <button
                          type="button"
                          onClick={() => handleToggle(key)}
                          aria-expanded={isOpen}
                          className="w-full py-4 flex items-center justify-between gap-4 text-left text-sm sm:text-base font-semibold text-[#082A66] hover:text-[#7B3CA1] transition-colors cursor-pointer"
                        >
                          <span>{item.q}</span>
                          <ChevronDown
                            className={`w-4 h-4 shrink-0 text-slate-500 transition-transform duration-200 ${
                              isOpen ? 'rotate-180 text-[#7B3CA1]' : ''
                            }`}
                          />
                        </button>
                        {isOpen && (
                          <div className="pb-5 pr-6 text-sm leading-relaxed text-slate-600">
                            {item.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          {/* Right Sticky Quick-Form Card */}
          <aside className="lg:col-span-4 lg:sticky lg:top-28">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <h2 className="text-lg font-bold text-[#082A66]">Ask Your Question</h2>
              <p className="text-xs text-slate-500 mt-1 mb-5">
                Ask Anything, We&apos;re Here to Help
              </p>

              {submitted ? (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-emerald-900">
                    Question Received
                  </p>
                  <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                    A licensed Xmedcar pharmacist or support specialist will reply to your inbox within 2 business hours.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="mt-4 text-xs font-semibold text-[#7B3CA1] hover:underline cursor-pointer"
                  >
                    Ask another question
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  {error && (
                    <p role="alert" className="text-xs text-[#DC3545] bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {error}
                    </p>
                  )}

                  <div>
                    <label
                      htmlFor="faq-name"
                      className="block text-xs font-semibold text-[#082A66] mb-1.5"
                    >
                      Your Name <span className="text-[#DC3545]">*</span>
                    </label>
                    <input
                      id="faq-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Smith"
                      className="w-full h-11 px-3.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#7B3CA1]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="faq-email"
                      className="block text-xs font-semibold text-[#082A66] mb-1.5"
                    >
                      Your Email <span className="text-[#DC3545]">*</span>
                    </label>
                    <input
                      id="faq-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your email (private)"
                      className="w-full h-11 px-3.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#7B3CA1]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="faq-message"
                      className="block text-xs font-semibold text-[#082A66] mb-1.5"
                    >
                      Message <span className="text-[#DC3545]">*</span>
                    </label>
                    <textarea
                      id="faq-message"
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Your Message"
                      className="w-full p-3.5 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#7B3CA1] resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full h-11 rounded-lg bg-[#7B3CA1] hover:bg-[#662F87] text-white text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Send Request
                  </button>
                </form>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
