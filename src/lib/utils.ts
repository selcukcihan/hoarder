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

