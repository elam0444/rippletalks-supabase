/**
 * Utility functions for generating consistent colors based on category/industry names
 */

/**
 * Accessible badge colors: medium background + dark text (WCAG AA contrast)
 */
export const CATEGORY_COLORS = [
  "bg-blue-100 text-blue-700 hover:bg-blue-100",
  "bg-green-100 text-green-700 hover:bg-green-100",
  "bg-purple-100 text-purple-700 hover:bg-purple-100",
  "bg-orange-100 text-orange-700 hover:bg-orange-100",
  "bg-pink-100 text-pink-700 hover:bg-pink-100",
  "bg-cyan-100 text-cyan-700 hover:bg-cyan-100",
  "bg-amber-100 text-amber-700 hover:bg-amber-100",
  "bg-indigo-100 text-indigo-700 hover:bg-indigo-100",
] as const;

/**
 * Generate a consistent color class string based on a category or industry name.
 * Uses a hash function to ensure the same name always gets the same color.
 *
 * @param name - The category or industry name
 * @returns Tailwind CSS class string for background and text colors
 *
 * @example
 * getCategoryColor("Technology") // Returns a consistent color for "Technology"
 * getCategoryColor("Healthcare") // Returns a consistent color for "Healthcare"
 */
export function getCategoryColor(name: string): string {
  // Generate a consistent hash from the name
  const hash = name.split("").reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length];
}

/**
 * Alias for getCategoryColor - for industry-specific contexts
 */
export const getIndustryColor = getCategoryColor;
