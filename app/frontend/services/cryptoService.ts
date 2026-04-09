/**
 * Client-side Crypto Service
 * Uses Web Crypto API for encryption/decryption
 */

// IndexedDB for secure key storage
const DB_NAME = 'agriverse_crypto';
const STORE_NAME = 'keys';

async function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
}

/**
 * Generate a new encryption key pair
 */
export async function generateKeyPair(): Promise<CryptoKeyPair> {
    const keyPair = await crypto.subtle.generateKey(
        {
            name: 'RSA-OAEP',
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256'
        },
        true,
        ['encrypt', 'decrypt']
    );
    return keyPair;
}

/**
 * Generate a symmetric encryption key
 */
export async function generateSymmetricKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
        {
            name: 'AES-GCM',
            length: 256
        },
        true,
        ['encrypt', 'decrypt']
    );
}

/**
 * Store a key in IndexedDB
 */
export async function storeKey(keyId: string, key: CryptoKey): Promise<void> {
    const db = await openDB();
    const exportedKey = await crypto.subtle.exportKey('jwk', key);

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(exportedKey, keyId);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * Retrieve a key from IndexedDB
 */
export async function retrieveKey(keyId: string, algorithm: 'AES-GCM' | 'RSA-OAEP' = 'AES-GCM'): Promise<CryptoKey | null> {
    const db = await openDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(keyId);

        request.onsuccess = async () => {
            if (!request.result) {
                resolve(null);
                return;
            }

            try {
                const key = await crypto.subtle.importKey(
                    'jwk',
                    request.result,
                    algorithm === 'AES-GCM'
                        ? { name: 'AES-GCM', length: 256 }
                        : { name: 'RSA-OAEP', hash: 'SHA-256' },
                    true,
                    algorithm === 'AES-GCM' ? ['encrypt', 'decrypt'] : ['decrypt']
                );
                resolve(key);
            } catch (error) {
                reject(error);
            }
        };
        request.onerror = () => reject(request.error);
    });
}

/**
 * Encrypt data using AES-GCM
 */
export async function encryptData(data: string, key: CryptoKey): Promise<{ ciphertext: string; iv: string }> {
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoder.encode(data)
    );

    return {
        ciphertext: arrayBufferToBase64(encrypted),
        iv: arrayBufferToBase64(iv)
    };
}

/**
 * Decrypt data using AES-GCM
 */
export async function decryptData(ciphertext: string, iv: string, key: CryptoKey): Promise<string> {
    const decoder = new TextDecoder();

    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: base64ToArrayBuffer(iv) },
        key,
        base64ToArrayBuffer(ciphertext)
    );

    return decoder.decode(decrypted);
}

/**
 * Helper: ArrayBuffer to Base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

/**
 * Helper: Base64 to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash a string using SHA-256
 */
export async function hashString(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    return arrayBufferToBase64(hashBuffer);
}
