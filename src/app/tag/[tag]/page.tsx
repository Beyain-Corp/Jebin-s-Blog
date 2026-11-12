import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAllPosts } from '@/lib/notion';
import PostCard from '@/components/PostCard';
import { ArrowLeft, Tag as TagIcon } from 'lucide-react';

interface TagPageProps {
  params: Promise<{
    tag: string;
  }>;
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  const tags = new Set<string>();
  posts.forEach((p) => {
    p.tags?.forEach((t) => tags.add(t.name));
  });
  return Array.from(tags).map((t) => ({
    tag: encodeURIComponent(t),
  }));
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const posts = await getAllPosts();

  const matchingPosts = posts.filter((p) =>
    p.tags?.some((t) => t.name.toLowerCase() === decodedTag.toLowerCase())
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
            <TagIcon className="w-4 h-4" />
            <span>Tagged With</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            #{decodedTag}
          </h1>
          <p className="text-sm text-zinc-400 font-mono">
            {matchingPosts.length} {matchingPosts.length === 1 ? 'article' : 'articles'} with this tag
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

