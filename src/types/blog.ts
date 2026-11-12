export interface NotionColor {
  name: string;
  color: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary: string;
  category: NotionColor | null;
  tags: NotionColor[];
  readTime: string;
  date: string;
  published: boolean;
  coverImage: string | null;
  localCoverImage?: string | null;
  lastEditedTime?: string;
}

export interface RichTextItem {
  type: string;
  text?: {
    content: string;
    link: { url: string } | null;
  };
  annotations: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
  };
  plain_text: string;
  href?: string | null;
}

export interface NotionBlock {
  id: string;
  type: string;
  has_children: boolean;
  children?: NotionBlock[];
  [key: string]: any;
}

export interface TocHeading {
  id: string;
  text: string;
  level: number;
}

