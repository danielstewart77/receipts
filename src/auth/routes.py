from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
from src.services.user import authenticate_user, check_username, create_user, create_mobile_user, authenticate_mobile_user
from src.utilities.jwt_utils import verify_token, verify_refresh_token, create_access_token, create_refresh_token

auth_router = APIRouter()
security = HTTPBearer()

# Pydantic models for request/response
class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    username: str

class MessageResponse(BaseModel):
    message: str
    error: Optional[str] = None

class UniqueResponse(BaseModel):
    unique: bool
    message: str

# JWT helper functions
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Extract user from JWT token"""
    token = credentials.credentials
    print(f"Debug: Received token: {token[:50]}...")  # Log first 50 chars
    username = verify_token(token)
    print(f"Debug: Verified username: {username}")
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return username

def get_current_user_refresh(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Extract user from refresh token"""
    token = credentials.credentials
    username = verify_refresh_token(token)
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return username

@auth_router.post("/register", response_model=TokenResponse)
async def register(user_data: RegisterRequest):
    try:
        response = create_mobile_user(user_data.username, user_data.email, user_data.password)
        if response[1] == 200:
            data = response[0].get_json()
            return TokenResponse(
                access_token=data["accessToken"],
                refresh_token=data["refreshToken"]
            )
        else:
            raise HTTPException(
                status_code=response[1],
                detail=response[0].get_json().get("error", "Registration failed")
            )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@auth_router.post("/login", response_model=TokenResponse)
async def login(user_data: LoginRequest):
    try:
        auth_result = authenticate_user(user_data.username, user_data.password)
        if auth_result:
            return TokenResponse(
                access_token=auth_result["access_token"],
                refresh_token=auth_result["refresh_token"]
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password"
            )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@auth_router.post("/logout", response_model=MessageResponse)
async def logout():
    # In JWT-based auth, logout is typically handled client-side
    # by simply discarding the token
    return MessageResponse(message="Logged out successfully")

@auth_router.post("/token/refresh", response_model=TokenResponse)
async def refresh_token(current_user: str = Depends(get_current_user_refresh)):
    """Refresh access token using refresh token"""
    access_token = create_access_token(data={"sub": current_user})
    refresh_token = create_refresh_token(data={"sub": current_user})
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )

class UsernameRequest(BaseModel):
    username: str

class ExistsResponse(BaseModel):
    exists: bool

@auth_router.post("/currentuser", response_model=ExistsResponse)
async def check_current_user(user_data: UsernameRequest):
    response = check_username(user_data.username)
    return ExistsResponse(exists=response["exists"])

@auth_router.get("/user", response_model=UserResponse)
async def get_user(current_user: str = Depends(get_current_user)):
    return UserResponse(username=current_user)

@auth_router.post("/email_unique", response_model=UniqueResponse)
async def email_unique():
    """Check if email is unique (placeholder endpoint)"""
    return UniqueResponse(unique=True, message="success")
