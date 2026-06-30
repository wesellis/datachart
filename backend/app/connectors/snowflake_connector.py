import snowflake.connector
import pandas as pd
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging
from .base import DataSourceConnector

logger = logging.getLogger(__name__)

class SnowflakeConnector(DataSourceConnector):
    """Snowflake data warehouse connector"""
    
    def __init__(self, connection_config: Dict[str, Any]):
        super().__init__(connection_config)
        self.connector_type = "snowflake"
    
    async def connect(self) -> bool:
        """Establish connection to Snowflake"""
        try:
            self.connection = snowflake.connector.connect(
                user=self.connection_config['username'],
                password=self.connection_config['password'],
                account=self.connection_config['account'],
                warehouse=self.connection_config.get('warehouse'),
                database=self.connection_config.get('database'),
                schema=self.connection_config.get('schema'),
                role=self.connection_config.get('role'),
                timeout=self.connection_config.get('timeout', 30)
            )
            
            self.is_connected = True
            self._connection_time = datetime.utcnow()
            self.last_error = None
            
            logger.info(f"Connected to Snowflake account: {self.connection_config['account']}")
            return True
            
        except Exception as e:
            self.last_error = str(e)
            self.is_connected = False
            logger.error(f"Snowflake connection failed: {e}")
            return False
    
    async def disconnect(self):
        """Close Snowflake connection"""
        if self.connection:
            try:
                self.connection.close()
                self.is_connected = False
                logger.info("Disconnected from Snowflake")
            except Exception as e:
                logger.error(f"Error disconnecting from Snowflake: {e}")
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test Snowflake connection"""
        try:
            if not self.is_connected:
                await self.connect()
            
            cursor = self.connection.cursor()
            cursor.execute("SELECT CURRENT_VERSION() as version")
            result = cursor.fetchone()
            cursor.close()
            
            return {
                "success": True,
                "message": "Connection successful",
                "version": result[0] if result else "Unknown",
                "database": self.connection_config.get('database'),
                "warehouse": self.connection_config.get('warehouse')
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Connection test failed: {str(e)}"
            }
    
    async def execute_query(self, query: str, parameters: Optional[Dict] = None) -> pd.DataFrame:
        """Execute query on Snowflake"""
        if not self.is_connected:
            await self.connect()
        
        try:
            cursor = self.connection.cursor()
            
            if parameters:
                cursor.execute(query, parameters)
            else:
                cursor.execute(query)
            
            # Fetch results
            columns = [desc[0] for desc in cursor.description]
            data = cursor.fetchall()
            cursor.close()
            
            # Convert to DataFrame
            df = pd.DataFrame(data, columns=columns)
            return df
            
        except Exception as e:
            logger.error(f"Snowflake query execution failed: {e}")
            raise
    
    async def get_schema(self) -> Dict[str, List[str]]:
        """Get Snowflake database schema"""
        if not self.is_connected:
            await self.connect()
        
        try:
            cursor = self.connection.cursor()
            
            # Get tables
            database = self.connection_config.get('database', 'CURRENT_DATABASE()')
            schema = self.connection_config.get('schema', 'CURRENT_SCHEMA()')
            
            tables_query = f"""
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = '{schema}'
            ORDER BY TABLE_NAME
            """
            
            cursor.execute(tables_query)
            tables = [row[0] for row in cursor.fetchall()]
            
            # Get columns for each table
            schema_info = {}
            for table in tables:
                columns_query = f"""
                SELECT COLUMN_NAME, DATA_TYPE 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = '{schema}' 
                AND TABLE_NAME = '{table}'
                ORDER BY ORDINAL_POSITION
                """
                
                cursor.execute(columns_query)
                columns = [{"name": row[0], "type": row[1]} for row in cursor.fetchall()]
                schema_info[table] = columns
            
            cursor.close()
            return schema_info
            
        except Exception as e:
            logger.error(f"Failed to get Snowflake schema: {e}")
            raise
    
    async def get_table_info(self, table_name: str) -> Dict[str, Any]:
        """Get detailed table information"""
        if not self.is_connected:
            await self.connect()
        
        try:
            cursor = self.connection.cursor()
            schema = self.connection_config.get('schema', 'CURRENT_SCHEMA()')
            
            # Get table info
            info_query = f"""
            SELECT 
                COUNT(*) as row_count,
                COUNT(DISTINCT *) as distinct_rows
            FROM {schema}.{table_name}
            """
            
            cursor.execute(info_query)
            row_info = cursor.fetchone()
            
            # Get column details
            columns_query = f"""
            SELECT 
                COLUMN_NAME,
                DATA_TYPE,
                IS_NULLABLE,
                COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = '{schema}' 
            AND TABLE_NAME = '{table_name}'
            ORDER BY ORDINAL_POSITION
            """
            
            cursor.execute(columns_query)
            columns = [
                {
                    "name": row[0],
                    "type": row[1],
                    "nullable": row[2] == "YES",
                    "default": row[3]
                }
                for row in cursor.fetchall()
            ]
            
            cursor.close()
            
            return {
                "table_name": table_name,
                "row_count": row_info[0] if row_info else 0,
                "distinct_rows": row_info[1] if row_info else 0,
                "columns": columns,
                "schema": schema
            }
            
        except Exception as e:
            logger.error(f"Failed to get table info for {table_name}: {e}")
            raise
    
    def get_sample_queries(self) -> List[Dict[str, str]]:
        """Get Snowflake-specific sample queries"""
        database = self.connection_config.get('database', 'YOUR_DATABASE')
        schema = self.connection_config.get('schema', 'YOUR_SCHEMA')
        
        return [
            {
                "name": "Current Database Info",
                "description": "Get current database and schema information",
                "query": "SELECT CURRENT_DATABASE(), CURRENT_SCHEMA(), CURRENT_WAREHOUSE()"
            },
            {
                "name": "List Tables",
                "description": "List all tables in current schema",
                "query": f"SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '{schema}' LIMIT 20"
            },
            {
                "name": "Table Row Count",
                "description": "Get row count for a table",
                "query": f"SELECT COUNT(*) as row_count FROM {database}.{schema}.YOUR_TABLE_NAME"
            },
            {
                "name": "Recent Data",
                "description": "Get recent records with timestamp",
                "query": f"SELECT * FROM {database}.{schema}.YOUR_TABLE_NAME ORDER BY YOUR_TIMESTAMP_COLUMN DESC LIMIT 10"
            }
        ]
    
    def format_connection_string(self, config: Dict[str, Any]) -> str:
        """Format Snowflake connection string"""
        account = config.get('account')
        database = config.get('database')
        schema = config.get('schema')
        warehouse = config.get('warehouse')
        
        return f"snowflake://{account}/{database}/{schema}?warehouse={warehouse}"