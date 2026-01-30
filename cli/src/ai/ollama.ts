// Ollama AI Provider implementation for local Ollama installation

import { writeFileSync } from "fs";
import { join } from "path";
import type { AIProvider } from "./provider";

export interface OllamaConfig {
  model: string;
  baseUrl?: string;
}

export class OllamaProvider implements AIProvider {
  private model: string;
  private baseUrl: string;

  constructor(config: OllamaConfig) {
    this.model = config.model;
    this.baseUrl = config.baseUrl || "http://localhost:11434";
  }

  async generateText(prompt: string, debugLabel?: string): Promise<string> {
    const url = `${this.baseUrl}/api/generate`;

    const payload = {
      model: this.model,
      prompt: prompt,
      stream: false,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(
        `Ollama API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as {
      response?: string;
      [key: string]: unknown;
    };

    if (!data.response) {
      throw new Error("Ollama API response missing 'response' field");
    }

    const text = data.response.trim();

    if (debugLabel) {
      const debugPath = join(process.cwd(), `debug-genai-${debugLabel}.json`);
      writeFileSync(
        debugPath,
        JSON.stringify(
          {
            request: payload,
            response: data,
          },
          null,
          2,
        ),
        "utf-8",
      );
      console.log(`Debug: GenAI request+response written to ${debugPath}`);
    }

    return text;
  }
}
