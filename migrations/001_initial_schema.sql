-- Initial database schema for link archive application

-- Articles table
CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  url TEXT UNIQUE NOT NULL,  -- Unique constraint for deduplication
  thumbnail_url TEXT,  -- Original image URL (not rehosted)
  content_type TEXT NOT NULL,  -- 'article', 'video', 'blog_post', etc.
  short_summary TEXT NOT NULL,  -- For list views
  extended_summary TEXT,  -- For detail pages
  markdown_content TEXT,  -- Scraped markdown (for articles/blog posts)
  transcription TEXT,  -- For videos
  week_start_date DATE NOT NULL,  -- Monday of the week (YYYY-MM-DD)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);

-- Article tags junction table (many-to-many)
CREATE TABLE IF NOT EXISTS article_tags (
  article_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (article_id, tag_id),
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_week_start ON articles(week_start_date);
CREATE INDEX IF NOT EXISTS idx_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_url ON articles(url);  -- Index for URL lookups
CREATE INDEX IF NOT EXISTS idx_created_at ON articles(created_at);
CREATE INDEX IF NOT EXISTS idx_article_tags_article ON article_tags(article_id);
CREATE INDEX IF NOT EXISTS idx_article_tags_tag ON article_tags(tag_id);

