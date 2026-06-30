"""
Data Export API Routes
Handles exporting dashboard data, reports, and analytics in various formats
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
import io

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User

# Create a temporary admin check function
async def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Verify current user has admin privileges"""
    if not current_user.is_superuser and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user
from app.services.export_service import export_service
from app.core.errors import NotFoundError, ValidationError

router = APIRouter()

class ExportRequest(BaseModel):
    format: str = 'csv'  # csv, excel, json, pdf
    include_metadata: bool = True
    date_range: Optional[str] = None

class DashboardExportRequest(ExportRequest):
    dashboard_id: Optional[str] = None
    dashboard_name: Optional[str] = 'Dashboard Export'

class QueryExportRequest(ExportRequest):
    query_name: Optional[str] = 'Query Results'

@router.post("/dashboard")
async def export_dashboard_data(
    request: DashboardExportRequest,
    current_user: User = Depends(get_current_user)
):
    """Export dashboard data in specified format"""
    
    try:
        # Get dashboard data (this would typically fetch from database or API)
        # For now, we'll use mock data similar to what's in the main.py endpoint
        dashboard_data = {
            "spend": {"value": 18.5, "unit": "M", "trend": 3.2, "status": "up"},
            "risk": {"value": 42, "unit": "/100", "trend": -2.1, "status": "down", "level": "Medium"},
            "compliance": {"value": 87.4, "unit": "%", "trend": 0.8, "status": "up"},
            "vendors": {"value": 89, "unit": "", "trend": -5.3, "status": "down"},
            "applications": {"value": 235, "unit": "", "trend": 8.1, "status": "up"},
            
            "barChartData": [
                {"name": "SAP", "value": 2400},
                {"name": "Oracle", "value": 1800},
                {"name": "Microsoft", "value": 1600},
                {"name": "Salesforce", "value": 1200},
                {"name": "Adobe", "value": 900}
            ],
            
            "pieChartData": [
                {"name": "Infrastructure", "value": 35},
                {"name": "Security", "value": 25},
                {"name": "Productivity", "value": 20},
                {"name": "Development", "value": 15},
                {"name": "Analytics", "value": 5}
            ],
            
            "lineChartData": [
                {"month": "Jan", "value": 1.5}, {"month": "Feb", "value": 1.8},
                {"month": "Mar", "value": 1.6}, {"month": "Apr", "value": 1.9},
                {"month": "May", "value": 1.7}, {"month": "Jun", "value": 2.0}
            ],
            
            "aiInsights": [
                "Cost optimization opportunity detected in Oracle licensing",
                "Security score improved by 12% this month",
                "3 applications require immediate attention"
            ]
        }
        
        # Export data
        export_buffer = export_service.export_dashboard_data(
            dashboard_data,
            request.format,
            request.dashboard_name,
            current_user.display_name
        )
        
        # Determine content type and filename
        content_type, file_extension = _get_content_type_and_extension(request.format)
        filename = f"dashboard_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{file_extension}"
        
        return StreamingResponse(
            io.BytesIO(export_buffer.read()),
            media_type=content_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Export failed: {str(e)}"
        )

