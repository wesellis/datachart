"""
Customer Model - Multi-tenant customer management with encrypted credentials
"""

from sqlalchemy import Column, String, DateTime, Boolean, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from datetime import datetime
from typing import Dict, Optional
import json
from cryptography.fernet import Fernet
import os
import base64
import hashlib

Base = declarative_base()

class Customer(Base):
    """
    Customer model for multi-tenant architecture
    Stores customer information and encrypted API credentials
    """
    __tablename__ = 'customers'
    
    # Primary fields
    id = Column(String(50), primary_key=True)
    name = Column(String(200), nullable=False)
    company_name = Column(String(200), nullable=False)
    email = Column(String(200), unique=True, nullable=False)
    
    # Subscription details
    subscription_tier = Column(String(50), default='starter')  # starter, professional, enterprise
    subscription_status = Column(String(50), default='trial')  # trial, active, suspended, cancelled
    trial_ends_at = Column(DateTime)
    
    # Encrypted credential storage (JSON)
    snowflake_credentials = Column(Text)  # Encrypted JSON
    azure_credentials = Column(Text)      # Encrypted JSON
    servicenow_credentials = Column(Text) # Encrypted JSON
    custom_credentials = Column(Text)     # Encrypted JSON for other sources
    
    # Configuration
    dashboard_config = Column(JSON)  # Dashboard preferences and settings
    data_sources = Column(JSON)      # List of enabled data sources
    features = Column(JSON)          # Feature flags and limits
    
    # Security
    api_key = Column(String(100), unique=True)
    ip_whitelist = Column(JSON)  # List of allowed IP addresses
    last_login = Column(DateTime)
    
    # Metadata
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
    is_active = Column(Boolean, default=True)
    is_demo = Column(Boolean, default=False)
    
    def __repr__(self):
        return f"<Customer(id={self.id}, company={self.company_name})>"


