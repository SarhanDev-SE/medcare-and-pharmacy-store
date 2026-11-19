'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Star,
} from 'lucide-react';
import {
  BLOG_POSTS,
  MEGA_MENU_COLUMNS,
  PARTNER_BRANDS,
  PRODUCTS,
  TESTIMONIALS,
  TOP_CATEGORIES,
} from '@/lib/data';
import ProductCard from '@/components/ProductCard';

const HERO_SLIDES = [
  {
    id: 'slide-1',
    kicker: 'CLINICAL ORAL HYGIENE',
    title: 'Daily Oral Care Essentials',
    subtitle: 'Find oral care tools for fresher, stronger teeth and support daily long-lasting mouth health.',
    cta: 'Shop Now',
    href: '/shop?category=Medical%20Equipment',
    image: '/images/hero/oral-care-hero.png',
    bgClass: 'from-[#6D93B8] via-[#83A7C9] to-[#567C9F]',
    textDark: false,
  },
  {
    id: 'slide-2',
    kicker: 'BOOST YOUR DAILY HEALTH ROUTINE',
    title: 'Essential Vitamins for Wellness',
    subtitle: 'Shop a curated range of daily vitamins developed to boost immunity and support steady energy.',
    cta: 'Shop Now',
    href: '/shop?category=Wellness%20Products',
    image: '/images/hero/vitamins-hero.png',
    bgClass: 'from-[#EFE6DB] via-[#E8DDD0] to-[#DFD0BF]',
    textDark: true,
  },
  {
    id: 'slide-3',
    kicker: 'PHARMACY FORMULATED',
    title: 'Premium Wellness Supplements',
    subtitle: 'Enhance vitality & support your immune system with third-party tested pharmacy formulations.',
    cta: 'Shop Now',
    href: '/shop?category=Pharmacy%20Medicines',
    image: '/images/hero/supplement-capsule-hero.png',
    bgClass: 'from-[#E4EDF4] via-[#DCE6EF] to-[#CFDCE8]',
    textDark: true,
  },
];

