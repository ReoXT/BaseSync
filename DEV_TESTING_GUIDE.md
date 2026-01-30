# Development Testing Guide - Grant Test User Pro Access

## ✅ Current Status

**Prisma Studio is running at:** http://localhost:5555

## Step-by-Step Instructions

### Step 1: Create Test Account (if not exists)

1. Go to your app: http://localhost:3000
2. Click "Sign Up"
3. Register with:
   - Email: `test@email.com`
   - Password: (any password you'll remember)
4. Verify email if prompted

### Step 2: Grant Pro Access via Prisma Studio

1. **Open Prisma Studio:** http://localhost:5555

2. **Navigate to Users:**
   - Click "User" in the left sidebar
   - You'll see a table of all users

3. **Find Test User:**
   - Look for the row with email `test@email.com`
   - Click on that row (it will expand)

4. **Edit Subscription Fields:**
   Update these fields:

   | Field | Current Value | New Value |
   |-------|--------------|-----------|
   | `subscriptionPlan` | `null` or empty | `pro` |
   | `subscriptionStatus` | `null` or empty | `active` |
   | `datePaid` | `null` or empty | Click calendar icon → Select today |
   | `credits` | `3` | `100` |

5. **Save Changes:**
   - Click the green "Save 1 change" button at bottom
   - You should see a success message

### Step 3: Verify in Your App

1. **Log in to your app:**
   - Go to http://localhost:3000
   - Log in as `test@email.com`

2. **Check Account Settings:**
   - Navigate to `/account-settings` (or click your profile menu)
   - Click the "Subscription" tab

3. **Verify Pro Features:**
   You should see:
   - ✅ Plan: **Pro** (with green "Active" badge)
   - ✅ Sync Configurations: **3**
   - ✅ Records per Sync: **5,000**
   - ✅ Sync Interval: **5 minutes**
   - ✅ Credits: **100**
   - ✅ "Manage Billing" button (opens Stripe portal)

---

## What You Can Now Test

### ✅ Subscription Features
- View Pro plan limits
- Click "Manage Billing" button
- See usage statistics
- Test upgrade prompts (won't show since you have Pro)

### ✅ Sync Configuration Limits
- Create up to 3 sync configurations (Starter only allows 1)
- Test the "you've reached your limit" message when creating 4th sync

### ✅ Record Limits
- Sync up to 5,000 records (Starter only allows 1,000)
- See usage warnings at 80% of limit (4,000 records)

---

## Switching Between Plans (for Testing)

Want to test different plan limits? Update `subscriptionPlan` in Prisma Studio:

| Plan | subscriptionPlan Value | Syncs | Records | Interval |
|------|----------------------|-------|---------|----------|
| **Free Trial** | `null` | 3 | 5,000 | 5 min |
| **Starter** | `starter` | 1 | 1,000 | 15 min |
| **Pro** | `pro` | 3 | 5,000 | 5 min |
| **Business** | `business` | 10 | Unlimited | 5 min |

---

## Reset to Free Trial

To reset test user back to trial:

```sql
UPDATE "User"
SET
  "subscriptionPlan" = NULL,
  "subscriptionStatus" = NULL,
  "datePaid" = NULL,
  credits = 3
WHERE email = 'test@email.com';
```

---

## Troubleshooting

### Changes not appearing?
1. Hard reload browser (Cmd+Shift+R / Ctrl+Shift+R)
2. Clear cache
3. Log out and log back in
4. Check browser console for errors

### Can't find user in Prisma Studio?
- User hasn't been created yet
- Check you're looking at the correct database
- Try searching by email in Prisma Studio

### Prisma Studio not running?
```bash
cd "/Volumes/ReoXT/Cursor Files/BaseSync"
npx prisma studio
```

### Stop Prisma Studio
```bash
pkill -f 'prisma studio'
```

---

## Files Created for You

- ✅ [QUICK_TEST_SETUP.md](QUICK_TEST_SETUP.md) - Quick reference guide
- ✅ [GRANT_TEST_ACCESS.md](GRANT_TEST_ACCESS.md) - Alternative methods
- ✅ [scripts/grant-pro-access.sql](scripts/grant-pro-access.sql) - SQL script
- ✅ [grant-test-pro.mjs](grant-test-pro.mjs) - Node.js script (needs Wasp context)

Use whichever method you prefer!
