/**
 * Normalizes vendor occupation names to consistent issue type names
 * Example: "electrician" → "electrical", "plumber" → "plumbing"
 */
export const normalizeIssueType = (type: string): string => {
  if (!type) return type;
  
  const typeMap: Record<string, string> = {
    'electrician': 'electrical',
    'plumber': 'plumbing',
    'painter': 'painting',
    'cleaner': 'cleaning',
  };
  
  const normalized = typeMap[type.toLowerCase()];
  return normalized || type;
};

/**
 * Normalizes and capitalizes issue type for display
 * Example: "electrician" → "Electrical"
 */
export const normalizeAndCapitalize = (type: string): string => {
  const normalized = normalizeIssueType(type);
  return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
};
