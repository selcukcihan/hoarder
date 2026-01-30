// AI Provider interface for abstracting different AI services

export interface AIProvider {
  /**
   * Generate text content from a prompt
   * @param prompt The text prompt to send to the AI
   * @param debugLabel Optional label for debug output (e.g. "short-summary"). When set, request and response are written to debug-genai-{debugLabel}.json
   * @returns The generated text response
   */
  generateText(prompt: string, debugLabel?: string): Promise<string>;
}
