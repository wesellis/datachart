"""
Query Generator Service

AI-powered service to generate SQL queries from natural language descriptions.
This helps customers who aren't SQL experts build queries for their data.
"""

import asyncio
import re
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta

from app.core.logging import get_logger

logger = get_logger(__name__)

class QueryGeneratorService:
    """Service for generating SQL queries from natural language"""
    
    def __init__(self, data_source_type: str = 'snowflake'):
        self.data_source_type = data_source_type
        self.query_templates = self._load_query_templates()
        self.common_patterns = self._load_common_patterns()
        
    def _load_query_templates(self) -> Dict[str, str]:
        """Load SQL query templates based on common patterns"""
        if self.data_source_type == 'snowflake':
            return {
                'basic_select': "SELECT {columns} FROM {table} WHERE {conditions} LIMIT {limit}",
                'aggregate': "SELECT {group_by}, {aggregations} FROM {table} WHERE {conditions} GROUP BY {group_by} ORDER BY {order_by} LIMIT {limit}",
                'time_series': "SELECT DATE_TRUNC('{period}', {date_column}) as period, {aggregations} FROM {table} WHERE {date_column} >= '{start_date}' AND {date_column} <= '{end_date}' GROUP BY DATE_TRUNC('{period}', {date_column}) ORDER BY period",
                'join': "SELECT {columns} FROM {main_table} {join_type} JOIN {join_table} ON {join_condition} WHERE {conditions} LIMIT {limit}",
                'top_n': "SELECT {columns} FROM {table} WHERE {conditions} ORDER BY {order_by} DESC LIMIT {n}",
                'filter_and_sort': "SELECT {columns} FROM {table} WHERE {conditions} ORDER BY {order_by} {direction} LIMIT {limit}",
                'count_by_category': "SELECT {category_column}, COUNT(*) as count FROM {table} WHERE {conditions} GROUP BY {category_column} ORDER BY count DESC LIMIT {limit}",
                'recent_data': "SELECT {columns} FROM {table} WHERE {date_column} >= CURRENT_DATE() - INTERVAL '{days} DAY' ORDER BY {date_column} DESC LIMIT {limit}",
                'date_range': "SELECT {columns} FROM {table} WHERE {date_column} BETWEEN '{start_date}' AND '{end_date}' ORDER BY {date_column} LIMIT {limit}",
                'percentage_breakdown': "SELECT {category_column}, COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage FROM {table} WHERE {conditions} GROUP BY {category_column} ORDER BY percentage DESC"
            }
        else:
            # For API-based sources, provide equivalent concepts
            return {
                'basic_select': "GET /{endpoint}?filter={conditions}&limit={limit}",
                'aggregate': "GET /{endpoint}/aggregate?groupBy={group_by}&metrics={aggregations}",
                'time_series': "GET /{endpoint}?dateFrom={start_date}&dateTo={end_date}&groupBy={period}",
                'filter_and_sort': "GET /{endpoint}?filter={conditions}&orderBy={order_by}&limit={limit}",
                'recent_data': "GET /{endpoint}?dateFrom={recent_date}&orderBy=date desc&limit={limit}"
            }
    
    def _load_common_patterns(self) -> List[Dict[str, Any]]:
        """Load common query patterns and their intent recognition"""
        return [
            {
                'intent': 'vendor_spend_analysis',
                'patterns': ['vendor spend', 'vendor cost', 'supplier cost', 'vendor expense'],
                'template': 'aggregate',
                'default_params': {
                    'columns': 'vendor_name, SUM(amount) as total_spend',
                    'table': 'vendor_transactions',
                    'group_by': 'vendor_name',
                    'aggregations': 'SUM(amount)',
                    'order_by': 'total_spend',
                    'conditions': "status = 'completed'",
                    'limit': 50
                }
            },
            {
                'intent': 'application_usage',
                'patterns': ['app usage', 'application usage', 'software usage', 'license utilization'],
                'template': 'aggregate',
                'default_params': {
                    'columns': 'application_name, COUNT(DISTINCT user_id) as active_users',
                    'table': 'application_usage',
                    'group_by': 'application_name',
                    'aggregations': 'COUNT(DISTINCT user_id)',
                    'order_by': 'active_users',
                    'conditions': "usage_date >= CURRENT_DATE() - 30",
                    'limit': 20
                }
            },
            {
                'intent': 'cost_trends',
                'patterns': ['cost trend', 'spending trend', 'expense trend', 'cost over time'],
                'template': 'time_series',
                'default_params': {
                    'period': 'month',
                    'date_column': 'transaction_date',
                    'aggregations': 'SUM(amount) as total_cost',
                    'table': 'financial_transactions',
                    'start_date': (datetime.now() - timedelta(days=365)).strftime('%Y-%m-%d'),
                    'end_date': datetime.now().strftime('%Y-%m-%d')
                }
            },
            {
                'intent': 'top_vendors',
                'patterns': ['top vendor', 'largest vendor', 'biggest supplier', 'highest spend'],
                'template': 'top_n',
                'default_params': {
                    'columns': 'vendor_name, SUM(amount) as total_spend',
                    'table': 'vendor_transactions',
                    'order_by': 'SUM(amount)',
                    'conditions': "status = 'active'",
                    'n': 10
                }
            },
            {
                'intent': 'recent_activities',
                'patterns': ['recent', 'latest', 'last week', 'past month', 'new'],
                'template': 'recent_data',
                'default_params': {
                    'columns': '*',
                    'date_column': 'created_date',
                    'days': 7,
                    'limit': 100
                }
            },
            {
                'intent': 'compliance_status',
                'patterns': ['compliance', 'compliant', 'non-compliant', 'policy violation'],
                'template': 'count_by_category',
                'default_params': {
                    'columns': 'compliance_status, COUNT(*) as count',
                    'table': 'compliance_checks',
                    'category_column': 'compliance_status',
                    'conditions': "check_date >= CURRENT_DATE() - 30",
                    'limit': 10
                }
            },
            {
                'intent': 'user_analytics',
                'patterns': ['user activity', 'user behavior', 'user engagement', 'active users'],
                'template': 'aggregate',
                'default_params': {
                    'columns': 'department, COUNT(DISTINCT user_id) as active_users',
                    'table': 'user_activities',
                    'group_by': 'department',
                    'aggregations': 'COUNT(DISTINCT user_id)',
                    'order_by': 'active_users',
                    'conditions': "activity_date >= CURRENT_DATE() - 30",
                    'limit': 20
                }
            },
            {
                'intent': 'resource_utilization',
                'patterns': ['resource usage', 'utilization', 'capacity', 'resource allocation'],
                'template': 'aggregate',
                'default_params': {
                    'columns': 'resource_type, AVG(utilization_percentage) as avg_utilization',
                    'table': 'resource_metrics',
                    'group_by': 'resource_type',
                    'aggregations': 'AVG(utilization_percentage)',
                    'order_by': 'avg_utilization',
                    'conditions': "metric_date >= CURRENT_DATE() - 7",
                    'limit': 15
                }
            }
        ]
    
    async def generate_query(self, description: str, tables: List[str] = None, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate SQL query from natural language description"""
        try:
            logger.info(f"Generating query for description: {description}")
            
            # Clean and normalize the description
            normalized_description = self._normalize_description(description)
            
            # Identify the intent
            intent = self._identify_intent(normalized_description)
            
            # Extract entities (tables, columns, values)
            entities = self._extract_entities(normalized_description, tables or [])
            
            # Generate the query based on intent and entities
            query_result = self._generate_query_from_intent(intent, entities, context or {})
            
            # Add explanation
            explanation = self._generate_explanation(intent, entities, query_result['sql'])
            
            return {
                'sql': query_result['sql'],
                'explanation': explanation,
                'intent': intent['intent'],
                'confidence': intent['confidence'],
                'parameters': query_result.get('parameters', []),
                'suggested_visualizations': self._suggest_visualizations(intent['intent'])
            }
            
        except Exception as e:
            logger.error(f"Failed to generate query: {str(e)}")
            return {
                'sql': 'SELECT * FROM information_schema.tables LIMIT 10;',
                'explanation': 'Generated fallback query due to processing error',
                'intent': 'fallback',
                'confidence': 0.1,
                'parameters': [],
                'error': str(e)
            }
    
    def _normalize_description(self, description: str) -> str:
        """Normalize the description for better processing"""
        # Convert to lowercase
        normalized = description.lower()
        
        # Remove extra whitespace
        normalized = ' '.join(normalized.split())
        
        # Remove punctuation except for important ones
        normalized = re.sub(r'[^\w\s\-\._]', ' ', normalized)
        
        return normalized.strip()
    
    def _identify_intent(self, description: str) -> Dict[str, Any]:
        """Identify the user's intent from the description"""
        best_match = {
            'intent': 'basic_select',
            'confidence': 0.1,
            'pattern': None
        }
        
        for pattern_def in self.common_patterns:
            for pattern in pattern_def['patterns']:
                if pattern in description:
                    confidence = len(pattern.split()) / len(description.split())
                    if confidence > best_match['confidence']:
                        best_match = {
                            'intent': pattern_def['intent'],
                            'confidence': min(confidence, 0.9),
                            'pattern': pattern_def
                        }
        
        return best_match
    
    def _extract_entities(self, description: str, available_tables: List[str]) -> Dict[str, Any]:
        """Extract entities (tables, columns, values) from the description"""
        entities = {
            'tables': [],
            'columns': [],
            'values': [],
            'time_references': [],
            'aggregations': [],
            'conditions': []
        }
        
        # Extract table references
        for table in available_tables:
            table_lower = table.lower()
            if table_lower in description or any(keyword in table_lower for keyword in description.split()):
                entities['tables'].append(table)
        
        # Extract common column patterns
        column_patterns = {
            'date': ['date', 'time', 'created', 'updated', 'timestamp'],
            'amount': ['amount', 'cost', 'price', 'spend', 'value', 'total'],
            'name': ['name', 'title', 'label', 'description'],
            'status': ['status', 'state', 'condition', 'flag'],
            'count': ['count', 'number', 'quantity', 'total'],
            'user': ['user', 'person', 'employee', 'customer', 'client']
        }
        
        for column_type, keywords in column_patterns.items():
            if any(keyword in description for keyword in keywords):
                entities['columns'].append(column_type)
        
        # Extract time references
        time_patterns = [
            ('last week', 7), ('past week', 7), ('this week', 7),
            ('last month', 30), ('past month', 30), ('this month', 30),
            ('last year', 365), ('past year', 365), ('this year', 365),
            ('yesterday', 1), ('today', 0), ('recent', 7)
        ]
        
        for pattern, days in time_patterns:
            if pattern in description:
                entities['time_references'].append({
                    'pattern': pattern,
                    'days': days,
                    'start_date': (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d'),
                    'end_date': datetime.now().strftime('%Y-%m-%d')
                })
        
        # Extract aggregation hints
        aggregation_patterns = ['total', 'sum', 'count', 'average', 'max', 'min', 'avg']
        for pattern in aggregation_patterns:
            if pattern in description:
                entities['aggregations'].append(pattern.upper() if pattern in ['sum', 'max', 'min'] else 'COUNT' if pattern == 'count' else 'AVG')
        
        # Extract condition hints
        if 'active' in description:
            entities['conditions'].append("status = 'active'")
        if 'completed' in description:
            entities['conditions'].append("status = 'completed'")
        if 'failed' in description:
            entities['conditions'].append("status = 'failed'")
        
        return entities
    
    def _generate_query_from_intent(self, intent: Dict[str, Any], entities: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Generate SQL query based on identified intent and entities"""
        pattern = intent.get('pattern')
        if not pattern:
            # Fallback query
            return {
                'sql': 'SELECT * FROM information_schema.tables LIMIT 10;',
                'parameters': []
            }
        
        template_name = pattern.get('template', 'basic_select')
        template = self.query_templates.get(template_name, self.query_templates['basic_select'])
        default_params = pattern.get('default_params', {}).copy()
        
        # Override defaults with extracted entities
        params = self._merge_params_with_entities(default_params, entities, context)
        
        # Generate the SQL
        try:
            sql = template.format(**params)
            
            # Extract parameters that need user input
            parameters = self._extract_parameters(sql)
            
            return {
                'sql': sql,
                'parameters': parameters
            }
            
        except KeyError as e:
            logger.warning(f"Missing parameter {e} for template {template_name}")
            # Return a simpler query
            simple_table = entities.get('tables', ['information_schema.tables'])[0]
            return {
                'sql': f'SELECT * FROM {simple_table} LIMIT 100;',
                'parameters': []
            }
    
    def _merge_params_with_entities(self, default_params: Dict[str, Any], entities: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """Merge default parameters with extracted entities"""
        params = default_params.copy()
        
        # Use extracted tables if available
        if entities.get('tables'):
            params['table'] = entities['tables'][0]
            params['main_table'] = entities['tables'][0]
            if len(entities['tables']) > 1:
                params['join_table'] = entities['tables'][1]
        
        # Use time references
        if entities.get('time_references'):
            time_ref = entities['time_references'][0]
            params['start_date'] = time_ref['start_date']
            params['end_date'] = time_ref['end_date']
            params['recent_date'] = time_ref['start_date']
        
        # Use aggregations
        if entities.get('aggregations'):
            agg = entities['aggregations'][0]
            if 'aggregations' in params:
                params['aggregations'] = params['aggregations'].replace('SUM(amount)', f'{agg}(amount)')
        
        # Use conditions
        if entities.get('conditions'):
            existing_conditions = params.get('conditions', '')
            new_conditions = ' AND '.join(entities['conditions'])
            if existing_conditions:
                params['conditions'] = f"{existing_conditions} AND {new_conditions}"
            else:
                params['conditions'] = new_conditions
        
        # Set defaults for missing parameters
        params.setdefault('columns', '*')
        params.setdefault('limit', 100)
        params.setdefault('conditions', '1=1')
        params.setdefault('order_by', '1')
        params.setdefault('direction', 'DESC')
        params.setdefault('period', 'day')
        params.setdefault('join_type', 'LEFT')
        params.setdefault('join_condition', '1=1')
        params.setdefault('n', 10)
        
        return params
    
    def _extract_parameters(self, sql: str) -> List[Dict[str, Any]]:
        """Extract parameters that need user input from the generated SQL"""
        parameters = []
        
        # Look for common parameter patterns
        if '{{' in sql and '}}' in sql:
            # Extract {{parameter}} patterns
            param_pattern = r'\{\{(\w+)\}\}'
            matches = re.findall(param_pattern, sql)
            
            for param_name in set(matches):
                param_type = 'string'
                if 'date' in param_name.lower():
                    param_type = 'date'
                elif any(word in param_name.lower() for word in ['count', 'limit', 'id', 'number']):
                    param_type = 'number'
                
                parameters.append({
                    'name': param_name,
                    'type': param_type,
                    'required': True,
                    'description': f'Value for {param_name.replace("_", " ")}'
                })
        
        return parameters
    
    def _generate_explanation(self, intent: Dict[str, Any], entities: Dict[str, Any], sql: str) -> str:
        """Generate human-readable explanation of the query"""
        intent_name = intent.get('intent', 'basic_select')
        
        explanations = {
            'vendor_spend_analysis': 'This query analyzes vendor spending by summing up transaction amounts grouped by vendor name',
            'application_usage': 'This query shows application usage statistics by counting active users per application',
            'cost_trends': 'This query displays cost trends over time by aggregating expenses by time period',
            'top_vendors': 'This query finds the top vendors by total spending amount',
            'recent_activities': 'This query retrieves the most recent activities or records',
            'compliance_status': 'This query shows compliance status distribution by counting records in each status category',
            'user_analytics': 'This query analyzes user activity patterns and engagement metrics',
            'resource_utilization': 'This query shows resource utilization statistics and capacity metrics'
        }
        
        base_explanation = explanations.get(intent_name, 'This query retrieves data based on your request')
        
        # Add entity details
        details = []
        if entities.get('tables'):
            details.append(f"from the {', '.join(entities['tables'])} table(s)")
        
        if entities.get('time_references'):
            time_ref = entities['time_references'][0]
            details.append(f"for the {time_ref['pattern']}")
        
        if entities.get('conditions'):
            details.append(f"with conditions: {', '.join(entities['conditions'])}")
        
        if details:
            return f"{base_explanation} {' '.join(details)}."
        else:
            return f"{base_explanation}."
    
    def _suggest_visualizations(self, intent: str) -> List[str]:
        """Suggest appropriate visualizations based on query intent"""
        visualization_mapping = {
            'vendor_spend_analysis': ['bar_chart', 'pie_chart', 'table'],
            'application_usage': ['bar_chart', 'donut_chart', 'heatmap'],
            'cost_trends': ['line_chart', 'area_chart', 'bar_chart'],
            'top_vendors': ['bar_chart', 'horizontal_bar', 'table'],
            'recent_activities': ['table', 'timeline', 'list'],
            'compliance_status': ['pie_chart', 'donut_chart', 'gauge'],
            'user_analytics': ['bar_chart', 'line_chart', 'heatmap'],
            'resource_utilization': ['gauge', 'bar_chart', 'line_chart'],
            'basic_select': ['table', 'card']
        }
        
        return visualization_mapping.get(intent, ['table', 'bar_chart'])
    
    def get_query_suggestions(self, partial_query: str, available_tables: List[str]) -> List[Dict[str, Any]]:
        """Get query suggestions based on partial input"""
        suggestions = []
        
        # Common query starters
        starters = [
            "Show me the top 10 vendors by spend",
            "What is the total cost for last month",
            "List all applications with more than 100 users",
            "Show vendor spending trends over the past year",
            "Find all non-compliant resources",
            "What are the most used applications",
            "Show recent user activities",
            "List all active users by department"
        ]
        
        # Filter suggestions based on partial input
        if partial_query:
            partial_lower = partial_query.lower()
            for starter in starters:
                if any(word in starter.lower() for word in partial_lower.split()):
                    suggestions.append({
                        'suggestion': starter,
                        'confidence': 0.8,
                        'category': 'common_queries'
                    })
        else:
            # Return all suggestions if no partial query
            suggestions = [
                {
                    'suggestion': starter,
                    'confidence': 0.7,
                    'category': 'common_queries'
                } for starter in starters
            ]
        
        return suggestions[:5]  # Return top 5 suggestions