/**
 * Authentication Service
 * Centralized auth utilities for Firebase JWT token management
 */

import { auth } from './firebaseClient';
import { signOut as firebaseSignOut, getIdToken } from 'firebase/auth';

/**
 * Get the current access token from Firebase session
 */
export async function getAccessToken(): Promise<string | null> {
    if (!auth.currentUser) return null;
    return await getIdToken(auth.currentUser, false);
}

/**
 * Get authorization headers for API requests
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
    const token = await getAccessToken();
    if (token) {
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }
    return {
        'Content-Type': 'application/json'
    };
}

/**
 * Check if the current session is valid
 */
export async function isSessionValid(): Promise<boolean> {
    return !!auth.currentUser;
}

/**
 * Force refresh the current session
 */
export async function refreshSession(): Promise<boolean> {
    if (!auth.currentUser) return false;
    try {
        await getIdToken(auth.currentUser, true);
        return true;
    } catch (error) {
        console.error('Error refreshing session:', error);
        return false;
    }
}

/**
 * Get user info from current session
 */
export async function getCurrentUser() {
    return auth.currentUser;
}

/**
 * Sign out and clear session
 */
export async function signOut(): Promise<void> {
    await firebaseSignOut(auth);
}

/**
 * Session activity tracker for timeout functionality
 */
let lastActivityTime = Date.now();
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function updateActivity(): void {
    lastActivityTime = Date.now();
}

export function isSessionTimedOut(): boolean {
    return Date.now() - lastActivityTime > SESSION_TIMEOUT_MS;
}

/**
 * Initialize activity listeners
 */
export function initActivityTracking(): () => void {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    const handleActivity = () => updateActivity();

    events.forEach(event => {
        window.addEventListener(event, handleActivity, { passive: true });
    });

    // Return cleanup function
    return () => {
        events.forEach(event => {
            window.removeEventListener(event, handleActivity);
        });
    };
}

// ============================================================
// TOKEN MANAGEMENT API (SQLite backend wrapper for our own backend JWTs)
// ============================================================
// We keep this exactly as it was, since the Python Backend mints its own JWT for specific DB sessions.

const TOKEN_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface TokenResponse {
    token: string;
    token_hash: string;
    expires_in: number;
}

interface UserSession {
    id: number;
    token_hash: string;
    created_at: string;
    expires_at: string;
    device_info: string | null;
    ip_address: string | null;
    last_used_at: string | null;
}

/**
 * Generate a new encrypted token from the backend
 */
export async function generateBackendToken(
    userId: string,
    email?: string,
    role?: string,
    deviceInfo?: string
): Promise<TokenResponse> {
    const response = await fetch(`${TOKEN_API_URL}/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: userId,
            email,
            role,
            device_info: deviceInfo || navigator.userAgent
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to generate token');
    }

    const data = await response.json();

    // Store token locally
    localStorage.setItem('agriverse_token', data.token);
    localStorage.setItem('agriverse_token_hash', data.token_hash);
    localStorage.setItem('agriverse_token_expires', String(Date.now() + data.expires_in * 1000));

    return data;
}

/**
 * Validate a token with the backend
 */
export async function validateBackendToken(token: string): Promise<boolean> {
    try {
        const response = await fetch(`${TOKEN_API_URL}/auth/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });

        if (!response.ok) return false;

        const data = await response.json();
        return data.valid;
    } catch {
        return false;
    }
}

/**
 * Refresh the current token
 */
export async function refreshBackendToken(): Promise<TokenResponse | null> {
    const token = localStorage.getItem('agriverse_token');
    if (!token) return null;

    try {
        const response = await fetch(`${TOKEN_API_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) return null;

        const data = await response.json();

        // Update stored token
        localStorage.setItem('agriverse_token', data.token);
        localStorage.setItem('agriverse_token_hash', data.token_hash);
        localStorage.setItem('agriverse_token_expires', String(Date.now() + data.expires_in * 1000));

        return data;
    } catch {
        return null;
    }
}

/**
 * Revoke current token or all tokens
 */
export async function revokeBackendToken(revokeAll: boolean = false, reason?: string): Promise<boolean> {
    const token = localStorage.getItem('agriverse_token');
    if (!token) return false;

    try {
        const response = await fetch(`${TOKEN_API_URL}/auth/revoke`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: revokeAll ? undefined : token,
                revoke_all: revokeAll,
                reason
            })
        });

        if (response.ok) {
            // Clear local storage
            localStorage.removeItem('agriverse_token');
            localStorage.removeItem('agriverse_token_hash');
            localStorage.removeItem('agriverse_token_expires');
            return true;
        }

        return false;
    } catch {
        return false;
    }
}

/**
 * Get all active sessions for the current user
 */
export async function getUserSessions(): Promise<UserSession[]> {
    const token = localStorage.getItem('agriverse_token');
    if (!token) return [];

    try {
        const response = await fetch(`${TOKEN_API_URL}/auth/tokens`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) return [];

        const data = await response.json();
        return data.tokens || [];
    } catch {
        return [];
    }
}

/**
 * Check if the locally stored token is still valid
 */
export function isLocalTokenValid(): boolean {
    const expiresAt = localStorage.getItem('agriverse_token_expires');
    if (!expiresAt) return false;
    return Date.now() < Number(expiresAt);
}

/**
 * Get the locally stored token
 */
export function getLocalToken(): string | null {
    if (!isLocalTokenValid()) {
        // Clear expired token
        localStorage.removeItem('agriverse_token');
        localStorage.removeItem('agriverse_token_hash');
        localStorage.removeItem('agriverse_token_expires');
        return null;
    }
    return localStorage.getItem('agriverse_token');
}
