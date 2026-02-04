import { useState, useEffect } from "react";

const ImageComponent: React.FC<{
  src: string | undefined | null;
  fallback: string;
  className?: string;
}> = ({ src, fallback, className = "" }) => {
  // Use fallback if src is undefined, null, or empty
  const [imgSrc, setImgSrc] = useState(src || fallback);

  // Reset image source when src prop changes
  useEffect(() => {
    setImgSrc(src || fallback);
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
