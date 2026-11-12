'use client';

import React, { useState, useMemo } from 'react';
import { BlogPost, NotionColor } from '@/types/blog';
import PostCard from './PostCard';
import { Search, X, SlidersHorizontal, Layers, Sparkles, Filter } from 'lucide-react';
import { getNotionColorStyles } from '@/lib/utils';

interface BlogListingClientProps {
  initialPosts: BlogPost[];
}

export default function BlogListingClient({ initialPosts }: BlogListingClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Compute unique categories and counts
  const categories = useMemo(() => {
    const map = new Map<string, { count: number; color?: string }>();
    initialPosts.forEach((post) => {
      if (post.category?.name) {
        const existing = map.get(post.category.name) || { count: 0, color: post.category.color };
        map.set(post.category.name, { count: existing.count + 1, color: post.category.color });
      }
    });
    return Array.from(map.entries()).map(([name, data]) => ({
      name,
      count: data.count,
      color: data.color,
    }));
  }, [initialPosts]);

  // Compute unique tags
  const tags = useMemo(() => {
    const set = new Set<string>();
    initialPosts.forEach((post) => {
      post.tags?.forEach((t) => set.add(t.name));
    });
    return Array.from(set).sort();
  }, [initialPosts]);

  // Filter posts
  const filteredPosts = useMemo(() => {
    return initialPosts.filter((post) => {
      // Category filter
      if (selectedCategory !== 'all' && post.category?.name !== selectedCategory) {
        return false;
      }

      // Tag filter
      if (selectedTag !== 'all' && !post.tags?.some((t) => t.name === selectedTag)) {
        return false;
      }

      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = post.title.toLowerCase().includes(q);
        const inSummary = post.summary.toLowerCase().includes(q);
        const inCategory = post.category?.name.toLowerCase().includes(q);
        const inTags = post.tags?.some((t) => t.name.toLowerCase().includes(q));
        if (!inTitle && !inSummary && !inCategory && !inTags) {
          return false;
        }
      }

      return true;
    });
  }, [initialPosts, searchQuery, selectedCategory, selectedTag]);

  const hasActiveFilter = searchQuery !== '' || selectedCategory !== 'all' || selectedTag !== 'all';
  const featuredPost = !hasActiveFilter && filteredPosts.length > 0 ? filteredPosts[0] : null;
  const regularPosts = featuredPost ? filteredPosts.slice(1) : filteredPosts;

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedTag('all');
  };

  return (
    <div className="space-y-12">
      {/* Search and Filter Section */}
      <div id="categories" className="space-y-6 pt-4">
        {/* Search Input Bar */}
        <div className="relative max-w-2xl mx-auto">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guides by keywords (e.g. Active Directory, GPO, Ubuntu, Outlook)..."
              className="w-full pl-12 pr-10 py-3.5 bg-zinc-900/90 border border-zinc-800 rounded-2xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 text-zinc-400 hover:text-white"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 border ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20'
                : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-800'
            }`}
          >
            <span>All Articles</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                selectedCategory === 'all' ? 'bg-indigo-700 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {initialPosts.length}
            </span>
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(isSelected ? 'all' : cat.name)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-zinc-200 text-zinc-950 border-white shadow-lg'
                    : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800'
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    isSelected ? 'bg-zinc-400 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Filters Bar / Results Count */}
        <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-white font-mono">{filteredPosts.length}</strong> of{' '}
              <span className="font-mono">{initialPosts.length}</span> published guides
            </span>
            {hasActiveFilter && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Filtered
              </span>
            )}
          </div>

          {hasActiveFilter && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors underline underline-offset-4"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset all filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Featured Post (Displayed when no active search/category filter) */}
      {featuredPost && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400">
            <Sparkles className="w-4 h-4" />
            <span>Latest Publication</span>
          </div>
          <PostCard post={featuredPost} featured={true} />
        </section>
      )}

      {/* Posts Grid */}
      {regularPosts.length > 0 ? (
        <section className="space-y-4">
          {featuredPost && (
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-400 pt-6">
              <Layers className="w-4 h-4" />
              <span>Recent Articles &amp; Walkthroughs</span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      ) : (
        /* Empty State */
        <div className="py-20 text-center space-y-4 border border-dashed border-zinc-800 rounded-3xl p-8 bg-zinc-950/50">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">No articles match your criteria</h3>
          <p className="text-sm text-zinc-400 max-w-sm mx-auto">
            Try adjusting your search query or reset the filters to see all available tutorials.
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}

