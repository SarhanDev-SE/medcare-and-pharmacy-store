'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Award,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  LifeBuoy,
  Pill,
  Star,
} from 'lucide-react';
import { FAQ_CATEGORIES, PARTNER_BRANDS, TESTIMONIALS } from '@/lib/data';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function AboutPage() {
  const [openFaqIdx, setOpenFaqIdx] = useState<number>(1);
  const previewFaqs = FAQ_CATEGORIES[0].items;

  return (
    <div className="bg-white">
      <Breadcrumbs
        items={[{ label: 'Home', href: '/' }, { label: 'About Us' }]}
        title="About Us"
        subtitle="Committed to delivering pharmacist-verified medications, clean supplements, and everyday clinical essentials."
      />

      {/* Mission Intro */}
      <section className="max-w-[1320px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6">
            <img
              src="/images/pages/about-pills.png"
              alt="Pharmaceutical capsules and tablets"
              className="w-full rounded-2xl object-cover shadow-xs"
            />
          </div>
          <div className="lg:col-span-6 space-y-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#082A66] leading-tight">
              Committed To Delivering Premium Wellness Products Supporting
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Our mission is to provide products made from clean, trusted ingredients that help you
              maintain energy, balance, and dependable everyday health.
            </p>
            <ul className="space-y-2.5 text-xs sm:text-sm font-semibold text-[#082A66]">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#7B3CA1] shrink-0" />
                Harnessing The Power Of Clean, Safe, And Effective Components.
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#7B3CA1] shrink-0" />
                Formulas Designed To Enhance Energy, Immunity, And Mental Clarity.
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#7B3CA1] shrink-0" />
                Every Product Undergoes Strict Testing To Ensure Safety And Reliability.
              </li>
            </ul>
            <div className="pt-2">
              <Link
                href="/contact"
                className="inline-block px-7 py-2.5 rounded-full bg-[#7B3CA1] hover:bg-[#662F87] text-white text-xs font-semibold transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Pillar Feature Cards */}
      <section className="bg-[#F8F9FC] py-14 mt-4">
        <div className="max-w-[1320px] mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#082A66]">
              Effective And Reliable Protection
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Precision pharmacy standards across every supplement, medical device, and prescription.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Pill className="w-8 h-8 text-[#082A66]" strokeWidth={1.6} />,
                title: 'Precision Wellness Solutions',
                desc: 'Formulated to support overall health, daily vitality, and optimal balance.',
              },
              {
                icon: <LifeBuoy className="w-8 h-8 text-[#082A66]" strokeWidth={1.6} />,
                title: 'Advanced Everyday Support',
                desc: 'Designed to enhance energy, focus, and resilience naturally.',
              },
              {
                icon: <Award className="w-8 h-8 text-[#082A66]" strokeWidth={1.6} />,
                title: 'Trusted Quality Ingredients',
                desc: 'Crafted with safe, effective, and clean components you can rely on.',
              },
            ].map((p) => (
              <div
                key={p.title}
                className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center space-y-3"
              >
                <div className="w-12 h-12 mx-auto flex items-center justify-center">{p.icon}</div>
                <h3 className="text-lg font-bold text-[#082A66]">{p.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Counters */}
      <section className="max-w-[1320px] mx-auto px-4 py-12 border-b border-slate-200">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-4">
            <h2 className="text-2xl font-extrabold text-[#082A66] leading-snug">
              The Numbers Are Proof Of The Results.
            </h2>
          </div>
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { val: '10+', label: 'Years experience' },
              { val: '120k', label: 'Happy Clients' },
              { val: '98%', label: 'Satisfied' },
              { val: '120+', label: 'Store Branches' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-3xl sm:text-4xl font-extrabold text-[#082A66] tabular-nums">
                  {s.val}
                </p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Logos */}
      <section className="max-w-[1320px] mx-auto px-4 py-12">
        <h2 className="text-lg font-bold text-[#082A66] text-center mb-6">
          Join Over 100 Growing Store Branches
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {PARTNER_BRANDS.map((brand) => (
            <div
              key={brand}
              className="bg-[#F8F9FC] rounded-xl py-4 px-3 text-center text-sm font-bold text-slate-400"
            >
              {brand}
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="max-w-3xl mx-auto px-4 py-10">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-[#082A66]">Frequently Asked Questions</h2>
          <p className="text-xs text-slate-500 mt-1">
            Find clear answers to the most common questions about our wellness products.
          </p>
        </div>
        <div className="space-y-3">
          {previewFaqs.map((item, idx) => {
            const isOpen = openFaqIdx === idx;
            return (
              <div
                key={item.q}
                className={`border rounded-xl transition-colors ${
                  isOpen ? 'border-[#7B3CA1]' : 'border-slate-200'
                }`}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenFaqIdx(isOpen ? -1 : idx)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left text-sm font-bold text-[#082A66] cursor-pointer"
                >
                  <span>{item.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {isOpen && (
                  <p className="px-5 pb-4 text-xs text-slate-600 leading-relaxed">{item.a}</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Customer Testimonials */}
      <section className="bg-[#F8F9FC] py-12 mt-4">
        <div className="max-w-[1320px] mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#082A66]">What Customers Are Saying</h2>
              <p className="text-xs text-slate-500 mt-1">
                Hear from real users who rely on Xmedcar every day.
              </p>
            </div>
            <p className="text-xs font-bold text-[#082A66]">★★★★★ 4.70 out of 5 (425 reviews)</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TESTIMONIALS.map((t) => (
              <div key={t.id} className="bg-white border border-slate-200 rounded-2xl p-5">
                <div className="flex items-center text-[#082A66] mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-slate-700 leading-relaxed mb-4">{t.quote}</p>
                <p className="text-xs font-bold text-[#082A66]">{t.name}</p>
                <p className="text-[11px] text-slate-400">{t.location}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
