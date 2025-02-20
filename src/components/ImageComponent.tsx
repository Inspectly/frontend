import { useState } from "react";

const ImageComponent: React.FC<{
  src: string;
  fallback: string;
  className?: string;
}> = ({ src, fallback, className = "" }) => {
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <img
      src={imgSrc}
      alt="Dynamic Image"
      onError={() => setImgSrc(fallback)} // Fallback on error
      className={`${className}`}
    />
  );
};

export default ImageComponent;
