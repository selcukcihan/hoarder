#!/usr/bin/env node

// CLI entry point for link archive ingestion

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { D1Client } from './database.js';
import { Scraper } from './scraper.js';
import { Summarizer } from './summarizer.js';
import {
  fetchYouTubeMetadata,
  fetchYouTubeTranscription,
  getVideoDescription,
} from './youtube.js';
import {
  generateSlug,
  ensureUniqueSlug,
  getWeekStartDate,
  detectContentType,
} from './utils.js';
import type { Config, ArticleData } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load configuration
function loadConfig(): Config {
  const configPath = process.env.CONFIG_PATH || join(__dirname, '../config.json');
  
  try {
    const configFile = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configFile);
    
    // Override with environment variables if present
    return {
      cloudflare: {
        accountId: process.env.CLOUDFLARE_ACCOUNT_ID || config.cloudflare.accountId,
        apiToken: process.env.CLOUDFLARE_API_TOKEN || config.cloudflare.apiToken,
        browserRenderingApiUrl: config.cloudflare.browserRenderingApiUrl,
      },
      gemini: {
        apiKey: process.env.GEMINI_API_KEY || config.gemini.apiKey,
        model: config.gemini.model || 'gemini-1.5-flash',
      },
      database: {
        accountId: process.env.CLOUDFLARE_ACCOUNT_ID || config.database.accountId,
        databaseId: process.env.D1_DATABASE_ID || config.database.databaseId,
        apiToken: process.env.CLOUDFLARE_API_TOKEN || config.database.apiToken,
      },
    };
  } catch (error) {
    console.error('Error loading config:', error);
    console.error('Please create a config.json file or set environment variables.');
    process.exit(1);
  }
}

// Process a single URL
async function processUrl(
  url: string,
  tags: string[],
  config: Config,
  db: D1Client,
  scraper: Scraper,
  summarizer: Summarizer,
  existingSlugs: Set<string>
): Promise<void> {
  console.log(`\nProcessing: ${url}`);

  try {
    // Detect content type
    const contentType = detectContentType(url);
    console.log(`  Content type: ${contentType}`);

    let title: string;
    let thumbnailUrl: string | null;
    let markdownContent: string | null = null;
    let transcription: string | null = null;
    let contentForSummary: string;

    // Handle YouTube videos separately
    if (contentType === 'video') {
      console.log('  Fetching YouTube metadata...');
      const ytMetadata = await fetchYouTubeMetadata(url);
      title = ytMetadata.title;
      thumbnailUrl = ytMetadata.thumbnailUrl;

      // Try to get transcription
      console.log('  Attempting to fetch transcription...');
      const ytApiKey = process.env.YOUTUBE_API_KEY;
      transcription = await fetchYouTubeTranscription(ytMetadata.videoId, ytApiKey);

      // Use transcription or description for summary
      if (transcription) {
        contentForSummary = transcription;
        console.log('  Using transcription for summary');
      } else {
        contentForSummary = ytMetadata.description || 'Video content';
        console.log('  Using video description for summary (transcription unavailable)');
      }
    } else {
      // Scrape regular content
      console.log('  Scraping content...');
      const scraped = await scraper.scrape(url);
      title = scraped.title;
      thumbnailUrl = scraped.thumbnailUrl;
      markdownContent = scraped.markdown;
      contentForSummary = scraped.markdown;

      if (!contentForSummary || contentForSummary.trim().length === 0) {
        throw new Error('No content extracted from URL');
      }
    }

    // Generate summaries
    console.log('  Generating summaries...');
    const summaries = await summarizer.generateSummaries(contentForSummary);

    // Generate slug
    const baseSlug = generateSlug(title);
    const slug = ensureUniqueSlug(baseSlug, existingSlugs);
    existingSlugs.add(slug);
    console.log(`  Generated slug: ${slug}`);

    // Calculate week start date
    const weekStartDate = getWeekStartDate();
    console.log(`  Week start date: ${weekStartDate}`);

    // Prepare article data
    const articleData: Omit<ArticleData, 'tags'> = {
      slug,
      title,
      url,
      thumbnail_url: thumbnailUrl,
      content_type: contentType,
      short_summary: summaries.short,
      extended_summary: summaries.extended,
      markdown_content: markdownContent,
      transcription,
      week_start_date: weekStartDate,
    };

    // Insert article
    console.log('  Inserting into database...');
    const articleId = await db.insertArticle(articleData);

    // Handle tags
    if (tags.length > 0) {
      console.log(`  Linking ${tags.length} tag(s)...`);
      const tagIds = await Promise.all(
        tags.map((tag) => db.getOrCreateTag(tag.trim()))
      );
      await db.linkArticleToTags(articleId, tagIds);
    }

    console.log(`  ✓ Successfully archived: ${slug}`);
  } catch (error) {
    console.error(`  ✗ Error processing ${url}:`, error);
    throw error;
  }
}

// Main CLI command
async function ingest(urls: string[], options: { tags?: string }) {
  const config = loadConfig();
  const db = new D1Client(config.database);
  const scraper = new Scraper(config.cloudflare);
  const summarizer = new Summarizer(config.gemini);

  // Parse tags
  const tags = options.tags
    ? options.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  // Get existing slugs to avoid conflicts
  console.log('Loading existing slugs...');
  const existingSlugs = await db.getAllSlugs();

  // Process each URL
  const results: { url: string; success: boolean; error?: string }[] = [];

  for (const url of urls) {
    try {
      await processUrl(url, tags, config, db, scraper, summarizer, existingSlugs);
      results.push({ url, success: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.push({ url, success: false, error: errorMessage });
    }
  }

  // Summary
  console.log('\n=== Summary ===');
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`Successfully processed: ${successful}`);
  if (failed > 0) {
    console.log(`Failed: ${failed}`);
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`  - ${r.url}: ${r.error}`);
      });
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Set up CLI
const program = new Command();

program
  .name('archive-ingest')
  .description('Ingest URLs into the link archive')
  .version('1.0.0');

program
  .command('ingest')
  .description('Ingest one or more URLs')
  .argument('<urls...>', 'URLs to ingest')
  .option('-t, --tags <tags>', 'Comma-separated list of tags')
  .action(ingest);

program.parse();

