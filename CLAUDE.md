# BaseSync: Complete Claude Code Prompts Guide

## Project Overview

**Product:** BaseSync - True two-way sync between Airtable and Google Sheets
**Stack:** OpenSaaS (Wasp + React + Node.js + Prisma + PostgreSQL)
**Target:** Operations teams needing Airtable ↔ Google Sheets sync without Zapier limitations

**Key Differentiators:**
- Bidirectional sync with conflict resolution
- Linked records display actual names (not IDs)
- Bulk historical sync
- Attachment URL handling
- Formula field sync

---

## ⚡ Superpowers & Development Workflow

**CRITICAL**: This project uses Claude Code superpowers. You MUST invoke relevant skills BEFORE starting work. If there's even a 1% chance a skill applies, invoke it.

### 🎯 Core Workflow Skills (Use First)

**Before ANY new feature or code changes:**
- `/superpowers:brainstorming` - **MANDATORY** before creating features, components, or modifying behavior. Explores requirements and design.
- `/superpowers:writing-plans` - **MANDATORY** for multi-step tasks. Write implementation plans BEFORE touching code.
- `/superpowers:test-driven-development` - **MANDATORY** before implementing features/bugfixes. Write tests FIRST.

**During development:**
- `/superpowers:systematic-debugging` - For ANY bug, test failure, or unexpected behavior
- `/superpowers:subagent-driven-development` - Execute plans with independent tasks in current session
- `/superpowers:dispatching-parallel-agents` - When facing 2+ independent tasks

**Before claiming work is done:**
- `/superpowers:verification-before-completion` - **MANDATORY** before claiming "complete" - run verification commands
- `/superpowers:requesting-code-review` - After completing tasks or major features
- `/superpowers:finishing-a-development-branch` - After implementation complete, decide on merge/PR/cleanup

### 🔧 Advanced Workflow
- `/superpowers:using-git-worktrees` - Start feature work in isolation or before executing plans
- `/superpowers:executing-plans` - Execute implementation plans in separate sessions with checkpoints
- `/superpowers:receiving-code-review` - When receiving feedback, verify before implementing

### 📋 Skill Invocation Rule

```
User asks for work → Check if skill applies → Invoke skill FIRST → Then proceed
```

