'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import Breadcrumbs from '@/components/Breadcrumbs';

const BLOG_CATEGORIES = [
  { name: 'Vitamins & Supplements', count: 112 },
  { name: 'Stress & Mood Support', count: 32 },
  { name: 'Immunity Boosting', count: 42 },
  { name: 'Energy & Vitality', count: 65 },
  { name: 'Daily Wellness Essentials', count: 13 },
];

const POPULAR_TAGS = [
  'VITAMINS',
  'ENERGY',
  'BALANCE',
  'RELAX',
  'IMMUNITY',
  'CALM',
  'BOOST',
  'WELLNESS',
  'HEALTH',
  'DAILY',
  'FOCUS',
];

export default function BlogListPage() {
  const { blogs } = useStore();
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const filteredPosts = useMemo(() => {
    return blogs.filter((post) => {
      if (selectedTag && !post.tags.includes(selectedTag)) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          post.title.toLowerCase().includes(q) ||
          post.excerpt.toLowerCase().includes(q) ||
          post.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [blogs, search, selectedTag]);

  const pageSize = 3;
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / pageSize));
  const visiblePosts = filteredPosts.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="bg-white">
      <Breadcrumbs
        items={[{ label: 'Home', href: '/' }, { label: 'Latest News' }]}
        title="Latest News"
        subtitle="Clinical guidance, preventive wellness tips, and supplement insights from our licensed pharmacy team."
      />

      <section className="max-w-[1320px] mx-auto px-4 py-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Main Blog Feed */}
          <div className="lg:col-span-8 space-y-10">
            {visiblePosts.length === 0 ? (
              <div className="border border-slate-200 rounded-2xl p-10 text-center space-y-3">
                <p className="text-base font-bold text-[#082A66]">No articles match your filter</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setSelectedTag(null);
                  }}
                  className="px-5 py-2 rounded-full bg-[#7B3CA1] text-white text-xs font-semibold cursor-pointer"
                >
                  Clear Filter
                </button>
              </div>
            ) : (
              visiblePosts.map((post) => (
                <article key={post.id} className="group space-y-3.5">
                  <Link href={`/blog/${post.slug}`} className="block relative rounded-2xl overflow-hidden bg-slate-100 aspect-[16/9]">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                    />
                  </Link>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#7B3CA1]">
                    {post.category} · {post.date} · by {post.author}
                  </p>
                  <h2 className="text-2xl font-bold text-[#082A66] group-hover:text-[#7B3CA1] transition-colors">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed">{post.excerpt}</p>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-block text-xs font-bold text-[#082A66] underline underline-offset-4 hover:text-[#7B3CA1]"
                  >
                    Read More
                  </Link>
                </article>
              ))
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2 pt-2">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pNum = idx + 1;
                  return (
                    <button
                      key={pNum}
                      type="button"
                      onClick={() => setPage(pNum)}
                      className={`w-9 h-9 rounded-lg text-xs font-bold tabular-nums cursor-pointer ${
                        page === pNum
                          ? 'bg-[#7B3CA1] text-white'
                          : 'border border-slate-200 text-[#082A66] hover:border-[#7B3CA1]'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <aside className="lg:col-span-4 space-y-8">
            <div className="relative">
              <label htmlFor="blog-search" className="sr-only">
                Search blog articles
              </label>
              <input
                id="blog-search"
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search..."
                className="w-full border border-slate-200 rounded-xl py-2.5 pl-4 pr-10 text-sm focus:outline-none focus:border-[#7B3CA1]"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#082A66] mb-3">Categories</h3>
              <ul className="space-y-2.5 text-xs">
                {BLOG_CATEGORIES.map((cat) => (
                  <li key={cat.name} className="flex items-center justify-between text-slate-600">
                    <button
                      type="button"
                      onClick={() => setSearch(cat.name.split(' ')[0])}
                      className="hover:text-[#7B3CA1] font-medium cursor-pointer"
                    >
                      {cat.name}
                    </button>
                    <span className="text-slate-400 tabular-nums">({cat.count})</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#082A66] mb-3">Recent Posts</h3>
              <div className="space-y-4">
                {blogs.map((p) => (
                  <Link
                    key={p.id}
                    href={`/blog/${p.slug}`}
                    className="flex items-center gap-3 group"
                  >
                    <img
                      src={p.image}
                      alt={p.title}
                      className="w-16 h-16 rounded-lg object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#082A66] group-hover:text-[#7B3CA1] line-clamp-2 leading-snug">
                        {p.title}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {p.date} · by {p.author}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#082A66] mb-3">Popular Tag</h3>
              <div className="flex flex-wrap gap-2">
                {POPULAR_TAGS.map((tag) => {
                  const active = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setSelectedTag(active ? null : tag);
                        setPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-lg border text-[11px] font-semibold tracking-wide transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#7B3CA1] border-[#7B3CA1] text-white'
                          : 'border-slate-200 text-[#082A66] hover:border-[#7B3CA1]'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
