# Setup Instructions

## Prerequisites

1. Node.js (v18 or higher)
2. Cloudflare account with:
   - API token with D1 and Browser Rendering API permissions
   - D1 database created
3. Google Gemini API key

## Step 1: Create Cloudflare D1 Database

```bash
# In the project root
wrangler d1 create hoarder
```

This will output a database ID. Copy it.

## Step 2: Update wrangler.jsonc

Open `wrangler.jsonc` and replace `YOUR_DATABASE_ID_HERE` with the database ID from step 1.

## Step 3: Run Database Migration

```bash
# Get the database ID from wrangler.jsonc
wrangler d1 execute hoarder --file=./migrations/001_initial_schema.sql
```

Or if using remote database:
```bash
wrangler d1 execute hoarder --remote --file=./migrations/001_initial_schema.sql
```

## Step 4: Set Up CLI

1. Navigate to the CLI directory:
```bash
cd cli
```

2. Install dependencies:
```bash
npm install
```

3. Create config file:
```bash
cp config.example.json config.json
```

4. Edit `config.json` with your credentials:
   - Cloudflare Account ID
   - Cloudflare API Token
   - Google Gemini API Key
   - D1 Database ID

Alternatively, set environment variables:
```bash
export CLOUDFLARE_ACCOUNT_ID="your-account-id"
export CLOUDFLARE_API_TOKEN="your-api-token"
export GEMINI_API_KEY="your-gemini-key"
export D1_DATABASE_ID="your-database-id"
```

5. Build the CLI:
```bash
npm run build
```

## Step 5: Test CLI Ingestion

```bash
# Development mode
npm run dev ingest https://example.com/article

# Or after build
npm start ingest https://example.com/article

# With tags
npm run dev ingest https://example.com/article --tags "javascript,web-dev"
```

## Step 6: Set Up Web Application

1. Return to project root:
```bash
cd ..
```

2. Install dependencies:
```bash
npm install
```

3. Run development server:
```bash
npm run dev
```

The app will be available at `http://localhost:4321`

## Step 7: Deploy to Cloudflare

1. Build the application:
```bash
npm run build
```

2. Deploy:
```bash
npm run deploy
```

Or use:
```bash
wrangler deploy
```

## Notes

- The CLI runs on your local machine and communicates with Cloudflare D1 via API
- The web application runs on Cloudflare Workers and accesses D1 via binding
- Make sure your Cloudflare API token has the necessary permissions
- For YouTube videos, you can optionally set `YOUTUBE_API_KEY` environment variable for transcription support

## Troubleshooting

### Database not available error
- Make sure D1 database is created and ID is correct in `wrangler.jsonc`
- Verify the database binding name matches (`DB`)

### CLI connection errors
- Check your Cloudflare API token has D1 read/write permissions
- Verify account ID and database ID are correct

### Browser Rendering API errors
- Ensure your API token has Browser Rendering API access
- Check the API endpoint URL format

### Gemini API errors
- Verify your API key is correct
- Check rate limits if you're making many requests

