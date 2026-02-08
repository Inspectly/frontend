import { useState, useEffect } from "react";

// Check if src is valid (not null, undefined, empty, or "None" from Python backend)
const isValidSrc = (src: string | undefined | null): boolean => {
  return Boolean(src && src !== "None" && src !== "null" && src !== "undefined");
};

const ImageComponent: React.FC<{
  src: string | undefined | null;
  fallback: string;
  className?: string;
}> = ({ src, fallback, className = "" }) => {
  // Use fallback if src is undefined, null, empty, or "None"
  const [imgSrc, setImgSrc] = useState(isValidSrc(src) ? src! : fallback);

  // Reset image source when src prop changes
  useEffect(() => {
    setImgSrc(isValidSrc(src) ? src! : fallback);
  }, [src, fallback]);

  return (
    <img
      src={imgSrc}
      alt="Dynamic Image"
      onError={() => setImgSrc(fallback)}
      className={`${className}`}
    />
  );
};

export default ImageComponent;
