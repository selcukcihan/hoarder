// Summarization service using AI providers

import type { AIProvider } from "./ai/provider.js";
import type { Summaries } from "./types";
import {
  getShortSummaryPrompt,
  getExtendedSummaryPrompt,
  getTagGenerationPrompt,
} from "./prompts";

export class Summarizer {
  private aiProvider: AIProvider;

  constructor(aiProvider: AIProvider) {
    this.aiProvider = aiProvider;
  }

  /**
   * Generate short summary (2-3 sentences, max 200 characters)
   */
  async generateShortSummary(content: string): Promise<string> {
    const prompt = getShortSummaryPrompt(content);

    try {
      let summary = await this.aiProvider.generateText(prompt);

      // Ensure it's within character limit
      if (summary.length > 200) {
        summary = summary.substring(0, 197) + "...";
      }

      return summary;
    } catch (error) {
      console.error("Error generating short summary:", error);
      throw error;
    }
  }

  /**
   * Generate extended summary (5-7 sentences)
   */
  async generateExtendedSummary(content: string): Promise<string> {
    const prompt = getExtendedSummaryPrompt(content);

    try {
      return await this.aiProvider.generateText(prompt);
    } catch (error) {
      console.error("Error generating extended summary:", error);
      throw error;
    }
  }

  /**
   * Generate both summaries
   */
  async generateSummaries(content: string): Promise<Summaries> {
    console.log("Generating summaries for content:", content);
    const [short, extended] = await Promise.all([
      this.generateShortSummary(content),
      this.generateExtendedSummary(content),
    ]);

    return { short, extended };
  }

  /**
   * Generate tags from content (max 10 tags)
   */
  async generateTags(content: string): Promise<string[]> {
    const prompt = getTagGenerationPrompt(content);

    try {
      const tagsText = await this.aiProvider.generateText(prompt);

      // Parse comma-separated tags
      const tags = tagsText
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      return tags;
    } catch (error) {
      console.error("Error generating tags:", error);
      throw error;
    }
  }
}
