from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
import json
import uuid
from datetime import datetime

from app.database import get_db, Cache
from app.models.data_source import DataSource, DataQuery, QueryExecution
from app.models.user import User
from app.api.auth import get_current_active_user
# Import connectors only when needed to avoid missing dependencies
# from app.connectors.snowflake_connector import SnowflakeConnector
# from app.connectors.postgresql_connector import PostgreSQLConnector

router = APIRouter(prefix="/api/v1/data-sources", tags=["data-sources"])

# Pydantic models
class DataSourceCreate(BaseModel):
    name: str
    type: str  # snowflake, postgresql, mysql, oracle, api, csv
    connection_config: Dict[str, Any]
    description: Optional[str] = None

class DataSourceResponse(BaseModel):
    id: str
    name: str
    type: str
    description: Optional[str]
    connection_status: str
    created_at: datetime
    last_connection_test: Optional[datetime]
    tables_count: Optional[int] = 0

class QueryCreate(BaseModel):
    name: str
    query_text: str
    description: Optional[str] = None
    parameters: Optional[Dict] = None

class QueryExecute(BaseModel):
    query: str
    parameters: Optional[Dict] = None
    limit: Optional[int] = 1000

# Connector factory
def get_connector(data_source: DataSource):
    """Factory function to get appropriate connector"""
    config = json.loads(data_source.connection_string) if data_source.connection_string else {}
    
    # Return mock connector for now since connectors aren't implemented
    class MockConnector:
        async def test_connection(self):
            return {"success": True, "message": "Connection test simulated"}
        
        async def get_schema(self):
            return {
                "tables": ["users", "products", "orders"],
                "users": ["id", "name", "email", "created_at"],
                "products": ["id", "name", "price", "category"],
                "orders": ["id", "user_id", "product_id", "amount", "created_at"]
            }
        
        async def execute_safe_query(self, query, parameters, limit=1000):
            return {
                "success": True,
                "data": [{"id": 1, "name": "Sample"}, {"id": 2, "name": "Data"}],
                "row_count": 2,
                "column_count": 2,
                "execution_time_seconds": 0.1
            }
        
        def get_sample_queries(self):
            return [
                "SELECT * FROM users LIMIT 10",
                "SELECT COUNT(*) FROM orders",
                "SELECT category, COUNT(*) FROM products GROUP BY category"
            ]
        
        async def get_table_info(self, table_name):
            return {
                "table_name": table_name,
                "columns": ["id", "name", "created_at"],
                "row_count": 100,
                "indexes": ["PRIMARY KEY (id)"]
            }
    
    return MockConnector()

@router.post("/", response_model=DataSourceResponse)
async def create_data_source(
    data_source_data: DataSourceCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new data source connection"""
    
    # Get user's organization
    organization_id = current_user.organizations[0].id if current_user.organizations else None
    if not organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must belong to an organization"
        )
    
    # Create data source
    data_source = DataSource(
        id=str(uuid.uuid4()),
        organization_id=organization_id,
        name=data_source_data.name,
        description=data_source_data.description,
        type=data_source_data.type,
        connection_string=json.dumps(data_source_data.connection_config),
        host=data_source_data.connection_config.get("host"),
        port=data_source_data.connection_config.get("port"),
        database_name=data_source_data.connection_config.get("database"),
        schema_name=data_source_data.connection_config.get("schema"),
        username=data_source_data.connection_config.get("username"),
        password_encrypted=data_source_data.connection_config.get("password"),  # TODO: Encrypt
        connection_status="unknown",
        created_at=datetime.utcnow()
    )
    
    db.add(data_source)
    db.commit()
    db.refresh(data_source)
    
    # Test connection asynchronously
    try:
        connector = get_connector(data_source)
        test_result = await connector.test_connection()
        
        data_source.connection_status = "connected" if test_result["success"] else "failed"
        data_source.last_connection_test = datetime.utcnow()
        data_source.error_message = None if test_result["success"] else test_result.get("message")
        
        db.commit()
    except Exception as e:
        data_source.connection_status = "failed"
        data_source.error_message = str(e)
        db.commit()
    
    return DataSourceResponse(
        id=data_source.id,
        name=data_source.name,
        type=data_source.type,
        description=data_source.description,
        connection_status=data_source.connection_status,
        created_at=data_source.created_at,
        last_connection_test=data_source.last_connection_test
    )

@router.get("/", response_model=List[DataSourceResponse])
async def list_data_sources(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List all data sources for user's organization"""
    
    organization_ids = [org.id for org in current_user.organizations]
    
    data_sources = db.query(DataSource).filter(
        DataSource.organization_id.in_(organization_ids),
        DataSource.is_active == True
    ).all()
    
    return [
        DataSourceResponse(
            id=ds.id,
            name=ds.name,
            type=ds.type,
            description=ds.description,
            connection_status=ds.connection_status,
            created_at=ds.created_at,
            last_connection_test=ds.last_connection_test
        )
        for ds in data_sources
    ]

@router.get("/{data_source_id}/test")
async def test_data_source_connection(
    data_source_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Test connection to a data source"""
    
    data_source = db.query(DataSource).filter(DataSource.id == data_source_id).first()
    if not data_source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data source not found"
        )
    
    # Check permissions
    organization_ids = [org.id for org in current_user.organizations]
    if data_source.organization_id not in organization_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    try:
        connector = get_connector(data_source)
        result = await connector.test_connection()
        
        # Update connection status
        data_source.connection_status = "connected" if result["success"] else "failed"
        data_source.last_connection_test = datetime.utcnow()
        data_source.error_message = None if result["success"] else result.get("message")
        db.commit()
        
        return result
        
    except Exception as e:
        data_source.connection_status = "failed"
        data_source.error_message = str(e)
        db.commit()
        
        return {
            "success": False,
            "message": f"Connection test failed: {str(e)}"
        }

@router.get("/{data_source_id}/schema")
async def get_data_source_schema(
    data_source_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get schema information for a data source"""
    
    data_source = db.query(DataSource).filter(DataSource.id == data_source_id).first()
    if not data_source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data source not found"
        )
    
    # Check permissions
    organization_ids = [org.id for org in current_user.organizations]
    if data_source.organization_id not in organization_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Check cache first
    cache_key = f"schema:{data_source_id}"
    cached_schema = Cache.get(cache_key)
    if cached_schema:
        return json.loads(cached_schema)
    
    try:
        connector = get_connector(data_source)
        schema = await connector.get_schema()
        
        # Cache the result
        Cache.set(cache_key, json.dumps(schema), ttl=3600)  # Cache for 1 hour
        
        # Update metadata in database
        data_source.tables_metadata = json.dumps(list(schema.keys()))
        data_source.columns_metadata = json.dumps(schema)
        db.commit()
        
        return schema
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get schema: {str(e)}"
        )

