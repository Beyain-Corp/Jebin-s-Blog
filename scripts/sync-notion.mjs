import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Load environment variables from .env.local or process.env
const envPath = path.join(ROOT_DIR, '.env.local');
let envConfig = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      envConfig[key] = val;
    }
  }
}

const NOTION_API_KEY = process.env.NOTION_API_KEY || envConfig.NOTION_API_KEY || '';
const DATABASE_ID = process.env.NOTION_DATABASE_ID || envConfig.NOTION_DATABASE_ID || '418ae0c306ff80169771de6884e226f5';

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function notionRequest(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`https://api.notion.com/v1/${endpoint}`);
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve(body);
          }
        } else {
          reject(new Error(`Notion API error (${res.statusCode}): ${body}`));
        }
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const file = fs.createWriteStream(destPath);
    const req = client.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close(() => {
          downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
        });
        return;
      }
      if (response.statusCode !== 200) {
        file.close(() => {
          fs.unlink(destPath, () => {});
          reject(new Error(`Download failed with status ${response.statusCode}`));
        });
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve(destPath));
      });
    });

    req.on('error', (err) => {
      file.close(() => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    });

    req.setTimeout(15000, () => {
      req.destroy();
      file.close(() => {
        fs.unlink(destPath, () => {});
        reject(new Error('Download timed out'));
      });
    });
  });
}

async function fetchBlocksRecursively(blockId) {
  const blocks = [];
  let cursor = undefined;

  while (true) {
    const query = cursor ? `?start_cursor=${cursor}&page_size=100` : `?page_size=100`;
    const res = await notionRequest(`blocks/${blockId}/children${query}`, 'GET');
    
    for (const block of res.results) {
      if (block.has_children) {
        block.children = await fetchBlocksRecursively(block.id);
      }
      blocks.push(block);
    }

    if (!res.has_more) break;
    cursor = res.next_cursor;
  }

  return blocks;
}

