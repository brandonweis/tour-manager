/**
 * Date utilities for the application
 */

/**
 * Formats a date to DD.MM.YYYY format
 * @param date - The date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date | string): string {
  try {
    // Handle null/undefined
    if (!date) return 'Invalid date';
    
    const d = date instanceof Date ? date : new Date(date);
    
    // Check if date is valid
    if (isNaN(d.getTime())) return 'Invalid date';
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const year = d.getFullYear();
    
    return `${day}.${month}.${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Parses a date string (DD.MM.YYYY or YYYY-MM-DD) to a Date object
 * @param dateStr - The date string to parse
 * @returns Date object
 */
export function parseDate(dateStr: string): Date {
  try {
    // Handle null/undefined/empty
    if (!dateStr) return new Date();
    
    // Handle both ISO format (YYYY-MM-DD) and display format (DD.MM.YYYY)
    if (dateStr.includes('-')) {
      // ISO format
      const date = new Date(dateStr);
      // Validate 
      return isNaN(date.getTime()) ? new Date() : date;
    } else if (dateStr.includes('.')) {
      // DD.MM.YYYY format
      try {
        const parts = dateStr.split('.');
        if (parts.length !== 3) return new Date();
        
        const [day, month, year] = parts.map(Number);
        // Validate parts
        if (isNaN(day) || isNaN(month) || isNaN(year)) return new Date();
        
        const date = new Date(year, month - 1, day);
        return isNaN(date.getTime()) ? new Date() : date;
      } catch (e) {
        console.error('Error parsing date with dots:', e);
        return new Date();
      }
    }
    
    // Fallback to direct parsing
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? new Date() : date;
  } catch (error) {
    console.error('Error parsing date:', error);
    return new Date();
  }
}

/**
 * Formats a date to YYYY-MM-DD format (ISO date format)
 * @param date - The date to format
 * @returns ISO date string
 */
export function formatISODate(date: Date | string): string {
  try {
    // Handle null/undefined
    if (!date) return '';
    
    const d = date instanceof Date ? date : new Date(date);
    
    // Check if date is valid
    if (isNaN(d.getTime())) return '';
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting ISO date:', error);
    return '';
  }
}

/**
 * Gets today's date in YYYY-MM-DD format
 * @returns Today's date in ISO format
 */
export function getToday(): string {
  return formatISODate(new Date());
}

/**
 * Checks if a date is in the past
 * @param date - The date to check
 * @returns true if the date is in the past
 */
export function isDateInPast(date: Date | string): boolean {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset hours to compare dates only
    
    // Handle null/undefined cases
    if (!date) return false;
    
    // Create a date object from the input
    const checkDate = date instanceof Date ? date : new Date(date);
    
    // Check if date is valid
    if (isNaN(checkDate.getTime())) return false;
    
    checkDate.setHours(0, 0, 0, 0);
    
    return checkDate < today;
  } catch (error) {
    console.error('Error checking if date is in past:', error);
    return false;
  }
}

/**
 * Calculates the number of days between two dates
 * @param start - Start date
 * @param end - End date
 * @returns Number of days
 */
export function daysBetween(start: Date | string, end: Date | string): number {
  try {
    // Handle null/undefined
    if (!start || !end) return 0;
    
    const startDate = start instanceof Date ? start : new Date(start);
    const endDate = end instanceof Date ? end : new Date(end);
    
    // Check if dates are valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0;
    
    // Reset hours to compare dates only
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    // Calculate difference in milliseconds
    const diffMs = endDate.getTime() - startDate.getTime();
    
    // Convert to days
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  } catch (error) {
    console.error('Error calculating days between dates:', error);
    return 0;
  }
}