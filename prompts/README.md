# Prompts

This directory contains all the prompts used in the Hoarder project.

## Overview

This folder documents two types of prompts:

1. **AI Prompts** - Prompts used with Google Gemini API (via `@google/generative-ai`) to process scraped content. These are located in `cli/src/summarizer.ts`.

2. **User Prompts to AI Agent** - Prompts/instructions given by the user to the AI coding assistant during project development. See [`user-prompts-to-ai.md`](./user-prompts-to-ai.md).

---

## AI Prompts (Gemini API)

## Prompts

### 1. Short Summary Prompt

**Location**: `cli/src/summarizer.ts` - `generateShortSummary()`

**Purpose**: Generate a concise summary for list views (displayed in article cards)

**Prompt**:
```
Summarize the following content in 5-6 sentences (maximum 300 characters). Focus on the main points, key takeaways and insights:

{content}
```

**Output**: 
- 5-6 sentences
- Maximum 300 characters (truncated to 200 characters in code if needed)
- Focuses on main points, key takeaways, and insights

**Usage**: Used for the `short_summary` field in the database, displayed in article list views.

---

### 2. Extended Summary Prompt

**Location**: `cli/src/summarizer.ts` - `generateExtendedSummary()`

**Purpose**: Generate a comprehensive summary for article detail pages

**Prompt**:
```
Provide a comprehensive summary of the following content in 5-10 sentences. Highlight key points, main ideas, and important details:

{content}
```

**Output**:
- 5-10 sentences
- Comprehensive coverage
- Highlights key points, main ideas, and important details

**Usage**: Used for the `extended_summary` field in the database, displayed on individual article detail pages.

---

### 3. Tag Generation Prompt

**Location**: `cli/src/summarizer.ts` - `generateTags()`

**Purpose**: Extract relevant tags from content for categorization and filtering

**Prompt**:
```
Analyze the following content and extract up to 10 relevant tags that best describe the main topics, themes, and subjects. 
Return only a comma-separated list of tags, with no additional text or explanation. 
Each tag should be a single word or short phrase (2-3 words max). 
Focus on the most important and specific topics covered in the content.
Ensure the tags are concise, and descriptive.
Lean on single words when possible.

Content:
{content}
```

**Output**:
- Comma-separated list of tags
- Up to 10 tags
- Single words or short phrases (2-3 words max)
- Focuses on most important and specific topics
- Concise and descriptive
- Prefers single words when possible

**Usage**: Used to automatically generate tags for articles, stored in the `tags` and `article_tags` tables.

**Processing**: The output is parsed by splitting on commas, trimming whitespace, and filtering empty strings.

---

## Model Configuration

**Default Model**: `gemini-3-flash-preview`

**Configurable via**: Environment variable `GEMINI_MODEL` or config file

**Alternative Models**:
- `gemini-1.5-flash` - Faster, cheaper option
- `gemini-1.5-pro` - More capable for complex content

---

## Implementation Notes

1. **Error Handling**: All prompt functions include try-catch blocks to handle API errors gracefully
2. **Character Limits**: Short summary is truncated to 200 characters if it exceeds the limit
3. **Parallel Processing**: `generateSummaries()` runs short and extended summary generation in parallel for efficiency
4. **Content Input**: All prompts receive the full markdown content (for articles) or transcription (for videos)

---

## Future Enhancements

Potential improvements to prompts:
- Add content type awareness (article vs video)
- Include context about the source URL/domain
- Support for multi-language content
- Customizable prompt templates per content type
- Few-shot examples for better tag extraction

---

## User Prompts to AI Agent

For documentation of prompts/instructions given by the user to the AI coding assistant during project development, see [`user-prompts-to-ai.md`](./user-prompts-to-ai.md).

This includes:
- Instructions for generating documentation
- Feature requests and implementation guidance
- Project setup and configuration requests
- Any other prompts given to the AI assistant

