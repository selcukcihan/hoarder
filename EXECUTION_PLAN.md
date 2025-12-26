# Execution Plan: Link Archive Web Application

## Overview

This document outlines the architecture and implementation plan for a link archive web application that uses AI summarization, hosted on Cloudflare Workers with Astro, and a CLI tool for content ingestion.

---

## Architecture Overview

### Components

1. **CLI Tool** (Local Machine)
   - Ingests URLs via command-line
   - Scrapes content using Cloudflare Browser Rendering API
   - Generates summaries using Google Gemini API
   - Stores data in Cloudflare D1 database (via API)

2. **Astro Web Application** (Cloudflare Workers)
   - Server-side rendered website
   - Displays archived links grouped by week
   - Supports filtering by tags
   - Individual article detail pages

3. **Database** (Cloudflare D1)
   - SQLite database hosted on Cloudflare
   - Stores articles, metadata, tags, and relationships

---

## Data Model

### Database Schema

#### `articles` table
```sql
CREATE TABLE articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
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

CREATE INDEX idx_week_start ON articles(week_start_date);
CREATE INDEX idx_slug ON articles(slug);
CREATE INDEX idx_created_at ON articles(created_at);
```

#### `tags` table
```sql
CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);
```

#### `article_tags` table (many-to-many)
```sql
CREATE TABLE article_tags (
  article_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (article_id, tag_id),
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE INDEX idx_article_tags_article ON article_tags(article_id);
CREATE INDEX idx_article_tags_tag ON article_tags(tag_id);
```

---

## CLI Tool Architecture

### Location
- **Directory**: `/cli` (separate from Astro app, or `/scripts/cli` within the project)
- **Language**: Node.js/TypeScript
- **Entry Point**: `cli/index.ts` or `cli/cli.js`

### CLI Commands

```bash
# Single URL
node cli/index.js ingest https://example.com/article

# Multiple URLs
node cli/index.js ingest https://example.com/article1 https://youtube.com/watch?v=xyz

# With explicit tags
node cli/index.js ingest https://example.com/article --tags "javascript,web-dev,tutorial"
```

### CLI Workflow

1. **Parse Arguments**
   - Extract URLs from command line
   - Parse optional flags (--tags, --force, etc.)

2. **For Each URL:**
   
   a. **Detect Content Type**
      - Check if URL is YouTube (youtube.com, youtu.be)
      - Check if URL is a video platform
      - Default to "article" or "blog_post"
   
   b. **Scrape Content**
      - **For Articles/Blog Posts:**
        - Use Cloudflare Browser Rendering API to:
          - Extract main content as markdown
          - Extract title (from `<title>` or `<h1>`)
          - Extract thumbnail (Open Graph image, or first large image)
          - Extract meta description
      
      - **For Videos (YouTube):**
        - Use YouTube API or scraping to get:
          - Video title
          - Video description
          - Thumbnail URL
        - Fetch transcription (YouTube API or third-party service)
        - If transcription unavailable, use video description as fallback
   
   c. **Generate Summaries**
      - **Short Summary** (for list views):
        - Prompt: "Summarize this content in 2-3 sentences (max 200 characters)"
        - Input: Markdown content (for articles) or transcription (for videos)
      
      - **Extended Summary** (for detail pages):
        - Prompt: "Provide a comprehensive summary of this content in 5-7 sentences, highlighting key points"
        - Input: Same as above
   
   d. **Generate Slug**
      - Create URL-friendly slug from title
      - **Important**: Validate slug doesn't match date format (`YYYY-MM-DD`)
      - If slug matches date pattern, append suffix (e.g., `-article`)
      - Ensure uniqueness (append number if needed)
      - Check database for existing slugs
   
   e. **Calculate Week Start Date**
      - Get current date
      - Find previous Monday (or current Monday if today is Monday)
      - Format as YYYY-MM-DD
   
   f. **Store in Database**
      - Insert article record
      - Insert/update tags
      - Link article to tags

3. **Output Results**
   - Display success/failure for each URL
   - Show generated slug
   - Show assigned week

### CLI Configuration

**File**: `cli/config.json` or environment variables
```json
{
  "cloudflare": {
    "accountId": "your-account-id",
    "apiToken": "your-api-token",
    "browserRenderingApiUrl": "https://api.cloudflare.com/client/v4/accounts/{accountId}/browser-rendering"
  },
  "gemini": {
    "apiKey": "your-gemini-api-key",
    "model": "gemini-1.5-flash"  // or gemini-1.5-pro
  },
  "database": {
    "accountId": "your-account-id",
    "databaseId": "your-database-id",
    "apiToken": "your-api-token"
  }
}
```

