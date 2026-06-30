import React, { useState, useEffect, useRef } from 'react';
import { 
  Presentation, ChevronLeft, ChevronRight, Play, Pause,
  Maximize, Minimize, Home, BarChart3, PieChart, 
  TrendingUp, DollarSign, Shield, Users, Clock,
  Download, Share2, Settings, Grid, List
} from 'lucide-react';
import { APMDashboardData } from '../../services/apmService';
import SpendingChart from './SpendingChart';
import VendorBreakdown from './VendorBreakdown';
import ComplianceGauge from './ComplianceGauge';
import RenewalTimeline from './RenewalTimeline';
import './MeetingPresentation.css';

interface Slide {
  id: string;
  title: string;
  subtitle?: string;
  type: 'overview' | 'metrics' | 'chart' | 'vendor' | 'compliance' | 'renewal' | 'summary';
  content?: React.ReactNode;
  notes?: string;
  duration?: number; // Auto-advance duration in seconds
}

interface MeetingPresentationProps {
  data: APMDashboardData;
  onClose?: () => void;
}

const MeetingPresentation: React.FC<MeetingPresentationProps> = ({ data, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [transitionEffect, setTransitionEffect] = useState<'slide' | 'fade'>('slide');
  const presentationRef = useRef<HTMLDivElement>(null);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const slides: Slide[] = [
    {
      id: 'overview',
      title: 'Application Portfolio Management',
      subtitle: 'Executive Dashboard Overview',
      type: 'overview',
      content: (
        <div className="slide-overview">
          <div className="overview-grid">
            <div className="overview-card">
              <h3>{data.total_applications}</h3>
              <p>Total Applications</p>
            </div>
            <div className="overview-card highlight">
              <h3>${(data.savings_amount / 1000000).toFixed(1)}M</h3>
              <p>YoY Savings ({data.savings_percentage.toFixed(1)}%)</p>
            </div>
            <div className="overview-card">
              <h3>{data.patch_compliance_rate.toFixed(0)}%</h3>
              <p>Patch Compliance</p>
            </div>
            <div className="overview-card">
              <h3>{data.renewals_next_30_days}</h3>
              <p>30-Day Renewals</p>
            </div>
          </div>
        </div>
      ),
      notes: 'Start with high-level metrics to set context',
      duration: 10
    },
    {
      id: 'spending-trend',
      title: 'Spending Trend Analysis',
      subtitle: '2024 vs 2025 Comparison',
      type: 'chart',
      content: (
        <div className="slide-chart">
          <SpendingChart monthlyTrend={data.monthly_trend} />
          <div className="chart-insights">
            <div className="insight">
              <TrendingUp size={20} />
              <span>YoY Reduction: {data.savings_percentage.toFixed(1)}%</span>
            </div>
            <div className="insight">
              <DollarSign size={20} />
              <span>Total Saved: ${(data.savings_amount / 1000000).toFixed(1)}M</span>
            </div>
          </div>
        </div>
      ),
      notes: 'Highlight cost reduction achievements and trends',
      duration: 15
    },
    {
      id: 'vendor-analysis',
      title: 'Vendor Spend Distribution',
      subtitle: 'Top Vendors by Annual Cost',
      type: 'vendor',
      content: (
        <div className="slide-vendor">
          <VendorBreakdown vendorTotals={data.vendor_totals} />
          <div className="vendor-insights">
            <p>Top vendor: {data.vendor_totals[0]?.vendor_name}</p>
            <p>Concentration: {((data.vendor_totals[0]?.total_spend / data.total_spend_2025) * 100).toFixed(0)}% of total</p>
          </div>
        </div>
      ),
      notes: 'Discuss vendor concentration risks and opportunities',
      duration: 12
    },
    {
      id: 'compliance',
      title: 'Security & Compliance Status',
      subtitle: 'Risk Assessment Overview',
      type: 'compliance',
      content: (
        <div className="slide-compliance">
          <ComplianceGauge 
            complianceScore={data.compliance_average}
            highRisk={data.high_risk_apps}
            mediumRisk={data.medium_risk_apps}
            lowRisk={data.low_risk_apps}
          />
          <div className="compliance-details">
            <div className="risk-item high">
              <span className="risk-count">{data.high_risk_apps}</span>
              <span className="risk-label">High Risk Apps</span>
            </div>
            <div className="risk-item medium">
              <span className="risk-count">{data.medium_risk_apps}</span>
              <span className="risk-label">Medium Risk Apps</span>
            </div>
            <div className="risk-item low">
              <span className="risk-count">{data.low_risk_apps}</span>
              <span className="risk-label">Low Risk Apps</span>
            </div>
          </div>
        </div>
      ),
      notes: 'Address security concerns and compliance requirements',
      duration: 12
    },
    {
      id: 'renewals',
      title: 'Renewal Timeline',
      subtitle: 'Upcoming License Renewals',
      type: 'renewal',
      content: (
        <div className="slide-renewal">
          <RenewalTimeline 
            renewals30={data.renewals_next_30_days}
            renewals60={data.renewals_next_60_days}
            renewals90={data.renewals_next_90_days}
            cost30={data.renewal_cost_30_days}
          />
          <div className="renewal-summary">
            <div className="renewal-item">
              <Clock size={20} />
              <div>
                <h4>Next 30 Days</h4>
                <p>{data.renewals_next_30_days} apps • ${(data.renewal_cost_30_days / 1000000).toFixed(1)}M</p>
              </div>
            </div>
          </div>
        </div>
      ),
      notes: 'Review critical renewal decisions needed',
      duration: 10
    },
    {
      id: 'key-metrics',
      title: 'Key Performance Metrics',
      subtitle: 'Operational Excellence Indicators',
      type: 'metrics',
      content: (
        <div className="slide-metrics">
          <div className="metrics-grid">
            <div className="metric-box">
              <Users size={24} />
              <h3>${data.cost_per_employee.toFixed(0)}</h3>
              <p>Cost per Employee</p>
            </div>
            <div className="metric-box">
              <PieChart size={24} />
              <h3>{data.average_utilization.toFixed(0)}%</h3>
              <p>License Utilization</p>
            </div>
            <div className="metric-box">
              <Shield size={24} />
              <h3>{data.patch_compliance_rate.toFixed(0)}%</h3>
              <p>Patch Compliance</p>
            </div>
            <div className="metric-box">
              <BarChart3 size={24} />
              <h3>{data.active_applications}</h3>
              <p>Active Applications</p>
            </div>
          </div>
        </div>
      ),
      notes: 'Discuss efficiency metrics and optimization opportunities',
      duration: 12
    },
    {
      id: 'summary',
      title: 'Executive Summary',
      subtitle: 'Key Takeaways & Actions',
      type: 'summary',
      content: (
        <div className="slide-summary">
          <div className="summary-section">
            <h3>✅ Achievements</h3>
            <ul>
              <li>${(data.savings_amount / 1000000).toFixed(1)}M saved YoY ({data.savings_percentage.toFixed(1)}%)</li>
              <li>{data.patch_compliance_rate.toFixed(0)}% patch compliance maintained</li>
              <li>{data.active_applications} applications actively managed</li>
            </ul>
          </div>
          <div className="summary-section">
            <h3>⚠️ Attention Required</h3>
            <ul>
              {data.high_risk_apps > 0 && <li>{data.high_risk_apps} high-risk applications need review</li>}
              {data.renewals_next_30_days > 0 && <li>{data.renewals_next_30_days} renewals pending ($${(data.renewal_cost_30_days / 1000000).toFixed(1)}M)</li>}
              {data.average_utilization < 70 && <li>License utilization at {data.average_utilization.toFixed(0)}% - optimization needed</li>}
            </ul>
          </div>
          <div className="summary-section">
            <h3>📋 Next Steps</h3>
            <ul>
              <li>Review and approve pending renewals</li>
              <li>Address high-risk application security</li>
              <li>Optimize underutilized licenses</li>
              <li>Schedule vendor negotiations</li>
            </ul>
          </div>
        </div>
      ),
      notes: 'Conclude with clear action items and next steps',
      duration: 15
    }
  ];

  useEffect(() => {
    const currentSlideDuration = slides[currentSlide]?.duration;
    if (isPlaying && currentSlideDuration) {
      autoPlayTimerRef.current = setTimeout(() => {
        handleNextSlide();
      }, currentSlideDuration * 1000);
    }
    return () => {
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
      }
    };
  }, [isPlaying, currentSlide]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          handlePreviousSlide();
          break;
        case 'ArrowRight':
          handleNextSlide();
          break;
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'Escape':
          if (isFullscreen) {
            exitFullscreen();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [currentSlide, isFullscreen, isPlaying]);

  const handleNextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else if (isPlaying) {
      setIsPlaying(false);
    }
  };

  const handlePreviousSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (presentationRef.current?.requestFullscreen) {
        presentationRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      exitFullscreen();
    }
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    setIsFullscreen(false);
  };

  const exportPresentation = () => {
    const presentationData = {
      title: 'APM Executive Presentation',
      date: new Date().toISOString(),
      slides: slides.map(s => ({
        title: s.title,
        subtitle: s.subtitle,
        notes: s.notes
      })),
      metrics: {
        applications: data.total_applications,
        savings: data.savings_percentage,
        compliance: data.patch_compliance_rate,
        renewals: data.renewals_next_30_days
      }
    };

    const blob = new Blob([JSON.stringify(presentationData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apm-presentation-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const currentSlideData = slides[currentSlide];
  const progress = ((currentSlide + 1) / slides.length) * 100;

  return (
    <div 
      ref={presentationRef}
      className={`meeting-presentation ${isFullscreen ? 'fullscreen' : ''}`}
    >
      {/* Header */}
      <div className="presentation-header">
        <div className="header-left">
          <Presentation size={20} />
          <h2>Meeting Presentation Mode</h2>
          <span className="slide-counter">
            Slide {currentSlide + 1} of {slides.length}
          </span>
        </div>
        <div className="header-controls">
          <button onClick={() => setShowNotes(!showNotes)} className="control-btn" title="Toggle notes">
            <List size={16} />
          </button>
          <button onClick={() => setShowThumbnails(!showThumbnails)} className="control-btn" title="Toggle thumbnails">
            <Grid size={16} />
          </button>
          <button onClick={exportPresentation} className="control-btn" title="Export presentation">
            <Download size={16} />
          </button>
          <button onClick={toggleFullscreen} className="control-btn" title="Toggle fullscreen">
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
          {onClose && (
            <button onClick={onClose} className="close-btn" title="Close presentation">
              ×
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="presentation-progress">
        <div className="progress-bar" style={{ width: `${progress}%` }} />
      </div>

      {/* Main Content */}
      <div className="presentation-content">
        {/* Thumbnails Sidebar */}
        {showThumbnails && (
          <div className="thumbnails-sidebar">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className={`thumbnail ${index === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
              >
                <span className="thumbnail-number">{index + 1}</span>
                <span className="thumbnail-title">{slide.title}</span>
              </div>
            ))}
          </div>
        )}

        {/* Slide Display */}
        <div className="slide-container">
          <div className={`slide ${transitionEffect}`}>
            <div className="slide-header">
              <h1>{currentSlideData.title}</h1>
              {currentSlideData.subtitle && (
                <p className="slide-subtitle">{currentSlideData.subtitle}</p>
              )}
            </div>
            <div className="slide-body">
              {currentSlideData.content}
            </div>
          </div>

          {/* Speaker Notes */}
          {showNotes && currentSlideData.notes && (
            <div className="speaker-notes">
              <h4>Speaker Notes</h4>
              <p>{currentSlideData.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="presentation-controls">
        <div className="controls-left">
          <button 
            onClick={handlePreviousSlide} 
            disabled={currentSlide === 0}
            className="nav-btn"
          >
            <ChevronLeft size={20} />
            Previous
          </button>
          <button onClick={togglePlayPause} className="play-btn">
            {isPlaying ? (
              <>
                <Pause size={20} />
                Pause
              </>
            ) : (
              <>
                <Play size={20} />
                Play
              </>
            )}
          </button>
          <button 
            onClick={handleNextSlide} 
            disabled={currentSlide === slides.length - 1}
            className="nav-btn"
          >
            Next
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="controls-right">
          <button onClick={() => setCurrentSlide(0)} className="home-btn">
            <Home size={16} />
            Start
          </button>
          <select 
            value={transitionEffect} 
            onChange={(e) => setTransitionEffect(e.target.value as 'slide' | 'fade')}
            className="transition-select"
          >
            <option value="slide">Slide</option>
            <option value="fade">Fade</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default MeetingPresentation;