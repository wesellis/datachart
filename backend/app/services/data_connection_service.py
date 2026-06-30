"""
Data Connection Service for Testing and Managing Data Source Connections
"""

import asyncio
from typing import Dict, Any, List, Optional
import asyncpg
import pymongo
import requests
import pandas as pd
from sqlalchemy import create_engine, inspect
import snowflake.connector
from datetime import datetime

class DataConnectionService:
    """Service for testing and managing data source connections"""
    
    async def test_connection(self, source_type: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Test a data source connection
        
        Args:
            source_type: Type of data source (postgresql, mysql, snowflake, etc.)
            config: Connection configuration dictionary
            
        Returns:
            Dictionary with success status and details
        """
        try:
            if source_type == 'postgresql':
                return await self._test_postgresql(config)
            elif source_type == 'mysql':
                return await self._test_mysql(config)
            elif source_type == 'snowflake':
                return await self._test_snowflake(config)
            elif source_type == 'mongodb':
                return await self._test_mongodb(config)
            elif source_type == 'rest_api':
                return await self._test_rest_api(config)
            else:
                return {
                    'success': False,
                    'error': f'Unsupported data source type: {source_type}'
                }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    async def _test_postgresql(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Test PostgreSQL connection"""
        try:
            # Build connection string
            conn_str = f"postgresql://{config.get('username')}:{config.get('password')}@{config.get('host')}:{config.get('port', 5432)}/{config.get('database')}"
            
            # Test connection using asyncpg
            conn = await asyncpg.connect(conn_str)
            version = await conn.fetchval('SELECT version()')
            await conn.close()
            
            return {
                'success': True,
                'message': 'Connection successful',
                'details': {
                    'version': version,
                    'host': config.get('host'),
                    'database': config.get('database')
                }
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    async def _test_mysql(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Test MySQL connection"""
        try:
            import pymysql
            
            connection = pymysql.connect(
                host=config.get('host'),
                port=config.get('port', 3306),
                user=config.get('username'),
                password=config.get('password'),
                database=config.get('database')
            )
            
            with connection.cursor() as cursor:
                cursor.execute("SELECT VERSION()")
                version = cursor.fetchone()[0]
            
            connection.close()
            
            return {
                'success': True,
                'message': 'Connection successful',
                'details': {
                    'version': version,
                    'host': config.get('host'),
                    'database': config.get('database')
                }
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    async def _test_snowflake(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Test Snowflake connection"""
        try:
            conn = snowflake.connector.connect(
                user=config.get('username'),
                password=config.get('password'),
                account=config.get('account'),
                warehouse=config.get('warehouse'),
                database=config.get('database'),
                schema=config.get('schema', 'public')
            )
            
            cursor = conn.cursor()
            cursor.execute("SELECT CURRENT_VERSION()")
            version = cursor.fetchone()[0]
            cursor.close()
            conn.close()
            
            return {
                'success': True,
                'message': 'Connection successful',
                'details': {
                    'version': version,
                    'account': config.get('account'),
                    'warehouse': config.get('warehouse'),
                    'database': config.get('database')
                }
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    async def _test_mongodb(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Test MongoDB connection"""
        try:
            # Build connection string
            if config.get('connection_string'):
                conn_str = config['connection_string']
            else:
                conn_str = f"mongodb://{config.get('username')}:{config.get('password')}@{config.get('host')}:{config.get('port', 27017)}/{config.get('database')}"
            
            client = pymongo.MongoClient(conn_str, serverSelectionTimeoutMS=5000)
            # Force connection
            client.server_info()
            
            db_names = client.list_database_names()
            client.close()
            
            return {
                'success': True,
                'message': 'Connection successful',
                'details': {
                    'databases': db_names[:10],  # Limit to first 10
                    'host': config.get('host')
                }
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    async def _test_rest_api(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Test REST API connection"""
        try:
            url = config.get('base_url')
            headers = config.get('headers', {})
            
            # Add authentication if provided
            if config.get('api_key'):
                headers['Authorization'] = f"Bearer {config['api_key']}"
            
            response = requests.get(
                url,
                headers=headers,
                timeout=10
            )
            
            return {
                'success': response.status_code < 400,
                'message': f'API responded with status {response.status_code}',
                'details': {
                    'status_code': response.status_code,
                    'url': url
                }
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    async def discover_schema(self, source_type: str, config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Discover tables and schemas in a data source
        
        Args:
            source_type: Type of data source
            config: Connection configuration
            
        Returns:
            List of table information with columns
        """
        if source_type == 'postgresql':
            return await self._discover_postgresql(config)
        elif source_type == 'mysql':
            return await self._discover_mysql(config)
        elif source_type == 'snowflake':
            return await self._discover_snowflake(config)
        elif source_type == 'mongodb':
            return await self._discover_mongodb(config)
        else:
            raise ValueError(f'Schema discovery not supported for {source_type}')
    
    async def _discover_postgresql(self, config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Discover PostgreSQL schema"""
        conn_str = f"postgresql://{config.get('username')}:{config.get('password')}@{config.get('host')}:{config.get('port', 5432)}/{config.get('database')}"
        
        conn = await asyncpg.connect(conn_str)
        
        # Get all tables
        tables = await conn.fetch("""
            SELECT 
                schemaname as schema,
                tablename as table,
                'table' as type
            FROM pg_tables
            WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
            ORDER BY schemaname, tablename
        """)
        
        result = []
        for table in tables:
            # Get columns for each table
            columns = await conn.fetch("""
                SELECT 
                    column_name,
                    data_type,
                    is_nullable
                FROM information_schema.columns
                WHERE table_schema = $1 AND table_name = $2
                ORDER BY ordinal_position
            """, table['schema'], table['table'])
            
            result.append({
                'schema': table['schema'],
                'table': table['table'],
                'type': table['type'],
                'columns': [
                    {
                        'name': col['column_name'],
                        'type': col['data_type'],
                        'nullable': col['is_nullable'] == 'YES'
                    }
                    for col in columns
                ]
            })
        
        await conn.close()
        return result
    
    async def _discover_mysql(self, config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Discover MySQL schema"""
        import pymysql
        
        connection = pymysql.connect(
            host=config.get('host'),
            port=config.get('port', 3306),
            user=config.get('username'),
            password=config.get('password'),
            database=config.get('database')
        )
        
        result = []
        with connection.cursor() as cursor:
            # Get all tables
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            
            for (table_name,) in tables:
                # Get columns for each table
                cursor.execute(f"DESCRIBE `{table_name}`")
                columns = cursor.fetchall()
                
                result.append({
                    'schema': config.get('database'),
                    'table': table_name,
                    'type': 'table',
                    'columns': [
                        {
                            'name': col[0],
                            'type': col[1],
                            'nullable': col[2] == 'YES'
                        }
                        for col in columns
                    ]
                })
        
        connection.close()
        return result
    
    async def _discover_snowflake(self, config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Discover Snowflake schema"""
        conn = snowflake.connector.connect(
            user=config.get('username'),
            password=config.get('password'),
            account=config.get('account'),
            warehouse=config.get('warehouse'),
            database=config.get('database'),
            schema=config.get('schema', 'public')
        )
        
        cursor = conn.cursor()
        
        # Get all tables and views
        cursor.execute("""
            SELECT 
                table_schema,
                table_name,
                table_type
            FROM information_schema.tables
            WHERE table_schema NOT IN ('INFORMATION_SCHEMA')
            ORDER BY table_schema, table_name
        """)
        
        tables = cursor.fetchall()
        
        result = []
        for schema, table, table_type in tables:
            # Get columns
            cursor.execute(f"""
                SELECT 
                    column_name,
                    data_type,
                    is_nullable
                FROM information_schema.columns
                WHERE table_schema = '{schema}' 
                AND table_name = '{table}'
                ORDER BY ordinal_position
            """)
            
            columns = cursor.fetchall()
            
            result.append({
                'schema': schema,
                'table': table,
                'type': table_type.lower(),
                'columns': [
                    {
                        'name': col[0],
                        'type': col[1],
                        'nullable': col[2] == 'YES'
                    }
                    for col in columns
                ]
            })
        
        cursor.close()
        conn.close()
        return result
    
    async def _discover_mongodb(self, config: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Discover MongoDB collections"""
        if config.get('connection_string'):
            conn_str = config['connection_string']
        else:
            conn_str = f"mongodb://{config.get('username')}:{config.get('password')}@{config.get('host')}:{config.get('port', 27017)}/{config.get('database')}"
        
        client = pymongo.MongoClient(conn_str)
        db = client[config.get('database')]
        
        result = []
        for collection_name in db.list_collection_names():
            # Sample documents to infer schema
            sample = list(db[collection_name].find().limit(100))
            
            if sample:
                # Infer columns from sample documents
                columns = set()
                for doc in sample:
                    columns.update(doc.keys())
                
                result.append({
                    'schema': config.get('database'),
                    'table': collection_name,
                    'type': 'collection',
                    'columns': [
                        {
                            'name': col,
                            'type': 'mixed',
                            'nullable': True
                        }
                        for col in sorted(columns)
                    ]
                })
        
        client.close()
        return result
    
    async def execute_query(
        self,
        source_type: str,
        config: Dict[str, Any],
        query: str,
        parameters: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Execute a query on a data source
        
        Args:
            source_type: Type of data source
            config: Connection configuration
            query: Query to execute
            parameters: Query parameters
            
        Returns:
            Query results with data and metadata
        """
        start_time = datetime.utcnow()
        
        if source_type == 'postgresql':
            result = await self._execute_postgresql(config, query, parameters)
        elif source_type == 'mysql':
            result = await self._execute_mysql(config, query, parameters)
        elif source_type == 'snowflake':
            result = await self._execute_snowflake(config, query, parameters)
        else:
            raise ValueError(f'Query execution not supported for {source_type}')
        
        end_time = datetime.utcnow()
        execution_time_ms = (end_time - start_time).total_seconds() * 1000
        
        result['execution_time_ms'] = execution_time_ms
        return result
    
    async def _execute_postgresql(
        self,
        config: Dict[str, Any],
        query: str,
        parameters: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Execute PostgreSQL query"""
        conn_str = f"postgresql://{config.get('username')}:{config.get('password')}@{config.get('host')}:{config.get('port', 5432)}/{config.get('database')}"
        
        conn = await asyncpg.connect(conn_str)
        
        # Execute query
        rows = await conn.fetch(query)
        
        # Convert to list of dicts
        data = [dict(row) for row in rows]
        
        # Get column names
        columns = list(rows[0].keys()) if rows else []
        
        await conn.close()
        
        return {
            'data': data,
            'columns': columns,
            'row_count': len(data)
        }
    
    async def _execute_mysql(
        self,
        config: Dict[str, Any],
        query: str,
        parameters: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Execute MySQL query"""
        import pymysql
        
        connection = pymysql.connect(
            host=config.get('host'),
            port=config.get('port', 3306),
            user=config.get('username'),
            password=config.get('password'),
            database=config.get('database')
        )
        
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute(query)
            data = cursor.fetchall()
            columns = [desc[0] for desc in cursor.description] if cursor.description else []
        
        connection.close()
        
        return {
            'data': data,
            'columns': columns,
            'row_count': len(data)
        }
    
    async def _execute_snowflake(
        self,
        config: Dict[str, Any],
        query: str,
        parameters: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Execute Snowflake query"""
        conn = snowflake.connector.connect(
            user=config.get('username'),
            password=config.get('password'),
            account=config.get('account'),
            warehouse=config.get('warehouse'),
            database=config.get('database'),
            schema=config.get('schema', 'public')
        )
        
        cursor = conn.cursor(snowflake.connector.DictCursor)
        cursor.execute(query)
        
        data = cursor.fetchall()
        columns = [desc[0] for desc in cursor.description] if cursor.description else []
        
        cursor.close()
        conn.close()
        
        return {
            'data': data,
            'columns': columns,
            'row_count': len(data)
        }