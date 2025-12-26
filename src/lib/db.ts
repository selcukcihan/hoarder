// Database helper functions for D1

import type { Article, ArticleWithTags, Tag } from '../types/article';

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  exec(query: string): Promise<D1ExecResult>;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = unknown>(): Promise<D1Result<T>>;
}

export interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: {
    duration: number;
    rows_read: number;
    rows_written: number;
    last_row_id: number;
    changed_db: boolean;
    changes: number;
  };
}

export interface D1ExecResult {
  count: number;
  duration: number;
}

/**
 * Get all articles for a specific week
 */
export async function getArticlesByWeek(
  db: D1Database,
  weekStartDate: string
): Promise<ArticleWithTags[]> {
  const articles = await db
    .prepare(
      `SELECT a.*, 
       GROUP_CONCAT(t.id || ':' || t.name) as tag_data
       FROM articles a
       LEFT JOIN article_tags at ON a.id = at.article_id
       LEFT JOIN tags t ON at.tag_id = t.id
       WHERE a.week_start_date = ?
       GROUP BY a.id
       ORDER BY a.created_at DESC`
    )
    .bind(weekStartDate)
    .all<Article & { tag_data: string | null }>();

  return articles.results.map((article) => ({
    ...article,
    tags: article.tag_data
      ? article.tag_data.split(',').map((tagStr) => {
          const [id, name] = tagStr.split(':');
          return { id: parseInt(id), name };
        })
      : [],
  })) as ArticleWithTags[];
}

/**
 * Get article by slug with tags
 */
export async function getArticleBySlug(
  db: D1Database,
  slug: string
): Promise<ArticleWithTags | null> {
  const result = await db
    .prepare(
      `SELECT a.*, 
       GROUP_CONCAT(t.id || ':' || t.name) as tag_data
       FROM articles a
       LEFT JOIN article_tags at ON a.id = at.article_id
       LEFT JOIN tags t ON at.tag_id = t.id
       WHERE a.slug = ?
       GROUP BY a.id`
    )
    .bind(slug)
    .first<Article & { tag_data: string | null }>();

  if (!result) {
    return null;
  }

  return {
    ...result,
    tags: result.tag_data
      ? result.tag_data.split(',').map((tagStr) => {
          const [id, name] = tagStr.split(':');
          return { id: parseInt(id), name };
        })
      : [],
  } as ArticleWithTags;
}

/**
 * Get all unique week start dates (for navigation)
 */
export async function getWeekStartDates(
  db: D1Database
): Promise<string[]> {
  const result = await db
    .prepare(
      `SELECT DISTINCT week_start_date 
       FROM articles 
       ORDER BY week_start_date DESC`
    )
    .all<{ week_start_date: string }>();

  return result.results.map((row) => row.week_start_date);
}

/**
 * Get articles filtered by tag
 */
export async function getArticlesByTag(
  db: D1Database,
  tagName: string,
  weekStartDate?: string
): Promise<ArticleWithTags[]> {
  let query = `SELECT DISTINCT a.*, 
       GROUP_CONCAT(t.id || ':' || t.name) as tag_data
       FROM articles a
       INNER JOIN article_tags at ON a.id = at.article_id
       INNER JOIN tags t ON at.tag_id = t.id
       WHERE t.name = ?`;

  const binds: unknown[] = [tagName];

  if (weekStartDate) {
    query += ` AND a.week_start_date = ?`;
    binds.push(weekStartDate);
  }

  query += ` GROUP BY a.id ORDER BY a.created_at DESC`;

  const articles = await db
    .prepare(query)
    .bind(...binds)
    .all<Article & { tag_data: string | null }>();

  return articles.results.map((article) => ({
    ...article,
    tags: article.tag_data
      ? article.tag_data.split(',').map((tagStr) => {
          const [id, name] = tagStr.split(':');
          return { id: parseInt(id), name };
        })
      : [],
  })) as ArticleWithTags[];
}

/**
 * Get all tags
 */
export async function getAllTags(db: D1Database): Promise<Tag[]> {
  const result = await db
    .prepare(`SELECT * FROM tags ORDER BY name`)
    .all<Tag>();

  return result.results;
}

/**
 * Check if slug exists
 */
export async function slugExists(
  db: D1Database,
  slug: string
): Promise<boolean> {
  const result = await db
    .prepare(`SELECT 1 FROM articles WHERE slug = ? LIMIT 1`)
    .bind(slug)
    .first<{ '1': number }>();

  return result !== null;
}

