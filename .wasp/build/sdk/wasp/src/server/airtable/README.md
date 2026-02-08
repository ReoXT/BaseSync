# Airtable OAuth Integration

This module provides secure OAuth 2.0 authentication for Airtable API access with automatic token refresh and AES-256-GCM encryption.

## Features

- ✅ Complete OAuth 2.0 flow implementation
- ✅ Automatic token refresh before expiration
- ✅ AES-256-GCM encryption for token storage
- ✅ Type-safe with TypeScript
- ✅ Database integration with Prisma
- ✅ CSRF protection support
- ✅ Scope validation

## Setup

### 1. Create Airtable OAuth Integration

1. Go to https://airtable.com/create/oauth
2. Create a new OAuth integration
3. Add required scopes:
   - `data.records:read`
   - `data.records:write`
   - `schema.bases:read`
4. Set redirect URI (must match exactly):
   - Development: `http://localhost:3000/oauth/airtable/callback`
   - Production: `https://yourdomain.com/oauth/airtable/callback`

### 2. Configure Environment Variables

Add to your `.env.server` file:

```bash
# Airtable OAuth
AIRTABLE_CLIENT_ID=your_client_id
AIRTABLE_CLIENT_SECRET=your_client_secret
AIRTABLE_REDIRECT_URI=http://localhost:3000/oauth/airtable/callback

# Encryption (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ENCRYPTION_KEY=your_64_character_hex_string
```

### 3. Generate Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Usage

### OAuth Flow Implementation

```typescript
import {
  generateAuthorizationUrl,
  exchangeCodeForTokens,
  storeAirtableConnection,
  getAirtableAccessToken,
} from '@src/server/airtable';

// Step 1: Generate authorization URL (in your route handler)
const authUrl = generateAuthorizationUrl(userId); // Optional state parameter
// Redirect user to authUrl

// Step 2: Handle callback (after user authorizes)
const code = req.query.code; // From Airtable callback
const tokens = await exchangeCodeForTokens(code);

// Step 3: Store encrypted tokens
await storeAirtableConnection(userId, tokens, context.entities);

// Step 4: Use access token (auto-refreshes if expired)
const accessToken = await getAirtableAccessToken(userId, context.entities);
```

### Check Connection Status

```typescript
import { hasAirtableConnection } from '@src/server/airtable';

const isConnected = await hasAirtableConnection(userId, context.entities);
```

### Revoke Connection

```typescript
import { revokeAirtableConnection } from '@src/server/airtable';

await revokeAirtableConnection(userId, context.entities);
```

### Validate Scopes

```typescript
import { validateScopes } from '@src/server/airtable';

const tokens = await exchangeCodeForTokens(code);
if (!validateScopes(tokens.scope)) {
  throw new Error('Required scopes not granted');
}
```

## API Reference

### `generateAuthorizationUrl(state?: string): string`

Generates the Airtable OAuth authorization URL.

**Parameters:**
- `state` (optional): CSRF protection token

**Returns:** Authorization URL to redirect user to

**Example:**
```typescript
const authUrl = generateAuthorizationUrl('user-123');
```

---

### `exchangeCodeForTokens(code: string): Promise<AirtableTokenResponse>`

Exchanges authorization code for access and refresh tokens.

**Parameters:**
- `code`: Authorization code from callback URL

**Returns:** Token response with access_token, refresh_token, expires_in, etc.

**Throws:** Error if exchange fails

---

### `storeAirtableConnection(userId, tokenResponse, prisma): Promise<void>`

Stores encrypted tokens in the database.

**Parameters:**
- `userId`: User's ID
- `tokenResponse`: Token response from Airtable
- `prisma`: Prisma client instance

**Side Effects:** Creates or updates AirtableConnection record

---

### `getAirtableAccessToken(userId, prisma): Promise<string>`

Gets a valid access token, automatically refreshing if expired.

**Parameters:**
- `userId`: User's ID
- `prisma`: Prisma client instance

**Returns:** Decrypted access token

**Throws:** Error if connection not found or refresh fails

---

### `refreshAccessToken(refreshToken: string): Promise<AirtableTokenResponse>`

Manually refreshes an access token.

**Parameters:**
- `refreshToken`: Encrypted refresh token

**Returns:** New token response

---

### `revokeAirtableConnection(userId, prisma): Promise<void>`

Revokes access and deletes connection from database.

**Parameters:**
- `userId`: User's ID
- `prisma`: Prisma client instance

---

### `hasAirtableConnection(userId, prisma): Promise<boolean>`

Checks if user has an active connection.

**Parameters:**
- `userId`: User's ID
- `prisma`: Prisma client instance

**Returns:** True if connection exists

---

### `validateScopes(grantedScopes: string): boolean`

Validates that all required scopes were granted.

**Parameters:**
- `grantedScopes`: Space-separated list of granted scopes

**Returns:** True if all required scopes are present

## Security

### Encryption

- Uses AES-256-GCM encryption
- Authenticated encryption prevents tampering
- Each encryption uses a unique IV (Initialization Vector)
- Auth tag ensures data integrity

### Token Storage Format

```
iv:authTag:encryptedData
```

All parts are hex-encoded for safe database storage.

### Best Practices

1. **Never commit** the `ENCRYPTION_KEY` to version control
2. **Use different keys** for dev, staging, and production
3. **Rotate keys periodically** and re-encrypt tokens
4. **Back up the key** securely - losing it means losing access to stored tokens
5. **Validate environment** on server startup

## Error Handling

```typescript
try {
  const accessToken = await getAirtableAccessToken(userId, prisma);
} catch (error) {
  if (error.message.includes('connection not found')) {
    // Redirect user to OAuth flow
  } else if (error.message.includes('refresh token')) {
    // Ask user to reconnect their Airtable account
  } else {
    // Handle other errors
  }
}
```

## Testing

### Validate Encryption Setup

```typescript
import { validateEncryptionKey } from '@src/server/airtable';

// Call on server startup
validateEncryptionKey(); // Throws if ENCRYPTION_KEY is invalid
```

### Test Encryption/Decryption

```typescript
import { encrypt, decrypt } from '@src/server/airtable';

const plaintext = 'sensitive_token';
const encrypted = encrypt(plaintext);
const decrypted = decrypt(encrypted);

console.assert(plaintext === decrypted);
```

## Troubleshooting

### "ENCRYPTION_KEY environment variable is not set"

**Solution:** Generate and add the key to `.env.server`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### "Failed to exchange code for tokens"

**Causes:**
- Invalid `AIRTABLE_CLIENT_ID` or `AIRTABLE_CLIENT_SECRET`
- Mismatched `AIRTABLE_REDIRECT_URI`
- Code already used or expired (codes are single-use)

### "Failed to refresh access token"

**Causes:**
- Refresh token expired (rare, Airtable tokens last 6 months)
- User revoked access from Airtable dashboard
- Invalid refresh token in database

**Solution:** Ask user to reconnect their Airtable account

## References

- [Airtable OAuth Documentation](https://airtable.com/developers/web/api/oauth-reference)
- [Airtable API Authentication](https://airtable.com/developers/web/api/authentication)
- [Node.js Crypto Module](https://nodejs.org/api/crypto.html)
