"""
Advanced Security Service - 2FA, SSO, Audit Logging, GDPR Compliance
"""

import pyotp
import qrcode
import io
import base64
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import hashlib
import hmac
import json
import uuid
from dataclasses import dataclass
from enum import Enum
import jwt
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2
from cryptography.hazmat.backends import default_backend
import secrets
import logging

logger = logging.getLogger(__name__)

class AuditEventType(Enum):
    """Types of audit events"""
    LOGIN = "login"
    LOGOUT = "logout"
    LOGIN_FAILED = "login_failed"
    PASSWORD_CHANGE = "password_change"
    PASSWORD_RESET = "password_reset"
    TWO_FA_ENABLED = "2fa_enabled"
    TWO_FA_DISABLED = "2fa_disabled"
    TWO_FA_VERIFIED = "2fa_verified"
    TWO_FA_FAILED = "2fa_failed"
    DATA_ACCESS = "data_access"
    DATA_MODIFY = "data_modify"
    DATA_DELETE = "data_delete"
    DATA_EXPORT = "data_export"
    PERMISSION_GRANT = "permission_grant"
    PERMISSION_REVOKE = "permission_revoke"
    API_KEY_CREATED = "api_key_created"
    API_KEY_REVOKED = "api_key_revoked"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    GDPR_DATA_REQUEST = "gdpr_data_request"
    GDPR_DATA_DELETION = "gdpr_data_deletion"

@dataclass
class AuditLog:
    """Audit log entry"""
    id: str
    timestamp: datetime
    event_type: AuditEventType
    user_id: Optional[str]
    ip_address: Optional[str]
    user_agent: Optional[str]
    resource_type: Optional[str]
    resource_id: Optional[str]
    action: str
    result: str  # success, failure, error
    details: Dict[str, Any]
    risk_score: int  # 0-100

class TwoFactorAuthService:
    """Two-Factor Authentication Service"""
    
    def __init__(self):
        self.issuer_name = "DataChart"
        self.backup_codes = {}  # user_id -> list of backup codes
        
    async def generate_secret(self, user_id: str, user_email: str) -> Dict[str, str]:
        """Generate 2FA secret for user"""
        # Generate secret key
        secret = pyotp.random_base32()
        
        # Create TOTP URI for QR code
        totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=user_email,
            issuer_name=self.issuer_name
        )
        
        # Generate QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(totp_uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='PNG')
        img_str = base64.b64encode(img_buffer.getvalue()).decode()
        
        # Generate backup codes
        backup_codes = self.generate_backup_codes(user_id)
        
        return {
            "secret": secret,
            "qr_code": f"data:image/png;base64,{img_str}",
            "backup_codes": backup_codes,
            "manual_entry_key": secret,
            "manual_entry_setup": f"Account: {user_email}, Key: {secret}, Time-based"
        }
        
    def generate_backup_codes(self, user_id: str, count: int = 10) -> List[str]:
        """Generate backup codes for 2FA recovery"""
        codes = []
        for _ in range(count):
            code = f"{secrets.randbelow(1000000):06d}-{secrets.randbelow(1000000):06d}"
            codes.append(code)
            
        # Hash and store backup codes
        self.backup_codes[user_id] = [
            hashlib.sha256(code.encode()).hexdigest() 
            for code in codes
        ]
        
        return codes
        
    async def verify_totp(self, secret: str, token: str) -> bool:
        """Verify TOTP token"""
        try:
            totp = pyotp.TOTP(secret)
            # Allow for time drift (1 period before/after)
            return totp.verify(token, valid_window=1)
        except Exception as e:
            logger.error(f"TOTP verification error: {e}")
            return False
            
    async def verify_backup_code(self, user_id: str, code: str) -> bool:
        """Verify and consume a backup code"""
        if user_id not in self.backup_codes:
            return False
            
        code_hash = hashlib.sha256(code.encode()).hexdigest()
        
        if code_hash in self.backup_codes[user_id]:
            # Remove used backup code
            self.backup_codes[user_id].remove(code_hash)
            return True
            
        return False
        
    async def disable_2fa(self, user_id: str):
        """Disable 2FA for a user"""
        # Remove backup codes
        if user_id in self.backup_codes:
            del self.backup_codes[user_id]
            
        # In production, also remove secret from database
        return True

