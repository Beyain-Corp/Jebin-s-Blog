# Jebin's Blog (HTML, Java, CSS, JavaScript)

A fast, lightweight, and modern technical blog built with **pure HTML5**, **modern CSS**, **vanilla JavaScript**, and a native **Java 17 HTTP Server**, backed directly by your **Notion Database** as a headless CMS.

---

## ⚡ Tech Stack

- **Java**: Native HTTP server using `com.sun.net.httpserver.HttpServer` and `java.net.http.HttpClient` (Java 17+). Zero heavy frameworks, instantaneous sub-millisecond startup, and handles Notion API synchronization.
- **HTML5**: Semantic, accessible markup for the homepage and deep-dive technical articles.
- **CSS**: Custom developer-centric dark theme with CSS variables, responsive grid, glassmorphic navbar, glowing accent badges, and syntax-styled code blocks.
- **JavaScript**: Pure client-side modern JavaScript for instant search, category filtering, Notion block rendering, copy-to-clipboard buttons, and Table of Contents scroll spy.

---

## 🚀 Quick Start

### 1. Run the Blog Server

Just run the launch script:
```bash
./run.sh
```

*(Alternatively, if you use Maven: `mvn compile exec:java`)*

The server will compile the Java classes and launch on **[http://localhost:3000](http://localhost:3000)**!

---

## 📋 Notion Database Schema Mapping

| Property Name | Notion Type | Description |
| :--- | :--- | :--- |
| **Title** | `Title` | Guide headline |
| **Category** | `Select` | Core topic (*Samba4*, *GPMC*, *Integration*, *Active Directory in Windows Server 2025*) |
| **Summary** | `Text` | Short description shown on cards and guide intro |
| **Tags** | `Multi-select` | Technology tags (`Ubuntu`, `ActiveDirectory`, `GPO`, etc.) |
| **ReadTime** | `Text` | Reading time (e.g. *5 Minutes*) |
| **Date** | `Date` | Publication date |
| **Published** | `Checkbox` | When checked, appears on the blog |
| **Cover Image** | `Files & media` | Cover banner image |

---

## 🔄 Notion Synchronization

- Click the **"Sync Notion"** button in the header bar of the website.
- Or trigger the Java sync API endpoint:
  ```bash
  curl -X POST http://localhost:3000/api/sync
  ```

The Java backend connects to Notion, pulls down new or updated articles, and downloads cover images to [`static/media/`](file:///Users/jebinj/Documents/Git/Jebin's-Blog/static/media/) so images never expire.

---

## 📁 Project Structure

```
.
├── run.sh                          # One-click compile & launch script
├── pom.xml                         # Maven project descriptor
├── lib/
│   └── gson-2.10.1.jar             # Lightweight JSON library
├── src/com/jebin/blog/
│   ├── BlogServer.java             # Java HTTP server & routing
│   ├── NotionService.java          # Notion API integration & image downloader
│   └── Models.java                 # Data models
├── static/
│   ├── index.html                  # Homepage (Search, Categories, Post Cards)
│   ├── post.html                   # Article View (Hero, TOC, Notion blocks)
│   ├── css/
│   │   ├── style.css               # Homepage & global design system
│   │   └── post.css                # Article typography, code blocks, callouts
│   ├── js/
│   │   ├── app.js                  # Search, filter & card rendering
│   │   └── post.js                 # Block renderer, TOC scroll spy, copy code
│   └── media/                      # Synced cover images & attachments
└── data/
    ├── posts.json                  # Cached posts
    └── blocks.json                 # Cached Notion blocks
```
# Jebin's-Blog
