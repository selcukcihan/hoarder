// Cloudflare Browser Rendering API client

import { Cloudflare } from "cloudflare";
import TurndownService from "turndown";
import type { Config, ScrapedContent } from "./types";

const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

export class Scraper {
  private accountId: string;
  private client: Cloudflare;

  constructor(config: Config["cloudflare"]) {
    this.accountId = config.accountId;
    this.client = new Cloudflare({
      apiToken: config.apiToken,
    });
  }

  /**
   * Scrape content from a URL
   */
  async scrape(url: string): Promise<ScrapedContent> {
    try {
      // Use Cloudflare Browser Rendering API to get rendered HTML
      const html = await this.client.browserRendering.content.create({
        account_id: this.accountId,
        url,
        gotoOptions: {
          waitUntil: "networkidle0",
        },
      });

      if (!html || html.trim().length === 0) {
        throw new Error("No HTML content returned from Browser Rendering API");
      }

      const markdown = turndownService.turndown(html);

      // Extract title
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch
        ? titleMatch[1].trim()
        : this.extractTitleFromUrl(url);

      // Extract thumbnail (Open Graph image or first large image)
      const thumbnailUrl = this.extractThumbnail(html, url);

      // Extract meta description
      const descriptionMatch = html.match(
        /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i
      );
      const description = descriptionMatch ? descriptionMatch[1].trim() : null;

      return {
        title,
        markdown,
        thumbnailUrl,
        description,
      };
    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
      throw error;
    }
  }

  /**
   * Extract title from URL as fallback
   */
  private extractTitleFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace("www.", "");
      return hostname;
    } catch {
      return "Untitled";
    }
  }

  /**
   * Extract thumbnail URL from HTML
   */
  private extractThumbnail(html: string, baseUrl: string): string | null {
    // Try Open Graph image first
    const ogImageMatch = html.match(
      /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i
    );
    if (ogImageMatch) {
      return this.resolveUrl(ogImageMatch[1], baseUrl);
    }

    // Try Twitter card image
    const twitterImageMatch = html.match(
      /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i
    );
    if (twitterImageMatch) {
      return this.resolveUrl(twitterImageMatch[1], baseUrl);
    }

    // Try to find first large image
    const imageMatch = html.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i);
    if (imageMatch) {
      return this.resolveUrl(imageMatch[1], baseUrl);
    }

    return null;
  }

  /**
   * Resolve relative URL to absolute
   */
  private resolveUrl(url: string, baseUrl: string): string {
    try {
      return new URL(url, baseUrl).href;
    } catch {
      return url;
    }
  }
}