### CLI Dependencies
- `@cloudflare/api` or direct HTTP client for Browser Rendering API
- `@google/generative-ai` for Gemini API
- `@cloudflare/d1-api` or direct HTTP client for D1 API
- `turndown` or similar for HTML to Markdown conversion
- `yargs` or `commander` for CLI argument parsing
- `slugify` for generating URL-friendly slugs

---

## Web Application Architecture

### Astro Pages Structure

```
src/pages/
├── index.astro              # Home page (current week)
├── [...path].astro          # Single route handling both /{date} and /{slug}
└── api/
    └── articles.json.ts     # API endpoint for filtering/search (optional)
```

### Routing Strategy

**URL Structure** (as originally proposed):
- `/2025-12-22` → Weekly archive (date format)
- `/my-article-slug` → Article detail (slug format)

**Implementation**: Use a single catch-all route `[...path].astro` with pattern matching logic to differentiate between dates and slugs.

**Implementation**:
1. Extract the path parameter
2. Check if it matches date format (`YYYY-MM-DD`)
3. If date format:
   - Validate it's a Monday
   - Query articles for that week
   - Render weekly archive page
4. If not date format:
   - Treat as slug
   - Query article by slug
   - Render article detail page
   - Return 404 if article not found

**Date Format Validation**:
- Pattern: `^\d{4}-\d{2}-\d{2}$`
- Validate it's a valid date
- Check if it's a Monday (day of week = 1)
- Redirect to nearest Monday if not

**Slug Format**:
- Any string that doesn't match date format
- URL-friendly (lowercase, hyphens, no special chars)
- Must exist in database

**Alternative Approach (if preferred)**: Use route prefixes:
- Weekly archives: `/week/2025-12-22`
- Articles: `/article/my-slug` or just `/my-slug`
- This makes routing explicit but requires URL changes

**Recommended**: Use catch-all route with pattern matching for cleaner URLs.

**Example Implementation** (`src/pages/[...path].astro`):
```typescript
---
// Extract path parameter
const path = Astro.params.path;

// Date pattern: YYYY-MM-DD
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const isDate = datePattern.test(path);

if (isDate) {
  // Handle weekly archive
  const date = new Date(path);
  // Validate date and check if Monday
  // Query articles for that week
  // Render weekly archive
} else {
  // Handle article slug
  // Query article by slug
  // Render article detail or 404
}
---
```

**Important Considerations**:
1. **Slug Validation**: The CLI should prevent creating slugs that match the date format (`YYYY-MM-DD`). If a title generates such a slug, append a suffix (e.g., `2025-12-22-article`).
2. **Priority**: Date format takes precedence. If there's ever a conflict, the date route wins.
3. **Edge Cases**:
   - Invalid dates (e.g., `2025-13-45`) → Treat as slug, will 404 if not found
   - Dates that aren't Mondays → Redirect to nearest Monday
   - Future dates → Could show empty archive or redirect to current week

### Page Implementations

#### 1. Home Page (`/` - `index.astro`)
- **Data Fetching**: Query articles for current week (Monday of current week)
- **Display**: List of articles with:
  - Thumbnail (linked to original image)
  - Title (linked to detail page)
  - Short summary
  - Tags
  - Link to original URL
- **Navigation**: Week selector dropdown/calendar

#### 2. Weekly Archive Page (`/[...path].astro` - when path matches date)
- **Route**: `/2025-12-22` (Monday date format)
- **Detection**: Check if path matches `YYYY-MM-DD` pattern
- **Data Fetching**: Query articles for that specific week
- **Display**: Same as home page
- **Validation**: 
  - Ensure date is valid
  - Ensure date is a Monday
  - Redirect to nearest Monday if not
  - Return 404 if date is in the future (or handle gracefully)

#### 3. Article Detail Page (`/[...path].astro` - when path is slug)
- **Route**: `/my-article-slug`
- **Detection**: Path doesn't match date format
- **Data Fetching**: Query article by slug
- **Display**:
  - Full title
  - Thumbnail
  - Extended summary
  - Tags
  - Link to original URL
  - Full markdown content (if available)
  - Transcription (for videos)
- **Navigation**: Back to week archive, previous/next article
- **Error Handling**: Return 404 if article not found

### Components Structure

```
src/components/
├── ArticleCard.astro        # Article preview card (for list views)
├── ArticleDetail.astro      # Full article display
├── WeekSelector.astro       # Week navigation dropdown/calendar
├── TagFilter.astro          # Tag filtering component
├── TagList.astro            # Display tags for an article
└── Layout.astro             # Base layout (already exists)
```

### Data Fetching Strategy

**Option 1: Direct D1 Access (Recommended)**
- Use Cloudflare D1 binding in Astro
- Query database directly in page components
- Pros: Fast, no API overhead
- Cons: Requires D1 binding configuration