class SSOService:
    """Single Sign-On Service supporting SAML and OAuth"""
    
    def __init__(self):
        self.providers = {
            "google": {
                "client_id": "",
                "client_secret": "",
                "authorize_url": "https://accounts.google.com/o/oauth2/v2/auth",
                "token_url": "https://oauth2.googleapis.com/token",
                "userinfo_url": "https://www.googleapis.com/oauth2/v2/userinfo"
            },
            "microsoft": {
                "client_id": "",
                "client_secret": "",
                "authorize_url": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
                "token_url": "https://login.microsoftonline.com/common/oauth2/v2.0/token",
                "userinfo_url": "https://graph.microsoft.com/v1.0/me"
            },
            "okta": {
                "domain": "",
                "client_id": "",
                "client_secret": "",
                "metadata_url": ""
            }
        }
        
    async def generate_auth_url(self, provider: str, redirect_uri: str, state: str) -> str:
        """Generate SSO authentication URL"""
        if provider not in self.providers:
            raise ValueError(f"Unsupported SSO provider: {provider}")
            
        config = self.providers[provider]
        
        if provider in ["google", "microsoft"]:
            # OAuth 2.0 flow
            params = {
                "client_id": config["client_id"],
                "redirect_uri": redirect_uri,
                "response_type": "code",
                "scope": "openid profile email",
                "state": state
            }
            
            from urllib.parse import urlencode
            return f"{config['authorize_url']}?{urlencode(params)}"
            
        elif provider == "okta":
            # SAML flow
            return f"https://{config['domain']}/app/{config['client_id']}/sso/saml"
            
    async def handle_callback(
        self,
        provider: str,
        code: str,
        redirect_uri: str
    ) -> Dict[str, Any]:
        """Handle SSO callback and retrieve user info"""
        if provider not in self.providers:
            raise ValueError(f"Unsupported SSO provider: {provider}")
            
        config = self.providers[provider]
        
        if provider in ["google", "microsoft"]:
            # Exchange code for token
            import requests
            
            token_response = requests.post(config["token_url"], data={
                "client_id": config["client_id"],
                "client_secret": config["client_secret"],
                "code": code,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code"
            })
            
            if token_response.status_code != 200:
                raise Exception("Failed to exchange code for token")
                
            tokens = token_response.json()
            
            # Get user info
            userinfo_response = requests.get(
                config["userinfo_url"],
                headers={"Authorization": f"Bearer {tokens['access_token']}"}
            )
            
            if userinfo_response.status_code != 200:
                raise Exception("Failed to get user info")
                
            return userinfo_response.json()
            
        return {}

