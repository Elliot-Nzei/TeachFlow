
// utils/image-url.ts

/**
 * A more robust function to sanitize and format image URLs for safe display.
 * It handles Google Drive links and provides a fallback.
 * @param url The raw image URL from the database.
 * @param fallbackName A name to generate a placeholder avatar if the URL is invalid.
 * @returns A safe, usable image URL string.
 */
export const getSafeImageUrl = (url: string | null | undefined, fallbackName: string = 'User'): string => {
  if (!url) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=random`;
  }

  try {
    // --- 1. Handle Google Drive 'file/d/' links ---
    if (url.includes('drive.google.com/file/d/')) {
      const match = url.match(/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        // Use the 'uc' (user content) link for direct viewing
        return `https://drive.google.com/uc?export=view&id=${match[1]}`;
      }
    }

    // --- 2. Check if it's already a valid, absolute URL from an allowed domain ---
    // This simple check is often sufficient. new URL() is more robust.
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:image')) {
       // All other URLs are passed through, assuming they are valid direct image links.
       // The `SafeImage` component's onError will catch any that fail to load.
       return url;
    }

    // --- 3. If it's not a recognizable format, return a fallback ---
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=random`;

  } catch (error) {
    // If any part of the URL processing fails, return a fallback.
    console.error("Failed to process image URL:", url, error);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=random`;
  }
};
