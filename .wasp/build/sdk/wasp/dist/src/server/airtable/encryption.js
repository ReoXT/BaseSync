import * as crypto from 'crypto';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;
/**
 * Gets the encryption key from environment variable
 * The key should be a 64-character hex string (32 bytes)
 */
function getEncryptionKey() {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
        throw new Error('ENCRYPTION_KEY environment variable is not set. ' +
            'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    }
    if (encryptionKey.length !== 64) {
        throw new Error(`ENCRYPTION_KEY must be a 64-character hex string (32 bytes). Current length: ${encryptionKey.length}`);
    }
    try {
        return Buffer.from(encryptionKey, 'hex');
    }
    catch (error) {
        throw new Error('ENCRYPTION_KEY must be a valid hex string');
    }
}
/**
 * Encrypts a string using AES-256-GCM
 * Format: iv:authTag:encryptedData (all hex encoded)
 */
export function encrypt(plaintext) {
    if (!plaintext) {
        throw new Error('Cannot encrypt empty string');
    }
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    // Format: iv:authTag:encryptedData
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}
/**
 * Decrypts a string encrypted with the encrypt() function
 */
export function decrypt(ciphertext) {
    if (!ciphertext) {
        throw new Error('Cannot decrypt empty string');
    }
    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid ciphertext format. Expected format: iv:authTag:encryptedData');
    }
    const [ivHex, authTagHex, encryptedHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
}
/**
 * Validates that the ENCRYPTION_KEY is properly set
 * Call this on server startup to fail fast if misconfigured
 */
export function validateEncryptionKey() {
    try {
        getEncryptionKey();
    }
    catch (error) {
        throw new Error(`Encryption key validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Helper function to decrypt an encrypted access token
 * Used by background jobs to get plaintext tokens
 */
export async function getDecryptedConnection(encryptedAccessToken) {
    return decrypt(encryptedAccessToken);
}
//# sourceMappingURL=encryption.js.map