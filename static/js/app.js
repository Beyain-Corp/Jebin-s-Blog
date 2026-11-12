document.addEventListener('DOMContentLoaded', () => {
  let allPosts = [];
  let currentCategory = 'all';
  let searchQuery = '';

  const postsGrid = document.getElementById('postsGrid');
  const categoryPills = document.getElementById('categoryPills');
  const searchInput = document.getElementById('searchInput');
  const resultsCount = document.getElementById('resultsCount');
  const syncBtn = document.getElementById('syncBtn');

  // Fetch posts from Java backend
  async function loadPosts() {
    try {
      const res = await fetch('/api/posts');
      allPosts = await res.json();
      renderCategories();
      filterAndRender();
    } catch (err) {
      console.error('Failed to load posts:', err);
      postsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-dim);">
          <p>Failed to connect to backend server. Make sure Java BlogServer is running.</p>
        </div>
      `;
    }
  }

  function renderCategories() {
    const catMap = new Map();
    allPosts.forEach(post => {
      if (post.category && post.category.name) {
        const count = catMap.get(post.category.name) || 0;
        catMap.set(post.category.name, count + 1);
      }
    });

    let html = `
      <button class="pill ${currentCategory === 'all' ? 'active' : ''}" data-category="all">
        All Guides <span class="pill-count">${allPosts.length}</span>
      </button>
    `;

    catMap.forEach((count, name) => {
      html += `
        <button class="pill ${currentCategory === name ? 'active' : ''}" data-category="${escapeHtml(name)}">
          ${escapeHtml(name)} <span class="pill-count">${count}</span>
        </button>
      `;
    });

    categoryPills.innerHTML = html;

    // Attach click events
    categoryPills.querySelectorAll('.pill').forEach(btn => {
      btn.addEventListener('click', () => {
        currentCategory = btn.dataset.category;
        categoryPills.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        filterAndRender();
      });
    });
  }

  function filterAndRender() {
    const q = searchQuery.toLowerCase().trim();

    const filtered = allPosts.filter(post => {
      if (currentCategory !== 'all' && (!post.category || post.category.name !== currentCategory)) {
        return false;
      }
      if (q) {
        const inTitle = (post.title || '').toLowerCase().includes(q);
        const inSummary = (post.summary || '').toLowerCase().includes(q);
        const inCat = (post.category?.name || '').toLowerCase().includes(q);
        const inTags = (post.tags || []).some(t => t.name.toLowerCase().includes(q));
        if (!inTitle && !inSummary && !inCat && !inTags) return false;
      }
      return true;
    });

    if (resultsCount) {
      resultsCount.textContent = `Showing ${filtered.length} of ${allPosts.length} guides`;
    }

    if (filtered.length === 0) {
      postsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-dim); background: var(--bg-card); border-radius: 16px; border: 1px dashed var(--border);">
          <h3 style="color: #fff; margin-bottom: 0.5rem;">No matching guides found</h3>
          <p style="font-size: 0.9rem;">Try adjusting your search terms or category selection.</p>
        </div>
      `;
      return;
    }

    postsGrid.innerHTML = filtered.map(post => {
      const img = post.localCoverImage || post.coverImage || '';
      const cat = post.category ? post.category.name : '';
      const tagsHtml = (post.tags || []).slice(0, 3).map(t => `<span class="tag-badge">#${escapeHtml(t.name)}</span>`).join('');
      const dateFormatted = post.date ? formatDate(post.date) : '';

      return `
        <article class="card">
          <div class="card-image-wrap">
            <a href="/post?slug=${encodeURIComponent(post.slug)}">
              ${img ? `<img src="${img}" alt="${escapeHtml(post.title)}" class="card-image" loading="lazy">` : `<div style="height:100%;display:flex;align-items:center;justify-content:center;background:#1e2433;color:#64748b;">No Image</div>`}
            </a>
            ${cat ? `<span class="card-cat">${escapeHtml(cat)}</span>` : ''}
          </div>
          <div class="card-body">
            <div class="card-meta">
              <span>📅 ${dateFormatted}</span>
              <span>⏱ ${escapeHtml(post.readTime || '5 Minutes')}</span>
            </div>
            <h2 class="card-title">
              <a href="/post?slug=${encodeURIComponent(post.slug)}">${escapeHtml(post.title)}</a>
            </h2>
            <p class="card-summary">${escapeHtml(post.summary || '')}</p>
            <div class="card-tags">
              ${tagsHtml}
            </div>
            <div class="card-footer">
              <div class="card-author-mini">
                <img src="/static/img/jebin.jpg" alt="J Jebin Joseph">
                <span>J Jebin Joseph</span>
              </div>
              <a href="/post?slug=${encodeURIComponent(post.slug)}" class="read-link">
                Read Guide →
              </a>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  // Search input handler
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      filterAndRender();
    });
  }

  // Sync button handler
  if (syncBtn) {
    syncBtn.addEventListener('click', async () => {
      syncBtn.disabled = true;
      syncBtn.innerHTML = `⏳ Syncing Notion...`;
      try {
        const res = await fetch('/api/sync', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          syncBtn.innerHTML = `✓ Synced!`;
          setTimeout(() => {
            syncBtn.disabled = false;
            syncBtn.innerHTML = `<span class="sync-dot"></span> Sync Notion`;
            loadPosts();
          }, 1000);
        } else {
          syncBtn.innerHTML = `Sync failed`;
          setTimeout(() => {
            syncBtn.disabled = false;
            syncBtn.innerHTML = `<span class="sync-dot"></span> Sync Notion`;
          }, 3000);
        }
      } catch (e) {
        syncBtn.innerHTML = `Error`;
        setTimeout(() => {
          syncBtn.disabled = false;
          syncBtn.innerHTML = `<span class="sync-dot"></span> Sync Notion`;
        }, 3000);
      }
    });
  }

  function formatDate(dStr) {
    try {
      const d = new Date(dStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return dStr;
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
  }

  loadPosts();
});
