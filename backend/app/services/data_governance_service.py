"""
Data Governance Service for DataChart
Comprehensive data management, compliance, and quality control
"""

import json
import logging
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from enum import Enum
import asyncio
from functools import lru_cache

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
import pandas as pd
import numpy as np
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2

from app.core.database import get_db
from app.models.customers import Customer, CustomerCredential, AuditLog
from app.core.cache import CacheManager

logger = logging.getLogger(__name__)


class DataClassification(str, Enum):
    """Data classification levels"""
    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    RESTRICTED = "restricted"
    PII = "pii"
    PHI = "phi"
    PCI = "pci"


class DataGovernanceService:
    """
    Comprehensive data governance for DataChart
    Handles data classification, encryption, retention, and compliance
    """
    
    def __init__(self):
        self.cache = CacheManager()
        self.encryption_key = self._generate_master_key()
        
        # Data retention policies (days)
        self.retention_policies = {
            'audit_logs': 2555,  # 7 years for compliance
            'performance_metrics': 365,  # 1 year
            'error_logs': 90,  # 3 months
            'cache_data': 1,  # 1 day
            'session_data': 30,  # 30 days
            'temporary_data': 7  # 7 days
        }
        
        # Compliance frameworks
        self.compliance_frameworks = {
            'GDPR': {
                'pii_fields': ['email', 'name', 'phone', 'address', 'ip_address'],
                'retention_days': 1095,  # 3 years
                'requires_consent': True,
                'right_to_deletion': True
            },
            'CCPA': {
                'pii_fields': ['email', 'name', 'phone', 'address', 'device_id'],
                'retention_days': 365,
                'requires_opt_out': True,
                'right_to_know': True
            },
            'HIPAA': {
                'phi_fields': ['patient_id', 'medical_record', 'diagnosis', 'treatment'],
                'retention_days': 2190,  # 6 years
                'requires_baa': True,
                'audit_required': True
            },
            'SOC2': {
                'security_controls': ['encryption', 'access_control', 'monitoring', 'incident_response'],
                'audit_frequency': 365,
                'continuous_monitoring': True
            },
            'PCI_DSS': {
                'card_data_fields': ['card_number', 'cvv', 'expiry_date'],
                'tokenization_required': True,
                'encryption_required': True,
                'retention_days': 365
            }
        }
        
        # Data quality rules
        self.quality_rules = {
            'completeness': {
                'threshold': 0.95,  # 95% complete
                'critical_fields': ['customer_id', 'timestamp', 'data_source']
            },
            'accuracy': {
                'validation_rules': {
                    'email': r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
                    'phone': r'^\+?1?\d{9,15}$',
                    'date': r'^\d{4}-\d{2}-\d{2}$'
                }
            },
            'consistency': {
                'cross_source_validation': True,
                'duplicate_threshold': 0.05  # 5% duplicates allowed
            },
            'timeliness': {
                'max_age_hours': 24,
                'refresh_required': True
            }
        }
    
    def _generate_master_key(self) -> bytes:
        """Generate master encryption key"""
        # In production, this would be stored in a secure key management service
        password = b"DataChart2024SecureKey"
        salt = b"salt_1234567890"
        kdf = PBKDF2(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password))
        return key
    
    # ==================== DATA CLASSIFICATION ====================
    
    async def classify_data(self, 
                           data: Dict[str, Any],
                           auto_classify: bool = True) -> Dict[str, Any]:
        """
        Classify data based on content and metadata
        
        Args:
            data: Data to classify
            auto_classify: Use ML-based auto-classification
        
        Returns:
            Classification results with sensitivity levels
        """
        classification_result = {
            'timestamp': datetime.utcnow().isoformat(),
            'classifications': {},
            'highest_sensitivity': DataClassification.PUBLIC,
            'compliance_flags': [],
            'encryption_required': False,
            'handling_instructions': []
        }
        
        for field, value in data.items():
            field_classification = await self._classify_field(field, value)
            classification_result['classifications'][field] = field_classification
            
            # Update highest sensitivity
            if self._get_sensitivity_level(field_classification['classification']) > \
               self._get_sensitivity_level(classification_result['highest_sensitivity']):
                classification_result['highest_sensitivity'] = field_classification['classification']
            
            # Check compliance requirements
            for framework, config in self.compliance_frameworks.items():
                if field in config.get('pii_fields', []):
                    classification_result['compliance_flags'].append(f"{framework}_PII")
                if field in config.get('phi_fields', []):
                    classification_result['compliance_flags'].append(f"{framework}_PHI")
                if field in config.get('card_data_fields', []):
                    classification_result['compliance_flags'].append(f"{framework}_PCI")
        
        # Set encryption requirement
        if classification_result['highest_sensitivity'] in [
            DataClassification.CONFIDENTIAL,
            DataClassification.RESTRICTED,
            DataClassification.PII,
            DataClassification.PHI,
            DataClassification.PCI
        ]:
            classification_result['encryption_required'] = True
        
        # Generate handling instructions
        classification_result['handling_instructions'] = self._generate_handling_instructions(
            classification_result['highest_sensitivity'],
            classification_result['compliance_flags']
        )
        
        return classification_result
    
    async def _classify_field(self, field_name: str, value: Any) -> Dict[str, Any]:
        """Classify individual field"""
        classification = DataClassification.PUBLIC
        confidence = 0.0
        
        # Pattern-based classification
        sensitive_patterns = {
            'email': (DataClassification.PII, 0.95),
            'phone': (DataClassification.PII, 0.95),
            'ssn': (DataClassification.RESTRICTED, 1.0),
            'card_number': (DataClassification.PCI, 1.0),
            'password': (DataClassification.RESTRICTED, 1.0),
            'api_key': (DataClassification.CONFIDENTIAL, 1.0),
            'secret': (DataClassification.CONFIDENTIAL, 0.9),
            'diagnosis': (DataClassification.PHI, 0.95),
            'medical': (DataClassification.PHI, 0.9)
        }
        
        field_lower = field_name.lower()
        for pattern, (cls, conf) in sensitive_patterns.items():
            if pattern in field_lower:
                if self._get_sensitivity_level(cls) > self._get_sensitivity_level(classification):
                    classification = cls
                    confidence = conf
        
        # Value-based classification
        if isinstance(value, str):
            # Check for credit card pattern
            if self._is_credit_card(value):
                classification = DataClassification.PCI
                confidence = 0.99
            # Check for SSN pattern
            elif self._is_ssn(value):
                classification = DataClassification.RESTRICTED
                confidence = 0.99
            # Check for email
            elif '@' in value and '.' in value:
                classification = DataClassification.PII
                confidence = 0.95
        
        return {
            'field': field_name,
            'classification': classification,
            'confidence': confidence,
            'encrypted': classification in [DataClassification.RESTRICTED, DataClassification.PCI],
            'masked': classification in [DataClassification.PII, DataClassification.PHI]
        }
    
    def _get_sensitivity_level(self, classification: DataClassification) -> int:
        """Get numeric sensitivity level"""
        levels = {
            DataClassification.PUBLIC: 0,
            DataClassification.INTERNAL: 1,
            DataClassification.CONFIDENTIAL: 2,
            DataClassification.PII: 3,
            DataClassification.PHI: 4,
            DataClassification.PCI: 5,
            DataClassification.RESTRICTED: 6
        }
        return levels.get(classification, 0)
    
    def _generate_handling_instructions(self, 
                                       classification: DataClassification,
                                       compliance_flags: List[str]) -> List[str]:
        """Generate data handling instructions"""
        instructions = []
        
        # Classification-based instructions
        if classification == DataClassification.RESTRICTED:
            instructions.extend([
                "Encrypt at rest and in transit",
                "Restrict access to authorized personnel only",
                "Enable audit logging for all access",
                "Implement data loss prevention controls"
            ])
        elif classification == DataClassification.PCI:
            instructions.extend([
                "Tokenize card data immediately",
                "Never store CVV",
                "Implement PCI DSS controls",
                "Quarterly security scans required"
            ])
        elif classification == DataClassification.PHI:
            instructions.extend([
                "HIPAA compliance required",
                "Business Associate Agreement needed",
                "Minimum necessary access principle",
                "Encrypt all PHI data"
            ])
        elif classification == DataClassification.PII:
            instructions.extend([
                "Obtain user consent for processing",
                "Implement right to deletion",
                "Enable data portability",
                "Pseudonymize where possible"
            ])
        
        # Compliance-specific instructions
        if 'GDPR_PII' in compliance_flags:
            instructions.append("GDPR compliance: Implement privacy by design")
        if 'CCPA_PII' in compliance_flags:
            instructions.append("CCPA compliance: Provide opt-out mechanism")
        if 'SOC2' in compliance_flags:
            instructions.append("SOC2: Continuous monitoring required")
        
        return instructions
    
    # ==================== DATA ENCRYPTION ====================
    
    async def encrypt_sensitive_data(self, 
                                    data: Dict[str, Any],
                                    classification: Dict[str, Any]) -> Dict[str, Any]:
        """
        Encrypt sensitive data based on classification
        
        Args:
            data: Data to encrypt
            classification: Classification results
        
        Returns:
            Encrypted data with metadata
        """
        fernet = Fernet(self.encryption_key)
        encrypted_data = data.copy()
        encryption_metadata = {
            'encrypted_fields': [],
            'encryption_algorithm': 'AES-256-GCM',
            'key_id': hashlib.sha256(self.encryption_key).hexdigest()[:16],
            'timestamp': datetime.utcnow().isoformat()
        }
        
        for field, field_class in classification['classifications'].items():
            if field_class.get('encrypted', False) and field in data:
                # Encrypt the field
                value = json.dumps(data[field]) if not isinstance(data[field], str) else data[field]
                encrypted_value = fernet.encrypt(value.encode()).decode()
                encrypted_data[field] = encrypted_value
                encryption_metadata['encrypted_fields'].append(field)
        
        return {
            'data': encrypted_data,
            'metadata': encryption_metadata
        }
    
    async def decrypt_sensitive_data(self, 
                                    encrypted_data: Dict[str, Any],
                                    metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Decrypt sensitive data"""
        fernet = Fernet(self.encryption_key)
        decrypted_data = encrypted_data.copy()
        
        for field in metadata.get('encrypted_fields', []):
            if field in encrypted_data:
                try:
                    encrypted_value = encrypted_data[field]
                    decrypted_value = fernet.decrypt(encrypted_value.encode()).decode()
                    
                    # Try to parse JSON if it was serialized
                    try:
                        decrypted_data[field] = json.loads(decrypted_value)
                    except json.JSONDecodeError:
                        decrypted_data[field] = decrypted_value
                        
                except Exception as e:
                    logger.error(f"Failed to decrypt field {field}: {str(e)}")
                    decrypted_data[field] = None
        
        return decrypted_data
    
    # ==================== DATA MASKING ====================
    
    async def mask_sensitive_data(self, 
                                 data: Dict[str, Any],
                                 classification: Dict[str, Any],
                                 mask_level: str = 'partial') -> Dict[str, Any]:
        """
        Mask sensitive data for display
        
        Args:
            data: Data to mask
            classification: Classification results
            mask_level: 'partial', 'full', or 'hash'
        
        Returns:
            Masked data
        """
        masked_data = data.copy()
        
        for field, field_class in classification['classifications'].items():
            if field_class.get('masked', False) and field in data:
                value = data[field]
                
                if mask_level == 'full':
                    masked_data[field] = '***MASKED***'
                elif mask_level == 'hash':
                    masked_data[field] = hashlib.sha256(str(value).encode()).hexdigest()[:8]
                elif mask_level == 'partial':
                    if isinstance(value, str):
                        if '@' in value:  # Email
                            parts = value.split('@')
                            masked_data[field] = f"{parts[0][:2]}***@{parts[1]}"
                        elif len(value) > 4:  # General string
                            masked_data[field] = f"{value[:2]}{'*' * (len(value) - 4)}{value[-2:]}"
                        else:
                            masked_data[field] = '****'
                    else:
                        masked_data[field] = '***'
        
        return masked_data
    
    # ==================== DATA RETENTION ====================
    
    async def apply_retention_policy(self, 
                                    customer_id: str,
                                    data_type: str,
                                    db: Session) -> Dict[str, Any]:
        """
        Apply data retention policy
        
        Args:
            customer_id: Customer identifier
            data_type: Type of data (audit_logs, metrics, etc.)
            db: Database session
        
        Returns:
            Retention policy application results
        """
        retention_days = self.retention_policies.get(data_type, 365)
        cutoff_date = datetime.utcnow() - timedelta(days=retention_days)
        
        results = {
            'customer_id': customer_id,
            'data_type': data_type,
            'retention_days': retention_days,
            'cutoff_date': cutoff_date.isoformat(),
            'records_deleted': 0,
            'space_freed_mb': 0
        }
        
        try:
            if data_type == 'audit_logs':
                # Delete old audit logs
                deleted = db.query(AuditLog).filter(
                    and_(
                        AuditLog.customer_id == customer_id,
                        AuditLog.timestamp < cutoff_date
                    )
                ).delete()
                results['records_deleted'] = deleted
                
            elif data_type == 'cache_data':
                # Clear old cache entries
                pattern = f"cache:{customer_id}:*"
                deleted = self.cache.clear_pattern(pattern)
                results['records_deleted'] = deleted
            
            # Estimate space freed (rough calculation)
            results['space_freed_mb'] = results['records_deleted'] * 0.001  # 1KB per record estimate
            
            db.commit()
            
            # Log retention action
            retention_log = AuditLog(
                customer_id=customer_id,
                action='data_retention',
                resource_type=data_type,
                timestamp=datetime.utcnow()
            )
            db.add(retention_log)
            db.commit()
            
        except Exception as e:
            logger.error(f"Retention policy error: {str(e)}")
            db.rollback()
            results['error'] = str(e)
        
        return results
    
    async def schedule_retention_cleanup(self):
        """Schedule automatic retention cleanup"""
        while True:
            try:
                db = next(get_db())
                
                # Get all active customers
                customers = db.query(Customer).filter(
                    Customer.subscription_status == 'active'
                ).all()
                
                for customer in customers:
                    for data_type in self.retention_policies.keys():
                        await self.apply_retention_policy(str(customer.id), data_type, db)
                
                db.close()
                
            except Exception as e:
                logger.error(f"Retention cleanup error: {str(e)}")
            
            # Run daily
            await asyncio.sleep(86400)
    
    # ==================== DATA QUALITY ====================
    
    async def validate_data_quality(self, 
                                   data: List[Dict[str, Any]],
                                   schema: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Validate data quality
        
        Args:
            data: Data to validate
            schema: Optional schema for validation
        
        Returns:
            Quality validation results
        """
        df = pd.DataFrame(data) if data else pd.DataFrame()
        
        quality_report = {
            'timestamp': datetime.utcnow().isoformat(),
            'record_count': len(df),
            'quality_score': 100.0,
            'issues': [],
            'metrics': {}
        }
        
        if df.empty:
            quality_report['quality_score'] = 0
            quality_report['issues'].append("No data to validate")
            return quality_report
        
        # Completeness check
        completeness = (1 - df.isnull().sum().sum() / (len(df) * len(df.columns))) * 100
        quality_report['metrics']['completeness'] = round(completeness, 2)
        
        if completeness < self.quality_rules['completeness']['threshold'] * 100:
            quality_report['issues'].append(f"Completeness below threshold: {completeness:.2f}%")
            quality_report['quality_score'] -= 25
        
        # Check critical fields
        for field in self.quality_rules['completeness']['critical_fields']:
            if field in df.columns:
                missing = df[field].isnull().sum()
                if missing > 0:
                    quality_report['issues'].append(f"Critical field '{field}' has {missing} missing values")
                    quality_report['quality_score'] -= 10
        
        # Duplicates check
        duplicates = df.duplicated().sum()
        duplicate_rate = (duplicates / len(df)) * 100 if len(df) > 0 else 0
        quality_report['metrics']['duplicate_rate'] = round(duplicate_rate, 2)
        
        if duplicate_rate > self.quality_rules['consistency']['duplicate_threshold'] * 100:
            quality_report['issues'].append(f"Duplicate rate exceeds threshold: {duplicate_rate:.2f}%")
            quality_report['quality_score'] -= 15
        
        # Data type consistency
        for column in df.columns:
            try:
                # Check if numeric columns have non-numeric values
                if df[column].dtype == 'object':
                    numeric_test = pd.to_numeric(df[column], errors='coerce')
                    if numeric_test.notna().any() and numeric_test.isna().any():
                        quality_report['issues'].append(f"Mixed data types in column '{column}'")
                        quality_report['quality_score'] -= 5
            except:
                pass
        
        # Accuracy validation (pattern matching)
        for field, pattern in self.quality_rules['accuracy']['validation_rules'].items():
            if field in df.columns:
                import re
                invalid_count = 0
                for value in df[field].dropna():
                    if not re.match(pattern, str(value)):
                        invalid_count += 1
                
                if invalid_count > 0:
                    quality_report['issues'].append(f"Field '{field}' has {invalid_count} values failing validation")
                    quality_report['quality_score'] -= 10
        
        # Timeliness check
        if 'timestamp' in df.columns or 'created_at' in df.columns:
            time_column = 'timestamp' if 'timestamp' in df.columns else 'created_at'
            try:
                df[time_column] = pd.to_datetime(df[time_column])
                max_age = (datetime.utcnow() - df[time_column].max()).total_seconds() / 3600
                
                quality_report['metrics']['data_age_hours'] = round(max_age, 2)
                
                if max_age > self.quality_rules['timeliness']['max_age_hours']:
                    quality_report['issues'].append(f"Data is {max_age:.2f} hours old (exceeds {self.quality_rules['timeliness']['max_age_hours']}h limit)")
                    quality_report['quality_score'] -= 20
            except:
                pass
        
        # Statistical anomalies
        numeric_columns = df.select_dtypes(include=[np.number]).columns
        for column in numeric_columns:
            # Check for outliers using IQR
            Q1 = df[column].quantile(0.25)
            Q3 = df[column].quantile(0.75)
            IQR = Q3 - Q1
            outliers = ((df[column] < (Q1 - 3 * IQR)) | (df[column] > (Q3 + 3 * IQR))).sum()
            
            if outliers > len(df) * 0.01:  # More than 1% outliers
                quality_report['issues'].append(f"Column '{column}' has {outliers} extreme outliers")
        
        # Ensure score doesn't go below 0
        quality_report['quality_score'] = max(0, quality_report['quality_score'])
        
        return quality_report
    
    # ==================== COMPLIANCE MANAGEMENT ====================
    
    async def check_compliance(self, 
                              customer_id: str,
                              framework: str,
                              data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Check compliance with specific framework
        
        Args:
            customer_id: Customer identifier
            framework: Compliance framework (GDPR, CCPA, etc.)
            data: Data to check
        
        Returns:
            Compliance check results
        """
        framework_config = self.compliance_frameworks.get(framework)
        if not framework_config:
            return {'error': f'Unknown framework: {framework}'}
        
        compliance_result = {
            'framework': framework,
            'compliant': True,
            'violations': [],
            'warnings': [],
            'recommendations': [],
            'score': 100
        }
        
        # Check PII handling
        if 'pii_fields' in framework_config:
            for field in framework_config['pii_fields']:
                if field in data and not self._is_field_protected(field, data):
                    compliance_result['violations'].append(f"Unprotected PII field: {field}")
                    compliance_result['compliant'] = False
                    compliance_result['score'] -= 20
        
        # Check consent requirements
        if framework_config.get('requires_consent'):
            if not data.get('user_consent'):
                compliance_result['violations'].append("User consent not obtained")
                compliance_result['compliant'] = False
                compliance_result['score'] -= 30
        
        # Check retention compliance
        if 'retention_days' in framework_config:
            max_retention = framework_config['retention_days']
            if data.get('retention_days', 0) > max_retention:
                compliance_result['warnings'].append(f"Data retention exceeds {framework} limit ({max_retention} days)")
                compliance_result['score'] -= 10
        
        # Framework-specific checks
        if framework == 'GDPR':
            compliance_result.update(await self._check_gdpr_compliance(data))
        elif framework == 'HIPAA':
            compliance_result.update(await self._check_hipaa_compliance(data))
        elif framework == 'PCI_DSS':
            compliance_result.update(await self._check_pci_compliance(data))
        elif framework == 'SOC2':
            compliance_result.update(await self._check_soc2_compliance(data))
        
        # Generate recommendations
        if compliance_result['score'] < 80:
            compliance_result['recommendations'].extend([
                "Implement data encryption for all sensitive fields",
                "Enable audit logging for compliance tracking",
                "Review and update data retention policies",
                "Conduct regular compliance assessments"
            ])
        
        return compliance_result
    
    async def _check_gdpr_compliance(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """GDPR-specific compliance checks"""
        gdpr_checks = {
            'data_minimization': True,
            'purpose_limitation': True,
            'accuracy': True,
            'storage_limitation': True,
            'integrity_confidentiality': True,
            'accountability': True
        }
        
        additional_issues = []
        
        # Check for data minimization
        if len(data.keys()) > 50:  # Arbitrary threshold
            gdpr_checks['data_minimization'] = False
            additional_issues.append("Excessive data collection detected")
        
        # Check for encryption
        if not data.get('encryption_enabled'):
            gdpr_checks['integrity_confidentiality'] = False
            additional_issues.append("Encryption not enabled for PII data")
        
        # Check for audit trail
        if not data.get('audit_trail'):
            gdpr_checks['accountability'] = False
            additional_issues.append("Audit trail not maintained")
        
        return {
            'gdpr_principles': gdpr_checks,
            'violations': additional_issues
        }
    
    async def _check_hipaa_compliance(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """HIPAA-specific compliance checks"""
        hipaa_checks = {
            'access_controls': True,
            'audit_controls': True,
            'integrity_controls': True,
            'transmission_security': True
        }
        
        additional_issues = []
        
        # Check for BAA
        if not data.get('baa_signed'):
            additional_issues.append("Business Associate Agreement not signed")
        
        # Check for encryption
        if not data.get('encryption_at_rest') or not data.get('encryption_in_transit'):
            hipaa_checks['transmission_security'] = False
            additional_issues.append("PHI not properly encrypted")
        
        # Check for access logging
        if not data.get('access_logging'):
            hipaa_checks['audit_controls'] = False
            additional_issues.append("Access logging not enabled for PHI")
        
        return {
            'hipaa_safeguards': hipaa_checks,
            'violations': additional_issues
        }
    
    async def _check_pci_compliance(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """PCI DSS compliance checks"""
        pci_checks = {
            'network_security': True,
            'cardholder_protection': True,
            'vulnerability_management': True,
            'access_control': True,
            'monitoring': True,
            'security_policy': True
        }
        
        additional_issues = []
        
        # Check for card data storage
        if data.get('stores_cvv'):
            pci_checks['cardholder_protection'] = False
            additional_issues.append("CVV storage detected - strictly prohibited")
        
        # Check for tokenization
        if not data.get('tokenization_enabled'):
            additional_issues.append("Card data not tokenized")
        
        # Check for quarterly scans
        last_scan = data.get('last_security_scan')
        if last_scan:
            days_since_scan = (datetime.utcnow() - datetime.fromisoformat(last_scan)).days
            if days_since_scan > 90:
                pci_checks['vulnerability_management'] = False
                additional_issues.append("Quarterly security scan overdue")
        
        return {
            'pci_requirements': pci_checks,
            'violations': additional_issues
        }
    
    async def _check_soc2_compliance(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """SOC 2 compliance checks"""
        soc2_criteria = {
            'security': True,
            'availability': True,
            'processing_integrity': True,
            'confidentiality': True,
            'privacy': True
        }
        
        additional_issues = []
        
        # Check for security controls
        required_controls = ['encryption', 'access_control', 'monitoring', 'incident_response']
        for control in required_controls:
            if not data.get(f'{control}_implemented'):
                soc2_criteria['security'] = False
                additional_issues.append(f"Missing security control: {control}")
        
        # Check for availability SLA
        if data.get('uptime_percentage', 100) < 99.9:
            soc2_criteria['availability'] = False
            additional_issues.append("Availability SLA not met")
        
        return {
            'soc2_trust_criteria': soc2_criteria,
            'violations': additional_issues
        }
    
    def _is_field_protected(self, field: str, data: Dict[str, Any]) -> bool:
        """Check if a field is properly protected"""
        # Check if field is encrypted or masked
        metadata = data.get('_metadata', {})
        encrypted_fields = metadata.get('encrypted_fields', [])
        masked_fields = metadata.get('masked_fields', [])
        
        return field in encrypted_fields or field in masked_fields
    
    def _is_credit_card(self, value: str) -> bool:
        """Check if value matches credit card pattern"""
        import re
        # Remove spaces and hyphens
        value = re.sub(r'[\s-]', '', str(value))
        
        # Check for valid credit card length
        if not (13 <= len(value) <= 19):
            return False
        
        # Luhn algorithm validation
        def luhn_check(card_number):
            def digits_of(n):
                return [int(d) for d in str(n)]
            
            digits = digits_of(card_number)
            odd_digits = digits[-1::-2]
            even_digits = digits[-2::-2]
            
            checksum = sum(odd_digits)
            for d in even_digits:
                checksum += sum(digits_of(d * 2))
            
            return checksum % 10 == 0
        
        try:
            return value.isdigit() and luhn_check(value)
        except:
            return False
    
    def _is_ssn(self, value: str) -> bool:
        """Check if value matches SSN pattern"""
        import re
        # SSN pattern: XXX-XX-XXXX or XXXXXXXXX
        pattern = r'^(?:\d{3}-\d{2}-\d{4}|\d{9})$'
        return bool(re.match(pattern, str(value)))
    
    # ==================== DATA ACCESS CONTROL ====================
    
    async def check_data_access(self,
                               user_id: str,
                               resource: str,
                               action: str,
                               context: Dict[str, Any]) -> bool:
        """
        Check if user has access to data
        
        Args:
            user_id: User identifier
            resource: Resource being accessed
            action: Action being performed (read, write, delete)
            context: Additional context (customer_id, data_classification, etc.)
        
        Returns:
            True if access allowed, False otherwise
        """
        # Check user role
        user_role = context.get('user_role', 'viewer')
        data_classification = context.get('data_classification', DataClassification.PUBLIC)
        
        # Role-based access matrix
        access_matrix = {
            'admin': {
                DataClassification.PUBLIC: ['read', 'write', 'delete'],
                DataClassification.INTERNAL: ['read', 'write', 'delete'],
                DataClassification.CONFIDENTIAL: ['read', 'write', 'delete'],
                DataClassification.PII: ['read', 'write', 'delete'],
                DataClassification.PHI: ['read', 'write'],
                DataClassification.PCI: ['read'],
                DataClassification.RESTRICTED: ['read']
            },
            'editor': {
                DataClassification.PUBLIC: ['read', 'write'],
                DataClassification.INTERNAL: ['read', 'write'],
                DataClassification.CONFIDENTIAL: ['read'],
                DataClassification.PII: ['read'],
                DataClassification.PHI: [],
                DataClassification.PCI: [],
                DataClassification.RESTRICTED: []
            },
            'viewer': {
                DataClassification.PUBLIC: ['read'],
                DataClassification.INTERNAL: ['read'],
                DataClassification.CONFIDENTIAL: [],
                DataClassification.PII: [],
                DataClassification.PHI: [],
                DataClassification.PCI: [],
                DataClassification.RESTRICTED: []
            }
        }
        
        allowed_actions = access_matrix.get(user_role, {}).get(data_classification, [])
        return action in allowed_actions
    
    async def generate_data_lineage(self,
                                   data_source: str,
                                   data_destination: str,
                                   transformations: List[str]) -> Dict[str, Any]:
        """
        Generate data lineage for tracking data flow
        
        Args:
            data_source: Original data source
            data_destination: Final destination
            transformations: List of transformations applied
        
        Returns:
            Data lineage record
        """
        lineage = {
            'lineage_id': hashlib.sha256(f"{data_source}{data_destination}{datetime.utcnow()}".encode()).hexdigest()[:16],
            'source': data_source,
            'destination': data_destination,
            'transformations': transformations,
            'timestamp': datetime.utcnow().isoformat(),
            'data_flow': []
        }
        
        # Build data flow graph
        current = data_source
        for transformation in transformations:
            lineage['data_flow'].append({
                'from': current,
                'to': transformation,
                'operation': transformation.split(':')[0] if ':' in transformation else transformation
            })
            current = transformation
        
        lineage['data_flow'].append({
            'from': current,
            'to': data_destination,
            'operation': 'store'
        })
        
        return lineage