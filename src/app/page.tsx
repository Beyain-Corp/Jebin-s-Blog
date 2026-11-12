import React from 'react';
import Hero from '@/components/Hero';
import BlogListingClient from '@/components/BlogListingClient';
import { getAllPosts } from '@/lib/notion';

export const revalidate = 60; // Revalidate every minute

export default async function HomePage() {
  const posts = await getAllPosts();

  return (
    <div className="space-y-12">
      <Hero />
      <BlogListingClient initialPosts={posts} />
    </div>
  );
}
