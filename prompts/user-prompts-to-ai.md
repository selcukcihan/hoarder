# User Prompts to AI Agent

This document contains all the prompts/instructions given by the user to the AI coding assistant (Auto) during the development of this project.

## Session Prompts

### Prompt 1: Generate README
**Date**: Current session  
**Prompt**:
```
Generate a new top level readme file, do not delete the astro stuff that can stay but leave them to the end
```

**Context**: User wanted a comprehensive README file for the project, with Astro-specific documentation moved to the end.

**Result**: Created a new `README.md` with:
- Project overview and features
- Architecture description
- Setup instructions
- CLI and web app documentation
- Astro-specific content at the end

---

### Prompt 2: Create Prompts Folder
**Date**: Current session  
**File**: [`user-prompt-02-create-prompts-folder.txt`](./user-prompt-02-create-prompts-folder.txt)  
**Prompt**:
```
Can you also create a top level folder named "prompts" and include all the prompts we have used so far from the beginning of the project.
```

**Context**: User wanted to document all AI prompts used in the codebase (for Gemini API).

**Result**: Created `prompts/` folder with:
- `README.md` - Documentation of all AI prompts
- `short-summary.txt` - Short summary prompt
- `extended-summary.txt` - Extended summary prompt
- `tag-generation.txt` - Tag extraction prompt

---

### Prompt 3: Include User Prompts
**Date**: Current session  
**File**: [`user-prompt-03-include-user-prompts.txt`](./user-prompt-03-include-user-prompts.txt)  
**Prompt**:
```
I want you to also include all the prompts I have given to you. Don't you have access to the history of all prompts I have given your agent?
```

**Context**: User wanted to document all prompts they've given to the AI assistant, not just the AI prompts used in the code.

**Result**: This file was created to document user prompts to the AI agent.

---

### Prompt 4: Install Google APIs Library
**Date**: Current session  
**Prompt**:
```
Let's install googleapis npm library which is the official api client from google. Then we can use this while calling youtube api.
```

**Context**: User wanted to use the official Google API client library instead of direct fetch calls for YouTube API integration.

**Result**: 
- Installed `googleapis` npm package (v169.0.0)
- Updated `youtube.ts` to use the official Google API client
- Enhanced `fetchYouTubeMetadata()` to use YouTube Data API v3 when API key is provided
- Updated `fetchYouTubeTranscription()` to use the googleapis client (though later user switched to youtube-transcript library)

---

### Prompt 4: Handle Missing Article Images
**Date**: Current session  
**File**: [`user-prompt-04-handle-missing-images.txt`](./user-prompt-04-handle-missing-images.txt)  
**Prompt**:
```
There are a few improvements we should make. First of all, for some articles there might not be a suitable image in the linked page. A suitable image is one that is not too tiny. In case we don't find any suitable images in the linked page, what should we do, do you have any suggestions?
```

**Context**: User wanted to improve the image extraction logic to handle cases where no suitable images are found on a page. A suitable image is defined as one that is not too tiny.

**Result**: Implemented:
- Image size validation (minimum 200px in either dimension)
- Enhanced filtering to skip small images (icons, badges, etc.)
- Generated placeholder images as data URIs when no suitable image is found
- Placeholder features: gradient background with deterministic colors based on title hash, displays first letter of title

---

### Prompt 5: Improve Image Extraction Intelligence
**Date**: Current session  
**File**: [`user-prompt-05-improve-image-extraction.txt`](./user-prompt-05-improve-image-extraction.txt)  
**Prompt**:
```
Can we make extractThumbnail method more intelligent. When I tried it on a page, it picked up an irrelevant image that was commented out as in

<!-- <a rel="license" href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br /> -->
```

**Context**: User discovered that the image extraction was picking up images from HTML comments, which are not visible on the page and should be ignored.

**Result**: Enhanced `extractThumbnail()` method with:
- HTML comment stripping before image search
- Expanded skip patterns (Creative Commons, advertisements, banners, etc.)
- Context-aware filtering to exclude images in non-content areas (header, footer, nav, aside, menu)
- Scoring system that prioritizes:
  - Images with explicit dimensions ≥ 200px
  - Images with semantic classes (featured, hero, main, cover, etc.)
  - Images inside `<article>` or `<main>` tags
  - Images with alt text
- Returns highest-scoring candidate instead of first match