**Option 2: API Routes**
- Create API endpoints in `src/pages/api/`
- Fetch from API in client or server
- Pros: Separation of concerns
- Cons: Additional network hop

**Recommended**: Use Option 1 with D1 bindings for better performance.

### Cloudflare D1 Binding

**In `wrangler.jsonc`:**
```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "hoarder",
      "database_id": "your-database-id"
    }
  ]
}
```

**In Astro pages:**
```typescript
// Access via Astro.locals.runtime.env.DB
const db = Astro.locals.runtime.env.DB;
const articles = await db.prepare("SELECT * FROM articles WHERE week_start_date = ?").bind(weekDate).all();
```

---

## Data Flow

### Ingestion Flow (CLI → Database)

```
CLI receives URL
    ↓
Detect content type
    ↓
Scrape with Browser Rendering API
    ↓
Extract: title, markdown, thumbnail URL
    ↓
Generate summaries with Gemini
    ↓
Generate slug
    ↓
Calculate week start date
    ↓
Insert into D1 database
    ↓
Link tags
```

### Display Flow (Database → Website)

```
User visits page
    ↓
Astro page queries D1
    ↓
Format data
    ↓
Render HTML
    ↓
Serve to user
```

---

## Implementation Phases

### Phase 1: Database Setup
1. Create Cloudflare D1 database
2. Write migration scripts for schema
3. Test database connection from CLI
4. Test database connection from Astro app

### Phase 2: CLI Tool - Core Functionality
1. Set up CLI project structure
2. Implement URL parsing and argument handling
3. Implement Cloudflare Browser Rendering API integration
4. Implement content scraping (markdown extraction)
5. Implement thumbnail extraction
6. Implement Gemini API integration
7. Implement summary generation (short + extended)
8. Implement slug generation
9. Implement week calculation
10. Implement D1 database insertion
11. Implement tag handling

### Phase 3: CLI Tool - Video Support
1. Implement YouTube URL detection
2. Implement YouTube metadata extraction
3. Implement transcription fetching (YouTube API or alternative)
4. Test video ingestion end-to-end

### Phase 4: Web Application - Core Pages
1. Set up D1 binding in Astro
2. Implement home page (current week)
3. Implement weekly archive page (`[week].astro`)
4. Implement article detail page (`[slug].astro`)
5. Create ArticleCard component
6. Create ArticleDetail component
7. Implement basic styling

### Phase 5: Web Application - Navigation & Filtering
1. Implement WeekSelector component
2. Implement TagFilter component
3. Add tag filtering functionality
4. Add week navigation
5. Implement tag list display

### Phase 6: Polish & Optimization
1. Add error handling
2. Add loading states
3. Optimize database queries
4. Add SEO meta tags
5. Add responsive design
6. Test edge cases

---

## Technical Decisions

### Why Cloudflare D1?
- Native integration with Cloudflare Workers
- SQLite-based (familiar SQL syntax)
- Free tier available
- Low latency when co-located with Workers

### Why Not Rehost Images?
- Saves storage costs
- Reduces bandwidth usage
- Simpler implementation
- **Consideration**: Images may break if original site removes them
- **Future**: Could add image proxy/caching layer if needed

### Slug Generation Strategy
- Generate from title: "My Great Article" → "my-great-article"
- **Validate against date format**: Ensure slug doesn't match `YYYY-MM-DD` pattern
  - If it matches, append suffix (e.g., `2025-12-22` → `2025-12-22-article`)
- Handle duplicates: append `-2`, `-3`, etc.
- Sanitize: remove special characters, handle unicode
- Store in database for uniqueness checks

### Week Calculation
- Weeks start on Monday
- Use ISO week standard or custom (Monday-Sunday)
- Format: `YYYY-MM-DD` (e.g., `2025-12-22`)
- Home page shows week containing current date

### Content Type Detection
- Check URL patterns (youtube.com, youtu.be → video)
- Could extend to other video platforms
- Default to "article" for unknown types

### Transcription for Videos
- **Option 1**: YouTube Data API v3 (requires API key, may have quotas)
- **Option 2**: YouTube Transcript API (unofficial, may break)
- **Option 3**: Use video description as fallback
- **Option 4**: Use Gemini to summarize video description + comments (if available)

**Recommendation**: Start with Option 3 (description), add Option 1 if needed.

---

## File Structure

### Proposed Structure

