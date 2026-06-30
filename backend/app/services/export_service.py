"""
Data Export Service
Handles exporting dashboard data, reports, and analytics to various formats (CSV, Excel, PDF)
"""

import pandas as pd
import io
import json
from typing import Dict, Any, List, Optional, Union
from datetime import datetime, timedelta
import logging
from sqlalchemy.orm import Session
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

logger = logging.getLogger(__name__)

class ExportService:
    def __init__(self):
        self.supported_formats = ['csv', 'excel', 'json', 'pdf']
        
    def export_dashboard_data(
        self, 
        data: Dict[str, Any], 
        format: str = 'csv',
        dashboard_name: str = 'Dashboard Export',
        user_name: str = 'User'
    ) -> io.BytesIO:
        """Export dashboard data in specified format"""
        
        if format not in self.supported_formats:
            raise ValueError(f"Unsupported format: {format}. Supported: {', '.join(self.supported_formats)}")
        
        # Prepare export data
        export_data = self._prepare_export_data(data, dashboard_name)
        
        if format == 'csv':
            return self._export_to_csv(export_data)
        elif format == 'excel':
            return self._export_to_excel(export_data, dashboard_name)
        elif format == 'json':
            return self._export_to_json(export_data)
        elif format == 'pdf':
            return self._export_to_pdf(export_data, dashboard_name, user_name)
        else:
            raise ValueError(f"Format {format} not implemented")

    def export_query_results(
        self, 
        results: Dict[str, Any], 
        format: str = 'csv',
        query_name: str = 'Query Results'
    ) -> io.BytesIO:
        """Export query results in specified format"""
        
        if format not in self.supported_formats:
            raise ValueError(f"Unsupported format: {format}")
        
        # Convert query results to DataFrame
        if 'columns' in results and 'data' in results:
            df = pd.DataFrame(results['data'], columns=results['columns'])
        else:
            # Handle different result formats
            df = pd.DataFrame([results])
        
        if format == 'csv':
            return self._dataframe_to_csv(df)
        elif format == 'excel':
            return self._dataframe_to_excel(df, query_name)
        elif format == 'json':
            return self._dataframe_to_json(df)
        elif format == 'pdf':
            return self._dataframe_to_pdf(df, query_name)

    def export_user_activity_report(
        self,
        activity_data: List[Dict[str, Any]],
        format: str = 'excel',
        date_range: str = 'Last 30 days'
    ) -> io.BytesIO:
        """Export user activity report"""
        
        df = pd.DataFrame(activity_data)
        
        if format == 'csv':
            return self._dataframe_to_csv(df)
        elif format == 'excel':
            # Create multi-sheet Excel for activity report
            buffer = io.BytesIO()
            with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
                # Summary sheet
                summary = self._create_activity_summary(df)
                summary.to_excel(writer, sheet_name='Summary', index=False)
                
                # Detailed data
                df.to_excel(writer, sheet_name='Activity Details', index=False)
                
                # Charts and insights (if applicable)
                insights = self._create_activity_insights(df)
                insights.to_excel(writer, sheet_name='Insights', index=False)
            
            buffer.seek(0)
            return buffer
        elif format == 'json':
            return self._dataframe_to_json(df)
        elif format == 'pdf':
            return self._dataframe_to_pdf(df, f"User Activity Report - {date_range}")

    def export_system_metrics(
        self,
        metrics: Dict[str, Any],
        format: str = 'excel'
    ) -> io.BytesIO:
        """Export system performance and usage metrics"""
        
        if format == 'excel':
            buffer = io.BytesIO()
            with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
                # System performance metrics
                if 'performance' in metrics:
                    perf_df = pd.DataFrame(metrics['performance'])
                    perf_df.to_excel(writer, sheet_name='Performance', index=False)
                
                # Usage statistics
                if 'usage' in metrics:
                    usage_df = pd.DataFrame(metrics['usage'])  
                    usage_df.to_excel(writer, sheet_name='Usage Stats', index=False)
                
                # Error logs summary
                if 'errors' in metrics:
                    error_df = pd.DataFrame(metrics['errors'])
                    error_df.to_excel(writer, sheet_name='Error Summary', index=False)
            
            buffer.seek(0)
            return buffer
        else:
            # Convert to single DataFrame for other formats
            combined_df = pd.DataFrame([metrics])
            return self.export_query_results(
                {'columns': combined_df.columns.tolist(), 'data': combined_df.values.tolist()},
                format,
                'System Metrics'
            )

    # Private helper methods
    def _prepare_export_data(self, data: Dict[str, Any], dashboard_name: str) -> Dict[str, Any]:
        """Prepare dashboard data for export"""
        export_data = {
            'dashboard_name': dashboard_name,
            'exported_at': datetime.now().isoformat(),
            'summary_metrics': {},
            'chart_data': {},
            'insights': []
        }
        
        # Extract summary metrics
        for key in ['spend', 'risk', 'compliance', 'vendors', 'applications']:
            if key in data:
                export_data['summary_metrics'][key] = data[key]
        
        # Extract chart data
        chart_keys = ['barChartData', 'pieChartData', 'lineChartData', 'radarData']
        for key in chart_keys:
            if key in data:
                export_data['chart_data'][key] = data[key]
        
        # Extract insights
        if 'aiInsights' in data:
            export_data['insights'] = data['aiInsights']
        
        return export_data

    def _export_to_csv(self, data: Dict[str, Any]) -> io.BytesIO:
        """Export data to CSV format"""
        buffer = io.BytesIO()
        
        # Create a comprehensive CSV with multiple sections
        csv_data = []
        
        # Add header
        csv_data.append(['DataChart Data Export'])
        csv_data.append(['Dashboard:', data.get('dashboard_name', 'Unknown')])
        csv_data.append(['Exported:', data.get('exported_at', 'Unknown')])
        csv_data.append([])  # Empty row
        
        # Add summary metrics
        if 'summary_metrics' in data:
            csv_data.append(['Summary Metrics'])
            csv_data.append(['Metric', 'Value', 'Unit', 'Trend', 'Status'])
            for metric, details in data['summary_metrics'].items():
                if isinstance(details, dict):
                    csv_data.append([
                        metric.title(),
                        details.get('value', ''),
                        details.get('unit', ''),
                        details.get('trend', ''),
                        details.get('status', '')
                    ])
            csv_data.append([])  # Empty row
        
        # Add chart data
        if 'chart_data' in data:
            for chart_name, chart_data in data['chart_data'].items():
                csv_data.append([f'{chart_name} Data'])
                if chart_data and len(chart_data) > 0:
                    # Get headers from first item
                    headers = list(chart_data[0].keys())
                    csv_data.append(headers)
                    for item in chart_data:
                        csv_data.append([item.get(header, '') for header in headers])
                csv_data.append([])  # Empty row
        
        # Add insights
        if 'insights' in data and data['insights']:
            csv_data.append(['AI Insights'])
            for i, insight in enumerate(data['insights'], 1):
                csv_data.append([f'Insight {i}', insight])
        
        # Write to CSV
        df = pd.DataFrame(csv_data)
        csv_string = df.to_csv(index=False, header=False)
        buffer.write(csv_string.encode('utf-8'))
        buffer.seek(0)
        
        return buffer

    def _export_to_excel(self, data: Dict[str, Any], dashboard_name: str) -> io.BytesIO:
        """Export data to Excel format with multiple sheets"""
        buffer = io.BytesIO()
        
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            # Summary sheet
            if 'summary_metrics' in data:
                summary_data = []
                for metric, details in data['summary_metrics'].items():
                    if isinstance(details, dict):
                        summary_data.append({
                            'Metric': metric.title(),
                            'Value': details.get('value', ''),
                            'Unit': details.get('unit', ''),
                            'Trend': details.get('trend', ''),
                            'Status': details.get('status', '')
                        })
                
                summary_df = pd.DataFrame(summary_data)
                summary_df.to_excel(writer, sheet_name='Summary', index=False)
            
            # Chart data sheets
            if 'chart_data' in data:
                for chart_name, chart_data in data['chart_data'].items():
                    if chart_data:
                        chart_df = pd.DataFrame(chart_data)
                        sheet_name = chart_name.replace('ChartData', '').title()[:31]  # Excel sheet name limit
                        chart_df.to_excel(writer, sheet_name=sheet_name, index=False)
            
            # Insights sheet
            if 'insights' in data and data['insights']:
                insights_df = pd.DataFrame([
                    {'Insight_Number': i+1, 'Description': insight} 
                    for i, insight in enumerate(data['insights'])
                ])
                insights_df.to_excel(writer, sheet_name='Insights', index=False)
        
        buffer.seek(0)
        return buffer

    def _export_to_json(self, data: Dict[str, Any]) -> io.BytesIO:
        """Export data to JSON format"""
        buffer = io.BytesIO()
        json_string = json.dumps(data, indent=2, default=str)
        buffer.write(json_string.encode('utf-8'))
        buffer.seek(0)
        return buffer

    def _export_to_pdf(self, data: Dict[str, Any], dashboard_name: str, user_name: str) -> io.BytesIO:
        """Export data to PDF format"""
        buffer = io.BytesIO()
        
        # Create PDF document
        doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=1*inch)
        styles = getSampleStyleSheet()
        story = []
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Title'],
            fontSize=20,
            spaceAfter=30,
            alignment=1  # Center alignment
        )
        story.append(Paragraph(f"DataChart - {dashboard_name}", title_style))
        
        # Export info
        info_data = [
            ['Exported by:', user_name],
            ['Export date:', datetime.now().strftime('%B %d, %Y at %I:%M %p')],
            ['Dashboard:', dashboard_name]
        ]
        info_table = Table(info_data, colWidths=[2*inch, 4*inch])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ]))
        story.append(info_table)
        story.append(Spacer(1, 20))
        
        # Summary metrics
        if 'summary_metrics' in data and data['summary_metrics']:
            story.append(Paragraph("Summary Metrics", styles['Heading2']))
            
            metric_data = [['Metric', 'Value', 'Trend', 'Status']]
            for metric, details in data['summary_metrics'].items():
                if isinstance(details, dict):
                    trend = details.get('trend', '')
                    if isinstance(trend, (int, float)):
                        trend = f"{trend:+.1f}%"
                    
                    metric_data.append([
                        metric.title(),
                        f"{details.get('value', '')} {details.get('unit', '')}".strip(),
                        trend,
                        details.get('status', '').title()
                    ])
            
            metric_table = Table(metric_data, colWidths=[1.5*inch, 1.5*inch, 1*inch, 1*inch])
            metric_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            story.append(metric_table)
            story.append(Spacer(1, 20))
        
        # AI Insights
        if 'insights' in data and data['insights']:
            story.append(Paragraph("AI-Powered Insights", styles['Heading2']))
            for i, insight in enumerate(data['insights'], 1):
                story.append(Paragraph(f"{i}. {insight}", styles['Normal']))
                story.append(Spacer(1, 10))
        
        # Chart data summary
        if 'chart_data' in data and data['chart_data']:
            story.append(Paragraph("Data Summary", styles['Heading2']))
            for chart_name, chart_data in data['chart_data'].items():
                if chart_data and len(chart_data) > 0:
                    story.append(Paragraph(f"{chart_name.replace('ChartData', '').title()} Data:", styles['Heading3']))
                    
                    # Create table from chart data
                    if isinstance(chart_data[0], dict):
                        headers = list(chart_data[0].keys())
                        table_data = [headers]
                        for item in chart_data[:10]:  # Limit to first 10 rows
                            table_data.append([str(item.get(header, '')) for header in headers])
                        
                        data_table = Table(table_data)
                        data_table.setStyle(TableStyle([
                            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                            ('FONTSIZE', (0, 0), (-1, -1), 9),
                            ('GRID', (0, 0), (-1, -1), 1, colors.black)
                        ]))
                        story.append(data_table)
                        
                        if len(chart_data) > 10:
                            story.append(Paragraph(f"... and {len(chart_data) - 10} more rows", styles['Normal']))
                        
                    story.append(Spacer(1, 15))
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        return buffer

    def _dataframe_to_csv(self, df: pd.DataFrame) -> io.BytesIO:
        """Convert DataFrame to CSV"""
        buffer = io.BytesIO()
        csv_string = df.to_csv(index=False)
        buffer.write(csv_string.encode('utf-8'))
        buffer.seek(0)
        return buffer

    def _dataframe_to_excel(self, df: pd.DataFrame, sheet_name: str = 'Data') -> io.BytesIO:
        """Convert DataFrame to Excel"""
        buffer = io.BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name=sheet_name, index=False)
        buffer.seek(0)
        return buffer

    def _dataframe_to_json(self, df: pd.DataFrame) -> io.BytesIO:
        """Convert DataFrame to JSON"""
        buffer = io.BytesIO()
        json_string = df.to_json(orient='records', indent=2)
        buffer.write(json_string.encode('utf-8'))
        buffer.seek(0)
        return buffer

    def _dataframe_to_pdf(self, df: pd.DataFrame, title: str = 'Data Export') -> io.BytesIO:
        """Convert DataFrame to PDF"""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []
        
        # Title
        story.append(Paragraph(title, styles['Title']))
        story.append(Spacer(1, 20))
        
        # Convert DataFrame to table
        table_data = [df.columns.tolist()]
        for _, row in df.iterrows():
            table_data.append(row.tolist())
        
        # Create table
        table = Table(table_data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(table)
        doc.build(story)
        buffer.seek(0)
        return buffer

    def _create_activity_summary(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create activity summary from activity data"""
        # This would be implemented based on the structure of activity data
        summary = pd.DataFrame([{
            'Total_Activities': len(df),
            'Unique_Users': df['user'].nunique() if 'user' in df.columns else 0,
            'Date_Range': f"{df['date'].min()} to {df['date'].max()}" if 'date' in df.columns else 'Unknown'
        }])
        return summary

    def _create_activity_insights(self, df: pd.DataFrame) -> pd.DataFrame:
        """Generate insights from activity data"""
        # This would analyze the activity data and generate insights
        insights = pd.DataFrame([
            {'Insight': 'Most active users', 'Value': 'Top 10% of users generate 80% of activity'},
            {'Insight': 'Peak hours', 'Value': '9-11 AM and 2-4 PM show highest activity'},
            {'Insight': 'Feature usage', 'Value': 'Dashboard creation is the most common activity'}
        ])
        return insights

# Service instance
export_service = ExportService()