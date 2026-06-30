/**
 * Demo Data Service
 * Provides comprehensive sample data for development and demonstration
 */

export interface DemoMetrics {
  totalSpend: number;
  riskScore: number;
  activeUsers: number;
  complianceScore: number;
  highRiskApps: number;
  licenseUtilization: number;
}

export interface DemoApplication {
  id: string;
  name: string;
  vendor: string;
  category: string;
  annualSpend: number;
  monthlySpend: number;
  activeUsers: number;
  totalLicenses: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  complianceScore: number;
  lastUsed: Date;
  renewalDate: Date;
  contractType: 'Per User' | 'Enterprise' | 'Site License' | 'Usage Based';
  tags: string[];
}

export interface DemoUsageData {
  date: string;
  totalSpend: number;
  userCount: number;
  newApplications: number;
  riskIncidents: number;
}

export interface DemoAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  application: string;
  timestamp: Date;
  resolved: boolean;
}

class DemoDataService {
  
  /**
   * Get comprehensive dashboard metrics
   */
  getMetrics(): DemoMetrics {
    return {
      totalSpend: 2400000,
      riskScore: 7.2,
      activeUsers: 4847,
      complianceScore: 94.2,
      highRiskApps: 23,
      licenseUtilization: 87.3
    };
  }

  /**
   * Get detailed application portfolio
   */
  getApplications(): DemoApplication[] {
    return [
      {
        id: 'app-001',
        name: 'Microsoft 365',
        vendor: 'Microsoft',
        category: 'Productivity',
        annualSpend: 450000,
        monthlySpend: 37500,
        activeUsers: 2847,
        totalLicenses: 3000,
        riskLevel: 'Low',
        complianceScore: 98,
        lastUsed: new Date(),
        renewalDate: new Date('2024-12-15'),
        contractType: 'Per User',
        tags: ['Essential', 'Productivity', 'Communication']
      },
      {
        id: 'app-002',
        name: 'Salesforce',
        vendor: 'Salesforce',
        category: 'CRM',
        annualSpend: 290000,
        monthlySpend: 24167,
        activeUsers: 1247,
        totalLicenses: 1500,
        riskLevel: 'Medium',
        complianceScore: 94,
        lastUsed: new Date(Date.now() - 3600000),
        renewalDate: new Date('2024-08-30'),
        contractType: 'Per User',
        tags: ['Sales', 'CRM', 'Customer Management']
      },
      {
        id: 'app-003',
        name: 'Adobe Creative Cloud',
        vendor: 'Adobe',
        category: 'Design & Creative',
        annualSpend: 180000,
        monthlySpend: 15000,
        activeUsers: 456,
        totalLicenses: 500,
        riskLevel: 'Low',
        complianceScore: 96,
        lastUsed: new Date(Date.now() - 7200000),
        renewalDate: new Date('2025-03-01'),
        contractType: 'Per User',
        tags: ['Design', 'Creative', 'Media']
      },
      {
        id: 'app-004',
        name: 'Slack',
        vendor: 'Slack Technologies',
        category: 'Communication',
        annualSpend: 120000,
        monthlySpend: 10000,
        activeUsers: 2340,
        totalLicenses: 2500,
        riskLevel: 'Low',
        complianceScore: 99,
        lastUsed: new Date(Date.now() - 300000),
        renewalDate: new Date('2024-11-20'),
        contractType: 'Per User',
        tags: ['Communication', 'Collaboration', 'Messaging']
      },
      {
        id: 'app-005',
        name: 'Zoom',
        vendor: 'Zoom Video Communications',
        category: 'Video Conferencing',
        annualSpend: 89000,
        monthlySpend: 7417,
        activeUsers: 2847,
        totalLicenses: 3000,
        riskLevel: 'Medium',
        complianceScore: 89,
        lastUsed: new Date(Date.now() - 600000),
        renewalDate: new Date('2024-10-15'),
        contractType: 'Per User',
        tags: ['Video', 'Meetings', 'Communication']
      },
      {
        id: 'app-006',
        name: 'AutoCAD',
        vendor: 'Autodesk',
        category: 'Engineering',
        annualSpend: 75000,
        monthlySpend: 6250,
        activeUsers: 234,
        totalLicenses: 300,
        riskLevel: 'High',
        complianceScore: 76,
        lastUsed: new Date(Date.now() - 86400000),
        renewalDate: new Date('2024-09-30'),
        contractType: 'Per User',
        tags: ['CAD', 'Engineering', 'Design']
      },
      {
        id: 'app-007',
        name: 'DocuSign',
        vendor: 'DocuSign',
        category: 'Digital Signatures',
        annualSpend: 45000,
        monthlySpend: 3750,
        activeUsers: 567,
        totalLicenses: 600,
        riskLevel: 'Critical',
        complianceScore: 82,
        lastUsed: new Date(Date.now() - 1800000),
        renewalDate: new Date('2024-07-30'),
        contractType: 'Per User',
        tags: ['Documents', 'Signatures', 'Legal']
      },
      {
        id: 'app-008',
        name: 'Figma',
        vendor: 'Figma',
        category: 'Design',
        annualSpend: 38000,
        monthlySpend: 3167,
        activeUsers: 189,
        totalLicenses: 200,
        riskLevel: 'Low',
        complianceScore: 95,
        lastUsed: new Date(Date.now() - 3600000),
        renewalDate: new Date('2025-01-15'),
        contractType: 'Per User',
        tags: ['Design', 'Collaboration', 'Prototyping']
      },
      {
        id: 'app-009',
        name: 'Jira',
        vendor: 'Atlassian',
        category: 'Project Management',
        annualSpend: 67000,
        monthlySpend: 5583,
        activeUsers: 892,
        totalLicenses: 1000,
        riskLevel: 'Medium',
        complianceScore: 91,
        lastUsed: new Date(Date.now() - 900000),
        renewalDate: new Date('2024-12-01'),
        contractType: 'Per User',
        tags: ['Project Management', 'Development', 'Tracking']
      },
      {
        id: 'app-010',
        name: 'Notion',
        vendor: 'Notion Labs',
        category: 'Productivity',
        annualSpend: 29000,
        monthlySpend: 2417,
        activeUsers: 456,
        totalLicenses: 500,
        riskLevel: 'Low',
        complianceScore: 88,
        lastUsed: new Date(Date.now() - 1200000),
        renewalDate: new Date('2025-02-28'),
        contractType: 'Per User',
        tags: ['Notes', 'Documentation', 'Collaboration']
      }
    ];
  }

