// Google Gemini AI Provider implementation

import { GoogleGenerativeAI } from "@google/generative-ai";
import { writeFileSync } from "fs";
import { join } from "path";
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

  async generateText(prompt: string, debugLabel?: string): Promise<string> {
    const payload = {
      model: this.model,
      prompt: prompt,
    };

    const model = this.genAI.getGenerativeModel({ model: this.model });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text().trim();

    if (debugLabel) {
      let responseData: any = { text: responseText };
      try {
        if (result.response.candidates) {
          responseData.candidates = result.response.candidates.map(
            (c: any) => ({
              content: c.content,
              finishReason: c.finishReason,
              index: c.index,
            }),
          );
        }
        if (result.response.promptFeedback) {
          responseData.promptFeedback = result.response.promptFeedback;
        }
      } catch {
        responseData = {
          text: responseText,
          error: "Failed to serialize full response",
        };
      }

      const debugPath = join(process.cwd(), `debug-genai-${debugLabel}.json`);
      writeFileSync(
        debugPath,
        JSON.stringify(
          {
            request: payload,
            response: responseData,
          },
          null,
          2,
        ),
        "utf-8",
      );
      console.log(`Debug: GenAI request+response written to ${debugPath}`);
    }

    return responseText;
  }
}
