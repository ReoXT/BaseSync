/**
 * Grant Pro Plan Access to Test User
 *
 * This is a Wasp action that grants Pro plan to test@email.com
 * Call it from the browser console or create a temporary page
 */
import { prisma } from 'wasp/server';
const TEST_EMAIL = 'test@email.com';
export async function grantTestUserProAccess() {
    console.log('🔍 Looking for user:', TEST_EMAIL);
    const user = await prisma.user.findUnique({
        where: { email: TEST_EMAIL },
    });
    if (!user) {
        throw new Error(`User with email ${TEST_EMAIL} not found. Please create account first.`);
    }
    console.log('✅ User found:', user.id);
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);
    const updatedUser = await prisma.user.update({
        where: { email: TEST_EMAIL },
        data: {
            subscriptionPlan: 'pro',
            subscriptionStatus: 'active',
            datePaid: new Date(),
            trialEndsAt: trialEndsAt,
            credits: 100,
        },
    });
    console.log('✅ Pro plan granted!');
    console.log('Plan:', updatedUser.subscriptionPlan);
    console.log('Status:', updatedUser.subscriptionStatus);
    return {
        success: true,
        user: {
            email: updatedUser.email,
            plan: updatedUser.subscriptionPlan,
            status: updatedUser.subscriptionStatus,
            credits: updatedUser.credits,
        },
    };
}
//# sourceMappingURL=grantTestPro.js.map