@router.post("/query")
async def export_query_results(
    request: QueryExportRequest,
    query_results: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Export query results in specified format"""
    
    try:
        export_buffer = export_service.export_query_results(
            query_results,
            request.format,
            request.query_name
        )
        
        content_type, file_extension = _get_content_type_and_extension(request.format)
        filename = f"query_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{file_extension}"
        
        return StreamingResponse(
            io.BytesIO(export_buffer.read()),
            media_type=content_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Query export failed: {str(e)}"
        )

@router.get("/dashboard/{dashboard_id}")
async def export_specific_dashboard(
    dashboard_id: str,
    format: str = Query('csv', description="Export format (csv, excel, json, pdf)"),
    current_user: User = Depends(get_current_user)
):
    """Export specific dashboard by ID"""
    
    # TODO: Implement dashboard lookup by ID
    # For now, use the same mock data
    return await export_dashboard_data(
        DashboardExportRequest(format=format, dashboard_name=f"Dashboard {dashboard_id}"),
        current_user
    )

@router.post("/user-activity")
async def export_user_activity_report(
    request: ExportRequest,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Export user activity report (admin only)"""
    
    try:
        # Generate mock activity data (would fetch from database in production)
        activity_data = [
            {
                "user": "john.doe@company.com",
                "action": "Created Dashboard",
                "resource": "Sales Dashboard",
                "timestamp": datetime.now().isoformat(),
                "ip_address": "192.168.1.100"
            },
            {
                "user": "jane.smith@company.com", 
                "action": "Exported Data",
                "resource": "Query Results",
                "timestamp": datetime.now().isoformat(),
                "ip_address": "192.168.1.101"
            },
            {
                "user": "admin@company.com",
                "action": "User Created",
                "resource": "new.user@company.com",
                "timestamp": datetime.now().isoformat(),
                "ip_address": "192.168.1.1"
            }
        ]
        
        export_buffer = export_service.export_user_activity_report(
            activity_data,
            request.format,
            request.date_range or "Last 30 days"
        )
        
        content_type, file_extension = _get_content_type_and_extension(request.format)
        filename = f"user_activity_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{file_extension}"
        
        return StreamingResponse(
            io.BytesIO(export_buffer.read()),
            media_type=content_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Activity report export failed: {str(e)}"
        )

@router.post("/system-metrics")
async def export_system_metrics(
    request: ExportRequest,
    current_user: User = Depends(get_current_admin_user)
):
    """Export system performance metrics (admin only)"""
    
    try:
        # Generate mock system metrics (would fetch from monitoring system in production)
        system_metrics = {
            "performance": [
                {"metric": "CPU Usage", "value": 65.2, "unit": "%", "status": "normal"},
                {"metric": "Memory Usage", "value": 78.5, "unit": "%", "status": "normal"},
                {"metric": "Disk Usage", "value": 45.3, "unit": "%", "status": "good"},
                {"metric": "Response Time", "value": 234, "unit": "ms", "status": "good"}
            ],
            "usage": [
                {"metric": "Active Users", "value": 156, "unit": "users", "period": "last_24h"},
                {"metric": "API Calls", "value": 12453, "unit": "requests", "period": "last_24h"},
                {"metric": "Data Processed", "value": 2.3, "unit": "GB", "period": "last_24h"},
                {"metric": "Dashboards Created", "value": 23, "unit": "dashboards", "period": "last_24h"}
            ],
            "errors": [
                {"error_type": "Rate Limit Exceeded", "count": 45, "severity": "warning"},
                {"error_type": "Database Connection", "count": 3, "severity": "error"},
                {"error_type": "Authentication Failed", "count": 12, "severity": "warning"}
            ]
        }
        
        export_buffer = export_service.export_system_metrics(
            system_metrics,
            request.format
        )
        
        content_type, file_extension = _get_content_type_and_extension(request.format)
        filename = f"system_metrics_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{file_extension}"
        
        return StreamingResponse(
            io.BytesIO(export_buffer.read()),
            media_type=content_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"System metrics export failed: {str(e)}"
        )

@router.get("/formats")
async def get_supported_formats():
    """Get list of supported export formats"""
    return {
        "formats": [
            {
                "format": "csv",
                "name": "CSV (Comma Separated Values)",
                "description": "Standard CSV format, compatible with Excel and other tools",
                "mime_type": "text/csv"
            },
            {
                "format": "excel", 
                "name": "Excel Workbook",
                "description": "Microsoft Excel format with multiple sheets",
                "mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            },
            {
                "format": "json",
                "name": "JSON",
                "description": "JavaScript Object Notation for APIs and web applications",
                "mime_type": "application/json"
            },
            {
                "format": "pdf",
                "name": "PDF Document", 
                "description": "Formatted PDF report with charts and insights",
                "mime_type": "application/pdf"
            }
        ]
    }

# Sample export endpoint for testing
@router.get("/sample")
async def export_sample_data(
    format: str = Query('csv', description="Export format"),
    current_user: User = Depends(get_current_user)
):
    """Export sample data for testing"""
    
    sample_data = {
        "columns": ["Name", "Value", "Category", "Date"],
        "data": [
            ["Sample Item 1", 100, "Category A", "2024-01-01"],
            ["Sample Item 2", 200, "Category B", "2024-01-02"],
            ["Sample Item 3", 150, "Category A", "2024-01-03"],
            ["Sample Item 4", 300, "Category C", "2024-01-04"],
            ["Sample Item 5", 250, "Category B", "2024-01-05"]
        ]
    }
    
    try:
        export_buffer = export_service.export_query_results(
            sample_data,
            format,
            "Sample Data Export"
        )
        
        content_type, file_extension = _get_content_type_and_extension(format)
        filename = f"sample_data.{file_extension}"
        
        return StreamingResponse(
            io.BytesIO(export_buffer.read()),
            media_type=content_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Sample export failed: {str(e)}"
        )

# Helper functions
def _get_content_type_and_extension(format: str) -> tuple[str, str]:
    """Get MIME type and file extension for export format"""
    format_mapping = {
        'csv': ('text/csv', 'csv'),
        'excel': ('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'xlsx'),
        'json': ('application/json', 'json'),
        'pdf': ('application/pdf', 'pdf')
    }
    
    return format_mapping.get(format, ('text/plain', 'txt'))