class CredentialManager:
    """
    Manages encryption and decryption of customer credentials
    Uses Fernet symmetric encryption for secure storage
    """
    
    def __init__(self):
        """Initialize credential manager with encryption key"""
        # Get or generate encryption key
        encryption_key = os.getenv('ENCRYPTION_KEY')
        if not encryption_key:
            # Generate a new key for development (should be persistent in production)
            encryption_key = Fernet.generate_key().decode()
            logger.warning("Generated new encryption key - set ENCRYPTION_KEY env var in production")
        
        # Ensure key is properly formatted
        if len(encryption_key) < 32:
            # Pad the key to proper length
            key_bytes = hashlib.sha256(encryption_key.encode()).digest()
            encryption_key = base64.urlsafe_b64encode(key_bytes).decode()
        
        self.cipher = Fernet(encryption_key.encode() if isinstance(encryption_key, str) else encryption_key)
    
    def encrypt_credentials(self, credentials: Dict) -> str:
        """
        Encrypt credential dictionary
        
        Args:
            credentials: Dictionary of credentials to encrypt
        
        Returns:
            Encrypted string representation
        """
        try:
            # Convert to JSON string
            json_str = json.dumps(credentials)
            # Encrypt
            encrypted = self.cipher.encrypt(json_str.encode())
            # Return as base64 string
            return encrypted.decode()
        except Exception as e:
            logger.error(f"Failed to encrypt credentials: {str(e)}")
            raise
    
    def decrypt_credentials(self, encrypted_str: str) -> Dict:
        """
        Decrypt credential string back to dictionary
        
        Args:
            encrypted_str: Encrypted credential string
        
        Returns:
            Decrypted credential dictionary
        """
        try:
            if not encrypted_str:
                return {}
            
            # Decrypt
            decrypted = self.cipher.decrypt(encrypted_str.encode())
            # Parse JSON
            return json.loads(decrypted.decode())
        except Exception as e:
            logger.error(f"Failed to decrypt credentials: {str(e)}")
            return {}
    
    def store_snowflake_credentials(self, customer: Customer, credentials: Dict) -> None:
        """
        Store encrypted Snowflake credentials for a customer
        
        Args:
            customer: Customer model instance
            credentials: Dictionary containing Snowflake connection parameters
        """
        required_fields = ['account', 'user', 'password']
        if not all(field in credentials for field in required_fields):
            raise ValueError(f"Missing required Snowflake fields: {required_fields}")
        
        # Add default values for optional fields
        credentials.setdefault('warehouse', 'COMPUTE_WH')
        credentials.setdefault('database', 'APM_DATA')
        credentials.setdefault('schema', 'PUBLIC')
        credentials.setdefault('role', 'READONLY_ROLE')
        
        # Encrypt and store
        customer.snowflake_credentials = self.encrypt_credentials(credentials)
    
    def get_snowflake_credentials(self, customer: Customer) -> Dict:
        """
        Retrieve decrypted Snowflake credentials for a customer
        
        Args:
            customer: Customer model instance
        
        Returns:
            Dictionary of Snowflake connection parameters
        """
        if customer.snowflake_credentials:
            return self.decrypt_credentials(customer.snowflake_credentials)
        return {}
    
    def store_azure_credentials(self, customer: Customer, credentials: Dict) -> None:
        """
        Store encrypted Azure credentials for a customer
        
        Args:
            customer: Customer model instance
            credentials: Dictionary containing Azure connection parameters
        """
        required_fields = ['tenant_id', 'client_id', 'client_secret']
        if not all(field in credentials for field in required_fields):
            raise ValueError(f"Missing required Azure fields: {required_fields}")
        
        # Encrypt and store
        customer.azure_credentials = self.encrypt_credentials(credentials)
    
    def get_azure_credentials(self, customer: Customer) -> Dict:
        """
        Retrieve decrypted Azure credentials for a customer
        
        Args:
            customer: Customer model instance
        
        Returns:
            Dictionary of Azure connection parameters
        """
        if customer.azure_credentials:
            return self.decrypt_credentials(customer.azure_credentials)
        return {}
    
    def store_servicenow_credentials(self, customer: Customer, credentials: Dict) -> None:
        """
        Store encrypted ServiceNow credentials for a customer
        
        Args:
            customer: Customer model instance
            credentials: Dictionary containing ServiceNow connection parameters
        """
        required_fields = ['instance', 'username', 'password']
        if not all(field in credentials for field in required_fields):
            raise ValueError(f"Missing required ServiceNow fields: {required_fields}")
        
        # Encrypt and store
        customer.servicenow_credentials = self.encrypt_credentials(credentials)
    
    def get_servicenow_credentials(self, customer: Customer) -> Dict:
        """
        Retrieve decrypted ServiceNow credentials for a customer
        
        Args:
            customer: Customer model instance
        
        Returns:
            Dictionary of ServiceNow connection parameters
        """
        if customer.servicenow_credentials:
            return self.decrypt_credentials(customer.servicenow_credentials)
        return {}
    
    def validate_credentials(self, service: str, credentials: Dict) -> bool:
        """
        Validate that credentials have required fields for a service
        
        Args:
            service: Service name (snowflake, azure, servicenow)
            credentials: Credentials dictionary to validate
        
        Returns:
            True if valid, False otherwise
        """
        required_fields = {
            'snowflake': ['account', 'user', 'password'],
            'azure': ['tenant_id', 'client_id', 'client_secret'],
            'servicenow': ['instance', 'username', 'password']
        }
        
        if service not in required_fields:
            return False
        
        return all(field in credentials for field in required_fields[service])


# Example customer creation
def create_demo_customer() -> Customer:
    """Create a demo customer for testing"""
    customer = Customer(
        id='demo-001',
        name='Demo User',
        company_name='Demo Company',
        email='demo@datachart.com',
        subscription_tier='enterprise',
        subscription_status='active',
        is_demo=True,
        api_key='demo-api-key-12345',
        dashboard_config={
            'theme': 'dark',
            'refresh_interval': 300,
            'default_view': 'executive'
        },
        data_sources=['snowflake', 'azure', 'servicenow'],
        features={
            'max_dashboards': 10,
            'max_users': 5,
            'api_rate_limit': 1000,
            'data_retention_days': 30
        }
    )
    
    # Add demo credentials (would be encrypted in production)
    cred_manager = CredentialManager()
    
    # Demo Snowflake credentials
    cred_manager.store_snowflake_credentials(customer, {
        'account': 'demo.snowflakecomputing.com',
        'user': 'demo_user',
        'password': 'demo_password',
        'warehouse': 'DEMO_WH',
        'database': 'DEMO_APM',
        'schema': 'PUBLIC'
    })
    
    # Demo Azure credentials
    cred_manager.store_azure_credentials(customer, {
        'tenant_id': 'demo-tenant-id',
        'client_id': 'demo-client-id',
        'client_secret': 'demo-client-secret',
        'subscription_id': 'demo-subscription-id'
    })
    
    # Demo ServiceNow credentials
    cred_manager.store_servicenow_credentials(customer, {
        'instance': 'demo.service-now.com',
        'username': 'demo_api_user',
        'password': 'demo_api_password'
    })
    
    return customer


import logging
logger = logging.getLogger(__name__)