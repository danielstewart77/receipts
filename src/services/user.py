from typing import Optional, Dict, Any, Tuple
from psycopg2.extras import RealDictCursor
from src.services.database import SparkDBConnection
from src.utilities.jwt_utils import create_access_token, create_refresh_token, get_password_hash, verify_password
import logging

def get_user(conn, user_identity: str) -> Optional[Dict[str, Any]]:
    """Get user by username or ID"""
    cursor = conn.cursor()
    try:
        # Try to get by username first
        cursor.execute("SELECT id, username, email, password_hash FROM users WHERE username = %s", (user_identity,))
        result = cursor.fetchone()
        
        if result:
            return {
                "id": result[0],
                "username": result[1],
                "email": result[2],
                "password_hash": result[3]
            }
        
        # If not found by username, try by ID if it's numeric
        if user_identity.isdigit():
            cursor.execute("SELECT id, username, email, password_hash FROM users WHERE id = %s", (int(user_identity),))
            result = cursor.fetchone()
            
            if result:
                return {
                    "id": result[0],
                    "username": result[1],
                    "email": result[2],
                    "password_hash": result[3]
                }
        
        return None
    except Exception as e:
        print(f"Error getting user: {e}")
        return None
    finally:
        cursor.close()

def get_user_by_username(username: str) -> Optional[Dict[str, Any]]:
    """Get user by username"""
    conn = SparkDBConnection().get_connection()
    if conn is None:
        return None
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        cursor.close()
        return dict(user) if user else None
    except Exception as e:
        logging.error(f"Error fetching user {username}: {e}")
        return None

def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    """Get user by ID"""
    conn = SparkDBConnection().get_connection()
    if conn is None:
        return None
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        cursor.close()
        return dict(user) if user else None
    except Exception as e:
        logging.error(f"Error fetching user {user_id}: {e}")
        return None

def create_user(username: str, email: str, password: str) -> Tuple[bool, str]:
    """Create a new user"""
    password_hash = get_password_hash(password)
    
    conn = SparkDBConnection().get_connection()
    if conn is None:
        return False, "Database connection error"
    
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (username, email, password_hash, active) VALUES (%s, %s, %s, %s)",
            (username, email, password_hash, True)
        )
        conn.commit()
        cursor.close()
        return True, "User created successfully"
    except Exception as e:
        conn.rollback()
        logging.error(f"Error creating user {username}: {e}")
        return False, str(e)

def authenticate_user(username: str, password: str) -> Optional[Dict[str, Any]]:
    """Authenticate user and return user data with tokens"""
    user = get_user_by_username(username)
    
    if not user:
        return None
    
    if not verify_password(password, user['password_hash']):
        return None
    
    if not user.get('active', False):
        return None
    
    # Create tokens
    access_token = create_access_token(data={"sub": username})
    refresh_token = create_refresh_token(data={"sub": username})
    
    return {
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "active": user["active"]
        },
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

def check_username_exists(username: str) -> bool:
    """Check if username already exists"""
    conn = SparkDBConnection().get_connection()
    if conn is None:
        return False
    
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        exists = cursor.fetchone() is not None
        cursor.close()
        return exists
    except Exception as e:
        logging.error(f"Error checking username {username}: {e}")
        return False

def check_email_exists(email: str) -> bool:
    """Check if email already exists"""
    conn = SparkDBConnection().get_connection()
    if conn is None:
        return False
    
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        exists = cursor.fetchone() is not None
        cursor.close()
        return exists
    except Exception as e:
        logging.error(f"Error checking email {email}: {e}")
        return False

def update_user_password(username: str, new_password: str) -> bool:
    """Update user password"""
    password_hash = get_password_hash(new_password)
    
    conn = SparkDBConnection().get_connection()
    if conn is None:
        return False
    
    try:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE users SET password_hash = %s WHERE username = %s",
            (password_hash, username)
        )
        conn.commit()
        cursor.close()
        return True
    except Exception as e:
        conn.rollback()
        logging.error(f"Error updating password for {username}: {e}")
        return False

def deactivate_user(username: str) -> bool:
    """Deactivate user account"""
    conn = SparkDBConnection().get_connection()
    if conn is None:
        return False
    
    try:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE users SET active = FALSE WHERE username = %s",
            (username,)
        )
        conn.commit()
        cursor.close()
        return True
    except Exception as e:
        conn.rollback()
        logging.error(f"Error deactivating user {username}: {e}")
        return False

# Legacy function for backward compatibility
def authenticate_mobile_user(username: str, password: str) -> Tuple[Any, int]:
    """Legacy function for mobile authentication - returns Flask-style response"""
    auth_result = authenticate_user(username, password)
    
    if auth_result:
        # Convert to legacy format
        user_dto = {
            "user": auth_result["user"],
            "accessToken": auth_result["access_token"],
            "refreshToken": auth_result["refresh_token"]
        }
        # Mock Flask response format
        class MockResponse:
            def get_json(self):
                return user_dto
        
        return MockResponse(), 200
    else:
        class MockErrorResponse:
            def get_json(self):
                return {"error": "Bad username or password"}
        
        return MockErrorResponse(), 401

# New FastAPI-compatible function
def create_mobile_user(username: str, email: str, password: str) -> Tuple[Any, int]:
    """Create user for mobile - returns Flask-style response for compatibility"""
    # Check if user exists
    if check_username_exists(username):
        class MockErrorResponse:
            def get_json(self):
                return {"error": "Username already exists"}
        return MockErrorResponse(), 400
    
    if check_email_exists(email):
        class MockErrorResponse:
            def get_json(self):
                return {"error": "Email already exists"}
        return MockErrorResponse(), 400
    
    # Create user
    success, message = create_user(username, email, password)
    if not success:
        class MockErrorResponse:
            def get_json(self):
                return {"error": message}
        return MockErrorResponse(), 400
    
    # Authenticate and return tokens
    return authenticate_mobile_user(username, password)

# New FastAPI-compatible function  
def check_username(username: str) -> Dict[str, bool]:
    """Check if username exists - returns dict for FastAPI compatibility"""
    return {"exists": check_username_exists(username)}