"""
Export/Import Service for dashboards, data, and configurations
"""

from typing import Dict, List, Optional, Any, BinaryIO
from datetime import datetime
import json
import csv
import io
import zipfile
import base64
import pandas as pd
import xlsxwriter
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
import yaml
import xml.etree.ElementTree as ET
from pathlib import Path
import tempfile
import shutil

class ExportImportService:
    """Service for exporting and importing dashboards and data"""
    
    SUPPORTED_FORMATS = {
        'dashboard': ['json', 'yaml', 'xml', 'zip'],
        'data': ['csv', 'json', 'xlsx', 'pdf', 'xml', 'parquet'],
        'report': ['pdf', 'html', 'docx', 'pptx'],
        'backup': ['zip', 'tar.gz']
    }
    
    def __init__(self):
        self.temp_dir = tempfile.mkdtemp()
        
    async def export_dashboard(
        self,
        dashboard_id: str,
        format: str = 'json',
        include_data: bool = False,
        include_config: bool = True,
        include_widgets: bool = True
    ) -> Dict[str, Any]:
        """
        Export a dashboard in various formats
        
        Args:
            dashboard_id: ID of the dashboard to export
            format: Export format (json, yaml, xml, zip)
            include_data: Include dashboard data
            include_config: Include configuration
            include_widgets: Include widget definitions
        """
        # Mock dashboard data
        dashboard = {
            "id": dashboard_id,
            "name": "Sales Analytics Dashboard",
            "description": "Comprehensive sales performance dashboard",
            "created_at": datetime.utcnow().isoformat(),
            "version": "2.0.0",
            "author": "DataChart Team",
            "tags": ["sales", "analytics", "performance"]
        }
        
        if include_config:
            dashboard["config"] = {
                "theme": "dark",
                "refresh_interval": 300,
                "layout": "grid",
                "permissions": ["view", "edit", "share"]
            }
            
        if include_widgets:
            dashboard["widgets"] = [
                {
                    "id": "w1",
                    "type": "bar-chart",
                    "title": "Monthly Sales",
                    "position": {"x": 0, "y": 0, "width": 6, "height": 4},
                    "config": {"dataSource": "sales_db", "query": "SELECT * FROM sales"}
                },
                {
                    "id": "w2",
                    "type": "kpi-card",
                    "title": "Total Revenue",
                    "position": {"x": 6, "y": 0, "width": 3, "height": 2},
                    "config": {"metric": "revenue", "format": "currency"}
                }
            ]
            
        if include_data:
            dashboard["data"] = {
                "last_updated": datetime.utcnow().isoformat(),
                "metrics": {
                    "total_sales": 1543234,
                    "growth_rate": 12.5,
                    "customer_count": 8923
                }
            }
            
        # Export based on format
        if format == 'json':
            return await self.export_as_json(dashboard)
        elif format == 'yaml':
            return await self.export_as_yaml(dashboard)
        elif format == 'xml':
            return await self.export_as_xml(dashboard)
        elif format == 'zip':
            return await self.export_as_zip(dashboard)
        else:
            raise ValueError(f"Unsupported format: {format}")
            
    async def export_as_json(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Export data as JSON"""
        json_str = json.dumps(data, indent=2)
        
        return {
            "format": "json",
            "content": json_str,
            "mime_type": "application/json",
            "file_extension": ".json",
            "size": len(json_str)
        }
        
    async def export_as_yaml(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Export data as YAML"""
        yaml_str = yaml.dump(data, default_flow_style=False)
        
        return {
            "format": "yaml",
            "content": yaml_str,
            "mime_type": "application/x-yaml",
            "file_extension": ".yaml",
            "size": len(yaml_str)
        }
        
    async def export_as_xml(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Export data as XML"""
        root = ET.Element("dashboard")
        
        def dict_to_xml(parent, data):
            if isinstance(data, dict):
                for key, value in data.items():
                    child = ET.SubElement(parent, key)
                    dict_to_xml(child, value)
            elif isinstance(data, list):
                for item in data:
                    item_elem = ET.SubElement(parent, "item")
                    dict_to_xml(item_elem, item)
            else:
                parent.text = str(data)
                
        dict_to_xml(root, data)
        xml_str = ET.tostring(root, encoding='unicode')
        
        return {
            "format": "xml",
            "content": xml_str,
            "mime_type": "application/xml",
            "file_extension": ".xml",
            "size": len(xml_str)
        }
        
    async def export_as_zip(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Export data as ZIP archive"""
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            # Add main dashboard file
            zip_file.writestr("dashboard.json", json.dumps(data, indent=2))
            
            # Add configuration
            if "config" in data:
                zip_file.writestr("config.json", json.dumps(data["config"], indent=2))
                
            # Add widgets
            if "widgets" in data:
                for widget in data["widgets"]:
                    zip_file.writestr(
                        f"widgets/{widget['id']}.json",
                        json.dumps(widget, indent=2)
                    )
                    
            # Add metadata
            metadata = {
                "exported_at": datetime.utcnow().isoformat(),
                "version": "1.0.0",
                "format": "DataChart Dashboard Export"
            }
            zip_file.writestr("metadata.json", json.dumps(metadata, indent=2))
            
        zip_buffer.seek(0)
        zip_content = zip_buffer.getvalue()
        
        return {
            "format": "zip",
            "content": base64.b64encode(zip_content).decode('utf-8'),
            "mime_type": "application/zip",
            "file_extension": ".zip",
            "size": len(zip_content),
            "encoding": "base64"
        }
        
    async def export_data(
        self,
        data: List[Dict[str, Any]],
        format: str = 'csv',
        columns: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Export data in various formats
        
        Args:
            data: Data to export
            format: Export format (csv, json, xlsx, pdf, xml)
            columns: Specific columns to export
        """
        df = pd.DataFrame(data)
        
        if columns:
            df = df[columns]
            
        if format == 'csv':
            return await self.export_data_as_csv(df)
        elif format == 'json':
            return await self.export_data_as_json(df)
        elif format == 'xlsx':
            return await self.export_data_as_xlsx(df)
        elif format == 'pdf':
            return await self.export_data_as_pdf(df)
        elif format == 'xml':
            return await self.export_data_as_xml(df)
        elif format == 'parquet':
            return await self.export_data_as_parquet(df)
        else:
            raise ValueError(f"Unsupported data format: {format}")
            
    async def export_data_as_csv(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Export DataFrame as CSV"""
        csv_buffer = io.StringIO()
        df.to_csv(csv_buffer, index=False)
        csv_content = csv_buffer.getvalue()
        
        return {
            "format": "csv",
            "content": csv_content,
            "mime_type": "text/csv",
            "file_extension": ".csv",
            "size": len(csv_content)
        }
        
    async def export_data_as_json(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Export DataFrame as JSON"""
        json_str = df.to_json(orient='records', indent=2)
        
        return {
            "format": "json",
            "content": json_str,
            "mime_type": "application/json",
            "file_extension": ".json",
            "size": len(json_str)
        }
        
    async def export_data_as_xlsx(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Export DataFrame as Excel"""
        excel_buffer = io.BytesIO()
        
        with pd.ExcelWriter(excel_buffer, engine='xlsxwriter') as writer:
            df.to_excel(writer, sheet_name='Data', index=False)
            
            # Get workbook and worksheet
            workbook = writer.book
            worksheet = writer.sheets['Data']
            
            # Add formatting
            header_format = workbook.add_format({
                'bold': True,
                'bg_color': '#4472C4',
                'font_color': 'white',
                'border': 1
            })
            
            # Apply header format
            for col_num, value in enumerate(df.columns.values):
                worksheet.write(0, col_num, value, header_format)
                
            # Auto-fit columns
            for i, col in enumerate(df.columns):
                column_width = max(df[col].astype(str).map(len).max(), len(col)) + 2
                worksheet.set_column(i, i, column_width)
                
        excel_buffer.seek(0)
        excel_content = excel_buffer.getvalue()
        
        return {
            "format": "xlsx",
            "content": base64.b64encode(excel_content).decode('utf-8'),
            "mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "file_extension": ".xlsx",
            "size": len(excel_content),
            "encoding": "base64"
        }
        
    async def export_data_as_pdf(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Export DataFrame as PDF"""
        pdf_buffer = io.BytesIO()
        
        # Create PDF document
        doc = SimpleDocTemplate(pdf_buffer, pagesize=letter)
        elements = []
        
        # Add title
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#2563eb'),
            spaceAfter=30
        )
        elements.append(Paragraph("Data Export Report", title_style))
        elements.append(Spacer(1, 20))
        
        # Add metadata
        metadata_text = f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}<br/>Records: {len(df)}"
        elements.append(Paragraph(metadata_text, styles['Normal']))
        elements.append(Spacer(1, 20))
        
        # Convert DataFrame to table
        table_data = [df.columns.tolist()] + df.values.tolist()
        
        # Create table
        table = Table(table_data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4472C4')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        elements.append(table)
        
        # Build PDF
        doc.build(elements)
        
        pdf_buffer.seek(0)
        pdf_content = pdf_buffer.getvalue()
        
        return {
            "format": "pdf",
            "content": base64.b64encode(pdf_content).decode('utf-8'),
            "mime_type": "application/pdf",
            "file_extension": ".pdf",
            "size": len(pdf_content),
            "encoding": "base64"
        }
        
    async def export_data_as_xml(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Export DataFrame as XML"""
        root = ET.Element("data")
        
        for _, row in df.iterrows():
            record = ET.SubElement(root, "record")
            for col, value in row.items():
                field = ET.SubElement(record, col.replace(" ", "_"))
                field.text = str(value)
                
        xml_str = ET.tostring(root, encoding='unicode')
        
        return {
            "format": "xml",
            "content": xml_str,
            "mime_type": "application/xml",
            "file_extension": ".xml",
            "size": len(xml_str)
        }
        
    async def export_data_as_parquet(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Export DataFrame as Parquet"""
        parquet_buffer = io.BytesIO()
        df.to_parquet(parquet_buffer, index=False)
        parquet_buffer.seek(0)
        parquet_content = parquet_buffer.getvalue()
        
        return {
            "format": "parquet",
            "content": base64.b64encode(parquet_content).decode('utf-8'),
            "mime_type": "application/octet-stream",
            "file_extension": ".parquet",
            "size": len(parquet_content),
            "encoding": "base64"
        }
        
    async def import_dashboard(
        self,
        file_content: str,
        format: str,
        user_id: str,
        organization_id: str,
        validate: bool = True
    ) -> Dict[str, Any]:
        """
        Import a dashboard from various formats
        
        Args:
            file_content: Content of the file to import
            format: Format of the file (json, yaml, xml, zip)
            user_id: ID of the importing user
            organization_id: Target organization ID
            validate: Whether to validate the import
        """
        try:
            if format == 'json':
                dashboard = json.loads(file_content)
            elif format == 'yaml':
                dashboard = yaml.safe_load(file_content)
            elif format == 'xml':
                dashboard = self.parse_xml_dashboard(file_content)
            elif format == 'zip':
                dashboard = await self.import_from_zip(file_content)
            else:
                raise ValueError(f"Unsupported import format: {format}")
                
            # Validate if requested
            if validate:
                validation_result = await self.validate_dashboard(dashboard)
                if not validation_result["valid"]:
                    return {
                        "success": False,
                        "error": "Validation failed",
                        "validation_errors": validation_result["errors"]
                    }
                    
            # Assign new IDs
            import_id = str(uuid.uuid4())
            dashboard["id"] = import_id
            dashboard["imported_by"] = user_id
            dashboard["organization_id"] = organization_id
            dashboard["imported_at"] = datetime.utcnow().isoformat()
            
            # Store dashboard (in production, save to database)
            # ...
            
            return {
                "success": True,
                "dashboard_id": import_id,
                "message": "Dashboard imported successfully",
                "dashboard": dashboard
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Import failed: {str(e)}"
            }
            
    async def import_from_zip(self, zip_content: str) -> Dict[str, Any]:
        """Import dashboard from ZIP archive"""
        # Decode base64 if needed
        try:
            zip_bytes = base64.b64decode(zip_content)
        except:
            zip_bytes = zip_content.encode() if isinstance(zip_content, str) else zip_content
            
        zip_buffer = io.BytesIO(zip_bytes)
        dashboard = {}
        
        with zipfile.ZipFile(zip_buffer, 'r') as zip_file:
            # Read main dashboard file
            if "dashboard.json" in zip_file.namelist():
                dashboard = json.loads(zip_file.read("dashboard.json"))
                
            # Read widgets
            widgets = []
            for file_name in zip_file.namelist():
                if file_name.startswith("widgets/") and file_name.endswith(".json"):
                    widget = json.loads(zip_file.read(file_name))
                    widgets.append(widget)
                    
            if widgets:
                dashboard["widgets"] = widgets
                
        return dashboard
        
    def parse_xml_dashboard(self, xml_content: str) -> Dict[str, Any]:
        """Parse XML dashboard content"""
        root = ET.fromstring(xml_content)
        
        def xml_to_dict(element):
            result = {}
            
            # Process attributes
            if element.attrib:
                result.update(element.attrib)
                
            # Process text content
            if element.text and element.text.strip():
                return element.text.strip()
                
            # Process children
            children = list(element)
            if children:
                for child in children:
                    if child.tag == "item":
                        if "items" not in result:
                            result["items"] = []
                        result["items"].append(xml_to_dict(child))
                    else:
                        result[child.tag] = xml_to_dict(child)
                        
            return result if result else None
            
        return xml_to_dict(root)
        
    async def validate_dashboard(self, dashboard: Dict[str, Any]) -> Dict[str, Any]:
        """Validate dashboard structure"""
        errors = []
        
        # Check required fields
        required_fields = ["name", "widgets"]
        for field in required_fields:
            if field not in dashboard:
                errors.append(f"Missing required field: {field}")
                
        # Validate widgets
        if "widgets" in dashboard:
            for i, widget in enumerate(dashboard["widgets"]):
                if "type" not in widget:
                    errors.append(f"Widget {i} missing type")
                if "position" not in widget:
                    errors.append(f"Widget {i} missing position")
                    
        return {
            "valid": len(errors) == 0,
            "errors": errors
        }
        
    async def create_backup(
        self,
        organization_id: str,
        include_dashboards: bool = True,
        include_data: bool = True,
        include_users: bool = False
    ) -> Dict[str, Any]:
        """Create a full backup of organization data"""
        backup_id = str(uuid.uuid4())
        backup_data = {
            "backup_id": backup_id,
            "organization_id": organization_id,
            "created_at": datetime.utcnow().isoformat(),
            "version": "1.0.0"
        }
        
        if include_dashboards:
            # Mock dashboard data
            backup_data["dashboards"] = [
                {"id": "d1", "name": "Dashboard 1"},
                {"id": "d2", "name": "Dashboard 2"}
            ]
            
        if include_data:
            # Mock data sources
            backup_data["data_sources"] = [
                {"id": "ds1", "type": "postgresql", "name": "Main DB"},
                {"id": "ds2", "type": "api", "name": "External API"}
            ]
            
        if include_users:
            # Mock user data (excluding sensitive info)
            backup_data["users"] = [
                {"id": "u1", "email": "user1@example.com", "role": "admin"},
                {"id": "u2", "email": "user2@example.com", "role": "viewer"}
            ]
            
        # Create ZIP archive
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            zip_file.writestr("backup.json", json.dumps(backup_data, indent=2))
            
        zip_buffer.seek(0)
        backup_content = zip_buffer.getvalue()
        
        return {
            "backup_id": backup_id,
            "size": len(backup_content),
            "content": base64.b64encode(backup_content).decode('utf-8'),
            "mime_type": "application/zip",
            "file_name": f"backup_{organization_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.zip"
        }
        
    async def restore_backup(
        self,
        backup_content: str,
        organization_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """Restore from a backup"""
        try:
            # Decode backup
            backup_bytes = base64.b64decode(backup_content)
            zip_buffer = io.BytesIO(backup_bytes)
            
            with zipfile.ZipFile(zip_buffer, 'r') as zip_file:
                backup_data = json.loads(zip_file.read("backup.json"))
                
            # Validate backup
            if backup_data.get("organization_id") != organization_id:
                return {
                    "success": False,
                    "error": "Backup organization mismatch"
                }
                
            # Restore data (in production, save to database)
            restored_items = {
                "dashboards": len(backup_data.get("dashboards", [])),
                "data_sources": len(backup_data.get("data_sources", [])),
                "users": len(backup_data.get("users", []))
            }
            
            return {
                "success": True,
                "message": "Backup restored successfully",
                "restored": restored_items,
                "backup_id": backup_data.get("backup_id"),
                "backup_date": backup_data.get("created_at")
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Restore failed: {str(e)}"
            }
            
    def cleanup(self):
        """Clean up temporary files"""
        if Path(self.temp_dir).exists():
            shutil.rmtree(self.temp_dir)

import uuid

# Global export/import service instance
export_import_service = ExportImportService()