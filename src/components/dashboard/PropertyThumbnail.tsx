import React from "react";
import { Home } from "lucide-react";
import ImageComponent from "../ImageComponent";
import { PROPERTY_FALLBACK_IMAGE } from "../../constants/assets";

interface PropertyThumbnailProps {
  imageUrl?: string | string[] | null;
  size?: "sm" | "md" | "lg";
  fallbackIcon?: React.ReactNode;
  className?: string;
}

const sizeClasses = {
  sm: "w-10 h-10",
  md: "w-12 h-12",
  lg: "w-14 h-14",
};

const iconSizeClasses = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

const PropertyThumbnail: React.FC<PropertyThumbnailProps> = ({
  imageUrl,
  size = "md",
  fallbackIcon,
  className = "",
}) => (
  <div className={`${sizeClasses[size]} rounded-lg overflow-hidden flex-shrink-0 bg-muted ${className}`}>
    {imageUrl ? (
      <ImageComponent
        src={imageUrl}
        fallback={PROPERTY_FALLBACK_IMAGE}
        className="w-full h-full object-cover"
      />
    ) : (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
        {fallbackIcon ?? <Home className={iconSizeClasses[size]} />}
      </div>
    )}
  </div>
);

export default PropertyThumbnail;
