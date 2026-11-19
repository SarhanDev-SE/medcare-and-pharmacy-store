'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Quote, Share2, Star } from 'lucide-react';
import { BLOG_POSTS } from '@/lib/data';
import { useStore } from '@/context/StoreContext';

export default function BlogSinglePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { showToast } = useStore();

  const currentIdx = Math.max(
    0,
    BLOG_POSTS.findIndex((p) => p.slug === slug)
  );
  const post = BLOG_POSTS[currentIdx] ?? BLOG_POSTS[0];
  const prevPost = BLOG_POSTS[(currentIdx - 1 + BLOG_POSTS.length) % BLOG_POSTS.length];
  const nextPost = BLOG_POSTS[(currentIdx + 1) % BLOG_POSTS.length];

  const [reviews, setReviews] = useState(post.reviews);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) {
      showToast('Please enter your name and comment.');
      return;
    }
    setReviews((prev) => [
      {
        id: `b-rev-${Date.now()}`,
        author: name.trim(),
        rating,
        date: 'Just now',
        comment: comment.trim(),
      },
      ...prev,
    ]);
    setName('');
    setEmail('');
    setComment('');
    showToast('Thank you! Your comment has been posted.');
  };

  return (
    <div className="bg-white">
      <div className="max-w-[1320px] mx-auto px-4 pt-6 pb-4 flex items-center justify-between">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link href="/" className="hover:text-[#7B3CA1]">Home</Link>
          <span>›</span>
          <Link href="/blog" className="hover:text-[#7B3CA1]">Blogs</Link>
          <span>›</span>
          <span className="text-slate-800 font-medium truncate max-w-[260px]">{post.title}</span>
        </nav>
        <div className="flex items-center gap-2 text-slate-500">
          <Link href={`/blog/${prevPost.slug}`} aria-label="Previous article" className="p-1 hover:text-[#7B3CA1]">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <Link href={`/blog/${nextPost.slug}`} aria-label="Next article" className="p-1 hover:text-[#7B3CA1]">
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Article Header & Hero */}
      <article className="max-w-4xl mx-auto px-4 pb-12">
        <header className="text-center space-y-3 mb-8">
          <p className="text-xs font-bold uppercase tracking-wider text-[#7B3CA1]">
            {post.category}
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#082A66] leading-tight text-balance">
            {post.title}
          </h1>
          <p className="text-xs text-slate-500">
            {post.date} <span className="mx-1.5">|</span> by {post.author}
          </p>
        </header>

        <div className="rounded-2xl overflow-hidden bg-slate-100 aspect-[16/9] mb-8">
          <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
        </div>

        {/* Prose Body */}
        <div className="space-y-5 text-sm sm:text-base text-slate-600 leading-relaxed">
          {post.bodyParagraphs.map((para, i) => (
            <p key={i}>{para}</p>
          ))}

          {/* Pull Quote (without thick left border per design constitution) */}
          <blockquote className="bg-[#FAF8FC] border border-purple-100 rounded-2xl p-6 sm:p-8 flex items-start justify-between gap-4 my-6">
            <p className="text-base sm:text-lg font-bold text-[#082A66] leading-snug">
              {post.quote}
            </p>
            <Quote className="w-7 h-7 text-[#7B3CA1] shrink-0" />
          </blockquote>

          {/* 2-Image Gallery */}
          {post.gallery.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
              {post.gallery.map((gImg, i) => (
                <div key={i} className="rounded-2xl overflow-hidden bg-slate-100 aspect-[4/3]">
                  <img src={gImg} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          <h2 className="text-xl font-bold text-[#082A66] pt-2">{post.subheading}</h2>
          {post.subheadingParagraphs.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        {/* Tags + Share */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-y border-slate-200 py-5 my-8">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-xs font-bold text-[#082A66]">Tag:</span>
            {post.tags.map((t) => (
              <Link
                key={t}
                href="/blog"
                className="px-3 py-1 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-600 hover:border-[#7B3CA1] hover:text-[#7B3CA1]"
              >
                {t}
              </Link>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              if (typeof navigator !== 'undefined' && navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href).catch(() => {});
              }
              showToast('Article link copied to clipboard.');
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#082A66] hover:text-[#7B3CA1] cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            Share This Post
          </button>
        </div>

        {/* Prev / Next Navigation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-200 pb-8 mb-10">
          <Link href={`/blog/${prevPost.slug}`} className="group">
            <p className="text-[11px] uppercase tracking-wider text-slate-400">Previous</p>
            <p className="text-sm font-bold text-[#082A66] group-hover:text-[#7B3CA1] mt-1">
              {prevPost.title}
            </p>
          </Link>
          <Link href={`/blog/${nextPost.slug}`} className="group sm:text-right">
            <p className="text-[11px] uppercase tracking-wider text-slate-400">Next</p>
            <p className="text-sm font-bold text-[#082A66] group-hover:text-[#7B3CA1] mt-1">
              {nextPost.title}
            </p>
          </Link>
        </div>

        {/* Customer Reviews & Write a Review */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-[#082A66]">Customer Reviews</h2>
          {reviews.length === 0 ? (
            <p className="text-xs text-slate-500">No comments yet. Share your thoughts below.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="border-b border-slate-100 pb-4 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#082A66]">{r.author}</span>
                    <span className="text-[11px] text-slate-400">{r.date}</span>
                  </div>
                  <div className="flex items-center text-amber-400">
                    {Array.from({ length: r.rating }).map((_, idx) => (
                      <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{r.comment}</p>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleReviewSubmit} className="pt-4 space-y-4">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-bold text-[#082A66]">Write a review:</h3>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-label={`Rate ${n} stars`}
                    onClick={() => setRating(n)}
                    className={`cursor-pointer ${n <= rating ? 'text-amber-400' : 'text-slate-300'}`}
                  >
                    <Star className="w-4 h-4 fill-current" />
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="blog-rev-name" className="block text-xs font-semibold text-[#082A66] mb-1">
                  Your Name *
                </label>
                <input
                  id="blog-rev-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Smith"
                  className="w-full border border-slate-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-[#7B3CA1]"
                />
              </div>
              <div>
                <label htmlFor="blog-rev-email" className="block text-xs font-semibold text-[#082A66] mb-1">
                  Your Email *
                </label>
                <input
                  id="blog-rev-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email (private)"
                  className="w-full border border-slate-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-[#7B3CA1]"
                />
              </div>
            </div>
            <div>
              <label htmlFor="blog-rev-body" className="block text-xs font-semibold text-[#082A66] mb-1">
                Your Review *
              </label>
              <textarea
                id="blog-rev-body"
                rows={4}
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write your comment here"
                className="w-full border border-slate-200 rounded-lg px-3.5 py-2 text-sm focus:outline-none focus:border-[#7B3CA1]"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-[#7B3CA1] hover:bg-[#662F87] text-white text-xs font-semibold cursor-pointer"
            >
              Post Comment
            </button>
          </form>
        </section>
      </article>

      {/* Related Health Insights */}
      <section className="max-w-[1320px] mx-auto px-4 py-10 border-t border-slate-200">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-[#082A66]">Health Insights &amp; Wellness Tips</h2>
          <p className="text-xs text-slate-500 mt-1">
            Practical advice and strategies to improve your daily health effectively.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {BLOG_POSTS.filter((p) => p.id !== post.id)
            .slice(0, 3)
            .map((rel) => (
              <Link key={rel.id} href={`/blog/${rel.slug}`} className="group block">
                <div className="rounded-2xl overflow-hidden bg-slate-100 aspect-[4/3] mb-3">
                  <img
                    src={rel.image}
                    alt={rel.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <p className="text-[11px] font-semibold uppercase text-[#7B3CA1]">
                  {rel.category} · {rel.date}
                </p>
                <h3 className="text-sm font-bold text-[#082A66] group-hover:text-[#7B3CA1] mt-1">
                  {rel.title}
                </h3>
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}
