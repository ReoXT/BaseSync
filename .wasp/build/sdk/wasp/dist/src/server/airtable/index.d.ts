/**
 * Airtable OAuth Integration Module
 *
 * This module provides OAuth 2.0 authentication for Airtable API access.
 * All tokens are encrypted using AES-256-GCM before storage.
 *
 * Usage:
 * 1. Generate authorization URL and redirect user
 * 2. Exchange code for tokens after callback
 * 3. Store encrypted tokens in database
 * 4. Use getAirtableAccessToken() to retrieve valid tokens (auto-refreshes)
 *
 * @module airtable
 */
export { generateAuthorizationUrl, exchangeCodeForTokens, refreshAccessToken, storeAirtableConnection, getAirtableAccessToken, revokeAirtableConnection, hasAirtableConnection, validateScopes, } from './auth';
export { encrypt, decrypt, validateEncryptionKey } from './encryption';
//# sourceMappingURL=index.d.ts.map