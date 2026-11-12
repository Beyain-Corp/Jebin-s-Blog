import { Client } from '@notionhq/client';
import { BlogPost, NotionBlock, NotionColor } from '@/types/blog';
import postsCache from '@/data/posts-cache.json';
import blocksCache from '@/data/blocks-cache.json';
import { slugify, getNotionColorStyles } from './utils';

export { slugify, getNotionColorStyles };

const NOTION_API_KEY = process.env.NOTION_API_KEY || '';
const DATABASE_ID = process.env.NOTION_DATABASE_ID || '3b7d8cac-3561-809f-b015-c8ced8c0a70b';

// Lazy Notion client instantiation to prevent BrowserTokenNotAllowedError
let _notionClient: Client | null = null;
function getNotionClient(): Client {
  if (typeof window !== 'undefined') {
    throw new Error('Notion client should only be called on the server.');
  }
  if (!_notionClient) {
    _notionClient = new Client({
      auth: NOTION_API_KEY,
    });
  }
  return _notionClient;
}

/**
 * Returns all published blog posts (cached by default, fast & reliable)
 */
export async function getAllPosts(): Promise<BlogPost[]> {
  try {
    if (postsCache && Array.isArray(postsCache) && postsCache.length > 0) {
      return (postsCache as BlogPost[]).filter((p) => p.published !== false);
    }
  } catch (e) {
    console.warn('Cache read warning:', e);
  }

  // Fallback to direct Notion query if needed
  try {
    const notion = getNotionClient();
    const res = await notion.search({
      page_size: 100,
    });
    const posts: BlogPost[] = [];

    for (const page of res.results as any[]) {
      if (page.object !== 'page' || !page.properties?.Title) continue;
      const props = page.properties;
      const title = props.Title?.title?.map((t: any) => t.plain_text).join('') || 'Untitled';
      const slug = slugify(title);
      const published = props.Published?.checkbox ?? true;
      if (!published) continue;

      const summary = props.Summary?.rich_text?.map((t: any) => t.plain_text).join('') || '';
      const readTime = props.ReadTime?.rich_text?.map((t: any) => t.plain_text).join('') || '5 Minutes';
      const date = props.Date?.date?.start || page.created_time?.split('T')[0] || '';
      const category: NotionColor | null = props.Category?.select
        ? { name: props.Category.select.name, color: props.Category.select.color }
        : null;
      const tags: NotionColor[] = (props.Tags?.multi_select || []).map((t: any) => ({
        name: t.name,
        color: t.color,
      }));

      const coverFiles = props['Cover Image']?.files || [];
      const coverImage = coverFiles.length > 0 ? (coverFiles[0].file?.url || coverFiles[0].external?.url) : null;

      posts.push({
        id: page.id,
        title,
        slug,
        summary,
        category,
        tags,
        readTime,
        date,
        published,
        coverImage,
        localCoverImage: `/media/${slug}/cover.png`,
        lastEditedTime: page.last_edited_time,
      });
    }

    posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return posts;
  } catch (err) {
    console.error('Error fetching from Notion:', err);
    return (postsCache as BlogPost[]) || [];
  }
}

/**
 * Get a specific post by slug
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await getAllPosts();
  return posts.find((p) => p.slug === slug || p.id === slug) || null;
}

/**
 * Get all content blocks for a post (with local media fallbacks)
 */
export async function getPostBlocks(slugOrId: string): Promise<NotionBlock[]> {
  const cache = blocksCache as Record<string, NotionBlock[]>;
  if (cache && cache[slugOrId]) {
    return cache[slugOrId];
  }

  const post = await getPostBySlug(slugOrId);
  if (post && cache && cache[post.id]) {
    return cache[post.id];
  }

  const targetId = post?.id || slugOrId;
  try {
    const notion = getNotionClient();
    const blocks: NotionBlock[] = [];
    let cursor: string | undefined = undefined;

    while (true) {
      const response: any = await notion.blocks.children.list({
        block_id: targetId,
        start_cursor: cursor,
        page_size: 100,
      });

      for (const block of response.results) {
        if (block.has_children) {
          try {
            const childRes: any = await notion.blocks.children.list({
              block_id: block.id,
              page_size: 100,
            });
            block.children = childRes.results;
          } catch (e) {
            block.children = [];
          }
        }
        blocks.push(block);
      }

      if (!response.has_more) break;
      cursor = response.next_cursor || undefined;
    }

    return blocks;
  } catch (err) {
    console.error(`Failed to live-fetch blocks for ${targetId}:`, err);
    return [];
  }
}

/**
 * Get related posts for the bottom recommendation section
 */
export async function getRelatedPosts(currentSlug: string, categoryName?: string, limit = 2): Promise<BlogPost[]> {
  const allPosts = await getAllPosts();
  const others = allPosts.filter((p) => p.slug !== currentSlug);
  if (!categoryName) return others.slice(0, limit);

  const matched = others.filter((p) => p.category?.name === categoryName);
  const remaining = others.filter((p) => p.category?.name !== categoryName);
  return [...matched, ...remaining].slice(0, limit);
}
