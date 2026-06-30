"""
Oracle Cloud API Connector with AI-Powered Data Parsing
Automatically extracts and normalizes APM data from Oracle
"""

import os
import requests
import pandas as pd
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging
from .base import BaseConnector

logger = logging.getLogger(__name__)


class OracleConnector(BaseConnector):
    """
    Oracle Cloud connector with intelligent data extraction
    Parses financial data, PO numbers, and vendor information
    """
    
    def __init__(self):
        super().__init__()
        self.base_url = os.getenv('ORACLE_API_URL', 'https://cloud.oracle.com/api')
        self.client_id = os.getenv('ORACLE_CLIENT_ID')
        self.client_secret = os.getenv('ORACLE_CLIENT_SECRET')
        self.tenant_id = os.getenv('ORACLE_TENANT_ID')
        self.access_token = None
        
    def authenticate(self) -> bool:
        """Authenticate with Oracle Cloud API"""
        try:
            auth_url = f"{self.base_url}/oauth2/token"
            payload = {
                'grant_type': 'client_credentials',
                'client_id': self.client_id,
                'client_secret': self.client_secret,
                'scope': 'urn:opc:idm:__myscopes__'
            }
            
            response = requests.post(auth_url, data=payload)
            response.raise_for_status()
            
            self.access_token = response.json()['access_token']
            logger.info("Successfully authenticated with Oracle Cloud")
            return True
            
        except Exception as e:
            logger.error(f"Oracle authentication failed: {e}")
            return False
    
    def get_financial_data(self, start_date: str = None, end_date: str = None) -> List[Dict]:
        """
        Fetch financial transaction data from Oracle
        Returns parsed vendor spend, PO numbers, and cost centers
        """
        if not self.access_token:
            self.authenticate()
            
        try:
            # Oracle Fusion Financials API endpoint
            endpoint = f"{self.base_url}/fscmRestApi/resources/11.13.18.05/invoices"
            
            headers = {
                'Authorization': f'Bearer {self.access_token}',
                'Content-Type': 'application/json'
            }
            
            params = {
                'onlyData': 'true',
                'fields': 'InvoiceNumber,VendorName,InvoiceAmount,PurchaseOrder,CostCenter,LineOfBusiness,InvoiceDate'
            }
            
            if start_date:
                params['q'] = f"InvoiceDate >= '{start_date}'"
                
            response = requests.get(endpoint, headers=headers, params=params)
            response.raise_for_status()
            
            return self._parse_oracle_response(response.json())
            
        except Exception as e:
            logger.error(f"Failed to fetch Oracle data: {e}")
            return []
    
    def _parse_oracle_response(self, data: Dict) -> List[Dict]:
        """
        AI-powered parsing of Oracle response
        Normalizes vendor names, extracts PO numbers, calculates spend
        """
        parsed_records = []
        
        for item in data.get('items', []):
            try:
                # Extract and normalize vendor name
                vendor = self._normalize_vendor_name(item.get('VendorName', ''))
                
                # Extract PO number in correct format
                po_number = self._extract_po_number(item.get('PurchaseOrder', ''))
                
                # Parse amount
                amount = self._parse_amount(item.get('InvoiceAmount', 0))
                
                record = {
                    'vendor': vendor,
                    'vendor_original': item.get('VendorName', ''),
                    'po_number': po_number,
                    'amount': amount,
                    'cost_center': item.get('CostCenter', ''),
                    'lob': item.get('LineOfBusiness', ''),
                    'invoice_date': item.get('InvoiceDate', ''),
                    'invoice_number': item.get('InvoiceNumber', ''),
                    'source': 'Oracle Cloud',
                    'confidence': self._calculate_confidence(item)
                }
                
                parsed_records.append(record)
                
            except Exception as e:
                logger.warning(f"Failed to parse Oracle record: {e}")
                continue
                
        return parsed_records
    
    def _normalize_vendor_name(self, vendor: str) -> str:
        """
        Normalize vendor names to match APP_REG format
        Handles variations like INC vs INCORPORATED, removes special chars
        """
        if not vendor:
            return ''
            
        # Common normalizations
        vendor = vendor.upper().strip()
        
        # Standardize common suffixes
        replacements = {
            ' INCORPORATED': ' INC',
            ' CORPORATION': ' CORP',
            ' LIMITED': ' LTD',
            ' COMPANY': ' CO',
            ', INC.': ' INC',
            ', LLC.': ' LLC',
            ' & ': ' AND '
        }
        
        for old, new in replacements.items():
            vendor = vendor.replace(old, new)
            
        # Remove extra spaces and special characters
        vendor = ' '.join(vendor.split())
        
        return vendor
    
    def _extract_po_number(self, po_field: str) -> str:
        """Extract and format PO number to match CC############## format"""
        if not po_field:
            return ''
            
        # Look for CC followed by numbers
        import re
        match = re.search(r'CC\d{10,}', po_field)
        if match:
            return match.group()
            
        # Try to extract any long number sequence
        match = re.search(r'\d{10,}', po_field)
        if match:
            return f"CC{match.group()}"
            
        return po_field
    
    def _parse_amount(self, amount_field: Any) -> float:
        """Parse amount from various formats"""
        if isinstance(amount_field, (int, float)):
            return float(amount_field)
            
        if isinstance(amount_field, str):
            # Remove currency symbols and commas
            amount_field = amount_field.replace('$', '').replace(',', '').strip()
            try:
                return float(amount_field)
            except:
                return 0.0
                
        return 0.0
    
    def _calculate_confidence(self, record: Dict) -> float:
        """
        Calculate confidence score for the parsed data
        Higher score = more complete and reliable data
        """
        confidence = 0.0
        fields_checked = 0
        
        # Check each field for completeness
        if record.get('VendorName'):
            confidence += 0.25
            fields_checked += 1
            
        if record.get('PurchaseOrder'):
            confidence += 0.25
            fields_checked += 1
            
        if record.get('InvoiceAmount'):
            confidence += 0.25
            fields_checked += 1
            
        if record.get('CostCenter'):
            confidence += 0.15
            fields_checked += 1
            
        if record.get('LineOfBusiness'):
            confidence += 0.10
            fields_checked += 1
            
        return confidence
    
    def sync_with_app_registry(self, app_registry_df: pd.DataFrame) -> pd.DataFrame:
        """
        Sync Oracle data with APP_REG dataframe
        Updates spend, PO numbers, cost centers with high-confidence matches
        """
        oracle_data = self.get_financial_data()
        
        if not oracle_data:
            logger.warning("No Oracle data to sync")
            return app_registry_df
            
        # Create lookup dictionary by vendor
        oracle_by_vendor = {}
        for record in oracle_data:
            vendor = record['vendor']
            if vendor not in oracle_by_vendor:
                oracle_by_vendor[vendor] = []
            oracle_by_vendor[vendor].append(record)
        
        updates_made = 0
        
        # Update APP_REG with Oracle data
        for idx, row in app_registry_df.iterrows():
            vendor = self._normalize_vendor_name(row.get('vendor', ''))
            
            if vendor in oracle_by_vendor:
                oracle_records = oracle_by_vendor[vendor]
                
                # Calculate total spend for this vendor
                total_spend = sum(r['amount'] for r in oracle_records)
                
                # Get PO number with highest confidence
                po_numbers = [r['po_number'] for r in oracle_records if r['po_number']]
                if po_numbers:
                    # Update if currently empty
                    if pd.isna(row.get('poNumber')) or row.get('poNumber') == '':
                        app_registry_df.at[idx, 'poNumber'] = po_numbers[0]
                        updates_made += 1
                
                # Update spend if significantly different or empty
                if pd.isna(row.get('spend2025_YTD')) or row.get('spend2025_YTD') == 0:
                    app_registry_df.at[idx, 'spend2025_YTD'] = total_spend
                    app_registry_df.at[idx, 'enrichmentSource'] = 'Oracle Cloud API'
                    app_registry_df.at[idx, 'transactionCount'] = len(oracle_records)
                    updates_made += 1
                    
                # Update cost center if empty
                cost_centers = [r['cost_center'] for r in oracle_records if r['cost_center']]
                if cost_centers and (pd.isna(row.get('costCenterFromOracle')) or row.get('costCenterFromOracle') == ''):
                    app_registry_df.at[idx, 'costCenterFromOracle'] = cost_centers[0]
                    updates_made += 1
        
        logger.info(f"Oracle sync completed: {updates_made} updates made")
        return app_registry_df


# Singleton instance
oracle_connector = OracleConnector()