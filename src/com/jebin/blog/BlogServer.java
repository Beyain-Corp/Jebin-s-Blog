package com.jebin.blog;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.sun.net.httpserver.*;
import java.io.*;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.Executors;

public class BlogServer {

    private static final Gson gson = new Gson();
    private static NotionService notionService;

    public static void main(String[] args) throws Exception {
        Map<String, String> env = loadEnv();
        String apiKey = env.getOrDefault("NOTION_API_KEY", "");
        String dbId = env.getOrDefault("NOTION_DATABASE_ID", "3b7d8cac-3561-809f-b015-c8ced8c0a70b");
        if (apiKey.isEmpty()) {
            System.err.println("⚠️ Warning: NOTION_API_KEY not found in environment or .env.local!");
        }
        int port = 3000;
        if (args.length > 0) {
            try { port = Integer.parseInt(args[0]); } catch (Exception ignored) {}
        } else if (env.containsKey("PORT")) {
            try { port = Integer.parseInt(env.get("PORT")); } catch (Exception ignored) {}
        }

        notionService = new NotionService(apiKey, dbId);

        HttpServer server;
        try {
            server = HttpServer.create(new InetSocketAddress(port), 0);
        } catch (IOException e) {
            port = 3001;
            server = HttpServer.create(new InetSocketAddress(port), 0);
        }

        server.setExecutor(Executors.newFixedThreadPool(16));

        // Routes
        server.createContext("/", new RootHandler());
        server.createContext("/post", new PostPageHandler());
        server.createContext("/post.html", new PostPageHandler());
        server.createContext("/api/posts", new ApiPostsHandler());
        server.createContext("/api/sync", new ApiSyncHandler());
        server.createContext("/static/", new StaticFileHandler());
        server.createContext("/data/", new StaticFileHandler());

        server.start();

        System.out.println("=================================================");
        System.out.println("🚀 Jebin's Blog Server (Java + HTML + CSS + JS)");
        System.out.println("   Local:    http://localhost:" + port);
        System.out.println("   Status:   Ready & Serving Requests");
        System.out.println("=================================================");
    }

    private static Map<String, String> loadEnv() {
        Map<String, String> env = new HashMap<>(System.getenv());
        File[] envFiles = new File[]{ new File(".env.local"), new File(".env") };
        for (File f : envFiles) {
            if (f.exists()) {
                try (BufferedReader reader = new BufferedReader(new FileReader(f))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        line = line.trim();
                        if (line.isEmpty() || line.startsWith("#")) continue;
                        int idx = line.indexOf('=');
                        if (idx > 0) {
                            String k = line.substring(0, idx).trim();
                            String v = line.substring(idx + 1).trim();
                            env.putIfAbsent(k, v);
                        }
                    }
                } catch (Exception ignored) {}
            }
        }
        return env;
    }

    static class RootHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String path = exchange.getRequestURI().getPath();
            if (path.equals("/") || path.equals("/index.html")) {
                serveFile(exchange, Paths.get("static", "index.html"), "text/html; charset=utf-8");
            } else if (path.startsWith("/static/")) {
                new StaticFileHandler().handle(exchange);
            } else if (path.equals("/post") || path.equals("/post.html")) {
                serveFile(exchange, Paths.get("static", "post.html"), "text/html; charset=utf-8");
            } else {
                // Try serving from static root if exists, else 404
                Path staticPath = Paths.get("static", path.substring(1));
                if (Files.exists(staticPath) && !Files.isDirectory(staticPath)) {
                    serveFile(exchange, staticPath, getMimeType(staticPath.toString()));
                } else {
                    serveFile(exchange, Paths.get("static", "index.html"), "text/html; charset=utf-8");
                }
            }
        }
    }

    static class PostPageHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            serveFile(exchange, Paths.get("static", "post.html"), "text/html; charset=utf-8");
        }
    }

    static class ApiPostsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");

            String query = exchange.getRequestURI().getQuery();
            String slug = null;
            if (query != null) {
                for (String param : query.split("&")) {
                    String[] pair = param.split("=");
                    if (pair.length == 2 && pair[0].equals("slug")) {
                        slug = URLDecoder.decode(pair[1], StandardCharsets.UTF_8);
                    }
                }
            }

            if (slug != null && !slug.isEmpty()) {
                Models.BlogPost post = notionService.getPostBySlug(slug);
                if (post != null) {
                    var blocks = notionService.getBlocksForPost(slug);
                    JsonObject res = new JsonObject();
                    res.add("post", gson.toJsonTree(post));
                    res.add("blocks", blocks);
                    byte[] bytes = gson.toJson(res).getBytes(StandardCharsets.UTF_8);
                    exchange.sendResponseHeaders(200, bytes.length);
                    try (OutputStream os = exchange.getResponseBody()) { os.write(bytes); }
                    return;
                } else {
                    byte[] bytes = "{\"error\": \"Post not found\"}".getBytes(StandardCharsets.UTF_8);
                    exchange.sendResponseHeaders(404, bytes.length);
                    try (OutputStream os = exchange.getResponseBody()) { os.write(bytes); }
                    return;
                }
            }

            // Return all posts
            List<Models.BlogPost> posts = notionService.getAllPosts();
            byte[] bytes = gson.toJson(posts).getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) { os.write(bytes); }
        }
    }

    static class ApiSyncHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");

            if ("POST".equalsIgnoreCase(exchange.getRequestMethod()) || "GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                boolean ok = notionService.sync();
                JsonObject res = new JsonObject();
                res.addProperty("success", ok);
                res.addProperty("count", notionService.getAllPosts().size());
                byte[] bytes = gson.toJson(res).getBytes(StandardCharsets.UTF_8);
                exchange.sendResponseHeaders(ok ? 200 : 500, bytes.length);
                try (OutputStream os = exchange.getResponseBody()) { os.write(bytes); }
            } else {
                exchange.sendResponseHeaders(405, -1);
            }
        }
    }

    static class StaticFileHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String rawPath = exchange.getRequestURI().getPath();
            String pathStr = rawPath.startsWith("/") ? rawPath.substring(1) : rawPath;

            Path file = Paths.get(pathStr);
            if (!Files.exists(file) || Files.isDirectory(file)) {
                if (pathStr.startsWith("static/")) {
                    file = Paths.get(pathStr);
                } else {
                    file = Paths.get("static", pathStr);
                }
            }

            if (Files.exists(file) && !Files.isDirectory(file)) {
                serveFile(exchange, file, getMimeType(file.toString()));
            } else {
                byte[] msg = "404 Not Found".getBytes(StandardCharsets.UTF_8);
                exchange.sendResponseHeaders(404, msg.length);
                try (OutputStream os = exchange.getResponseBody()) { os.write(msg); }
            }
        }
    }

    private static void serveFile(HttpExchange exchange, Path path, String contentType) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", contentType);
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        byte[] bytes = Files.readAllBytes(path);
        exchange.sendResponseHeaders(200, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static String getMimeType(String filename) {
        String lower = filename.toLowerCase();
        if (lower.endsWith(".html")) return "text/html; charset=utf-8";
        if (lower.endsWith(".css")) return "text/css; charset=utf-8";
        if (lower.endsWith(".js")) return "application/javascript; charset=utf-8";
        if (lower.endsWith(".json")) return "application/json; charset=utf-8";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".svg")) return "image/svg+xml";
        if (lower.endsWith(".ico")) return "image/x-icon";
        if (lower.endsWith(".webp")) return "image/webp";
        return "application/octet-stream";
    }
}