**Red flags that mean you skipped a skill (DON'T DO THIS):**
- "This is just a simple question" → Check for skills first
- "Let me explore first" → Skills tell you HOW to explore
- "I'll just do this one thing" → Check BEFORE doing anything
- "The skill is overkill" → If it exists, use it
- "I know what that means" → Invoke the skill anyway

### 🎓 Project Context for Superpowers

When using skills, provide this context:
- **Project**: BaseSync - Airtable ↔ Google Sheets two-way sync
- **Stack**: OpenSaaS (Wasp + React + Node.js + Prisma + PostgreSQL)
- **Key Features**: Bidirectional sync, conflict resolution, linked records as names, bulk sync
- **Critical Files**: `main.wasp`, `schema.prisma`, `src/server/sync/`, `src/client/`

---

## 🎨 Frontend Development Rules

**CRITICAL**: When building ANY frontend components, pages, or UI features:
- MUST invoke `/frontend-design:frontend-design` skill FIRST before writing any React/UI code
- This includes: new components, pages, UI features, styling updates, layout changes
- NO EXCEPTIONS - even for "simple" components

**When to invoke frontend-design:**
- User asks to "build", "create", or "add" any UI element
- Any request involving React components
- Any visual/styling work
- Dashboard updates, forms, wizards, landing pages

**Red flags that mean you should have invoked it:**
- "Let me create a component..."
- "I'll build this page..."
- "Here's the UI for..."

If you're about to write JSX/TSX, you should have invoked frontend-design FIRST.

---

## Pre-Build Setup

### Prompt 0.1: Initialize OpenSaaS Project

```
Create a new OpenSaaS project called "basesync" using the wasp CLI. Run:
wasp new basesync -t saas

After creation, navigate into the project directory and verify the structure is intact. Do NOT modify any existing files yet. Just confirm the boilerplate installed correctly by listing the key directories: app/, src/, and checking that main.wasp exists.
```

### Prompt 0.2: Initial Dependencies Check

```
In the basesync project, check package.json and main.wasp to understand what's already included. List out:
1. Authentication methods pre-configured
2. Payment integration status
3. Background job capabilities
4. Database setup

Do NOT install anything new yet. I need to understand what OpenSaaS gives us out of the box before we add BaseSync-specific dependencies.
```

### Prompt 0.3: Environment Variables Template

```
Create a .env.example file in the project root with all the environment variables BaseSync will need:
- Existing OpenSaaS variables (keep all defaults)
- Add: AIRTABLE_CLIENT_ID, AIRTABLE_CLIENT_SECRET, AIRTABLE_REDIRECT_URI
- Add: GOOGLE_SHEETS_CLIENT_ID, GOOGLE_SHEETS_CLIENT_SECRET, GOOGLE_SHEETS_REDIRECT_URI
- Add: ENCRYPTION_KEY (for storing OAuth tokens securely)

Include comments explaining each variable. Do NOT modify the existing .env.server file yet.
```

---

## Phase 1: Database Schema

### Prompt 1.1: Core Database Models <!-- UPDATED -->

```
In the existing schema.prisma file, ADD the following models WITHOUT removing or modifying existing OpenSaaS models (User, etc.):

1. AirtableConnection - stores user's Airtable OAuth credentials
   - id, userId (relation to User), accessToken (encrypted), refreshToken (encrypted), tokenExpiry, createdAt, updatedAt

2. GoogleSheetsConnection - stores user's Google OAuth credentials
   - id, userId (relation to User), accessToken (encrypted), refreshToken (encrypted), tokenExpiry, createdAt, updatedAt

3. SyncConfig - defines a sync relationship
   - id, userId, name, airtableBaseId, airtableTableId, googleSpreadsheetId, googleSheetId, fieldMappings (JSON), syncDirection (enum: AIRTABLE_TO_SHEETS, SHEETS_TO_AIRTABLE, BIDIRECTIONAL), conflictResolution (enum: AIRTABLE_WINS, SHEETS_WINS, NEWEST_WINS), isActive, lastSyncAt, createdAt, updatedAt

4. SyncLog - audit trail for syncs
   - id, syncConfigId, status (enum: SUCCESS, FAILED, PARTIAL), recordsSynced, errors (JSON), startedAt, completedAt

5. UsageStats - tracks monthly usage for billing limits (NEW)
   - id, userId (relation to User), month (DateTime - first of month), recordsSynced (Int), syncConfigsCreated (Int), lastUpdatedAt

Add proper relations and indexes. Keep all existing OpenSaaS models untouched.
```

### Prompt 1.2: Run Database Migration

```
Run the Prisma migration to apply the new models:
npx prisma migrate dev --name add_sync_models

Verify the migration succeeded and the new tables exist. If there are any errors related to existing OpenSaaS models, DO NOT modify those models - troubleshoot the new models only.
```

---

## Phase 2: OAuth Implementation

### Prompt 2.1: Airtable OAuth - Server Actions

```
Create a new file: src/server/airtable/auth.ts

Implement Airtable OAuth 2.0 flow:
1. Function to generate authorization URL with scopes: data.records:read, data.records:write, schema.bases:read
2. Function to exchange authorization code for access token
3. Function to refresh expired tokens
4. Function to store encrypted tokens in AirtableConnection model

Use the existing OpenSaaS encryption pattern if available, otherwise use crypto.createCipheriv with the ENCRYPTION_KEY env variable.

Do NOT create any frontend components yet. This is server-side only.
```

### Prompt 2.2: Airtable OAuth - Wasp Actions

```
In main.wasp, add the following actions and queries for Airtable OAuth:

1. action initiateAirtableAuth - returns the authorization URL
2. action completeAirtableAuth - handles callback, stores tokens
3. query getAirtableConnectionStatus - returns whether user has valid connection

Wire these to the functions in src/server/airtable/auth.ts. Follow the existing OpenSaaS pattern for defining actions/queries.
```

### Prompt 2.3: Google Sheets OAuth - Server Actions

```
Create a new file: src/server/google/auth.ts

Implement Google OAuth 2.0 flow:
1. Function to generate authorization URL with scopes: https://www.googleapis.com/auth/spreadsheets, https://www.googleapis.com/auth/drive.readonly
2. Function to exchange authorization code for access token
3. Function to refresh expired tokens
4. Function to store encrypted tokens in GoogleSheetsConnection model

Mirror the structure used in the Airtable auth file for consistency.
```

### Prompt 2.4: Google Sheets OAuth - Wasp Actions

```
In main.wasp, add the following actions and queries for Google Sheets OAuth:

1. action initiateGoogleAuth - returns the authorization URL
2. action completeGoogleAuth - handles callback, stores tokens
3. query getGoogleConnectionStatus - returns whether user has valid connection

Wire these to the functions in src/server/google/auth.ts. Match the pattern used for Airtable.
```

### Prompt 2.5: OAuth Callback Routes

```
In main.wasp, add two new pages for OAuth callbacks:

1. route /auth/airtable/callback -> AirtableCallbackPage
2. route /auth/google/callback -> GoogleCallbackPage

Create minimal React components for these pages that:
- Extract the authorization code from URL params
- Call the appropriate completeAuth action
- Show a loading state while processing
- Redirect to /dashboard on success or show error

Use the existing OpenSaaS UI components (Card, Button, etc.) for consistency.
```

---

## Phase 3: API Wrappers

### Prompt 3.1: Airtable API Client

```
Create src/server/airtable/client.ts

Build a typed Airtable API client with these methods:
1. listBases(accessToken) - returns all bases user has access to
2. getBaseSchema(accessToken, baseId) - returns tables and fields
3. listRecords(accessToken, baseId, tableId, options) - paginated record fetch
4. createRecords(accessToken, baseId, tableId, records) - batch create (max 10 per request per Airtable limits)
5. updateRecords(accessToken, baseId, tableId, records) - batch update
6. deleteRecords(accessToken, baseId, tableId, recordIds) - batch delete

Handle rate limiting (5 req/sec) with exponential backoff. Include proper TypeScript types for Airtable field types: text, number, checkbox, date, singleSelect, multiSelect, linkedRecord, attachment, formula, rollup.
```

### Prompt 3.2: Google Sheets API Client

```
Create src/server/google/client.ts

Build a typed Google Sheets API client with these methods:
1. listSpreadsheets(accessToken) - returns spreadsheets from Drive
2. getSpreadsheet(accessToken, spreadsheetId) - returns sheet metadata
3. getSheetData(accessToken, spreadsheetId, sheetId, range?) - returns cell values
4. updateSheetData(accessToken, spreadsheetId, sheetId, range, values) - batch update cells
5. appendRows(accessToken, spreadsheetId, sheetId, values) - add rows at end
6. deleteRows(accessToken, spreadsheetId, sheetId, startRow, count) - remove rows

Include proper error handling for quota limits and invalid tokens.
```

### Prompt 3.3: API Queries for Frontend

```
In main.wasp, add queries that the frontend will use:

1. query listUserAirtableBases - returns bases for connected Airtable account
2. query getAirtableTableSchema - returns fields for a specific table
3. query listUserSpreadsheets - returns spreadsheets for connected Google account
4. query getSpreadsheetSheets - returns sheets within a spreadsheet

Each query should:
- Check user has valid OAuth connection first
- Auto-refresh token if expired
- Return typed data

Wire these to new server functions in appropriate files.
```

---

## Phase 4: Sync Engine Core

### Prompt 4.1: Field Type Mapping

```
Create src/server/sync/fieldMapper.ts

Implement bidirectional field type conversion:

Airtable → Sheets:
- singleLineText, multilineText, richText → string
- number, currency, percent, duration → number
- checkbox → "TRUE"/"FALSE"
- date, dateTime → ISO string or formatted date
- singleSelect → string
- multiSelect → comma-separated string
- linkedRecord → comma-separated names (NOT IDs - fetch linked record names)
- attachment → comma-separated URLs
- formula, rollup, count, lookup → computed value as appropriate type

Sheets → Airtable:
- string → appropriate text field
- number → number
- "TRUE"/"FALSE" → checkbox
- ISO date string → date
- comma-separated values → multiSelect or linkedRecord (requires lookup)

Include validation and error handling for type mismatches.
```

### Prompt 4.2: Linked Record Resolution

```
Create src/server/sync/linkedRecordResolver.ts

This is critical for BaseSync's value prop. Implement:

1. resolveLinkedRecordNames(accessToken, baseId, tableId, records)
   - For each record with linked record fields
   - Fetch the linked table
   - Resolve record IDs to their primary field values
   - Cache results to minimize API calls

2. resolveNamesToRecordIds(accessToken, baseId, tableId, fieldId, names)
   - Given human-readable names
   - Look up corresponding record IDs in linked table
   - Handle case where name doesn't exist (create new record or error)

Use a simple in-memory cache with TTL for the current sync operation.
```

### Prompt 4.3: Conflict Detection

```
Create src/server/sync/conflictDetector.ts

Implement conflict detection for bidirectional sync:

1. Track record modification times from both sources
2. Detect when same record changed in both Airtable and Sheets since last sync
3. Apply conflict resolution strategy from SyncConfig:
   - AIRTABLE_WINS: Airtable value overwrites Sheets
   - SHEETS_WINS: Sheets value overwrites Airtable
   - NEWEST_WINS: Compare timestamps, most recent wins

Store last-known state for comparison. Use a hash of field values to detect actual changes vs no-change updates.
```

### Prompt 4.4: One-Way Sync (Airtable → Sheets)

```
Create src/server/sync/airtableToSheets.ts

Implement the core sync function:

1. Fetch all records from Airtable table (handle pagination)
2. Transform records using fieldMapper (including linked record resolution)
3. Compare with existing Sheets data
4. Determine rows to add, update, delete
5. Apply changes to Sheets in batches
6. Log results to SyncLog

Handle edge cases:
- Empty Airtable table
- Sheets has extra rows not in Airtable
- Field mapping doesn't include all Airtable fields
- Rate limit errors (retry with backoff)

Return summary: { added: number, updated: number, deleted: number, errors: any[] }
```

### Prompt 4.5: One-Way Sync (Sheets → Airtable)

```
Create src/server/sync/sheetsToAirtable.ts

Implement the reverse sync function:

1. Fetch all rows from Google Sheet
2. Transform data using fieldMapper (including name→ID resolution for linked records)
3. Compare with existing Airtable records
4. Determine records to add, update, delete
5. Apply changes to Airtable in batches (max 10 per request)
6. Log results to SyncLog

Handle edge cases:
- Empty sheet
- Sheet has rows without a matching Airtable record ID
- Invalid data types for Airtable fields
- Linked record names that don't exist

Return summary: { added: number, updated: number, deleted: number, errors: any[] }
```

### Prompt 4.6: Bidirectional Sync Orchestrator

```
Create src/server/sync/bidirectionalSync.ts

Orchestrate two-way sync:

1. Fetch current state from both Airtable and Sheets
2. Detect changes since last sync in both sources
3. Identify conflicts using conflictDetector
4. Apply conflict resolution
5. Push Airtable changes to Sheets
6. Push Sheets changes to Airtable
7. Update SyncConfig.lastSyncAt
8. Log complete results

Critical: Use a sync marker/checkpoint system to track what's been synced. Consider using a hidden column in Sheets for record IDs and sync timestamps.

This is the most complex function - handle all error cases gracefully and log extensively.
```

---

## Phase 5: Background Jobs

### Prompt 5.1: Sync Job Definition

```
In main.wasp, define a background job for continuous sync:

job syncJob {
  executor: PgBoss,
  perform: {
    fn: import { performSync } from "@server/jobs/syncJob.js"
  },
  schedule: {
    cron: "*/5 * * * *" // Every 5 minutes
  }
}

Create src/server/jobs/syncJob.ts that:
1. Fetches all active SyncConfigs
2. For each config, runs the appropriate sync based on syncDirection
3. Handles errors without crashing the entire job
4. Logs results

Do NOT modify any existing OpenSaaS job configurations.
```

### Prompt 5.2: Manual Sync Trigger

```
In main.wasp, add an action:

action triggerManualSync {
  fn: import { triggerManualSync } from "@server/actions/sync.js"
}

Create src/server/actions/sync.ts that:
1. Accepts syncConfigId
2. Validates user owns this config
3. Runs sync immediately (not via job queue)
4. Returns results directly to frontend

Also add:
action runInitialSync - for first-time bulk sync of existing data
```

---

## Phase 6: Frontend - Dashboard

### Prompt 6.1: Dashboard Layout Update

```
Modify the existing OpenSaaS dashboard page to show BaseSync-specific content.

Find the main dashboard component (likely src/client/app/DashboardPage.tsx or similar).

Replace the placeholder content with:
1. Connection status cards for Airtable and Google Sheets
2. List of active sync configurations
3. Quick stats: total records synced, last sync time

Use ONLY existing OpenSaaS UI components (Card, Button, Badge, etc.). Do NOT install new UI libraries. Match the existing color scheme and spacing.
```

### Prompt 6.2: Connection Status Component

```
Create src/client/components/ConnectionStatus.tsx

A reusable component showing OAuth connection status:
- Icon (checkmark or warning)
- Service name (Airtable or Google Sheets)
- Status text (Connected, Not Connected, Token Expired)
- Connect/Reconnect button
- Last synced timestamp if connected

Use existing OpenSaaS Button and Card components. Handle loading states.
```

### Prompt 6.3: Sync Config List Component

```
Create src/client/components/SyncConfigList.tsx

Display user's sync configurations:
- Table/list view
- Columns: Name, Source→Destination, Status, Last Sync, Actions
- Actions: Edit, Sync Now, Delete
- Empty state when no syncs configured

Use existing OpenSaaS table styling if available, otherwise match the dashboard aesthetic.
```

---

## Phase 7: Frontend - Sync Setup Wizard

### Prompt 7.1: Wizard Container

```
Create src/client/pages/NewSyncPage.tsx

A multi-step wizard for creating new sync configurations:
- Step 1: Select Airtable base and table
- Step 2: Select Google spreadsheet and sheet
- Step 3: Map fields
- Step 4: Configure sync direction and conflict resolution
- Step 5: Review and create

Use a simple state machine or step counter. Include progress indicator. Allow going back to previous steps.

Add route in main.wasp: route /sync/new -> NewSyncPage
```

### Prompt 7.2: Airtable Selector Step

```
Create src/client/components/wizard/AirtableSelector.tsx

Step 1 of the wizard:
- Dropdown to select base (fetched from listUserAirtableBases query)
- Once base selected, dropdown to select table
- Show table preview: field names and types
- Loading states for API calls
- Error handling if no bases found

Use existing OpenSaaS form components (Select, Label, etc.).
```

### Prompt 7.3: Google Sheets Selector Step

```
Create src/client/components/wizard/GoogleSheetsSelector.tsx

Step 2 of the wizard:
- Dropdown to select spreadsheet (fetched from listUserSpreadsheets query)
- Once spreadsheet selected, dropdown to select specific sheet
- Show sheet preview: column headers
- Option to create new sheet if desired
- Loading and error states

Match the styling of AirtableSelector.
```

### Prompt 7.4: Field Mapping Step

```
Create src/client/components/wizard/FieldMapper.tsx

Step 3 - the core UX:
- Left column: Airtable fields with their types
- Right column: Google Sheets columns
- Drag-and-drop or dropdown to map fields
- Auto-suggest mappings for matching names
- Show type compatibility warnings
- Allow unmapping (skip field)
- Linked record fields: show they'll sync as names, not IDs

This is a key differentiator - make the UX intuitive.
```

### Prompt 7.5: Sync Options Step

```
Create src/client/components/wizard/SyncOptions.tsx

Step 4 - configuration:
- Radio buttons for sync direction:
  - Airtable → Sheets (one-way)
  - Sheets → Airtable (one-way)
  - Bidirectional (two-way)
  
- If bidirectional, show conflict resolution options:
  - Airtable wins
  - Sheets wins
  - Newest wins

- Sync frequency (for display only - all use 5min job):
  - Explain sync runs every 5 minutes when active

- Name field for the sync configuration

Keep it simple - don't overwhelm with options.
```

### Prompt 7.6: Review and Create Step

```
Create src/client/components/wizard/ReviewStep.tsx

Step 5 - final review:
- Summary card showing all selections
- Airtable: Base name → Table name
- Sheets: Spreadsheet name → Sheet name
- Field mappings count
- Sync direction with icon
- Conflict resolution (if bidirectional)

- "Create Sync" button that:
  - Calls createSyncConfig action
  - Shows loading state
  - On success, triggers initial sync
  - Redirects to dashboard with success message

- "Back" button to edit
```

### Prompt 7.7: Create Sync Config Action

```
In main.wasp, add:

action createSyncConfig {
  fn: import { createSyncConfig } from "@server/actions/syncConfig.js"
}

Create src/server/actions/syncConfig.ts:
- Validate all inputs
- Verify user owns both OAuth connections
- Create SyncConfig record in database
- Return the created config

Also add actions for:
- updateSyncConfig
- deleteSyncConfig
- toggleSyncActive (pause/resume)
```

---

## Phase 8: Frontend - Sync Detail Page

### Prompt 8.1: Sync Detail Page

```
Create src/client/pages/SyncDetailPage.tsx

Route: /sync/:id

Shows detailed view of a single sync configuration:
- Header with sync name, status, actions (Edit, Delete, Sync Now)
- Connection cards: Airtable table ↔ Google Sheet
- Field mapping visualization
- Sync history log (from SyncLog model)
- Error display if last sync failed

Add query in main.wasp:
query getSyncConfigById
query getSyncLogs - returns logs for a specific config
```

### Prompt 8.2: Sync History Component

```
Create src/client/components/SyncHistory.tsx

Table showing recent sync attempts:
- Columns: Date/Time, Duration, Records Synced, Status
- Status badges: Success (green), Failed (red), Partial (yellow)
- Expandable row to show error details
- Pagination if many logs

Limit to last 50 syncs. Use existing OpenSaaS table styling.
```

---

## Phase 9: Stripe Integration

### Prompt 9.1: Pricing Tiers <!-- UPDATED -->

```
OpenSaaS has Stripe integration built in. Update the pricing configuration to match BaseSync's model:

Tier 1 - Starter ($9/month, $7.20/mo annual):
- 1 sync configuration
- 1,000 records per sync
- 15-minute sync interval
- Basic conflict resolution

Tier 2 - Pro ($19/month, $15.20/mo annual):
- 3 sync configurations
- 5,000 records per sync
- 5-minute sync interval
- Configurable conflict resolution

Tier 3 - Business ($39/month, $31.20/mo annual):
- 10 sync configurations
- Unlimited records
- 5-minute sync interval
- Configurable conflict resolution
- Priority support

Annual billing = 20% discount. Find where OpenSaaS defines pricing (likely in a config file or main.wasp) and update accordingly. Do NOT break the existing Stripe webhook handling.
```

### Prompt 9.2: Usage Limits Enforcement <!-- UPDATED -->

```
Create src/server/middleware/usageLimits.ts

Middleware/helper functions to enforce subscription limits:
1. checkSyncConfigLimit(userId) - can user create more syncs?
   - Starter: 1 sync max
   - Pro: 3 syncs max
   - Business: 10 syncs max
2. checkRecordLimit(userId, recordCount) - within record limit for their plan?
   - Starter: 1,000 records
   - Pro: 5,000 records
   - Business: Unlimited
3. getUserPlanLimits(userId) - returns limits object for user's current plan
4. getSyncFrequency(userId) - returns sync interval
   - Starter: 15 minutes
   - Pro/Business: 5 minutes

Integrate with sync creation and sync execution. Return friendly error messages when limits exceeded.

Use existing OpenSaaS subscription status checking - don't rebuild it.
```

### Prompt 9.3: Upgrade Prompts <!-- UPDATED -->

```
Create src/client/components/UpgradePrompt.tsx

Shown when user hits a limit:
- Clear message about which limit was hit (syncs, records, or sync frequency)
- Current plan vs required plan with price difference
- Show value proposition: "Upgrade to Pro for just $10 more/month"
- "Upgrade Now" button linking to pricing/checkout
- "Maybe later" dismiss option

Trigger conditions:
- User tries to create sync beyond their limit
- Sync approaches 80% of record limit (warning)
- Sync hits 100% of record limit (blocking)

Use existing OpenSaaS styling. Should appear as a modal or inline alert depending on context.
```

### Prompt 9.4: Free Trial Implementation <!-- NEW -->

```
Configure OpenSaaS free trial settings:

1. 14-day free trial on signup (no credit card required)
2. Trial users get full Pro tier features:
   - 3 sync configurations
   - 5,000 records per sync
   - 5-minute sync interval
3. After trial expires:
   - Syncs pause (don't delete data)
   - User sees "Trial expired" banner with upgrade CTA
   - Can still view dashboard and sync history

Find where OpenSaaS handles trial logic and update accordingly. Ensure Stripe is configured for trial periods.
```

### Prompt 9.5: Usage Tracking Dashboard <!-- NEW -->

```
Create src/client/components/UsageStats.tsx

Display current usage vs plan limits on dashboard:
- Sync configurations: "1 of 3 syncs used" with progress bar
- Records synced this month: "2,450 of 5,000 records" with progress bar
- Color coding: green (<50%), yellow (50-80%), red (>80%)

Also create src/server/utils/usageTracker.ts:
- trackRecordsSynced(userId, count) - increment monthly counter
- getMonthlyUsage(userId) - return current month's stats
- resetMonthlyUsage() - cron job to reset on 1st of month

Store usage in database - add UsageStats model to schema.prisma if needed.
```

### Prompt 9.6: Limit Warning Emails <!-- NEW -->

```
Using existing OpenSaaS email setup, create notification emails:

1. "Approaching limit" email (at 80% usage):
   Subject: "You're approaching your BaseSync limit"
   Body: Current usage, plan limit, upgrade CTA

2. "Limit reached" email (at 100% usage):
   Subject: "Your BaseSync sync has paused"
   Body: Explain what happened, upgrade CTA, reassure data is safe

3. "Trial ending soon" email (3 days before expiry):
   Subject: "Your BaseSync trial ends in 3 days"
   Body: Recap value delivered, pricing options, upgrade CTA

Create email templates in existing OpenSaaS email template location.
Trigger emails from usage tracking middleware.
```

---

## Phase 10: Error Handling & Edge Cases

### Prompt 10.1: OAuth Token Refresh

```
Create src/server/utils/tokenManager.ts

Centralized token management:
1. Before any API call, check if token expires within 5 minutes
2. If yes, refresh token automatically
3. If refresh fails, mark connection as "needs reauth"
4. Notify user via dashboard that they need to reconnect

Handle edge cases:
- Refresh token also expired
- User revoked access in Airtable/Google
- Network errors during refresh
```

### Prompt 10.2: Sync Error Recovery

```
Update src/server/sync/bidirectionalSync.ts

Add robust error handling:
1. If single record fails, log error and continue with others
2. If API rate limited, pause and retry with exponential backoff
3. If OAuth token invalid mid-sync, stop and mark for reauth
4. If network error, retry up to 3 times
5. Store partial results even if sync doesn't complete

Add a SyncConfig field: lastErrorAt, lastErrorMessage for dashboard display.
```

### Prompt 10.3: Data Validation

```
Create src/server/sync/dataValidator.ts

Validate data before syncing:
1. Check required fields are present
2. Validate data types match expected types
3. Check string lengths don't exceed limits
4. Validate date formats
5. Sanitize data that could break CSV/formula parsing

Return validation results: { valid: boolean, errors: ValidationError[] }
Apply to both directions of sync.
```

### Prompt 10.4: Webhook Handlers (Future-Proofing)

```
Create src/server/webhooks/airtableWebhook.ts (placeholder)

Airtable webhooks are limited but exist. Create a placeholder structure:
1. Route to receive webhook POST
2. Verify webhook authenticity
3. Trigger relevant sync on change

Mark as TODO - implement when we want real-time sync instead of polling.
For now, the 5-minute job is sufficient for MVP.
```

---

## Phase 11: Landing Page

### Prompt 11.1: Landing Page Structure

```
Update the existing OpenSaaS landing page (likely src/client/landing/LandingPage.tsx).

Replace content with BaseSync messaging:

Hero Section:
- Headline: "True Two-Way Sync: Airtable ↔ Google Sheets"
- Subheadline: "Finally sync your Airtable base to Google Sheets with real linked record names, bulk data, and bidirectional updates. No more broken Zaps."
- CTA: "Start Free Trial" / "See How It Works"
- Hero image: Simple graphic showing Airtable logo ↔ Sheets logo

Keep the existing layout structure and navigation. Only change the content.
```

### Prompt 11.2: Problem Section

```
Add a section below the hero explaining the pain points:

"Why Zapier Doesn't Cut It"
- ❌ No two-way sync (Zapier literally can't do this)
- ❌ Linked records show as cryptic IDs like "rec123abc"
- ❌ Only syncs new records - no historical data
- ❌ Two opposite Zaps create infinite loops
- ❌ Attachments don't transfer properly

Use icons and clear typography. Keep it scannable.
```

### Prompt 11.3: Solution Section

```
Add a section showing BaseSync's solution:

"How BaseSync Solves This"
- ✅ True bidirectional sync with smart conflict resolution
- ✅ Linked records show actual names automatically
- ✅ Initial bulk sync for all your existing data
- ✅ Attachment URLs transferred correctly
- ✅ Set it once, it syncs every 5 minutes

Consider a side-by-side comparison visual.
```

### Prompt 11.4: Pricing Section <!-- UPDATED -->

```
Add pricing section matching the Stripe tiers. Use anchoring strategy:

Three pricing cards:
1. Starter - $9/mo ($7.20 annual) - "For individuals"
   - 1 sync, 1,000 records, 15-min sync

2. Pro - $19/mo ($15.20 annual) - "MOST POPULAR" badge
   - 3 syncs, 5,000 records, 5-min sync

3. Business - $39/mo ($31.20 annual) - "For growing teams"
   - 10 syncs, unlimited records, 5-min sync, priority support

Include: "14-day free trial, no credit card required"
Show annual toggle with "Save 20%" label.
CTA buttons linking to signup.

Use existing OpenSaaS pricing component styling if available.
```

### Prompt 11.5: Social Proof Section

```
Add a section for credibility (content to be filled later):

"Trusted by Operations Teams"
- Placeholder for customer logos
- Placeholder for testimonials (2-3 cards)
- Stats: "X records synced" / "Y hours saved weekly"

For now, use placeholder text marked clearly as TODO.
```

### Prompt 11.6: FAQ Section <!-- UPDATED -->

```
Add FAQ accordion section:

Q: How is this different from Zapier?
A: Zapier can only do one-way sync and doesn't handle linked records properly...

Q: Is my data secure?
A: We use OAuth - we never see your Airtable or Google passwords...

Q: What happens if both sides change the same record?
A: You choose the conflict resolution strategy...

Q: Can I sync multiple tables?
A: Yes, create a separate sync configuration for each table-sheet pair...

Q: What about Airtable views vs tables?
A: We sync entire tables. Filtered views coming soon...

Q: Why is BaseSync cheaper than Unito?
A: We're specialists. Unito connects 60+ tools. We do one thing—Airtable ↔ Sheets—and do it better.

Q: What happens if I exceed my record limit?
A: We'll notify you at 80% and give you time to upgrade. Syncs pause at 100% but your data stays safe.

Q: Can I change plans anytime?
A: Yes. Upgrade instantly, downgrade at the end of your billing cycle.

Q: Is there a free trial?
A: Yes. 14 days with full Pro features, no credit card required.

Use existing OpenSaaS accordion component if available.
```

---

## Phase 12: Testing

### Prompt 12.1: Unit Tests for Field Mapping

```
Create tests for src/server/sync/fieldMapper.ts

Test cases:
- Each Airtable field type converts correctly to Sheets
- Each Sheets value converts correctly to Airtable
- Edge cases: empty values, null, undefined
- Multi-select with commas in values
- Date timezone handling
- Number precision

Use the testing framework already in OpenSaaS (likely Vitest or Jest).
```

### Prompt 12.2: Integration Tests for Sync

```
Create integration tests for the sync engine.

Mock the Airtable and Google APIs. Test:
- One-way sync creates correct Sheets rows
- One-way sync updates existing rows
- Bidirectional sync handles conflicts correctly
- Linked record names are resolved
- Pagination works for large datasets

Focus on the happy path first, then edge cases.
```

### Prompt 12.3: E2E Test Setup

```
If OpenSaaS includes E2E testing setup (likely Playwright):

Create tests for critical user flows:
1. User signs up → connects Airtable → connects Sheets → creates sync
2. User triggers manual sync → sees results
3. User upgrades plan → can create more syncs

Use test Airtable/Google accounts with known data.
```

---

## Phase 13: Deployment

### Prompt 13.1: Production Environment Setup

```
Review OpenSaaS deployment documentation for Fly.io or Railway.

Create production environment checklist:
1. All env variables set in production
2. Database URL points to production PostgreSQL
3. Stripe keys are production (not test)
4. OAuth redirect URIs updated for production domain
5. ENCRYPTION_KEY is unique for production

Document the deployment command sequence.
```

### Prompt 13.2: Database Migrations in Production

```
Ensure database migrations are handled correctly:

1. Prisma migrate deploy (not migrate dev) for production
2. Backup strategy for the database
3. Rollback plan if migration fails

Document the process for future schema changes.
```

### Prompt 13.3: Monitoring Setup

```
Add basic monitoring:

1. Error tracking (if OpenSaaS includes Sentry or similar, configure it)
2. Sync job monitoring - alert if jobs fail repeatedly
3. API rate limit tracking for Airtable/Google
4. Basic uptime monitoring

Keep it simple for MVP - don't over-engineer.
```

---

## Phase 14: Post-Launch

### Prompt 14.1: Analytics Events

```
Add analytics tracking for key events:

1. User connected Airtable
2. User connected Google Sheets
3. User created sync configuration
4. User ran manual sync
5. Sync completed successfully
6. Sync failed
7. User upgraded plan

Use existing OpenSaaS analytics (Plausible or GA) - don't add new tracking tools.
```

### Prompt 14.2: Email Notifications

```
Create email notifications using existing OpenSaaS email setup:

1. Welcome email after signup
2. "Sync failed" alert email
3. "Connection expired - please reconnect" email
4. Weekly sync summary (optional, can skip for MVP)

Use existing email templates as starting point.
```

---

## Important Notes for Claude Code

### DO:
- Preserve all existing OpenSaaS functionality
- Use existing UI components (don't install new UI libraries)
- Follow existing code patterns and file structure
- Keep styling consistent with OpenSaaS theme
- Test changes don't break existing features

### DON'T:
- Modify core OpenSaaS authentication logic
- Change the existing database models (User, etc.)
- Override Stripe webhook handlers
- Install competing libraries for things OpenSaaS already handles
- Change the wasp build configuration

### When Stuck:
- Check OpenSaaS docs: https://docs.opensaas.sh
- Check Wasp docs: https://wasp-lang.dev/docs
- Look at existing OpenSaaS code for patterns
- Search for similar implementations in the codebase

---

## Recommended Claude Model

**Use: Claude Sonnet 4** (claude-sonnet-4-20250514)

Why Sonnet over Opus:
1. **Cost efficiency**: This project has 40+ prompts. Sonnet is ~5x cheaper per token.
2. **Speed**: Sonnet responds faster, which matters for iterative development.
3. **Capability match**: This project is well-defined CRUD/integration work, not novel research. Sonnet handles this tier of complexity well.
4. **Context handling**: Both models handle the context window fine for these prompts.

When to use Opus instead:
- If you hit complex bugs that Sonnet struggles to debug
- If the sync conflict resolution logic needs sophisticated reasoning
- If you want to refactor large portions of the codebase intelligently

Practical approach: Start with Sonnet for all prompts. Switch to Opus only if you hit a wall on specific complex tasks.

---

## Quick Reference: File Structure

```
basesync/
├── main.wasp                    # Wasp configuration
├── .env.server                  # Environment variables
├── prisma/
│   └── schema.prisma           # Database models
├── src/
│   ├── client/
│   │   ├── components/
│   │   │   ├── ConnectionStatus.tsx
│   │   │   ├── SyncConfigList.tsx
│   │   │   ├── SyncHistory.tsx
│   │   │   ├── UpgradePrompt.tsx
│   │   │   └── wizard/
│   │   │       ├── AirtableSelector.tsx
│   │   │       ├── GoogleSheetsSelector.tsx
│   │   │       ├── FieldMapper.tsx
│   │   │       ├── SyncOptions.tsx
│   │   │       └── ReviewStep.tsx
│   │   ├── pages/
│   │   │   ├── NewSyncPage.tsx
│   │   │   └── SyncDetailPage.tsx
│   │   └── landing/
│   │       └── LandingPage.tsx
│   └── server/
│       ├── airtable/
│       │   ├── auth.ts
│       │   └── client.ts
│       ├── google/
│       │   ├── auth.ts
│       │   └── client.ts
│       ├── sync/
│       │   ├── fieldMapper.ts
│       │   ├── linkedRecordResolver.ts
│       │   ├── conflictDetector.ts
│       │   ├── airtableToSheets.ts
│       │   ├── sheetsToAirtable.ts
│       │   ├── bidirectionalSync.ts
│       │   └── dataValidator.ts
│       ├── jobs/
│       │   └── syncJob.ts
│       ├── actions/
│       │   ├── sync.ts
│       │   └── syncConfig.ts
│       ├── middleware/
│       │   └── usageLimits.ts
│       ├── utils/
│       │   └── tokenManager.ts
│       └── webhooks/
│           └── airtableWebhook.ts
```

---

*Total Prompts: 50+ | Estimated Build Time: 2-3 weeks with Claude Code | Last Updated: Based on conversation context*
