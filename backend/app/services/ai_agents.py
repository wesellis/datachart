"""
Multi-Agent AI System for APM Data Processing
Each agent specializes in different aspects of data extraction and validation
"""

import asyncio
import logging
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import pandas as pd
import re
from datetime import datetime

logger = logging.getLogger(__name__)


class ConfidenceLevel(Enum):
    """Confidence levels for data matches"""
    HIGH = 0.9      # Exact match, use immediately
    MEDIUM = 0.7    # Likely match, use with flag
    LOW = 0.5       # Possible match, require review
    NONE = 0.0      # No match found


@dataclass
class DataMatch:
    """Represents a matched data point with confidence"""
    field: str
    value: Any
    source: str
    confidence: float
    reasoning: str
    timestamp: datetime = None
    
    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now()


class VendorMatchingAgent:
    """
    Specializes in matching vendor names across different systems
    Handles variations, abbreviations, and subsidiaries
    """
    
    def __init__(self):
        self.vendor_aliases = self._load_vendor_aliases()
        self.common_suffixes = ['INC', 'LLC', 'CORP', 'LTD', 'CO', 'GMBH', 'SA']
        
    def _load_vendor_aliases(self) -> Dict[str, List[str]]:
        """Load known vendor aliases and variations"""
        return {
            'MICROSOFT': ['MICROSOFT CORP', 'MICROSOFT CORPORATION', 'MSFT', 'MICROSOFT INC'],
            'AMAZON WEB SERVICES': ['AWS', 'AMAZON WEB SERVICES INC', 'AMAZON WEB SERVICES CANADA'],
            'SALESFORCE': ['SALESFORCE INC', 'SALESFORCE.COM', 'SALESFORCE COM INC', 'SFDC'],
            'SERVICENOW': ['SERVICENOW INC', 'SERVICE NOW', 'SNOW'],
            'SAP': ['SAP AMERICA', 'SAP SE', 'SAP AMERICA INC', 'FIELDGLASS'],
            # Add more as discovered
        }
    
    def match_vendor(self, vendor1: str, vendor2: str) -> Tuple[bool, float]:
        """
        Match two vendor names with confidence scoring
        Returns (is_match, confidence_score)
        """
        if not vendor1 or not vendor2:
            return False, 0.0
            
        # Normalize both vendors
        v1_norm = self._normalize(vendor1)
        v2_norm = self._normalize(vendor2)
        
        # Exact match after normalization
        if v1_norm == v2_norm:
            return True, ConfidenceLevel.HIGH.value
        
        # Check aliases
        for primary, aliases in self.vendor_aliases.items():
            if v1_norm in [self._normalize(a) for a in aliases] and \
               v2_norm in [self._normalize(a) for a in aliases]:
                return True, ConfidenceLevel.HIGH.value
        
        # Fuzzy matching for subsidiaries
        if self._is_subsidiary(v1_norm, v2_norm):
            return True, ConfidenceLevel.MEDIUM.value
            
        # Partial match (one contains the other)
        if v1_norm in v2_norm or v2_norm in v1_norm:
            return True, ConfidenceLevel.LOW.value
            
        return False, ConfidenceLevel.NONE.value
    
    def _normalize(self, vendor: str) -> str:
        """Normalize vendor name for comparison"""
        if not vendor:
            return ''
        
        vendor = vendor.upper().strip()
        
        # Remove common punctuation
        vendor = re.sub(r'[,.\-\'"]', '', vendor)
        
        # Standardize spaces
        vendor = ' '.join(vendor.split())
        
        return vendor
    
    def _is_subsidiary(self, v1: str, v2: str) -> bool:
        """Check if vendors might be parent/subsidiary"""
        # Remove country/region identifiers
        regions = ['USA', 'CANADA', 'UK', 'EMEA', 'APAC', 'AMERICAS']
        for region in regions:
            v1 = v1.replace(region, '').strip()
            v2 = v2.replace(region, '').strip()
        
        # Remove suffixes and recheck
        for suffix in self.common_suffixes:
            v1 = v1.replace(suffix, '').strip()
            v2 = v2.replace(suffix, '').strip()
            
        return v1 == v2 or v1 in v2 or v2 in v1


