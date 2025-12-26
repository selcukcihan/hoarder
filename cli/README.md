# Link Archive CLI

CLI tool for ingesting URLs into the link archive database.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `config.json` file (copy from `config.example.json`):
```bash
cp config.example.json config.json
```

3. Fill in your API keys and credentials in `config.json`:
   - Cloudflare Account ID and API Token
   - Google Gemini API Key
   - D1 Database ID

Alternatively, you can use environment variables:
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `GEMINI_API_KEY`
- `D1_DATABASE_ID`

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

