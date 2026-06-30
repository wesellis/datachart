"""
Microsoft Intune Integration Service

Provides connectivity to Microsoft Intune for device and application management data.
"""

from typing import Dict, List, Any, Optional
import asyncio
from datetime import datetime, timedelta

from app.core.logging import get_logger

logger = get_logger(__name__)

class IntuneService:
    """Service for integrating with Microsoft Intune"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.tenant_id = config.get('tenant_id')
        self.client_id = config.get('client_id') 
        self.client_secret = config.get('client_secret')
        
    async def test_connection(self) -> bool:
        """Test connection to Intune"""
        try:
            # Simulate connection test
            logger.info("Testing Intune connection")
            await asyncio.sleep(0.1)  # Simulate API call
            return True
        except Exception as e:
            logger.error(f"Intune connection test failed: {str(e)}")
            return False
    
    async def discover_data_sources(self) -> List[Dict[str, Any]]:
        """Discover available Intune data sources"""
        try:
            # Return available Intune endpoints/data types
            return [
                {
                    "schema": "Devices", 
                    "table": "ManagedDevices",
                    "type": "endpoint",
                    "row_count": 450,
                    "columns": [
                        {"name": "deviceName", "type": "string", "nullable": False, "sample_values": ["WIN-12345", "MAC-67890"]},
                        {"name": "operatingSystem", "type": "string", "nullable": False, "sample_values": ["Windows", "iOS", "Android"]},
                        {"name": "complianceState", "type": "string", "nullable": False, "sample_values": ["Compliant", "NonCompliant"]},
                        {"name": "lastSyncDateTime", "type": "datetime", "nullable": True, "sample_values": ["2024-01-15T10:30:00Z"]}
                    ],
                    "description": "Managed devices in Intune"
                },
                {
                    "schema": "Applications",
                    "table": "ManagedAppRegistrations", 
                    "type": "endpoint",
                    "row_count": 125,
                    "columns": [
                        {"name": "applicationId", "type": "string", "nullable": False, "sample_values": ["com.microsoft.office", "com.adobe.reader"]},
                        {"name": "appName", "type": "string", "nullable": False, "sample_values": ["Microsoft Office", "Adobe Reader"]},
                        {"name": "deviceType", "type": "string", "nullable": False, "sample_values": ["iOS", "Android", "Windows"]},
                        {"name": "userEmail", "type": "string", "nullable": False, "sample_values": ["user@company.com"]}
                    ],
                    "description": "Mobile application registrations"
                },
                {
                    "schema": "Compliance", 
                    "table": "DeviceCompliancePolicies",
                    "type": "endpoint", 
                    "row_count": 25,
                    "columns": [
                        {"name": "displayName", "type": "string", "nullable": False, "sample_values": ["Windows 10 Compliance", "iOS Security Policy"]},
                        {"name": "platform", "type": "string", "nullable": False, "sample_values": ["windows10AndLater", "iOS"]},
                        {"name": "state", "type": "string", "nullable": False, "sample_values": ["enabled", "disabled"]},
                        {"name": "createdDateTime", "type": "datetime", "nullable": False, "sample_values": ["2024-01-01T09:00:00Z"]}
                    ],
                    "description": "Device compliance policies"
                }
            ]
            
        except Exception as e:
            logger.error(f"Failed to discover Intune data sources: {str(e)}")
            return []
    
    async def execute_query(self, query: str, parameters: Dict[str, Any] = None) -> Dict[str, Any]:
        """Execute a query against Intune API (simulated)"""
        try:
            # Simulate query execution with sample data
            logger.info(f"Executing Intune query: {query}")
            
            # Generate sample response based on query content
            if "ManagedDevices" in query:
                sample_data = [
                    {
                        "deviceName": "WIN-LAPTOP-001",
                        "operatingSystem": "Windows", 
                        "complianceState": "Compliant",
                        "lastSyncDateTime": "2024-01-15T10:30:00Z"
                    },
                    {
                        "deviceName": "IPHONE-002",
                        "operatingSystem": "iOS",
                        "complianceState": "NonCompliant", 
                        "lastSyncDateTime": "2024-01-14T15:45:00Z"
                    },
                    {
                        "deviceName": "ANDROID-003",
                        "operatingSystem": "Android",
                        "complianceState": "Compliant",
                        "lastSyncDateTime": "2024-01-15T08:20:00Z"
                    }
                ]
                
                columns = [
                    {"name": "deviceName", "type": "string"},
                    {"name": "operatingSystem", "type": "string"},
                    {"name": "complianceState", "type": "string"}, 
                    {"name": "lastSyncDateTime", "type": "datetime"}
                ]
                
            elif "ManagedAppRegistrations" in query:
                sample_data = [
                    {
                        "applicationId": "com.microsoft.office",
                        "appName": "Microsoft Office", 
                        "deviceType": "iOS",
                        "userEmail": "john.doe@company.com"
                    },
                    {
                        "applicationId": "com.adobe.reader",
                        "appName": "Adobe Reader",
                        "deviceType": "Android", 
                        "userEmail": "jane.smith@company.com"
                    }
                ]
                
                columns = [
                    {"name": "applicationId", "type": "string"},
                    {"name": "appName", "type": "string"},
                    {"name": "deviceType", "type": "string"},
                    {"name": "userEmail", "type": "string"}
                ]
                
            else:
                # Generic sample data
                sample_data = [
                    {"id": "1", "name": "Sample Record 1", "value": 100},
                    {"id": "2", "name": "Sample Record 2", "value": 200}
                ]
                
                columns = [
                    {"name": "id", "type": "string"},
                    {"name": "name", "type": "string"}, 
                    {"name": "value", "type": "number"}
                ]
            
            return {
                "data": sample_data,
                "columns": columns,
                "row_count": len(sample_data)
            }
            
        except Exception as e:
            logger.error(f"Intune query execution failed: {str(e)}")
            raise
    
    async def get_table_schema(self, schema: str, table: str) -> Dict[str, Any]:
        """Get schema information for a specific Intune endpoint"""
        try:
            # Return schema info for the specified endpoint
            schemas = {
                ("Devices", "ManagedDevices"): {
                    "schema": "Devices",
                    "table": "ManagedDevices", 
                    "type": "endpoint",
                    "row_count": 450,
                    "columns": [
                        {"name": "deviceName", "type": "string", "nullable": False},
                        {"name": "operatingSystem", "type": "string", "nullable": False},
                        {"name": "complianceState", "type": "string", "nullable": False},
                        {"name": "lastSyncDateTime", "type": "datetime", "nullable": True}
                    ],
                    "description": "Managed devices in Intune"
                },
                ("Applications", "ManagedAppRegistrations"): {
                    "schema": "Applications", 
                    "table": "ManagedAppRegistrations",
                    "type": "endpoint",
                    "row_count": 125, 
                    "columns": [
                        {"name": "applicationId", "type": "string", "nullable": False},
                        {"name": "appName", "type": "string", "nullable": False},
                        {"name": "deviceType", "type": "string", "nullable": False},
                        {"name": "userEmail", "type": "string", "nullable": False}
                    ],
                    "description": "Mobile application registrations"
                }
            }
            
            key = (schema, table)
            if key in schemas:
                return schemas[key]
            else:
                return {
                    "schema": schema,
                    "table": table,
                    "type": "endpoint", 
                    "row_count": 0,
                    "columns": [],
                    "description": f"Intune endpoint: {schema}.{table}"
                }
                
        except Exception as e:
            logger.error(f"Failed to get Intune table schema: {str(e)}")
            raise