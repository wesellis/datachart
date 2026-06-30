from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional
import pandas as pd
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class DataSourceConnector(ABC):
    """Abstract base class for all data source connectors"""
    
    def __init__(self, connection_config: Dict[str, Any]):
        self.connection_config = connection_config
        self.connection = None
        self.is_connected = False
        self.last_error = None
        self.metadata_cache = {}
    
    @abstractmethod
    async def connect(self) -> bool:
        """Establish connection to the data source"""
        pass
    
    @abstractmethod
    async def disconnect(self):
        """Close connection to the data source"""
        pass
    
    @abstractmethod
    async def test_connection(self) -> Dict[str, Any]:
        """Test the connection and return status info"""
        pass
    
    @abstractmethod
    async def execute_query(self, query: str, parameters: Optional[Dict] = None) -> pd.DataFrame:
        """Execute a query and return results as DataFrame"""
        pass
    
    @abstractmethod
    async def get_schema(self) -> Dict[str, List[str]]:
        """Get database schema (tables and columns)"""
        pass
    
    @abstractmethod
    async def get_table_info(self, table_name: str) -> Dict[str, Any]:
        """Get detailed information about a specific table"""
        pass
    
    def get_connection_status(self) -> Dict[str, Any]:
        """Get current connection status"""
        return {
            "is_connected": self.is_connected,
            "last_error": self.last_error,
            "connection_time": getattr(self, '_connection_time', None)
        }
    
    def validate_query(self, query: str) -> Dict[str, Any]:
        """Validate a query without executing it"""
        # Basic SQL injection prevention
        dangerous_keywords = [
            'DROP', 'DELETE', 'INSERT', 'UPDATE', 'ALTER', 'CREATE', 
            'TRUNCATE', 'GRANT', 'REVOKE', 'EXEC', 'EXECUTE'
        ]
        
        query_upper = query.upper()
        for keyword in dangerous_keywords:
            if keyword in query_upper:
                return {
                    "is_valid": False,
                    "error": f"Query contains restricted keyword: {keyword}"
                }
        
        # Check for SELECT queries only
        if not query_upper.strip().startswith('SELECT'):
            return {
                "is_valid": False,
                "error": "Only SELECT queries are allowed"
            }
        
        return {"is_valid": True}
    
    async def execute_safe_query(self, query: str, parameters: Optional[Dict] = None, limit: int = 1000) -> Dict[str, Any]:
        """Execute query with safety checks and limits"""
        try:
            # Validate query
            validation = self.validate_query(query)
            if not validation["is_valid"]:
                return {
                    "success": False,
                    "error": validation["error"],
                    "data": None
                }
            
            # Add LIMIT if not present
            if "LIMIT" not in query.upper():
                query = f"{query} LIMIT {limit}"
            
            # Execute query
            start_time = datetime.utcnow()
            df = await self.execute_query(query, parameters)
            end_time = datetime.utcnow()
            
            execution_time = (end_time - start_time).total_seconds()
            
            return {
                "success": True,
                "data": df.to_dict('records'),
                "row_count": len(df),
                "column_count": len(df.columns),
                "columns": df.columns.tolist(),
                "execution_time_seconds": execution_time,
                "query": query
            }
            
        except Exception as e:
            logger.error(f"Query execution failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "data": None
            }
    
    def format_connection_string(self, config: Dict[str, Any]) -> str:
        """Format connection string from config (override in subclasses)"""
        return ""
    
    def get_sample_queries(self) -> List[Dict[str, str]]:
        """Get sample queries for this data source type"""
        return [
            {
                "name": "Sample Data",
                "description": "Get first 10 rows from a table",
                "query": "SELECT * FROM your_table_name LIMIT 10"
            }
        ]