async function sync() {
  console.log('🚀 Starting Notion sync...');
  console.log(`Using Database ID: ${DATABASE_ID}`);

  let pages = [];
  try {
    // Try querying the database first
    const dbRes = await notionRequest(`databases/${DATABASE_ID}/query`, 'POST', {});
    pages = dbRes.results;
    console.log(`✓ Fetched ${pages.length} pages via database query`);
  } catch (err) {
    console.log(`! Database query fallback to search: ${err.message}`);
    const searchRes = await notionRequest('search', 'POST', {});
    // Filter pages belonging to this database or containing expected properties
    pages = (searchRes.results || []).filter(item => {
      return item.object === 'page' && item.properties && item.properties.Title;
    });
    console.log(`✓ Fetched ${pages.length} pages via search fallback`);
  }

  const posts = [];
  const blocksCache = {};
  const staticMediaDir = path.join(ROOT_DIR, 'static', 'media');
  const publicMediaDir = path.join(ROOT_DIR, 'public', 'media');

  for (const page of pages) {
    const props = page.properties || {};
    let title = 'Untitled';
    if (props.Title && props.Title.title && Array.isArray(props.Title.title)) {
      title = props.Title.title.map(t => t.plain_text).join('') || 'Untitled';
    }
    const slug = slugify(title);

    // Only upload if the Published checkbox is ticked (true)
    const published = Boolean(props.Published && props.Published.checkbox === true);
    if (!published) {
      console.log(`  ⏭️  Skipping draft: "${title}" (Published checkbox is unticked)`);
      continue;
    }
    
    let summary = '';
    if (props.Summary && props.Summary.rich_text && Array.isArray(props.Summary.rich_text)) {
      summary = props.Summary.rich_text.map(t => t.plain_text).join('');
    }

    let readTime = '5 Minutes';
    if (props.ReadTime && props.ReadTime.rich_text && Array.isArray(props.ReadTime.rich_text)) {
      readTime = props.ReadTime.rich_text.map(t => t.plain_text).join('') || '5 Minutes';
    }

    let date = '';
    if (props.Date && props.Date.date && props.Date.date.start) {
      date = props.Date.date.start;
    } else if (page.created_time) {
      date = page.created_time.split('T')[0];
    } else {
      date = new Date().toISOString().split('T')[0];
    }
    
    const category = (props.Category && props.Category.select) ? {
      name: props.Category.select.name,
      color: props.Category.select.color
    } : null;

    const tags = (props.Tags && props.Tags.multi_select ? props.Tags.multi_select : []).map(t => ({
      name: t.name,
      color: t.color
    }));

    // Handle Cover Image
    const coverFiles = (props['Cover Image'] && props['Cover Image'].files) ? props['Cover Image'].files : [];
    let originalCoverUrl = null;
    let localCoverImage = null;

    if (coverFiles.length > 0) {
      const firstCover = coverFiles[0];
      if (firstCover.file && firstCover.file.url) {
        originalCoverUrl = firstCover.file.url;
      } else if (firstCover.external && firstCover.external.url) {
        originalCoverUrl = firstCover.external.url;
      }
      const fileName = firstCover.name || 'cover.png';
      const ext = path.extname(fileName) || '.png';
      const staticDest = path.join(staticMediaDir, slug, `cover${ext}`);
      const publicDest = path.join(publicMediaDir, slug, `cover${ext}`);
      const publicPath = `/static/media/${slug}/cover${ext}`;

      try {
        if (originalCoverUrl) {
          console.log(`  Downloading cover image for "${title}" -> ${publicPath}`);
          await downloadFile(originalCoverUrl, staticDest);
          try {
            const pubDir = path.dirname(publicDest);
            if (!fs.existsSync(pubDir)) fs.mkdirSync(pubDir, { recursive: true });
            fs.copyFileSync(staticDest, publicDest);
          } catch (_) {}
          localCoverImage = publicPath;
        }
      } catch (e) {
        console.error(`  Warning: Could not download cover image: ${e.message}`);
      }
    }

    const post = {
      id: page.id,
      title,
      slug,
      summary,
      category,
      tags,
      readTime,
      date,
      published,
      coverImage: originalCoverUrl,
      localCoverImage: localCoverImage || originalCoverUrl,
      lastEditedTime: page.last_edited_time
    };

    posts.push(post);

    // Fetch Blocks for this page
    console.log(`  Fetching content blocks for "${title}"...`);
    try {
      const blocks = await fetchBlocksRecursively(page.id);
      
      // If any block is an image, download it locally to prevent S3 expiration
      for (const block of blocks) {
        if (block.type === 'image' && block.image) {
          let imgUrl = null;
          if (block.image.file && block.image.file.url) {
            imgUrl = block.image.file.url;
          } else if (block.image.external && block.image.external.url) {
            imgUrl = block.image.external.url;
          }

          if (imgUrl && block.image.type === 'file') {
            const ext = '.png';
            const staticImgDest = path.join(staticMediaDir, slug, `block-${block.id}${ext}`);
            const publicImgDest = path.join(publicMediaDir, slug, `block-${block.id}${ext}`);
            const imgPublic = `/static/media/${slug}/block-${block.id}${ext}`;
            try {
              await downloadFile(imgUrl, staticImgDest);
              try {
                const pubDir = path.dirname(publicImgDest);
                if (!fs.existsSync(pubDir)) fs.mkdirSync(pubDir, { recursive: true });
                fs.copyFileSync(staticImgDest, publicImgDest);
              } catch (_) {}
              block.image.localUrl = imgPublic;
            } catch (err) {
              console.error(`  Warning: failed to download block image: ${err.message}`);
            }
          }
        }
      }

      blocksCache[page.id] = blocks;
      blocksCache[slug] = blocks;
    } catch (e) {
      console.error(`  Warning: Could not fetch blocks for ${title}: ${e.message}`);
    }
  }

  // Sort posts by date descending
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Save to src/data
  const dataDir = path.join(ROOT_DIR, 'src', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(path.join(dataDir, 'posts-cache.json'), JSON.stringify(posts, null, 2), 'utf-8');
  fs.writeFileSync(path.join(dataDir, 'blocks-cache.json'), JSON.stringify(blocksCache, null, 2), 'utf-8');

  // Save to root data/ for static hosting & Java backend
  const rootDataDir = path.join(ROOT_DIR, 'data');
  if (!fs.existsSync(rootDataDir)) {
    fs.mkdirSync(rootDataDir, { recursive: true });
  }

  fs.writeFileSync(path.join(rootDataDir, 'posts.json'), JSON.stringify(posts, null, 2), 'utf-8');
  fs.writeFileSync(path.join(rootDataDir, 'blocks.json'), JSON.stringify(blocksCache, null, 2), 'utf-8');

  console.log(`\n🎉 Successfully synced ${posts.length} posts and cached to data/ & src/data/!`);
  posts.forEach(p => console.log(`  - [${p.published ? 'Published' : 'Draft'}] ${p.title} (${(p.category && p.category.name) ? p.category.name : 'Uncategorized'})`));
}

sync().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});

