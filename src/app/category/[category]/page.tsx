import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAllPosts } from '@/lib/notion';
import PostCard from '@/components/PostCard';
import { ArrowLeft, Layers } from 'lucide-react';

interface CategoryPageProps {
  params: Promise<{
    category: string;
  }>;
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  const categories = new Set<string>();
  posts.forEach((p) => {
    if (p.category?.name) categories.add(p.category.name);
  });
  return Array.from(categories).map((c) => ({
    category: encodeURIComponent(c),
  }));
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const decodedCategory = decodeURIComponent(category);
  const posts = await getAllPosts();

  const matchingPosts = posts.filter(
    (p) => p.category?.name.toLowerCase() === decodedCategory.toLowerCase()
  );

  if (matchingPosts.length === 0) {
    notFound();
  }

  return (
    <div className="space-y-10 py-6">
      {/* Navigation */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white transition-colors group mb-6"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to All Articles</span>
        </Link>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400">
            <Layers className="w-4 h-4" />
            <span>Topic Category</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {decodedCategory}
          </h1>
          <p className="text-sm text-zinc-400 font-mono">
            {matchingPosts.length} {matchingPosts.length === 1 ? 'article' : 'articles'} published under this category
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {matchingPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}

