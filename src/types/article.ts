// TypeScript types for articles and related entities

export type ContentType = 'article' | 'video' | 'blog_post' | 'other';

export interface Article {
  id: number;
  slug: string;
  title: string;
  url: string;
  thumbnail_url: string | null;
  content_type: ContentType;
  short_summary: string;
  extended_summary: string | null;
  markdown_content: string | null;
  transcription: string | null;
  week_start_date: string; // YYYY-MM-DD format
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface TagWithCount extends Tag {
  count: number;
}

export interface ArticleWithTags extends Article {
  tags: Tag[];
}

export interface ArticleRow {
  id: number;
  slug: string;
  title: string;
  url: string;
  thumbnail_url: string | null;
  content_type: string;
  short_summary: string;
  extended_summary: string | null;
  markdown_content: string | null;
  transcription: string | null;
  week_start_date: string;
  created_at: string;
  updated_at: string;
}

export interface TagRow {
  id: number;
  name: string;
}

