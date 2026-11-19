'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronDown,
  FileText,
  Heart,
  Menu,
  Percent,
  Phone,
  Search,
  ShoppingBag,
  User,
  X,
} from 'lucide-react';
import { MEGA_MENU_COLUMNS, STORE_INFO, TOP_CATEGORIES } from '@/lib/data';
import { formatMoney } from '@/lib/store-logic';
import { useStore } from '@/context/StoreContext';
import type { CurrencyCode } from '@/lib/types';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    user,
    currency,
    setCurrency,
    language,
    setLanguage,
    cartSummary,
    wishlistIds,
    setCartDrawerOpen,
    setSearchOpen,
    setNewsletterOpen,
    openAuthModal,
    showToast,
  } = useStore();

  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [pagesMenuOpen, setPagesMenuOpen] = useState(false);
  const [categoryRailOpen, setCategoryRailOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedSearchCat, setSelectedSearchCat] = useState('All Categories');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set('q', searchTerm.trim());
    if (selectedSearchCat !== 'All Categories') params.set('category', selectedSearchCat);
    router.push(`/shop${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <header className="sticky top-0 z-40 bg-white shadow-xs">
      {/* Tier 1: Announcement Bar */}
      <div className="bg-[#082A66] text-white text-xs">
        <div className="max-w-[1320px] mx-auto px-4 h-9 flex items-center justify-between gap-4">
          <div className="hidden sm:flex items-center gap-4">
            <label className="sr-only" htmlFor="header-lang">Language</label>
            <select
              id="header-lang"
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'English' | 'Spanish' | 'French')}
              className="bg-transparent text-white/90 text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="English" className="text-slate-900">English</option>
              <option value="Spanish" className="text-slate-900">Español</option>
              <option value="French" className="text-slate-900">Français</option>
            </select>
            <span className="text-white/25" aria-hidden="true">|</span>
            <label className="sr-only" htmlFor="header-currency">Currency</label>
            <select
              id="header-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="bg-transparent text-white/90 text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="USD" className="text-slate-900">$ Dollar (US)</option>
              <option value="EUR" className="text-slate-900">€ Euro (EU)</option>
              <option value="GBP" className="text-slate-900">£ Pound (UK)</option>
            </select>
          </div>

          <div className="flex items-center justify-center gap-2 mx-auto sm:mx-0">
            <Percent className="w-3.5 h-3.5 text-purple-200 shrink-0" aria-hidden="true" />
            <span className="truncate">Enjoy 10% Off Your First Purchase! Use Code:</span>
            <button
              type="button"
              onClick={() => setNewsletterOpen(true)}
              className="border border-dashed border-white/60 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold tracking-wider hover:bg-white hover:text-[#082A66] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              FIRST10
            </button>
          </div>

          <div className="hidden md:flex items-center gap-3 text-white/80">
            <span className="whitespace-nowrap">24/7 Support: {STORE_INFO.phone}</span>
          </div>
        </div>
      </div>

      {/* Tier 2: Logo, Search & Actions */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-[1320px] mx-auto px-4 py-3.5 flex items-center justify-between gap-4 lg:gap-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link
              href="/"
              className="text-2xl font-bold tracking-tight text-[#082A66] whitespace-nowrap shrink-0"
            >
              Xmedcar
            </Link>
          </div>

          {/* Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-2xl items-center bg-[#F3F5F9] rounded-full border border-slate-200 focus-within:border-[#7B3CA1] focus-within:bg-white transition-colors p-1"
          >
            <label htmlFor="search-cat-select" className="sr-only">
              Search category
            </label>
            <select
              id="search-cat-select"
              value={selectedSearchCat}
              onChange={(e) => setSelectedSearchCat(e.target.value)}
              className="bg-[#082A66] text-white text-xs font-medium rounded-full px-4 py-2 focus:outline-none cursor-pointer shrink-0"
            >
              <option value="All Categories">All Categories</option>
              {TOP_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => {
                if (!searchTerm) setSearchOpen(true);
              }}
              placeholder="What are you looking for today?"
              aria-label="Search pharmacy products"
              className="flex-1 bg-transparent px-4 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Submit search"
              className="w-9 h-9 rounded-full bg-[#082A66] hover:bg-[#7B3CA1] text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Right User / Wishlist / Cart Actions */}
          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Open product search"
              className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <Search className="w-5 h-5" />
            </button>

            <Link
              href="/shop?sort=best-selling&deals=1"
              className="hidden xl:inline-flex items-center gap-1.5 bg-red-50 text-[#DC3545] hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <Percent className="w-3.5 h-3.5" aria-hidden="true" />
              Deals
            </Link>

            <div className="hidden xl:flex items-center gap-2 text-left border-r border-slate-200 pr-4">
              <Phone className="w-4 h-4 text-[#7B3CA1]" aria-hidden="true" />
              <div className="leading-tight">
                <p className="text-[11px] text-slate-500">Need help:</p>
                <p className="text-xs font-semibold text-[#082A66] tabular-nums">
                  {STORE_INFO.phone}
                </p>
              </div>
            </div>

            {user ? (
              <Link
                href="/account"
                className="flex items-center gap-1.5 text-slate-700 hover:text-[#7B3CA1] transition-colors text-xs font-medium whitespace-nowrap"
                aria-label="My Account"
              >
                <User className="w-5 h-5" />
                <span className="hidden sm:inline">{user.name}</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal('signin')}
                aria-label="Sign in to account"
                className="flex items-center gap-1.5 text-slate-700 hover:text-[#7B3CA1] transition-colors text-xs font-medium cursor-pointer whitespace-nowrap"
              >
                <User className="w-5 h-5" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}

            <Link
              href="/account?tab=wishlist"
              aria-label={`Wishlist (${wishlistIds.length} items)`}
              className="relative p-1 text-slate-700 hover:text-[#7B3CA1] transition-colors"
            >
              <Heart className="w-5 h-5" />
              {wishlistIds.length > 0 && (
                <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-[#7B3CA1] text-white text-[10px] font-semibold flex items-center justify-center tabular-nums">
                  {wishlistIds.length}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setCartDrawerOpen(true)}
              aria-label={`Open shopping cart (${cartSummary.itemCount} items)`}
              className="flex items-center gap-2 text-slate-800 hover:text-[#7B3CA1] transition-colors cursor-pointer"
            >
              <span className="relative p-1">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-[#082A66] text-white text-[10px] font-semibold flex items-center justify-center tabular-nums">
                  {cartSummary.itemCount}
                </span>
              </span>
              <span className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                  Cart Total
                </span>
                <span className="text-xs font-bold text-[#082A66] tabular-nums">
                  {formatMoney(cartSummary.total, currency)}
                </span>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Tier 3: Primary Nav Bar + Mega Menu */}
      <div className="hidden lg:block border-b border-slate-200 bg-white relative">
        <div className="max-w-[1320px] mx-auto px-4 h-12 flex items-center justify-between gap-6">
          <div className="flex items-center gap-7">
            {/* Shop By Category Trigger */}
            <div
              className="relative"
              onMouseEnter={() => setCategoryRailOpen(true)}
              onMouseLeave={() => setCategoryRailOpen(false)}
            >
              <button
                type="button"
                onClick={() => setCategoryRailOpen((v) => !v)}
                aria-expanded={categoryRailOpen}
                className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#082A66] hover:text-[#7B3CA1] py-2 cursor-pointer whitespace-nowrap"
              >
                <Menu className="w-4 h-4" />
                Shop By Category
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {categoryRailOpen && (
                <div className="absolute left-0 top-full w-64 bg-white border border-slate-200 rounded-b-xl shadow-lg py-2 z-50">
                  {TOP_CATEGORIES.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/shop?category=${encodeURIComponent(cat.name)}`}
                      onClick={() => setCategoryRailOpen(false)}
                      className="flex items-center justify-between px-4 py-2 text-sm text-slate-700 hover:bg-[#F5F0FA] hover:text-[#7B3CA1] transition-colors"
                    >
                      <span>{cat.name}</span>
                      {cat.badge && (
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            cat.badge === 'HOT'
                              ? 'bg-pink-100 text-pink-700'
                              : 'bg-cyan-100 text-cyan-800'
                          }`}
                        >
                          {cat.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Primary Nav Links */}
            <nav aria-label="Primary navigation" className="flex items-center gap-6 text-sm font-medium">
              <Link
                href="/"
                className={`py-3 transition-colors whitespace-nowrap shrink-0 ${
                  pathname === '/' ? 'text-[#7B3CA1] font-semibold' : 'text-slate-700 hover:text-[#7B3CA1]'
                }`}
              >
                Home
              </Link>

              <div
                className="static"
                onMouseEnter={() => setMegaMenuOpen(true)}
                onMouseLeave={() => setMegaMenuOpen(false)}
              >
                <Link
                  href="/shop"
                  className={`inline-flex items-center gap-1 py-3 transition-colors whitespace-nowrap shrink-0 ${
                    pathname.startsWith('/shop')
                      ? 'text-[#7B3CA1] font-semibold'
                      : 'text-slate-700 hover:text-[#7B3CA1]'
                  }`}
                >
                  Shops
                  <ChevronDown className="w-3.5 h-3.5" />
                </Link>

                {megaMenuOpen && (
                  <div className="absolute left-0 right-0 top-full bg-white border-t border-b border-slate-200 shadow-xl z-50">
                    <div className="max-w-[1320px] mx-auto px-6 py-7 grid grid-cols-6 gap-6">
                      {MEGA_MENU_COLUMNS.map((col) => (
                        <div key={col.title}>
                          <h3 className="text-xs font-bold text-[#082A66] uppercase tracking-wider mb-3">
                            {col.title}
                          </h3>
                          <ul className="space-y-2">
                            {col.links.map((item) => (
                              <li key={item.label}>
                                <Link
                                  href={`/shop?sub=${encodeURIComponent(item.query)}`}
                                  onClick={() => setMegaMenuOpen(false)}
                                  className="text-sm text-slate-600 hover:text-[#7B3CA1] hover:underline transition-colors"
                                >
                                  {item.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Link
                href="/product/gaia-herbs-relax-gummies"
                className={`py-3 transition-colors whitespace-nowrap shrink-0 ${
                  pathname.startsWith('/product')
                    ? 'text-[#7B3CA1] font-semibold'
                    : 'text-slate-700 hover:text-[#7B3CA1]'
                }`}
              >
                Products
              </Link>

              <Link
                href="/blog"
                className={`py-3 transition-colors whitespace-nowrap shrink-0 ${
                  pathname.startsWith('/blog')
                    ? 'text-[#7B3CA1] font-semibold'
                    : 'text-slate-700 hover:text-[#7B3CA1]'
                }`}
              >
                Blogs
              </Link>

              <div
                className="relative"
                onMouseEnter={() => setPagesMenuOpen(true)}
                onMouseLeave={() => setPagesMenuOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setPagesMenuOpen((v) => !v)}
                  className="inline-flex items-center gap-1 py-3 text-slate-700 hover:text-[#7B3CA1] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  Pages
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {pagesMenuOpen && (
                  <div className="absolute left-0 top-full w-48 bg-white border border-slate-200 rounded-b-xl shadow-lg py-2 z-50">
                    <Link
                      href="/about"
                      onClick={() => setPagesMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-[#F5F0FA] hover:text-[#7B3CA1]"
                    >
                      About Us
                    </Link>
                    <Link
                      href="/contact"
                      onClick={() => setPagesMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-[#F5F0FA] hover:text-[#7B3CA1]"
                    >
                      Contact Us
                    </Link>
                    <Link
                      href="/faqs"
                      onClick={() => setPagesMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-[#F5F0FA] hover:text-[#7B3CA1]"
                    >
                      FAQs
                    </Link>
                    <Link
                      href="/privacy-policy"
                      onClick={() => setPagesMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-[#F5F0FA] hover:text-[#7B3CA1]"
                    >
                      Privacy Policy & Terms
                    </Link>
                    <Link
                      href="/order-tracking"
                      onClick={() => setPagesMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-[#F5F0FA] hover:text-[#7B3CA1]"
                    >
                      Order Tracking
                    </Link>
                    <Link
                      href="/account?tab=compare"
                      onClick={() => setPagesMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-[#F5F0FA] hover:text-[#7B3CA1]"
                    >
                      Compare Products
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Right Quick Links + Order Via Prescription CTA */}
          <div className="flex items-center gap-5 shrink-0">
            <Link
              href="/order-tracking"
              className="text-xs font-medium text-slate-700 hover:text-[#7B3CA1] transition-colors whitespace-nowrap"
            >
              Order Tracking
            </Link>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  showToast('Viewing your recently browsed formulas');
                }
                setSearchOpen(true);
              }}
              className="text-xs font-medium text-slate-700 hover:text-[#7B3CA1] transition-colors cursor-pointer whitespace-nowrap"
            >
              Recently Viewed
            </button>
            <Link
              href="/order-prescription"
              className="inline-flex items-center gap-2 bg-[#7B3CA1] hover:bg-[#662F87] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <FileText className="w-3.5 h-3.5" aria-hidden="true" />
              Order Via Prescription
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <nav
            aria-label="Mobile navigation"
            className="relative w-80 max-w-[85vw] bg-white h-full overflow-y-auto p-5 flex flex-col gap-5 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xl font-bold text-[#082A66]">Xmedcar</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <Link
              href="/order-prescription"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 bg-[#7B3CA1] text-white text-sm font-semibold py-2.5 px-4 rounded-lg"
            >
              <FileText className="w-4 h-4" />
              Order Via Prescription
            </Link>

            <div className="flex flex-col divide-y divide-slate-100 text-sm font-medium text-slate-800">
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="py-3">
                Home
              </Link>
              <Link href="/shop" onClick={() => setMobileMenuOpen(false)} className="py-3">
                Shop All Medicines
              </Link>
              <Link href="/cart" onClick={() => setMobileMenuOpen(false)} className="py-3">
                Cart ({cartSummary.itemCount})
              </Link>
              <Link href="/account" onClick={() => setMobileMenuOpen(false)} className="py-3">
                My Account
              </Link>
              <Link href="/blog" onClick={() => setMobileMenuOpen(false)} className="py-3">
                Health Insights Blog
              </Link>
              <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="py-3">
                About Us
              </Link>
              <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="py-3">
                Contact Us
              </Link>
              <Link href="/faqs" onClick={() => setMobileMenuOpen(false)} className="py-3">
                FAQs
              </Link>
              <Link href="/privacy-policy" onClick={() => setMobileMenuOpen(false)} className="py-3">
                Privacy Policy
              </Link>
              <Link href="/order-tracking" onClick={() => setMobileMenuOpen(false)} className="py-3">
                Order Tracking
              </Link>
            </div>

            <div className="mt-auto pt-4 border-t border-slate-200">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Categories
              </p>
              <div className="flex flex-col gap-1.5">
                {TOP_CATEGORIES.slice(0, 6).map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/shop?category=${encodeURIComponent(cat.name)}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xs text-slate-600 py-1 hover:text-[#7B3CA1]"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
