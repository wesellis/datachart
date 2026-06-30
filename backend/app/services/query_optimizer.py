"""
Query Optimizer Service

Provides query optimization suggestions and performance analysis.
"""

from typing import Dict, List, Any, Optional
import re
from datetime import datetime

from app.core.logging import get_logger

logger = get_logger(__name__)

class QueryOptimizerService:
    """Service for optimizing database queries"""
    
    def __init__(self, data_source_type: str = 'snowflake'):
        self.data_source_type = data_source_type
        
    async def analyze_query(self, sql: str) -> Dict[str, Any]:
        """Analyze a SQL query and provide optimization suggestions"""
        try:
            analysis = {
                "query": sql,
                "complexity_score": self._calculate_complexity(sql),
                "estimated_cost": self._estimate_cost(sql),
                "optimization_suggestions": self._get_optimization_suggestions(sql),
                "performance_warnings": self._check_performance_issues(sql),
                "indexing_recommendations": self._get_indexing_recommendations(sql)
            }
            
            return analysis
            
        except Exception as e:
            logger.error(f"Query analysis failed: {str(e)}")
            return {
                "query": sql,
                "complexity_score": "unknown",
                "estimated_cost": "unknown",
                "optimization_suggestions": [],
                "performance_warnings": [],
                "indexing_recommendations": []
            }
    
    def _calculate_complexity(self, sql: str) -> str:
        """Calculate query complexity score"""
        try:
            sql_lower = sql.lower()
            score = 0
            
            # Base complexity factors
            if 'join' in sql_lower:
                join_count = len(re.findall(r'\bjoin\b', sql_lower))
                score += join_count * 2
            
            if 'subquery' in sql_lower or '(' in sql:
                subquery_count = sql.count('(')
                score += subquery_count
            
            if 'group by' in sql_lower:
                score += 2
                
            if 'order by' in sql_lower:
                score += 1
                
            if 'having' in sql_lower:
                score += 2
            
            # Window functions
            if 'over(' in sql_lower:
                score += 3
            
            # Determine complexity level
            if score <= 2:
                return "low"
            elif score <= 6:
                return "medium"
            elif score <= 12:
                return "high"
            else:
                return "very_high"
                
        except Exception:
            return "unknown"
    
    def _estimate_cost(self, sql: str) -> str:
        """Estimate query execution cost"""
        try:
            sql_lower = sql.lower()
            cost = 0
            
            # Table scan cost
            if 'select * from' in sql_lower:
                cost += 5
            
            # Join cost
            join_count = len(re.findall(r'\bjoin\b', sql_lower))
            cost += join_count * 3
            
            # Aggregation cost  
            if 'group by' in sql_lower:
                cost += 2
                
            if 'distinct' in sql_lower:
                cost += 2
            
            # Sort cost
            if 'order by' in sql_lower:
                cost += 1
            
            # Determine cost level
            if cost <= 3:
                return "low"
            elif cost <= 8:
                return "medium"
            elif cost <= 15:
                return "high"
            else:
                return "very_high"
                
        except Exception:
            return "unknown"
    
    def _get_optimization_suggestions(self, sql: str) -> List[Dict[str, str]]:
        """Get specific optimization suggestions"""
        suggestions = []
        sql_lower = sql.lower()
        
        try:
            # SELECT * optimization
            if 'select *' in sql_lower:
                suggestions.append({
                    "type": "performance",
                    "priority": "medium",
                    "suggestion": "Avoid SELECT * - specify only needed columns",
                    "reason": "Reduces data transfer and improves query performance",
                    "example": "SELECT col1, col2 FROM table instead of SELECT * FROM table"
                })
            
            # LIMIT clause
            if 'limit' not in sql_lower and 'top' not in sql_lower:
                suggestions.append({
                    "type": "performance", 
                    "priority": "high",
                    "suggestion": "Add LIMIT clause to prevent large result sets",
                    "reason": "Prevents accidentally returning millions of rows",
                    "example": "Add 'LIMIT 1000' to your query"
                })
            
            # WHERE clause optimization
            if 'where' not in sql_lower and 'join' not in sql_lower:
                suggestions.append({
                    "type": "performance",
                    "priority": "medium", 
                    "suggestion": "Consider adding WHERE clause to filter data",
                    "reason": "Filtering data early reduces processing overhead",
                    "example": "WHERE created_date >= CURRENT_DATE - 30"
                })
            
            # JOIN optimization
            if 'join' in sql_lower and 'on' not in sql_lower:
                suggestions.append({
                    "type": "correctness",
                    "priority": "high",
                    "suggestion": "Ensure all JOINs have proper ON conditions",
                    "reason": "Missing JOIN conditions can result in Cartesian products",
                    "example": "JOIN table2 ON table1.id = table2.foreign_id"
                })
            
            # Date filtering
            if 'date' in sql_lower and 'where' in sql_lower:
                suggestions.append({
                    "type": "performance",
                    "priority": "medium",
                    "suggestion": "Use indexed date columns for filtering",
                    "reason": "Date filters on indexed columns are much faster",
                    "example": "WHERE DATE_COLUMN >= '2024-01-01'"
                })
            
            return suggestions
            
        except Exception as e:
            logger.error(f"Failed to generate optimization suggestions: {str(e)}")
            return []
    
    def _check_performance_issues(self, sql: str) -> List[Dict[str, str]]:
        """Check for common performance issues"""
        warnings = []
        sql_lower = sql.lower()
        
        try:
            # Function in WHERE clause
            if re.search(r'where.*\w+\(.*\)\s*=', sql_lower):
                warnings.append({
                    "type": "performance",
                    "severity": "medium", 
                    "issue": "Function in WHERE clause",
                    "description": "Functions in WHERE clauses prevent index usage",
                    "recommendation": "Move functions to the right side of comparisons"
                })
            
            # OR in WHERE clause
            if ' or ' in sql_lower and 'where' in sql_lower:
                warnings.append({
                    "type": "performance",
                    "severity": "medium",
                    "issue": "OR conditions in WHERE clause", 
                    "description": "OR conditions can prevent efficient index usage",
                    "recommendation": "Consider using UNION or IN clause instead"
                })
            
            # NOT IN with NULL values
            if 'not in' in sql_lower:
                warnings.append({
                    "type": "correctness",
                    "severity": "high",
                    "issue": "NOT IN clause detected",
                    "description": "NOT IN can return unexpected results with NULL values",
                    "recommendation": "Use NOT EXISTS or filter out NULLs explicitly"
                })
            
            # Nested subqueries
            nested_level = sql.count('(') - sql.count(')')
            if nested_level > 3:
                warnings.append({
                    "type": "performance", 
                    "severity": "high",
                    "issue": "Deeply nested subqueries",
                    "description": "Complex nested queries can be slow and hard to maintain",
                    "recommendation": "Consider breaking into multiple steps or using CTEs"
                })
            
            return warnings
            
        except Exception as e:
            logger.error(f"Failed to check performance issues: {str(e)}")
            return []
    
    def _get_indexing_recommendations(self, sql: str) -> List[Dict[str, str]]:
        """Get indexing recommendations based on query patterns"""
        recommendations = []
        sql_lower = sql.lower()
        
        try:
            # Extract table and column references
            tables = re.findall(r'from\s+(\w+)', sql_lower)
            where_columns = re.findall(r'where\s+(\w+)', sql_lower)
            join_columns = re.findall(r'on\s+(\w+\.\w+)', sql_lower)
            
            # WHERE clause columns
            for column in where_columns:
                recommendations.append({
                    "type": "index",
                    "priority": "high",
                    "table": tables[0] if tables else "unknown",
                    "column": column,
                    "reason": "Column used in WHERE clause filtering",
                    "index_type": "B-tree index recommended"
                })
            
            # JOIN columns
            for join_col in join_columns:
                table, column = join_col.split('.') if '.' in join_col else ('unknown', join_col)
                recommendations.append({
                    "type": "index", 
                    "priority": "high",
                    "table": table,
                    "column": column,
                    "reason": "Column used in JOIN condition",
                    "index_type": "B-tree index recommended"
                })
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Failed to generate indexing recommendations: {str(e)}")
            return []