export default function HomePage() {
  const [heroIdx, setHeroIdx] = useState(0);
  const [hoveredCatId, setHoveredCatId] = useState<string | null>(null);
  const [topPicksTab, setTopPicksTab] = useState<'All' | 'Medications' | 'Devices' | 'Wellness' | 'Offers'>('All');

  // Countdown timer (4 Days, 11 Hours, 42 Mins, 21 Secs)
  const [secondsLeft, setSecondsLeft] = useState(4 * 86400 + 11 * 3600 + 42 * 60 + 21);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const days = String(Math.floor(secondsLeft / 86400)).padStart(2, '0');
  const hours = String(Math.floor((secondsLeft % 86400) / 3600)).padStart(2, '0');
  const mins = String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  const activeSlide = HERO_SLIDES[heroIdx];

  const topPickProducts = (
    topPicksTab === 'All'
      ? PRODUCTS
      : PRODUCTS.filter((p) => p.productTypeTab === topPicksTab)
  ).slice(0, 5);

  const featuredProducts = PRODUCTS.slice(0, 8);
  const recentProducts = PRODUCTS.slice(4, 7);
  const bestsellerProducts = PRODUCTS.slice(8, 11);
  const saleOffProducts = PRODUCTS.filter((p) => Boolean(p.discountPercent)).slice(0, 3);

  return (
    <div className="bg-white">
      {/* 1. Hero Section with Left Vertical Category Rail + Flyout (Screens 01 & 26) */}
      <section className="max-w-[1320px] mx-auto px-4 pt-5 pb-8">
        <div
          className="grid grid-cols-1 lg:grid-cols-12 gap-5 relative"
          onMouseLeave={() => setHoveredCatId(null)}
        >
          {/* Left Category Rail */}
          <aside className="hidden lg:block lg:col-span-3 bg-white border border-slate-200 rounded-2xl overflow-hidden self-start">
            <ul className="divide-y divide-slate-100">
              {TOP_CATEGORIES.map((cat) => {
                const isActive = hoveredCatId === cat.id;
                return (
                  <li key={cat.id} onMouseEnter={() => setHoveredCatId(cat.id)}>
                    <Link
                      href={`/shop?category=${encodeURIComponent(cat.name)}`}
                      className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                        isActive
                          ? 'bg-[#F5F0FA] text-[#7B3CA1] font-semibold'
                          : 'text-[#082A66] hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{cat.name}</span>
                        {cat.badge && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              cat.badge === 'HOT'
                                ? 'bg-pink-100 text-pink-700'
                                : 'bg-cyan-100 text-cyan-700'
                            }`}
                          >
                            {cat.badge}
                          </span>
                        )}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </aside>

          {/* Category Flyout Panel (Screen 26) */}
          {hoveredCatId && (
            <div className="hidden lg:grid absolute left-[25.5%] top-2 w-[640px] bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 grid-cols-3 gap-6 z-30">
              {MEGA_MENU_COLUMNS.map((col) => (
                <div key={col.title}>
                  <h3 className="text-xs font-bold text-[#082A66] mb-2.5">{col.title}</h3>
                  <ul className="space-y-1.5">
                    {col.links.slice(0, 3).map((link) => (
                      <li key={link.label}>
                        <Link
                          href={`/shop?sub=${encodeURIComponent(link.query)}`}
                          className="text-xs text-slate-600 hover:text-[#7B3CA1] hover:underline"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Hero Banner Slider */}
          <div className="lg:col-span-9 relative rounded-2xl overflow-hidden min-h-[380px] sm:min-h-[440px] flex items-center">
            <div
              className={`absolute inset-0 bg-gradient-to-r ${activeSlide.bgClass} transition-colors duration-300`}
            />

            <div className="relative z-10 w-full grid grid-cols-1 md:grid-cols-12 items-center gap-6 px-8 sm:px-14 py-10">
              <div className="md:col-span-7 space-y-4">
                <p
                  className={`text-xs font-bold uppercase tracking-widest ${
                    activeSlide.textDark ? 'text-[#7B3CA1]' : 'text-white/85'
                  }`}
                >
                  {activeSlide.kicker}
                </p>
                <h1
                  className={`text-3xl sm:text-5xl font-extrabold leading-tight tracking-tight text-balance ${
                    activeSlide.textDark ? 'text-[#082A66]' : 'text-white'
                  }`}
                >
                  {activeSlide.title}
                </h1>
                <p
                  className={`text-sm sm:text-base max-w-md leading-relaxed ${
                    activeSlide.textDark ? 'text-slate-600' : 'text-white/90'
                  }`}
                >
                  {activeSlide.subtitle}
                </p>
                <div className="pt-2">
                  <Link
                    href={activeSlide.href}
                    className={`inline-block px-7 py-3 rounded-full text-sm font-semibold shadow-sm transition-colors ${
                      activeSlide.textDark
                        ? 'bg-[#082A66] text-white hover:bg-[#7B3CA1]'
                        : 'bg-white text-[#082A66] hover:bg-purple-50'
                    }`}
                  >
                    {activeSlide.cta}
                  </Link>
                </div>
              </div>

              <div className="md:col-span-5 flex items-center justify-center">
                <img
                  src={activeSlide.image}
                  alt={activeSlide.title}
                  className="max-h-72 sm:max-h-80 w-auto object-contain rounded-xl drop-shadow-lg"
                />
              </div>
            </div>

            {/* Carousel Controls */}
            <button
              type="button"
              onClick={() => setHeroIdx((i) => (i - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
              aria-label="Previous hero slide"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/85 hover:bg-white text-[#082A66] flex items-center justify-center shadow cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setHeroIdx((i) => (i + 1) % HERO_SLIDES.length)}
              aria-label="Next hero slide"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/85 hover:bg-white text-[#082A66] flex items-center justify-center shadow cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
              {HERO_SLIDES.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  aria-label={`Go to slide ${idx + 1}`}
                  onClick={() => setHeroIdx(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === heroIdx ? 'w-6 bg-white' : 'w-2 bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Top Picks This Week */}
      <section className="max-w-[1320px] mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#082A66]">Top Picks This Week</h2>
            <p className="text-xs text-slate-500 mt-1">
              Weekly Favorites Selected With Care To Support Your Wellbeing.
            </p>
          </div>
          <div className="flex items-center flex-wrap gap-2">
            {(['All', 'Medications', 'Devices', 'Wellness', 'Offers'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setTopPicksTab(tab)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                  topPicksTab === tab
                    ? 'border-[#7B3CA1] bg-[#F5F0FA] text-[#7B3CA1]'
                    : 'border-slate-200 text-[#082A66] hover:border-[#7B3CA1]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {topPickProducts.map((product) => (
            <ProductCard key={product.id} product={product} showStockBar />
          ))}
        </div>
      </section>

      {/* 3. Top Categories */}
      <section className="max-w-[1320px] mx-auto px-4 py-10">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#082A66]">Top Categories</h2>
            <p className="text-xs text-slate-500 mt-1">
              Explore Our Most Popular Medical Essentials.
            </p>
          </div>
          <Link
            href="/shop"
            className="text-xs font-semibold text-[#082A66] hover:text-[#7B3CA1] underline"
          >
            View All Categories
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { name: 'Cold & Flu', count: 24, img: '/images/categories/cold-flu.png' },
            { name: 'Pain Relief', count: 20, img: '/images/categories/pain-relief.png' },
            { name: 'Blood Pressure', count: 28, img: '/images/categories/blood-pressure.png' },
            { name: 'Bandages', count: 16, img: '/images/categories/bandages.png' },
            { name: 'Supplements', count: 17, img: '/images/categories/supplements.png' },
            { name: 'Personal Care', count: 12, img: '/images/categories/personal-care.png' },
          ].map((cat) => (
            <Link
              key={cat.name}
              href={`/shop?sub=${encodeURIComponent(cat.name)}`}
              className="group bg-[#F8F9FC] hover:bg-white border border-transparent hover:border-[#7B3CA1] rounded-2xl p-4 text-center transition-all"
            >
              <p className="text-sm font-bold text-[#082A66] group-hover:text-[#7B3CA1]">
                {cat.name}
              </p>
              <p className="text-[11px] text-slate-500 tabular-nums mt-0.5">
                {cat.count} Products
              </p>
              <div className="h-28 flex items-center justify-center mt-3">
                <img
                  src={cat.img}
                  alt={cat.name}
                  className="max-h-24 object-contain mix-blend-multiply group-hover:scale-105 transition-transform"
                />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Dual Promo Banners */}
      <section className="max-w-[1320px] mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-[#EEECD7] pl-7 sm:pl-9 pr-4 pt-6 pb-0 flex items-center justify-between gap-4 overflow-hidden min-h-[230px]">
            <div className="space-y-3 max-w-xs pb-6">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#082A66]/75">
                Reliable Daily Monitoring
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#082A66] leading-tight">
                Glucose &amp; Care Essentials
              </h3>
              <Link
                href="/shop?category=Health%20Care%20Devices"
                className="inline-block px-5 py-2 rounded-full bg-white text-[#082A66] hover:bg-[#082A66] hover:text-white text-xs font-semibold transition-colors shadow-xs"
              >
                Shop Now
              </Link>
            </div>
            <img
              src="/images/hero/glucose-device.png"
              alt="Diagnostic monitoring device"
              className="w-36 sm:w-48 h-52 object-contain self-end shrink-0"
            />
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-[#EAF3FA] to-[#D4E6F5] p-7 sm:p-9 flex items-center justify-between gap-4 overflow-hidden min-h-[230px]">
            <div className="space-y-3 max-w-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#7B3CA1]">
                For Relief, Care, And Wellness
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#082A66] leading-tight">
                Trusted Pills You Can Rely On
              </h3>
              <Link
                href="/shop?category=Pharmacy%20Medicines"
                className="inline-block px-5 py-2 rounded-full bg-white text-[#082A66] hover:bg-[#7B3CA1] hover:text-white text-xs font-semibold transition-colors shadow-xs"
              >
                Shop Now
              </Link>
            </div>
            <img
              src="/images/categories/oral-medicine.png"
              alt="Daily capsules and tablets"
              className="w-36 sm:w-48 h-44 object-contain mix-blend-multiply shrink-0"
            />
          </div>
        </div>
      </section>

      {/* 5. Featured Products Grid (4x2) */}
      <section className="max-w-[1320px] mx-auto px-4 py-10">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#082A66]">Featured Products</h2>
            <p className="text-xs text-slate-500 mt-1">
              Trusted Medical Essentials Recommended For Health And Comfort.
            </p>
          </div>
          <Link
            href="/shop"
            className="text-xs font-semibold text-[#082A66] hover:text-[#7B3CA1] underline"
          >
            View All Products
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 6. Countdown Deal Banner */}
      <section className="max-w-[1320px] mx-auto px-4 py-4">
        <div className="rounded-2xl bg-[#7B3CA1] text-white px-6 sm:px-10 py-6 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <h2 className="text-lg sm:text-xl font-bold">
              Better Care, Healthier Life, Smarter Savings!
            </h2>
            <Link
              href="/shop?deals=1"
              className="text-xs font-semibold underline underline-offset-4 text-purple-100 hover:text-white"
            >
              Shop Sale
            </Link>
          </div>

          <div className="flex items-center gap-2.5 tabular-nums">
            {[
              { val: days, label: 'Days' },
              { val: hours, label: 'Hours' },
              { val: mins, label: 'Mins' },
              { val: secs, label: 'Secs' },
            ].map((unit, idx) => (
              <React.Fragment key={unit.label}>
                {idx > 0 && <span className="text-lg font-bold text-white/80">:</span>}
                <div className="bg-white text-[#082A66] rounded-xl w-14 py-2 text-center shadow-xs">
                  <p className="text-lg font-extrabold leading-none">{unit.val}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{unit.label}</p>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Split Banner with 4 Category Highlights */}
      <section className="max-w-[1320px] mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-6 rounded-2xl bg-[#E5DFCA] pl-7 sm:pl-10 pr-4 pt-7 pb-0 flex flex-col sm:flex-row items-center justify-between gap-4 overflow-hidden">
            <div className="space-y-3 max-w-xs pb-7">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                For Energy, Immunity, And Wellness
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#082A66] leading-tight">
                Vitamins That Support Every Day
              </h3>
              <Link
                href="/shop?category=Wellness%20Products"
                className="inline-block px-6 py-2.5 rounded-full bg-white text-[#082A66] hover:bg-[#7B3CA1] hover:text-white text-xs font-semibold transition-colors shadow-xs"
              >
                Shop Now
              </Link>
            </div>
            <img
              src="/images/hero/vitamins-every-day.png"
              alt="Daily herbal vitamins"
              className="max-h-72 w-auto object-contain self-end shrink-0"
            />
          </div>

          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            {[
              { name: 'Sonic Toothbrush', img: '/images/categories/sonic-toothbrush.png', query: 'Medical Equipment' },
              { name: 'Oral Medicine', img: '/images/categories/oral-medicine.png', query: 'Pharmacy Medicines' },
              { name: 'Health Supplements', img: '/images/categories/health-supplements.png', query: 'Wellness Products' },
              { name: 'Medical Mask', img: '/images/categories/medical-mask.png', query: 'First Aid & Safety' },
            ].map((item) => (
              <Link
                key={item.name}
                href={`/shop?category=${encodeURIComponent(item.query)}`}
                className="group bg-[#F8F9FC] hover:bg-white border border-slate-200/70 hover:border-[#7B3CA1] rounded-2xl p-5 flex flex-col items-center justify-between text-center transition-all"
              >
                <div className="h-28 flex items-center justify-center">
                  <img
                    src={item.img}
                    alt={item.name}
                    className="max-h-24 object-contain mix-blend-multiply group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="mt-3">
                  <p className="text-sm font-bold text-[#082A66] group-hover:text-[#7B3CA1]">
                    {item.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">View Products</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 8. 3-Column Product Showcase (Recent / Bestsellers / Sale Off) */}
      <section className="max-w-[1320px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <h2 className="text-lg font-bold text-[#082A66] mb-4">Recent Products</h2>
            <div className="space-y-3">
              {recentProducts.map((p) => (
                <ProductCard key={p.id} product={p} variant="compact-row" />
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#082A66] mb-4">Our BestSellers</h2>
            <div className="space-y-3">
              {bestsellerProducts.map((p) => (
                <ProductCard key={p.id} product={p} variant="compact-row" />
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#082A66] mb-4">Sale Off Products</h2>
            <div className="space-y-3">
              {saleOffProducts.map((p) => (
                <ProductCard key={p.id} product={p} variant="compact-row" />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 9. Testimonials + Partner Showcase (Borrowed from Layouts 2 & 4) */}
      <section className="bg-[#F8F9FC] py-12 mt-6">
        <div className="max-w-[1320px] mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#082A66]">What Customers Are Saying</h2>
              <p className="text-xs text-slate-500 mt-1">
                Hear from real customers who rely on Xmedcar for daily wellness and prescriptions.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-bold text-[#082A66] tabular-nums">
                  ★★★★★ 4.70 out of 5
                </p>
                <p className="text-[11px] text-slate-500">Based on 425 verified reviews</p>
              </div>
              <Link
                href="/about"
                className="px-4 py-2 rounded-full bg-[#7B3CA1] text-white text-xs font-semibold hover:bg-[#662F87] transition-colors whitespace-nowrap"
              >
                Read More Stories
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TESTIMONIALS.map((t) => (
              <div key={t.id} className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center text-[#082A66] mb-3">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{t.quote}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <p className="text-xs font-bold text-[#082A66]">{t.name}</p>
                  <p className="text-[11px] text-slate-400">{t.location}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Partner Store Strip */}
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {PARTNER_BRANDS.slice(0, 6).map((brand) => (
              <div
                key={brand}
                className="bg-white border border-slate-200/80 rounded-xl py-3.5 px-4 text-center text-sm font-bold tracking-wide text-slate-400"
              >
                {brand}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. Health Insights & Wellness Tips */}
      <section className="max-w-[1320px] mx-auto px-4 py-12">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#082A66]">Health Insights &amp; Wellness Tips</h2>
            <p className="text-xs text-slate-500 mt-1">
              Practical advice and strategies to improve your daily health effectively.
            </p>
          </div>
          <Link
            href="/blog"
            className="text-xs font-semibold text-[#082A66] hover:text-[#7B3CA1] underline"
          >
            View All Articles
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {BLOG_POSTS.slice(0, 3).map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group block"
            >
              <div className="rounded-2xl overflow-hidden bg-slate-100 aspect-[4/3] mb-3.5">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#7B3CA1]">
                {post.category} · {post.date}
              </p>
              <h3 className="text-base font-bold text-[#082A66] group-hover:text-[#7B3CA1] transition-colors mt-1 leading-snug">
                {post.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1">by {post.author}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
