from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from passlib.hash import pbkdf2_sha256
from src.config import get_settings
import hashlib
import base64

settings = get_settings()

# Support multiple hashing schemes for backward compatibility
pwd_context = CryptContext(
    schemes=["bcrypt", "pbkdf2_sha256", "argon2", "scrypt"], 
    deprecated="auto"
)

def verify_werkzeug_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against Werkzeug/Flask PBKDF2 format"""
    try:
        # Parse the Werkzeug format: pbkdf2:sha256:iterations$salt$hash
        parts = hashed_password.split('$')
        if len(parts) != 3:
            return False
        
        method_info = parts[0]  # e.g., "pbkdf2:sha256:260000"
        salt = parts[1]
        expected_hash = parts[2]
        
        # Extract iterations from method_info
        method_parts = method_info.split(':')
        if len(method_parts) != 3 or method_parts[0] != 'pbkdf2':
            return False
        
        hash_method = method_parts[1]  # should be 'sha256'
        iterations = int(method_parts[2])
        
        # Generate hash using the same parameters
        if hash_method == 'sha256':
            dk = hashlib.pbkdf2_hmac('sha256', 
                                   plain_password.encode('utf-8'), 
                                   salt.encode('utf-8'), 
                                   iterations)
            computed_hash = dk.hex()
            return computed_hash == expected_hash
        
        return False
    except Exception as e:
        print(f"Werkzeug password verification error: {e}")
        return False

def verify_password(plain_password, hashed_password):
    """Verify password against hash, supporting multiple algorithms"""
    try:
        # Check if it's a Werkzeug format
        if hashed_password.startswith('pbkdf2:sha256:'):
            return verify_werkzeug_password(plain_password, hashed_password)
        
        # Try standard passlib verification for other formats
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        print(f"Password verification error: {e}")
        return False

def get_password_hash(password):
    """Generate bcrypt hash for new passwords"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.jwt_access_token_expire_minutes)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return encoded_jwt

def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=settings.jwt_refresh_token_expire_days)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return encoded_jwt

def verify_token(token: str) -> Optional[str]:
    try:
        print(f"Debug: Verifying token with secret key: {settings.jwt_secret_key[:10]}...")
        print(f"Debug: Using algorithm: {settings.jwt_algorithm}")
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        print(f"Debug: Decoded payload: {payload}")
        username = payload.get("sub")
        print(f"Debug: Extracted username from payload: {username}")
        if username is None:
            print("Debug: Username is None in payload")
            return None
        return str(username)
    except JWTError as e:
        print(f"Debug: JWT Error during verification: {e}")
        return None
    except Exception as e:
        print(f"Debug: Unexpected error during verification: {e}")
        return None

def verify_refresh_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        username = payload.get("sub")
        token_type = payload.get("type")
        if username is None or token_type != "refresh":
            return None
        return str(username)
    except JWTError:
        return None