```
hoarder/
├── cli/                          # CLI tool (separate package)
│   ├── src/
│   │   ├── index.ts              # CLI entry point
│   │   ├── scraper.ts            # Browser Rendering API client
│   │   ├── summarizer.ts         # Gemini API client
│   │   ├── database.ts           # D1 API client
│   │   ├── utils.ts              # Slug generation, week calculation, etc.
│   │   └── types.ts              # TypeScript types
│   ├── config.example.json       # Example config file
│   ├── package.json
│   └── tsconfig.json
│
├── src/                          # Astro application
│   ├── components/
│   │   ├── ArticleCard.astro
│   │   ├── ArticleDetail.astro
│   │   ├── WeekSelector.astro
│   │   ├── TagFilter.astro
│   │   └── TagList.astro
│   ├── layouts/
│   │   └── Layout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── [week].astro
│   │   ├── [slug].astro
│   │   └── api/                  # Optional API routes
│   ├── lib/
│   │   └── db.ts                 # Database helper functions
│   └── types/
│       └── article.ts            # TypeScript types
│
├── migrations/                   # Database migrations
│   └── 001_initial_schema.sql
│
├── astro.config.mjs
├── wrangler.jsonc
├── package.json
└── EXECUTION_PLAN.md            # This file
```

---

## API Integration Details

### Cloudflare Browser Rendering API

**Endpoint**: `POST https://api.cloudflare.com/client/v4/accounts/{account_id}/browser-rendering`

**Request**:
```json
{
  "url": "https://example.com/article",
  "waitUntil": "networkidle",
  "actions": [
    {
      "type": "extract",
      "selector": "main, article, .content",
      "format": "markdown"
    }
  ]
}
```

**Response**: Contains rendered HTML and extracted content.

**Note**: Check Cloudflare documentation for exact API format and available actions.

### Google Gemini API

**Endpoint**: `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`

**Request**:
```json
{
  "contents": [{
    "parts": [{
      "text": "Summarize this content in 2-3 sentences: [content here]"
    }]
  }]
}
```

**Usage**:
- Use `gemini-1.5-flash` for faster, cheaper summaries
- Use `gemini-1.5-pro` for more complex content if needed
- Implement retry logic for rate limits

### Cloudflare D1 API

**Endpoint**: `POST https://api.cloudflare.com/client/v4/accounts/{account_id}/d1/database/{database_id}/query`

**Request**:
```json
{
  "sql": "SELECT * FROM articles WHERE week_start_date = ?",
  "params": ["2025-12-22"]
}
```

**Alternative**: Use `@cloudflare/d1-api` package if available, or direct HTTP client.

---

## Environment Variables & Secrets

### CLI Tool
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `GEMINI_API_KEY`
- `D1_DATABASE_ID`

### Astro Application (Cloudflare Workers)
- D1 binding configured in `wrangler.jsonc`
- No API keys needed (D1 accessed via binding)

---

## Error Handling

### CLI Tool
- Handle invalid URLs
- Handle scraping failures (retry logic)
- Handle API rate limits (Gemini, Cloudflare)
- Handle database connection errors
- Validate data before insertion

### Web Application
- Handle missing articles (404)
- Handle invalid week dates (redirect to valid Monday)
- Handle database query errors
- Graceful degradation if images fail to load

---

## Future Enhancements (Out of Scope for Now)

1. **Search Functionality**: Full-text search across articles
2. **Image Proxy**: Cache and serve images through Cloudflare
3. **RSS Feed**: Generate RSS feed for archives
4. **Export**: Export archives as JSON/Markdown
5. **Analytics**: Track popular articles/tags
6. **Admin UI**: Web interface for ingestion (currently CLI-only)
7. **Batch Import**: Import from bookmarks, Pocket, etc.
8. **Content Updates**: Re-scrape and update existing articles

---

## Questions to Consider

1. **Thumbnail Fallback**: What to show if no thumbnail is found?
   - Default placeholder image?
   - First image from content?
   - Site favicon?

2. **Content Updates**: Should the CLI update existing articles if re-ingested?
   - Use `--force` flag to overwrite?
   - Skip if article exists?

3. **Tag Management**: How to handle tag naming?
   - Case-sensitive or case-insensitive?
   - Auto-suggest tags based on content?

4. **Week Boundaries**: What timezone for week calculation?
   - UTC?
   - User's local timezone?

5. **Video Platforms**: Support only YouTube initially, or other platforms?
   - Vimeo?
   - Other video sites?

6. **Transcription Quality**: What if transcription is poor quality?
   - Use video description only?
   - Allow manual transcription input?

---

## Next Steps

1. Review this execution plan
2. Clarify any questions or decisions needed
3. Set up Cloudflare D1 database
4. Begin Phase 1 implementation
5. Iterate based on feedback

---

## Notes

- The CLI and web app can share TypeScript types (consider a shared package or copying types)
- Consider using Astro's content collections if you want to support markdown files in the future
- The Browser Rendering API may have costs - check Cloudflare pricing
- Gemini API has rate limits - implement exponential backoff
- D1 has query limits - optimize queries and consider pagination for large archives

