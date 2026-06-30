import React, { useState } from 'react';
import { X, Calendar, Clock, Mail, FileText } from 'lucide-react';

interface ScheduleReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (config: ScheduleConfig) => void;
  dashboardType: string;
}

export interface ScheduleConfig {
  frequency: 'daily' | 'weekly' | 'monthly';
  day?: string;
  time: string;
  recipients: string[];
  format: 'pdf' | 'excel' | 'both';
  includeCharts: boolean;
  includeSummary: boolean;
}

const ScheduleReportModal: React.FC<ScheduleReportModalProps> = ({
  isOpen,
  onClose,
  onSchedule,
  dashboardType
}) => {
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [selectedDay, setSelectedDay] = useState('monday');
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [recipients, setRecipients] = useState('');
  const [format, setFormat] = useState<'pdf' | 'excel' | 'both'>('pdf');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);

  if (!isOpen) return null;

  const handleSchedule = () => {
    const config: ScheduleConfig = {
      frequency,
      day: frequency === 'weekly' ? selectedDay : undefined,
      time: selectedTime,
      recipients: recipients.split(',').map(email => email.trim()).filter(email => email),
      format,
      includeCharts,
      includeSummary
    };
    
    onSchedule(config);
    onClose();
  };

  const modalStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000
  };

  const contentStyle: React.CSSProperties = {
    background: 'var(--widget-background, white)',
    borderRadius: '12px',
    padding: '24px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflowY: 'auto',
    color: 'var(--text-primary, #1e293b)'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid var(--border-color, #e2e8f0)',
    background: 'var(--widget-background, white)',
    color: 'var(--text-primary, #1e293b)',
    fontSize: '14px'
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '6px',
    color: 'var(--text-secondary, #64748b)'
  };

  const checkboxLabelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: 'var(--text-primary, #1e293b)',
    cursor: 'pointer'
  };

  return (
    <div style={modalStyle}>
      <div style={contentStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={24} style={{ color: '#3b82f6' }} />
            Schedule Report
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={20} style={{ color: 'var(--text-secondary, #64748b)' }} />
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Dashboard Type</label>
          <input type="text" value={dashboardType} disabled style={{ ...inputStyle, opacity: 0.7 }} />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Frequency</label>
          <select value={frequency} onChange={(e) => setFrequency(e.target.value as any)} style={selectStyle}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {frequency === 'weekly' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Day of Week</label>
            <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} style={selectStyle}>
              <option value="monday">Monday</option>
              <option value="tuesday">Tuesday</option>
              <option value="wednesday">Wednesday</option>
              <option value="thursday">Thursday</option>
              <option value="friday">Friday</option>
            </select>
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Time</label>
          <input type="time" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Recipients (comma-separated emails)</label>
          <input 
            type="text" 
            value={recipients} 
            onChange={(e) => setRecipients(e.target.value)} 
            placeholder="user@example.com, manager@example.com"
            style={inputStyle} 
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Report Format</label>
          <select value={format} onChange={(e) => setFormat(e.target.value as any)} style={selectStyle}>
            <option value="pdf">PDF</option>
            <option value="excel">Excel</option>
            <option value="both">Both PDF & Excel</option>
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={checkboxLabelStyle}>
            <input type="checkbox" checked={includeCharts} onChange={(e) => setIncludeCharts(e.target.checked)} />
            Include Charts & Visualizations
          </label>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={checkboxLabelStyle}>
            <input type="checkbox" checked={includeSummary} onChange={(e) => setIncludeSummary(e.target.checked)} />
            Include Executive Summary
          </label>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: 'var(--widget-background-hover, #f8fafc)',
              color: 'var(--text-primary, #1e293b)',
              border: '1px solid var(--border-color, #e2e8f0)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSchedule}
            style={{
              padding: '10px 20px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            Schedule Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleReportModal;