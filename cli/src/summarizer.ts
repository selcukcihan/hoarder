// Google Gemini API client for summarization

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Config, Summaries } from "./types";

export class Summarizer {
  private genAI: GoogleGenerativeAI;
  private model: string;

  constructor(config: Config["gemini"]) {
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.model = config.model || "gemini-3-flash-preview";
  }

  /**
   * Generate short summary (2-3 sentences, max 200 characters)
   */
  async generateShortSummary(content: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: this.model });

    const prompt = `Summarize the following content in 2-3 sentences (maximum 200 characters). Focus on the main points:

${content}`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let summary = response.text().trim();

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
    const model = this.genAI.getGenerativeModel({ model: this.model });

    const prompt = `Provide a comprehensive summary of the following content in 5-7 sentences. Highlight key points, main ideas, and important details:

${content}`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error("Error generating extended summary:", error);
      throw error;
    }
  }

  /**
   * Generate both summaries
   */
  async generateSummaries(content: string): Promise<Summaries> {
    const [short, extended] = await Promise.all([
      this.generateShortSummary(content),
      this.generateExtendedSummary(content),
    ]);

    return { short, extended };
  }
}
