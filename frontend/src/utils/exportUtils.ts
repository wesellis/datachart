import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface ExportData {
  totalApplications: number;
  activeApplications: number;
  totalSpend2024: number;
  totalSpend2025: number;
  savingsAmount: number;
  savingsPercentage: number;
  costPerEmployee: number;
  patchComplianceRate: number;
  renewalsNext30Days: number;
  averageUtilization: number;
  vendorTotals: any;
  applications: any[];
  monthlyTrend: any[];
}

// Export Dashboard to PDF
export const exportToPDF = async (data: ExportData, dashboardType: string) => {
  try {
    // Create new PDF document
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Add header
    pdf.setFontSize(20);
    pdf.setTextColor(30, 41, 59);
    pdf.text('Application Portfolio Management Report', pageWidth / 2, 20, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`${dashboardType} Dashboard`, pageWidth / 2, 28, { align: 'center' });
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 35, { align: 'center' });
    
    // Add summary section
    let yPosition = 50;
    pdf.setFontSize(14);
    pdf.setTextColor(30, 41, 59);
    pdf.text('Executive Summary', 20, yPosition);
    
    yPosition += 10;
    pdf.setFontSize(10);
    pdf.setTextColor(100, 116, 139);
    
    const summaryData = [
      `Total Applications: ${data.totalApplications} (${data.activeApplications} active)`,
      `2024 Spending: $${(data.totalSpend2024 / 1000000).toFixed(2)}M`,
      `2025 Spending: $${(data.totalSpend2025 / 1000000).toFixed(2)}M`,
      `YoY Savings: $${(data.savingsAmount / 1000000).toFixed(2)}M (${data.savingsPercentage.toFixed(1)}%)`,
      `Cost per Employee: $${(data.costPerEmployee).toFixed(0)}`,
      `Patch Compliance: ${data.patchComplianceRate.toFixed(1)}%`,
      `License Utilization: ${data.averageUtilization.toFixed(1)}%`,
      `Upcoming Renewals (30 days): ${data.renewalsNext30Days}`
    ];
    
    summaryData.forEach(line => {
      pdf.text(line, 20, yPosition);
      yPosition += 7;
    });
    
    // Add top vendors section
    yPosition += 10;
    pdf.setFontSize(14);
    pdf.setTextColor(30, 41, 59);
    pdf.text('Top Vendors by Spend', 20, yPosition);
    
    yPosition += 10;
    pdf.setFontSize(10);
    pdf.setTextColor(100, 116, 139);
    
    const topVendors = Object.entries(data.vendorTotals || {})
      .sort((a: any, b: any) => b[1].total_2025 - a[1].total_2025)
      .slice(0, 5);
    
    topVendors.forEach(([vendor, details]: any) => {
      pdf.text(`${vendor}: $${(details.total_2025 / 1000000).toFixed(2)}M`, 20, yPosition);
      yPosition += 7;
    });
    
    // Add top applications section
    if (yPosition > pageHeight - 80) {
      pdf.addPage();
      yPosition = 20;
    }
    
    yPosition += 10;
    pdf.setFontSize(14);
    pdf.setTextColor(30, 41, 59);
    pdf.text('Top Applications by Spend', 20, yPosition);
    
    yPosition += 10;
    pdf.setFontSize(10);
    pdf.setTextColor(100, 116, 139);
    
    data.applications.slice(0, 10).forEach(app => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.text(`${app.name}: $${(app.cost_2025 / 1000).toFixed(0)}K (${app.utilization}% utilized)`, 20, yPosition);
      yPosition += 7;
    });
    
    // Try to capture dashboard screenshot if element exists
    const dashboardElement = document.querySelector('.dashboard-content');
    if (dashboardElement) {
      try {
        const canvas = await html2canvas(dashboardElement as HTMLElement, {
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true
        });
        
        const imgData = canvas.toDataURL('image/png');
        
        // Add new page for screenshot
        pdf.addPage();
        pdf.setFontSize(14);
        pdf.setTextColor(30, 41, 59);
        pdf.text('Dashboard Screenshot', pageWidth / 2, 20, { align: 'center' });
        
        // Calculate image dimensions to fit page
        const imgWidth = pageWidth - 40;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 20, 30, imgWidth, Math.min(imgHeight, pageHeight - 50));
      } catch (error) {
        console.warn('Could not capture dashboard screenshot:', error);
      }
    }
    
    // Save the PDF
    pdf.save(`APM-Report-${dashboardType}-${new Date().toISOString().split('T')[0]}.pdf`);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

