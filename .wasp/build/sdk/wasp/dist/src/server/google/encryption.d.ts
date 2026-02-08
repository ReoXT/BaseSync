/**
 * Google Sheets Connection Encryption
 * Shares encryption logic with Airtable for consistency
 */
import { validateEncryptionKey } from '../airtable/encryption';
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
 * Helper function to decrypt an encrypted access token
 * Used by background jobs to get plaintext tokens
 */
export declare function getDecryptedConnection(encryptedAccessToken: string): Promise<string>;
export { validateEncryptionKey };
//# sourceMappingURL=encryption.d.ts.map