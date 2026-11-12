package com.jebin.blog;

import com.google.gson.*;
import java.io.*;
import java.net.URI;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.time.Duration;
import java.util.*;

public class NotionService {

    private final String apiKey;
    private final String databaseId;
    private final HttpClient httpClient;
    private final Gson gson;

    private List<Models.BlogPost> postsCache = new ArrayList<>();
    private Map<String, JsonElement> blocksCache = new HashMap<>();

    public NotionService(String apiKey, String databaseId) {
        this.apiKey = apiKey;
        this.databaseId = databaseId;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .followRedirects(HttpClient.Redirect.ALWAYS)
                .build();
        this.gson = new GsonBuilder().setPrettyPrinting().create();

        loadLocalCache();
    }

    public static String slugify(String text) {
        if (text == null) return "untitled";
        String s = text.toLowerCase().replaceAll("[^a-z0-9\\s-]", "").trim();
        return s.replaceAll("\\s+", "-");
    }

    public String getDatabaseId() {
        return databaseId;
    }

    public synchronized List<Models.BlogPost> getAllPosts() {
        return new ArrayList<>(postsCache);
    }

    public synchronized Models.BlogPost getPostBySlug(String slug) {
        for (Models.BlogPost p : postsCache) {
            if (p.slug.equalsIgnoreCase(slug) || p.id.equalsIgnoreCase(slug)) {
                return p;
            }
        }
        return null;
    }

    public synchronized JsonElement getBlocksForPost(String slugOrId) {
        if (blocksCache.containsKey(slugOrId)) {
            return blocksCache.get(slugOrId);
        }
        Models.BlogPost post = getPostBySlug(slugOrId);
        if (post != null && blocksCache.containsKey(post.id)) {
            return blocksCache.get(post.id);
        }
        return new JsonArray();
    }

    private void loadLocalCache() {
        try {
            Path postsPath = Paths.get("data", "posts.json");
            if (Files.exists(postsPath)) {
                String json = Files.readString(postsPath, StandardCharsets.UTF_8);
                Models.BlogPost[] arr = gson.fromJson(json, Models.BlogPost[].class);
                postsCache = new ArrayList<>(Arrays.asList(arr));
                System.out.println("Loaded " + postsCache.size() + " posts from local cache.");
            }

            Path blocksPath = Paths.get("data", "blocks.json");
            if (Files.exists(blocksPath)) {
                String json = Files.readString(blocksPath, StandardCharsets.UTF_8);
                JsonObject obj = JsonParser.parseString(json).getAsJsonObject();
                for (String key : obj.keySet()) {
                    blocksCache.put(key, obj.get(key));
                }
                System.out.println("Loaded blocks cache with " + blocksCache.size() + " entries.");
            }
        } catch (Exception e) {
            System.err.println("Warning loading cache: " + e.getMessage());
        }
    }

