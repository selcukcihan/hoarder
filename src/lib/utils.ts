// Utility functions for web application

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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
 * Get the Monday of the current week
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
 * Get the Monday of a given date (or nearest Monday if not Monday)
 */
export function getNearestMonday(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Days to subtract to get Monday
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  
  return monday.toISOString().split('T')[0];
}

/**
 * Extract video ID from YouTube URL
 * Supports various YouTube URL formats:
 * - youtube.com/watch?v=VIDEO_ID
 * - youtu.be/VIDEO_ID
 * - youtube.com/embed/VIDEO_ID
 */
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Check if a URL is a YouTube URL
 */
export function isYouTubeUrl(url: string): boolean {
  return /youtube\.com|youtu\.be/.test(url);
}

/**
 * Generate a placeholder image as data URI
 * Creates a gradient background with the first letter of the title
 */
export function generatePlaceholderImage(
  title: string,
  width: number = 200,
  height: number = 150
): string {
  const firstLetter = title.charAt(0).toUpperCase() || "?";

  // Generate a color based on the title (deterministic)
  const hash = title.split("").reduce((acc, char) => {
    return (acc << 5) - acc + char.charCodeAt(0);
  }, 0);

  // Generate two colors for gradient
  const hue1 = Math.abs(hash) % 360;
  const hue2 = (hue1 + 60) % 360;
  const color1 = `hsl(${hue1}, 70%, 50%)`;
  const color2 = `hsl(${hue2}, 70%, 60%)`;

  // Create SVG as data URI
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)"/>
      <text 
        x="50%" 
        y="50%" 
        font-family="Arial, sans-serif" 
        font-size="${Math.min(width, height) * 0.4}" 
        font-weight="bold" 
        fill="white" 
        text-anchor="middle" 
        dominant-baseline="central"
        opacity="0.9"
      >${firstLetter}</text>
    </svg>
  `.trim();

  // Encode SVG for data URI
  const encoded = encodeURIComponent(svg);
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

/**
 * Truncate a title to a maximum length, adding ellipsis if needed
 * @param title The title to truncate
 * @param maxLength Maximum length before truncation (default: 100)
 * @returns Truncated title with ellipsis if needed
 */
export function truncateTitle(title: string, maxLength: number = 100): string {
  if (title.length <= maxLength) {
    return title;
  }
  return title.slice(0, maxLength - 3) + '...';
}

