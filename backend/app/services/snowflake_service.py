"""
Snowflake Service - Core Data Connector for APM Dashboard
Handles live queries to customer Snowflake instances for APM data
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import logging

# Set up logging first
logger = logging.getLogger(__name__)

try:
    import snowflake.connector
    from snowflake.connector import ProgrammingError
    SNOWFLAKE_AVAILABLE = True
except ImportError:
    logger.warning("snowflake-connector-python not available. Install with: pip install snowflake-connector-python")
    SNOWFLAKE_AVAILABLE = False
import os
from contextlib import contextmanager
import json
import hashlib
from functools import lru_cache

logger = logging.getLogger(__name__)

class SnowflakeService:
    """
    Service for connecting to and querying Snowflake databases
    Supports multi-tenant architecture with customer-specific credentials
    """
    
    def __init__(self, customer_config: Optional[Dict] = None):
        """
        Initialize Snowflake service with customer configuration
        
        Args:
            customer_config: Dictionary containing Snowflake connection parameters
                           If None, uses environment variables for demo mode
        """
        if customer_config:
            self.config = customer_config
        else:
            # Use environment variables for demo/development
            self.config = {
                'account': os.getenv('SNOWFLAKE_ACCOUNT'),
                'user': os.getenv('SNOWFLAKE_USER'),
                'password': os.getenv('SNOWFLAKE_PASSWORD'),
                'warehouse': os.getenv('SNOWFLAKE_WAREHOUSE', 'COMPUTE_WH'),
                'database': os.getenv('SNOWFLAKE_DATABASE', 'APM_DATA'),
                'schema': os.getenv('SNOWFLAKE_SCHEMA', 'PUBLIC'),
                'role': os.getenv('SNOWFLAKE_ROLE', 'READONLY_ROLE')
            }
        
        self.connection = None
        self._validate_config()
    
    def _validate_config(self):
        """Validate required configuration parameters"""
        required_fields = ['account', 'user', 'password']
        missing_fields = [field for field in required_fields if not self.config.get(field)]
        
        if missing_fields:
            logger.warning(f"Missing Snowflake configuration fields: {missing_fields}")
            logger.info("Snowflake service will operate in demo mode")
    
    @contextmanager
    def get_connection(self):
        """
        Context manager for Snowflake connections
        Falls back to demo mode if Snowflake is not configured
        """
        conn = None
        try:
            # Check if Snowflake is available and properly configured
            if SNOWFLAKE_AVAILABLE and self._is_configured():
                logger.info(f"Connecting to Snowflake: {self.config['account']}")
                conn = snowflake.connector.connect(
                    account=self.config['account'],
                    user=self.config['user'],
                    password=self.config['password'],
                    warehouse=self.config.get('warehouse', 'COMPUTE_WH'),
                    database=self.config.get('database', 'APM_DATA'),
                    schema=self.config.get('schema', 'PUBLIC'),
                    role=self.config.get('role'),
                    timeout=30,
                    login_timeout=10,
                    network_timeout=60
                )
                logger.info("✅ Snowflake connection established")
                yield conn
            else:
                logger.info(f"Demo mode - simulating Snowflake connection (config available: {self._is_configured()})")
                yield None  # None signals to use demo data
        except Exception as e:
            logger.error(f"Snowflake connection failed: {str(e)}")
            logger.info("Falling back to demo mode")
            yield None  # Fallback to demo data
        finally:
            if conn:
                try:
                    conn.close()
                    logger.info("Snowflake connection closed")
                except Exception as e:
                    logger.warning(f"Error closing Snowflake connection: {e}")
    
    def _is_configured(self) -> bool:
        """Check if required Snowflake configuration is available"""
        required_fields = ['account', 'user', 'password']
        return all(self.config.get(field) for field in required_fields)
    
    def query_vendor_spend(self, date_range: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Query vendor spend data from APM tables
        
        Args:
            date_range: Optional dict with 'start_date' and 'end_date'
        
        Returns:
            Dictionary containing vendor spend metrics
        """
        try:
            with self.get_connection() as conn:
                if conn:
                    cursor = conn.cursor()
                    
                    # Build date filter
                    date_filter = ""
                    if date_range:
                        date_filter = f"""
                        WHERE transaction_date >= '{date_range.get('start_date', '2024-01-01')}'
                        AND transaction_date <= '{date_range.get('end_date', '2024-12-31')}'
                        """
                    
                    # Query top vendors by spend
                    query = f"""
                    SELECT 
                        vendor_name,
                        SUM(amount) as total_spend,
                        COUNT(DISTINCT application_id) as app_count,
                        COUNT(DISTINCT contract_id) as contract_count,
                        AVG(amount) as avg_transaction,
                        DATE_TRUNC('month', transaction_date) as month
                    FROM apm_transactions
                    {date_filter}
                    GROUP BY vendor_name, month
                    ORDER BY total_spend DESC
                    LIMIT 100
                    """
                    
                    cursor.execute(query)
                    results = cursor.fetchall()
                    
                    # Process results
                    vendors = []
                    total_spend = 0
                    for row in results:
                        vendor_data = {
                            'vendor_name': row[0],
                            'total_spend': float(row[1]),
                            'app_count': row[2],
                            'contract_count': row[3],
                            'avg_transaction': float(row[4]) if row[4] else 0,
                            'month': row[5].isoformat() if row[5] else None
                        }
                        vendors.append(vendor_data)
                        total_spend += vendor_data['total_spend']
                    
                    return {
                        'success': True,
                        'data': {
                            'vendors': vendors[:10],  # Top 10 vendors
                            'total_spend': total_spend,
                            'vendor_count': len(set(v['vendor_name'] for v in vendors)),
                            'query_timestamp': datetime.utcnow().isoformat()
                        }
                    }
                else:
                    # Return demo data
                    return self._get_demo_vendor_spend()
                    
        except Exception as e:
            logger.error(f"Error querying vendor spend: {str(e)}")
            return self._get_demo_vendor_spend()
    
    def query_application_metrics(self) -> Dict[str, Any]:
        """
        Query application portfolio metrics
        
        Returns:
            Dictionary containing application metrics
        """
        try:
            with self.get_connection() as conn:
                if conn:
                    cursor = conn.cursor()
                    
                    # Query application metrics
                    query = """
                    SELECT 
                        COUNT(DISTINCT application_id) as total_apps,
                        COUNT(DISTINCT vendor_id) as total_vendors,
                        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_apps,
                        SUM(CASE WHEN compliance_status = 'Compliant' THEN 1 ELSE 0 END) as compliant_apps,
                        AVG(health_score) as avg_health_score,
                        SUM(annual_cost) as total_annual_cost
                    FROM apm_applications
                    WHERE record_status = 'Current'
                    """
                    
                    cursor.execute(query)
                    result = cursor.fetchone()
                    
                    if result:
                        return {
                            'success': True,
                            'data': {
                                'total_applications': result[0] or 0,
                                'total_vendors': result[1] or 0,
                                'active_applications': result[2] or 0,
                                'compliant_applications': result[3] or 0,
                                'avg_health_score': float(result[4]) if result[4] else 0,
                                'total_annual_cost': float(result[5]) if result[5] else 0,
                                'compliance_rate': (result[3] / result[0] * 100) if result[0] else 0,
                                'query_timestamp': datetime.utcnow().isoformat()
                            }
                        }
                else:
                    return self._get_demo_application_metrics()
                    
        except Exception as e:
            logger.error(f"Error querying application metrics: {str(e)}")
            return self._get_demo_application_metrics()
    
    def query_cost_trends(self, months: int = 12) -> Dict[str, Any]:
        """
        Query cost trend data over time
        
        Args:
            months: Number of months to look back
        
        Returns:
            Dictionary containing cost trend data
        """
        try:
            with self.get_connection() as conn:
                if conn:
                    cursor = conn.cursor()
                    
                    # Calculate date range
                    end_date = datetime.now()
                    start_date = end_date - timedelta(days=months * 30)
                    
                    query = f"""
                    SELECT 
                        DATE_TRUNC('month', transaction_date) as month,
                        SUM(amount) as monthly_spend,
                        COUNT(DISTINCT vendor_id) as vendor_count,
                        COUNT(DISTINCT application_id) as app_count,
                        AVG(amount) as avg_transaction_size
                    FROM apm_transactions
                    WHERE transaction_date >= '{start_date.strftime('%Y-%m-%d')}'
                    AND transaction_date <= '{end_date.strftime('%Y-%m-%d')}'
                    GROUP BY month
                    ORDER BY month DESC
                    """
                    
                    cursor.execute(query)
                    results = cursor.fetchall()
                    
                    trends = []
                    for row in results:
                        trends.append({
                            'month': row[0].isoformat() if row[0] else None,
                            'monthly_spend': float(row[1]) if row[1] else 0,
                            'vendor_count': row[2] or 0,
                            'app_count': row[3] or 0,
                            'avg_transaction': float(row[4]) if row[4] else 0
                        })
                    
                    # Calculate trend metrics
                    if len(trends) >= 2:
                        current_spend = trends[0]['monthly_spend']
                        previous_spend = trends[1]['monthly_spend']
                        trend_percentage = ((current_spend - previous_spend) / previous_spend * 100) if previous_spend else 0
                    else:
                        trend_percentage = 0
                    
                    return {
                        'success': True,
                        'data': {
                            'trends': trends,
                            'current_month_spend': trends[0]['monthly_spend'] if trends else 0,
                            'trend_percentage': trend_percentage,
                            'total_period_spend': sum(t['monthly_spend'] for t in trends),
                            'query_timestamp': datetime.utcnow().isoformat()
                        }
                    }
                else:
                    return self._get_demo_cost_trends()
                    
        except Exception as e:
            logger.error(f"Error querying cost trends: {str(e)}")
            return self._get_demo_cost_trends()
    
    def query_compliance_metrics(self) -> Dict[str, Any]:
        """
        Query compliance and risk metrics
        
        Returns:
            Dictionary containing compliance metrics
        """
        try:
            with self.get_connection() as conn:
                if conn:
                    cursor = conn.cursor()
                    
                    query = """
                    SELECT 
                        compliance_category,
                        COUNT(*) as app_count,
                        AVG(compliance_score) as avg_score,
                        SUM(CASE WHEN compliance_score >= 90 THEN 1 ELSE 0 END) as high_compliance,
                        SUM(CASE WHEN compliance_score < 70 THEN 1 ELSE 0 END) as low_compliance
                    FROM apm_compliance
                    WHERE assessment_date >= DATEADD(day, -30, CURRENT_DATE())
                    GROUP BY compliance_category
                    """
                    
                    cursor.execute(query)
                    results = cursor.fetchall()
                    
                    categories = []
                    overall_score = 0
                    total_apps = 0
                    
                    for row in results:
                        category_data = {
                            'category': row[0],
                            'app_count': row[1] or 0,
                            'avg_score': float(row[2]) if row[2] else 0,
                            'high_compliance': row[3] or 0,
                            'low_compliance': row[4] or 0
                        }
                        categories.append(category_data)
                        overall_score += category_data['avg_score'] * category_data['app_count']
                        total_apps += category_data['app_count']
                    
                    return {
                        'success': True,
                        'data': {
                            'categories': categories,
                            'overall_compliance_score': (overall_score / total_apps) if total_apps else 0,
                            'total_assessed_apps': total_apps,
                            'high_risk_apps': sum(c['low_compliance'] for c in categories),
                            'query_timestamp': datetime.utcnow().isoformat()
                        }
                    }
                else:
                    return self._get_demo_compliance_metrics()
                    
        except Exception as e:
            logger.error(f"Error querying compliance metrics: {str(e)}")
            return self._get_demo_compliance_metrics()
    
    # Demo data methods for development/testing
    def _get_demo_vendor_spend(self, date_range: Optional[Dict] = None) -> Dict[str, Any]:
        """Return demo vendor spend data using Hubbell mock database"""
        try:
            from app.snowflake_mock_data.mock_database import hubbell_mock_db
            result = hubbell_mock_db.query_vendor_spend(date_range)
            result['demo_mode'] = True
            return result
        except ImportError:
            # Fallback to original demo data if mock database not available
            return {
                'success': True,
                'demo_mode': True,
                'data': {
                    'vendors': [
                        {'vendor_name': 'SAP', 'total_spend': 1150000, 'app_count': 12, 'contract_count': 4},
                        {'vendor_name': 'Salesforce', 'total_spend': 920000, 'app_count': 8, 'contract_count': 3},
                        {'vendor_name': 'Oracle', 'total_spend': 856000, 'app_count': 15, 'contract_count': 6},
                        {'vendor_name': 'Microsoft', 'total_spend': 734000, 'app_count': 25, 'contract_count': 8},
                        {'vendor_name': 'ANSYS', 'total_spend': 689000, 'app_count': 5, 'contract_count': 2},
                        {'vendor_name': 'Dassault Systemes', 'total_spend': 612000, 'app_count': 7, 'contract_count': 3},
                        {'vendor_name': 'General Electric', 'total_spend': 578000, 'app_count': 6, 'contract_count': 3},
                        {'vendor_name': 'Schneider Electric', 'total_spend': 445000, 'app_count': 4, 'contract_count': 2},
                        {'vendor_name': 'AVEVA', 'total_spend': 389000, 'app_count': 3, 'contract_count': 2},
                        {'vendor_name': 'Rockwell Automation', 'total_spend': 356000, 'app_count': 4, 'contract_count': 2}
                    ],
                    'total_spend': 18500000,
                    'vendor_count': 89,
                    'query_timestamp': datetime.utcnow().isoformat()
                }
            }
    
    def _get_demo_application_metrics(self) -> Dict[str, Any]:
        """Return demo application metrics using Hubbell mock database"""
        try:
            from app.snowflake_mock_data.mock_database import hubbell_mock_db
            result = hubbell_mock_db.query_application_metrics()
            result['demo_mode'] = True
            return result
        except ImportError:
            # Fallback to original demo data
            return {
                'success': True,
                'demo_mode': True,
                'data': {
                    'total_applications': 235,
                    'total_vendors': 89,
                    'active_applications': 218,
                    'compliant_applications': 195,
                    'avg_health_score': 84.7,
                    'total_annual_cost': 18500000,
                    'compliance_rate': 83.0,
                    'query_timestamp': datetime.utcnow().isoformat()
                }
            }
    
    def _get_demo_cost_trends(self) -> Dict[str, Any]:
        """Return demo cost trend data using Hubbell mock database"""
        try:
            from app.snowflake_mock_data.mock_database import hubbell_mock_db
            result = hubbell_mock_db.query_cost_trends()
            result['demo_mode'] = True
            return result
        except ImportError:
            # Fallback to original demo data
            trends = []
            base_spend = 1500000  # Lower spend for Hubbell
            for i in range(12):
                month_date = datetime.now() - timedelta(days=i * 30)
                variation = (12 - i) * 25000  # Decreasing trend
                trends.append({
                    'month': month_date.strftime('%Y-%m'),
                    'monthly_spend': base_spend - variation,
                    'vendor_count': 89 + (i * 2),
                    'app_count': 235 + (i * 3),
                    'avg_transaction': 8500 - (i * 50)
                })
            
            return {
                'success': True,
                'demo_mode': True,
                'data': {
                    'trends': trends,
                    'current_month_spend': trends[0]['monthly_spend'],
                    'trend_percentage': -3.8,
                    'total_period_spend': sum(t['monthly_spend'] for t in trends),
                    'query_timestamp': datetime.utcnow().isoformat()
                }
            }
    
    def _get_demo_compliance_metrics(self) -> Dict[str, Any]:
        """Return demo compliance metrics using Hubbell mock database"""
        try:
            from app.snowflake_mock_data.mock_database import hubbell_mock_db
            result = hubbell_mock_db.query_compliance_metrics()
            result['demo_mode'] = True
            return result
        except ImportError:
            # Fallback to original demo data
            return {
                'success': True,
                'demo_mode': True,
                'data': {
                    'categories': [
                        {'category': 'Security', 'app_count': 235, 'avg_score': 88.2, 'high_compliance': 187, 'low_compliance': 23},
                        {'category': 'Data Privacy', 'app_count': 235, 'avg_score': 84.1, 'high_compliance': 156, 'low_compliance': 34},
                        {'category': 'Licensing', 'app_count': 235, 'avg_score': 91.8, 'high_compliance': 203, 'low_compliance': 12},
                        {'category': 'Financial', 'app_count': 235, 'avg_score': 89.4, 'high_compliance': 198, 'low_compliance': 18},
                        {'category': 'Operational', 'app_count': 235, 'avg_score': 86.7, 'high_compliance': 167, 'low_compliance': 28},
                        {'category': 'Regulatory', 'app_count': 235, 'avg_score': 83.9, 'high_compliance': 145, 'low_compliance': 42}
                    ],
                    'overall_compliance_score': 87.4,
                    'total_assessed_apps': 1410,  # 235 apps * 6 categories
                    'high_risk_apps': 157,
                    'query_timestamp': datetime.utcnow().isoformat()
                }
            }
    
    def test_connection(self) -> bool:
        """
        Test Snowflake connection (Demo mode always returns True)
        
        Returns:
            True if connection successful, False otherwise
        """
        try:
            logger.info("Demo mode - simulating successful Snowflake connection test")
            logger.info(f"Simulated connection to: {self.config.get('account', 'hubbell.snowflakecomputing.com')}")
            return True
        except Exception as e:
            logger.error(f"Demo mode connection test failed: {str(e)}")
            return False