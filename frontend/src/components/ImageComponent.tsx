import { useState, useEffect } from "react";

// Check if src is valid (not null, undefined, empty, or "None" from Python backend)
const isValidSrc = (src: string | undefined | null): boolean => {
  return Boolean(src && src !== "None" && src !== "null" && src !== "undefined");
};

// Extract first valid image URL from a value that may be a string, JSON array string, or array
const extractFirstImage = (src: string | string[] | undefined | null): string | null => {
  if (!src) return null;
  // If it's already an array, use first element
  if (Array.isArray(src)) {
    const first = src[0];
    return isValidSrc(first) ? first : null;
  }
  // Try parsing as JSON array (backend may send "[\"url1\",\"url2\"]")
  if (typeof src === "string" && src.startsWith("[")) {
    try {
      const parsed = JSON.parse(src);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return isValidSrc(parsed[0]) ? parsed[0] : null;
      }
    } catch { /* not JSON, treat as plain string */ }
  }
  return isValidSrc(src) ? src : null;
};

const ImageComponent: React.FC<{
  src: string | string[] | undefined | null;
  fallback: string;
  className?: string;
  alt?: string;
  onClick?: () => void;
}> = ({ src, fallback, className = "", alt, onClick }) => {
  const resolved = extractFirstImage(src);
  const [imgSrc, setImgSrc] = useState(resolved ?? fallback);

  // Reset image source when src prop changes
  useEffect(() => {
    const resolved = extractFirstImage(src);
    setImgSrc(resolved ?? fallback);
  }, [src, fallback]);

  return (
    <img
      src={imgSrc}
      alt={alt || "Dynamic Image"}
      onError={() => setImgSrc(fallback)}
      className={`${className}`}
      onClick={onClick}
    />
  );
};

export default ImageComponent;
