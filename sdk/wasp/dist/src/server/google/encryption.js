/**
 * Google Sheets Connection Encryption
 * Shares encryption logic with Airtable for consistency
 */
import { encrypt as airtableEncrypt, decrypt as airtableDecrypt, validateEncryptionKey } from '../airtable/encryption';
/**
 * Encrypts a string using AES-256-GCM
 * Format: iv:authTag:encryptedData (all hex encoded)
 */
export function encrypt(plaintext) {
    return airtableEncrypt(plaintext);
}
/**
 * Decrypts a string encrypted with the encrypt() function
 */
export function decrypt(ciphertext) {
    return airtableDecrypt(ciphertext);
}
/**
 * Helper function to decrypt an encrypted access token
 * Used by background jobs to get plaintext tokens
 */
export async function getDecryptedConnection(encryptedAccessToken) {
    return decrypt(encryptedAccessToken);
}
export { validateEncryptionKey };
//# sourceMappingURL=encryption.js.map