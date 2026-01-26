# BaseSync User Onboarding Guide

**Complete First-Time User Journey**

---

## 📋 Table of Contents

1. [Phase 1: Account Setup](#phase-1-account-setup)
2. [Phase 2: Connect Services](#phase-2-connect-services)
3. [Phase 3: Create First Sync](#phase-3-create-first-sync)
4. [Phase 4: Sync is Active](#phase-4-sync-is-active)
5. [Implementation Status](#implementation-status)

---

## Phase 1: Account Setup

### 1.1 Landing Page (`/`)

**User arrives at the landing page**

- Sees hero section: *"True Two-Way Sync: Airtable ↔ Google Sheets"*
- Reads the value proposition
- Clicks **"Start Free Trial"** or **"Sign Up"** button

### 1.2 Sign Up (`/signup`)

**User creates an account**

- **Option A**: Email + Password
  - Enter email address
  - Create password
  - Submit registration form

- **Option B**: Google OAuth (if enabled)
  - Click "Sign up with Google"
  - Select Google account
  - Authorize access

**After signup:**
- Email verification sent
- In development mode: Check server logs for verification link
- In production: Check email inbox

### 1.3 Email Verification (`/email-verification`)

**User verifies email**

1. User clicks verification link from email
2. Account is verified
3. **Auto-redirected to Dashboard** (`/dashboard`)

---

## Phase 2: Connect Services

### Dashboard Overview (`/dashboard`)

**First-time dashboard view:**

```
╔════════════════════════════════════════════════════════════╗
║                   BaseSync Dashboard                        ║
║     Seamlessly sync data between Airtable and Google Sheets ║
╚════════════════════════════════════════════════════════════╝

┌─────────────────────────────┐  ┌─────────────────────────────┐
│  🗄️  Airtable              │  │  📊 Google Sheets           │
│                             │  │                             │
│  ❌ Not connected           │  │  ❌ Not connected           │
│                             │  │                             │
│  ┌─────────────────────┐   │  │  ┌─────────────────────┐   │
│  │ Connect Airtable    │   │  │  │ Connect Google      │   │
│  └─────────────────────┘   │  │  │      Sheets         │   │
└─────────────────────────────┘  └──│                     │───┘
                                    └─────────────────────┘

Quick Stats
┌──────────────┬──────────────┬──────────────┐
│ Active Syncs │ Records      │ Last Sync    │
│      0       │ Synced: 0    │ Never        │
└──────────────┴──────────────┴──────────────┘

Sync Configurations
┌────────────────────────────────────────────────┐
│  ⚠️  No sync configurations yet                │
│                                                │
│  Connect both Airtable and Google Sheets       │
│  to start creating sync configurations.        │
│                                                │
│  ┌────────────────────────────┐               │
│  │ Create Your First Sync     │ (disabled)    │
│  └────────────────────────────┘               │
└────────────────────────────────────────────────┘
```

---

### 2.1 Connect Airtable

#### Step 1: Click "Connect Airtable"

User clicks the **"Connect Airtable"** button on the dashboard.

#### Step 2: Initiation (Frontend → Backend)

**What happens:**
- `initiateAirtableAuth()` action is called
- Server generates PKCE challenge:
  - Creates random `code_verifier` (base64url encoded)
  - Generates SHA-256 hash as `code_challenge`
- Stores code verifier in memory (indexed by user ID)
- Returns Airtable authorization URL

#### Step 3: OAuth Flow (Redirect to Airtable)

**User is redirected to Airtable:**

URL format:
```
https://airtable.com/oauth2/v1/authorize
  ?client_id=YOUR_CLIENT_ID
  &redirect_uri=http://localhost:3000/auth/airtable/callback
  &response_type=code
  &scope=data.records:read data.records:write schema.bases:read
  &state=USER_ID
  &code_challenge=PKCE_CHALLENGE
  &code_challenge_method=S256
```

**Airtable Consent Screen:**

```
╔════════════════════════════════════════╗
║           Airtable                      ║
╠════════════════════════════════════════╣
║                                        ║
║  BaseSync wants to access your         ║
║  Airtable account                      ║
║                                        ║
║  Permissions requested:                ║
║  ✓ Read your records                   ║
║  ✓ Write to your records               ║
║  ✓ Read your base schemas              ║
║                                        ║
║  ┌────────────────┐  ┌──────────────┐ ║
║  │ Cancel         │  │ Grant access │ ║
║  └────────────────┘  └──────────────┘ ║
╚════════════════════════════════════════╝
```

User clicks **"Grant access"**

#### Step 4: Callback (Airtable → Your App)

**Airtable redirects back to your app:**

Redirect URL:
```
http://localhost:3000/auth/airtable/callback
  ?code=AUTHORIZATION_CODE
  &state=USER_ID
```

**Callback Page (`/auth/airtable/callback`):**
- Shows loading spinner
- `completeAirtableAuth()` action is called with the code
- Backend process:
  1. Retrieves PKCE `code_verifier` from memory using user ID
  2. Validates `state` parameter matches user ID (CSRF protection)
  3. Exchanges authorization code + verifier for tokens
  4. Validates granted scopes match requested scopes
  5. Encrypts access token and refresh token
  6. Stores encrypted tokens in database
  7. Cleans up PKCE verifier from memory

**Success:**
- Success message displayed
- Auto-redirect to Dashboard after 2 seconds

#### Step 5: Dashboard Updates

**Connection card now shows:**

```
┌─────────────────────────────┐
│  🗄️  Airtable              │
│                             │
│  ✅ Connected               │
│  Connected to account       │
│                             │
│  ┌─────────────────────┐   │
│  │ Reconnect           │   │
│  └─────────────────────┘   │
└─────────────────────────────┘
```

---

### 2.2 Connect Google Sheets

#### Step 1: Click "Connect Google Sheets"

User clicks the **"Connect Google Sheets"** button.

#### Step 2: Initiation (Frontend → Backend)

**What happens:**
- `initiateGoogleAuth()` action is called
- Server generates Google authorization URL
- Returns URL to frontend

#### Step 3: OAuth Flow (Redirect to Google)

**User is redirected to Google:**

URL format:
```
https://accounts.google.com/o/oauth2/v2/auth
  ?client_id=YOUR_CLIENT_ID
  &redirect_uri=http://localhost:3000/auth/google/callback
  &response_type=code
  &scope=https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly
  &access_type=offline
  &prompt=consent
  &state=USER_ID
```

**Google Account Selection:**

```
╔════════════════════════════════════════╗
║           Sign in with Google           ║
╠════════════════════════════════════════╣
║                                        ║
║  Choose an account                     ║
║                                        ║
║  ┌────────────────────────────────┐   ║
║  │ 👤 user@gmail.com              │   ║
║  └────────────────────────────────┘   ║
║                                        ║
║  ┌────────────────────────────────┐   ║
║  │ Use another account            │   ║
║  └────────────────────────────────┘   ║
╚════════════════════════════════════════╝
```

**If app not verified by Google:**

```
╔════════════════════════════════════════╗
║  ⚠️  This app hasn't been verified    ║
║       by Google                        ║
╠════════════════════════════════════════╣
║                                        ║
║  This app is currently being tested    ║
║  and can only be accessed by           ║
║  developer-approved testers.           ║
║                                        ║
║  ┌────────────────────────────────┐   ║
║  │ Advanced                       │   ║
║  └────────────────────────────────┘   ║
╚════════════════════════════════════════╝

(User clicks "Advanced")

╔════════════════════════════════════════╗
║  ⚠️ Go to BaseSync (unsafe)?          ║
║                                        ║
║  This app is not verified but you     ║
║  can continue at your own risk.        ║
║                                        ║
║  ┌────────────┐  ┌──────────────────┐ ║
║  │ Go back    │  │ Go to BaseSync   │ ║
║  │            │  │ (unsafe)         │ ║
║  └────────────┘  └──────────────────┘ ║
╚════════════════════════════════════════╝
```

User clicks **"Go to BaseSync (unsafe)"**

**Google Consent Screen:**

```
╔════════════════════════════════════════╗
║  BaseSync wants to access your         ║
║  Google Account                        ║
╠════════════════════════════════════════╣
║                                        ║
║  user@gmail.com                        ║
║                                        ║
║  This will allow BaseSync to:          ║
║                                        ║
║  ✓ See, edit, create, and delete       ║
║    all your Google Sheets              ║
║                                        ║
║  ✓ See and download all your           ║
║    Google Drive files                  ║
║                                        ║
║  ⓘ Make sure you trust BaseSync        ║
║                                        ║
║  ┌────────────┐  ┌──────────────────┐ ║
║  │ Cancel     │  │ Allow            │ ║
║  └────────────┘  └──────────────────┘ ║
╚════════════════════════════════════════╝
```

User clicks **"Allow"**

#### Step 4: Callback (Google → Your App)

**Google redirects back to your app:**

Redirect URL:
```
http://localhost:3000/auth/google/callback
  ?code=AUTHORIZATION_CODE
  &state=USER_ID
  &scope=https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly
```

**Callback Page (`/auth/google/callback`):**
- Shows loading spinner
- `completeGoogleAuth()` action is called
- Backend process:
  1. Validates `state` parameter
  2. Exchanges code for tokens
  3. Validates granted scopes
  4. Fetches Google user info (email)
  5. Encrypts tokens
  6. Stores in database with user's email

**Success:**
- Success message displayed
- Auto-redirect to Dashboard

#### Step 5: Dashboard Updates

**Both connections now active:**

```
┌─────────────────────────────┐  ┌─────────────────────────────┐
│  🗄️  Airtable              │  │  📊 Google Sheets           │
│                             │  │                             │
│  ✅ Connected               │  │  ✅ Connected               │
│  Connected to account       │  │  user@gmail.com             │
│                             │  │                             │
│  ┌─────────────────────┐   │  │  ┌─────────────────────┐   │
│  │ Reconnect           │   │  │  │ Reconnect           │   │
│  └─────────────────────┘   │  │  └─────────────────────┘   │
└─────────────────────────────┘  └─────────────────────────────┘

                    ✅ Ready to create syncs!
```

**"+ New Sync" button is now ENABLED**

---

## Phase 3: Create First Sync

### Overview: 5-Step Wizard

User clicks **"+ New Sync"** → Navigates to `/sync/new`

**Wizard Steps:**
1. Select Airtable (base + table)
2. Select Google Sheets (spreadsheet + sheet)
3. Map Fields (Airtable fields → Sheets columns)
4. Configure Sync (direction, conflict resolution, name)
5. Review & Create

---

### Step 1: Select Airtable

**URL:** `/sync/new` (step 1)

**Visual:**

```
╔════════════════════════════════════════════════════════════╗
║                    Create New Sync                          ║
║   Set up a new sync configuration between Airtable          ║
║              and Google Sheets                              ║
╚════════════════════════════════════════════════════════════╝

Progress: [●]═══[○]───[○]───[○]───[○]
          Step 1 of 5

┌────────────────────────────────────────────────────────────┐
│ Select Airtable                                            │
│ Choose your Airtable base and table                        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Select Base:                                               │
│ ┌──────────────────────────────────────────────────┐ ▼    │
│ │ Choose a base...                                 │      │
│ └──────────────────────────────────────────────────┘      │
│                                                            │
│ Available bases:                                           │
│ • My Workspace                                             │
│   - Project Management Base                                │
│   - Customer CRM                                           │
│   - Inventory Tracker                                      │
│   - Marketing Calendar                                     │
│                                                            │
└────────────────────────────────────────────────────────────┘

(User selects "Project Management Base")

┌────────────────────────────────────────────────────────────┐
│ Select Base: Project Management Base              ✓        │
│                                                            │
│ Select Table:                                              │
│ ┌──────────────────────────────────────────────────┐ ▼    │
│ │ Choose a table...                                │      │
│ └──────────────────────────────────────────────────┘      │
│                                                            │
│ Available tables:                                          │
│ • Tasks                                                    │
│ • Team Members                                             │
│ • Projects                                                 │
│ • Clients                                                  │
│                                                            │
└────────────────────────────────────────────────────────────┘

(User selects "Tasks")

┌────────────────────────────────────────────────────────────┐
│ Table Preview: Tasks                                       │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ ┌──────────┬────────────┬──────────┬──────────┬─────────┐ │
│ │ Name     │ Status     │ Due Date │ Priority │ Owner   │ │
│ │ (text)   │ (select)   │ (date)   │ (select) │ (linked)│ │
│ ├──────────┼────────────┼──────────┼──────────┼─────────┤ │
│ │ 5 fields detected                                      │ │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘

           ┌──────────┐  Step 1 of 5  ┌──────────┐
           │ < Back   │                │ Next >   │
           └──────────┘                └──────────┘
                      (disabled)         (enabled)
```

**User Actions:**
1. Select base from dropdown
2. Select table from dropdown (appears after base selected)
3. Review field preview
4. Click **"Next"**

---

### Step 2: Select Google Sheets

**Progress:** `[✓]═══[●]═══[○]───[○]───[○]`

**Visual:**

```
┌────────────────────────────────────────────────────────────┐
│ Select Google Sheets                                       │
│ Choose your spreadsheet and sheet                          │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Select Spreadsheet:                                        │
│ ┌──────────────────────────────────────────────────┐ ▼    │
│ │ Choose a spreadsheet...                          │      │
│ └──────────────────────────────────────────────────┘      │
│                                                            │
│ Your spreadsheets:                                         │
│ • Q1 2024 Planning                                         │
│ • Marketing Dashboard                                      │
│ • Sales Tracker                                            │
│ • Team OKRs                                                │
│                                                            │
└────────────────────────────────────────────────────────────┘

(User selects "Q1 2024 Planning")

┌────────────────────────────────────────────────────────────┐
│ Select Spreadsheet: Q1 2024 Planning             ✓        │
│                                                            │
│ Select Sheet:                                              │
│ ┌──────────────────────────────────────────────────┐ ▼    │
│ │ Choose a sheet...                                │      │
│ └──────────────────────────────────────────────────┘      │
│                                                            │
│ Available sheets:                                          │
│ • Sheet1                                                   │
│ • Tasks                                                    │
│ • Budget                                                   │
│ • Timeline                                                 │
│                                                            │
└────────────────────────────────────────────────────────────┘

(User selects "Tasks")

┌────────────────────────────────────────────────────────────┐
│ Sheet Preview: Tasks                                       │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Column Headers:                                            │
│ A: Task Name                                               │
│ B: Status                                                  │
│ C: Due Date                                                │
│ D: Priority                                                │
│ E: Assigned To                                             │
│                                                            │
│ 5 columns detected                                         │
└────────────────────────────────────────────────────────────┘

           ┌──────────┐  Step 2 of 5  ┌──────────┐
           │ < Back   │                │ Next >   │
           └──────────┘                └──────────┘
            (enabled)                   (enabled)
```

**User Actions:**
1. Select spreadsheet from dropdown
2. Select sheet from dropdown
3. Review column headers
4. Click **"Next"**

---

### Step 3: Map Fields

**Progress:** `[✓]═══[✓]═══[●]═══[○]───[○]`

**Visual:**

```
┌────────────────────────────────────────────────────────────┐
│ Map Fields                                                 │
│ Map Airtable fields to Google Sheets columns              │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ We'll automatically suggest mappings based on matching     │
│ field names.                                               │
│                                                            │
│ Airtable Field            →    Google Sheets Column       │
│ ──────────────────────────     ────────────────────────   │
│                                                            │
│ Name (text)               →    ┌──────────────────┐ ▼     │
│                                │ A: Task Name     │       │
│                                └──────────────────┘       │
│                                ✓ Auto-matched             │
│                                                            │
│ Status (single select)    →    ┌──────────────────┐ ▼     │
│                                │ B: Status        │       │
│                                └──────────────────┘       │
│                                ✓ Auto-matched             │
│                                                            │
│ Due Date (date)           →    ┌──────────────────┐ ▼     │
│                                │ C: Due Date      │       │
│                                └──────────────────┘       │
│                                ✓ Auto-matched             │
│                                                            │
│ Priority (single select)  →    ┌──────────────────┐ ▼     │
│                                │ D: Priority      │       │
│                                └──────────────────┘       │
│                                ✓ Auto-matched             │
│                                                            │
│ Owner (linked record)     →    ┌──────────────────┐ ▼     │
│ ⓘ Will sync as names          │ E: Assigned To   │       │
│   (not IDs)                    └──────────────────┘       │
│                                ✓ Auto-matched             │
│                                                            │
│ ┌────────────────────────────┐                            │
│ │ + Map another field        │                            │
│ └────────────────────────────┘                            │
│                                                            │
│ ✓ 5 fields mapped successfully                            │
│                                                            │
└────────────────────────────────────────────────────────────┘

           ┌──────────┐  Step 3 of 5  ┌──────────┐
           │ < Back   │                │ Next >   │
           └──────────┘                └──────────┘
            (enabled)                   (enabled)
```

**Key Features:**
- Auto-matching based on field name similarity
- Dropdown for each field to manually adjust mapping
- Visual indicator for linked records → names (not IDs)
- Validation: At least 1 field must be mapped

**User Actions:**
1. Review auto-suggested mappings
2. Adjust mappings if needed using dropdowns
3. Add additional field mappings (optional)
4. Click **"Next"**

---

### Step 4: Configure Sync

**Progress:** `[✓]═══[✓]═══[✓]═══[●]───[○]`

**Visual:**

```
┌────────────────────────────────────────────────────────────┐
│ Configure Sync                                             │
│ Set sync direction and conflict resolution                 │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Sync Name:                                                 │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ Project Tasks Sync                                   │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                            │
│ ───────────────────────────────────────────────────────   │
│                                                            │
│ Sync Direction:                                            │
│                                                            │
│ ○ Airtable → Sheets (one-way)                             │
│   Sync from Airtable to Google Sheets only                │
│                                                            │
│ ○ Sheets → Airtable (one-way)                             │
│   Sync from Google Sheets to Airtable only                │
│                                                            │
│ ● Bidirectional (two-way) ← Recommended                   │
│   Sync in both directions automatically                    │
│                                                            │
│ ───────────────────────────────────────────────────────   │
│                                                            │
│ Conflict Resolution:                                       │
│ (What happens when the same record changes in both         │
│  systems since last sync?)                                 │
│                                                            │
│ ○ Airtable wins                                            │
│   Always use the Airtable version                          │
│                                                            │
│ ○ Sheets wins                                              │
│   Always use the Google Sheets version                     │
│                                                            │
│ ● Newest wins ← Recommended                                │
│   Use whichever was updated most recently                  │
│                                                            │
│ ───────────────────────────────────────────────────────   │
│                                                            │
│ Sync Frequency:                                            │
│ ⓘ Syncs run automatically every 5 minutes when active      │
│                                                            │
└────────────────────────────────────────────────────────────┘

           ┌──────────┐  Step 4 of 5  ┌──────────┐
           │ < Back   │                │ Next >   │
           └──────────┘                └──────────┘
            (enabled)                   (enabled)
```

**Configuration Options:**

1. **Sync Name:** User-friendly identifier
2. **Sync Direction:**
   - `AIRTABLE_TO_SHEETS`: One-way, Airtable → Sheets
   - `SHEETS_TO_AIRTABLE`: One-way, Sheets → Airtable
   - `BIDIRECTIONAL`: Two-way sync
3. **Conflict Resolution** (only for bidirectional):
   - `AIRTABLE_WINS`: Airtable always overwrites
   - `SHEETS_WINS`: Sheets always overwrites
   - `NEWEST_WINS`: Most recent change wins

**User Actions:**
1. Enter sync name
2. Select sync direction
3. If bidirectional: select conflict resolution
4. Click **"Next"**

---

### Step 5: Review & Create

**Progress:** `[✓]═══[✓]═══[✓]═══[✓]═══[●]`

**Visual:**

```
┌────────────────────────────────────────────────────────────┐
│ Review                                                     │
│ Review your sync configuration before creating             │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Summary:                                                   │
│ ┌────────────────────────────────────────────────────────┐│
│ │                                                        ││
│ │  Project Tasks Sync                                    ││
│ │                                                        ││
│ ├────────────────────────────────────────────────────────┤│
│ │                                                        ││
│ │  🗄️  Airtable Source                                  ││
│ │     Base: Project Management                           ││
│ │     Table: Tasks                                       ││
│ │                                                        ││
│ │  ↕️  Sync Type: Bidirectional                         ││
│ │     Conflict Resolution: Newest Wins                   ││
│ │     Frequency: Every 5 minutes                         ││
│ │                                                        ││
│ │  📊 Google Sheets Destination                          ││
│ │     Spreadsheet: Q1 2024 Planning                      ││
│ │     Sheet: Tasks                                       ││
│ │                                                        ││
│ ├────────────────────────────────────────────────────────┤│
│ │                                                        ││
│ │  Field Mappings (5 fields):                            ││
│ │  • Name → Task Name                                    ││
│ │  • Status → Status                                     ││
│ │  • Due Date → Due Date                                 ││
│ │  • Priority → Priority                                 ││
│ │  • Owner → Assigned To (as names)                      ││
│ │                                                        ││
│ └────────────────────────────────────────────────────────┘│
│                                                            │
│           ┌────────────────────────────┐                  │
│           │ Edit Configuration         │                  │
│           └────────────────────────────┘                  │
│                                                            │
└────────────────────────────────────────────────────────────┘

           ┌──────────┐  Step 5 of 5  ┌──────────────┐
           │ < Back   │                │ Create Sync  │
           └──────────┘                └──────────────┘
            (enabled)                     (enabled)
```

**User Actions:**
1. Review all settings
2. Click **"Edit Configuration"** if changes needed (goes back to step 1)
3. Click **"Create Sync"** to finalize

---

### Sync Creation Process

**When user clicks "Create Sync":**

1. **Validation** (Frontend)
   - Verify all required fields present
   - Check both connections still active

2. **API Call** (Backend)
   - `createSyncConfig` action called
   - Validates user owns both OAuth connections
   - Creates `SyncConfig` record in database
   - Returns created config with ID

3. **Initial Sync Triggered**
   - `runInitialSync` action called
   - Performs first bulk sync of existing data
   - Creates `SyncLog` entry

4. **Success Flow**
   - Success message shown
   - User redirected to:
     - **Option A:** Dashboard (`/dashboard`)
     - **Option B:** Sync Detail Page (`/sync/:id`)

---

## Phase 4: Sync is Active

### Updated Dashboard View

**After creating first sync:**

```
╔════════════════════════════════════════════════════════════╗
║                   BaseSync Dashboard                        ║
╚════════════════════════════════════════════════════════════╝

┌─────────────────────────────┐  ┌─────────────────────────────┐
│  🗄️  Airtable              │  │  📊 Google Sheets           │
│                             │  │                             │
│  ✅ Connected               │  │  ✅ Connected               │
│  Connected to account       │  │  user@gmail.com             │
│                             │  │                             │
│  ┌─────────────────────┐   │  │  ┌─────────────────────┐   │
│  │ Reconnect           │   │  │  │ Reconnect           │   │
│  └─────────────────────┘   │  │  └─────────────────────┘   │
└─────────────────────────────┘  └─────────────────────────────┘

Quick Stats
┌──────────────┬──────────────┬──────────────┐
│ Active Syncs │ Records      │ Last Sync    │
│      1       │ Synced: 127  │ 2 mins ago   │
└──────────────┴──────────────┴──────────────┘

Sync Configurations
┌────────────────────────────────────────────────┐
│  Project Tasks Sync                    [Active]│
│                                                │
│  🗄️ → 📊 Bidirectional                        │
│  Project Management → Q1 2024 Planning         │
│                                                │
│  Last sync: 2 minutes ago                      │
│  Status: ✅ Success (127 records synced)       │
│                                                │
│  ┌─────────────┐ ┌──────────┐ ┌────────┐     │
│  │ View Details│ │ Sync Now │ │  •••   │     │
│  └─────────────┘ └──────────┘ └────────┘     │
└────────────────────────────────────────────────┘

                ┌──────────────┐
                │ + New Sync   │
                └──────────────┘
```

### Automatic Background Sync

**What happens automatically:**

1. **Initial Sync** (immediate)
   - Runs when sync is created
   - Syncs all existing data
   - Creates baseline for future syncs

2. **Scheduled Syncs** (every 5 minutes)
   - Background job runs via PgBoss
   - Fetches all active `SyncConfig` records
   - For each config:
     - Checks if 5 minutes elapsed
     - Runs appropriate sync (one-way or bidirectional)
     - Logs results in `SyncLog`

3. **Sync Process:**
   - Detects changes since last sync
   - Applies field mappings
   - Resolves linked records to names
   - Handles conflicts per user's rules
   - Updates both systems
   - Records stats (records synced, errors, duration)

### Sync Detail Page

**User can click "View Details" to see:**

```
╔════════════════════════════════════════════════════════════╗
║              Project Tasks Sync                             ║
╠════════════════════════════════════════════════════════════╣

Status: Active ✅
Last synced: 2 minutes ago

┌────────────────────────────────────────────────────────────┐
│ Configuration                                              │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ 🗄️  Airtable                                              │
│    Base: Project Management                                │
│    Table: Tasks                                            │
│                                                            │
│ ↕️  Sync Type: Bidirectional                              │
│    Conflict Resolution: Newest Wins                        │
│    Frequency: Every 5 minutes                              │
│                                                            │
│ 📊 Google Sheets                                           │
│    Spreadsheet: Q1 2024 Planning                           │
│    Sheet: Tasks                                            │
│                                                            │
│ Field Mappings: 5 fields                                   │
│                                                            │
│ ┌──────────┐  ┌──────────┐  ┌────────────────┐           │
│ │ Edit     │  │ Pause    │  │ Delete Sync    │           │
│ └──────────┘  └──────────┘  └────────────────┘           │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ Sync History                                               │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ ┌──────────────┬──────────┬──────────┬─────────────────┐  │
│ │ Date/Time    │ Duration │ Records  │ Status          │  │
│ ├──────────────┼──────────┼──────────┼─────────────────┤  │
│ │ 2 mins ago   │ 3.2s     │ 127      │ ✅ Success     │  │
│ │ 7 mins ago   │ 2.8s     │ 3        │ ✅ Success     │  │
│ │ 12 mins ago  │ 2.5s     │ 0        │ ℹ️  No changes │  │
│ │ 17 mins ago  │ 3.1s     │ 5        │ ✅ Success     │  │
│ │ Initial sync │ 8.4s     │ 127      │ ✅ Success     │  │
│ └──────────────┴──────────┴──────────┴─────────────────┘  │
│                                                            │
│ Click to expand and see error details (if any)            │
└────────────────────────────────────────────────────────────┘
```

---

## Implementation Status

### ✅ Fully Implemented

**Authentication & Authorization:**
- ✅ User signup with email/password
- ✅ Email verification flow
- ✅ User login/logout
- ✅ Dashboard access control

**OAuth Integrations:**
- ✅ Airtable OAuth with PKCE (secure)
- ✅ Google Sheets OAuth
- ✅ Token encryption and storage
- ✅ Automatic token refresh
- ✅ Connection status display

**Database Models:**
- ✅ User
- ✅ AirtableConnection
- ✅ GoogleSheetsConnection
- ✅ SyncConfig
- ✅ SyncLog

**UI Components:**
- ✅ Dashboard layout
- ✅ Connection status cards
- ✅ 5-step wizard structure
- ✅ Progress indicator
- ✅ Navigation buttons

**Backend Actions:**
- ✅ `initiateAirtableAuth`
- ✅ `completeAirtableAuth`
- ✅ `initiateGoogleAuth`
- ✅ `completeGoogleAuth`
- ✅ `createSyncConfig`
- ✅ Background job scaffolding

---

### ⚠️ Partially Implemented

**Wizard Components:**
- ⚠️ AirtableSelector (needs API integration)
- ⚠️ GoogleSheetsSelector (needs API integration)
- ⚠️ FieldMapper (needs logic)
- ⚠️ SyncOptions (UI done, needs validation)
- ⚠️ ReviewStep (UI done, needs data display)

**Sync Engine:**
- ⚠️ Field type mapping (code written, needs testing)
- ⚠️ Linked record resolution (code written, needs testing)
- ⚠️ Conflict detection (code written, needs testing)

**API Clients:**
- ⚠️ Airtable API wrapper (basic methods exist)
- ⚠️ Google Sheets API wrapper (basic methods exist)

---

### ❌ Not Yet Built

**Sync Execution:**
- ❌ Initial bulk sync implementation
- ❌ Background job execution logic
- ❌ Real-time sync monitoring

**UI Features:**
- ❌ Sync detail page (route exists, page incomplete)
- ❌ Sync history table with expandable errors
- ❌ Manual "Sync Now" button functionality
- ❌ Pause/Resume sync controls
- ❌ Edit sync configuration
- ❌ Delete sync with confirmation

**Error Handling:**
- ❌ User-facing error notifications
- ❌ Email alerts for sync failures
- ❌ Retry logic for failed syncs

**Additional Features:**
- ❌ Webhook support (Airtable real-time)
- ❌ Usage limits enforcement (based on subscription)
- ❌ Sync analytics and insights
- ❌ Export sync logs

---

## Next Steps for Development

### Priority 1: Complete Wizard (Phase 3)
1. Implement `AirtableSelector` with real API calls
2. Implement `GoogleSheetsSelector` with real API calls
3. Build `FieldMapper` logic with auto-matching
4. Wire up `ReviewStep` with actual data display
5. Test end-to-end sync creation flow

### Priority 2: Sync Engine (Phase 4)
1. Implement `runInitialSync` action
2. Build one-way sync: Airtable → Sheets
3. Build one-way sync: Sheets → Airtable
4. Build bidirectional sync with conflict resolution
5. Test with real Airtable bases and Google Sheets

### Priority 3: Monitoring & Management
1. Build sync detail page
2. Implement sync history display
3. Add manual "Sync Now" functionality
4. Implement pause/resume controls
5. Add error notification system

### Priority 4: Polish & Production
1. Add loading states everywhere
2. Improve error messages
3. Add usage limits (subscription tiers)
4. Set up monitoring/alerts
5. Production deployment checklist

---

## Key User Value Propositions

Throughout the entire flow, emphasize:

1. **No Code Required** - Point-and-click setup, no technical skills needed
2. **True Bidirectional** - Unlike Zapier which can't do two-way sync
3. **Linked Records = Names** - Shows "John Doe", not "rec123abc"
4. **Bulk Historical Sync** - Syncs all existing data, not just new records
5. **Set Once, Runs Forever** - Automatic sync every 5 minutes
6. **Smart Conflict Resolution** - User chooses the rules upfront
7. **Transparent Logging** - See exactly what synced and when

---

## User Support & Troubleshooting

### Common Issues:

1. **"OAuth session expired"**
   - Cause: PKCE verifier cleared from memory
   - Solution: Try connecting again

2. **"redirect_uri_mismatch"**
   - Cause: Google Cloud Console URI doesn't match .env
   - Solution: Update Google Cloud Console settings

3. **"App not verified by Google"**
   - Cause: App in testing mode
   - Solution: Add user as test user in OAuth consent screen

4. **Sync not running**
   - Cause: Connection expired
   - Solution: Reconnect both services

---

**End of Onboarding Guide**

*Last Updated: Based on current codebase implementation*
