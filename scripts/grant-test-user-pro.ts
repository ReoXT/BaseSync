/**
 * Development Utility: Grant Pro Plan Access to Test User
 *
 * Usage: npm run grant-test-pro
 *
 * This script gives the test@email.com user an active Pro subscription
 * for testing purposes without going through Stripe checkout.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TEST_EMAIL = 'test@email.com';

async function main() {
  console.log('🔍 Looking for user with email:', TEST_EMAIL);

  const user = await prisma.user.findUnique({
    where: { email: TEST_EMAIL },
  });

  if (!user) {
    console.error('❌ User not found. Please create an account with', TEST_EMAIL, 'first.');
    process.exit(1);
  }

  console.log('✅ User found:', user.id);
  console.log('📝 Updating user to Pro plan...');

  // Calculate trial end date (14 days from now for testing)
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);

  const updatedUser = await prisma.user.update({
    where: { email: TEST_EMAIL },
    data: {
      subscriptionPlan: 'pro',
      subscriptionStatus: 'active',
      datePaid: new Date(),
      trialEndsAt: trialEndsAt,
      // Give some credits for testing
      credits: 100,
    },
  });

  console.log('✅ User successfully updated!');
  console.log('\n📊 Current subscription details:');
  console.log('   Email:', updatedUser.email);
  console.log('   Plan:', updatedUser.subscriptionPlan);
  console.log('   Status:', updatedUser.subscriptionStatus);
  console.log('   Date Paid:', updatedUser.datePaid);
  console.log('   Trial Ends:', updatedUser.trialEndsAt);
  console.log('   Credits:', updatedUser.credits);
  console.log('\n🎉 You can now test Pro plan features with', TEST_EMAIL);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
