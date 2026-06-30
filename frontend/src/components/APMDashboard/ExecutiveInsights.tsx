import React, { useState, useEffect } from "react";
import { TrendingUp, AlertTriangle, CheckCircle, DollarSign, Clock, Shield } from "lucide-react";

interface Insight {
  id: string;
  type: "success" | "warning" | "info" | "critical";
  icon: any;
  message: string;
  value?: string;
}

interface ExecutiveInsightsProps {
  data?: any;
  config?: {
    refreshInterval?: number;
    maxInsights?: number;
    thresholds?: {
      savingsTarget?: number;
      complianceMin?: number;
      renewalDays?: number;
    };
  };
}

const ExecutiveInsights: React.FC<ExecutiveInsightsProps> = ({ data, config }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    const newInsights: Insight[] = [];

    if (data) {
      if (data.high_risk_apps > 0) {
        newInsights.push({
          id: "high-risk",
          type: "critical",
          icon: AlertTriangle,
          message: `${data.high_risk_apps} high-risk applications`,
          value: `require immediate attention`
        });
      }

      if (data.patch_compliance_rate < 90) {
        newInsights.push({
          id: "compliance",
          type: "warning",
          icon: Shield,
          message: `Compliance needs attention`,
          value: `${data.patch_compliance_rate}% patched`
        });
      }

      if (data.savings_amount > 0) {
        newInsights.push({
          id: "savings",
          type: "success",
          icon: DollarSign,
          message: `You're on track to save`,
          value: `$${(data.savings_amount / 1000000).toFixed(1)}M this year`
        });
      }

      if (data.renewals_next_60_days > 0) {
        newInsights.push({
          id: "renewals",
          type: "info",
          icon: Clock,
          message: `${data.renewals_next_60_days} contracts expiring`,
          value: `Next 60 days`
        });
      }

      if (data.average_utilization < 70) {
        newInsights.push({
          id: "utilization",
          type: "warning",
          icon: TrendingUp,
          message: `License utilization low`,
          value: `${data.average_utilization.toFixed(0)}% utilized`
        });
      }
    }

    if (newInsights.length === 0) {
      newInsights.push({
        id: "default",
        type: "info",
        icon: CheckCircle,
        message: "All systems operational",
        value: "No critical issues detected"
      });
    }

    setInsights(newInsights);
  }, [data]);

  useEffect(() => {
    if (insights.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % insights.length);
      }, config?.refreshInterval || 5000);
      
      return () => clearInterval(interval);
    }
  }, [insights, config?.refreshInterval]);

  if (insights.length === 0) {
    return null;
  }

  const current = insights[currentIndex];
  if (!current) {
    return null;
  }
  
  const Icon = current.icon;
  
  const styles = {
    background: current.type === "critical" ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" :
                current.type === "warning" ? "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)" :
                current.type === "success" ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" :
                "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
  };

  return (
    <div style={{
      background: styles.background,
      borderRadius: "12px",
      padding: "20px",
      color: "white",
      position: "relative",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      height: "100%",
      minHeight: "80px"
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "48px",
        height: "48px",
        background: "rgba(255, 255, 255, 0.2)",
        borderRadius: "12px",
        marginRight: "16px",
        flexShrink: 0,
      }}>
        <Icon size={24} color="white" />
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>
          {current.message}
        </div>
        {current.value && (
          <div style={{ fontSize: "14px", opacity: 0.95 }}>
            {current.value}
          </div>
        )}
      </div>

      {insights.length > 1 && (
        <div style={{
          display: "flex",
          gap: "4px",
          position: "absolute",
          bottom: "8px",
          right: "12px",
        }}>
          {insights.map((_, idx) => (
            <div
              key={idx}
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: idx === currentIndex ? "white" : "rgba(255, 255, 255, 0.4)",
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ExecutiveInsights;