    public synchronized boolean sync() {
        System.out.println("Starting Notion sync for database: " + databaseId);
        try {
            List<JsonObject> pages = fetchPages();
            System.out.println("Fetched " + pages.size() + " pages from Notion.");

            List<Models.BlogPost> newPosts = new ArrayList<>();
            Map<String, JsonElement> newBlocksCache = new HashMap<>();

            for (JsonObject page : pages) {
                JsonObject props = page.getAsJsonObject("properties");
                if (props == null || !props.has("Title")) continue;

                // Title
                String title = extractPlainText(props.getAsJsonObject("Title").getAsJsonArray("title"));
                String slug = slugify(title);

                // Published
                boolean published = true;
                if (props.has("Published") && !props.get("Published").isJsonNull()) {
                    JsonObject pubObj = props.getAsJsonObject("Published");
                    if (pubObj.has("checkbox")) {
                        published = pubObj.get("checkbox").getAsBoolean();
                    }
                }
                if (!published) continue;

                // Summary
                String summary = "";
                if (props.has("Summary") && !props.get("Summary").isJsonNull()) {
                    summary = extractPlainText(props.getAsJsonObject("Summary").getAsJsonArray("rich_text"));
                }

                // ReadTime
                String readTime = "5 Minutes";
                if (props.has("ReadTime") && !props.get("ReadTime").isJsonNull()) {
                    readTime = extractPlainText(props.getAsJsonObject("ReadTime").getAsJsonArray("rich_text"));
                    if (readTime.isEmpty()) readTime = "5 Minutes";
                }

                // Date
                String date = "";
                if (props.has("Date") && !props.get("Date").isJsonNull()) {
                    JsonObject dObj = props.getAsJsonObject("Date");
                    if (dObj.has("date") && !dObj.get("date").isJsonNull()) {
                        date = dObj.getAsJsonObject("date").get("start").getAsString();
                    }
                }

                // Category
                Models.Category category = null;
                if (props.has("Category") && !props.get("Category").isJsonNull()) {
                    JsonObject catObj = props.getAsJsonObject("Category");
                    if (catObj.has("select") && !catObj.get("select").isJsonNull()) {
                        JsonObject sel = catObj.getAsJsonObject("select");
                        category = new Models.Category(sel.get("name").getAsString(), sel.has("color") ? sel.get("color").getAsString() : "default");
                    }
                }

                // Tags
                List<Models.Tag> tags = new ArrayList<>();
                if (props.has("Tags") && !props.get("Tags").isJsonNull()) {
                    JsonObject tagObj = props.getAsJsonObject("Tags");
                    if (tagObj.has("multi_select")) {
                        JsonArray arr = tagObj.getAsJsonArray("multi_select");
                        for (JsonElement el : arr) {
                            JsonObject t = el.getAsJsonObject();
                            tags.add(new Models.Tag(t.get("name").getAsString(), t.has("color") ? t.get("color").getAsString() : "default"));
                        }
                    }
                }

                // Cover Image
                String originalCoverUrl = null;
                String localCoverImage = null;
                if (props.has("Cover Image") && !props.get("Cover Image").isJsonNull()) {
                    JsonObject ciObj = props.getAsJsonObject("Cover Image");
                    if (ciObj.has("files") && ciObj.getAsJsonArray("files").size() > 0) {
                        JsonObject fileObj = ciObj.getAsJsonArray("files").get(0).getAsJsonObject();
                        if (fileObj.has("file")) {
                            originalCoverUrl = fileObj.getAsJsonObject("file").get("url").getAsString();
                        } else if (fileObj.has("external")) {
                            originalCoverUrl = fileObj.getAsJsonObject("external").get("url").getAsString();
                        }
                    }
                }

                if (originalCoverUrl != null) {
                    try {
                        Path mediaDir = Paths.get("static", "media", slug);
                        Files.createDirectories(mediaDir);
                        Path dest = mediaDir.resolve("cover.png");
                        downloadFile(originalCoverUrl, dest);
                        localCoverImage = "/static/media/" + slug + "/cover.png";
                    } catch (Exception e) {
                        System.err.println("Error downloading cover for " + title + ": " + e.getMessage());
                        localCoverImage = originalCoverUrl;
                    }
                }

                String pageId = page.get("id").getAsString();
                Models.BlogPost post = new Models.BlogPost();
                post.id = pageId;
                post.title = title;
                post.slug = slug;
                post.summary = summary;
                post.category = category;
                post.tags = tags;
                post.readTime = readTime;
                post.date = date;
                post.published = published;
                post.coverImage = originalCoverUrl;
                post.localCoverImage = localCoverImage;
                post.lastEditedTime = page.has("last_edited_time") ? page.get("last_edited_time").getAsString() : "";

                newPosts.add(post);

                // Fetch Blocks
                JsonArray blocks = fetchBlocksRecursively(pageId);
                newBlocksCache.put(pageId, blocks);
                newBlocksCache.put(slug, blocks);
            }

            newPosts.sort((a, b) -> b.date.compareTo(a.date));

            // Save to disk
            Files.createDirectories(Paths.get("data"));
            Files.writeString(Paths.get("data", "posts.json"), gson.toJson(newPosts), StandardCharsets.UTF_8);

            JsonObject blocksObj = new JsonObject();
            for (Map.Entry<String, JsonElement> entry : newBlocksCache.entrySet()) {
                blocksObj.add(entry.getKey(), entry.getValue());
            }
            Files.writeString(Paths.get("data", "blocks.json"), gson.toJson(blocksObj), StandardCharsets.UTF_8);

            this.postsCache = newPosts;
            this.blocksCache = newBlocksCache;

            System.out.println("Java Notion sync completed successfully. " + newPosts.size() + " posts active.");
            return true;
        } catch (Exception e) {
            System.err.println("Notion sync failed: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    private List<JsonObject> fetchPages() throws Exception {
        // Fallback search
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create("https://api.notion.com/v1/search"))
                .header("Authorization", "Bearer " + apiKey)
                .header("Notion-Version", "2022-06-28")
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString("{}"))
                .build();

        HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
        if (res.statusCode() != 200) {
            throw new RuntimeException("Notion API error (" + res.statusCode() + "): " + res.body());
        }

        JsonObject json = JsonParser.parseString(res.body()).getAsJsonObject();
        JsonArray results = json.getAsJsonArray("results");
        List<JsonObject> pages = new ArrayList<>();
        String targetDbId = (databaseId != null) ? databaseId.replace("-", "").toLowerCase() : "";

        for (JsonElement el : results) {
            JsonObject obj = el.getAsJsonObject();
            if ("page".equals(obj.get("object").getAsString()) && obj.has("properties")) {
                if (!targetDbId.isEmpty() && obj.has("parent")) {
                    JsonObject parent = obj.getAsJsonObject("parent");
                    if (parent.has("database_id")) {
                        String pageDbId = parent.get("database_id").getAsString().replace("-", "").toLowerCase();
                        if (!targetDbId.equals(pageDbId)) {
                            continue; // Filter only pages belonging to this Notion database
                        }
                    }
                }
                pages.add(obj);
            }
        }
        return pages;
    }