class AuditLogService:
    """Comprehensive audit logging service"""
    
    def __init__(self):
        self.audit_logs: List[AuditLog] = []
        self.retention_days = 90  # GDPR compliance
        self.risk_analyzer = RiskAnalyzer()
        
    async def log_event(
        self,
        event_type: AuditEventType,
        user_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        action: str = "",
        result: str = "success",
        details: Optional[Dict[str, Any]] = None
    ) -> str:
        """Log an audit event"""
        # Calculate risk score
        risk_score = await self.risk_analyzer.calculate_risk(
            event_type, user_id, ip_address, details
        )
        
        # Create audit log entry
        audit_log = AuditLog(
            id=str(uuid.uuid4()),
            timestamp=datetime.utcnow(),
            event_type=event_type,
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            resource_type=resource_type,
            resource_id=resource_id,
            action=action,
            result=result,
            details=details or {},
            risk_score=risk_score
        )
        
        self.audit_logs.append(audit_log)
        
        # Trigger alerts for high-risk events
        if risk_score > 70:
            await self.trigger_security_alert(audit_log)
            
        # Store in database (in production)
        await self.persist_audit_log(audit_log)
        
        # Clean up old logs
        await self.cleanup_old_logs()
        
        return audit_log.id
        
    async def persist_audit_log(self, audit_log: AuditLog):
        """Persist audit log to database"""
        # In production, save to database
        pass
        
    async def cleanup_old_logs(self):
        """Remove logs older than retention period"""
        cutoff = datetime.utcnow() - timedelta(days=self.retention_days)
        self.audit_logs = [
            log for log in self.audit_logs
            if log.timestamp > cutoff
        ]
        
    async def trigger_security_alert(self, audit_log: AuditLog):
        """Trigger security alert for high-risk events"""
        from app.services.marketplace_service import NotificationService
        from app.database import get_db
        
        try:
            db = next(get_db())
            notification_service = NotificationService(db)
            
            await notification_service.send_system_notification(
                title="Security Alert",
                message=f"High-risk event detected: {audit_log.event_type.value}",
                type="error"
            )
            
            # Log to security monitoring system
            logger.warning(f"SECURITY ALERT: {audit_log.event_type.value} - Risk Score: {audit_log.risk_score}")
        except:
            logger.error("Failed to send security alert")
            
    async def query_logs(
        self,
        user_id: Optional[str] = None,
        event_types: Optional[List[AuditEventType]] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        resource_type: Optional[str] = None,
        min_risk_score: Optional[int] = None,
        limit: int = 100
    ) -> List[AuditLog]:
        """Query audit logs with filters"""
        logs = self.audit_logs
        
        if user_id:
            logs = [l for l in logs if l.user_id == user_id]
            
        if event_types:
            logs = [l for l in logs if l.event_type in event_types]
            
        if start_date:
            logs = [l for l in logs if l.timestamp >= start_date]
            
        if end_date:
            logs = [l for l in logs if l.timestamp <= end_date]
            
        if resource_type:
            logs = [l for l in logs if l.resource_type == resource_type]
            
        if min_risk_score:
            logs = [l for l in logs if l.risk_score >= min_risk_score]
            
        # Sort by timestamp (newest first)
        logs.sort(key=lambda x: x.timestamp, reverse=True)
        
        return logs[:limit]
        
    async def generate_compliance_report(
        self,
        report_type: str = "gdpr",
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Generate compliance report"""
        logs = await self.query_logs(start_date=start_date, end_date=end_date)
        
        report = {
            "report_type": report_type,
            "period": {
                "start": start_date.isoformat() if start_date else None,
                "end": end_date.isoformat() if end_date else None
            },
            "summary": {
                "total_events": len(logs),
                "unique_users": len(set(l.user_id for l in logs if l.user_id)),
                "high_risk_events": len([l for l in logs if l.risk_score > 70]),
                "failed_logins": len([l for l in logs if l.event_type == AuditEventType.LOGIN_FAILED]),
                "data_exports": len([l for l in logs if l.event_type == AuditEventType.DATA_EXPORT]),
                "gdpr_requests": len([l for l in logs if l.event_type in [
                    AuditEventType.GDPR_DATA_REQUEST,
                    AuditEventType.GDPR_DATA_DELETION
                ]])
            },
            "events_by_type": {},
            "events_by_risk": {
                "low": len([l for l in logs if l.risk_score < 30]),
                "medium": len([l for l in logs if 30 <= l.risk_score < 70]),
                "high": len([l for l in logs if l.risk_score >= 70])
            }
        }
        
        # Count events by type
        for event_type in AuditEventType:
            count = len([l for l in logs if l.event_type == event_type])
            if count > 0:
                report["events_by_type"][event_type.value] = count
                
        return report

class RiskAnalyzer:
    """Analyze risk scores for security events"""
    
    def __init__(self):
        self.suspicious_ips = set()
        self.failed_attempts = defaultdict(int)
        
    async def calculate_risk(
        self,
        event_type: AuditEventType,
        user_id: Optional[str],
        ip_address: Optional[str],
        details: Optional[Dict[str, Any]]
    ) -> int:
        """Calculate risk score (0-100) for an event"""
        risk_score = 0
        
        # Base risk by event type
        high_risk_events = [
            AuditEventType.DATA_DELETE,
            AuditEventType.PERMISSION_GRANT,
            AuditEventType.API_KEY_CREATED,
            AuditEventType.TWO_FA_DISABLED
        ]
        
        medium_risk_events = [
            AuditEventType.DATA_EXPORT,
            AuditEventType.DATA_MODIFY,
            AuditEventType.PASSWORD_CHANGE
        ]
        
        if event_type in high_risk_events:
            risk_score += 50
        elif event_type in medium_risk_events:
            risk_score += 30
        else:
            risk_score += 10
            
        # Check for suspicious IP
        if ip_address and ip_address in self.suspicious_ips:
            risk_score += 30
            
        # Check for multiple failed attempts
        if user_id and event_type == AuditEventType.LOGIN_FAILED:
            self.failed_attempts[user_id] += 1
            if self.failed_attempts[user_id] > 3:
                risk_score += 20
            if self.failed_attempts[user_id] > 5:
                risk_score += 30
                self.suspicious_ips.add(ip_address)
                
        # Check for unusual patterns
        if details:
            # Large data export
            if details.get("record_count", 0) > 10000:
                risk_score += 20
                
            # Off-hours access (simple check)
            hour = datetime.utcnow().hour
            if hour < 6 or hour > 22:
                risk_score += 10
                
        return min(risk_score, 100)

class GDPRComplianceService:
    """GDPR compliance service for data privacy"""
    
    def __init__(self):
        self.data_requests = {}
        self.deletion_requests = {}
        
    async def handle_data_request(self, user_id: str) -> Dict[str, Any]:
        """Handle GDPR data access request"""
        request_id = str(uuid.uuid4())
        
        # Collect all user data
        user_data = await self.collect_user_data(user_id)
        
        # Create data package
        data_package = {
            "request_id": request_id,
            "user_id": user_id,
            "requested_at": datetime.utcnow().isoformat(),
            "data": user_data,
            "expires_at": (datetime.utcnow() + timedelta(days=30)).isoformat()
        }
        
        self.data_requests[request_id] = data_package
        
        # Log the request
        from app.services.security_service import audit_log_service
        await audit_log_service.log_event(
            AuditEventType.GDPR_DATA_REQUEST,
            user_id=user_id,
            action="Data access request",
            details={"request_id": request_id}
        )
        
        return {
            "request_id": request_id,
            "status": "completed",
            "download_url": f"/api/v1/gdpr/download/{request_id}",
            "expires_at": data_package["expires_at"]
        }
        
    async def handle_deletion_request(self, user_id: str) -> Dict[str, Any]:
        """Handle GDPR data deletion request (right to be forgotten)"""
        request_id = str(uuid.uuid4())
        
        # Schedule deletion (with grace period)
        deletion_request = {
            "request_id": request_id,
            "user_id": user_id,
            "requested_at": datetime.utcnow().isoformat(),
            "scheduled_for": (datetime.utcnow() + timedelta(days=30)).isoformat(),
            "status": "scheduled"
        }
        
        self.deletion_requests[request_id] = deletion_request
        
        # Log the request
        from app.services.security_service import audit_log_service
        await audit_log_service.log_event(
            AuditEventType.GDPR_DATA_DELETION,
            user_id=user_id,
            action="Data deletion request",
            details={"request_id": request_id}
        )
        
        return deletion_request
        
    async def collect_user_data(self, user_id: str) -> Dict[str, Any]:
        """Collect all data for a user"""
        # In production, query all databases and services
        return {
            "profile": {
                "user_id": user_id,
                "email": "user@example.com",
                "created_at": "2024-01-01T00:00:00Z"
            },
            "dashboards": [],
            "data_sources": [],
            "audit_logs": [],
            "preferences": {}
        }
        
    async def anonymize_user_data(self, user_id: str):
        """Anonymize user data instead of deletion"""
        # Replace identifying information with anonymous values
        anonymous_id = f"anon_{uuid.uuid4()}"
        
        # Update all references to use anonymous ID
        # In production, update all database records
        
        return {
            "original_id": user_id,
            "anonymous_id": anonymous_id,
            "anonymized_at": datetime.utcnow().isoformat()
        }

from collections import defaultdict

# Global service instances
two_factor_service = TwoFactorAuthService()
sso_service = SSOService()
audit_log_service = AuditLogService()
gdpr_service = GDPRComplianceService()