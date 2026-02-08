# Environment Configuration Guide

BaseSync uses separate environment files for development and production to avoid confusion and prevent accidents.

## Files Overview

- **`.env.development`** - Local development settings (localhost URLs, test Stripe keys)
- **`.env.production`** - Production settings (basesync.app URLs, live Stripe keys)
- **`.env.server`** - Active configuration file used by Wasp (copy from dev or prod)

## For Local Development

1. Copy development settings to active config:
   ```bash
   cp .env.development .env.server
   ```

2. Start Wasp:
   ```bash
   wasp start db    # In one terminal
   wasp start       # In another terminal
   ```

3. Your app will run on:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

## For Production Deployment

1. **BEFORE deploying**, copy production settings:
   ```bash
   cp .env.production .env.server
   ```

2. **CRITICAL**: Generate a new production encryption key:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Update `ENCRYPTION_KEY` in `.env.production` with this new key.

3. Set environment variables in your hosting platform (Railway):
   - Railway: Settings → Variables → Paste all from `.env.production`

4. Update OAuth redirect URIs in external services:
   - **Airtable**: https://airtable.com/create/auth → Update redirect to `https://basesync.app/auth/airtable/callback`
   - **Google Cloud**: https://console.cloud.google.com/apis/credentials → Update redirect to `https://basesync.app/oauth/google/callback`

## Quick Switch Commands

```bash
# Switch to development
cp .env.development .env.server && echo "✅ Switched to DEVELOPMENT mode"

# Switch to production (for local testing before deploy)
cp .env.production .env.server && echo "✅ Switched to PRODUCTION mode"
```

## Important Notes

⚠️ **Never commit `.env.server` to git** - it contains active credentials
⚠️ **Use different encryption keys** for dev and production
⚠️ **Use Stripe test keys** in development, live keys in production
⚠️ **Restart Wasp server** after changing .env.server
