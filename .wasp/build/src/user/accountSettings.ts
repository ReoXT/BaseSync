import type { UpdateUsername, RequestEmailChange, ConfirmEmailChange, UpdateNotificationPreferences } from 'wasp/server/operations';
import { HttpError } from 'wasp/server';
import crypto from 'crypto';

// ============================================================================
// UPDATE USERNAME
// ============================================================================

type UpdateUsernameInput = {
  username: string;
};

export const updateUsername: UpdateUsername<UpdateUsernameInput, void> = async (
  { username },
  context
) => {
  if (!context.user) {
    throw new HttpError(401, 'Unauthorized');
  }

  // Validate username format
  if (!/^[a-zA-Z0-9_-]{3,30}$/.test(username)) {
    throw new HttpError(400, 'Username must be 3-30 characters and contain only letters, numbers, dashes, and underscores');
  }

  // Check if username is already taken
  const existingUser = await context.entities.User.findUnique({
    where: { username },
  });

  if (existingUser && existingUser.id !== context.user.id) {
    throw new HttpError(400, 'Username is already taken');
  }

  // Update username
  await context.entities.User.update({
    where: { id: context.user.id },
    data: { username },
  });
};

// ============================================================================
// REQUEST EMAIL CHANGE
// ============================================================================

type RequestEmailChangeInput = {
  newEmail: string;
};

export const requestEmailChange: RequestEmailChange<RequestEmailChangeInput, void> = async (
  { newEmail },
  context
) => {
  if (!context.user) {
    throw new HttpError(401, 'Unauthorized');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(newEmail)) {
    throw new HttpError(400, 'Invalid email format');
  }

  // Check if email is already in use
  const existingUser = await context.entities.User.findUnique({
    where: { email: newEmail },
  });

  if (existingUser && existingUser.id !== context.user.id) {
    throw new HttpError(400, 'Email is already in use');
  }

  // Generate verification token (32 bytes = 64 hex chars)
  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

  // Store pending email and token
  await context.entities.User.update({
    where: { id: context.user.id },
    data: {
      pendingEmail: newEmail,
      emailChangeToken: token,
      emailChangeTokenExpiry: expiry,
    },
  });

  // Send verification email
  const verificationLink = `${process.env.WASP_WEB_CLIENT_URL}/account/verify-email-change?token=${token}`;

  try {
    await context.entities.User.update({
      where: { id: context.user.id },
      data: {}, // Trigger to send email via emailSender
    });

    // TODO: Implement actual email sending
    // For now, log the verification link for development
    console.log('🔗 Email verification link:', verificationLink);
    console.log('📧 Send this to:', newEmail);

    // In production, use Wasp's email sender:
    // await emailSender.send({
    //   to: newEmail,
    //   subject: 'Verify your new email address',
    //   text: `Click this link to verify your new email: ${verificationLink}`,
    //   html: `<p>Click <a href="${verificationLink}">here</a> to verify your new email address.</p>`,
    // });

  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw new HttpError(500, 'Failed to send verification email');
  }
};

// ============================================================================
// CONFIRM EMAIL CHANGE
// ============================================================================

type ConfirmEmailChangeInput = {
  token: string;
};

export const confirmEmailChange: ConfirmEmailChange<ConfirmEmailChangeInput, { success: boolean; email?: string }> = async (
  { token },
  context
) => {
  if (!context.user) {
    throw new HttpError(401, 'Unauthorized');
  }

  // Find user with this token
  const user = await context.entities.User.findUnique({
    where: { id: context.user.id },
  });

  if (!user || !user.emailChangeToken || !user.emailChangeTokenExpiry || !user.pendingEmail) {
    throw new HttpError(400, 'Invalid or expired verification link');
  }

  // Verify token matches
  if (user.emailChangeToken !== token) {
    throw new HttpError(400, 'Invalid verification link');
  }

  // Check if token is expired
  if (new Date() > user.emailChangeTokenExpiry) {
    throw new HttpError(400, 'Verification link has expired. Please request a new email change.');
  }

  // Check if the pending email is still available
  const existingUser = await context.entities.User.findUnique({
    where: { email: user.pendingEmail },
  });

  if (existingUser && existingUser.id !== user.id) {
    throw new HttpError(400, 'This email address is no longer available');
  }

  // Update email and clear pending fields
  await context.entities.User.update({
    where: { id: user.id },
    data: {
      email: user.pendingEmail,
      pendingEmail: null,
      emailChangeToken: null,
      emailChangeTokenExpiry: null,
    },
  });

  return {
    success: true,
    email: user.pendingEmail,
  };
};

// ============================================================================
// UPDATE NOTIFICATION PREFERENCES
// ============================================================================

type UpdateNotificationPreferencesInput = {
  emailNotifications: boolean;
  syncFailureAlerts: boolean;
  weeklyDigest: boolean;
};

export const updateNotificationPreferences: UpdateNotificationPreferences<UpdateNotificationPreferencesInput, void> = async (
  { emailNotifications, syncFailureAlerts, weeklyDigest },
  context
) => {
  if (!context.user) {
    throw new HttpError(401, 'Unauthorized');
  }

  await context.entities.User.update({
    where: { id: context.user.id },
    data: {
      emailNotifications,
      syncFailureAlerts,
      weeklyDigest,
    },
  });
};
