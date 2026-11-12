import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { getAllPosts, getPostBySlug, getPostBlocks, getRelatedPosts, getNotionColorStyles, slugify } from '@/lib/notion';
import NotionRenderer from '@/components/NotionRenderer';
import TableOfContents from '@/components/TableOfContents';
import ShareButtons from '@/components/ShareButtons';
import PostCard from '@/components/PostCard';
import { ChevronLeft, Calendar, Clock, Tag, User, Layers, ArrowLeft, Terminal } from 'lucide-react';
import { TocHeading } from '@/types/blog';

interface PostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: 'Post Not Found - Jebin\'s Blog',
    };
  }

  return {
    title: `${post.title} | Jebin's Tech Journal`,
    description: post.summary || 'Technical guide by Jebin',
    openGraph: {
      title: post.title,
      description: post.summary,
      type: 'article',
      publishedTime: post.date,
      images: post.coverImage ? [post.coverImage] : [],
    },
  };
}

export default async function PostDetailPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const blocks = await getPostBlocks(post.slug);
  const relatedPosts = await getRelatedPosts(post.slug, post.category?.name, 2);

  // Extract headings for Table of Contents
  const headings: TocHeading[] = [];
  blocks.forEach((block) => {
    if (block.type === 'heading_1') {
      const text = block.heading_1?.rich_text?.map((t: any) => t.plain_text).join('') || '';
      if (text) headings.push({ id: slugify(text), text, level: 1 });
    } else if (block.type === 'heading_2') {
      const text = block.heading_2?.rich_text?.map((t: any) => t.plain_text).join('') || '';
      if (text) headings.push({ id: slugify(text), text, level: 2 });
    } else if (block.type === 'heading_3') {
      const text = block.heading_3?.rich_text?.map((t: any) => t.plain_text).join('') || '';
      if (text) headings.push({ id: slugify(text), text, level: 3 });
    }
  });

  const formattedDate = post.date
    ? new Date(post.date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  const imageSrc = post.localCoverImage || post.coverImage;
  const categoryStyle = getNotionColorStyles(post.category?.color);

  return (
    <article className="space-y-12 pb-16">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between gap-4 pt-4 border-b border-zinc-800/80 pb-4 text-xs font-mono text-zinc-400">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to All Articles</span>
        </Link>

        {post.category && (
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-600">/</span>
            <Link
              href={`/category/${encodeURIComponent(post.category.name)}`}
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              {post.category.name}
            </Link>
          </div>
        )}
      </div>

      {/* Post Header Hero */}
      <header className="space-y-6 max-w-4xl">
        {/* Category Pill */}
        {post.category && (
          <div className="inline-block">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${categoryStyle}`}>
              {post.category.name}
            </span>
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
          {post.title}
        </h1>

        {/* Meta Bar */}
        <div className="flex flex-wrap items-center gap-6 text-xs sm:text-sm text-zinc-400 font-mono py-2 border-y border-zinc-800/60">
          <div className="flex items-center gap-2 text-zinc-200">
            <div className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <User className="w-3.5 h-3.5" />
            </div>
            <span>Jebin</span>
          </div>

          {formattedDate && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-zinc-500" />
              <span>{formattedDate}</span>
            </div>
          )}

          {post.readTime && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-zinc-500" />
              <span>{post.readTime}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag.name}
                className="inline-flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400"
              >
                <Tag className="w-3 h-3 text-zinc-500" />
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Cover Image */}
        {imageSrc && (
          <div className="relative rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-950 aspect-[21/9] min-h-[260px] shadow-2xl">
            <img
              src={imageSrc}
              alt={post.title}
              className="w-full h-full object-cover object-center"
            />
          </div>
        )}
      </header>

      {/* Main Content & Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Main Article Body */}
        <main className="lg:col-span-8 min-w-0">
          {/* Summary Callout Banner */}
          {post.summary && (
            <div className="mb-8 p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-zinc-300 text-base leading-relaxed italic border-l-4 border-l-indigo-500">
              {post.summary}
            </div>
          )}

          {/* Block Content */}
          <NotionRenderer blocks={blocks} />

          {/* Article Footer & Social Share */}
          <div className="mt-14 pt-8 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-6">
            <ShareButtons title={post.title} />

            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>
        </main>

        {/* Sticky Sidebar on Desktop */}
        <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          {/* Table of Contents */}
          {headings.length > 0 && <TableOfContents headings={headings} />}

          {/* Author Card */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 p-0.5">
                <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center font-bold text-white">
                  J
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Written by Jebin</h4>
                <p className="text-xs text-zinc-400">IT Systems &amp; Infrastructure</p>
              </div>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Focused on enterprise Windows Server management, Active Directory domain architecture, Linux interoperability, and endpoint security policies.
            </p>
          </div>
        </aside>
      </div>

      {/* Related Posts Section */}
      {relatedPosts.length > 0 && (
        <section className="pt-16 border-t border-zinc-800 space-y-6">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400">
            <Layers className="w-4 h-4" />
            <span>Recommended Reading</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {relatedPosts.map((related) => (
              <PostCard key={related.id} post={related} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

