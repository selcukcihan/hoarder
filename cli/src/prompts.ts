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

CRITICAL OUTPUT REQUIREMENTS - STRICTLY ENFORCE:
1. Output ONLY plain text. FORBIDDEN markdown symbols include:
   - No hash symbols (#, ##, ###) for headers
   - No asterisks (** or *) for bold/italic
   - No underscores (_) for emphasis
   - No brackets [] or parentheses () for links
   - No markdown formatting of any kind
   - Use only letters, numbers, spaces, commas, periods, and standard punctuation

2. Write directly as a factual summary. FORBIDDEN phrases include:
   - "I'd be happy to..."
   - "Feel free to ask..."
   - "Let me know if..."
   - "I can help..."
   - Any first-person references or conversational AI language
   - Any meta-commentary about summarizing or providing information
   - Write as if you ARE the summary, not someone writing ABOUT the summary

3. Output format: Write 5-6 sentences (maximum 300 characters) of direct, factual summary text. Start immediately with the summary content - no introductions, no explanations, no meta language.

Summarize the following content:

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

CRITICAL OUTPUT REQUIREMENTS - STRICTLY ENFORCE:
1. Output ONLY plain text. FORBIDDEN markdown symbols include:
   - No hash symbols (#, ##, ###) for headers
   - No asterisks (** or *) for bold/italic
   - No underscores (_) for emphasis
   - No brackets [] or parentheses () for links
   - No markdown formatting of any kind
   - Use only letters, numbers, spaces, commas, periods, and standard punctuation

2. Write directly as a factual summary. FORBIDDEN phrases include:
   - "I'd be happy to..."
   - "Feel free to ask..."
   - "Let me know if..."
   - "I can help..."
   - Any first-person references or conversational AI language
   - Any meta-commentary about summarizing or providing information
   - Write as if you ARE the summary, not someone writing ABOUT the summary

3. Output format: Write 5-10 sentences of direct, factual summary text. Start immediately with the summary content - no introductions, no explanations, no meta language.

Provide a comprehensive summary of the following content:

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

CRITICAL OUTPUT REQUIREMENTS - STRICTLY ENFORCE:
1. Output ONLY plain text. FORBIDDEN markdown symbols include:
   - No hash symbols (#, ##, ###) for headers
   - No asterisks (** or *) for bold/italic
   - No underscores (_) for emphasis
   - No brackets [] or parentheses () for links
   - No markdown formatting of any kind
   - Use only letters, numbers, spaces, commas, and standard punctuation

2. Write directly as factual output. FORBIDDEN phrases include:
   - "I'd be happy to..."
   - "Feel free to ask..."
   - "Let me know if..."
   - "I can help..."
   - Any first-person references or conversational AI language
   - Any meta-commentary about extracting tags or providing information

3. Output format: Return ONLY a comma-separated list of tags. No introductions, no explanations, no meta language. Start immediately with the first tag.

Analyze the following content and extract up to 10 relevant tags that best describe the main topics, themes, and subjects. 
Each tag should be a single word or short phrase (2-3 words max). 
Focus on the most important and specific topics covered in the content.
Ensure the tags are concise and descriptive. Lean on single words when possible.

Content:
${content}`;
}
