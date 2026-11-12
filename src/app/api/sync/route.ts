import { NextResponse } from 'next/server';
import { getAllPosts } from '@/lib/notion';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export async function POST() {
  try {
    // Run the sync script to update cache and download latest images
    const { stdout, stderr } = await execPromise('node scripts/sync-notion.mjs');
    console.log('Sync output:', stdout);
    if (stderr) console.warn('Sync stderr:', stderr);

    const posts = await getAllPosts();
    return NextResponse.json({
      success: true,
      message: 'Synced successfully from Notion',
      count: posts.length,
      posts: posts.map((p) => ({ title: p.title, slug: p.slug })),
    });
  } catch (error: any) {
    console.error('API sync error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to sync with Notion',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const posts = await getAllPosts();
  return NextResponse.json({
    status: 'ok',
    total: posts.length,
    posts,
  });
}

