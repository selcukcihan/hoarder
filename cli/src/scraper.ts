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
      let thumbnailUrl = this.extractThumbnail(html, url, title);

      // If no suitable image found, generate a placeholder
      if (!thumbnailUrl) {
        thumbnailUrl = this.generatePlaceholder(title);
      }

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
   * Remove HTML comments from a string
   */
  private stripHtmlComments(html: string): string {
    return html.replace(/<!--[\s\S]*?-->/g, "");
  }

  /**
   * Check if an image should be skipped based on its source URL
   */
  private shouldSkipImage(src: string): boolean {
    const srcLower = src.toLowerCase();
    const skipPatterns = [
      /icon/i,
      /favicon/i,
      /logo/i,
      /badge/i,
      /button/i,
      /spacer/i,
      /pixel/i,
      /tracking/i,
      /1x1/i,
      /\.svg$/i,
      /creativecommons/i,
      /license/i,
      /advertisement/i,
      /ad\./i,
      /banner/i,
      /sidebar/i,
      /widget/i,
    ];
    return skipPatterns.some((pattern) => pattern.test(srcLower));
  }

  /**
   * Check if an image tag is likely in a non-content area
   */
  private isInNonContentArea(html: string, imgTagIndex: number): boolean {
    const beforeImage = html.substring(0, imgTagIndex);
    const nonContentTags = ["header", "footer", "nav", "aside", "menu"];

    // For each non-content tag, check if we're inside it
    for (const tag of nonContentTags) {
      const openTagRegex = new RegExp(`<${tag}[^>]*>`, "gi");
      const closeTagRegex = new RegExp(`</${tag}>`, "gi");

      const openTags = (beforeImage.match(openTagRegex) || []).length;
      const closeTags = (beforeImage.match(closeTagRegex) || []).length;

      // If there are more open tags than close tags, we're inside this tag
      if (openTags > closeTags) {
        return true;
      }
    }

    return false;
  }

  /**
   * Extract thumbnail URL from HTML
   * Returns a placeholder data URI if no suitable image is found
   */
  private extractThumbnail(
    html: string,
    baseUrl: string,
    title?: string
  ): string | null {
    const minImageSize = 200; // Minimum width or height in pixels

    // Try Open Graph image first
    const ogImageMatch = html.match(
      /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i
    );
    if (ogImageMatch) {
      const url = this.resolveUrl(ogImageMatch[1], baseUrl);
      // OG images are usually suitable, but we could validate if needed
      return url;
    }

    // Try Twitter card image
    const twitterImageMatch = html.match(
      /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i
    );
    if (twitterImageMatch) {
      const url = this.resolveUrl(twitterImageMatch[1], baseUrl);
      // Twitter images are usually suitable
      return url;
    }

    // Remove HTML comments before searching for images
    const htmlWithoutComments = this.stripHtmlComments(html);

    // Try to find suitable images from <img> tags
    // We'll score images and pick the best one
    const imageCandidates: Array<{
      url: string;
      score: number;
      width: number;
      height: number;
    }> = [];

    const imageRegex = /<img[^>]*>/gi;
    let match;
    while ((match = imageRegex.exec(htmlWithoutComments)) !== null) {
      const imgTag = match[0];
      const imgIndex = match.index;
      const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
      if (!srcMatch) continue;

      const src = srcMatch[1];

      // Skip images that match our skip patterns
      if (this.shouldSkipImage(src)) {
        continue;
      }

      // Skip images in non-content areas (header, footer, nav, etc.)
      if (this.isInNonContentArea(htmlWithoutComments, imgIndex)) {
        continue;
      }

      // Extract dimensions
      const widthMatch = imgTag.match(/width=["'](\d+)["']/i);
      const heightMatch = imgTag.match(/height=["'](\d+)["']/i);
      const width = widthMatch ? parseInt(widthMatch[1], 10) : 0;
      const height = heightMatch ? parseInt(heightMatch[1], 10) : 0;

      // Calculate score for this image
      let score = 0;

      // Prefer images with explicit dimensions
      if (width > 0 || height > 0) {
        score += 10;

        // Prefer larger images
        if (width >= minImageSize || height >= minImageSize) {
          score += 50;
          // Bonus for very large images
          if (width >= 400 || height >= 400) {
            score += 20;
          }
        } else {
          // Too small, skip it
          continue;
        }
      } else {
        // No dimensions - very low priority, likely to be small
        // Only consider if it has strong semantic indicators
        score += 2;
      }

      // Check for semantic attributes that indicate importance
      if (
        /class=["'][^"']*(?:featured|hero|main|cover|thumbnail|post-image|article-image)[^"']*["']/i.test(
          imgTag
        )
      ) {
        score += 30;
      }

      if (/alt=["'][^"']+["']/i.test(imgTag)) {
        score += 5; // Images with alt text are more likely to be content
      }

      // Check if image is in semantic content areas
      const beforeImage = htmlWithoutComments.substring(0, imgIndex);
      if (
        /<article[\s\S]*$/i.test(beforeImage) ||
        /<main[\s\S]*$/i.test(beforeImage)
      ) {
        score += 15;
      }

      imageCandidates.push({
        url: src,
        score,
        width,
        height,
      });
    }

    // Sort by score (highest first) and return the best candidate
    // Only return images with a minimum score to avoid very small or low-quality images
    if (imageCandidates.length > 0) {
      imageCandidates.sort((a, b) => b.score - a.score);
      const bestCandidate = imageCandidates[0];
      // Only return if score is reasonable (has dimensions or strong semantic indicators)
      if (bestCandidate.score >= 10 || (bestCandidate.width > 0 && bestCandidate.height > 0)) {
        return this.resolveUrl(bestCandidate.url, baseUrl);
      }
    }

    // No suitable image found - return null (caller can generate placeholder)
    return null;
  }

  /**
   * Generate a placeholder image as data URI
   * Creates a gradient background with the first letter of the title
   */
  generatePlaceholder(
    title: string,
    width: number = 200,
    height: number = 150
  ): string {
    const firstLetter = title.charAt(0).toUpperCase() || "?";

    // Generate a color based on the title (deterministic)
    const hash = title.split("").reduce((acc, char) => {
      return (acc << 5) - acc + char.charCodeAt(0);
    }, 0);

    // Generate two colors for gradient
    const hue1 = Math.abs(hash) % 360;
    const hue2 = (hue1 + 60) % 360;
    const color1 = `hsl(${hue1}, 70%, 50%)`;
    const color2 = `hsl(${hue2}, 70%, 60%)`;

    // Create SVG as data URI
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)"/>
        <text 
          x="50%" 
          y="50%" 
          font-family="Arial, sans-serif" 
          font-size="${Math.min(width, height) * 0.4}" 
          font-weight="bold" 
          fill="white" 
          text-anchor="middle" 
          dominant-baseline="central"
          opacity="0.9"
        >${firstLetter}</text>
      </svg>
    `.trim();

    return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
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
