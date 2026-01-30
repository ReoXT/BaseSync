-- Grant Pro Plan Access to Test User (test@email.com)
-- Usage: Run this SQL in your database client or via Prisma Studio

-- Step 1: Check if user exists
SELECT id, email, "subscriptionPlan", "subscriptionStatus"
FROM "User"
WHERE email = 'test@email.com';

-- Step 2: Grant Pro access (run this after confirming user exists)
UPDATE "User"
SET
  "subscriptionPlan" = 'pro',
  "subscriptionStatus" = 'active',
  "datePaid" = NOW(),
  "trialEndsAt" = NOW() + INTERVAL '14 days',
  credits = 100
WHERE email = 'test@email.com';

-- Step 3: Verify the update
SELECT
  id,
  email,
  "subscriptionPlan",
  "subscriptionStatus",
  "datePaid",
  "trialEndsAt",
  credits
FROM "User"
WHERE email = 'test@email.com';
