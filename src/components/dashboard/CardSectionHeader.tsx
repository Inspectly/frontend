import React from "react";
import { Link } from "react-router-dom";

interface CardSectionHeaderProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  right?: React.ReactNode;
  /** Optional extra content rendered below the title row (e.g. tab navigation) */
  children?: React.ReactNode;
}

const CardSectionHeader: React.FC<CardSectionHeaderProps> = ({
  icon,
  iconBg,
  title,
  viewAllHref,
  viewAllLabel = "View all ›",
  right,
  children,
}) => (
  <div className="px-5 py-4 border-b border-border">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
      </div>
      {viewAllHref && (
        <Link
          to={viewAllHref}
          className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          {viewAllLabel}
        </Link>
      )}
      {!viewAllHref && right}
    </div>
    {children && <div className="mt-4">{children}</div>}
  </div>
);

export default CardSectionHeader;
