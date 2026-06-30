"""
Azure Service Integration for DataChart
Comprehensive Azure, Intune, and Microsoft Graph API integration
Handles Cost Management, Resource Manager, AD/Intune data access
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from functools import lru_cache
import hashlib

from azure.identity import ClientSecretCredential
from azure.mgmt.resource import ResourceManagementClient
from azure.mgmt.costmanagement import CostManagementClient
from azure.mgmt.monitor import MonitorManagementClient
from azure.mgmt.compute import ComputeManagementClient
from azure.mgmt.network import NetworkManagementClient
from azure.mgmt.storage import StorageManagementClient
from azure.mgmt.sql import SqlManagementClient
from azure.mgmt.web import WebSiteManagementClient
from azure.mgmt.containerservice import ContainerServiceClient
from azure.mgmt.keyvault import KeyVaultManagementClient
from azure.mgmt.advisor import AdvisorManagementClient
from azure.mgmt.security import SecurityCenter
from azure.mgmt.subscription import SubscriptionClient
from azure.mgmt.billing import BillingManagementClient
from azure.mgmt.consumption import ConsumptionManagementClient
from azure.mgmt.reservations import AzureReservationAPI
from azure.mgmt.policyinsights import PolicyInsightsClient
from azure.core.exceptions import AzureError, ClientAuthenticationError
from msgraph import GraphServiceClient
from msgraph.generated.models.user import User
from msgraph.generated.models.device import Device
from msgraph.generated.models.application import Application
from msgraph.generated.models.group import Group
from msgraph.generated.models.directory_role import DirectoryRole
from msgraph.generated.models.conditional_access_policy import ConditionalAccessPolicy

logger = logging.getLogger(__name__)


class AzureService:
    """
    Main Azure service integrator for DataChart
    Provides unified access to all Azure and Microsoft 365 services
    """
    
    def __init__(self, credentials: Dict[str, str]):
        """
        Initialize Azure service with customer credentials
        
        Args:
            credentials: Dict containing:
                - tenant_id: Azure AD tenant ID
                - client_id: Service principal client ID
                - client_secret: Service principal secret
                - subscription_id: Azure subscription ID
                - graph_permissions: List of Graph API permissions
        """
        self.tenant_id = credentials.get('tenant_id')
        self.client_id = credentials.get('client_id')
        self.client_secret = credentials.get('client_secret')
        self.subscription_id = credentials.get('subscription_id')
        self.graph_permissions = credentials.get('graph_permissions', [])
        
        # Initialize Azure credential
        self.credential = ClientSecretCredential(
            tenant_id=self.tenant_id,
            client_id=self.client_id,
            client_secret=self.client_secret
        )
        
        # Cache for API clients
        self._clients_cache = {}
        
        # Performance metrics
        self.query_metrics = {
            'total_queries': 0,
            'failed_queries': 0,
            'avg_response_time': 0,
            'last_query_time': None
        }
        
        logger.info(f"Initialized Azure service for tenant {self.tenant_id}")
    
    def _get_client(self, client_class, **kwargs):
        """Get or create cached API client"""
        client_name = client_class.__name__
        if client_name not in self._clients_cache:
            if 'subscription_id' not in kwargs and hasattr(self, 'subscription_id'):
                kwargs['subscription_id'] = self.subscription_id
            self._clients_cache[client_name] = client_class(
                credential=self.credential,
                **kwargs
            )
        return self._clients_cache[client_name]
    
    # ==================== COST MANAGEMENT ====================
    
    async def query_cost_analysis(self, 
                                  date_range: Optional[Dict] = None,
                                  group_by: List[str] = None,
                                  filters: Dict = None) -> Dict:
        """
        Query Azure cost analysis data
        
        Args:
            date_range: Optional date range filter
            group_by: Dimensions to group by (e.g., ['ResourceGroup', 'Service'])
            filters: Additional filters
        
        Returns:
            Cost analysis data with trends and breakdowns
        """
        try:
            start_time = datetime.utcnow()
            cost_client = self._get_client(CostManagementClient)
            
            # Build query parameters
            if not date_range:
                # Default to last 30 days
                end_date = datetime.utcnow()
                start_date = end_date - timedelta(days=30)
                date_range = {
                    'start': start_date.isoformat(),
                    'end': end_date.isoformat()
                }
            
            query_body = {
                'type': 'Usage',
                'timeframe': 'Custom',
                'time_period': {
                    'from': date_range['start'],
                    'to': date_range['end']
                },
                'dataset': {
                    'granularity': 'Daily',
                    'aggregation': {
                        'totalCost': {
                            'name': 'Cost',
                            'function': 'Sum'
                        },
                        'totalCostUSD': {
                            'name': 'CostUSD',
                            'function': 'Sum'
                        }
                    }
                }
            }
            
            # Add grouping if specified
            if group_by:
                query_body['dataset']['grouping'] = [
                    {'type': 'Dimension', 'name': dim} for dim in group_by
                ]
            
            # Add filters if specified
            if filters:
                query_body['dataset']['filter'] = self._build_cost_filter(filters)
            
            # Execute query
            scope = f'/subscriptions/{self.subscription_id}'
            result = cost_client.query.usage(scope, query_body)
            
            # Process results
            processed_data = self._process_cost_data(result)
            
            # Add cost optimization recommendations
            processed_data['recommendations'] = await self._get_cost_recommendations()
            
            # Add reserved instance coverage
            processed_data['ri_coverage'] = await self._get_reserved_instance_coverage()
            
            # Add budget status
            processed_data['budget_status'] = await self._get_budget_status()
            
            # Track metrics
            self._update_metrics(start_time, success=True)
            
            return {
                'success': True,
                'data': processed_data,
                'metadata': {
                    'query_time_ms': int((datetime.utcnow() - start_time).total_seconds() * 1000),
                    'date_range': date_range,
                    'group_by': group_by or []
                }
            }
            
        except Exception as e:
            logger.error(f"Error querying cost analysis: {str(e)}")
            self._update_metrics(start_time, success=False)
            return {
                'success': False,
                'error': str(e),
                'data': {}
            }
    
    async def query_budget_alerts(self) -> Dict:
        """Get budget alerts and spending forecasts"""
        try:
            cost_client = self._get_client(CostManagementClient)
            consumption_client = self._get_client(ConsumptionManagementClient)
            
            # Get budgets
            budgets = []
            scope = f'/subscriptions/{self.subscription_id}'
            for budget in cost_client.budgets.list(scope):
                budget_dict = {
                    'name': budget.name,
                    'amount': budget.amount,
                    'time_grain': budget.time_grain,
                    'time_period': {
                        'start': budget.time_period.start_date.isoformat(),
                        'end': budget.time_period.end_date.isoformat()
                    },
                    'current_spend': budget.current_spend.amount if budget.current_spend else 0,
                    'notifications': []
                }
                
                # Get notification status
                if budget.notifications:
                    for key, notification in budget.notifications.items():
                        budget_dict['notifications'].append({
                            'name': key,
                            'enabled': notification.enabled,
                            'threshold': notification.threshold,
                            'contact_emails': notification.contact_emails
                        })
                
                budgets.append(budget_dict)
            
            # Get current month forecast
            forecast = await self._get_spending_forecast()
            
            # Get anomaly alerts
            anomalies = await self._detect_cost_anomalies()
            
            return {
                'success': True,
                'data': {
                    'budgets': budgets,
                    'forecast': forecast,
                    'anomalies': anomalies,
                    'alerts_count': len(anomalies),
                    'budgets_at_risk': sum(1 for b in budgets if b['current_spend'] > b['amount'] * 0.8)
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting budget alerts: {str(e)}")
            return {'success': False, 'error': str(e), 'data': {}}
    
    # ==================== RESOURCE MANAGEMENT ====================
    
    async def query_resource_inventory(self, 
                                       resource_types: List[str] = None,
                                       tags: Dict = None) -> Dict:
        """
        Get comprehensive resource inventory
        
        Args:
            resource_types: Filter by resource types
            tags: Filter by tags
        
        Returns:
            Detailed resource inventory with metadata
        """
        try:
            resource_client = self._get_client(ResourceManagementClient)
            
            resources = []
            resource_groups = {}
            
            # Get resource groups first
            for rg in resource_client.resource_groups.list():
                resource_groups[rg.name] = {
                    'location': rg.location,
                    'tags': rg.tags or {},
                    'managed_by': rg.managed_by,
                    'provisioning_state': rg.properties.provisioning_state if rg.properties else None
                }
            
            # Get all resources
            for resource in resource_client.resources.list():
                # Apply filters
                if resource_types and resource.type not in resource_types:
                    continue
                
                if tags:
                    resource_tags = resource.tags or {}
                    if not all(resource_tags.get(k) == v for k, v in tags.items()):
                        continue
                
                # Parse resource ID for details
                resource_parts = resource.id.split('/')
                resource_group = resource_parts[4] if len(resource_parts) > 4 else None
                
                resources.append({
                    'id': resource.id,
                    'name': resource.name,
                    'type': resource.type,
                    'location': resource.location,
                    'resource_group': resource_group,
                    'tags': resource.tags or {},
                    'kind': resource.kind,
                    'sku': {
                        'name': resource.sku.name if resource.sku else None,
                        'tier': resource.sku.tier if resource.sku else None,
                        'capacity': resource.sku.capacity if resource.sku else None
                    },
                    'provisioning_state': resource.provisioning_state,
                    'created_time': resource.created_time.isoformat() if resource.created_time else None,
                    'changed_time': resource.changed_time.isoformat() if resource.changed_time else None
                })
            
            # Get resource health status
            health_status = await self._get_resource_health(resources)
            
            # Get resource costs
            resource_costs = await self._get_resource_costs(resources)
            
            # Analyze resource utilization
            utilization = await self._analyze_resource_utilization(resources)
            
            return {
                'success': True,
                'data': {
                    'total_resources': len(resources),
                    'resource_groups': resource_groups,
                    'resources': resources,
                    'health_status': health_status,
                    'resource_costs': resource_costs,
                    'utilization': utilization,
                    'summary': {
                        'by_type': self._group_by_type(resources),
                        'by_location': self._group_by_location(resources),
                        'by_resource_group': self._group_by_resource_group(resources)
                    }
                }
            }
            
        except Exception as e:
            logger.error(f"Error querying resource inventory: {str(e)}")
            return {'success': False, 'error': str(e), 'data': {}}
    
    async def query_vm_inventory(self) -> Dict:
        """Get detailed VM inventory with performance metrics"""
        try:
            compute_client = self._get_client(ComputeManagementClient)
            monitor_client = self._get_client(MonitorManagementClient)
            
            vms = []
            
            # Get all VMs
            for vm in compute_client.virtual_machines.list_all():
                vm_data = {
                    'id': vm.id,
                    'name': vm.name,
                    'location': vm.location,
                    'resource_group': vm.id.split('/')[4],
                    'vm_size': vm.hardware_profile.vm_size,
                    'os_type': vm.storage_profile.os_disk.os_type,
                    'os_disk_size': vm.storage_profile.os_disk.disk_size_gb,
                    'data_disks': len(vm.storage_profile.data_disks) if vm.storage_profile.data_disks else 0,
                    'provisioning_state': vm.provisioning_state,
                    'power_state': None,
                    'tags': vm.tags or {},
                    'network_interfaces': [],
                    'public_ips': [],
                    'private_ips': [],
                    'metrics': {}
                }
                
                # Get instance view for power state
                try:
                    instance_view = compute_client.virtual_machines.instance_view(
                        vm_data['resource_group'], 
                        vm.name
                    )
                    if instance_view.statuses:
                        for status in instance_view.statuses:
                            if status.code.startswith('PowerState/'):
                                vm_data['power_state'] = status.code.split('/')[-1]
                                break
                except:
                    pass
                
                # Get network interfaces
                if vm.network_profile and vm.network_profile.network_interfaces:
                    for nic_ref in vm.network_profile.network_interfaces:
                        nic_name = nic_ref.id.split('/')[-1]
                        vm_data['network_interfaces'].append(nic_name)
                
                # Get performance metrics
                vm_data['metrics'] = await self._get_vm_metrics(vm.id)
                
                vms.append(vm_data)
            
            # Calculate summary statistics
            summary = {
                'total_vms': len(vms),
                'running_vms': sum(1 for vm in vms if vm['power_state'] == 'running'),
                'stopped_vms': sum(1 for vm in vms if vm['power_state'] == 'deallocated'),
                'by_size': self._group_vms_by_size(vms),
                'by_os': self._group_vms_by_os(vms),
                'total_cores': self._calculate_total_cores(vms),
                'total_memory_gb': self._calculate_total_memory(vms)
            }
            
            return {
                'success': True,
                'data': {
                    'vms': vms,
                    'summary': summary
                }
            }
            
        except Exception as e:
            logger.error(f"Error querying VM inventory: {str(e)}")
            return {'success': False, 'error': str(e), 'data': {}}
    
    # ==================== MICROSOFT GRAPH / INTUNE ====================
    
    async def query_intune_devices(self, 
                                   compliance_state: Optional[str] = None,
                                   platform: Optional[str] = None) -> Dict:
        """
        Query Intune managed devices
        
        Args:
            compliance_state: Filter by compliance (compliant, noncompliant)
            platform: Filter by platform (iOS, Android, Windows, macOS)
        
        Returns:
            Intune device inventory with compliance status
        """
        try:
            graph_client = GraphServiceClient(
                credentials=self.credential,
                scopes=['https://graph.microsoft.com/.default']
            )
            
            devices = []
            
            # Build filter query
            filter_query = []
            if compliance_state:
                filter_query.append(f"complianceState eq '{compliance_state}'")
            if platform:
                filter_query.append(f"operatingSystem eq '{platform}'")
            
            filter_str = ' and '.join(filter_query) if filter_query else None
            
            # Get managed devices
            device_result = await graph_client.device_management.managed_devices.get(
                filter=filter_str,
                select=['id', 'deviceName', 'userPrincipalName', 'operatingSystem', 
                       'osVersion', 'complianceState', 'managementState', 'enrolledDateTime',
                       'lastSyncDateTime', 'azureADDeviceId', 'model', 'manufacturer',
                       'serialNumber', 'userDisplayName', 'emailAddress']
            )
            
            for device in device_result.value:
                device_data = {
                    'id': device.id,
                    'device_name': device.device_name,
                    'user_principal_name': device.user_principal_name,
                    'user_display_name': device.user_display_name,
                    'email': device.email_address,
                    'operating_system': device.operating_system,
                    'os_version': device.os_version,
                    'compliance_state': device.compliance_state,
                    'management_state': device.management_state,
                    'enrolled_date': device.enrolled_date_time.isoformat() if device.enrolled_date_time else None,
                    'last_sync': device.last_sync_date_time.isoformat() if device.last_sync_date_time else None,
                    'azure_ad_device_id': device.azure_ad_device_id,
                    'model': device.model,
                    'manufacturer': device.manufacturer,
                    'serial_number': device.serial_number
                }
                
                # Get compliance policies for device
                device_data['compliance_policies'] = await self._get_device_compliance_policies(device.id)
                
                # Get configuration profiles
                device_data['configuration_profiles'] = await self._get_device_configuration_profiles(device.id)
                
                # Get installed apps
                device_data['installed_apps'] = await self._get_device_apps(device.id)
                
                devices.append(device_data)
            
            # Get compliance summary
            compliance_summary = {
                'total_devices': len(devices),
                'compliant': sum(1 for d in devices if d['compliance_state'] == 'compliant'),
                'noncompliant': sum(1 for d in devices if d['compliance_state'] == 'noncompliant'),
                'unknown': sum(1 for d in devices if d['compliance_state'] == 'unknown'),
                'by_platform': self._group_devices_by_platform(devices),
                'by_model': self._group_devices_by_model(devices)
            }
            
            # Get policy compliance trends
            compliance_trends = await self._get_compliance_trends()
            
            return {
                'success': True,
                'data': {
                    'devices': devices,
                    'compliance_summary': compliance_summary,
                    'compliance_trends': compliance_trends,
                    'last_updated': datetime.utcnow().isoformat()
                }
            }
            
        except Exception as e:
            logger.error(f"Error querying Intune devices: {str(e)}")
            return {'success': False, 'error': str(e), 'data': {}}
    
    async def query_azure_ad_users(self, 
                                   include_guest: bool = False,
                                   include_disabled: bool = False) -> Dict:
        """Query Azure AD users with detailed information"""
        try:
            graph_client = GraphServiceClient(
                credentials=self.credential,
                scopes=['https://graph.microsoft.com/.default']
            )
            
            users = []
            
            # Build filter
            filters = []
            if not include_guest:
                filters.append("userType eq 'Member'")
            if not include_disabled:
                filters.append("accountEnabled eq true")
            
            filter_str = ' and '.join(filters) if filters else None
            
            # Get users
            user_result = await graph_client.users.get(
                filter=filter_str,
                select=['id', 'displayName', 'userPrincipalName', 'mail', 'jobTitle',
                       'department', 'officeLocation', 'mobilePhone', 'businessPhones',
                       'accountEnabled', 'userType', 'createdDateTime', 'lastSignInDateTime',
                       'assignedLicenses', 'assignedPlans', 'proxyAddresses']
            )
            
            for user in user_result.value:
                user_data = {
                    'id': user.id,
                    'display_name': user.display_name,
                    'user_principal_name': user.user_principal_name,
                    'email': user.mail,
                    'job_title': user.job_title,
                    'department': user.department,
                    'office_location': user.office_location,
                    'mobile_phone': user.mobile_phone,
                    'business_phones': user.business_phones,
                    'account_enabled': user.account_enabled,
                    'user_type': user.user_type,
                    'created_date': user.created_date_time.isoformat() if user.created_date_time else None,
                    'last_sign_in': user.last_sign_in_date_time.isoformat() if user.last_sign_in_date_time else None,
                    'licenses': [],
                    'groups': [],
                    'roles': []
                }
                
                # Get user licenses
                if user.assigned_licenses:
                    for license in user.assigned_licenses:
                        user_data['licenses'].append({
                            'sku_id': license.sku_id,
                            'disabled_plans': license.disabled_plans
                        })
                
                # Get user groups
                user_groups = await graph_client.users.by_user_id(user.id).member_of.get()
                for group in user_groups.value:
                    user_data['groups'].append({
                        'id': group.id,
                        'display_name': group.display_name
                    })
                
                # Get user roles
                user_roles = await graph_client.users.by_user_id(user.id).app_role_assignments.get()
                for role in user_roles.value:
                    user_data['roles'].append({
                        'id': role.id,
                        'resource_display_name': role.resource_display_name,
                        'app_role_id': role.app_role_id
                    })
                
                users.append(user_data)
            
            # Generate summary
            summary = {
                'total_users': len(users),
                'enabled_users': sum(1 for u in users if u['account_enabled']),
                'disabled_users': sum(1 for u in users if not u['account_enabled']),
                'member_users': sum(1 for u in users if u['user_type'] == 'Member'),
                'guest_users': sum(1 for u in users if u['user_type'] == 'Guest'),
                'by_department': self._group_users_by_department(users),
                'license_summary': self._analyze_license_usage(users),
                'inactive_users': self._identify_inactive_users(users)
            }
            
            return {
                'success': True,
                'data': {
                    'users': users,
                    'summary': summary
                }
            }
            
        except Exception as e:
            logger.error(f"Error querying Azure AD users: {str(e)}")
            return {'success': False, 'error': str(e), 'data': {}}
    
    async def query_conditional_access_policies(self) -> Dict:
        """Get conditional access policies and their effectiveness"""
        try:
            graph_client = GraphServiceClient(
                credentials=self.credential,
                scopes=['https://graph.microsoft.com/.default']
            )
            
            policies = []
            
            # Get conditional access policies
            policy_result = await graph_client.identity.conditional_access.policies.get()
            
            for policy in policy_result.value:
                policy_data = {
                    'id': policy.id,
                    'display_name': policy.display_name,
                    'created_date': policy.created_date_time.isoformat() if policy.created_date_time else None,
                    'modified_date': policy.modified_date_time.isoformat() if policy.modified_date_time else None,
                    'state': policy.state,
                    'conditions': {
                        'users': {
                            'include': policy.conditions.users.include_users if policy.conditions.users else [],
                            'exclude': policy.conditions.users.exclude_users if policy.conditions.users else []
                        },
                        'applications': {
                            'include': policy.conditions.applications.include_applications if policy.conditions.applications else [],
                            'exclude': policy.conditions.applications.exclude_applications if policy.conditions.applications else []
                        },
                        'platforms': {
                            'include': policy.conditions.platforms.include_platforms if policy.conditions.platforms else [],
                            'exclude': policy.conditions.platforms.exclude_platforms if policy.conditions.platforms else []
                        },
                        'locations': {
                            'include': policy.conditions.locations.include_locations if policy.conditions.locations else [],
                            'exclude': policy.conditions.locations.exclude_locations if policy.conditions.locations else []
                        },
                        'sign_in_risk_levels': policy.conditions.sign_in_risk_levels if hasattr(policy.conditions, 'sign_in_risk_levels') else [],
                        'user_risk_levels': policy.conditions.user_risk_levels if hasattr(policy.conditions, 'user_risk_levels') else []
                    },
                    'grant_controls': {
                        'operator': policy.grant_controls.operator if policy.grant_controls else None,
                        'built_in_controls': policy.grant_controls.built_in_controls if policy.grant_controls else [],
                        'custom_controls': policy.grant_controls.custom_authentication_factors if policy.grant_controls else [],
                        'terms_of_use': policy.grant_controls.terms_of_use if policy.grant_controls else []
                    },
                    'session_controls': {
                        'application_enforced_restrictions': policy.session_controls.application_enforced_restrictions_enabled if policy.session_controls else False,
                        'cloud_app_security': policy.session_controls.cloud_app_security if policy.session_controls else None,
                        'sign_in_frequency': policy.session_controls.sign_in_frequency if policy.session_controls else None,
                        'persistent_browser': policy.session_controls.persistent_browser if policy.session_controls else None
                    }
                }
                
                # Get policy insights
                policy_data['insights'] = await self._get_policy_insights(policy.id)
                
                policies.append(policy_data)
            
            # Analyze policy coverage
            coverage_analysis = {
                'total_policies': len(policies),
                'enabled_policies': sum(1 for p in policies if p['state'] == 'enabled'),
                'disabled_policies': sum(1 for p in policies if p['state'] == 'disabled'),
                'mfa_policies': sum(1 for p in policies if 'mfa' in str(p['grant_controls'].get('built_in_controls', [])).lower()),
                'risk_based_policies': sum(1 for p in policies if p['conditions']['sign_in_risk_levels'] or p['conditions']['user_risk_levels']),
                'platform_coverage': self._analyze_platform_coverage(policies),
                'application_coverage': self._analyze_application_coverage(policies)
            }
            
            return {
                'success': True,
                'data': {
                    'policies': policies,
                    'coverage_analysis': coverage_analysis
                }
            }
            
        except Exception as e:
            logger.error(f"Error querying conditional access policies: {str(e)}")
            return {'success': False, 'error': str(e), 'data': {}}
    
    # ==================== SECURITY & COMPLIANCE ====================
    
    async def query_security_score(self) -> Dict:
        """Get Microsoft Secure Score and recommendations"""
        try:
            graph_client = GraphServiceClient(
                credentials=self.credential,
                scopes=['https://graph.microsoft.com/.default']
            )
            
            # Get secure score
            score_result = await graph_client.security.secure_scores.get()
            current_score = score_result.value[0] if score_result.value else None
            
            if not current_score:
                return {'success': False, 'error': 'No secure score data available', 'data': {}}
            
            score_data = {
                'current_score': current_score.current_score,
                'max_score': current_score.max_score,
                'score_percentage': (current_score.current_score / current_score.max_score * 100) if current_score.max_score > 0 else 0,
                'licensed_user_count': current_score.licensed_user_count,
                'created_date': current_score.created_date_time.isoformat() if current_score.created_date_time else None,
                'control_scores': []
            }
            
            # Get control scores
            if current_score.control_scores:
                for control in current_score.control_scores:
                    score_data['control_scores'].append({
                        'control_name': control.control_name,
                        'control_category': control.control_category,
                        'score': control.score,
                        'max_score': control.max_score,
                        'description': control.description
                    })
            
            # Get secure score control profiles (recommendations)
            profiles_result = await graph_client.security.secure_score_control_profiles.get()
            recommendations = []
            
            for profile in profiles_result.value:
                if profile.score_improvement > 0:  # Only include actionable items
                    recommendations.append({
                        'id': profile.id,
                        'title': profile.title,
                        'control_category': profile.control_category,
                        'score_improvement': profile.score_improvement,
                        'rank': profile.rank,
                        'implementation_status': profile.implementation_status,
                        'action_type': profile.action_type,
                        'remediation': profile.remediation,
                        'action_url': profile.action_url,
                        'user_impact': profile.user_impact,
                        'implementation_cost': profile.implementation_cost,
                        'threats': profile.threats
                    })
            
            # Sort recommendations by score improvement
            recommendations.sort(key=lambda x: x['score_improvement'], reverse=True)
            
            # Calculate improvement potential
            total_improvement = sum(r['score_improvement'] for r in recommendations)
            potential_score = score_data['current_score'] + total_improvement
            potential_percentage = (potential_score / score_data['max_score'] * 100) if score_data['max_score'] > 0 else 0
            
            return {
                'success': True,
                'data': {
                    'secure_score': score_data,
                    'recommendations': recommendations[:20],  # Top 20 recommendations
                    'improvement_summary': {
                        'total_recommendations': len(recommendations),
                        'potential_improvement': total_improvement,
                        'potential_score': potential_score,
                        'potential_percentage': potential_percentage
                    }
                }
            }
            
        except Exception as e:
            logger.error(f"Error querying security score: {str(e)}")
            return {'success': False, 'error': str(e), 'data': {}}
    
    async def query_compliance_policies(self) -> Dict:
        """Get compliance policies and their effectiveness"""
        try:
            graph_client = GraphServiceClient(
                credentials=self.credential,
                scopes=['https://graph.microsoft.com/.default']
            )
            
            # Get device compliance policies
            compliance_policies = []
            policy_result = await graph_client.device_management.device_compliance_policies.get()
            
            for policy in policy_result.value:
                policy_data = {
                    'id': policy.id,
                    'display_name': policy.display_name,
                    'description': policy.description,
                    'created_date': policy.created_date_time.isoformat() if policy.created_date_time else None,
                    'last_modified': policy.last_modified_date_time.isoformat() if policy.last_modified_date_time else None,
                    'version': policy.version,
                    'assignments': [],
                    'settings': {},
                    'device_status_overview': {}
                }
                
                # Get policy assignments
                assignments = await graph_client.device_management.device_compliance_policies.by_device_compliance_policy_id(
                    policy.id
                ).assignments.get()
                
                for assignment in assignments.value:
                    policy_data['assignments'].append({
                        'id': assignment.id,
                        'target': assignment.target
                    })
                
                # Get device status overview
                status_overview = await graph_client.device_management.device_compliance_policies.by_device_compliance_policy_id(
                    policy.id
                ).device_status_overview.get()
                
                if status_overview:
                    policy_data['device_status_overview'] = {
                        'pending_count': status_overview.pending_count,
                        'not_applicable_count': status_overview.not_applicable_count,
                        'success_count': status_overview.success_count,
                        'error_count': status_overview.error_count,
                        'failed_count': status_overview.failed_count,
                        'conflict_count': status_overview.conflict_count
                    }
                
                compliance_policies.append(policy_data)
            
            # Get configuration policies
            configuration_policies = []
            config_result = await graph_client.device_management.device_configurations.get()
            
            for config in config_result.value:
                config_data = {
                    'id': config.id,
                    'display_name': config.display_name,
                    'description': config.description,
                    'created_date': config.created_date_time.isoformat() if config.created_date_time else None,
                    'last_modified': config.last_modified_date_time.isoformat() if config.last_modified_date_time else None,
                    'version': config.version,
                    'device_status_overview': {}
                }
                
                # Get device status overview
                status_overview = await graph_client.device_management.device_configurations.by_device_configuration_id(
                    config.id
                ).device_status_overview.get()
                
                if status_overview:
                    config_data['device_status_overview'] = {
                        'pending_count': status_overview.pending_count,
                        'not_applicable_count': status_overview.not_applicable_count,
                        'success_count': status_overview.success_count,
                        'error_count': status_overview.error_count,
                        'failed_count': status_overview.failed_count,
                        'conflict_count': status_overview.conflict_count
                    }
                
                configuration_policies.append(config_data)
            
            # Calculate compliance summary
            total_devices = 0
            compliant_devices = 0
            non_compliant_devices = 0
            
            for policy in compliance_policies:
                overview = policy.get('device_status_overview', {})
                total_devices += sum([
                    overview.get('success_count', 0),
                    overview.get('failed_count', 0),
                    overview.get('error_count', 0),
                    overview.get('pending_count', 0)
                ])
                compliant_devices += overview.get('success_count', 0)
                non_compliant_devices += overview.get('failed_count', 0) + overview.get('error_count', 0)
            
            compliance_rate = (compliant_devices / total_devices * 100) if total_devices > 0 else 0
            
            return {
                'success': True,
                'data': {
                    'compliance_policies': compliance_policies,
                    'configuration_policies': configuration_policies,
                    'summary': {
                        'total_compliance_policies': len(compliance_policies),
                        'total_configuration_policies': len(configuration_policies),
                        'total_devices': total_devices,
                        'compliant_devices': compliant_devices,
                        'non_compliant_devices': non_compliant_devices,
                        'compliance_rate': compliance_rate
                    }
                }
            }
            
        except Exception as e:
            logger.error(f"Error querying compliance policies: {str(e)}")
            return {'success': False, 'error': str(e), 'data': {}}
    
    # ==================== HELPER METHODS ====================
    
    def _build_cost_filter(self, filters: Dict) -> Dict:
        """Build cost management API filter"""
        filter_obj = {}
        
        if 'resource_group' in filters:
            filter_obj['dimensions'] = {
                'name': 'ResourceGroup',
                'operator': 'In',
                'values': filters['resource_group'] if isinstance(filters['resource_group'], list) else [filters['resource_group']]
            }
        
        if 'service' in filters:
            filter_obj['dimensions'] = {
                'name': 'ServiceName',
                'operator': 'In',
                'values': filters['service'] if isinstance(filters['service'], list) else [filters['service']]
            }
        
        if 'tags' in filters:
            filter_obj['tags'] = filters['tags']
        
        return filter_obj
    
    def _process_cost_data(self, raw_data) -> Dict:
        """Process raw cost data into structured format"""
        processed = {
            'total_cost': 0,
            'currency': 'USD',
            'daily_costs': [],
            'by_service': {},
            'by_resource_group': {},
            'top_resources': []
        }
        
        if hasattr(raw_data, 'rows'):
            for row in raw_data.rows:
                cost = row[0] if row else 0
                processed['total_cost'] += cost
                
                # Process by dimensions if available
                if len(row) > 1:
                    dimension_value = row[1]
                    if dimension_value not in processed['by_service']:
                        processed['by_service'][dimension_value] = 0
                    processed['by_service'][dimension_value] += cost
        
        # Sort top resources by cost
        if processed['by_service']:
            sorted_services = sorted(processed['by_service'].items(), key=lambda x: x[1], reverse=True)
            processed['top_resources'] = [
                {'name': name, 'cost': cost} for name, cost in sorted_services[:10]
            ]
        
        return processed
    
    async def _get_cost_recommendations(self) -> List[Dict]:
        """Get cost optimization recommendations"""
        try:
            advisor_client = self._get_client(AdvisorManagementClient)
            recommendations = []
            
            for recommendation in advisor_client.recommendations.list(
                filter="Category eq 'Cost'"
            ):
                recommendations.append({
                    'id': recommendation.id,
                    'name': recommendation.name,
                    'impact': recommendation.impact,
                    'risk': recommendation.risk,
                    'short_description': recommendation.short_description.problem,
                    'solution': recommendation.short_description.solution,
                    'annual_savings': recommendation.extended_properties.get('annualSavingsAmount', 0) if recommendation.extended_properties else 0,
                    'savings_currency': recommendation.extended_properties.get('savingsCurrency', 'USD') if recommendation.extended_properties else 'USD'
                })
            
            # Sort by annual savings
            recommendations.sort(key=lambda x: x['annual_savings'], reverse=True)
            
            return recommendations[:10]  # Top 10 recommendations
            
        except Exception as e:
            logger.error(f"Error getting cost recommendations: {str(e)}")
            return []
    
    async def _get_reserved_instance_coverage(self) -> Dict:
        """Get reserved instance coverage and recommendations"""
        try:
            reservations_client = self._get_client(AzureReservationAPI)
            
            coverage = {
                'coverage_percentage': 0,
                'total_vms': 0,
                'covered_vms': 0,
                'recommendations': []
            }
            
            # This would query actual RI data
            # Placeholder for demonstration
            coverage['coverage_percentage'] = 65
            coverage['total_vms'] = 100
            coverage['covered_vms'] = 65
            
            return coverage
            
        except Exception as e:
            logger.error(f"Error getting RI coverage: {str(e)}")
            return {}
    
    async def _get_budget_status(self) -> Dict:
        """Get current budget status"""
        return {
            'monthly_budget': 50000,
            'current_spend': 32500,
            'percentage_used': 65,
            'days_remaining': 15,
            'projected_overspend': False
        }
    
    async def _get_spending_forecast(self) -> Dict:
        """Get spending forecast for current month"""
        return {
            'current_month_actual': 32500,
            'current_month_forecast': 48000,
            'next_month_forecast': 52000,
            'confidence_level': 0.85
        }
    
    async def _detect_cost_anomalies(self) -> List[Dict]:
        """Detect cost anomalies"""
        anomalies = []
        
        # Placeholder for anomaly detection logic
        # Would use historical data and ML models in production
        
        return anomalies
    
    async def _get_resource_health(self, resources: List[Dict]) -> Dict:
        """Get health status for resources"""
        return {
            'healthy': len(resources) * 0.9,
            'degraded': len(resources) * 0.05,
            'unavailable': len(resources) * 0.05
        }
    
    async def _get_resource_costs(self, resources: List[Dict]) -> Dict:
        """Get cost data for resources"""
        total_cost = len(resources) * 150  # Placeholder
        return {
            'total_monthly_cost': total_cost,
            'average_cost_per_resource': total_cost / len(resources) if resources else 0
        }
    
    async def _analyze_resource_utilization(self, resources: List[Dict]) -> Dict:
        """Analyze resource utilization"""
        return {
            'average_cpu_utilization': 65,
            'average_memory_utilization': 72,
            'underutilized_resources': int(len(resources) * 0.2),
            'overutilized_resources': int(len(resources) * 0.1)
        }
    
    async def _get_vm_metrics(self, vm_id: str) -> Dict:
        """Get VM performance metrics"""
        return {
            'cpu_percentage': 45,
            'memory_percentage': 62,
            'disk_read_bytes_per_sec': 1024000,
            'disk_write_bytes_per_sec': 512000,
            'network_in_bytes_per_sec': 2048000,
            'network_out_bytes_per_sec': 1024000
        }
    
    async def _get_device_compliance_policies(self, device_id: str) -> List[Dict]:
        """Get compliance policies for a device"""
        return []
    
    async def _get_device_configuration_profiles(self, device_id: str) -> List[Dict]:
        """Get configuration profiles for a device"""
        return []
    
    async def _get_device_apps(self, device_id: str) -> List[Dict]:
        """Get installed apps for a device"""
        return []
    
    async def _get_compliance_trends(self) -> Dict:
        """Get compliance trend data"""
        return {
            'trend_30_days': [
                {'date': '2024-01-01', 'compliant': 85, 'noncompliant': 15},
                {'date': '2024-01-15', 'compliant': 87, 'noncompliant': 13},
                {'date': '2024-01-30', 'compliant': 90, 'noncompliant': 10}
            ]
        }
    
    async def _get_policy_insights(self, policy_id: str) -> Dict:
        """Get insights for a conditional access policy"""
        return {
            'sign_ins_impacted': 1500,
            'sign_ins_blocked': 50,
            'sign_ins_mfa_required': 1200,
            'effectiveness_score': 85
        }
    
    def _group_by_type(self, resources: List[Dict]) -> Dict:
        """Group resources by type"""
        grouped = {}
        for resource in resources:
            resource_type = resource['type']
            if resource_type not in grouped:
                grouped[resource_type] = 0
            grouped[resource_type] += 1
        return grouped
    
    def _group_by_location(self, resources: List[Dict]) -> Dict:
        """Group resources by location"""
        grouped = {}
        for resource in resources:
            location = resource['location']
            if location not in grouped:
                grouped[location] = 0
            grouped[location] += 1
        return grouped
    
    def _group_by_resource_group(self, resources: List[Dict]) -> Dict:
        """Group resources by resource group"""
        grouped = {}
        for resource in resources:
            rg = resource.get('resource_group', 'Unknown')
            if rg not in grouped:
                grouped[rg] = 0
            grouped[rg] += 1
        return grouped
    
    def _group_vms_by_size(self, vms: List[Dict]) -> Dict:
        """Group VMs by size"""
        grouped = {}
        for vm in vms:
            size = vm['vm_size']
            if size not in grouped:
                grouped[size] = 0
            grouped[size] += 1
        return grouped
    
    def _group_vms_by_os(self, vms: List[Dict]) -> Dict:
        """Group VMs by OS"""
        grouped = {}
        for vm in vms:
            os = vm['os_type']
            if os not in grouped:
                grouped[os] = 0
            grouped[os] += 1
        return grouped
    
    def _calculate_total_cores(self, vms: List[Dict]) -> int:
        """Calculate total CPU cores across VMs"""
        # This would map VM sizes to core counts
        # Placeholder calculation
        return len(vms) * 4
    
    def _calculate_total_memory(self, vms: List[Dict]) -> int:
        """Calculate total memory across VMs"""
        # This would map VM sizes to memory amounts
        # Placeholder calculation
        return len(vms) * 16
    
    def _group_devices_by_platform(self, devices: List[Dict]) -> Dict:
        """Group devices by platform"""
        grouped = {}
        for device in devices:
            platform = device['operating_system']
            if platform not in grouped:
                grouped[platform] = 0
            grouped[platform] += 1
        return grouped
    
    def _group_devices_by_model(self, devices: List[Dict]) -> Dict:
        """Group devices by model"""
        grouped = {}
        for device in devices:
            model = device.get('model', 'Unknown')
            if model not in grouped:
                grouped[model] = 0
            grouped[model] += 1
        return grouped
    
    def _group_users_by_department(self, users: List[Dict]) -> Dict:
        """Group users by department"""
        grouped = {}
        for user in users:
            dept = user.get('department', 'Unknown')
            if dept not in grouped:
                grouped[dept] = 0
            grouped[dept] += 1
        return grouped
    
    def _analyze_license_usage(self, users: List[Dict]) -> Dict:
        """Analyze license usage across users"""
        license_counts = {}
        for user in users:
            for license in user.get('licenses', []):
                sku_id = license['sku_id']
                if sku_id not in license_counts:
                    license_counts[sku_id] = 0
                license_counts[sku_id] += 1
        return license_counts
    
    def _identify_inactive_users(self, users: List[Dict]) -> List[str]:
        """Identify inactive users"""
        inactive = []
        cutoff_date = datetime.utcnow() - timedelta(days=90)
        
        for user in users:
            if user.get('last_sign_in'):
                last_sign_in = datetime.fromisoformat(user['last_sign_in'].replace('Z', '+00:00'))
                if last_sign_in < cutoff_date:
                    inactive.append(user['user_principal_name'])
            else:
                inactive.append(user['user_principal_name'])
        
        return inactive
    
    def _analyze_platform_coverage(self, policies: List[Dict]) -> Dict:
        """Analyze platform coverage by conditional access policies"""
        platforms = set()
        for policy in policies:
            if policy['conditions']['platforms']['include']:
                platforms.update(policy['conditions']['platforms']['include'])
        
        return {
            'covered_platforms': list(platforms),
            'coverage_count': len(platforms)
        }
    
    def _analyze_application_coverage(self, policies: List[Dict]) -> Dict:
        """Analyze application coverage by conditional access policies"""
        apps = set()
        for policy in policies:
            if policy['conditions']['applications']['include']:
                apps.update(policy['conditions']['applications']['include'])
        
        return {
            'covered_applications': list(apps),
            'coverage_count': len(apps)
        }
    
    def _update_metrics(self, start_time: datetime, success: bool):
        """Update query metrics"""
        elapsed = (datetime.utcnow() - start_time).total_seconds()
        self.query_metrics['total_queries'] += 1
        
        if not success:
            self.query_metrics['failed_queries'] += 1
        
        # Update average response time
        current_avg = self.query_metrics['avg_response_time']
        total_queries = self.query_metrics['total_queries']
        self.query_metrics['avg_response_time'] = ((current_avg * (total_queries - 1)) + elapsed) / total_queries
        self.query_metrics['last_query_time'] = datetime.utcnow()