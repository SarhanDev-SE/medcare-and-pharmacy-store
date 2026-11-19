'use client';

import React, { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { PRODUCTS, SUBCATEGORY_BADGES } from '@/lib/data';
import { filterAndSortProducts } from '@/lib/store-logic';
import type { FilterState } from '@/lib/types';
import Breadcrumbs from '@/components/Breadcrumbs';
import FilterSidebar from '@/components/FilterSidebar';
import ProductCard from '@/components/ProductCard';

const PAGE_SIZE = 9;

function ShopCatalogBody({
  initialCat,
  initialSub,
  initialQ,
  initialDeals,
}: {
  initialCat: string | null;
  initialSub: string | null;
  initialQ: string;
  initialDeals: string | null;
}) {
  const [filters, setFilters] = useState<FilterState>({
    categories: initialCat ? [initialCat] : [],
    subcategory: initialSub || null,
    minPrice: 0,
    maxPrice: 150,
    availability: ['in-stock'],
    brands: [],
    colors: [],
    search: initialQ,
    sort: 'best-selling',
  });

  const [viewMode, setViewMode] = useState<'list' | 'grid-3' | 'grid-4'>('grid-3');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);

  const filteredProducts = useMemo(() => {
    let res = filterAndSortProducts(PRODUCTS, filters);
    if (initialDeals === '1') {
      res = res.filter((p) => Boolean(p.discountPercent));
    }
    return res;
  }, [filters, initialDeals]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const paginatedProducts = filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const inStockCount = PRODUCTS.filter((p) => p.inStock).length;
  const outOfStockCount = PRODUCTS.filter((p) => !p.inStock).length;

  const activePills: { key: string; label: string; onRemove: () => void }[] = [];
  filters.categories.forEach((cat) =>
    activePills.push({
      key: `cat-${cat}`,
      label: cat,
      onRemove: () =>
        setFilters((f) => ({ ...f, categories: f.categories.filter((c) => c !== cat) })),
    })
  );
  if (filters.subcategory) {
    activePills.push({
      key: `sub-${filters.subcategory}`,
      label: filters.subcategory,
      onRemove: () => setFilters((f) => ({ ...f, subcategory: null })),
    });
  }
  if (filters.minPrice > 0 || filters.maxPrice < 150) {
    activePills.push({
      key: 'price',
      label: `$${filters.minPrice} - $${filters.maxPrice}`,
      onRemove: () => setFilters((f) => ({ ...f, minPrice: 0, maxPrice: 150 })),
    });
  }
  filters.brands.forEach((b) =>
    activePills.push({
      key: `brand-${b}`,
      label: b,
      onRemove: () =>
        setFilters((f) => ({ ...f, brands: f.brands.filter((x) => x !== b) })),
    })
  );
  filters.colors.forEach((c) =>
    activePills.push({
      key: `color-${c}`,
      label: c,
      onRemove: () =>
        setFilters((f) => ({ ...f, colors: f.colors.filter((x) => x !== c) })),
    })
  );
  if (filters.search) {
    activePills.push({
      key: 'search',
      label: `Search: "${filters.search}"`,
      onRemove: () => setFilters((f) => ({ ...f, search: '' })),
    });
  }

  const clearAllFilters = () => {
    setFilters({
      categories: [],
      subcategory: null,
      minPrice: 0,
      maxPrice: 150,
      availability: [],
      brands: [],
      colors: [],
      search: '',
      sort: 'best-selling',
    });
    setPage(1);
  };

  const pageTitle =
    filters.subcategory ||
    filters.categories[0] ||
    (initialDeals === '1' ? 'Special Offers & Deals' : 'All Pharmacy & Wellness Products');

  const pageSubtitle =
    filters.subcategory || filters.categories[0]
      ? `Explore curated ${pageTitle.toLowerCase()} essentials formulated for daily support and relief.`
      : 'Browse pharmacist-vetted prescriptions, supplements, medical devices, and daily wellness essentials.';

  return (
    <div className="bg-white">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Shops', href: '/shop' },
          { label: pageTitle },
        ]}
        title={pageTitle}
        subtitle={pageSubtitle}
      />

      {/* Circular Subcategory Badge Carousel (Screen 07) */}
      <section className="max-w-[1320px] mx-auto px-4 py-4">
        <div className="flex items-center gap-5 overflow-x-auto pb-2">
          {SUBCATEGORY_BADGES.map((badge) => {
            const isSelected = filters.subcategory === badge.label;
            return (
              <button
                key={badge.id}
                type="button"
                onClick={() => {
                  if (badge.isPromo) {
                    setFilters((f) => ({ ...f, sort: 'best-selling', subcategory: null }));
                  } else {
                    setFilters((f) => ({
                      ...f,
                      subcategory: isSelected ? null : badge.label,
                    }));
                  }
                  setPage(1);
                }}
                className="flex flex-col items-center text-center shrink-0 group cursor-pointer"
              >
                <div
                  className={`w-28 h-28 rounded-full flex items-center justify-center mb-2.5 border-2 transition-all ${
                    badge.isPromo
                      ? 'bg-[#C93B3B] border-[#C93B3B] text-white'
                      : isSelected
                        ? 'bg-[#F5F0FA] border-[#7B3CA1]'
                        : 'bg-[#F4F5F8] border-transparent group-hover:border-[#7B3CA1]'
                  }`}
                >
                  {badge.isPromo ? (
                    <div className="leading-none">
                      <p className="text-2xl font-extrabold">15%</p>
                      <p className="text-xs font-bold tracking-wider mt-0.5">OFF</p>
                    </div>
                  ) : (
                    <img
                      src={badge.image}
                      alt={badge.label}
                      className="w-20 h-20 object-contain mix-blend-multiply group-hover:scale-105 transition-transform"
                    />
                  )}
                </div>
                <p
                  className={`text-xs font-bold ${
                    badge.isPromo
                      ? 'text-[#C93B3B]'
                      : isSelected
                        ? 'text-[#7B3CA1]'
                        : 'text-[#082A66]'
                  }`}
                >
                  {badge.label}
                </p>
                <p
                  className={`text-[11px] tabular-nums ${
                    badge.isPromo ? 'text-[#C93B3B]' : 'text-slate-400'
                  }`}
                >
                  {badge.count} Products
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Catalog Area */}
      <section className="max-w-[1320px] mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Desktop Left Filter Sidebar (Screen 06) */}
          {sidebarVisible && (
            <aside className="hidden lg:block w-64 shrink-0 bg-white">
              <FilterSidebar
                filters={filters}
                onChange={(next) => {
                  setFilters(next);
                  setPage(1);
                }}
                inStockCount={inStockCount}
                outOfStockCount={outOfStockCount}
              />
            </aside>
          )}

          {/* Right Product Grid / List Column */}
          <div className="flex-1 min-w-0 w-full">
            {/* Toolbar */}
            <div className="bg-[#F4F5F8] rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                {/* Mobile Drawer Trigger / Desktop Toggle */}
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="lg:hidden inline-flex items-center gap-2 text-xs font-semibold text-[#082A66] hover:text-[#7B3CA1] cursor-pointer"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Show Filters
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (sidebarVisible) {
                      setSidebarVisible(false);
                    } else {
                      setSidebarVisible(true);
                    }
                  }}
                  className="hidden lg:inline-flex items-center gap-2 text-xs font-semibold text-[#082A66] hover:text-[#7B3CA1] cursor-pointer"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  {sidebarVisible ? 'Hide Filters' : 'Show Filters'}
                </button>

                {!sidebarVisible && (
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(true)}
                    className="hidden lg:inline-flex items-center gap-1.5 text-xs font-semibold text-[#7B3CA1] hover:underline cursor-pointer"
                  >
                    Open Filter Drawer
                  </button>
                )}
              </div>

              {/* View Switcher (List / 3-col / 4-col) */}
              <div className="flex items-center gap-1.5" role="group" aria-label="Product view layout">
                <button
                  type="button"
                  aria-label="List view"
                  aria-pressed={viewMode === 'list'}
                  onClick={() => setViewMode('list')}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-[#7B3CA1] text-white'
                      : 'bg-white text-slate-600 hover:text-[#082A66]'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="3 column grid view"
                  aria-pressed={viewMode === 'grid-3'}
                  onClick={() => setViewMode('grid-3')}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                    viewMode === 'grid-3'
                      ? 'bg-[#7B3CA1] text-white'
                      : 'bg-white text-slate-600 hover:text-[#082A66]'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="4 column compact grid view"
                  aria-pressed={viewMode === 'grid-4'}
                  onClick={() => setViewMode('grid-4')}
                  className={`hidden md:flex w-8 h-8 rounded-lg items-center justify-center text-[11px] font-bold transition-colors cursor-pointer ${
                    viewMode === 'grid-4'
                      ? 'bg-[#7B3CA1] text-white'
                      : 'bg-white text-slate-600 hover:text-[#082A66]'
                  }`}
                >
                  4×
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <label htmlFor="catalog-sort" className="sr-only">
                  Sort products
                </label>
                <select
                  id="catalog-sort"
                  value={filters.sort}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      sort: e.target.value as FilterState['sort'],
                    }))
                  }
                  className="bg-transparent text-xs font-semibold text-[#082A66] focus:outline-none cursor-pointer"
                >
                  <option value="best-selling">Best Selling</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="newest">Newest Arrivals</option>
                </select>
              </div>
            </div>

            {/* Applied Filter Pills + Clear All */}
            {activePills.length > 0 && (
              <div className="flex items-center flex-wrap gap-2 mb-5">
                {activePills.map((pill) => (
                  <button
                    key={pill.key}
                    type="button"
                    onClick={pill.onRemove}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs text-slate-700 hover:border-[#7B3CA1] cursor-pointer"
                  >
                    <X className="w-3 h-3 text-slate-400" />
                    <span>{pill.label}</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-red-300 text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  Clear All
                </button>
              </div>
            )}

            {/* Products Rendering */}
            {paginatedProducts.length === 0 ? (
              <div className="border border-slate-200 rounded-2xl p-12 text-center space-y-3">
                <p className="text-lg font-bold text-[#082A66]">No medicines match those filters</p>
                <p className="text-sm text-slate-500">
                  Try widening your price range or clearing a brand filter.
                </p>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="px-6 py-2.5 rounded-full bg-[#7B3CA1] text-white text-xs font-semibold cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : viewMode === 'list' ? (
              <div className="space-y-4">
                {paginatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} variant="list" />
                ))}
              </div>
            ) : (
              <div
                className={`grid gap-5 ${
                  viewMode === 'grid-4'
                    ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                }`}
              >
                {paginatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} variant="grid" />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-start gap-2 mt-8">
                <button
                  type="button"
                  disabled={page === 1}
                  aria-label="Previous page"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-40 hover:border-[#7B3CA1] cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pNum = i + 1;
                  return (
                    <button
                      key={pNum}
                      type="button"
                      onClick={() => setPage(pNum)}
                      className={`w-9 h-9 rounded-lg text-xs font-bold tabular-nums transition-colors cursor-pointer ${
                        page === pNum
                          ? 'bg-[#7B3CA1] text-white'
                          : 'border border-slate-200 text-[#082A66] hover:border-[#7B3CA1]'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
                <button
                  type="button"
                  disabled={page === totalPages}
                  aria-label="Next page"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-40 hover:border-[#7B3CA1] cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Off-Canvas Left Filter Drawer (Screen 09) */}
      {drawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Catalog Filters"
          className="fixed inset-0 z-50 flex bg-slate-900/45 backdrop-blur-xs"
        >
          <div className="bg-white w-80 max-w-[90vw] h-full overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-5">
              <h2 className="text-lg font-bold text-[#082A66]">Filters</h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close filters drawer"
                className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <FilterSidebar
              filters={filters}
              onChange={(next) => {
                setFilters(next);
                setPage(1);
              }}
              inStockCount={inStockCount}
              outOfStockCount={outOfStockCount}
              onApplyClose={() => setDrawerOpen(false)}
            />
          </div>
          <div className="flex-1" onClick={() => setDrawerOpen(false)} />
        </div>
      )}
    </div>
  );
}

function ShopCatalogInner() {
  const searchParams = useSearchParams();
  const initialCat = searchParams.get('category');
  const initialSub = searchParams.get('sub');
  const initialQ = searchParams.get('q') ?? '';
  const initialDeals = searchParams.get('deals');
  const filterKey = `${initialCat ?? ''}|${initialSub ?? ''}|${initialQ}|${initialDeals ?? ''}`;

  return (
    <ShopCatalogBody
      key={filterKey}
      initialCat={initialCat}
      initialSub={initialSub}
      initialQ={initialQ}
      initialDeals={initialDeals}
    />
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="max-w-[1320px] mx-auto px-4 py-12 text-sm text-slate-500">Loading catalog...</div>}>
      <ShopCatalogInner />
    </Suspense>
  );
}
