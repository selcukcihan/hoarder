// AI Provider interface for abstracting different AI services

export interface AIProvider {
  /**
   * Generate text content from a prompt
   * @param prompt The text prompt to send to the AI
   * @returns The generated text response
   */
  generateText(prompt: string): Promise<string>;
}
