I have connected to your Notion integration, verified the database schema, and retrieved your 4 published articles:

Configure Active Directory in Windows Server 2025
Install Active Directory on Ubuntu Server
Enable USB Restriction GPO in Windows Server
Configure a Gmail Account in Outlook for Windows

I'm now setting up the modern Next.js blog framework and will complete the setup shortly.

Your Notion-powered blog webpage is built, configured, and running live at http://localhost:3000
!

🌐 What Was Built

Notion Database Integration

Connected using your NOTION_API_KEY (configured in .env.local) and mapped all properties:
Title (Title)
Category (Select: Samba4, GPMC, Integration, Active Directory in Windows Server 2025)
Summary (Rich Text)
Tags (Multi-select)
ReadTime (Text)
Date (Date)
Published (Checkbox)
Cover Image (Files & media)
Synced and verified all 4 published articles:
Configure Active Directory in Windows Server 2025
Install Active Directory on Ubuntu Server
Enable USB Restriction GPO in Windows Server
Configure a Gmail Account in Outlook for Windows

Permanent Image Asset Caching

Notion AWS S3 file links expire after 1 hour. To prevent broken images, scripts/sync-notion.mjs automatically downloads and serves high-res cover images and block media locally from public/media/.

Rich Notion Block Renderer (NotionRenderer.tsx)

Headings (H1, H2, H3) with anchor links for deep linking.
Interactive Table of Contents (TableOfContents.tsx) with active scroll tracking.
Code blocks with language tags and a one-click "Copy" button.
Callout boxes with Notion emojis (💡, ⚠️, 📌) and styled backgrounds.
Blockquotes, nested bulleted lists, and numbered steps.

Interactive Blog UI

Search Bar: Real-time filtering by keywords across title, summary, category, and tags.
Topic Badges: Click any category pill (Samba4, GPMC, etc.) or tag to filter instantly.
One-Click Sync: Click the "Sync Notion" button in the header (or trigger /api/sync) to pull new Notion edits into the blog.
📁 Key Files & Architecture
File	Purpose
.env.local	Notion API key and database environment configuration
scripts/sync-notion.mjs	Standalone script to sync posts and download media
src/lib/notion.ts	Notion SDK client and database query / caching functions
src/app/page.tsx	Homepage with hero section, featured post, and listing grid
src/app/posts/[slug]/page.tsx	Full post article view with TOC and Notion block renderer
src/components/BlogListingClient.tsx	Client-side search, category filter pills, and post cards
README.md	Deployment guides and quick start instructions
💻 Useful Commands
Sync latest posts from Notion:
bash
npm run sync
Start development server:
bash
npm run dev
Build production bundle:
bash
npm run build

Your site is currently running on http://localhost:3000
. You can open it in your browser to view your live Notion blog!