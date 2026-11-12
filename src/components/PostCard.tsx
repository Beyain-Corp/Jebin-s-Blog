import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Calendar, ArrowRight, Tag } from 'lucide-react';
import { BlogPost } from '@/types/blog';
import { getNotionColorStyles } from '@/lib/utils';

interface PostCardProps {
  post: BlogPost;
  featured?: boolean;
}

export default function PostCard({ post, featured = false }: PostCardProps) {
  const imageSrc = post.localCoverImage || post.coverImage || '/placeholder-cover.jpg';
  const categoryStyle = getNotionColorStyles(post.category?.color);

  const formattedDate = post.date
    ? new Date(post.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <article
      className={`group relative flex flex-col bg-zinc-900/60 hover:bg-zinc-900/90 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 ${
        featured ? 'md:grid md:grid-cols-12 md:gap-8' : ''
      }`}
    >
      {/* Cover Image Container */}
      <div
        className={`relative overflow-hidden bg-zinc-950 aspect-[16/9] ${
          featured ? 'md:col-span-7 md:aspect-auto md:min-h-[340px]' : ''
        }`}
      >
        <Link href={`/posts/${post.slug}`} className="block w-full h-full">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={post.title}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 text-zinc-600 font-mono text-sm">
              [No Image]
            </div>
          )}
        </Link>

        {/* Category Pill Over Image */}
        {post.category && (
          <div className="absolute top-4 left-4">
            <Link
              href={`/category/${encodeURIComponent(post.category.name)}`}
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md border shadow-sm ${categoryStyle}`}
            >
              {post.category.name}
            </Link>
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className={`flex flex-col flex-1 p-6 ${featured ? 'md:col-span-5 md:py-8 md:pr-8 md:pl-0' : ''}`}>
        {/* Meta Info (Date & Read Time) */}
        <div className="flex items-center gap-4 text-xs text-zinc-400 mb-3 font-mono">
          {formattedDate && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              {formattedDate}
            </span>
          )}
          {post.readTime && (
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              {post.readTime}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className={`font-bold text-white tracking-tight group-hover:text-cyan-400 transition-colors mb-3 line-clamp-2 ${featured ? 'text-2xl md:text-3xl' : 'text-xl'}`}>
          <Link href={`/posts/${post.slug}`}>
            {post.title}
          </Link>
        </h3>

        {/* Summary */}
        <p className="text-zinc-400 text-sm leading-relaxed mb-6 line-clamp-3 flex-1">
          {post.summary}
        </p>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-6">
            {post.tags.slice(0, 4).map((tag) => (
              <Link
                key={tag.name}
                href={`/tag/${encodeURIComponent(tag.name)}`}
                className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 hover:text-white border border-zinc-700/50 transition-colors"
              >
                <Tag className="w-2.5 h-2.5 text-zinc-500" />
                {tag.name}
              </Link>
            ))}
            {post.tags.length > 4 && (
              <span className="text-[11px] font-mono text-zinc-500 px-1.5">
                +{post.tags.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Read More Link */}
        <div className="pt-2 border-t border-zinc-800/50 flex items-center justify-between mt-auto">
          <Link
            href={`/posts/${post.slug}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all"
          >
            <span>Read Complete Guide</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