class FinancialDataAgent:
    """
    Specializes in extracting and validating financial data
    Handles different formats, currencies, and calculations
    """
    
    def extract_amount(self, text: str) -> Tuple[float, float]:
        """
        Extract amount from various text formats
        Returns (amount, confidence)
        """
        if not text:
            return 0.0, ConfidenceLevel.NONE.value
            
        # Handle if already numeric
        if isinstance(text, (int, float)):
            return float(text), ConfidenceLevel.HIGH.value
            
        text = str(text)
        
        # Remove currency symbols and clean
        text = re.sub(r'[$€£¥]', '', text)
        text = text.replace(',', '')
        
        # Look for patterns
        patterns = [
            (r'^(\d+\.?\d*)$', ConfidenceLevel.HIGH.value),  # Simple number
            (r'(\d+\.?\d*)\s*(?:USD|CAD|EUR)', ConfidenceLevel.HIGH.value),  # With currency
            (r'Total:?\s*(\d+\.?\d*)', ConfidenceLevel.MEDIUM.value),  # Total: amount
            (r'Amount:?\s*(\d+\.?\d*)', ConfidenceLevel.MEDIUM.value),  # Amount: amount
        ]
        
        for pattern, confidence in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    amount = float(match.group(1))
                    return amount, confidence
                except:
                    continue
                    
        return 0.0, ConfidenceLevel.NONE.value
    
    def calculate_spend_ytd(self, transactions: List[Dict]) -> float:
        """Calculate year-to-date spend from transaction list"""
        total = 0.0
        current_year = datetime.now().year
        
        for trans in transactions:
            # Check if transaction is from current year
            trans_date = trans.get('date', '')
            if str(current_year) in str(trans_date):
                amount, confidence = self.extract_amount(trans.get('amount', 0))
                if confidence >= ConfidenceLevel.MEDIUM.value:
                    total += amount
                    
        return total
    
    def validate_spend(self, reported_spend: float, calculated_spend: float) -> Tuple[bool, float]:
        """
        Validate if reported spend matches calculated
        Returns (is_valid, confidence)
        """
        if reported_spend == 0 or calculated_spend == 0:
            return False, ConfidenceLevel.LOW.value
            
        # Calculate percentage difference
        diff_pct = abs(reported_spend - calculated_spend) / max(reported_spend, calculated_spend)
        
        if diff_pct < 0.01:  # Within 1%
            return True, ConfidenceLevel.HIGH.value
        elif diff_pct < 0.05:  # Within 5%
            return True, ConfidenceLevel.MEDIUM.value
        elif diff_pct < 0.10:  # Within 10%
            return True, ConfidenceLevel.LOW.value
        else:
            return False, ConfidenceLevel.NONE.value


class ContractDataAgent:
    """
    Specializes in extracting contract information
    PO numbers, DSR numbers, dates, terms
    """
    
    def extract_po_number(self, text: str) -> Tuple[str, float]:
        """
        Extract PO number from text
        Returns (po_number, confidence)
        """
        if not text:
            return '', ConfidenceLevel.NONE.value
            
        text = str(text)
        
        # Look for DataChart PO format
        patterns = [
            (r'CC\d{13}', ConfidenceLevel.HIGH.value),  # CC + 13 digits
            (r'CC\d{10,}', ConfidenceLevel.HIGH.value),  # CC + 10+ digits
            (r'PO[\s#:]*(\d{10,})', ConfidenceLevel.MEDIUM.value),  # PO# or PO:
            (r'\b\d{13}\b', ConfidenceLevel.LOW.value),  # Any 13-digit number
        ]
        
        for pattern, confidence in patterns:
            match = re.search(pattern, text)
            if match:
                po = match.group(0)
                # Ensure it starts with CC
                if not po.startswith('CC') and confidence < ConfidenceLevel.HIGH.value:
                    po = f'CC{po}'
                return po, confidence
                
        return '', ConfidenceLevel.NONE.value
    
    def extract_dsr_number(self, text: str) -> Tuple[str, float]:
        """Extract DSR number from text"""
        if not text:
            return '', ConfidenceLevel.NONE.value
            
        # DSR format: DSR-######
        match = re.search(r'DSR-\d{5,}', str(text))
        if match:
            return match.group(0), ConfidenceLevel.HIGH.value
            
        return '', ConfidenceLevel.NONE.value
    
    def extract_dates(self, text: str) -> Dict[str, Tuple[str, float]]:
        """
        Extract contract dates from text
        Returns dict of date_type: (date, confidence)
        """
        dates = {}
        
        if not text:
            return dates
            
        text = str(text)
        
        # Common date patterns
        date_patterns = [
            r'\d{4}-\d{2}-\d{2}',  # YYYY-MM-DD
            r'\d{2}/\d{2}/\d{4}',  # MM/DD/YYYY
            r'\d{2}-\d{2}-\d{4}',  # MM-DD-YYYY
        ]
        
        # Keywords that indicate date types
        date_keywords = {
            'start': ['start', 'begin', 'effective', 'from'],
            'end': ['end', 'expire', 'through', 'until'],
            'renewal': ['renewal', 'renew', 'next']
        }
        
        for pattern in date_patterns:
            matches = re.finditer(pattern, text)
            for match in matches:
                date_str = match.group(0)
                
                # Determine date type based on context
                context = text[max(0, match.start()-50):min(len(text), match.end()+50)]
                
                for date_type, keywords in date_keywords.items():
                    if any(kw in context.lower() for kw in keywords):
                        dates[date_type] = (date_str, ConfidenceLevel.HIGH.value)
                        break
                else:
                    # Date found but type unclear
                    if 'unknown' not in dates:
                        dates['unknown'] = (date_str, ConfidenceLevel.LOW.value)
                        
        return dates


