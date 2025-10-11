import { useState, useEffect } from "react";

const ImageComponent: React.FC<{
  src: string;
  fallback: string;
  className?: string;
}> = ({ src, fallback, className = "" }) => {
  const [imgSrc, setImgSrc] = useState(src);

  // Reset image source when src prop changes
  useEffect(() => {
    setImgSrc(src);
  }, [src]);

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
