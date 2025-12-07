/**
 * Formats a date to show relative time in days-based format for marketplace context
 * @param dateString - ISO date string
 * @returns Formatted relative time string
 */
export const formatRelativeTime = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  
  // Same calendar day - regardless of hours
  if (date.toLocaleDateString() === now.toLocaleDateString()) {
    return 'Today';
  }
  
  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toLocaleDateString() === yesterday.toLocaleDateString()) {
    return 'Yesterday';
  }
  
  // Calculate days difference for older dates
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  // Multiple days (up to 30 days)
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  }
  
  // More than 30 days - show actual date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
};
