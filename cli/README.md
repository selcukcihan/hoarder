# Link Archive CLI

CLI tool for ingesting URLs into the link archive database.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the `cli` directory and set these variables:

**Required:**
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID
- `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token
- `GEMINI_API_KEY` - Your Google Gemini API key
- `D1_DATABASE_ID` - Your Cloudflare D1 database ID

**Optional:**
- `CLOUDFLARE_BROWSER_RENDERING_API_URL` - Custom Browser Rendering API URL (if not using default)
- `GEMINI_MODEL` - Gemini model to use (defaults to `gemini-3-flash-preview`)
- `YOUTUBE_API_KEY` - YouTube API key for fetching video transcriptions

## Build

```bash
npm run build
```

## Usage

### Development (using tsx)
```bash
npm run dev ingest https://example.com/article
```

### Production (after build)
```bash
npm start ingest https://example.com/article
```

### With tags
```bash
npm run dev ingest https://example.com/article --tags "javascript,web-dev,tutorial"
```

### Multiple URLs
```bash
npm run dev ingest https://example.com/article1 https://example.com/article2
```

## How it works

1. Scrapes the URL using Cloudflare Browser Rendering API
2. Extracts title, markdown content, and thumbnail
3. Generates short and extended summaries using Google Gemini
4. Creates a unique slug from the title
5. Calculates the week start date (Monday)
6. Stores everything in the D1 database

