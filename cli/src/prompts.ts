// Prompts used by the CLI for AI summarization and tagging

/**
 * Generate a prompt for short summary generation
 * @param content - The content to summarize
 * @returns The formatted prompt
 */
export function getShortSummaryPrompt(content: string): string {
  return `You are summarizing an article or web page. IGNORE and EXCLUDE the following non-content elements:
- JavaScript warnings or notices (e.g., "JavaScript is disabled", "Please enable JavaScript")
- Cookie consent messages or privacy notices
- Navigation menus, headers, footers, or sidebar content
- Advertisement text or promotional content
- Social media widgets or sharing buttons
- Newsletter signup forms or subscription prompts
- Site navigation, breadcrumbs, or menu items
- Copyright notices or legal disclaimers
- Comment sections or user-generated content
- Any boilerplate text that appears on every page

Focus ONLY on the actual article content, main ideas, key points, and valuable insights. Extract the core message and main takeaways.

Summarize the following content in 5-6 sentences (maximum 300 characters). Focus on the main points, key takeaways and insights:

${content}`;
}

/**
 * Generate a prompt for extended summary generation
 * @param content - The content to summarize
 * @returns The formatted prompt
 */
export function getExtendedSummaryPrompt(content: string): string {
  return `You are summarizing an article or web page. IGNORE and EXCLUDE the following non-content elements:
- JavaScript warnings or notices (e.g., "JavaScript is disabled", "Please enable JavaScript")
- Cookie consent messages or privacy notices
- Navigation menus, headers, footers, or sidebar content
- Advertisement text or promotional content
- Social media widgets or sharing buttons
- Newsletter signup forms or subscription prompts
- Site navigation, breadcrumbs, or menu items
- Copyright notices or legal disclaimers
- Comment sections or user-generated content
- Any boilerplate text that appears on every page

Focus ONLY on the actual article content, main ideas, key points, and valuable insights. Extract the core message and main takeaways.

Provide a comprehensive summary of the following content in 5-10 sentences. Highlight key points, main ideas, and important details:

${content}`;
}

/**
 * Generate a prompt for tag extraction
 * @param content - The content to extract tags from
 * @returns The formatted prompt
 */
export function getTagGenerationPrompt(content: string): string {
  return `You are analyzing an article or web page to extract tags. IGNORE and EXCLUDE the following non-content elements:
- JavaScript warnings or notices (e.g., "JavaScript is disabled", "Please enable JavaScript")
- Cookie consent messages or privacy notices
- Navigation menus, headers, footers, or sidebar content
- Advertisement text or promotional content
- Social media widgets or sharing buttons
- Newsletter signup forms or subscription prompts
- Site navigation, breadcrumbs, or menu items
- Copyright notices or legal disclaimers
- Comment sections or user-generated content
- Any boilerplate text that appears on every page

Focus ONLY on the actual article content when extracting tags.

Analyze the following content and extract up to 10 relevant tags that best describe the main topics, themes, and subjects. 
Return only a comma-separated list of tags, with no additional text or explanation. 
Each tag should be a single word or short phrase (2-3 words max). 
Focus on the most important and specific topics covered in the content.
Ensure the tags are concise, and descriptive.
Lean on single words when possible.

Content:
${content}`;
}
