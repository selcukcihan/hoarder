// TypeScript types for CLI

export interface Config {
  cloudflare: {
    accountId: string;
    apiToken: string;
    browserRenderingApiUrl?: string;
  };
  gemini: {
    apiKey: string;
    model?: string;
  };
  database: {
    accountId: string;
    databaseId: string;
    apiToken: string;
  };
}

export interface ScrapedContent {
  title: string;
  markdown: string;
  thumbnailUrl: string | null;
  description: string | null;
}

export interface Summaries {
  short: string;
  extended: string;
}

export interface ArticleData {
  slug: string;
  title: string;
  url: string;
  thumbnail_url: string | null;
  content_type: 'article' | 'video' | 'blog_post' | 'other';
  short_summary: string;
  extended_summary: string;
  markdown_content: string | null;
  transcription: string | null;
  week_start_date: string;
  tags: string[];
}

