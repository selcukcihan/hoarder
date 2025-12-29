# Hoarder

A link archive web application that automatically scrapes, summarizes, and organizes web content using AI. Built with Astro, Cloudflare Workers, and Google Gemini.

## Overview

Hoarder is a personal link archive system that helps you save and organize articles, blog posts, and videos. It automatically:

- Scrapes content from URLs using Cloudflare Browser Rendering API
- Generates AI-powered summaries using Google Gemini
- Organizes content by week (Monday-Sunday)
- Supports tagging for easy filtering
- Provides a clean web interface to browse your archive

## Features

- **CLI Tool**: Ingest URLs from the command line with automatic content detection
- **AI Summarization**: Generates short and extended summaries using Google Gemini
- **Content Types**: Supports articles, blog posts, and YouTube videos
- **Weekly Organization**: Automatically groups content by week
- **Tagging System**: Organize and filter content by tags
- **Web Interface**: Browse your archive with a modern Astro-based web app
- **Cloudflare Integration**: Hosted on Cloudflare Workers with D1 database

## Architecture

The project consists of three main components:

1. **CLI Tool** (`/cli`): Node.js/TypeScript CLI for ingesting URLs
   - Scrapes content using Cloudflare Browser Rendering API
   - Generates summaries using Google Gemini API
   - Stores data in Cloudflare D1 database

2. **Web Application** (`/src`): Astro-based frontend
   - Server-side rendered pages
   - Weekly archive views
   - Individual article detail pages
   - Tag filtering

3. **Database** (Cloudflare D1): SQLite database
   - Stores articles, metadata, tags, and relationships

## Prerequisites

- Node.js (v18 or higher)
- Cloudflare account with:
  - API token with D1 and Browser Rendering API permissions
  - D1 database created
- Google Gemini API key
- (Optional) YouTube API key for video transcriptions

## Quick Start

### 1. Clone and Install

```bash
# Install root dependencies
npm install

# Install CLI dependencies
cd cli
npm install
cd ..
```

### 2. Set Up Cloudflare D1 Database

```bash
# Create the database
wrangler d1 create hoarder

# Run migrations
wrangler d1 execute hoarder --file=./migrations/001_initial_schema.sql
```

Update `wrangler.jsonc` with your database ID.

### 3. Configure Environment Variables

Create a `.env` file in the `cli` directory:

```bash
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
GEMINI_API_KEY=your-gemini-key
D1_DATABASE_ID=your-database-id

# Optional
YOUTUBE_API_KEY=your-youtube-key
GEMINI_MODEL=gemini-3-flash-preview
```

### 4. Build CLI

```bash
cd cli
npm run build
cd ..
```

### 5. Ingest Your First URL

```bash
cd cli
npm run dev ingest https://example.com/article --tags "web-dev,tutorial"
```

### 6. Run Web Application

```bash
# Development server
npm run dev

# Or with Cloudflare remote bindings
npm run dev:remote
```

Visit `http://localhost:4321` to see your archive.

## CLI Usage

The CLI tool is located in the `/cli` directory.

### Basic Usage

```bash
# Single URL
npm run dev ingest https://example.com/article

# Multiple URLs
npm run dev ingest https://example.com/article1 https://youtube.com/watch?v=xyz

# With tags
npm run dev ingest https://example.com/article --tags "javascript,web-dev,tutorial"
```

### How It Works

1. **Content Detection**: Automatically detects if URL is a YouTube video or article
2. **Scraping**: Uses Cloudflare Browser Rendering API to extract:
   - Title
   - Markdown content (for articles)
   - Thumbnail URL
   - Metadata
3. **Transcription**: For YouTube videos, fetches transcription or uses description
4. **Summarization**: Generates:
   - Short summary (2-3 sentences, for list views)
   - Extended summary (5-7 sentences, for detail pages)
5. **Storage**: Creates slug, calculates week start date, and stores in D1 database

### CLI Commands

```bash
# Development mode (using tsx)
npm run dev ingest <url> [options]

# Production mode (after build)
npm start ingest <url> [options]

# Build CLI
npm run build
```

### Options

- `--tags "tag1,tag2"`: Add tags to the article
- `--force`: Overwrite existing article if slug matches

## Web Application

The web application provides a clean interface to browse your archived content.

### Routes

- `/` - Home page (current week's articles)
- `/{date}` - Weekly archive (date format: `YYYY-MM-DD`, must be a Monday)
- `/{slug}` - Individual article detail page

### Features

- **Weekly Navigation**: Browse articles by week
- **Tag Filtering**: Filter articles by tags
- **Article Details**: View full content, summaries, and metadata
- **Responsive Design**: Works on desktop and mobile

### Development

```bash
# Local development (uses local D1)
npm run dev

# Remote development (uses remote D1)
npm run dev:remote

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

### Deploy to Cloudflare

```bash
# Build and deploy
npm run deploy

# Or manually
npm run build
wrangler deploy
```

Make sure your `wrangler.jsonc` is configured with:
- D1 database binding
- Cloudflare account ID
- Worker name

## Project Structure

```
hoarder/
├── cli/                    # CLI tool for ingestion
│   ├── src/
│   │   ├── index.ts        # CLI entry point
│   │   ├── scraper.ts      # Browser Rendering API client
│   │   ├── summarizer.ts   # Gemini API client
│   │   ├── database.ts     # D1 API client
│   │   ├── youtube.ts      # YouTube integration
│   │   ├── utils.ts        # Utilities (slug, week calc, etc.)
│   │   └── types.ts        # TypeScript types
│   └── package.json
│
├── src/                    # Astro web application
│   ├── components/         # Astro components
│   ├── layouts/           # Page layouts
│   ├── pages/             # Routes
│   ├── lib/               # Utilities and database helpers
│   └── types/             # TypeScript types
│
├── migrations/            # Database migrations
├── public/                # Static assets
├── astro.config.mjs       # Astro configuration
├── wrangler.jsonc         # Cloudflare Workers config
└── package.json
```

## Documentation

- [Setup Guide](./SETUP.md) - Detailed setup instructions
- [Execution Plan](./EXECUTION_PLAN.md) - Architecture and implementation details
- [CLI README](./cli/README.md) - CLI-specific documentation

## Troubleshooting

### Database Connection Issues

- Verify D1 database ID in `wrangler.jsonc`
- Check database binding name matches (`DB`)
- Ensure API token has D1 permissions

### CLI Errors

- Verify all environment variables are set in `cli/.env`
- Check Cloudflare API token has required permissions
- Ensure database ID is correct

### Browser Rendering API Errors

- Verify API token has Browser Rendering API access
- Check account ID is correct

### Gemini API Errors

- Verify API key is correct
- Check rate limits if making many requests

## License

[Add your license here]

---

## Astro Project Structure

This project uses [Astro](https://astro.build), a modern web framework for building fast, content-focused websites.

### 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src
│   ├── assets
│   │   └── astro.svg
│   ├── components
│   │   └── Welcome.astro
│   ├── layouts
│   │   └── Layout.astro
│   └── pages
│       └── index.astro
└── package.json
```

To learn more about the folder structure of an Astro project, refer to [our guide on project structure](https://docs.astro.build/en/basics/project-structure/).

### 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

### 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
