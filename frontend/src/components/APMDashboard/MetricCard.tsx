import "./MetricCard.css";
import React from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: string;
  trendDirection?: "up" | "down";
  subtitle?: string;
  highlight?: boolean;
  icon?: string;
  color?: "primary" | "secondary" | "success" | "warning" | "danger" | "info";
  compact?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  trend,
  trendDirection,
  subtitle,
  highlight,
  color = "primary",
  compact = false
}) => {
  // Return the card WITH its wrapper since grid doesn't apply classes
  return (
    <div className={`metric-card ${highlight ? "highlight" : ""} ${color} ${compact ? "compact" : ""}`}>
      <div className="metric-card-inner">
        <div className="metric-left">
          <div className="metric-title">{title}</div>
          {subtitle && <div className="metric-subtitle">{subtitle}</div>}
          {trend && (
            <div className={`metric-trend trend-${trendDirection}`}>
              <span className="trend-arrow">{trendDirection === "up" ? "↑" : "↓"}</span>
              <span className="trend-value">{trend}</span>
            </div>
          )}
        </div>
        <div className="metric-right">
          <div className="metric-value">{value}</div>
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
