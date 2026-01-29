// Google Gemini AI Provider implementation

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIProvider } from "./provider";

export interface GoogleGeminiConfig {
  apiKey: string;
  model?: string;
}

export class GoogleGeminiProvider implements AIProvider {
  private genAI: GoogleGenerativeAI;
  private model: string;

  constructor(config: GoogleGeminiConfig) {
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.model = config.model || "gemini-3-flash-preview";
  }

  async generateText(prompt: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: this.model });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  }
}