@router.post("/{data_source_id}/query")
async def execute_query(
    data_source_id: str,
    query_data: QueryExecute,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Execute a query against a data source"""
    
    data_source = db.query(DataSource).filter(DataSource.id == data_source_id).first()
    if not data_source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data source not found"
        )
    
    # Check permissions
    organization_ids = [org.id for org in current_user.organizations]
    if data_source.organization_id not in organization_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    try:
        connector = get_connector(data_source)
        result = await connector.execute_safe_query(
            query_data.query, 
            query_data.parameters, 
            limit=query_data.limit or 1000
        )
        
        # Store query result in database
        if result["success"]:
            query_result = QueryResult(
                id=str(uuid.uuid4()),
                query_id=None,  # This is an ad-hoc query
                data=json.dumps(result["data"]),
                row_count=result["row_count"],
                column_count=result["column_count"],
                execution_time=int(result["execution_time_seconds"] * 1000),  # Convert to ms
                executed_by=current_user.id,
                status="success",
                created_at=datetime.utcnow()
            )
            db.add(query_result)
            db.commit()
        
        return result
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Query execution failed: {str(e)}",
            "data": None
        }

@router.get("/{data_source_id}/sample-queries")
async def get_sample_queries(
    data_source_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get sample queries for a data source"""
    
    data_source = db.query(DataSource).filter(DataSource.id == data_source_id).first()
    if not data_source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data source not found"
        )
    
    try:
        connector = get_connector(data_source)
        samples = connector.get_sample_queries()
        return {"data_source_id": data_source_id, "sample_queries": samples}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get sample queries: {str(e)}"
        )

@router.get("/{data_source_id}/tables/{table_name}")
async def get_table_info(
    data_source_id: str,
    table_name: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific table"""
    
    data_source = db.query(DataSource).filter(DataSource.id == data_source_id).first()
    if not data_source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data source not found"
        )
    
    # Check permissions
    organization_ids = [org.id for org in current_user.organizations]
    if data_source.organization_id not in organization_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    try:
        connector = get_connector(data_source)
        table_info = await connector.get_table_info(table_name)
        return table_info
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get table info: {str(e)}"
        )

@router.delete("/{data_source_id}")
async def delete_data_source(
    data_source_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a data source"""
    
    data_source = db.query(DataSource).filter(DataSource.id == data_source_id).first()
    if not data_source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data source not found"
        )
    
    # Check permissions
    organization_ids = [org.id for org in current_user.organizations]
    if data_source.organization_id not in organization_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Soft delete
    data_source.is_active = False
    db.commit()
    
    return {"message": "Data source deleted successfully"}