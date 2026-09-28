"""
Cryptographic utilities for token encryption/decryption
Uses AES-256-GCM for authenticated encryption
"""
import os
import base64
import hashlib
import secrets
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from typing import Tuple

# Secret key for encryption - should be set via environment variable in production
ENCRYPTION_SECRET = os.environ.get("TOKEN_ENCRYPTION_SECRET", "your-32-byte-secret-key-here!!")

def _get_key() -> bytes:
    """Derive a 32-byte key from the secret"""
    return hashlib.sha256(ENCRYPTION_SECRET.encode()).digest()

def encrypt_token(token: str) -> Tuple[str, str]:
    """
    Encrypt a JWT token using AES-256-GCM
    
    Returns:
        Tuple of (encrypted_token_base64, nonce_base64)
    """
    key = _get_key()
    aesgcm = AESGCM(key)
    
    # Generate a random 12-byte nonce
    nonce = secrets.token_bytes(12)
    
    # Encrypt the token
    encrypted = aesgcm.encrypt(nonce, token.encode('utf-8'), None)
    
    # Return base64 encoded values
    return (
        base64.b64encode(encrypted).decode('utf-8'),
        base64.b64encode(nonce).decode('utf-8')
    )

def decrypt_token(encrypted_base64: str, nonce_base64: str) -> str:
    """
    Decrypt an encrypted token
    
    Args:
        encrypted_base64: Base64 encoded encrypted token
        nonce_base64: Base64 encoded nonce
        
    Returns:
        Decrypted JWT token string
    """
    key = _get_key()
    aesgcm = AESGCM(key)
    
    encrypted = base64.b64decode(encrypted_base64)
    nonce = base64.b64decode(nonce_base64)
    
    decrypted = aesgcm.decrypt(nonce, encrypted, None)
    return decrypted.decode('utf-8')

def generate_token_hash(token: str) -> str:
    """
    Generate a SHA-256 hash of a token for lookup purposes
    """
    return hashlib.sha256(token.encode()).hexdigest()

def generate_secure_token() -> str:
    """
    Generate a cryptographically secure random token
    """
    return secrets.token_urlsafe(32)
