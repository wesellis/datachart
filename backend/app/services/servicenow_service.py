"""
ServiceNow Integration Service for DataChart
Handles ITSM, CMDB, and incident management data
"""

import asyncio
import json
import logging
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from functools import lru_cache
import base64

import requests
from requests.auth import HTTPBasicAuth
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

logger = logging.getLogger(__name__)


class ServiceNowService:
    """
    ServiceNow integration service for DataChart
    Provides access to ITSM, CMDB, incidents, changes, and problems
    """
    
    def __init__(self, credentials: Dict[str, str]):
        """
        Initialize ServiceNow service with customer credentials
        
        Args:
            credentials: Dict containing:
                - instance_url: ServiceNow instance URL (e.g., https://company.service-now.com)
                - username: ServiceNow username
                - password: ServiceNow password
                - client_id: OAuth client ID (optional)
                - client_secret: OAuth client secret (optional)
        """
        self.instance_url = credentials.get('instance_url', '').rstrip('/')
        self.username = credentials.get('username')
        self.password = credentials.get('password')
        self.client_id = credentials.get('client_id')
        self.client_secret = credentials.get('client_secret')
        
        # Setup session with retry strategy
        self.session = requests.Session()
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
        
        # Set authentication
        if self.username and self.password:
            self.session.auth = HTTPBasicAuth(self.username, self.password)
        
        # Set headers
        self.session.headers.update({
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        })
        
        # OAuth token if using OAuth
        self.access_token = None
        self.token_expires_at = None
        
        # Performance metrics
        self.query_metrics = {
            'total_queries': 0,
            'failed_queries': 0,
            'avg_response_time': 0,
            'last_query_time': None
        }
        
        # Cache for frequently accessed data
        self._cache = {}
        self._cache_ttl = 300  # 5 minutes
        
        logger.info(f"Initialized ServiceNow service for instance {self.instance_url}")
    
    # ==================== INCIDENT MANAGEMENT ====================
    
    async def query_incidents(self,
                             state: Optional[str] = None,
                             priority: Optional[int] = None,
                             assignment_group: Optional[str] = None,
                             date_range: Optional[Dict] = None,
                             limit: int = 1000) -> Dict:
        """
        Query incidents from ServiceNow
        
        Args:
            state: Filter by state (new, in_progress, resolved, closed)
            priority: Filter by priority (1-5)
            assignment_group: Filter by assignment group
            date_range: Date range filter
            limit: Maximum number of records
        
        Returns:
            Incident data with metrics and analytics
        """
        try:
            start_time = datetime.utcnow()
            
            # Build query parameters
            params = {
                'sysparm_limit': limit,
                'sysparm_display_value': 'true',
                'sysparm_exclude_reference_link': 'true'
            }
            
            # Build query filter
            query_parts = []
            if state:
                state_map = {
                    'new': '1',
                    'in_progress': '2',
                    'on_hold': '3',
                    'resolved': '6',
                    'closed': '7',
                    'canceled': '8'
                }
                query_parts.append(f"state={state_map.get(state, state)}")
            
            if priority:
                query_parts.append(f"priority={priority}")
            
            if assignment_group:
                query_parts.append(f"assignment_group.name={assignment_group}")
            
            if date_range:
                if 'start' in date_range:
                    query_parts.append(f"opened_at>={date_range['start']}")
                if 'end' in date_range:
                    query_parts.append(f"opened_at<={date_range['end']}")
            
            if query_parts:
                params['sysparm_query'] = '^'.join(query_parts)
            
            # Make API request
            url = f"{self.instance_url}/api/now/table/incident"
            response = await self._make_request('GET', url, params=params)
            
            if not response['success']:
                return response
            
            incidents = response['data'].get('result', [])
            
            # Process incidents
            processed_incidents = []
            for incident in incidents:
                processed_incidents.append({
                    'number': incident.get('number'),
                    'sys_id': incident.get('sys_id'),
                    'short_description': incident.get('short_description'),
                    'description': incident.get('description'),
                    'state': incident.get('state'),
                    'priority': incident.get('priority'),
                    'urgency': incident.get('urgency'),
                    'impact': incident.get('impact'),
                    'category': incident.get('category'),
                    'subcategory': incident.get('subcategory'),
                    'assignment_group': incident.get('assignment_group'),
                    'assigned_to': incident.get('assigned_to'),
                    'caller': incident.get('caller_id'),
                    'opened_at': incident.get('opened_at'),
                    'resolved_at': incident.get('resolved_at'),
                    'closed_at': incident.get('closed_at'),
                    'resolution_notes': incident.get('close_notes'),
                    'business_service': incident.get('business_service'),
                    'configuration_item': incident.get('cmdb_ci'),
                    'sla_due': incident.get('sla_due'),
                    'made_sla': incident.get('made_sla')
                })
            
            # Calculate metrics
            metrics = self._calculate_incident_metrics(processed_incidents)
            
            # Get trend data
            trends = await self._get_incident_trends()
            
            # Get SLA performance
            sla_performance = self._calculate_sla_performance(processed_incidents)
            
            self._update_metrics(start_time, success=True)
            
            return {
                'success': True,
                'data': {
                    'incidents': processed_incidents,
                    'total_count': len(processed_incidents),
                    'metrics': metrics,
                    'trends': trends,
                    'sla_performance': sla_performance
                },
                'metadata': {
                    'query_time_ms': int((datetime.utcnow() - start_time).total_seconds() * 1000),
                    'filters_applied': {
                        'state': state,
                        'priority': priority,
                        'assignment_group': assignment_group,
                        'date_range': date_range
                    }
                }
            }
            
        except Exception as e:
            logger.error(f"Error querying incidents: {str(e)}")
            self._update_metrics(start_time, success=False)
            return {
                'success': False,
                'error': str(e),
                'data': {}
            }
    
    async def query_changes(self,
                           state: Optional[str] = None,
                           type: Optional[str] = None,
                           risk: Optional[str] = None,
                           date_range: Optional[Dict] = None,
                           limit: int = 500) -> Dict:
        """
        Query change requests from ServiceNow
        
        Args:
            state: Filter by state
            type: Filter by type (standard, normal, emergency)
            risk: Filter by risk level (high, medium, low)
            date_range: Date range filter
            limit: Maximum number of records
        
        Returns:
            Change request data with analytics
        """
        try:
            start_time = datetime.utcnow()
            
            # Build query parameters
            params = {
                'sysparm_limit': limit,
                'sysparm_display_value': 'true',
                'sysparm_exclude_reference_link': 'true'
            }
            
            # Build query filter
            query_parts = []
            if state:
                query_parts.append(f"state={state}")
            
            if type:
                query_parts.append(f"type={type}")
            
            if risk:
                query_parts.append(f"risk={risk}")
            
            if date_range:
                if 'start' in date_range:
                    query_parts.append(f"start_date>={date_range['start']}")
                if 'end' in date_range:
                    query_parts.append(f"start_date<={date_range['end']}")
            
            if query_parts:
                params['sysparm_query'] = '^'.join(query_parts)
            
            # Make API request
            url = f"{self.instance_url}/api/now/table/change_request"
            response = await self._make_request('GET', url, params=params)
            
            if not response['success']:
                return response
            
            changes = response['data'].get('result', [])
            
            # Process changes
            processed_changes = []
            for change in changes:
                processed_changes.append({
                    'number': change.get('number'),
                    'sys_id': change.get('sys_id'),
                    'short_description': change.get('short_description'),
                    'description': change.get('description'),
                    'state': change.get('state'),
                    'type': change.get('type'),
                    'category': change.get('category'),
                    'risk': change.get('risk'),
                    'impact': change.get('impact'),
                    'priority': change.get('priority'),
                    'assignment_group': change.get('assignment_group'),
                    'assigned_to': change.get('assigned_to'),
                    'requested_by': change.get('requested_by'),
                    'start_date': change.get('start_date'),
                    'end_date': change.get('end_date'),
                    'implementation_plan': change.get('implementation_plan'),
                    'backout_plan': change.get('backout_plan'),
                    'test_plan': change.get('test_plan'),
                    'approval': change.get('approval'),
                    'business_service': change.get('business_service'),
                    'configuration_items': change.get('cmdb_ci')
                })
            
            # Calculate metrics
            metrics = self._calculate_change_metrics(processed_changes)
            
            # Get change calendar
            change_calendar = await self._get_change_calendar()
            
            self._update_metrics(start_time, success=True)
            
            return {
                'success': True,
                'data': {
                    'changes': processed_changes,
                    'total_count': len(processed_changes),
                    'metrics': metrics,
                    'change_calendar': change_calendar
                },
                'metadata': {
                    'query_time_ms': int((datetime.utcnow() - start_time).total_seconds() * 1000),
                    'filters_applied': {
                        'state': state,
                        'type': type,
                        'risk': risk,
                        'date_range': date_range
                    }
                }
            }
            
        except Exception as e:
            logger.error(f"Error querying changes: {str(e)}")
            self._update_metrics(start_time, success=False)
            return {
                'success': False,
                'error': str(e),
                'data': {}
            }
    
    # ==================== CMDB ====================
    
    async def query_cmdb_items(self,
                               ci_class: Optional[str] = None,
                               operational_status: Optional[str] = None,
                               environment: Optional[str] = None,
                               limit: int = 1000) -> Dict:
        """
        Query Configuration Items from CMDB
        
        Args:
            ci_class: Filter by CI class (e.g., cmdb_ci_server, cmdb_ci_app)
            operational_status: Filter by operational status
            environment: Filter by environment (prod, dev, test)
            limit: Maximum number of records
        
        Returns:
            CMDB items with relationships and dependencies
        """
        try:
            start_time = datetime.utcnow()
            
            # Determine table based on CI class
            table = ci_class if ci_class else 'cmdb_ci'
            
            # Build query parameters
            params = {
                'sysparm_limit': limit,
                'sysparm_display_value': 'true',
                'sysparm_exclude_reference_link': 'true'
            }
            
            # Build query filter
            query_parts = []
            if operational_status:
                query_parts.append(f"operational_status={operational_status}")
            
            if environment:
                query_parts.append(f"environment={environment}")
            
            if query_parts:
                params['sysparm_query'] = '^'.join(query_parts)
            
            # Make API request
            url = f"{self.instance_url}/api/now/table/{table}"
            response = await self._make_request('GET', url, params=params)
            
            if not response['success']:
                return response
            
            ci_items = response['data'].get('result', [])
            
            # Process CI items
            processed_items = []
            for item in ci_items:
                ci_data = {
                    'sys_id': item.get('sys_id'),
                    'name': item.get('name'),
                    'sys_class_name': item.get('sys_class_name'),
                    'operational_status': item.get('operational_status'),
                    'environment': item.get('environment'),
                    'category': item.get('category'),
                    'subcategory': item.get('subcategory'),
                    'manufacturer': item.get('manufacturer'),
                    'model': item.get('model_id'),
                    'location': item.get('location'),
                    'department': item.get('department'),
                    'assigned_to': item.get('assigned_to'),
                    'managed_by': item.get('managed_by'),
                    'owned_by': item.get('owned_by'),
                    'cost': item.get('cost'),
                    'install_date': item.get('install_date'),
                    'warranty_expiration': item.get('warranty_expiration'),
                    'asset_tag': item.get('asset_tag'),
                    'serial_number': item.get('serial_number'),
                    'attributes': {}
                }
                
                # Add class-specific attributes
                if 'server' in table.lower():
                    ci_data['attributes'] = {
                        'cpu_count': item.get('cpu_count'),
                        'cpu_speed': item.get('cpu_speed'),
                        'cpu_type': item.get('cpu_type'),
                        'ram': item.get('ram'),
                        'disk_space': item.get('disk_space'),
                        'os': item.get('os'),
                        'os_version': item.get('os_version'),
                        'ip_address': item.get('ip_address'),
                        'mac_address': item.get('mac_address'),
                        'dns_domain': item.get('dns_domain'),
                        'virtual': item.get('virtual')
                    }
                elif 'app' in table.lower():
                    ci_data['attributes'] = {
                        'version': item.get('version'),
                        'short_description': item.get('short_description'),
                        'used_for': item.get('used_for'),
                        'business_criticality': item.get('business_criticality'),
                        'disaster_recovery_tier': item.get('disaster_recovery_tier')
                    }
                
                processed_items.append(ci_data)
            
            # Get relationships
            relationships = await self._get_ci_relationships(processed_items[:100])  # Limit for performance
            
            # Calculate CMDB health metrics
            cmdb_health = self._calculate_cmdb_health(processed_items)
            
            # Get CI lifecycle status
            lifecycle_status = self._analyze_ci_lifecycle(processed_items)
            
            self._update_metrics(start_time, success=True)
            
            return {
                'success': True,
                'data': {
                    'configuration_items': processed_items,
                    'total_count': len(processed_items),
                    'relationships': relationships,
                    'cmdb_health': cmdb_health,
                    'lifecycle_status': lifecycle_status,
                    'summary': {
                        'by_class': self._group_by_class(processed_items),
                        'by_status': self._group_by_status(processed_items),
                        'by_environment': self._group_by_environment(processed_items)
                    }
                },
                'metadata': {
                    'query_time_ms': int((datetime.utcnow() - start_time).total_seconds() * 1000),
                    'table_queried': table,
                    'filters_applied': {
                        'ci_class': ci_class,
                        'operational_status': operational_status,
                        'environment': environment
                    }
                }
            }
            
        except Exception as e:
            logger.error(f"Error querying CMDB: {str(e)}")
            self._update_metrics(start_time, success=False)
            return {
                'success': False,
                'error': str(e),
                'data': {}
            }
    
    # ==================== PROBLEM MANAGEMENT ====================
    
    async def query_problems(self,
                            state: Optional[str] = None,
                            priority: Optional[int] = None,
                            date_range: Optional[Dict] = None,
                            limit: int = 500) -> Dict:
        """Query problem records from ServiceNow"""
        try:
            start_time = datetime.utcnow()
            
            # Build query parameters
            params = {
                'sysparm_limit': limit,
                'sysparm_display_value': 'true',
                'sysparm_exclude_reference_link': 'true'
            }
            
            # Build query filter
            query_parts = []
            if state:
                query_parts.append(f"state={state}")
            
            if priority:
                query_parts.append(f"priority={priority}")
            
            if date_range:
                if 'start' in date_range:
                    query_parts.append(f"opened_at>={date_range['start']}")
                if 'end' in date_range:
                    query_parts.append(f"opened_at<={date_range['end']}")
            
            if query_parts:
                params['sysparm_query'] = '^'.join(query_parts)
            
            # Make API request
            url = f"{self.instance_url}/api/now/table/problem"
            response = await self._make_request('GET', url, params=params)
            
            if not response['success']:
                return response
            
            problems = response['data'].get('result', [])
            
            # Process problems
            processed_problems = []
            for problem in problems:
                processed_problems.append({
                    'number': problem.get('number'),
                    'sys_id': problem.get('sys_id'),
                    'short_description': problem.get('short_description'),
                    'description': problem.get('description'),
                    'state': problem.get('state'),
                    'priority': problem.get('priority'),
                    'urgency': problem.get('urgency'),
                    'impact': problem.get('impact'),
                    'category': problem.get('category'),
                    'subcategory': problem.get('subcategory'),
                    'assignment_group': problem.get('assignment_group'),
                    'assigned_to': problem.get('assigned_to'),
                    'opened_at': problem.get('opened_at'),
                    'closed_at': problem.get('closed_at'),
                    'known_error': problem.get('known_error'),
                    'root_cause': problem.get('cause_notes'),
                    'workaround': problem.get('workaround'),
                    'related_incidents_count': problem.get('related_incidents')
                })
            
            # Calculate metrics
            metrics = self._calculate_problem_metrics(processed_problems)
            
            self._update_metrics(start_time, success=True)
            
            return {
                'success': True,
                'data': {
                    'problems': processed_problems,
                    'total_count': len(processed_problems),
                    'metrics': metrics
                },
                'metadata': {
                    'query_time_ms': int((datetime.utcnow() - start_time).total_seconds() * 1000)
                }
            }
            
        except Exception as e:
            logger.error(f"Error querying problems: {str(e)}")
            self._update_metrics(start_time, success=False)
            return {
                'success': False,
                'error': str(e),
                'data': {}
            }
    
    # ==================== SERVICE CATALOG ====================
    
    async def query_service_catalog(self, 
                                   category: Optional[str] = None,
                                   active_only: bool = True) -> Dict:
        """Query service catalog items"""
        try:
            start_time = datetime.utcnow()
            
            # Build query parameters
            params = {
                'sysparm_limit': 1000,
                'sysparm_display_value': 'true'
            }
            
            # Build query filter
            query_parts = []
            if active_only:
                query_parts.append("active=true")
            
            if category:
                query_parts.append(f"category={category}")
            
            if query_parts:
                params['sysparm_query'] = '^'.join(query_parts)
            
            # Make API request
            url = f"{self.instance_url}/api/now/table/sc_cat_item"
            response = await self._make_request('GET', url, params=params)
            
            if not response['success']:
                return response
            
            catalog_items = response['data'].get('result', [])
            
            # Process catalog items
            processed_items = []
            for item in catalog_items:
                processed_items.append({
                    'sys_id': item.get('sys_id'),
                    'name': item.get('name'),
                    'short_description': item.get('short_description'),
                    'description': item.get('description'),
                    'category': item.get('category'),
                    'price': item.get('price'),
                    'recurring_price': item.get('recurring_price'),
                    'recurring_frequency': item.get('recurring_frequency'),
                    'delivery_time': item.get('delivery_time'),
                    'availability': item.get('availability'),
                    'workflow': item.get('workflow'),
                    'approval_required': item.get('no_cart', False),
                    'active': item.get('active')
                })
            
            # Get request statistics
            request_stats = await self._get_catalog_request_stats()
            
            self._update_metrics(start_time, success=True)
            
            return {
                'success': True,
                'data': {
                    'catalog_items': processed_items,
                    'total_count': len(processed_items),
                    'request_statistics': request_stats,
                    'summary': {
                        'by_category': self._group_catalog_by_category(processed_items),
                        'by_availability': self._group_catalog_by_availability(processed_items)
                    }
                },
                'metadata': {
                    'query_time_ms': int((datetime.utcnow() - start_time).total_seconds() * 1000)
                }
            }
            
        except Exception as e:
            logger.error(f"Error querying service catalog: {str(e)}")
            self._update_metrics(start_time, success=False)
            return {
                'success': False,
                'error': str(e),
                'data': {}
            }
    
    # ==================== KNOWLEDGE BASE ====================
    
    async def query_knowledge_articles(self,
                                      category: Optional[str] = None,
                                      search_term: Optional[str] = None,
                                      limit: int = 100) -> Dict:
        """Query knowledge base articles"""
        try:
            start_time = datetime.utcnow()
            
            # Build query parameters
            params = {
                'sysparm_limit': limit,
                'sysparm_display_value': 'true'
            }
            
            # Build query filter
            query_parts = ["workflow_state=published"]
            
            if category:
                query_parts.append(f"kb_category={category}")
            
            if search_term:
                query_parts.append(f"short_descriptionLIKE{search_term}")
            
            params['sysparm_query'] = '^'.join(query_parts)
            
            # Make API request
            url = f"{self.instance_url}/api/now/table/kb_knowledge"
            response = await self._make_request('GET', url, params=params)
            
            if not response['success']:
                return response
            
            articles = response['data'].get('result', [])
            
            # Process articles
            processed_articles = []
            for article in articles:
                processed_articles.append({
                    'sys_id': article.get('sys_id'),
                    'number': article.get('number'),
                    'short_description': article.get('short_description'),
                    'text': article.get('text', '')[:500],  # First 500 chars
                    'kb_category': article.get('kb_category'),
                    'author': article.get('author'),
                    'published': article.get('published'),
                    'rating': article.get('rating'),
                    'view_count': article.get('sys_view_count'),
                    'helpful_count': article.get('helpful_count'),
                    'tags': article.get('meta', '').split(',') if article.get('meta') else []
                })
            
            # Calculate knowledge base metrics
            kb_metrics = {
                'total_articles': len(processed_articles),
                'avg_rating': sum(float(a.get('rating', 0)) for a in processed_articles) / len(processed_articles) if processed_articles else 0,
                'total_views': sum(int(a.get('view_count', 0)) for a in processed_articles),
                'by_category': self._group_kb_by_category(processed_articles)
            }
            
            self._update_metrics(start_time, success=True)
            
            return {
                'success': True,
                'data': {
                    'articles': processed_articles,
                    'total_count': len(processed_articles),
                    'metrics': kb_metrics
                },
                'metadata': {
                    'query_time_ms': int((datetime.utcnow() - start_time).total_seconds() * 1000)
                }
            }
            
        except Exception as e:
            logger.error(f"Error querying knowledge articles: {str(e)}")
            self._update_metrics(start_time, success=False)
            return {
                'success': False,
                'error': str(e),
                'data': {}
            }
    
    # ==================== USERS & GROUPS ====================
    
    async def query_users(self, 
                         active_only: bool = True,
                         group: Optional[str] = None) -> Dict:
        """Query ServiceNow users"""
        try:
            start_time = datetime.utcnow()
            
            # Build query parameters
            params = {
                'sysparm_limit': 1000,
                'sysparm_display_value': 'true'
            }
            
            # Build query filter
            query_parts = []
            if active_only:
                query_parts.append("active=true")
            
            if query_parts:
                params['sysparm_query'] = '^'.join(query_parts)
            
            # Make API request
            url = f"{self.instance_url}/api/now/table/sys_user"
            response = await self._make_request('GET', url, params=params)
            
            if not response['success']:
                return response
            
            users = response['data'].get('result', [])
            
            # Process users
            processed_users = []
            for user in users:
                user_data = {
                    'sys_id': user.get('sys_id'),
                    'user_name': user.get('user_name'),
                    'name': user.get('name'),
                    'email': user.get('email'),
                    'department': user.get('department'),
                    'title': user.get('title'),
                    'manager': user.get('manager'),
                    'location': user.get('location'),
                    'phone': user.get('phone'),
                    'mobile_phone': user.get('mobile_phone'),
                    'active': user.get('active'),
                    'vip': user.get('vip'),
                    'sys_created_on': user.get('sys_created_on'),
                    'last_login_time': user.get('last_login_time'),
                    'roles': []
                }
                
                # Get user roles (limited request)
                if len(processed_users) < 50:  # Limit role queries for performance
                    user_data['roles'] = await self._get_user_roles(user['sys_id'])
                
                processed_users.append(user_data)
            
            # Filter by group if specified
            if group:
                group_members = await self._get_group_members(group)
                processed_users = [u for u in processed_users if u['sys_id'] in group_members]
            
            # Calculate user metrics
            user_metrics = {
                'total_users': len(processed_users),
                'active_users': sum(1 for u in processed_users if u['active'] == 'true'),
                'vip_users': sum(1 for u in processed_users if u['vip'] == 'true'),
                'by_department': self._group_users_by_dept(processed_users),
                'by_location': self._group_users_by_location(processed_users)
            }
            
            self._update_metrics(start_time, success=True)
            
            return {
                'success': True,
                'data': {
                    'users': processed_users,
                    'total_count': len(processed_users),
                    'metrics': user_metrics
                },
                'metadata': {
                    'query_time_ms': int((datetime.utcnow() - start_time).total_seconds() * 1000)
                }
            }
            
        except Exception as e:
            logger.error(f"Error querying users: {str(e)}")
            self._update_metrics(start_time, success=False)
            return {
                'success': False,
                'error': str(e),
                'data': {}
            }
    
    # ==================== PERFORMANCE ANALYTICS ====================
    
    async def query_performance_analytics(self, 
                                         indicator_id: str,
                                         date_range: Optional[Dict] = None) -> Dict:
        """Query performance analytics indicators"""
        try:
            start_time = datetime.utcnow()
            
            # Build query for PA scores
            params = {
                'sysparm_limit': 1000,
                'indicator': indicator_id
            }
            
            if date_range:
                params['sysparm_query'] = f"sys_created_on>={date_range.get('start', '')}^sys_created_on<={date_range.get('end', '')}"
            
            # Make API request
            url = f"{self.instance_url}/api/now/pa/scores"
            response = await self._make_request('GET', url, params=params)
            
            if not response['success']:
                return response
            
            scores = response['data'].get('result', [])
            
            # Process scores
            processed_scores = []
            for score in scores:
                processed_scores.append({
                    'date': score.get('date'),
                    'value': score.get('value'),
                    'target': score.get('target'),
                    'variance': score.get('variance'),
                    'direction': score.get('direction')
                })
            
            self._update_metrics(start_time, success=True)
            
            return {
                'success': True,
                'data': {
                    'scores': processed_scores,
                    'indicator_id': indicator_id,
                    'trend': self._calculate_trend(processed_scores)
                },
                'metadata': {
                    'query_time_ms': int((datetime.utcnow() - start_time).total_seconds() * 1000)
                }
            }
            
        except Exception as e:
            logger.error(f"Error querying performance analytics: {str(e)}")
            self._update_metrics(start_time, success=False)
            return {
                'success': False,
                'error': str(e),
                'data': {}
            }
    
    # ==================== HELPER METHODS ====================
    
    async def _make_request(self, method: str, url: str, **kwargs) -> Dict:
        """Make HTTP request to ServiceNow API"""
        try:
            # Check cache for GET requests
            if method == 'GET':
                cache_key = hashlib.md5(f"{url}{kwargs}".encode()).hexdigest()
                if cache_key in self._cache:
                    cached_data, cached_time = self._cache[cache_key]
                    if (datetime.utcnow() - cached_time).seconds < self._cache_ttl:
                        return {'success': True, 'data': cached_data}
            
            # Get OAuth token if needed
            if self.client_id and self.client_secret:
                await self._ensure_oauth_token()
                self.session.headers['Authorization'] = f'Bearer {self.access_token}'
            
            # Make request
            response = self.session.request(method, url, **kwargs)
            response.raise_for_status()
            
            data = response.json()
            
            # Cache successful GET responses
            if method == 'GET':
                self._cache[cache_key] = (data, datetime.utcnow())
            
            return {'success': True, 'data': data}
            
        except requests.exceptions.RequestException as e:
            logger.error(f"ServiceNow API request failed: {str(e)}")
            return {'success': False, 'error': str(e), 'data': {}}
    
    async def _ensure_oauth_token(self):
        """Ensure OAuth token is valid"""
        if self.access_token and self.token_expires_at:
            if datetime.utcnow() < self.token_expires_at:
                return
        
        # Get new token
        token_url = f"{self.instance_url}/oauth_token.do"
        data = {
            'grant_type': 'password',
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'username': self.username,
            'password': self.password
        }
        
        response = requests.post(token_url, data=data)
        response.raise_for_status()
        
        token_data = response.json()
        self.access_token = token_data['access_token']
        expires_in = token_data.get('expires_in', 3600)
        self.token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in - 60)
    
    def _calculate_incident_metrics(self, incidents: List[Dict]) -> Dict:
        """Calculate incident metrics"""
        if not incidents:
            return {}
        
        total = len(incidents)
        
        # State distribution
        states = {}
        for incident in incidents:
            state = incident.get('state', 'Unknown')
            states[state] = states.get(state, 0) + 1
        
        # Priority distribution
        priorities = {}
        for incident in incidents:
            priority = incident.get('priority', 'Unknown')
            priorities[priority] = priorities.get(priority, 0) + 1
        
        # Calculate resolution times
        resolution_times = []
        for incident in incidents:
            if incident.get('opened_at') and incident.get('resolved_at'):
                try:
                    opened = datetime.fromisoformat(incident['opened_at'].replace('Z', '+00:00'))
                    resolved = datetime.fromisoformat(incident['resolved_at'].replace('Z', '+00:00'))
                    resolution_times.append((resolved - opened).total_seconds() / 3600)  # Hours
                except:
                    pass
        
        avg_resolution_time = sum(resolution_times) / len(resolution_times) if resolution_times else 0
        
        return {
            'total_incidents': total,
            'by_state': states,
            'by_priority': priorities,
            'avg_resolution_hours': round(avg_resolution_time, 2),
            'sla_met_percentage': sum(1 for i in incidents if i.get('made_sla') == 'true') / total * 100 if total > 0 else 0
        }
    
    def _calculate_change_metrics(self, changes: List[Dict]) -> Dict:
        """Calculate change metrics"""
        if not changes:
            return {}
        
        total = len(changes)
        
        # Type distribution
        types = {}
        for change in changes:
            change_type = change.get('type', 'Unknown')
            types[change_type] = types.get(change_type, 0) + 1
        
        # Risk distribution
        risks = {}
        for change in changes:
            risk = change.get('risk', 'Unknown')
            risks[risk] = risks.get(risk, 0) + 1
        
        # State distribution
        states = {}
        for change in changes:
            state = change.get('state', 'Unknown')
            states[state] = states.get(state, 0) + 1
        
        return {
            'total_changes': total,
            'by_type': types,
            'by_risk': risks,
            'by_state': states,
            'emergency_changes': types.get('Emergency', 0),
            'standard_changes': types.get('Standard', 0),
            'normal_changes': types.get('Normal', 0)
        }
    
    def _calculate_problem_metrics(self, problems: List[Dict]) -> Dict:
        """Calculate problem metrics"""
        if not problems:
            return {}
        
        return {
            'total_problems': len(problems),
            'known_errors': sum(1 for p in problems if p.get('known_error') == 'true'),
            'with_workaround': sum(1 for p in problems if p.get('workaround')),
            'by_priority': self._group_by_priority(problems),
            'by_state': self._group_by_state(problems)
        }
    
    def _calculate_sla_performance(self, incidents: List[Dict]) -> Dict:
        """Calculate SLA performance metrics"""
        if not incidents:
            return {}
        
        total = len(incidents)
        sla_met = sum(1 for i in incidents if i.get('made_sla') == 'true')
        sla_breached = total - sla_met
        
        return {
            'total_measured': total,
            'sla_met': sla_met,
            'sla_breached': sla_breached,
            'sla_percentage': (sla_met / total * 100) if total > 0 else 0,
            'at_risk': sum(1 for i in incidents if i.get('sla_due') and not i.get('resolved_at'))
        }
    
    def _calculate_cmdb_health(self, items: List[Dict]) -> Dict:
        """Calculate CMDB health metrics"""
        if not items:
            return {}
        
        total = len(items)
        
        # Completeness check
        complete_items = 0
        for item in items:
            required_fields = ['name', 'operational_status', 'environment', 'managed_by']
            if all(item.get(field) for field in required_fields):
                complete_items += 1
        
        # Age analysis
        old_items = 0
        cutoff_date = datetime.utcnow() - timedelta(days=365)
        for item in items:
            if item.get('install_date'):
                try:
                    install_date = datetime.fromisoformat(item['install_date'].replace('Z', '+00:00'))
                    if install_date < cutoff_date:
                        old_items += 1
                except:
                    pass
        
        return {
            'total_items': total,
            'completeness_percentage': (complete_items / total * 100) if total > 0 else 0,
            'items_over_1_year_old': old_items,
            'items_without_owner': sum(1 for i in items if not i.get('owned_by')),
            'items_without_location': sum(1 for i in items if not i.get('location'))
        }
    
    def _analyze_ci_lifecycle(self, items: List[Dict]) -> Dict:
        """Analyze CI lifecycle status"""
        lifecycle_stages = {
            'Planning': 0,
            'Procurement': 0,
            'Deployment': 0,
            'Production': 0,
            'Maintenance': 0,
            'Retirement': 0
        }
        
        for item in items:
            status = item.get('operational_status', '')
            if 'plan' in status.lower():
                lifecycle_stages['Planning'] += 1
            elif 'procure' in status.lower() or 'order' in status.lower():
                lifecycle_stages['Procurement'] += 1
            elif 'deploy' in status.lower() or 'build' in status.lower():
                lifecycle_stages['Deployment'] += 1
            elif 'operational' in status.lower() or 'production' in status.lower():
                lifecycle_stages['Production'] += 1
            elif 'maintenance' in status.lower():
                lifecycle_stages['Maintenance'] += 1
            elif 'retire' in status.lower() or 'decommission' in status.lower():
                lifecycle_stages['Retirement'] += 1
        
        return lifecycle_stages
    
    async def _get_incident_trends(self) -> Dict:
        """Get incident trend data"""
        # This would query historical data
        # Placeholder for demonstration
        return {
            'daily_trend': [
                {'date': '2024-01-01', 'count': 45},
                {'date': '2024-01-02', 'count': 52},
                {'date': '2024-01-03', 'count': 48}
            ],
            'trend_direction': 'decreasing',
            'percentage_change': -5.2
        }
    
    async def _get_change_calendar(self) -> Dict:
        """Get change calendar data"""
        # This would query upcoming changes
        # Placeholder for demonstration
        return {
            'upcoming_changes': 15,
            'next_maintenance_window': '2024-02-01T02:00:00Z',
            'blackout_dates': ['2024-02-14', '2024-02-15']
        }
    
    async def _get_ci_relationships(self, items: List[Dict]) -> List[Dict]:
        """Get CI relationships"""
        relationships = []
        # This would query relationship data
        # Placeholder for demonstration
        return relationships
    
    async def _get_catalog_request_stats(self) -> Dict:
        """Get service catalog request statistics"""
        return {
            'total_requests_30d': 250,
            'avg_fulfillment_time_hours': 4.5,
            'most_requested_items': [],
            'approval_rate': 92.5
        }
    
    async def _get_user_roles(self, user_id: str) -> List[str]:
        """Get roles for a specific user"""
        # This would query user role assignments
        return []
    
    async def _get_group_members(self, group_name: str) -> List[str]:
        """Get members of a group"""
        # This would query group membership
        return []
    
    def _calculate_trend(self, scores: List[Dict]) -> str:
        """Calculate trend from scores"""
        if len(scores) < 2:
            return 'stable'
        
        first_half = scores[:len(scores)//2]
        second_half = scores[len(scores)//2:]
        
        avg_first = sum(float(s.get('value', 0)) for s in first_half) / len(first_half) if first_half else 0
        avg_second = sum(float(s.get('value', 0)) for s in second_half) / len(second_half) if second_half else 0
        
        if avg_second > avg_first * 1.1:
            return 'increasing'
        elif avg_second < avg_first * 0.9:
            return 'decreasing'
        else:
            return 'stable'
    
    # Grouping helper methods
    def _group_by_class(self, items: List[Dict]) -> Dict:
        grouped = {}
        for item in items:
            cls = item.get('sys_class_name', 'Unknown')
            grouped[cls] = grouped.get(cls, 0) + 1
        return grouped
    
    def _group_by_status(self, items: List[Dict]) -> Dict:
        grouped = {}
        for item in items:
            status = item.get('operational_status', 'Unknown')
            grouped[status] = grouped.get(status, 0) + 1
        return grouped
    
    def _group_by_environment(self, items: List[Dict]) -> Dict:
        grouped = {}
        for item in items:
            env = item.get('environment', 'Unknown')
            grouped[env] = grouped.get(env, 0) + 1
        return grouped
    
    def _group_by_priority(self, items: List[Dict]) -> Dict:
        grouped = {}
        for item in items:
            priority = item.get('priority', 'Unknown')
            grouped[priority] = grouped.get(priority, 0) + 1
        return grouped
    
    def _group_by_state(self, items: List[Dict]) -> Dict:
        grouped = {}
        for item in items:
            state = item.get('state', 'Unknown')
            grouped[state] = grouped.get(state, 0) + 1
        return grouped
    
    def _group_catalog_by_category(self, items: List[Dict]) -> Dict:
        grouped = {}
        for item in items:
            category = item.get('category', 'Unknown')
            grouped[category] = grouped.get(category, 0) + 1
        return grouped
    
    def _group_catalog_by_availability(self, items: List[Dict]) -> Dict:
        grouped = {}
        for item in items:
            avail = item.get('availability', 'Unknown')
            grouped[avail] = grouped.get(avail, 0) + 1
        return grouped
    
    def _group_kb_by_category(self, items: List[Dict]) -> Dict:
        grouped = {}
        for item in items:
            category = item.get('kb_category', 'Unknown')
            grouped[category] = grouped.get(category, 0) + 1
        return grouped
    
    def _group_users_by_dept(self, users: List[Dict]) -> Dict:
        grouped = {}
        for user in users:
            dept = user.get('department', 'Unknown')
            grouped[dept] = grouped.get(dept, 0) + 1
        return grouped
    
    def _group_users_by_location(self, users: List[Dict]) -> Dict:
        grouped = {}
        for user in users:
            location = user.get('location', 'Unknown')
            grouped[location] = grouped.get(location, 0) + 1
        return grouped
    
    def _update_metrics(self, start_time: datetime, success: bool):
        """Update performance metrics"""
        elapsed = (datetime.utcnow() - start_time).total_seconds()
        self.query_metrics['total_queries'] += 1
        
        if not success:
            self.query_metrics['failed_queries'] += 1
        
        # Update average response time
        current_avg = self.query_metrics['avg_response_time']
        total_queries = self.query_metrics['total_queries']
        self.query_metrics['avg_response_time'] = ((current_avg * (total_queries - 1)) + elapsed) / total_queries
        self.query_metrics['last_query_time'] = datetime.utcnow()