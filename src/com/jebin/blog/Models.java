package com.jebin.blog;

import java.util.ArrayList;
import java.util.List;

public class Models {

    public static class Tag {
        public String name;
        public String color;

        public Tag(String name, String color) {
            this.name = name;
            this.color = color;
        }
    }

    public static class Category {
        public String name;
        public String color;

        public Category(String name, String color) {
            this.name = name;
            this.color = color;
        }
    }

    public static class BlogPost {
        public String id;
        public String title;
        public String slug;
        public String summary;
        public Category category;
        public List<Tag> tags = new ArrayList<>();
        public String readTime;
        public String date;
        public boolean published;
        public String coverImage;
        public String localCoverImage;
        public String lastEditedTime;

        public BlogPost() {}
    }

    public static class PostWithBlocks {
        public BlogPost post;
        public Object blocks; // Can be a JsonArray / raw blocks

        public PostWithBlocks(BlogPost post, Object blocks) {
            this.post = post;
            this.blocks = blocks;
        }
    }
}

