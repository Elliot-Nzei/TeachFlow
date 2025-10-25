
// utils/image-url.ts
export const getSafeImageUrl = (url: string): string => {
  if (!url) return '';

  try {
    // --- 1️⃣ Handle Google Drive links ---
    if (url.includes('drive.google.com')) {
      const match = url.match(/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://drive.google.com/uc?export=view&id=${match[1]}`;
      }
    }

    // --- 2️⃣ Handle Google Images redirect links ---
    if (url.includes('google.com/imgres')) {
      const imgUrlParam = new URL(url).searchParams.get('imgurl');
      if (imgUrlParam) return decodeURIComponent(imgUrlParam);
    }

    // --- 3️⃣ Handle Pinterest redirect or tracking URLs ---
    if (url.includes('pinimg.com')) {
      // Direct Pinterest CDN image (fine to use)
      return url;
    }

    // --- 4️⃣ Handle Unsplash ---
    if (url.includes('unsplash.com')) {
      // Handle short forms or page URLs
      if (!url.match(/\.(jpg|jpeg|png|webp|avif)$/)) {
        const match = url.match(/photos\/([^/?]+)/);
        if (match && match[1]) {
          return `https://source.unsplash.com/${match[1]}`;
        }
      }
      return url;
    }

    // --- 5️⃣ If it’s already a valid image file URL ---
    if (url.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i)) {
      return url;
    }

    // --- 6️⃣ Default fallback ---
    return url;
  } catch {
    return '';
  }
};
