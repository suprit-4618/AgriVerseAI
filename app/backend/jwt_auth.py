"""
JWT Authentication middleware for FastAPI
Validates Firebase JWT tokens
"""
import os
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from pydantic import BaseModel

import firebase_admin
from firebase_admin import credentials, auth as firebase_auth, firestore

# Initialize Firebase Admin
try:
    if not firebase_admin._apps:
        if os.path.exists("serviceAccountKey.json"):
            cred = credentials.Certificate("serviceAccountKey.json")
            firebase_admin.initialize_app(cred)
        else:
            firebase_admin.initialize_app()
except Exception as e:
    print(f"Warning: Failed to initialize Firebase Admin: {e}")

# Security scheme
security = HTTPBearer(auto_error=False)


class TokenData(BaseModel):
    """Decoded token data"""
    user_id: str
    email: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[int] = None


def decode_token(token: str) -> TokenData:
    """
    Decode and validate a Firebase JWT token and fetch role from Firestore
    """
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        uid = decoded_token.get("uid")
        
        # Try to fetch role from Firestore
        role = None
        try:
            db = firestore.client()
            user_doc = db.collection("users").document(uid).get()
            if user_doc.exists:
                role = user_doc.to_dict().get("role")
        except Exception as e:
            print(f"Failed to fetch user role from Firestore: {e}")

        return TokenData(
            user_id=uid,
            email=decoded_token.get("email"),
            role=role,
            exp=decoded_token.get("exp")
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security)
) -> TokenData:
    """
    Dependency to get the current authenticated user from JWT token.
    Use this for protected routes.
    """
    if credentials is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    token = credentials.credentials
    return decode_token(token)


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security)
) -> Optional[TokenData]:
    """
    Dependency to optionally get the current user.
    Returns None if no valid token is provided (doesn't raise error).
    Use this for routes that work with or without authentication.
    """
    if credentials is None:
        return None
    
    try:
        return decode_token(credentials.credentials)
    except HTTPException:
        return None


def require_role(allowed_roles: list[str]):
    """
    Dependency factory to require specific roles.
    Usage: Depends(require_role(["admin", "buyer"]))
    """
    async def role_checker(user: TokenData = Depends(get_current_user)) -> TokenData:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=403, 
                detail=f"Access denied. Required role: {allowed_roles}"
            )
        return user
    return role_checker
