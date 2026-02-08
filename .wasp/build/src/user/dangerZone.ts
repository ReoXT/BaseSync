import type { ExportUserData, DeleteAccount } from 'wasp/server/operations';
import { HttpError } from 'wasp/server';
import { verifyPassword } from 'wasp/auth/password';
import { stripeClient } from '../payment/stripe/stripeClient';

// ============================================================================
// EXPORT USER DATA (GDPR Compliance)
// ============================================================================

export const exportUserData: ExportUserData<void, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Unauthorized');
  }

  // Fetch all user data
  const user = await context.entities.User.findUnique({
    where: { id: context.user.id },
    include: {
      airtableConnections: {
        select: {
          id: true,
          createdAt: true,
          accountId: true,
          needsReauth: true,
          // Exclude encrypted tokens
        },
      },
      googleSheetsConnections: {
        select: {
          id: true,
          createdAt: true,
          googleAccountEmail: true,
          needsReauth: true,
          // Exclude encrypted tokens
        },
      },
      syncConfigs: {
        select: {
          id: true,
          name: true,
          airtableBaseId: true,
          airtableTableName: true,
          googleSpreadsheetId: true,
          googleSheetName: true,
          syncDirection: true,
          conflictResolution: true,
          isActive: true,
          lastSyncAt: true,
          lastSyncStatus: true,
          createdAt: true,
          updatedAt: true,
          syncLogs: {
            take: 100, // Last 100 sync logs
            orderBy: {
              createdAt: 'desc',
            },
            select: {
              id: true,
              status: true,
              recordsSynced: true,
              recordsFailed: true,
              startedAt: true,
              completedAt: true,
              triggeredBy: true,
            },
          },
        },
      },
      usageStats: true,
    },
  });

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  // Flatten sync logs from all sync configs
  const allSyncLogs = user.syncConfigs.flatMap(config =>
    config.syncLogs.map(log => ({
      ...log,
      syncConfigName: config.name,
      syncConfigId: config.id,
    }))
  );

  // Format data for export
  const exportData = {
    exportedAt: new Date().toISOString(),
    profile: {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
      isAdmin: user.isAdmin,
    },
    subscription: {
      plan: user.subscriptionPlan,
      status: user.subscriptionStatus,
      credits: user.credits,
      datePaid: user.datePaid,
      trialStartedAt: user.trialStartedAt,
      trialEndsAt: user.trialEndsAt,
    },
    notifications: {
      emailNotifications: user.emailNotifications,
      syncFailureAlerts: user.syncFailureAlerts,
      weeklyDigest: user.weeklyDigest,
    },
    connections: {
      airtable: user.airtableConnections.map(conn => ({
        id: conn.id,
        connectedAt: conn.createdAt,
        accountId: conn.accountId,
        needsReauth: conn.needsReauth,
      })),
      googleSheets: user.googleSheetsConnections.map(conn => ({
        id: conn.id,
        connectedAt: conn.createdAt,
        googleAccountEmail: conn.googleAccountEmail,
        needsReauth: conn.needsReauth,
      })),
    },
    syncConfigurations: user.syncConfigs.map(({ syncLogs, ...config }) => config),
    syncHistory: allSyncLogs,
    usageStatistics: user.usageStats,
  };

  return exportData;
};

// ============================================================================
// DELETE ACCOUNT
// ============================================================================

type DeleteAccountInput = {
  confirmationText: string;
  password: string;
};

export const deleteAccount: DeleteAccount<DeleteAccountInput, void> = async (
  { confirmationText, password },
  context
) => {
  if (!context.user) {
    throw new HttpError(401, 'Unauthorized');
  }

  // Verify confirmation text
  if (confirmationText !== 'DELETE MY ACCOUNT') {
    throw new HttpError(400, 'Confirmation text does not match. Please type exactly: DELETE MY ACCOUNT');
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

  // Verify password
  try {
    // verifyPassword throws if password is invalid, so if it doesn't throw, password is valid
    await verifyPassword(
      emailIdentity.providerUserId,
      password
    );
  } catch (error) {
    console.error('Password verification failed:', error);
    throw new HttpError(400, 'Incorrect password');
  }

  // Cancel Stripe subscription if active
  if (user.subscriptionStatus === 'active' && user.paymentProcessorUserId) {
    try {
      // Get customer's subscriptions
      const subscriptions = await stripeClient.subscriptions.list({
        customer: user.paymentProcessorUserId,
        status: 'active',
      });

      // Cancel all active subscriptions
      for (const subscription of subscriptions.data) {
        await stripeClient.subscriptions.cancel(subscription.id);
        console.log(`✅ Cancelled subscription ${subscription.id} for user ${user.id}`);
      }
    } catch (error) {
      console.error('Failed to cancel Stripe subscription:', error);
      // Don't block account deletion if Stripe cancellation fails
      // The subscription will remain but user data will be deleted
    }
  }

  // TODO: Send goodbye email
  console.log(`👋 Account deletion requested for ${user.email}`);

  // Delete user (Prisma will cascade delete all related records)
  await context.entities.User.delete({
    where: { id: user.id },
  });

  console.log(`🗑️ User ${user.id} deleted successfully`);

  // Note: After this, the user's session will be invalid
  // The frontend should handle logout and redirect
};