  /**
   * Get usage trend data over time
   */
  getUsageTrend(days: number = 30): DemoUsageData[] {
    const data: DemoUsageData[] = [];
    const baseSpend = 200000;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Generate realistic trending data
      const dayVariation = Math.sin((i / days) * Math.PI * 2) * 20000;
      const randomVariation = (Math.random() - 0.5) * 15000;
      
      data.push({
        date: date.toISOString().split('T')[0],
        totalSpend: Math.max(0, baseSpend + dayVariation + randomVariation),
        userCount: 4500 + Math.floor(Math.random() * 500),
        newApplications: Math.floor(Math.random() * 5),
        riskIncidents: Math.floor(Math.random() * 3)
      });
    }
    
    return data;
  }

  /**
   * Get spending by category
   */
  getSpendingByCategory() {
    return [
      { name: 'Productivity', value: 580000, color: '#3b82f6' },
      { name: 'Engineering', value: 340000, color: '#10b981' },
      { name: 'Communication', value: 280000, color: '#f59e0b' },
      { name: 'Design & Creative', value: 220000, color: '#ef4444' },
      { name: 'Project Management', value: 180000, color: '#8b5cf6' },
      { name: 'Security', value: 120000, color: '#ec4899' },
      { name: 'Other', value: 80000, color: '#6b7280' }
    ];
  }

  /**
   * Get risk level distribution
   */
  getRiskDistribution() {
    return [
      { name: 'Low Risk', value: 68, count: 42, color: '#10b981' },
      { name: 'Medium Risk', value: 24, count: 15, color: '#f59e0b' },
      { name: 'High Risk', value: 6, count: 4, color: '#ef4444' },
      { name: 'Critical Risk', value: 2, count: 1, color: '#dc2626' }
    ];
  }

  /**
   * Get recent alerts
   */
  getAlerts(): DemoAlert[] {
    return [
      {
        id: 'alert-001',
        type: 'critical',
        title: 'Unusual Spending Spike Detected',
        description: 'DocuSign spending increased by 234% this month due to unexpected license purchases',
        application: 'DocuSign',
        timestamp: new Date(Date.now() - 120000), // 2 minutes ago
        resolved: false
      },
      {
        id: 'alert-002',
        type: 'warning',
        title: 'License Compliance Issue',
        description: '12 AutoCAD licenses are being used without proper assignment',
        application: 'AutoCAD',
        timestamp: new Date(Date.now() - 900000), // 15 minutes ago
        resolved: false
      },
      {
        id: 'alert-003',
        type: 'info',
        title: 'New Application Discovered',
        description: '89 users have started using Figma - consider adding to official catalog',
        application: 'Figma',
        timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
        resolved: false
      },
      {
        id: 'alert-004',
        type: 'warning',
        title: 'Contract Renewal Due Soon',
        description: 'Salesforce contract expires in 30 days - review and prepare renewal',
        application: 'Salesforce',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        resolved: false
      },
      {
        id: 'alert-005',
        type: 'info',
        title: 'Cost Optimization Opportunity',
        description: 'Zoom has 153 unused licenses that could save $12,400 annually',
        application: 'Zoom',
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
        resolved: true
      }
    ];
  }

  /**
   * Get AI-powered insights
   */
  getAIInsights() {
    return [
      {
        id: 'insight-001',
        title: 'License Optimization Opportunity',
        description: 'Analysis shows 234 unused Microsoft 365 licenses across 5 departments. Reallocating these could save $28,080 annually.',
        impact: 'high' as const,
        savings: 28080,
        action: 'Review license assignments and reallocate unused licenses',
        confidence: 94
      },
      {
        id: 'insight-002',
        title: 'Shadow IT Detection',
        description: 'Detected 12 new SaaS applications in use that are not in the approved catalog. Consider evaluation for security and compliance.',
        impact: 'medium' as const,
        action: 'Evaluate and approve or restrict these applications',
        confidence: 87
      },
      {
        id: 'insight-003',
        title: 'Consolidation Opportunity',
        description: 'Teams are using 4 different project management tools. Consolidating to 2 primary tools could reduce costs by 15%.',
        impact: 'medium' as const,
        savings: 45000,
        action: 'Conduct tool assessment and consolidation planning',
        confidence: 78
      },
      {
        id: 'insight-004',
        title: 'Compliance Risk',
        description: 'AutoCAD usage patterns suggest potential license sharing violations. Immediate review recommended.',
        impact: 'high' as const,
        action: 'Audit AutoCAD license usage and user assignments',
        confidence: 91
      }
    ];
  }

  /**
   * Get department breakdown
   */
  getDepartmentBreakdown() {
    return [
      { name: 'Engineering', spend: 680000, users: 1247, applications: 15 },
      { name: 'Sales & Marketing', spend: 520000, users: 892, applications: 12 },
      { name: 'Operations', spend: 340000, users: 567, applications: 8 },
      { name: 'HR', spend: 290000, users: 234, applications: 6 },
      { name: 'Finance', spend: 180000, users: 189, applications: 5 },
      { name: 'Legal', spend: 120000, users: 78, applications: 4 },
      { name: 'IT', spend: 270000, users: 156, applications: 18 }
    ];
  }

  /**
   * Get vendor risk assessment
   */
  getVendorRiskAssessment() {
    return [
      { vendor: 'Microsoft', riskScore: 2.1, applications: 8, totalSpend: 580000 },
      { vendor: 'Salesforce', riskScore: 3.4, applications: 3, totalSpend: 340000 },
      { vendor: 'Adobe', riskScore: 2.8, applications: 4, totalSpend: 220000 },
      { vendor: 'Atlassian', riskScore: 3.1, applications: 5, totalSpend: 180000 },
      { vendor: 'Zoom', riskScore: 4.2, applications: 2, totalSpend: 89000 },
      { vendor: 'DocuSign', riskScore: 6.8, applications: 1, totalSpend: 45000 },
      { vendor: 'Autodesk', riskScore: 5.5, applications: 3, totalSpend: 95000 }
    ];
  }

  /**
   * Simulate API delay for realistic demo experience
   */
  async getDataWithDelay<T>(data: T, delay: number = 500): Promise<T> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(data), delay);
    });
  }
}

export const demoDataService = new DemoDataService();