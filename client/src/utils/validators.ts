/**
 * Input validation utilities for the application
 */

/**
 * Validates that a location string does not contain numbers
 * @param location - The location string to validate
 * @returns true if valid (no numbers), false if invalid (contains numbers)
 */
export function validateLocationNoNumbers(location: string): boolean {
  // Check if the location contains any numeric digits
  return !/\d/.test(location);
}

/**
 * Gets initials from a name (e.g., "John Doe" => "JD")
 * @param name - The full name
 * @returns The initials
 */
export function getInitials(name: string): string {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
}