class DataValidationAgent:
    """
    Master validation agent that coordinates other agents
    Ensures data quality and consistency
    """
    
    def __init__(self):
        self.vendor_agent = VendorMatchingAgent()
        self.financial_agent = FinancialDataAgent()
        self.contract_agent = ContractDataAgent()
        self.validation_log = []
        
    async def validate_record(self, 
                              app_record: Dict, 
                              oracle_data: Dict = None,
                              salesforce_data: Dict = None) -> Dict[str, DataMatch]:
        """
        Validate and enrich a single APP_REG record
        Returns dict of field: DataMatch with recommendations
        """
        matches = {}
        
        # Validate vendor match
        if oracle_data:
            is_match, confidence = self.vendor_agent.match_vendor(
                app_record.get('vendor', ''),
                oracle_data.get('vendor_name', '')
            )
            
            if is_match and confidence >= ConfidenceLevel.MEDIUM.value:
                # Extract financial data
                amount, amt_confidence = self.financial_agent.extract_amount(
                    oracle_data.get('invoice_amount', 0)
                )
                
                if amt_confidence >= ConfidenceLevel.MEDIUM.value:
                    matches['spend2025_YTD'] = DataMatch(
                        field='spend2025_YTD',
                        value=amount,
                        source='Oracle',
                        confidence=min(confidence, amt_confidence),
                        reasoning=f"Vendor match confidence: {confidence:.2f}, Amount confidence: {amt_confidence:.2f}"
                    )
                
                # Extract PO number
                po, po_confidence = self.contract_agent.extract_po_number(
                    oracle_data.get('purchase_order', '')
                )
                
                if po and po_confidence >= ConfidenceLevel.MEDIUM.value:
                    matches['poNumber'] = DataMatch(
                        field='poNumber',
                        value=po,
                        source='Oracle',
                        confidence=po_confidence,
                        reasoning=f"PO pattern match with confidence {po_confidence:.2f}"
                    )
        
        # Check Salesforce data
        if salesforce_data:
            # Extract DSR number
            dsr, dsr_confidence = self.contract_agent.extract_dsr_number(
                salesforce_data.get('contract_number', '')
            )
            
            if dsr and dsr_confidence >= ConfidenceLevel.MEDIUM.value:
                matches['dsrNumber'] = DataMatch(
                    field='dsrNumber',
                    value=dsr,
                    source='Salesforce',
                    confidence=dsr_confidence,
                    reasoning=f"DSR pattern match with confidence {dsr_confidence:.2f}"
                )
            
            # Extract contract dates
            dates = self.contract_agent.extract_dates(
                salesforce_data.get('contract_details', '')
            )
            
            for date_type, (date_val, date_conf) in dates.items():
                if date_conf >= ConfidenceLevel.MEDIUM.value:
                    field_map = {
                        'start': 'contractStartDate',
                        'end': 'contractEndDate',
                        'renewal': 'contractRenewalDate'
                    }
                    
                    if date_type in field_map:
                        matches[field_map[date_type]] = DataMatch(
                            field=field_map[date_type],
                            value=date_val,
                            source='Salesforce',
                            confidence=date_conf,
                            reasoning=f"Date extraction from contract with confidence {date_conf:.2f}"
                        )
        
        # Log validation results
        self.validation_log.append({
            'app_id': app_record.get('appId'),
            'vendor': app_record.get('vendor'),
            'matches_found': len(matches),
            'timestamp': datetime.now(),
            'high_confidence_matches': sum(1 for m in matches.values() if m.confidence >= ConfidenceLevel.HIGH.value)
        })
        
        return matches
    
    def get_validation_summary(self) -> Dict:
        """Get summary of validation activities"""
        if not self.validation_log:
            return {'total_validated': 0}
            
        return {
            'total_validated': len(self.validation_log),
            'total_matches': sum(log['matches_found'] for log in self.validation_log),
            'high_confidence_matches': sum(log['high_confidence_matches'] for log in self.validation_log),
            'last_validation': self.validation_log[-1]['timestamp'] if self.validation_log else None
        }


