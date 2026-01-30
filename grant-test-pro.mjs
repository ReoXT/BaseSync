#!/usr/bin/env node
/**
 * Quick script to grant Pro plan access to test@email.com
 * Run with: node grant-test-pro.mjs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TEST_EMAIL = 'test@email.com';

async function grantProAccess() {
  try {
    console.log('🔍 Looking for user:', TEST_EMAIL);

    const user = await prisma.user.findUnique({
      where: { email: TEST_EMAIL },
      select: {
        id: true,
        email: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
      },
    });

    if (!user) {
      console.error('❌ ERROR: User not found!');
      console.log('\n📝 Please:');
      console.log('   1. Start your app: wasp start');
      console.log('   2. Sign up with email: test@email.com');
      console.log('   3. Run this script again');
      process.exit(1);
    }

    console.log('✅ User found:', user.id);
    console.log('   Current plan:', user.subscriptionPlan || 'None');
    console.log('   Current status:', user.subscriptionStatus || 'None');
    console.log('\n⏳ Granting Pro access...');

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    await prisma.user.update({
      where: { email: TEST_EMAIL },
      data: {
        subscriptionPlan: 'pro',
        subscriptionStatus: 'active',
        datePaid: new Date(),
        trialEndsAt: trialEndsAt,
        credits: 100,
      },
    });

    console.log('✅ SUCCESS! Pro plan granted.');
    console.log('\n📊 New subscription details:');
    console.log('   Plan: Pro');
    console.log('   Status: Active');
    console.log('   Trial ends:', trialEndsAt.toLocaleDateString());
    console.log('   Credits: 100');
    console.log('\n🎉 You can now test Pro features at /account-settings');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

grantProAccess();
