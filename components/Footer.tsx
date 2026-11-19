'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowUp,
  ArrowUpRight,
  CalendarCheck,
  HandCoins,
  PackageCheck,
  ShieldCheck,
} from 'lucide-react';
import { STORE_INFO } from '@/lib/data';
import { useStore } from '@/context/StoreContext';

export default function Footer() {
  const { showToast, applyCoupon } = useStore();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      showToast('Please enter a valid email address.');
      return;
    }
    setSubscribed(true);
    applyCoupon('FIRST10');
    showToast('Subscribed! Code FIRST10 (10% Off) applied to your cart.');
    setEmail('');
  };

  return (
    <footer className="mt-16">
      {/* 4-Item Trust Bar */}
      <div className="bg-white border-t border-slate-200">
        <div className="max-w-[1320px] mx-auto px-4 py-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex flex-col items-center text-center gap-2">
            <HandCoins className="w-7 h-7 text-[#7B3CA1]" strokeWidth={1.6} aria-hidden="true" />
            <p className="text-sm font-bold text-[#082A66]">30-Day Money Back</p>
          </div>
          <div className="flex flex-col items-center text-center gap-2">
            <CalendarCheck className="w-7 h-7 text-[#7B3CA1]" strokeWidth={1.6} aria-hidden="true" />
            <p className="text-sm font-bold text-[#082A66]">2-Year Warranty</p>
          </div>
          <div className="flex flex-col items-center text-center gap-2">
            <PackageCheck className="w-7 h-7 text-[#7B3CA1]" strokeWidth={1.6} aria-hidden="true" />
            <p className="text-sm font-bold text-[#082A66]">Free Shipping over $20</p>
          </div>
          <div className="flex flex-col items-center text-center gap-2">
            <ShieldCheck className="w-7 h-7 text-[#7B3CA1]" strokeWidth={1.6} aria-hidden="true" />
            <p className="text-sm font-bold text-[#082A66]">Secure Payment</p>
          </div>
        </div>
      </div>

      {/* Main Dark Navy Footer */}
      <div className="bg-[#082A66] text-white relative">
        <div className="max-w-[1320px] mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
          {/* Brand Contact Info */}
          <div className="lg:col-span-4 space-y-3">
            <Link href="/" className="text-2xl font-bold tracking-tight text-white inline-block">
              Xmedcar
            </Link>
            <p className="text-xs text-white/75">24/7 Support Center:</p>
            <p className="text-lg font-bold text-white tabular-nums">{STORE_INFO.phone}</p>
            <p className="text-xs text-white/75">{STORE_INFO.address}</p>
            <p className="text-xs text-white/75">{STORE_INFO.email}</p>
          </div>

          {/* Company Column */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-2.5 text-xs text-white/75">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition-colors">
                  Latest News
                </Link>
              </li>
              <li>
                <Link href="/faqs" className="hover:text-white transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Account Column */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-white mb-4">Account</h3>
            <ul className="space-y-2.5 text-xs text-white/75">
              <li>
                <Link href="/account" className="hover:text-white transition-colors">
                  My Account
                </Link>
              </li>
              <li>
                <Link href="/account?tab=orders" className="hover:text-white transition-colors">
                  Orders
                </Link>
              </li>
              <li>
                <Link href="/account?tab=prescriptions" className="hover:text-white transition-colors">
                  Prescription Orders
                </Link>
              </li>
              <li>
                <Link href="/account?tab=subscriptions" className="hover:text-white transition-colors">
                  Medicine Subscriptions
                </Link>
              </li>
              <li>
                <Link href="/account?tab=wishlist" className="hover:text-white transition-colors">
                  Wish List
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div className="lg:col-span-4">
            <h3 className="text-sm font-semibold text-white mb-2">Join Our Newsletter</h3>
            <p className="text-xs text-white/75 mb-4">
              Join our newsletter &amp; get 10% off your first order.
            </p>
            <form onSubmit={handleNewsletter} className="relative max-w-sm">
              <label htmlFor="footer-newsletter-email" className="sr-only">
                Email Address
              </label>
              <input
                id="footer-newsletter-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your e-mail"
                className="w-full bg-[#173D7D] border border-white/15 rounded-full py-2.5 pl-4 pr-12 text-xs text-white placeholder:text-white/60 focus:outline-none focus:border-white/50"
              />
              <button
                type="submit"
                aria-label="Subscribe to newsletter"
                className="absolute right-1 top-1 w-8 h-8 rounded-full bg-white text-[#082A66] hover:bg-purple-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </form>
            {subscribed && (
              <p className="mt-2 text-xs text-emerald-300">
                Code <span className="font-mono font-bold">FIRST10</span> activated for 10% off.
              </p>
            )}
          </div>
        </div>

        {/* Bottom Copyright & Payment Icons */}
        <div className="border-t border-white/10">
          <div className="max-w-[1320px] mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/70">
            <p>©2026 Xmedcar. All Rights Reserved.</p>
            <div className="flex items-center gap-2">
              {['Apple Pay', 'G Pay', 'VISA', 'Mastercard', 'Shop Pay'].map((pm) => (
                <span
                  key={pm}
                  className="bg-white text-[#082A66] font-semibold text-[10px] px-2 py-0.5 rounded"
                >
                  {pm}
                </span>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Scroll to top"
          className="hidden sm:flex absolute right-6 bottom-16 w-9 h-9 rounded-full bg-white text-[#082A66] shadow-md items-center justify-center hover:bg-purple-50 transition-colors cursor-pointer"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      </div>
    </footer>
  );
}
