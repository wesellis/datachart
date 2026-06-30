import React, { useState, useEffect } from 'react';
import { PlayCircle, X, ChevronRight, DollarSign, Users, Shield, TrendingUp, Zap } from 'lucide-react';

interface DemoStep {
  title: string;
  description: string;
  highlight: string;
  action?: () => void;
}

interface DemoModeProps {
  isActive: boolean;
  onClose: () => void;
  onStepChange?: (step: number) => void;
}

const DemoMode: React.FC<DemoModeProps> = ({ isActive, onClose, onStepChange }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const demoSteps: DemoStep[] = [
    {
      title: "Welcome to DataChart",
      description: "Enterprise Application Portfolio Management that saves millions. This demo will show you how.",
      highlight: "dashboard-header"
    },
    {
      title: "$16.7M Total Spend Tracked",
      description: "See your entire software portfolio at a glance. 523 applications across all departments.",
      highlight: "metric-total-spend"
    },
    {
      title: "29% Cost Reduction Achieved",
      description: "AI-powered optimization has identified $4.5M in savings. That's ROI in 30 days.",
      highlight: "metric-savings"
    },
    {
      title: "Department-Specific Views",
      description: "IT sees infrastructure (187 apps), HR sees their tools (68 apps). Each team gets what they need.",
      highlight: "dashboard-selector"
    },
    {
      title: "Drag & Drop Customization",
      description: "No IT tickets needed. Business users customize their own dashboards in seconds.",
      highlight: "edit-btn"
    },
    {
      title: "Executive Insights",
      description: "AI-generated briefings for C-suite. Critical decisions, not data overload.",
      highlight: "executive-insights"
    },
    {
      title: "Compliance at 84%",
      description: "Real-time security and compliance tracking. Fix issues before auditors find them.",
      highlight: "compliance-gauge"
    },
    {
      title: "60 Renewals This Month",
      description: "Never miss a renewal. Negotiate from a position of strength with usage data.",
      highlight: "renewal-timeline"
    },
    {
      title: "White-Label Ready",
      description: "Resell to your clients with your branding. $10K/month unlimited license.",
      highlight: "settings-btn"
    },
    {
      title: "Start Saving Today",
      description: "Deploy in 48 hours, not 6 months. See ROI on day one, guaranteed.",
      highlight: "cta-button"
    }
  ];

  useEffect(() => {
    if (isPlaying && currentStep < demoSteps.length - 1) {
      const timer = setTimeout(() => {
        nextStep();
      }, 5000); // Auto-advance every 5 seconds
      return () => clearTimeout(timer);
    } else if (isPlaying && currentStep === demoSteps.length - 1) {
      setIsPlaying(false);
    }
  }, [isPlaying, currentStep]);

  useEffect(() => {
    if (onStepChange) {
      onStepChange(currentStep);
    }
    // Highlight current element
    const highlightElement = document.querySelector(`.${demoSteps[currentStep].highlight}`);
    if (highlightElement) {
      highlightElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      highlightElement.classList.add('demo-highlight');
      return () => {
        highlightElement.classList.remove('demo-highlight');
      };
    }
  }, [currentStep]);

  const nextStep = () => {
    if (currentStep < demoSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  if (!isActive) return null;

  const progress = ((currentStep + 1) / demoSteps.length) * 100;

  return (
    <>
      {/* Overlay */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.3)',
        zIndex: 9998,
        pointerEvents: 'none'
      }} />

      {/* Demo Controller */}
      <div style={{
        position: 'fixed',
        bottom: '30px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'linear-gradient(135deg, #1e40af 0%, #3730a3 100%)',
        borderRadius: '16px',
        padding: '20px 30px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        zIndex: 9999,
        minWidth: '600px',
        color: 'white'
      }}>
        {/* Progress Bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '16px 16px 0 0',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)',
            transition: 'width 0.3s ease'
          }} />
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            borderRadius: '50%',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'white'
          }}
        >
          <X size={16} />
        </button>

        {/* Step Counter */}
        <div style={{
          fontSize: '12px',
          opacity: 0.8,
          marginBottom: '8px'
        }}>
          Step {currentStep + 1} of {demoSteps.length}
        </div>

        {/* Content */}
        <h3 style={{
          fontSize: '20px',
          fontWeight: 600,
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          {currentStep === 2 && <DollarSign size={20} />}
          {currentStep === 3 && <Users size={20} />}
          {currentStep === 6 && <Shield size={20} />}
          {currentStep === 9 && <TrendingUp size={20} />}
          {demoSteps[currentStep].title}
        </h3>
        
        <p style={{
          fontSize: '14px',
          opacity: 0.9,
          marginBottom: '20px',
          lineHeight: 1.5
        }}>
          {demoSteps[currentStep].description}
        </p>

        {/* Controls */}
        <div style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'center'
        }}>
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              color: 'white',
              cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
              opacity: currentStep === 0 ? 0.5 : 1,
              fontSize: '14px'
            }}
          >
            Previous
          </button>

          <button
            onClick={togglePlay}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px'
            }}
          >
            {isPlaying ? 'Pause' : 'Play'}
            <PlayCircle size={16} />
          </button>

          <button
            onClick={nextStep}
            disabled={currentStep === demoSteps.length - 1}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 20px',
              color: 'white',
              cursor: currentStep === demoSteps.length - 1 ? 'not-allowed' : 'pointer',
              opacity: currentStep === demoSteps.length - 1 ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            Next
            <ChevronRight size={16} />
          </button>

          <div style={{ flex: 1 }} />

          {currentStep === demoSteps.length - 1 && (
            <button
              onClick={() => window.open('https://calendly.com/DataChart-demo', '_blank')}
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 24px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                animation: 'pulse 2s infinite'
              }}
            >
              Schedule Live Demo
            </button>
          )}
        </div>

        {/* Quick Stats for Sales */}
        {currentStep === demoSteps.length - 1 && (
          <div style={{
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.2)',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '20px'
          }}>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>48hrs</div>
              <div style={{ fontSize: '11px', opacity: 0.8 }}>Deployment Time</div>
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>$5K</div>
              <div style={{ fontSize: '11px', opacity: 0.8 }}>Avg Monthly Value</div>
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>29%</div>
              <div style={{ fontSize: '11px', opacity: 0.8 }}>Cost Reduction</div>
            </div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>110%</div>
              <div style={{ fontSize: '11px', opacity: 0.8 }}>Net Revenue Retention</div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        .demo-highlight {
          position: relative;
          z-index: 9997;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5);
          animation: highlight-pulse 2s infinite;
        }
        
        @keyframes highlight-pulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5); }
          50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.3); }
        }
      `}</style>
    </>
  );
};

export default DemoMode;