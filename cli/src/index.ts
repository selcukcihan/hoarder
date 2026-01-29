#!/usr/bin/env node

// CLI entry point for link archive ingestion

import { Command } from "commander";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { D1Client } from "./database.js";
import { Scraper } from "./scraper.js";
import { Summarizer } from "./summarizer.js";
import { GoogleGeminiProvider, OllamaProvider } from "./ai/index.js";
import {
  fetchYouTubeMetadata,
  fetchYouTubeTranscription,
  getVideoDescription,
} from "./youtube.js";
import {
  generateSlug,
  ensureUniqueSlug,
  getWeekStartDate,
  detectContentType,
  sanitizeTags,
} from "./utils.js";
import type { Config, ArticleData } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
dotenv.config({ path: join(__dirname, "../.env") });

// Load configuration from environment variables
function loadConfig(): Config {
  const requiredEnvVars = {
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    D1_DATABASE_ID: process.env.D1_DATABASE_ID,
  };

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.error("Error: Missing required environment variables:");
    missingVars.forEach((varName) => console.error(`  - ${varName}`));
    console.error(
      "\nPlease create a .env file in the cli directory with the required variables.",
    );
    process.exit(1);
  }

  return {
    cloudflare: {
      accountId: requiredEnvVars.CLOUDFLARE_ACCOUNT_ID!,
      apiToken: requiredEnvVars.CLOUDFLARE_API_TOKEN!,
      browserRenderingApiUrl: process.env.CLOUDFLARE_BROWSER_RENDERING_API_URL,
    },
    gemini: {
      apiKey: requiredEnvVars.GEMINI_API_KEY!,
      model: process.env.GEMINI_MODEL || "gemini-3-flash-preview",
    },
    database: {
      accountId: requiredEnvVars.CLOUDFLARE_ACCOUNT_ID!,
      databaseId: requiredEnvVars.D1_DATABASE_ID!,
      apiToken: requiredEnvVars.CLOUDFLARE_API_TOKEN!,
    },
  };
}

// Process a single URL
async function processUrl(
  url: string,
  config: Config,
  db: D1Client,
  scraper: Scraper,
  summarizer: Summarizer,
  existingSlugs: Set<string>,
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
    if (contentType === "video") {
      console.log("  Fetching YouTube metadata...");
      const ytApiKey = process.env.YOUTUBE_API_KEY;
      const ytMetadata = await fetchYouTubeMetadata(url, ytApiKey);
      title = ytMetadata.title;
      thumbnailUrl = ytMetadata.thumbnailUrl;

      // Try to get transcription
      console.log("  Attempting to fetch transcription...");
      transcription = await fetchYouTubeTranscription(ytMetadata.videoId);

      // Use transcription or description for summary
      if (transcription) {
        contentForSummary = transcription;
        console.log("  Using transcription for summary");
      } else {
        contentForSummary = ytMetadata.description || "Video content";
        console.log(
          "  Using video description for summary (transcription unavailable)",
        );
      }
    } else {
      // Scrape regular content
      console.log("  Scraping content...");
      const scraped = await scraper.scrape(url);
      title = scraped.title;
      thumbnailUrl = scraped.thumbnailUrl;
      markdownContent = scraped.markdown;
      contentForSummary = scraped.markdown;

      if (!contentForSummary || contentForSummary.trim().length === 0) {
        throw new Error("No content extracted from URL");
      }
    }

    // Generate summaries
    console.log("  Generating summaries...");
    const summaries = await summarizer.generateSummaries(contentForSummary);

    // Generate tags from content
    console.log("  Generating tags from content...");
    const rawTags = await summarizer.generateTags(contentForSummary);
    const tags = sanitizeTags(rawTags, 10);
    console.log(`  Generated ${tags.length} tag(s): ${tags.join(", ")}`);

    // Generate slug
    const baseSlug = generateSlug(title);
    const slug = ensureUniqueSlug(baseSlug, existingSlugs);
    existingSlugs.add(slug);
    console.log(`  Generated slug: ${slug}`);

    // Calculate week start date
    const weekStartDate = getWeekStartDate();
    console.log(`  Week start date: ${weekStartDate}`);

    // Prepare article data
    const articleData: Omit<ArticleData, "tags"> = {
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

    // Check if URL already exists
    const existingArticle = await db.getArticleByUrl(url);
    const isUpdate = existingArticle !== null;

    // Insert or update article
    if (isUpdate) {
      console.log("  Updating existing article in database...");
    } else {
      console.log("  Inserting into database...");
    }
    const articleId = await db.insertArticle(articleData);

    // Handle tags
    if (tags.length > 0) {
      console.log(`  Linking ${tags.length} tag(s)...`);
      const tagIds = await Promise.all(
        tags.map((tag) => db.getOrCreateTag(tag)),
      );
      await db.linkArticleToTags(articleId, tagIds);
    }

    if (isUpdate) {
      console.log(`  ✓ Successfully updated: ${slug}`);
    } else {
      console.log(`  ✓ Successfully archived: ${slug}`);
    }
  } catch (error) {
    console.error(`  ✗ Error processing ${url}:`, error);
    throw error;
  }
}

// Main CLI command
async function ingest(urls: string[]) {
  const config = loadConfig();
  const db = new D1Client(config.database);
  const scraper = new Scraper(config.cloudflare);

  // Create AI provider and summarizer
  const aiProvider = new GoogleGeminiProvider(config.gemini);
  const ollamaProvider = new OllamaProvider({ model: "granite3.2:8b" });
  const summarizer = new Summarizer(ollamaProvider);

  // Get existing slugs to avoid conflicts
  console.log("Loading existing slugs...");
  const existingSlugs = await db.getAllSlugs();

  // Process each URL
  const results: { url: string; success: boolean; error?: string }[] = [];

  for (const url of urls) {
    try {
      await processUrl(url, config, db, scraper, summarizer, existingSlugs);
      results.push({ url, success: true });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      results.push({ url, success: false, error: errorMessage });
    }
  }

  // Summary
  console.log("\n=== Summary ===");
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
  .name("archive-ingest")
  .description("Ingest URLs into the link archive")
  .version("1.0.0");

program
  .command("ingest")
  .description("Ingest one or more URLs")
  .argument("<urls...>", "URLs to ingest")
  .action(ingest);

program.parse();