    private JsonArray fetchBlocksRecursively(String blockId) {
        JsonArray allBlocks = new JsonArray();
        String cursor = null;
        try {
            while (true) {
                String uriStr = "https://api.notion.com/v1/blocks/" + blockId + "/children?page_size=100";
                if (cursor != null) uriStr += "&start_cursor=" + cursor;

                HttpRequest req = HttpRequest.newBuilder()
                        .uri(URI.create(uriStr))
                        .header("Authorization", "Bearer " + apiKey)
                        .header("Notion-Version", "2022-06-28")
                        .header("Content-Type", "application/json")
                        .GET()
                        .build();

                HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
                if (res.statusCode() != 200) break;

                JsonObject obj = JsonParser.parseString(res.body()).getAsJsonObject();
                JsonArray results = obj.getAsJsonArray("results");
                for (JsonElement el : results) {
                    JsonObject b = el.getAsJsonObject();
                    if (b.has("has_children") && b.get("has_children").getAsBoolean()) {
                        String childId = b.get("id").getAsString();
                        b.add("children", fetchBlocksRecursively(childId));
                    }
                    allBlocks.add(b);
                }

                if (!obj.get("has_more").getAsBoolean()) break;
                cursor = obj.get("next_cursor").getAsString();
            }
        } catch (Exception e) {
            System.err.println("Error fetching blocks for " + blockId + ": " + e.getMessage());
        }
        return allBlocks;
    }

    private void downloadFile(String url, Path dest) throws Exception {
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .GET()
                .build();
        HttpResponse<InputStream> res = httpClient.send(req, HttpResponse.BodyHandlers.ofInputStream());
        if (res.statusCode() == 200) {
            try (InputStream in = res.body()) {
                Files.copy(in, dest, StandardCopyOption.REPLACE_EXISTING);
            }
        }
    }

    private String extractPlainText(JsonArray array) {
        if (array == null || array.size() == 0) return "";
        StringBuilder sb = new StringBuilder();
        for (JsonElement el : array) {
            JsonObject obj = el.getAsJsonObject();
            if (obj.has("plain_text")) {
                sb.append(obj.get("plain_text").getAsString());
            }
        }
        return sb.toString();
    }
}

