// Ollama AI Provider implementation for local Ollama installation

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

  async generateText(prompt: string): Promise<string> {
    const url = `${this.baseUrl}/api/generate`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        prompt: prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Ollama API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    if (!data.response) {
      throw new Error("Ollama API response missing 'response' field");
    }

    return data.response.trim();
  }
}
