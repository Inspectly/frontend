import React from "react";

interface DashboardStatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  value: React.ReactNode;
  label: string;
  subtitle?: React.ReactNode;
  onClick?: () => void;
}

const DashboardStatCard: React.FC<DashboardStatCardProps> = ({
  icon,
  iconBg,
  value,
  label,
  subtitle,
  onClick,
}) => (
  <div
    onClick={onClick}
    className={`bg-card rounded-xl p-5 border border-border shadow-soft hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${onClick ? "cursor-pointer" : ""}`}
  >
    <div className={`w-9 h-9 ${iconBg} rounded-lg flex items-center justify-center mb-3`}>
      {icon}
    </div>
    <div className="text-3xl font-bold text-foreground mb-1">{value}</div>
    <div className="text-sm text-muted-foreground">{label}</div>
    {subtitle && <div className="text-xs text-primary mt-1">{subtitle}</div>}
  </div>
);

export default DashboardStatCard;
