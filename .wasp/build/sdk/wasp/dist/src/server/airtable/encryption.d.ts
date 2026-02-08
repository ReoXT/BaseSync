/**
 * Encrypts a string using AES-256-GCM
 * Format: iv:authTag:encryptedData (all hex encoded)
 */
export declare function encrypt(plaintext: string): string;
/**
 * Decrypts a string encrypted with the encrypt() function
 */
export declare function decrypt(ciphertext: string): string;
/**
 * Validates that the ENCRYPTION_KEY is properly set
 * Call this on server startup to fail fast if misconfigured
 */
export declare function validateEncryptionKey(): void;
/**
 * Helper function to decrypt an encrypted access token
 * Used by background jobs to get plaintext tokens
 */
export declare function getDecryptedConnection(encryptedAccessToken: string): Promise<string>;
//# sourceMappingURL=encryption.d.ts.map