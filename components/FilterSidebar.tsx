'use client';

import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { BRANDS, TOP_CATEGORIES } from '@/lib/data';
import type { FilterState } from '@/lib/types';

interface FilterSidebarProps {
  filters: FilterState;
  onChange: (next: FilterState) => void;
  inStockCount: number;
  outOfStockCount: number;
  showColors?: boolean;
  onApplyClose?: () => void;
}

const COLOR_SWATCHES = [
  { id: 'purple', label: 'Purple', hex: '#7B3CA1' },
  { id: 'navy', label: 'Navy', hex: '#082A66' },
  { id: 'pink', label: 'Pink', hex: '#F472B6' },
  { id: 'yellow', label: 'Yellow', hex: '#FBBF24' },
  { id: 'green', label: 'Green', hex: '#10B981' },
  { id: 'orange', label: 'Orange', hex: '#F97316' },
];

export default function FilterSidebar({
  filters,
  onChange,
  inStockCount,
  outOfStockCount,
  showColors = true,
  onApplyClose,
}: FilterSidebarProps) {
  const [expandedCat, setExpandedCat] = React.useState<string>('Pharmacy Medicines');

  const toggleCategory = (catName: string) => {
    const exists = filters.categories.includes(catName);
    const nextCats = exists
      ? filters.categories.filter((c) => c !== catName)
      : [...filters.categories, catName];
    onChange({ ...filters, categories: nextCats });
  };

  const toggleAvailability = (val: 'in-stock' | 'out-of-stock') => {
    const exists = filters.availability.includes(val);
    const next = exists
      ? filters.availability.filter((a) => a !== val)
      : [...filters.availability, val];
    onChange({ ...filters, availability: next });
  };

  const toggleBrand = (brandName: string) => {
    const exists = filters.brands.includes(brandName);
    const next = exists
      ? filters.brands.filter((b) => b !== brandName)
      : [...filters.brands, brandName];
    onChange({ ...filters, brands: next });
  };

  const toggleColor = (colorId: string) => {
    const exists = filters.colors.includes(colorId);
    const next = exists
      ? filters.colors.filter((c) => c !== colorId)
      : [...filters.colors, colorId];
    onChange({ ...filters, colors: next });
  };

  return (
    <div className="space-y-6">
      {/* Product Categories */}
      <section className="border-b border-slate-200 pb-5">
        <h2 className="text-sm font-bold text-[#082A66] mb-3">Product Categories</h2>
        <div className="space-y-2">
          {TOP_CATEGORIES.slice(0, 7).map((cat) => {
            const checked = filters.categories.includes(cat.name);
            const isExpanded = expandedCat === cat.name;
            return (
              <div key={cat.id}>
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer hover:text-[#7B3CA1]">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCategory(cat.name)}
                      className="w-4 h-4 rounded border-slate-300 text-[#7B3CA1] focus:ring-[#7B3CA1] accent-[#7B3CA1]"
                    />
                    <span className={checked ? 'font-semibold text-[#7B3CA1]' : ''}>
                      {cat.name}
                    </span>
                  </label>
                  <button
                    type="button"
                    aria-label={`Toggle subcategories for ${cat.name}`}
                    onClick={() => setExpandedCat(isExpanded ? '' : cat.name)}
                    className="text-slate-400 hover:text-[#082A66] p-0.5 cursor-pointer"
                  >
                    {isExpanded ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {isExpanded && cat.subcategories.length > 0 && (
                  <div className="pl-6 mt-1.5 space-y-1">
                    {cat.subcategories.map((sub) => {
                      const activeSub = filters.subcategory === sub;
                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() =>
                            onChange({
                              ...filters,
                              subcategory: activeSub ? null : sub,
                            })
                          }
                          className={`block text-xs text-left py-0.5 cursor-pointer transition-colors ${
                            activeSub
                              ? 'font-semibold text-[#7B3CA1] underline'
                              : 'text-slate-500 hover:text-[#082A66]'
                          }`}
                        >
                          {sub}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Price Range */}
      <section className="border-b border-slate-200 pb-5">
        <h2 className="text-sm font-bold text-[#082A66] mb-3">Price</h2>
        <input
          type="range"
          min={0}
          max={150}
          value={filters.maxPrice}
          aria-label="Maximum price"
          onChange={(e) =>
            onChange({
              ...filters,
              maxPrice: Math.max(filters.minPrice + 5, Number(e.target.value)),
            })
          }
          className="w-full accent-[#7B3CA1] cursor-pointer mb-3"
        />
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="sr-only">Minimum price</span>
            <div className="flex items-center border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white">
              <span className="text-slate-400 mr-1">$</span>
              <input
                type="number"
                min={0}
                max={filters.maxPrice}
                value={filters.minPrice}
                onChange={(e) =>
                  onChange({ ...filters, minPrice: Math.max(0, Number(e.target.value) || 0) })
                }
                className="w-full focus:outline-none tabular-nums text-slate-800"
              />
            </div>
          </label>
          <label className="block">
            <span className="sr-only">Maximum price</span>
            <div className="flex items-center border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white">
              <span className="text-slate-400 mr-1">$</span>
              <input
                type="number"
                min={filters.minPrice}
                max={500}
                value={filters.maxPrice}
                onChange={(e) =>
                  onChange({ ...filters, maxPrice: Math.max(filters.minPrice, Number(e.target.value) || 150) })
                }
                className="w-full focus:outline-none tabular-nums text-slate-800"
              />
            </div>
          </label>
        </div>
      </section>

      {/* Colors */}
      {showColors && (
        <section className="border-b border-slate-200 pb-5">
          <h2 className="text-sm font-bold text-[#082A66] mb-3">Colors</h2>
          <div className="flex items-center flex-wrap gap-2.5">
            {COLOR_SWATCHES.map((c) => {
              const active = filters.colors.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleColor(c.id)}
                  aria-label={`Filter by ${c.label}`}
                  aria-pressed={active}
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                    active ? 'ring-2 ring-offset-2 ring-[#7B3CA1] scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Availability */}
      <section className="border-b border-slate-200 pb-5">
        <h2 className="text-sm font-bold text-[#082A66] mb-3">Availability</h2>
        <div className="space-y-2 text-sm text-slate-700">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.availability.includes('in-stock')}
              onChange={() => toggleAvailability('in-stock')}
              className="w-4 h-4 rounded border-slate-300 accent-[#7B3CA1]"
            />
            <span>In stock</span>
            <span className="text-xs text-slate-400 tabular-nums">({inStockCount})</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.availability.includes('out-of-stock')}
              onChange={() => toggleAvailability('out-of-stock')}
              className="w-4 h-4 rounded border-slate-300 accent-[#7B3CA1]"
            />
            <span>Out of stock</span>
            <span className="text-xs text-slate-400 tabular-nums">({outOfStockCount})</span>
          </label>
        </div>
      </section>

      {/* Brands */}
      <section className="pb-2">
        <h2 className="text-sm font-bold text-[#082A66] mb-3">Brands</h2>
        <div className="space-y-2 text-sm text-slate-700">
          {BRANDS.map((brand) => {
            const checked = filters.brands.includes(brand.name);
            return (
              <label key={brand.name} className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleBrand(brand.name)}
                  className="w-4 h-4 rounded border-slate-300 accent-[#7B3CA1]"
                />
                <span className={checked ? 'font-semibold text-[#7B3CA1]' : ''}>
                  {brand.name}
                </span>
                <span className="text-xs text-slate-400 tabular-nums">({brand.count})</span>
              </label>
            );
          })}
        </div>
      </section>

      {onApplyClose && (
        <button
          type="button"
          onClick={onApplyClose}
          className="w-full py-2.5 px-4 rounded-full bg-[#7B3CA1] hover:bg-[#662F87] text-white text-sm font-semibold transition-colors cursor-pointer"
        >
          Apply Filters
        </button>
      )}
    </div>
  );
}
