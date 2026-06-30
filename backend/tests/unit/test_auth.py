# Unit tests for authentication functionality
import pytest
from unittest.mock import Mock, patch
from datetime import datetime, timedelta
from jose import jwt

from app.api.auth import (
    create_access_token, 
    create_refresh_token, 
    verify_password, 
    get_password_hash,
    decode_access_token
)
from app.config import settings

class TestPasswordUtils:
    """Test password hashing and verification."""
    
    def test_password_hashing(self):
        """Test that passwords are properly hashed."""
        password = "test_password_123"
        hashed = get_password_hash(password)
        
        assert hashed != password
        assert len(hashed) > 50  # bcrypt hashes are typically 60 chars
        assert hashed.startswith("$2b$")
    
    def test_password_verification_success(self):
        """Test successful password verification."""
        password = "test_password_123"
        hashed = get_password_hash(password)
        
        assert verify_password(password, hashed) is True
    
    def test_password_verification_failure(self):
        """Test failed password verification."""
        password = "test_password_123"
        wrong_password = "wrong_password"
        hashed = get_password_hash(password)
        
        assert verify_password(wrong_password, hashed) is False

class TestTokenGeneration:
    """Test JWT token generation and validation."""
    
    def test_create_access_token(self):
        """Test access token creation."""
        data = {"sub": "test@example.com", "user_id": "123"}
        token = create_access_token(data)
        
        assert isinstance(token, str)
        assert len(token) > 100  # JWT tokens are typically long
        
        # Verify token can be decoded
        decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        assert decoded["sub"] == "test@example.com"
        assert decoded["user_id"] == "123"
        assert decoded["type"] == "access"
    
    def test_create_access_token_with_expiration(self):
        """Test access token with custom expiration."""
        data = {"sub": "test@example.com"}
        expires_delta = timedelta(minutes=5)
        token = create_access_token(data, expires_delta)
        
        decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        exp_timestamp = decoded["exp"]
        
        # Check that expiration is approximately 5 minutes from now
        expected_exp = datetime.utcnow() + expires_delta
        actual_exp = datetime.fromtimestamp(exp_timestamp)
        
        # Allow 1 second tolerance
        assert abs((actual_exp - expected_exp).total_seconds()) < 1
    
    def test_create_refresh_token(self):
        """Test refresh token creation."""
        data = {"sub": "test@example.com", "user_id": "123"}
        token = create_refresh_token(data)
        
        assert isinstance(token, str)
        
        decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        assert decoded["sub"] == "test@example.com"
        assert decoded["user_id"] == "123"
        assert decoded["type"] == "refresh"
    
    def test_decode_access_token_success(self):
        """Test successful token decoding."""
        data = {"sub": "test@example.com", "user_id": "123"}
        token = create_access_token(data)
        
        decoded = decode_access_token(token)
        assert decoded["sub"] == "test@example.com"
        assert decoded["user_id"] == "123"
    
    def test_decode_access_token_expired(self):
        """Test decoding expired token."""
        data = {"sub": "test@example.com"}
        # Create token that expires immediately
        expires_delta = timedelta(seconds=-1)
        token = create_access_token(data, expires_delta)
        
        with pytest.raises(jwt.ExpiredSignatureError):
            decode_access_token(token)
    
    def test_decode_access_token_invalid(self):
        """Test decoding invalid token."""
        invalid_token = "invalid.token.here"
        
        with pytest.raises(jwt.JWTError):
            decode_access_token(invalid_token)

class TestAuthHelpers:
    """Test authentication helper functions."""
    
    @pytest.mark.asyncio
    async def test_get_current_user_success(self, test_user, test_db_session):
        """Test getting current user from valid token."""
        from app.api.auth import get_current_user
        
        # Create token for test user
        token_data = {"sub": test_user.email, "user_id": test_user.id}
        token = create_access_token(token_data)
        
        # Mock the database session
        with patch('app.api.auth.get_db', return_value=test_db_session):
            user = await get_current_user(token, test_db_session)
            assert user.id == test_user.id
            assert user.email == test_user.email
    
    @pytest.mark.asyncio
    async def test_get_current_user_invalid_token(self, test_db_session):
        """Test getting current user with invalid token."""
        from app.api.auth import get_current_user
        from fastapi import HTTPException
        
        invalid_token = "invalid.token"
        
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(invalid_token, test_db_session)
        
        assert exc_info.value.status_code == 401
    
    @pytest.mark.asyncio
    async def test_get_current_user_user_not_found(self, test_db_session):
        """Test getting current user when user doesn't exist in database."""
        from app.api.auth import get_current_user
        from fastapi import HTTPException
        
        # Create token for non-existent user
        token_data = {"sub": "nonexistent@example.com", "user_id": "999"}
        token = create_access_token(token_data)
        
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(token, test_db_session)
        
        assert exc_info.value.status_code == 401

class TestApiKeyGeneration:
    """Test API key generation and validation."""
    
    def test_generate_api_key(self):
        """Test API key generation."""
        from app.api.auth import generate_api_key
        
        api_key = generate_api_key()
        
        assert isinstance(api_key, str)
        assert len(api_key) >= 32  # Should be at least 32 characters
        assert api_key.startswith('cc_')  # DataChart prefix
    
    def test_generate_multiple_api_keys_unique(self):
        """Test that multiple API keys are unique."""
        from app.api.auth import generate_api_key
        
        keys = [generate_api_key() for _ in range(10)]
        unique_keys = set(keys)
        
        assert len(keys) == len(unique_keys)  # All keys should be unique