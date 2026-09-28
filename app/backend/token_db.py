"""
SQLite Token Database for secure token storage
"""
import sqlite3
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, List, Dict, Any
from contextlib import contextmanager

from crypto_utils import encrypt_token, decrypt_token, generate_token_hash

# Database path
DB_PATH = Path(__file__).parent / 'tokens.db'

# Token expiration (default 7 days)
TOKEN_EXPIRY_DAYS = int(os.environ.get("TOKEN_EXPIRY_DAYS", "7"))

def init_db():
    """Initialize the database and create tables"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                token_hash TEXT UNIQUE NOT NULL,
                encrypted_token TEXT NOT NULL,
                nonce TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                is_revoked BOOLEAN DEFAULT FALSE,
                device_info TEXT,
                ip_address TEXT,
                last_used_at TIMESTAMP
            )
        ''')
        
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_user_id ON tokens(user_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_token_hash ON tokens(token_hash)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_expires_at ON tokens(expires_at)')
        
        # Revoked tokens table (for blacklist)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS revoked_tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                token_hash TEXT UNIQUE NOT NULL,
                revoked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                reason TEXT
            )
        ''')
        
        conn.commit()
        print("✅ Token database initialized")

@contextmanager
def get_db():
    """Get database connection context manager"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def store_token(
    user_id: str,
    token: str,
    device_info: Optional[str] = None,
    ip_address: Optional[str] = None,
    expiry_days: Optional[int] = None
) -> str:
    """
    Store an encrypted token in the database
    
    Returns:
        Token hash for later retrieval
    """
    encrypted, nonce = encrypt_token(token)
    token_hash = generate_token_hash(token)
    expires_at = datetime.utcnow() + timedelta(days=expiry_days or TOKEN_EXPIRY_DAYS)
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO tokens (user_id, token_hash, encrypted_token, nonce, expires_at, device_info, ip_address)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, token_hash, encrypted, nonce, expires_at, device_info, ip_address))
        conn.commit()
    
    return token_hash

def get_token_by_hash(token_hash: str) -> Optional[str]:
    """
    Retrieve and decrypt a token by its hash
    
    Returns:
        Decrypted token or None if not found/expired/revoked
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT encrypted_token, nonce, expires_at, is_revoked
            FROM tokens
            WHERE token_hash = ?
        ''', (token_hash,))
        
        row = cursor.fetchone()
        if not row:
            return None
            
        # Check if revoked
        if row['is_revoked']:
            return None
            
        # Check if expired
        expires_at = datetime.fromisoformat(row['expires_at'])
        if datetime.utcnow() > expires_at:
            return None
        
        # Update last used
        cursor.execute('''
            UPDATE tokens SET last_used_at = ? WHERE token_hash = ?
        ''', (datetime.utcnow(), token_hash))
        conn.commit()
        
        return decrypt_token(row['encrypted_token'], row['nonce'])

def validate_token(token: str) -> bool:
    """
    Validate a token exists and is not expired/revoked
    """
    token_hash = generate_token_hash(token)
    
    # Check blacklist first
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT 1 FROM revoked_tokens WHERE token_hash = ?', (token_hash,))
        if cursor.fetchone():
            return False
    
    return get_token_by_hash(token_hash) is not None

def revoke_token(token: str, reason: Optional[str] = None) -> bool:
    """
    Revoke a token (add to blacklist)
    """
    token_hash = generate_token_hash(token)
    
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Mark as revoked in tokens table
        cursor.execute('''
            UPDATE tokens SET is_revoked = TRUE WHERE token_hash = ?
        ''', (token_hash,))
        
        # Add to blacklist
        cursor.execute('''
            INSERT OR IGNORE INTO revoked_tokens (token_hash, reason)
            VALUES (?, ?)
        ''', (token_hash, reason))
        
        conn.commit()
        return cursor.rowcount > 0

def revoke_all_user_tokens(user_id: str, reason: Optional[str] = None) -> int:
    """
    Revoke all tokens for a user
    
    Returns:
        Number of tokens revoked
    """
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Get all token hashes for user
        cursor.execute('SELECT token_hash FROM tokens WHERE user_id = ?', (user_id,))
        tokens = cursor.fetchall()
        
        for row in tokens:
            cursor.execute('''
                INSERT OR IGNORE INTO revoked_tokens (token_hash, reason)
                VALUES (?, ?)
            ''', (row['token_hash'], reason))
        
        # Mark all as revoked
        cursor.execute('''
            UPDATE tokens SET is_revoked = TRUE WHERE user_id = ?
        ''', (user_id,))
        
        conn.commit()
        return len(tokens)

def get_user_tokens(user_id: str) -> List[Dict[str, Any]]:
    """
    Get all active tokens for a user
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, token_hash, created_at, expires_at, device_info, ip_address, last_used_at
            FROM tokens
            WHERE user_id = ? AND is_revoked = FALSE AND expires_at > ?
        ''', (user_id, datetime.utcnow()))
        
        return [dict(row) for row in cursor.fetchall()]

def cleanup_expired_tokens() -> int:
    """
    Remove expired tokens from the database
    
    Returns:
        Number of tokens removed
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            DELETE FROM tokens WHERE expires_at < ?
        ''', (datetime.utcnow(),))
        count = cursor.rowcount
        conn.commit()
        return count

# Initialize database on module load
init_db()
