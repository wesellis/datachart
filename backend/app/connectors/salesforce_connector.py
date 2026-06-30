"""
Salesforce API Connector with AI-Powered Data Parsing
Extracts contract, DSR, and vendor relationship data
"""

import os
import logging
from typing import Dict, List, Any, Optional
from simple_salesforce import Salesforce
import pandas as pd
from datetime import datetime

logger = logging.getLogger(__name__)


class SalesforceConnector:
    """
    Salesforce connector for Conga/CPQ data extraction
    Focuses on contracts, DSR numbers, and vendor relationships
    """
    
    def __init__(self):
        self.username = os.getenv('SALESFORCE_USERNAME')
        self.password = os.getenv('SALESFORCE_PASSWORD')
        self.security_token = os.getenv('SALESFORCE_SECURITY_TOKEN')
        self.domain = os.getenv('SALESFORCE_DOMAIN', 'login')
        self.sf_client = None
        
    def authenticate(self) -> bool:
        """Authenticate with Salesforce"""
        try:
            self.sf_client = Salesforce(
                username=self.username,
                password=self.password,
                security_token=self.security_token,
                domain=self.domain
            )
            logger.info("Successfully authenticated with Salesforce")
            return True
        except Exception as e:
            logger.error(f"Salesforce authentication failed: {e}")
            return False
    
    def get_contract_data(self) -> List[Dict]:
        """
        Fetch contract data from Salesforce
        Includes DSR numbers, dates, and vendor information
        """
        if not self.sf_client:
            self.authenticate()
            
        try:
            # Query Conga Contracts object
            query = """
                SELECT 
                    Id,
                    Name,
                    ContractNumber,
                    Account.Name,
                    StartDate,
                    EndDate,
                    Status,
                    TotalAmount,
                    Description,
                    DSR_Number__c,
                    PO_Number__c,
                    Vendor_Name__c,
                    Cost_Center__c,
                    Business_Owner__c,
                    Renewal_Date__c,
                    Contract_Type__c
                FROM Contract
                WHERE Status = 'Activated'
                AND EndDate >= TODAY
                ORDER BY Account.Name
            """
            
            results = self.sf_client.query_all(query)
            
            return self._parse_salesforce_contracts(results)
            
        except Exception as e:
            logger.error(f"Failed to fetch Salesforce data: {e}")
            return []
    
    def get_dsr_records(self) -> List[Dict]:
        """
        Fetch DSR (Deal Sheet Request) records
        Custom object in Salesforce for procurement
        """
        if not self.sf_client:
            self.authenticate()
            
        try:
            # Query DSR custom object
            query = """
                SELECT
                    Id,
                    Name,
                    DSR_Number__c,
                    Vendor__c,
                    Vendor__r.Name,
                    Total_Value__c,
                    Start_Date__c,
                    End_Date__c,
                    Status__c,
                    Business_Owner__c,
                    Cost_Center__c,
                    PO_Number__c,
                    Contract_Link__c
                FROM DSR__c
                WHERE Status__c IN ('Active', 'Approved')
                ORDER BY DSR_Number__c DESC
            """
            
            results = self.sf_client.query_all(query)
            
            return self._parse_dsr_records(results)
            
        except Exception as e:
            logger.error(f"Failed to fetch DSR data: {e}")
            # DSR might be stored differently, try alternative
            return self._get_dsr_from_opportunities()
    
    def _get_dsr_from_opportunities(self) -> List[Dict]:
        """Alternative: Get DSR data from Opportunities"""
        try:
            query = """
                SELECT
                    Id,
                    Name,
                    Account.Name,
                    Amount,
                    CloseDate,
                    StageName,
                    DSR_Number__c,
                    PO_Number__c,
                    Contract_Start_Date__c,
                    Contract_End_Date__c,
                    Vendor_Name__c
                FROM Opportunity
                WHERE StageName = 'Closed Won'
                AND DSR_Number__c != null
                ORDER BY CloseDate DESC
            """
            
            results = self.sf_client.query_all(query)
            return self._parse_opportunities(results)
            
        except Exception as e:
            logger.error(f"Failed to fetch Opportunity data: {e}")
            return []
    
    def _parse_salesforce_contracts(self, sf_data: Dict) -> List[Dict]:
        """Parse Salesforce contract response"""
        parsed_records = []
        
        for record in sf_data.get('records', []):
            try:
                # Extract vendor name from Account or custom field
                vendor = record.get('Vendor_Name__c', '')
                if not vendor and record.get('Account'):
                    vendor = record['Account'].get('Name', '')
                
                parsed_record = {
                    'contract_id': record.get('Id'),
                    'contract_number': record.get('ContractNumber', ''),
                    'dsr_number': record.get('DSR_Number__c', ''),
                    'vendor_name': vendor,
                    'po_number': record.get('PO_Number__c', ''),
                    'start_date': record.get('StartDate'),
                    'end_date': record.get('EndDate'),
                    'renewal_date': record.get('Renewal_Date__c'),
                    'total_amount': record.get('TotalAmount', 0),
                    'cost_center': record.get('Cost_Center__c', ''),
                    'business_owner': record.get('Business_Owner__c', ''),
                    'contract_type': record.get('Contract_Type__c', ''),
                    'status': record.get('Status'),
                    'description': record.get('Description', ''),
                    'source': 'Salesforce Contracts'
                }
                
                # Create contract details for date extraction
                parsed_record['contract_details'] = f"""
                    Contract {parsed_record['contract_number']}
                    DSR: {parsed_record['dsr_number']}
                    Start Date: {parsed_record['start_date']}
                    End Date: {parsed_record['end_date']}
                    Renewal Date: {parsed_record['renewal_date']}
                    {parsed_record['description']}
                """
                
                parsed_records.append(parsed_record)
                
            except Exception as e:
                logger.warning(f"Failed to parse Salesforce contract: {e}")
                continue
                
        return parsed_records
    
    def _parse_dsr_records(self, sf_data: Dict) -> List[Dict]:
        """Parse DSR records"""
        parsed_records = []
        
        for record in sf_data.get('records', []):
            try:
                vendor = record.get('Vendor__r', {}).get('Name', '')
                if not vendor:
                    vendor = record.get('Vendor__c', '')
                
                parsed_record = {
                    'dsr_id': record.get('Id'),
                    'dsr_number': record.get('DSR_Number__c', ''),
                    'vendor_name': vendor,
                    'po_number': record.get('PO_Number__c', ''),
                    'total_value': record.get('Total_Value__c', 0),
                    'start_date': record.get('Start_Date__c'),
                    'end_date': record.get('End_Date__c'),
                    'cost_center': record.get('Cost_Center__c', ''),
                    'business_owner': record.get('Business_Owner__c', ''),
                    'status': record.get('Status__c'),
                    'source': 'Salesforce DSR'
                }
                
                parsed_records.append(parsed_record)
                
            except Exception as e:
                logger.warning(f"Failed to parse DSR record: {e}")
                continue
                
        return parsed_records
    
    def _parse_opportunities(self, sf_data: Dict) -> List[Dict]:
        """Parse Opportunity records for DSR data"""
        parsed_records = []
        
        for record in sf_data.get('records', []):
            try:
                vendor = record.get('Vendor_Name__c', '')
                if not vendor and record.get('Account'):
                    vendor = record['Account'].get('Name', '')
                
                parsed_record = {
                    'opportunity_id': record.get('Id'),
                    'dsr_number': record.get('DSR_Number__c', ''),
                    'vendor_name': vendor,
                    'po_number': record.get('PO_Number__c', ''),
                    'amount': record.get('Amount', 0),
                    'close_date': record.get('CloseDate'),
                    'start_date': record.get('Contract_Start_Date__c'),
                    'end_date': record.get('Contract_End_Date__c'),
                    'stage': record.get('StageName'),
                    'source': 'Salesforce Opportunities'
                }
                
                # Build contract details for parsing
                parsed_record['contract_details'] = f"""
                    Opportunity: {record.get('Name')}
                    DSR: {parsed_record['dsr_number']}
                    Contract Start: {parsed_record['start_date']}
                    Contract End: {parsed_record['end_date']}
                    Close Date: {parsed_record['close_date']}
                """
                
                parsed_records.append(parsed_record)
                
            except Exception as e:
                logger.warning(f"Failed to parse Opportunity: {e}")
                continue
                
        return parsed_records
    
    def sync_with_app_registry(self, app_registry_df: pd.DataFrame) -> pd.DataFrame:
        """
        Sync Salesforce data with APP_REG dataframe
        Updates DSR numbers, contract dates, business owners
        """
        # Fetch all Salesforce data
        contracts = self.get_contract_data()
        dsr_records = self.get_dsr_records()
        
        all_sf_data = contracts + dsr_records
        
        if not all_sf_data:
            logger.warning("No Salesforce data to sync")
            return app_registry_df
            
        # Create lookup by vendor
        sf_by_vendor = {}
        for record in all_sf_data:
            vendor = self._normalize_vendor(record.get('vendor_name', ''))
            if vendor not in sf_by_vendor:
                sf_by_vendor[vendor] = []
            sf_by_vendor[vendor].append(record)
        
        updates_made = 0
        
        # Update APP_REG with Salesforce data
        for idx, row in app_registry_df.iterrows():
            vendor = self._normalize_vendor(row.get('vendor', ''))
            
            if vendor in sf_by_vendor:
                sf_records = sf_by_vendor[vendor]
                
                # Get most recent/relevant record
                latest_record = sf_records[0]
                
                # Update DSR number if empty
                if pd.isna(row.get('dsrNumber')) or row.get('dsrNumber') == '':
                    dsr = latest_record.get('dsr_number', '')
                    if dsr:
                        app_registry_df.at[idx, 'dsrNumber'] = dsr
                        updates_made += 1
                
                # Update contract dates if empty
                if pd.isna(row.get('contractStartDate')) or row.get('contractStartDate') == '':
                    start_date = latest_record.get('start_date', '')
                    if start_date:
                        app_registry_df.at[idx, 'contractStartDate'] = start_date
                        updates_made += 1
                
                if pd.isna(row.get('contractEndDate')) or row.get('contractEndDate') == '':
                    end_date = latest_record.get('end_date', '')
                    if end_date:
                        app_registry_df.at[idx, 'contractEndDate'] = end_date
                        updates_made += 1
                
                # Update business owner if empty
                if pd.isna(row.get('businessLeader')) or row.get('businessLeader') == '':
                    owner = latest_record.get('business_owner', '')
                    if owner:
                        app_registry_df.at[idx, 'businessLeader'] = owner
                        updates_made += 1
                
                # Update PO if available and empty
                if pd.isna(row.get('poNumber')) or row.get('poNumber') == '':
                    po = latest_record.get('po_number', '')
                    if po:
                        app_registry_df.at[idx, 'poNumber'] = po
                        app_registry_df.at[idx, 'enrichmentSource'] = 'Salesforce API'
                        updates_made += 1
        
        logger.info(f"Salesforce sync completed: {updates_made} updates made")
        return app_registry_df
    
    def _normalize_vendor(self, vendor: str) -> str:
        """Normalize vendor name for matching"""
        if not vendor:
            return ''
        
        vendor = vendor.upper().strip()
        
        # Remove common suffixes and punctuation
        replacements = {
            ' INCORPORATED': ' INC',
            ' CORPORATION': ' CORP',
            ' LIMITED': ' LTD',
            ', INC.': ' INC',
            ', LLC.': ' LLC',
        }
        
        for old, new in replacements.items():
            vendor = vendor.replace(old, new)
        
        return ' '.join(vendor.split())


# Singleton instance
salesforce_connector = SalesforceConnector()