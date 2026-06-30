"""
Security utilities for encryption and authentication
"""

from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import os
from cryptography.fernet import Fernet
import json
import base64

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Encryption for sensitive data
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", None)
if not ENCRYPTION_KEY:
    # Generate a key if not provided (not recommended for production)
    ENCRYPTION_KEY = Fernet.generate_key()
else:
    ENCRYPTION_KEY = ENCRYPTION_KEY.encode() if isinstance(ENCRYPTION_KEY, str) else ENCRYPTION_KEY

cipher_suite = Fernet(ENCRYPTION_KEY)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict) -> str:
    """Create a JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str, token_type: str = "access") -> Optional[dict]:
    """Verify and decode a JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != token_type:
            return None
        return payload
    except JWTError:
        return None

def encrypt_credentials(credentials: Dict[str, Any]) -> Dict[str, Any]:
    """
    Encrypt sensitive credentials for storage
    
    Args:
        credentials: Dictionary containing sensitive data
        
    Returns:
        Dictionary with encrypted values
    """
    if not credentials:
        return {}
    
    # List of fields that should be encrypted
    sensitive_fields = [
        'password', 'api_key', 'secret', 'token', 
        'private_key', 'client_secret', 'access_token'
    ]
    
    encrypted = credentials.copy()
    
    for key, value in credentials.items():
        # Check if the field name suggests it contains sensitive data
        if any(sensitive in key.lower() for sensitive in sensitive_fields):
            if value:
                # Encrypt the value
                encrypted_value = cipher_suite.encrypt(str(value).encode())
                # Store as base64 string for JSON compatibility
                encrypted[key] = base64.b64encode(encrypted_value).decode('utf-8')
    
    return encrypted

def decrypt_credentials(encrypted_credentials: Dict[str, Any]) -> Dict[str, Any]:
    """
    Decrypt sensitive credentials for use
    
    Args:
        encrypted_credentials: Dictionary with encrypted values
        
    Returns:
        Dictionary with decrypted values
    """
    if not encrypted_credentials:
        return {}
    
    # List of fields that should be decrypted
    sensitive_fields = [
        'password', 'api_key', 'secret', 'token', 
        'private_key', 'client_secret', 'access_token'
    ]
    
    decrypted = encrypted_credentials.copy()
    
    for key, value in encrypted_credentials.items():
        # Check if the field name suggests it contains sensitive data
        if any(sensitive in key.lower() for sensitive in sensitive_fields):
            if value:
                try:
                    # Decode from base64 and decrypt
                    encrypted_bytes = base64.b64decode(value.encode('utf-8'))
                    decrypted_value = cipher_suite.decrypt(encrypted_bytes)
                    decrypted[key] = decrypted_value.decode('utf-8')
                except Exception:
                    # If decryption fails, assume it's not encrypted
                    decrypted[key] = value
    
    return decrypted

def generate_api_key() -> str:
    """Generate a secure API key"""
    import secrets
    return secrets.token_urlsafe(32)

def hash_api_key(api_key: str) -> str:
    """Hash an API key for storage"""
    import hashlib
    return hashlib.sha256(api_key.encode()).hexdigest()

def verify_api_key(api_key: str, hashed_key: str) -> bool:
    """Verify an API key against its hash"""
    import hashlib
    return hashlib.sha256(api_key.encode()).hexdigest() == hashed_key

def generate_share_token() -> str:
    """Generate a secure share token for dashboards"""
    import secrets
    return secrets.token_urlsafe(16)

def create_password_reset_token(email: str) -> str:
    """Create a password reset token"""
    data = {"sub": email, "type": "password_reset"}
    expire = datetime.utcnow() + timedelta(hours=1)
    data.update({"exp": expire})
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def verify_password_reset_token(token: str) -> Optional[str]:
    """Verify a password reset token and return the email"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "password_reset":
            return None
        return payload.get("sub")
    except JWTError:
        return None