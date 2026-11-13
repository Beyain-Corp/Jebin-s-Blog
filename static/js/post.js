document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');

  const postContainer = document.getElementById('postContainer');
  const headings = [];

  function resolveImage(url) {
    if (!url) return '';
    if (url.startsWith('/static/')) return url.substring(1);
    if (url.startsWith('/')) return url.substring(1);
    return url;
  }

  if (!slug) {
    postContainer.innerHTML = `
      <div style="text-align: center; padding: 5rem 0;">
        <h2>No guide selected</h2>
        <p style="color: var(--text-dim); margin: 1rem 0 2rem;">Please select an article from the homepage.</p>
        <a href="index.html" class="btn-sync" style="display:inline-block;">← Back to Home</a>
      </div>
    `;
    return;
  }

  try {
    let post = null;
    let blocks = [];

    // Try Java backend API first; fallback to static data files for GitHub Pages
    try {
      const res = await fetch(`/api/posts?slug=${encodeURIComponent(slug)}`);
      if (res.ok) {
        const data = await res.json();
        post = data.post;
        blocks = data.blocks || [];
      } else {
        throw new Error('API unavailable');
      }
    } catch (apiErr) {
      // Fallback: static JSON files on GitHub Pages
      const postsRes = await fetch('data/posts.json');
      const allPosts = await postsRes.json();
      post = allPosts.find(p => p.slug === slug || p.id === slug);

      if (post) {
        try {
          const blocksRes = await fetch('data/blocks.json');
          const allBlocks = await blocksRes.json();
          blocks = allBlocks[slug] || allBlocks[post.id] || [];
        } catch (bErr) {
          console.warn('Could not load blocks cache:', bErr);
        }
      }
    }

    if (!post) throw new Error('Post not found');

    document.title = `${post.title} | J Jebin Joseph`;

    renderPost(post, blocks);
    setupScrollSpy();
    setupShareButtons(post);
  } catch (err) {
    console.error('Error loading post:', err);
    postContainer.innerHTML = `
      <div style="text-align: center; padding: 5rem 0;">
        <h2>Guide Not Found</h2>
        <p style="color: var(--text-dim); margin: 1rem 0 2rem;">The requested article could not be loaded from Notion.</p>
        <a href="index.html" class="btn-sync" style="display:inline-block;">← Back to All Guides</a>
      </div>
    `;
  }

  function renderPost(post, blocks) {
    const rawImg = post.localCoverImage || post.coverImage || '';
    const img = resolveImage(rawImg);
    const cat = post.category ? post.category.name : '';
    const tagsHtml = (post.tags || []).map(t => `<span class="tag-badge">#${escapeHtml(t.name)}</span>`).join('');
    const formattedDate = post.date ? new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';

    const blocksHtml = renderBlocks(blocks);

    postContainer.innerHTML = `
      <nav class="breadcrumb">
        <a href="index.html">Home</a>
        <span>/</span>
        ${cat ? `<span>${escapeHtml(cat)}</span><span>/</span>` : ''}
        <span style="color: var(--text-main);">${escapeHtml(post.title)}</span>
      </nav>

      <header class="post-header">
        ${cat ? `<div class="post-category-badge">${escapeHtml(cat)}</div>` : ''}
        <h1 class="post-title">${escapeHtml(post.title)}</h1>

        <div class="post-meta-bar">
          <div class="author-pill">
            <img src="static/img/jebin.jpg" alt="J Jebin Joseph" class="author-avatar">
            <span>J Jebin Joseph</span>
            <span style="color:var(--text-dim); font-size:0.75rem; font-weight:normal;">• IT Infrastructure Lead</span>
          </div>
          ${formattedDate ? `<div>📅 ${formattedDate}</div>` : ''}
          ${post.readTime ? `<div>⏱ ${escapeHtml(post.readTime)}</div>` : ''}
        </div>

        ${tagsHtml ? `<div class="post-tags">${tagsHtml}</div>` : ''}

        ${img ? `<img src="${img}" alt="${escapeHtml(post.title)}" class="post-cover-image">` : ''}
      </header>

      <div class="post-layout-grid">
        <article class="post-body">
          ${post.summary ? `<div class="post-summary-box">${escapeHtml(post.summary)}</div>` : ''}
          ${blocksHtml}

          <div class="share-bar">
            <span style="font-size: 0.85rem; font-family: var(--font-mono); color: var(--text-dim);">Share this guide:</span>
            <button class="btn-share" id="btnCopyLink">🔗 Copy Link</button>
            <button class="btn-share" id="btnShareX">𝕏 Post</button>
            <button class="btn-share" id="btnShareLinkedIn">in LinkedIn</button>
          </div>
        </article>

        <aside class="post-sidebar">
          <div class="toc-card">
            <div class="toc-title">
              <span>📑 Table of Contents</span>
            </div>
            <ul class="toc-list" id="sidebarTocList">
              ${renderTocHtml()}
            </ul>
          </div>

          <div class="author-card">
            <div style="display:flex; align-items:center; gap:0.85rem; margin-bottom:0.85rem;">
              <img src="static/img/jebin.jpg" alt="J Jebin Joseph" class="author-card-avatar">
              <div>
                <strong style="color:#fff; font-size:1rem; display:block;">J Jebin Joseph</strong>
                <p style="font-size:0.75rem; color:var(--cyan); font-weight:500;">IT Infrastructure Lead</p>
                <p style="font-size:0.7rem; color:var(--text-dim);">Orchid Pharma Ltd</p>
              </div>
            </div>
            <p style="font-size:0.8rem; color:var(--text-muted); line-height:1.5; margin-bottom:1rem;">
              8+ years spearheading VMware ESXi/vCenter virtualization, hybrid cloud identity (Microsoft Entra ID), GPO hardening, and disaster recovery.
            </p>
            <div class="author-btn-group" style="flex-wrap: wrap;">
              <a href="https://beyain-corp.github.io/Jebin_Portfolio/" target="_blank" rel="noopener" class="author-btn" style="background:#4f46e5; border-color:#6366f1; color:#fff;">
                <i class="fa-solid fa-briefcase"></i> Portfolio
              </a>
              <a href="https://www.linkedin.com/in/jebinjosephj" target="_blank" rel="noopener" class="author-btn" style="background:#0a66c2; border-color:#0a66c2; color:#fff;">
                <i class="fa-brands fa-linkedin"></i> LinkedIn
              </a>
              <a href="https://github.com/Beyain-Corp" target="_blank" rel="noopener" class="author-btn" style="background:#24292f; border-color:#30363d; color:#fff;">
                <i class="fa-brands fa-github"></i> GitHub
              </a>
              <a href="https://wa.me/919043437743" target="_blank" rel="noopener" class="author-btn" style="background:#15803d; border-color:#16a34a; color:#fff;">
                <i class="fa-brands fa-whatsapp"></i> WhatsApp
              </a>
              <a href="mailto:jjebin05@gmail.com" class="author-btn">
                <i class="fa-solid fa-envelope"></i> Email
              </a>
            </div>
          </div>
        </aside>
      </div>
    `;

    // Attach copy button handlers for code blocks
    postContainer.querySelectorAll('.btn-copy').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.closest('.code-block-wrap').querySelector('code').innerText;
        navigator.clipboard.writeText(code);
        const originalText = btn.innerText;
        btn.innerText = 'Copied!';
        setTimeout(() => (btn.innerText = originalText), 2000);
      });
    });
  }

  function renderBlocks(blocks) {
    if (!blocks || blocks.length === 0) return '<p>No content available.</p>';
    let html = '';

    for (const b of blocks) {
      const type = b.type;
      const data = b[type] || {};

      switch (type) {
        case 'heading_1': {
          const txt = renderRichText(data.rich_text);
          const raw = plainText(data.rich_text);
          const id = slugify(raw);
          headings.push({ id, text: raw, level: 1 });
          html += `<h2 id="${id}">${txt}</h2>`;
          break;
        }
        case 'heading_2': {
          const txt = renderRichText(data.rich_text);
          const raw = plainText(data.rich_text);
          const id = slugify(raw);
          headings.push({ id, text: raw, level: 2 });
          html += `<h3 id="${id}">${txt}</h3>`;
          break;
        }
        case 'heading_3': {
          const txt = renderRichText(data.rich_text);
          const raw = plainText(data.rich_text);
          const id = slugify(raw);
          headings.push({ id, text: raw, level: 3 });
          html += `<h4 id="${id}" style="margin:1.75rem 0 0.5rem; color:#fff; font-size:1.15rem;">${txt}</h4>`;
          break;
        }
        case 'paragraph': {
          const txt = renderRichText(data.rich_text);
          if (txt.trim()) html += `<p>${txt}</p>`;
          break;
        }
        case 'code': {
          const codeText = plainText(data.rich_text);
          const lang = data.language || 'text';
          html += `
            <div class="code-block-wrap">
              <div class="code-header">
                <span class="code-lang">${escapeHtml(lang)}</span>
                <button class="btn-copy">Copy</button>
              </div>
              <pre><code>${escapeHtml(codeText)}</code></pre>
            </div>
          `;
          break;
        }
        case 'callout': {
          const icon = data.icon?.emoji || '💡';
          const txt = renderRichText(data.rich_text);
          html += `
            <div class="notion-callout">
              <div class="callout-icon">${icon}</div>
              <div class="callout-text">${txt}</div>
            </div>
          `;
          break;
        }
        case 'quote': {
          const txt = renderRichText(data.rich_text);
          html += `<blockquote class="notion-quote">${txt}</blockquote>`;
          break;
        }
        case 'bulleted_list_item': {
          const txt = renderRichText(data.rich_text);
          let childrenHtml = '';
          if (b.children && b.children.length > 0) {
            childrenHtml = renderBlocks(b.children);
          }
          html += `<ul><li>${txt}${childrenHtml}</li></ul>`;
          break;
        }
        case 'numbered_list_item': {
          const txt = renderRichText(data.rich_text);
          let childrenHtml = '';
          if (b.children && b.children.length > 0) {
            childrenHtml = renderBlocks(b.children);
          }
          html += `<ol><li>${txt}${childrenHtml}</li></ol>`;
          break;
        }
        case 'divider': {
          html += `<hr style="border:none; border-top:1px solid var(--border); margin:2.5rem 0;">`;
          break;
        }
        default:
          break;
      }
    }
    return html;
  }

  function renderTocHtml() {
    if (headings.length === 0) return '<li style="color:var(--text-dim);">No sections detected</li>';
    return headings.map(h => {
      const indent = h.level === 3 ? 'padding-left:1.5rem;' : h.level === 2 ? 'padding-left:0.75rem;' : '';
      return `
        <li class="toc-item" style="${indent}">
          <a href="#${h.id}" class="toc-link" data-id="${h.id}">${escapeHtml(h.text)}</a>
        </li>
      `;
    }).join('');
  }

  function setupScrollSpy() {
    const links = document.querySelectorAll('.toc-link');
    if (links.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          links.forEach(l => {
            if (l.dataset.id === id) l.classList.add('active');
            else l.classList.remove('active');
          });
        }
      });
    }, { rootMargin: '0px 0px -70% 0px' });

    headings.forEach(h => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });
  }

  function setupShareButtons(post) {
    const copyBtn = document.getElementById('btnCopyLink');
    const xBtn = document.getElementById('btnShareX');
    const linkedInBtn = document.getElementById('btnShareLinkedIn');

    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(window.location.href);
        copyBtn.innerText = '✓ Copied!';
        setTimeout(() => (copyBtn.innerText = '🔗 Copy Link'), 2000);
      });
    }

    if (xBtn) {
      xBtn.addEventListener('click', () => {
        const u = `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`;
        window.open(u, '_blank');
      });
    }

    if (linkedInBtn) {
      linkedInBtn.addEventListener('click', () => {
        const u = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;
        window.open(u, '_blank');
      });
    }
  }

  function renderRichText(rtList) {
    if (!rtList || rtList.length === 0) return '';
    return rtList.map(item => {
      let content = escapeHtml(item.plain_text);
      const ann = item.annotations || {};
      if (ann.bold) content = `<strong>${content}</strong>`;
      if (ann.italic) content = `<em>${content}</em>`;
      if (ann.strikethrough) content = `<del>${content}</del>`;
      if (ann.underline) content = `<u>${content}</u>`;
      if (ann.code) content = `<code>${content}</code>`;
      if (item.href) content = `<a href="${item.href}" target="_blank" rel="noopener" style="color:var(--cyan);text-decoration:underline;">${content}</a>`;
      return content;
    }).join('');
  }

  function plainText(rtList) {
    if (!rtList || rtList.length === 0) return '';
    return rtList.map(item => item.plain_text || '').join('');
  }

  function slugify(text) {
    if (!text) return 'heading';
    return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
  }
});
