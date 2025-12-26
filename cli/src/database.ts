// D1 Database client for CLI

import type { Config } from './types';

export class D1Client {
  private accountId: string;
  private databaseId: string;
  private apiToken: string;
  private baseUrl: string;

  constructor(config: Config['database']) {
    this.accountId = config.accountId;
    this.databaseId = config.databaseId;
    this.apiToken = config.apiToken;
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/d1/database/${this.databaseId}`;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`D1 API error: ${response.status} ${error}`);
    }

    return response;
  }

  /**
   * Execute a SQL query
   */
  async query<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    const response = await this.request('/query', {
      method: 'POST',
      body: JSON.stringify({
        sql,
        params,
      }),
    });

    const data = await response.json();
    return data.result?.[0]?.results || [];
  }

  /**
   * Execute a SQL statement (INSERT, UPDATE, DELETE)
   */
  async execute(sql: string, params: unknown[] = []): Promise<{ lastInsertRowid: number; changes: number }> {
    const response = await this.request('/query', {
      method: 'POST',
      body: JSON.stringify({
        sql,
        params,
      }),
    });

    const data = await response.json();
    const result = data.result?.[0];
    
    return {
      lastInsertRowid: result?.meta?.last_row_id || 0,
      changes: result?.meta?.changes || 0,
    };
  }

  /**
   * Check if a slug exists
   */
  async slugExists(slug: string): Promise<boolean> {
    const results = await this.query<{ count: number }>(
      'SELECT COUNT(*) as count FROM articles WHERE slug = ?',
      [slug]
    );
    
    return results[0]?.count > 0;
  }

  /**
   * Get all existing slugs
   */
  async getAllSlugs(): Promise<Set<string>> {
    const results = await this.query<{ slug: string }>('SELECT slug FROM articles');
    return new Set(results.map((r) => r.slug));
  }

  /**
   * Insert or get tag ID
   */
  async getOrCreateTag(tagName: string): Promise<number> {
    // Try to get existing tag
    const existing = await this.query<{ id: number }>(
      'SELECT id FROM tags WHERE name = ?',
      [tagName]
    );

    if (existing.length > 0) {
      return existing[0].id;
    }

    // Create new tag
    const result = await this.execute('INSERT INTO tags (name) VALUES (?)', [tagName]);
    return result.lastInsertRowid;
  }

  /**
   * Insert article and return ID
   */
  async insertArticle(article: {
    slug: string;
    title: string;
    url: string;
    thumbnail_url: string | null;
    content_type: string;
    short_summary: string;
    extended_summary: string;
    markdown_content: string | null;
    transcription: string | null;
    week_start_date: string;
  }): Promise<number> {
    const result = await this.execute(
      `INSERT INTO articles (
        slug, title, url, thumbnail_url, content_type,
        short_summary, extended_summary, markdown_content,
        transcription, week_start_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        article.slug,
        article.title,
        article.url,
        article.thumbnail_url,
        article.content_type,
        article.short_summary,
        article.extended_summary,
        article.markdown_content,
        article.transcription,
        article.week_start_date,
      ]
    );

    return result.lastInsertRowid;
  }

  /**
   * Link article to tags
   */
  async linkArticleToTags(articleId: number, tagIds: number[]): Promise<void> {
    // Remove existing tags
    await this.execute('DELETE FROM article_tags WHERE article_id = ?', [articleId]);

    // Insert new tags
    for (const tagId of tagIds) {
      await this.execute(
        'INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)',
        [articleId, tagId]
      );
    }
  }
}