// Export Dashboard to Excel
export const exportToExcel = (data: ExportData, dashboardType: string) => {
  try {
    const wb = XLSX.utils.book_new();
    
    // Summary Sheet
    const summaryData = [
      ['Application Portfolio Management Report'],
      [`${dashboardType} Dashboard`],
      [`Generated: ${new Date().toLocaleDateString()}`],
      [],
      ['Metric', 'Value'],
      ['Total Applications', data.totalApplications],
      ['Active Applications', data.activeApplications],
      ['2024 Spending', data.totalSpend2024],
      ['2025 Spending', data.totalSpend2025],
      ['YoY Savings Amount', data.savingsAmount],
      ['YoY Savings Percentage', `${data.savingsPercentage}%`],
      ['Cost per Employee', data.costPerEmployee],
      ['Patch Compliance Rate', `${data.patchComplianceRate}%`],
      ['License Utilization', `${data.averageUtilization}%`],
      ['30-Day Renewals', data.renewalsNext30Days]
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Set column widths
    summarySheet['!cols'] = [
      { wch: 30 },
      { wch: 20 }
    ];
    
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
    
    // Applications Sheet
    const appsData = [
      ['Application Name', 'Vendor', 'Department', 'Owner', '2024 Cost', '2025 Cost', 'Savings', 'Utilization %', 'Compliance', 'Risk Level']
    ];
    
    data.applications.forEach(app => {
      appsData.push([
        app.name,
        app.vendor,
        app.department,
        app.owner,
        app.cost_2024,
        app.cost_2025,
        app.savings || 0,
        app.utilization,
        app.compliance,
        app.risk_level
      ]);
    });
    
    const appsSheet = XLSX.utils.aoa_to_sheet(appsData);
    appsSheet['!cols'] = [
      { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 20 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
      { wch: 12 }, { wch: 12 }
    ];
    
    XLSX.utils.book_append_sheet(wb, appsSheet, 'Applications');
    
    // Vendors Sheet
    const vendorData = [
      ['Vendor', 'Total 2024 Spend', 'Total 2025 Spend', 'Number of Apps', 'Primary Department']
    ];
    
    Object.entries(data.vendorTotals || {}).forEach(([vendor, details]: any) => {
      vendorData.push([
        vendor,
        details.total_2024 || 0,
        details.total_2025 || 0,
        details.app_count || 0,
        details.primary_department || 'Multiple'
      ]);
    });
    
    const vendorSheet = XLSX.utils.aoa_to_sheet(vendorData);
    vendorSheet['!cols'] = [
      { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }
    ];
    
    XLSX.utils.book_append_sheet(wb, vendorSheet, 'Vendors');
    
    // Monthly Trend Sheet
    if (data.monthlyTrend && data.monthlyTrend.length > 0) {
      const trendData = [
        ['Month', '2024 Spending', '2025 Spending', 'Difference', 'Change %']
      ];
      
      data.monthlyTrend.forEach(month => {
        const diff = month.spend_2025 - month.spend_2024;
        const changePercent = month.spend_2024 > 0 ? ((diff / month.spend_2024) * 100).toFixed(1) : '0';
        
        trendData.push([
          month.month,
          month.spend_2024,
          month.spend_2025,
          diff,
          `${changePercent}%`
        ]);
      });
      
      const trendSheet = XLSX.utils.aoa_to_sheet(trendData);
      trendSheet['!cols'] = [
        { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }
      ];
      
      XLSX.utils.book_append_sheet(wb, trendSheet, 'Monthly Trend');
    }
    
    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    saveAs(blob, `APM-Data-${dashboardType}-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    return true;
  } catch (error) {
    console.error('Error generating Excel:', error);
    throw error;
  }
};

// Schedule Report (opens modal/dialog)
export const scheduleReport = (data: ExportData, dashboardType: string): ScheduleConfig => {
  // Return schedule configuration
  // This would typically open a modal for the user to configure
  return {
    frequency: 'weekly',
    day: 'monday',
    time: '09:00',
    recipients: [],
    format: 'pdf',
    dashboardType: dashboardType,
    includeCharts: true,
    includeSummary: true
  };
};

interface ScheduleConfig {
  frequency: 'daily' | 'weekly' | 'monthly';
  day?: string;
  time: string;
  recipients: string[];
  format: 'pdf' | 'excel' | 'both';
  dashboardType: string;
  includeCharts: boolean;
  includeSummary: boolean;
}

// Helper function to format currency
const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
};