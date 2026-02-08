import type { ChangePassword } from 'wasp/server/operations';
import { HttpError, prisma } from 'wasp/server';
import { hashPassword, verifyPassword } from 'wasp/auth/password';

// ============================================================================
// CHANGE PASSWORD
// ============================================================================

type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

export const changePassword: ChangePassword<ChangePasswordInput, void> = async (
  { currentPassword, newPassword },
  context
) => {
  if (!context.user) {
    throw new HttpError(401, 'Unauthorized');
  }

  // Validate new password strength
  if (newPassword.length < 8) {
    throw new HttpError(400, 'Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(newPassword)) {
    throw new HttpError(400, 'Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(newPassword)) {
    throw new HttpError(400, 'Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(newPassword)) {
    throw new HttpError(400, 'Password must contain at least one number');
  }

  // Get user with auth identities
  const user = await context.entities.User.findUnique({
    where: { id: context.user.id },
    include: {
      auth: {
        include: {
          identities: true,
        },
      },
    },
  });

  if (!user || !user.auth) {
    throw new HttpError(404, 'User not found');
  }

  // Find email identity
  const emailIdentity = user.auth.identities.find(
    (identity: any) => identity.providerName === 'email'
  );

  if (!emailIdentity) {
    throw new HttpError(400, 'Email authentication not set up for this account');
  }

  // Validate that we have a stored password hash
  if (!emailIdentity.providerUserId || emailIdentity.providerUserId.trim() === '') {
    console.error('❌ Missing password hash for user:', user.id);
    throw new HttpError(500, 'Password data is missing. Please try resetting your password instead.');
  }

  console.log('🔐 Password change attempt for user:', user.id);

  // Import Wasp's password utilities and Prisma client
  let hashedNewPassword: string;

  try {
    // verifyPassword expects (hashedPassword, plainPassword)
    // emailIdentity.providerUserId contains the hashed password
    await verifyPassword(
      emailIdentity.providerUserId,
      currentPassword
    );

    // Hash new password
    hashedNewPassword = await hashPassword(newPassword);
  } catch (error: any) {
    console.error('Password operation failed:', error);
    // Check for specific error messages
    if (error.message?.includes('Invalid password') || error.message?.includes('does not match')) {
      throw new HttpError(400, 'Current password is incorrect');
    }
    if (error.code === 'InvalidArg' || error.message?.includes('missing field')) {
      throw new HttpError(500, 'Password verification error. Please contact support.');
    }
    throw new HttpError(500, 'Password management failed');
  }

  // Update password in AuthIdentity using the composite key
  // AuthIdentity uses @@id([providerName, providerUserId]) so we need direct Prisma access
  await prisma.authIdentity.updateMany({
    where: {
      providerName: 'email',
      authId: user.auth.id,
    },
    data: {
      providerUserId: hashedNewPassword,
    },
  });

  // TODO: Send email notification about password change
  // This would require implementing an email service
  // For now, log the change
  console.log(`✅ Password changed for user ${user.id} (${user.email})`);

  // Note: Wasp doesn't currently support session invalidation
  // In a production app, you might want to:
  // 1. Invalidate all other sessions (force re-login on other devices)
  // 2. Send email notification about password change
};
