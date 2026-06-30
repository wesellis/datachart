"""
Data Sources API Endpoints

Provides comprehensive API for data source configuration, discovery, and management.
This is the critical missing piece that allows customers to:
- Choose what data to pull in
- Understand what data is being ingested
- Set parameters for dynamic queries
- Validate data quality and preview results
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi import Query as QueryParam
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any, Union
import json
import asyncio
from datetime import datetime, timedelta

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.data_source import DataSource, DataQuery, QueryParameter, QueryExecution
# Import services with error handling for missing dependencies
try:
    from app.services.snowflake_service import SnowflakeService
except ImportError:
    SnowflakeService = None

try:
    from app.services.azure_service import AzureService
except ImportError:
    AzureService = None
    
try:
    from app.services.servicenow_service import ServiceNowService
except ImportError:
    ServiceNowService = None
    
try:
    from app.services.intune_service import IntuneService
except ImportError:
    IntuneService = None
    
try:
    from app.services.query_optimizer import QueryOptimizerService
except ImportError:
    QueryOptimizerService = None
    
try:
    from app.services.data_quality_service import DataQualityService
except ImportError:
    DataQualityService = None
    
try:
    from app.services.query_generator import QueryGeneratorService
except ImportError:
    QueryGeneratorService = None
from app.core.logging import get_logger

router = APIRouter()
logger = get_logger(__name__)

# Data source service mapping (with None checks for missing dependencies)
SERVICE_MAPPING = {}
if SnowflakeService:
    SERVICE_MAPPING['snowflake'] = SnowflakeService
if AzureService:
    SERVICE_MAPPING['azure'] = AzureService
if ServiceNowService:
    SERVICE_MAPPING['servicenow'] = ServiceNowService
if IntuneService:
    SERVICE_MAPPING['intune'] = IntuneService

@router.get("/", response_model=List[Dict[str, Any]])
async def get_data_sources(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all data sources configured for the current user's organization"""
    try:
        data_sources = db.query(DataSource).filter(
            DataSource.organization_id == current_user.organization_id,
            DataSource.is_active == True
        ).all()
        
        result = []
        for ds in data_sources:
            # Get query count and last execution info
            query_count = db.query(DataQuery).filter(
                DataQuery.data_source_id == ds.id,
                DataQuery.is_active == True
            ).count()
            
            last_execution = db.query(QueryExecution).filter(
                QueryExecution.data_source_id == ds.id
            ).order_by(QueryExecution.executed_at.desc()).first()
            
            result.append({
                "id": ds.id,
                "name": ds.name,
                "type": ds.type,
                "connection": ds.connection_config,
                "queries": [q.to_dict() for q in ds.queries if q.is_active],
                "parameters": [p.to_dict() for p in ds.parameters],
                "schedule": {
                    "enabled": ds.schedule_enabled,
                    "frequency": ds.schedule_frequency,
                    "last_run": last_execution.executed_at.isoformat() if last_execution else None,
                    "next_run": ds.next_scheduled_run.isoformat() if ds.next_scheduled_run else None
                },
                "validation": {
                    "row_count_min": ds.validation_row_count_min,
                    "row_count_max": ds.validation_row_count_max,
                    "required_columns": ds.validation_required_columns or [],
                    "data_quality_checks": ds.validation_quality_checks or []
                }
            })
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to get data sources: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve data sources")

