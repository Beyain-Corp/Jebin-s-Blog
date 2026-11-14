#!/usr/bin/env bash
set -e

echo "=========================================="
echo " Starting Notion -> GitHub Sync Automation"
echo " Timestamp: $(date)"
echo "=========================================="

# 1. Load environment variables if .env.local exists
if [ -f .env.local ]; then
  echo "Loading environment variables from .env.local..."
  set -a
  source <(grep -v '^#' .env.local | sed -e 's/\r$//')
  set +a
fi

if [ -z "$NOTION_API_KEY" ]; then
  echo "ERROR: NOTION_API_KEY is not set!"
  echo "Please export NOTION_API_KEY or configure it in Jenkins Credentials / .env.local."
  exit 1
fi

# 2. Pull latest changes from origin to stay up to date
echo "Checking out latest main branch..."
git fetch origin main || true
git checkout -B main origin/main || git checkout main || true
git pull origin main --rebase || true

# 3. Run Notion sync script
echo "Querying Notion API for published pages..."
node scripts/sync-notion.mjs

# 4. Check if any data or media files changed
CHANGES=$(git status --porcelain data/ static/media/ src/data/ public/media/ 2>/dev/null || true)

if [ -z "$CHANGES" ]; then
  echo "✓ No changes in Notion articles or assets. Working tree is clean."
  echo "Nothing to push."
  exit 0
fi

echo "Detected updates from Notion:"
echo "$CHANGES"

# 5. Configure Git identity if not already set
if [ -z "$(git config user.name)" ]; then
  git config user.name "Jenkins Automation"
fi
if [ -z "$(git config user.email)" ]; then
  git config user.email "jenkins@beyain-corp.com"
fi

# 6. Commit and Push
git add data/ static/media/ src/data/ public/media/
git commit -m "chore(notion): auto-sync published articles"

echo "Pushing updates to GitHub..."
if [ -n "$GH_TOKEN" ]; then
  git push "https://${GH_USER:-Beyain-Corp}:${GH_TOKEN}@github.com/Beyain-Corp/Jebin-s-Blog.git" main
else
  git push origin main
fi

echo "=========================================="
echo "✓ Sync successfully pushed to GitHub!"
echo "GitHub Pages deployment triggered automatically."
echo "=========================================="