class AIOrchestrator:
    """
    Orchestrates all AI agents for real-time data processing
    Manages the pipeline from API ingestion to APP_REG updates
    """
    
    def __init__(self):
        self.validation_agent = DataValidationAgent()
        self.update_queue = asyncio.Queue()
        self.processing = False
        
    async def process_api_data(self,
                               oracle_data: List[Dict],
                               salesforce_data: List[Dict],
                               app_registry_df: pd.DataFrame) -> pd.DataFrame:
        """
        Main processing pipeline
        Coordinates all agents to update APP_REG
        """
        logger.info(f"Starting AI processing: {len(oracle_data)} Oracle records, {len(salesforce_data)} Salesforce records")
        
        updates_applied = 0
        
        # Create lookup dictionaries
        oracle_by_vendor = self._create_vendor_lookup(oracle_data)
        salesforce_by_vendor = self._create_vendor_lookup(salesforce_data)
        
        # Process each APP_REG record
        for idx, row in app_registry_df.iterrows():
            vendor = row.get('vendor', '')
            
            # Find matching data from APIs
            oracle_matches = oracle_by_vendor.get(vendor, [])
            salesforce_matches = salesforce_by_vendor.get(vendor, [])
            
            # Run validation agent
            for oracle_rec in oracle_matches[:1]:  # Process first match for now
                for sf_rec in salesforce_matches[:1]:
                    matches = await self.validation_agent.validate_record(
                        row.to_dict(),
                        oracle_rec,
                        sf_rec
                    )
                    
                    # Apply high-confidence updates
                    for field, match in matches.items():
                        if match.confidence >= ConfidenceLevel.MEDIUM.value:
                            # Check if field is empty or needs update
                            current_val = row.get(field)
                            if pd.isna(current_val) or current_val == '' or current_val == 0:
                                app_registry_df.at[idx, field] = match.value
                                app_registry_df.at[idx, 'lastUpdated'] = datetime.now().isoformat()
                                app_registry_df.at[idx, 'updateSource'] = match.source
                                app_registry_df.at[idx, 'updateConfidence'] = match.confidence
                                updates_applied += 1
                                
                                logger.info(f"Updated {row['appId']}.{field} = {match.value} (confidence: {match.confidence:.2f})")
        
        logger.info(f"AI processing complete: {updates_applied} updates applied")
        
        # Get validation summary
        summary = self.validation_agent.get_validation_summary()
        logger.info(f"Validation summary: {summary}")
        
        return app_registry_df
    
    def _create_vendor_lookup(self, data: List[Dict]) -> Dict[str, List[Dict]]:
        """Create vendor-based lookup dictionary"""
        lookup = {}
        vendor_agent = VendorMatchingAgent()
        
        for record in data:
            vendor = record.get('vendor_name', '') or record.get('vendor', '')
            vendor_norm = vendor_agent._normalize(vendor)
            
            if vendor_norm not in lookup:
                lookup[vendor_norm] = []
            lookup[vendor_norm].append(record)
            
        return lookup
    
    async def start_real_time_processing(self):
        """Start real-time processing loop"""
        self.processing = True
        
        while self.processing:
            try:
                # Process items from queue
                if not self.update_queue.empty():
                    update = await self.update_queue.get()
                    # Process update
                    logger.info(f"Processing real-time update: {update}")
                    
                await asyncio.sleep(1)  # Check every second
                
            except Exception as e:
                logger.error(f"Error in real-time processing: {e}")
                
    def stop_processing(self):
        """Stop real-time processing"""
        self.processing = False


# Create singleton instance
ai_orchestrator = AIOrchestrator()