@router.get("/{data_source_id}")
async def get_data_source(
    data_source_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific data source"""
    try:
        data_source = db.query(DataSource).filter(
            DataSource.id == data_source_id,
            DataSource.organization_id == current_user.organization_id
        ).first()
        
        if not data_source:
            raise HTTPException(status_code=404, detail="Data source not found")
        
        return {
            "id": data_source.id,
            "name": data_source.name,
            "type": data_source.type,
            "connection": data_source.connection_config,
            "queries": [q.to_dict() for q in data_source.queries if q.is_active],
            "parameters": [p.to_dict() for p in data_source.parameters],
            "schedule": {
                "enabled": data_source.schedule_enabled,
                "frequency": data_source.schedule_frequency,
                "last_run": None,  # TODO: Get from executions
                "next_run": data_source.next_scheduled_run.isoformat() if data_source.next_scheduled_run else None
            },
            "validation": {
                "row_count_min": data_source.validation_row_count_min,
                "row_count_max": data_source.validation_row_count_max,
                "required_columns": data_source.validation_required_columns or [],
                "data_quality_checks": data_source.validation_quality_checks or []
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get data source {data_source_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve data source")

@router.post("/{data_source_id}/test-connection")
async def test_connection(
    data_source_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Test connection to a data source"""
    try:
        data_source = db.query(DataSource).filter(
            DataSource.id == data_source_id,
            DataSource.organization_id == current_user.organization_id
        ).first()
        
        if not data_source:
            raise HTTPException(status_code=404, detail="Data source not found")
        
        # Get appropriate service
        service_class = SERVICE_MAPPING.get(data_source.type)
        if not service_class:
            raise HTTPException(status_code=400, detail=f"Unsupported data source type: {data_source.type}")
        
        service = service_class(data_source.connection_config)
        success = await service.test_connection()
        
        return {"success": success}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Connection test failed for {data_source_id}: {str(e)}")
        return {"success": False, "error": str(e)}

@router.get("/{data_source_id}/discover")
async def discover_tables(
    data_source_id: str,
    schema: Optional[str] = QueryParam(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Discover available tables and views in a data source"""
    try:
        data_source = db.query(DataSource).filter(
            DataSource.id == data_source_id,
            DataSource.organization_id == current_user.organization_id
        ).first()
        
        if not data_source:
            raise HTTPException(status_code=404, detail="Data source not found")
        
        # Get appropriate service
        service_class = SERVICE_MAPPING.get(data_source.type)
        if not service_class:
            raise HTTPException(status_code=400, detail=f"Unsupported data source type: {data_source.type}")
        
        service = service_class(data_source.connection_config)
        
        if data_source.type == 'snowflake':
            tables = await service.discover_tables(schema)
        else:
            # For API-based sources, discover available endpoints/data types
            tables = await service.discover_data_sources()
        
        return tables
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Table discovery failed for {data_source_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to discover tables")

@router.get("/{data_source_id}/tables/{schema}/{table}")
async def get_table_details(
    data_source_id: str,
    schema: str,
    table: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific table"""
    try:
        data_source = db.query(DataSource).filter(
            DataSource.id == data_source_id,
            DataSource.organization_id == current_user.organization_id
        ).first()
        
        if not data_source:
            raise HTTPException(status_code=404, detail="Data source not found")
        
        service_class = SERVICE_MAPPING.get(data_source.type)
        if not service_class:
            raise HTTPException(status_code=400, detail=f"Unsupported data source type: {data_source.type}")
        
        service = service_class(data_source.connection_config)
        table_info = await service.get_table_schema(schema, table)
        
        return table_info
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get table details for {schema}.{table}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve table details")

@router.get("/{data_source_id}/tables/{schema}/{table}/preview")
async def preview_table(
    data_source_id: str,
    schema: str,
    table: str,
    limit: int = QueryParam(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Preview data from a specific table"""
    try:
        data_source = db.query(DataSource).filter(
            DataSource.id == data_source_id,
            DataSource.organization_id == current_user.organization_id
        ).first()
        
        if not data_source:
            raise HTTPException(status_code=404, detail="Data source not found")
        
        service_class = SERVICE_MAPPING.get(data_source.type)
        if not service_class:
            raise HTTPException(status_code=400, detail=f"Unsupported data source type: {data_source.type}")
        
        service = service_class(data_source.connection_config)
        
        # Execute a simple SELECT query to preview data
        sql = f"SELECT * FROM {schema}.{table} LIMIT {limit}"
        result = await service.execute_query(sql)
        
        return {
            "columns": result.get("columns", []),
            "data": result.get("data", [])
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to preview table {schema}.{table}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to preview table data")

@router.post("/{data_source_id}/validate-query")
async def validate_query(
    data_source_id: str,
    request: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Validate a SQL query and return preview data"""
    try:
        data_source = db.query(DataSource).filter(
            DataSource.id == data_source_id,
            DataSource.organization_id == current_user.organization_id
        ).first()
        
        if not data_source:
            raise HTTPException(status_code=404, detail="Data source not found")
        
        sql = request.get("sql")
        parameters = request.get("parameters", {})
        
        if not sql:
            raise HTTPException(status_code=400, detail="SQL query is required")
        
        service_class = SERVICE_MAPPING.get(data_source.type)
        if not service_class:
            raise HTTPException(status_code=400, detail=f"Unsupported data source type: {data_source.type}")
        
        service = service_class(data_source.connection_config)
        
        # Start timing
        start_time = datetime.now()
        
        try:
            # For validation, we'll run the query with LIMIT to get a preview
            validation_sql = f"SELECT * FROM ({sql}) preview_query LIMIT 100"
            
            # Replace parameters in query
            processed_sql = validation_sql
            for param, value in parameters.items():
                placeholder = f"{{{{{param}}}}}"
                processed_sql = processed_sql.replace(placeholder, str(value))
            
            result = await service.execute_query(processed_sql)
            execution_time = (datetime.now() - start_time).total_seconds() * 1000
            
            # Estimate total rows by running count query
            count_sql = f"SELECT COUNT(*) as row_count FROM ({sql}) count_query"
            count_result = await service.execute_query(count_sql)
            estimated_rows = count_result.get("data", [{}])[0].get("row_count", 0)
            
            return {
                "valid": True,
                "estimated_rows": estimated_rows,
                "columns": result.get("columns", []),
                "preview_data": result.get("data", []),
                "execution_time": execution_time
            }
            
        except Exception as query_error:
            execution_time = (datetime.now() - start_time).total_seconds() * 1000
            return {
                "valid": False,
                "estimated_rows": 0,
                "columns": [],
                "preview_data": [],
                "execution_time": execution_time,
                "error": str(query_error)
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Query validation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to validate query")

@router.post("/{data_source_id}/execute-query")
async def execute_query(
    data_source_id: str,
    request: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Execute a specific query with parameters"""
    try:
        data_source = db.query(DataSource).filter(
            DataSource.id == data_source_id,
            DataSource.organization_id == current_user.organization_id
        ).first()
        
        if not data_source:
            raise HTTPException(status_code=404, detail="Data source not found")
        
        query_id = request.get("query_id")
        parameters = request.get("parameters", {})
        limit = request.get("limit", 1000)
        
        if not query_id:
            raise HTTPException(status_code=400, detail="Query ID is required")
        
        # Get the query
        query = db.query(DataQuery).filter(
            DataQuery.id == query_id,
            DataQuery.data_source_id == data_source_id
        ).first()
        
        if not query:
            raise HTTPException(status_code=404, detail="Query not found")
        
        service_class = SERVICE_MAPPING.get(data_source.type)
        if not service_class:
            raise HTTPException(status_code=400, detail=f"Unsupported data source type: {data_source.type}")
        
        service = service_class(data_source.connection_config)
        
        # Start timing
        start_time = datetime.now()
        
        # Process query with parameters and limit
        processed_sql = query.sql
        for param, value in parameters.items():
            placeholder = f"{{{{{param}}}}}"
            processed_sql = processed_sql.replace(placeholder, str(value))
        
        # Add limit if not already present
        if "LIMIT" not in processed_sql.upper():
            processed_sql += f" LIMIT {limit}"
        
        result = await service.execute_query(processed_sql)
        execution_time = (datetime.now() - start_time).total_seconds() * 1000
        
        # Log the execution
        execution_record = QueryExecution(
            data_source_id=data_source_id,
            query_id=query_id,
            executed_by=current_user.id,
            executed_at=datetime.now(),
            execution_time_ms=execution_time,
            row_count=len(result.get("data", [])),
            parameters=parameters,
            status="success"
        )
        db.add(execution_record)
        db.commit()
        
        return {
            "columns": result.get("columns", []),
            "data": result.get("data", []),
            "execution_time": execution_time
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Query execution failed: {str(e)}")
        
        # Log the failed execution
        try:
            execution_record = QueryExecution(
                data_source_id=data_source_id,
                query_id=request.get("query_id"),
                executed_by=current_user.id,
                executed_at=datetime.now(),
                execution_time_ms=0,
                row_count=0,
                parameters=request.get("parameters", {}),
                status="error",
                error=str(e)
            )
            db.add(execution_record)
            db.commit()
        except:
            pass
        
        raise HTTPException(status_code=500, detail="Failed to execute query")

@router.get("/{data_source_id}/query-history")
async def get_query_history(
    data_source_id: str,
    query_id: Optional[str] = QueryParam(None),
    limit: int = QueryParam(50, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get query execution history"""
    try:
        data_source = db.query(DataSource).filter(
            DataSource.id == data_source_id,
            DataSource.organization_id == current_user.organization_id
        ).first()
        
        if not data_source:
            raise HTTPException(status_code=404, detail="Data source not found")
        
        query = db.query(QueryExecution).filter(
            QueryExecution.data_source_id == data_source_id
        )
        
        if query_id:
            query = query.filter(QueryExecution.query_id == query_id)
        
        executions = query.order_by(QueryExecution.executed_at.desc()).limit(limit).all()
        
        return [
            {
                "id": exec.id,
                "query_id": exec.query_id,
                "executed_at": exec.executed_at.isoformat(),
                "execution_time": exec.execution_time_ms,
                "row_count": exec.row_count,
                "status": exec.status,
                "error": exec.error
            }
            for exec in executions
        ]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get query history: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve query history")

@router.post("/{data_source_id}/generate-query")
async def generate_query(
    data_source_id: str,
    request: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate SQL query from natural language description"""
    try:
        data_source = db.query(DataSource).filter(
            DataSource.id == data_source_id,
            DataSource.organization_id == current_user.organization_id
        ).first()
        
        if not data_source:
            raise HTTPException(status_code=404, detail="Data source not found")
        
        description = request.get("description")
        tables = request.get("tables", [])
        
        if not description:
            raise HTTPException(status_code=400, detail="Description is required")
        
        # Use AI query generator service
        generator = QueryGeneratorService(data_source.type)
        result = await generator.generate_query(description, tables)
        
        return {
            "sql": result["sql"],
            "explanation": result["explanation"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Query generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate query")

@router.get("/{data_source_id}/data-quality")
async def get_data_quality_metrics(
    data_source_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get data quality metrics for a data source"""
    try:
        data_source = db.query(DataSource).filter(
            DataSource.id == data_source_id,
            DataSource.organization_id == current_user.organization_id
        ).first()
        
        if not data_source:
            raise HTTPException(status_code=404, detail="Data source not found")
        
        # Use data quality service
        quality_service = DataQualityService(data_source)
        metrics = await quality_service.get_quality_metrics()
        
        return metrics
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get data quality metrics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve data quality metrics")

@router.post("/{data_source_id}/data-quality/run")
async def run_data_quality_checks(
    data_source_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Run data quality checks"""
    try:
        data_source = db.query(DataSource).filter(
            DataSource.id == data_source_id,
            DataSource.organization_id == current_user.organization_id
        ).first()
        
        if not data_source:
            raise HTTPException(status_code=404, detail="Data source not found")
        
        # Run quality checks asynchronously
        quality_service = DataQualityService(data_source)
        await quality_service.run_quality_checks()
        
        return {"message": "Data quality checks started"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to run data quality checks: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to run data quality checks")

@router.post("/{data_source_id}/parameter-suggestions")
async def get_parameter_suggestions(
    data_source_id: str,
    request: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get parameter suggestions based on SQL query"""
    try:
        data_source = db.query(DataSource).filter(
            DataSource.id == data_source_id,
            DataSource.organization_id == current_user.organization_id
        ).first()
        
        if not data_source:
            raise HTTPException(status_code=404, detail="Data source not found")
        
        sql = request.get("sql")
        if not sql:
            raise HTTPException(status_code=400, detail="SQL query is required")
        
        # Parse SQL to find parameter placeholders
        import re
        
        # Find {{parameter_name}} patterns
        parameter_pattern = r'\{\{(\w+)\}\}'
        matches = re.findall(parameter_pattern, sql)
        
        suggestions = []
        for param_name in set(matches):
            # Try to infer parameter type from context
            param_type = "string"  # default
            
            if "date" in param_name.lower() or "time" in param_name.lower():
                param_type = "date"
            elif "count" in param_name.lower() or "limit" in param_name.lower() or "id" in param_name.lower():
                param_type = "number"
            
            suggestions.append({
                "name": param_name,
                "type": param_type,
                "default_value": "",
                "description": f"Parameter for {param_name}",
                "required": True,
                "options": None
            })
        
        return suggestions
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get parameter suggestions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get parameter suggestions")

@router.post("/{data_source_id}/queries")
async def create_query(
    data_source_id: str,
    request: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new query within a data source"""
    try:
        data_source = db.query(DataSource).filter(
            DataSource.id == data_source_id,
            DataSource.organization_id == current_user.organization_id
        ).first()
        
        if not data_source:
            raise HTTPException(status_code=404, detail="Data source not found")
        
        query = DataQuery(
            data_source_id=data_source_id,
            name=request["name"],
            description=request.get("description", ""),
            sql=request["sql"],
            parameters=request.get("parameters", []),
            estimated_rows=request.get("estimated_rows", 0),
            status=request.get("status", "draft"),
            created_by=current_user.id
        )
        
        db.add(query)
        db.commit()
        db.refresh(query)
        
        return query.to_dict()
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create query: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create query")

@router.get("/{data_source_id}/usage")
async def get_usage_statistics(
    data_source_id: str,
    period: str = QueryParam("week", pattern="^(day|week|month)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get usage statistics for a data source"""
    try:
        data_source = db.query(DataSource).filter(
            DataSource.id == data_source_id,
            DataSource.organization_id == current_user.organization_id
        ).first()
        
        if not data_source:
            raise HTTPException(status_code=404, detail="Data source not found")
        
        # Calculate date range based on period
        end_date = datetime.now()
        if period == "day":
            start_date = end_date - timedelta(days=1)
        elif period == "week":
            start_date = end_date - timedelta(weeks=1)
        else:  # month
            start_date = end_date - timedelta(days=30)
        
        # Get executions in the period
        executions = db.query(QueryExecution).filter(
            QueryExecution.data_source_id == data_source_id,
            QueryExecution.executed_at >= start_date,
            QueryExecution.status == "success"
        ).all()
        
        total_queries = len(executions)
        total_rows = sum(exec.row_count for exec in executions)
        avg_execution_time = sum(exec.execution_time_ms for exec in executions) / total_queries if total_queries > 0 else 0
        
        # Most used queries
        query_counts = {}
        for exec in executions:
            query_counts[exec.query_id] = query_counts.get(exec.query_id, 0) + 1
        
        most_used_queries = []
        for query_id, count in sorted(query_counts.items(), key=lambda x: x[1], reverse=True)[:5]:
            query = db.query(DataQuery).filter(DataQuery.id == query_id).first()
            if query:
                most_used_queries.append({
                    "query_id": query_id,
                    "query_name": query.name,
                    "execution_count": count
                })
        
        # Timeline data (simplified)
        timeline = [
            {
                "timestamp": end_date.isoformat(),
                "query_count": total_queries,
                "row_count": total_rows,
                "average_time": avg_execution_time
            }
        ]
        
        return {
            "total_queries": total_queries,
            "total_rows_processed": total_rows,
            "average_execution_time": avg_execution_time,
            "most_used_queries": most_used_queries,
            "timeline": timeline
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get usage statistics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve usage statistics")