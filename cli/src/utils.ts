// Utility functions for CLI

import slugify from 'slugify';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Generate a URL-friendly slug from a title
 * Ensures the slug doesn't match the date format (YYYY-MM-DD)
 */
export function generateSlug(title: string): string {
  let slug = slugify(title, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });

  // If slug matches date pattern, append suffix
  if (DATE_PATTERN.test(slug)) {
    slug = `${slug}-article`;
  }

  return slug;
}

/**
 * Ensure slug is unique by appending a number if needed
 */
export function ensureUniqueSlug(
  slug: string,
  existingSlugs: Set<string>
): string {
  let uniqueSlug = slug;
  let counter = 1;

  while (existingSlugs.has(uniqueSlug)) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
}

/**
 * Calculate the Monday of the current week
 * Returns date in YYYY-MM-DD format
 */
export function getWeekStartDate(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(d.setDate(diff));
  
  return monday.toISOString().split('T')[0];
}

/**
 * Check if a string matches the date format YYYY-MM-DD
 */
export function isDateFormat(str: string): boolean {
  return DATE_PATTERN.test(str);
}

/**
 * Validate that a date string is a valid Monday
 */
export function isValidMonday(dateStr: string): boolean {
  if (!isDateFormat(dateStr)) {
    return false;
  }

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return false;
  }

  return date.getDay() === 1; // Monday is day 1
}

/**
 * Detect content type from URL
 */
export function detectContentType(url: string): 'article' | 'video' | 'blog_post' | 'other' {
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
    return 'video';
  }
  
  if (urlLower.includes('blog') || urlLower.includes('medium.com') || urlLower.includes('dev.to')) {
    return 'blog_post';
  }
  
  return 'article';
}

/**
 * Sanitize a tag: lowercase, remove special characters, trim whitespace
 */
export function sanitizeTag(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Sanitize and filter tags array
 */
export function sanitizeTags(tags: string[], maxTags: number = 10): string[] {
  return tags
    .map(sanitizeTag)
    .filter(tag => tag.length > 0) // Remove empty tags
    .filter((tag, index, self) => self.indexOf(tag) === index) // Remove duplicates
    .slice(0, maxTags); // Limit to maxTags
}

