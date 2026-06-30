import asyncpg
import pandas as pd
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging
from .base import DataSourceConnector

logger = logging.getLogger(__name__)

class PostgreSQLConnector(DataSourceConnector):
    """PostgreSQL database connector"""
    
    def __init__(self, connection_config: Dict[str, Any]):
        super().__init__(connection_config)
        self.connector_type = "postgresql"
        self.connection_pool = None
    
    async def connect(self) -> bool:
        """Establish connection pool to PostgreSQL"""
        try:
            connection_string = self.format_connection_string(self.connection_config)
            
            self.connection_pool = await asyncpg.create_pool(
                connection_string,
                min_size=1,
                max_size=10,
                command_timeout=self.connection_config.get('timeout', 60)
            )
            
            # Test connection
            async with self.connection_pool.acquire() as conn:
                version = await conn.fetchval("SELECT version()")
                logger.info(f"Connected to PostgreSQL: {version}")
            
            self.is_connected = True
            self._connection_time = datetime.utcnow()
            self.last_error = None
            return True
            
        except Exception as e:
            self.last_error = str(e)
            self.is_connected = False
            logger.error(f"PostgreSQL connection failed: {e}")
            return False
    
    async def disconnect(self):
        """Close PostgreSQL connection pool"""
        if self.connection_pool:
            try:
                await self.connection_pool.close()
                self.is_connected = False
                logger.info("Disconnected from PostgreSQL")
            except Exception as e:
                logger.error(f"Error disconnecting from PostgreSQL: {e}")
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test PostgreSQL connection"""
        try:
            if not self.is_connected:
                await self.connect()
            
            async with self.connection_pool.acquire() as conn:
                version = await conn.fetchval("SELECT version()")
                database = await conn.fetchval("SELECT current_database()")
                user = await conn.fetchval("SELECT current_user")
                
                return {
                    "success": True,
                    "message": "Connection successful",
                    "version": version,
                    "database": database,
                    "user": user
                }
                
        except Exception as e:
            return {
                "success": False,
                "message": f"Connection test failed: {str(e)}"
            }
    
    async def execute_query(self, query: str, parameters: Optional[Dict] = None) -> pd.DataFrame:
        """Execute query on PostgreSQL"""
        if not self.is_connected:
            await self.connect()
        
        try:
            async with self.connection_pool.acquire() as conn:
                if parameters:
                    # Convert dict parameters to positional for asyncpg
                    param_values = list(parameters.values())
                    result = await conn.fetch(query, *param_values)
                else:
                    result = await conn.fetch(query)
                
                # Convert to DataFrame
                if result:
                    columns = list(result[0].keys())
                    data = [list(row.values()) for row in result]
                    df = pd.DataFrame(data, columns=columns)
                else:
                    df = pd.DataFrame()
                
                return df
                
        except Exception as e:
            logger.error(f"PostgreSQL query execution failed: {e}")
            raise
    
    async def get_schema(self) -> Dict[str, List[str]]:
        """Get PostgreSQL database schema"""
        if not self.is_connected:
            await self.connect()
        
        try:
            async with self.connection_pool.acquire() as conn:
                # Get tables
                tables_query = """
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
                """
                
                tables_result = await conn.fetch(tables_query)
                tables = [row['table_name'] for row in tables_result]
                
                # Get columns for each table
                schema_info = {}
                for table in tables:
                    columns_query = """
                    SELECT column_name, data_type, is_nullable, column_default
                    FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = $1
                    ORDER BY ordinal_position
                    """
                    
                    columns_result = await conn.fetch(columns_query, table)
                    columns = [
                        {
                            "name": row['column_name'],
                            "type": row['data_type'],
                            "nullable": row['is_nullable'] == 'YES',
                            "default": row['column_default']
                        }
                        for row in columns_result
                    ]
                    schema_info[table] = columns
                
                return schema_info
                
        except Exception as e:
            logger.error(f"Failed to get PostgreSQL schema: {e}")
            raise
    
    async def get_table_info(self, table_name: str) -> Dict[str, Any]:
        """Get detailed PostgreSQL table information"""
        if not self.is_connected:
            await self.connect()
        
        try:
            async with self.connection_pool.acquire() as conn:
                # Get table stats
                stats_query = f"SELECT COUNT(*) as row_count FROM {table_name}"
                row_count = await conn.fetchval(stats_query)
                
                # Get column details
                columns_query = """
                SELECT 
                    column_name,
                    data_type,
                    is_nullable,
                    column_default,
                    character_maximum_length
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = $1
                ORDER BY ordinal_position
                """
                
                columns_result = await conn.fetch(columns_query, table_name)
                columns = [
                    {
                        "name": row['column_name'],
                        "type": row['data_type'],
                        "nullable": row['is_nullable'] == 'YES',
                        "default": row['column_default'],
                        "max_length": row['character_maximum_length']
                    }
                    for row in columns_result
                ]
                
                # Get table size
                size_query = f"SELECT pg_size_pretty(pg_total_relation_size('{table_name}')) as table_size"
                table_size = await conn.fetchval(size_query)
                
                return {
                    "table_name": table_name,
                    "row_count": row_count,
                    "columns": columns,
                    "table_size": table_size,
                    "schema": "public"
                }
                
        except Exception as e:
            logger.error(f"Failed to get table info for {table_name}: {e}")
            raise
    
    def get_sample_queries(self) -> List[Dict[str, str]]:
        """Get PostgreSQL-specific sample queries"""
        return [
            {
                "name": "Database Info",
                "description": "Get current database information",
                "query": "SELECT current_database(), current_user, version()"
            },
            {
                "name": "List Tables",
                "description": "List all tables in public schema",
                "query": "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LIMIT 20"
            },
            {
                "name": "Table Sizes",
                "description": "Get size of all tables",
                "query": """
                SELECT 
                    schemaname,
                    tablename,
                    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
                FROM pg_tables 
                WHERE schemaname = 'public'
                ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
                LIMIT 10
                """
            },
            {
                "name": "Recent Activity",
                "description": "Get database activity statistics",
                "query": """
                SELECT 
                    datname,
                    numbackends,
                    xact_commit,
                    xact_rollback,
                    blks_read,
                    blks_hit
                FROM pg_stat_database 
                WHERE datname = current_database()
                """
            }
        ]
    
    def format_connection_string(self, config: Dict[str, Any]) -> str:
        """Format PostgreSQL connection string"""
        host = config.get('host', 'localhost')
        port = config.get('port', 5432)
        database = config.get('database', 'postgres')
        username = config.get('username')
        password = config.get('password')
        
        return f"postgresql://{username}:{password}@{host}:{port}/{database}"