---

### Prompt 6: Replace "Link Archive" with "Tech Web Hoarder"
**Date**: Current session  
**File**: [`user-prompt-06-replace-link-archive.txt`](./user-prompt-06-replace-link-archive.txt)  
**Prompt**:
```
Replace all occurences of "Link Archive" with Tech Web Hoarder
```

**Context**: User wanted to rebrand the application from "Link Archive" to "Tech Web Hoarder" throughout the codebase.

**Result**: Replaced all occurrences of "Link Archive" with "Tech Web Hoarder" in:
- `src/pages/index.astro` - Updated the h1 heading
- `src/pages/[...path].astro` - Updated the h1 heading
- `src/layouts/Layout.astro` - Updated the default title, logo link, and footer copyright
- `cli/README.md` - Updated the title
- `EXECUTION_PLAN.md` - Updated the document title

---

### Prompt 7: Fix Image Size on Detail Screen
**Date**: Current session  
**Prompt**:
```
The generated images look too big on the detail screen. They are just placeholders so they should not occupy that big a space.
```

**Context**: User noticed that placeholder images on the article detail page were taking up too much space (full width), making them look disproportionate since they're just placeholders.

**Result**: Updated `src/components/ArticleDetail.astro` to:
- Set `max-width: 400px` for thumbnail images (instead of `width: 100%`)
- Added `margin: 0 auto` to center the images
- Images now display at a more appropriate size while still being responsive on smaller screens

---

### Prompt 4: Restyle Application
**Date**: Current session  
**Prompt**:
```
Can we restyle the application such that it appears slick, simple but elegant. Make sure there is good contrast between components and colors.
```

**Context**: User wanted to improve the visual design of the application with better styling, contrast, and an elegant appearance.

**Result**: Redesigned all components with:
- Modern color palette using indigo/purple gradients (#6366f1)
- Improved typography with better font weights and letter spacing
- Enhanced shadows and depth for better component separation
- Smooth transitions and hover effects
- Updated Layout, ArticleCard, TagFilter, WeekSelector, ArticleDetail, and index page styles

---

### Prompt 5: Fix Cloudflare Workers Error
**Date**: Current session  
**Prompt**:
```
Getting this error [wrangler:error] TypeError: Cannot read properties of undefined (reading 'fetch')
    at handle (file://[project-path]/dist/_worker.js/chunks/_@astrojs-ssr-adapter_fUXkFb18.mjs:1143:23)
    at Object.fetch (file://[project-path]/dist/_worker.js/chunks/_@astrojs-ssr-adapter_fUXkFb18.mjs:1193:18)
[wrangler:info] GET /_astro/_path_.D0TwnVqh.css 500 Internal Server Error (66ms)
```

**Context**: User encountered a runtime error when trying to serve static assets (CSS files) in the Cloudflare Workers environment.

**Result**: Fixed by:
- Adding `output: "server"` to astro.config.mjs to ensure SSR mode
- Adding assets binding configuration to `wrangler.dev.jsonc` so static assets are properly served in development
- The error was caused by missing ASSETS binding in the dev configuration

---

### Prompt 6: Add Prompts to File
**Date**: Current session  
**Prompt**:
```
Add these prompts into the prompts folder in a separate file
```

**Context**: User wanted to document the prompts from the current session.

**Result**: Added prompts to `user-prompts.txt` and updated this documentation file.

---

## Note on Historical Prompts

The AI assistant only has access to the current conversation session. Earlier prompts that may have been used to:
- Create the initial project structure
- Generate the `EXECUTION_PLAN.md` file
- Set up the CLI tool
- Build the web application components

are not available in this session's history. If you have access to previous conversation logs or would like to add those prompts, please include them here.

---

## How to Use This File

This file serves as a record of:
1. **User Intent**: What the user asked for
2. **Context**: Why the request was made
3. **Results**: What was delivered

This can be useful for:
- Understanding project evolution
- Onboarding new team members
- Replicating similar features
- Maintaining consistency in future development

---

## Adding More Prompts

If you have access to earlier conversation logs or want to document future prompts, add them to this file following the same format:

```markdown
### Prompt N: [Title]
**Date**: [Date or session identifier]
**Prompt**:
```
[Exact prompt text]
```

**Context**: [Why this was requested]

**Result**: [What was delivered]
```

