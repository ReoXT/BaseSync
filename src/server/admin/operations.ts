import { HttpError } from 'wasp/server';
import type { GetAdminOverviewStats, GetUserDetail, GetActiveSyncs, GetFailedSyncs, UpdateUser, DeleteUser, GetSyncMonitor, ForceRefreshUserToken, PauseResumeSync, TriggerManualSyncAdmin, GetRecentActivity, SearchUsers, GetOnlineUsers } from 'wasp/server/operations';

// ============================================================================
// ADMIN GUARD - Use this in every admin operation
// ============================================================================
function requireAdmin(context: any) {
  if (!context.user) {
    throw new HttpError(401, 'Authentication required');
  }
  if (!context.user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }
}

// ============================================================================
// OVERVIEW PAGE - Stats and alerts
// ============================================================================

export const getAdminOverviewStats: GetAdminOverviewStats = async (_args, context) => {
  requireAdmin(context);

  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Users online (active in last 5 minutes)
  // Note: You'll need to track last activity somehow. For now, we'll use a simple approach.
  const totalUsers = await context.entities.User.count();
  const paidUsers = await context.entities.User.count({
    where: {
      subscriptionStatus: {
        in: ['active', 'past_due']
      }
    }
  });

  // Active syncs (SyncLogs with status in progress or started recently)
  const activeSyncs = await context.entities.SyncLog.findMany({
    where: {
      startedAt: { gte: fiveMinutesAgo },
      completedAt: null
    },
    include: {
      syncConfig: {
        include: {
          user: {
            select: {
              email: true,
              username: true
            }
          }
        }
      }
    },
    take: 10
  });

  // Syncs completed today
  const todayStart = new Date(now.setHours(0, 0, 0, 0));
  const syncsCompletedToday = await context.entities.SyncLog.count({
    where: {
      completedAt: { gte: todayStart },
      status: 'SUCCESS'
    }
  });

  // Failed syncs in last 24h
  const failedSyncs = await context.entities.SyncLog.findMany({
    where: {
      startedAt: { gte: oneDayAgo },
      status: 'FAILED'
    },
    include: {
      syncConfig: {
        include: {
          user: {
            select: {
              email: true,
              username: true
            }
          }
        }
      }
    }
  });

  // Count unique users affected
  const uniqueFailedUsers = new Set(failedSyncs.map(log => log.syncConfig.userId)).size;

  // Group errors by type
  const errorTypes: Record<string, number> = {};
  failedSyncs.forEach(log => {
    if (log.errors) {
      try {
        const errors = JSON.parse(log.errors);
        if (Array.isArray(errors) && errors.length > 0) {
          const errorMsg = errors[0].error || 'Unknown error';
          const errorType = errorMsg.split(':')[0] || errorMsg;
          errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
        }
      } catch (e) {
        errorTypes['Parse error'] = (errorTypes['Parse error'] || 0) + 1;
      }
    }
  });

  // Users needing OAuth reauth
  const needsReauthAirtable = await context.entities.AirtableConnection.count({
    where: { needsReauth: true }
  });
  const needsReauthGoogle = await context.entities.GoogleSheetsConnection.count({
    where: { needsReauth: true }
  });

  // Trial users expiring soon (3 days)
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const trialExpiringUsers = await context.entities.User.count({
    where: {
      trialEndsAt: {
        lte: threeDaysFromNow,
        gte: now
      },
      subscriptionStatus: null
    }
  });

  // Revenue this month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const paidUsersThisMonth = await context.entities.User.count({
    where: {
      datePaid: { gte: monthStart },
      subscriptionStatus: 'active'
    }
  });

  // Calculate MRR (rough estimate based on subscription plans)
  const usersByPlan = await context.entities.User.groupBy({
    by: ['subscriptionPlan'],
    where: {
      subscriptionStatus: 'active'
    },
    _count: true
  });

  const planPrices: Record<string, number> = {
    starter: 9,
    pro: 19,
    business: 39
  };

  let mrr = 0;
  usersByPlan.forEach(group => {
    if (group.subscriptionPlan && planPrices[group.subscriptionPlan]) {
      mrr += planPrices[group.subscriptionPlan] * group._count;
    }
  });

  return {
    users: {
      total: totalUsers,
      paid: paidUsers,
      online: 0 // TODO: Implement activity tracking
    },
    syncs: {
      active: activeSyncs.map(log => ({
        id: log.id,
        userEmail: log.syncConfig.user.email,
        syncName: log.syncConfig.name,
        startedAt: log.startedAt
      })),
      completedToday: syncsCompletedToday,
      failedCount: failedSyncs.length,
      uniqueFailedUsers
    },
    alerts: {
      failedSyncs: failedSyncs.length,
      needsReauth: needsReauthAirtable + needsReauthGoogle,
      trialExpiringSoon: trialExpiringUsers,
      errorTypes: Object.entries(errorTypes).map(([type, count]) => ({ type, count }))
    },
    revenue: {
      mrr,
      newSubscriptionsThisMonth: paidUsersThisMonth
    }
  };
};

// ============================================================================
// RECENT ACTIVITY FEED
// ============================================================================

export const getRecentActivity: GetRecentActivity = async (_args, context) => {
  requireAdmin(context);

  // Get recent sync logs and user activities
  const recentSyncLogs = await context.entities.SyncLog.findMany({
    take: 20,
    orderBy: { startedAt: 'desc' },
    include: {
      syncConfig: {
        include: {
          user: {
            select: {
              email: true,
              username: true
            }
          }
        }
      }
    }
  });

  // Get recent user signups
  const recentSignups = await context.entities.User.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      createdAt: true,
      subscriptionStatus: true
    }
  });

  // Combine and sort activities
  const activities: any[] = [];

  recentSyncLogs.forEach(log => {
    activities.push({
      type: log.status === 'FAILED' ? 'sync_failed' : 'sync_completed',
      timestamp: log.startedAt,
      userEmail: log.syncConfig.user.email || 'Unknown',
      userId: log.syncConfig.userId,
      description: `${log.syncConfig.name} - ${log.recordsSynced} records`,
      metadata: {
        syncId: log.syncConfig.id,
        status: log.status
      }
    });
  });

  recentSignups.forEach(user => {
    activities.push({
      type: 'user_signup',
      timestamp: user.createdAt,
      userEmail: user.email || 'Unknown',
      userId: user.id,
      description: user.subscriptionStatus ? 'Signed up (Paid)' : 'Signed up (Trial)',
      metadata: {}
    });
  });

  // Sort by timestamp descending
  activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return activities.slice(0, 20);
};

// ============================================================================
// USER SEARCH
// ============================================================================

export const searchUsers: SearchUsers = async ({ query }, context) => {
  requireAdmin(context);

  if (!query || query.trim().length === 0) {
    return [];
  }

  const users = await context.entities.User.findMany({
    where: {
      OR: [
        { email: { contains: query, mode: 'insensitive' } },
        { username: { contains: query, mode: 'insensitive' } }
      ]
    },
    take: 10,
    select: {
      id: true,
      email: true,
      username: true,
      subscriptionStatus: true,
      subscriptionPlan: true
    }
  });

  return users;
};

// ============================================================================
// ONLINE USERS
// ============================================================================

export const getOnlineUsers: GetOnlineUsers = async (_args, context) => {
  requireAdmin(context);

  // TODO: Implement proper activity tracking
  // For now, return empty array
  return [];
};

// ============================================================================
// USER DETAIL PAGE
// ============================================================================

export const getUserDetail: GetUserDetail = async ({ userId }, context) => {
  requireAdmin(context);

  const user = await context.entities.User.findUnique({
    where: { id: userId },
    include: {
      airtableConnections: true,
      googleSheetsConnections: true,
      syncConfigs: {
        include: {
          syncLogs: {
            orderBy: { startedAt: 'desc' },
            take: 10
          }
        }
      },
      usageStats: {
        orderBy: { month: 'desc' },
        take: 3
      }
    }
  });

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  return user;
};

// ============================================================================
// UPDATE USER
// ============================================================================

export const updateUser: UpdateUser = async ({ userId, updates }, context) => {
  requireAdmin(context);

  // Validate updates - only allow safe fields
  const allowedFields = [
    'email',
    'username',
    'subscriptionStatus',
    'subscriptionPlan',
    'credits',
    'isAdmin',
    'trialEndsAt',
    'emailNotifications',
    'syncFailureAlerts',
    'weeklyDigest'
  ];

  const safeUpdates: any = {};
  Object.keys(updates).forEach(key => {
    if (allowedFields.includes(key)) {
      safeUpdates[key] = updates[key];
    }
  });

  // Prevent admin from removing their own admin access
  if (updates.isAdmin === false && userId === context.user.id) {
    throw new HttpError(400, 'Cannot remove your own admin access');
  }

  const updatedUser = await context.entities.User.update({
    where: { id: userId },
    data: safeUpdates
  });

  return updatedUser;
};

// ============================================================================
// DELETE USER
// ============================================================================

export const deleteUser: DeleteUser = async ({ userId, confirmEmail }, context) => {
  requireAdmin(context);

  // Prevent admin from deleting themselves
  if (userId === context.user.id) {
    throw new HttpError(400, 'Cannot delete your own account');
  }

  // Get user to verify email
  const user = await context.entities.User.findUnique({
    where: { id: userId },
    select: { email: true }
  });

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  if (user.email !== confirmEmail) {
    throw new HttpError(400, 'Email confirmation does not match');
  }

  // Delete user (cascade will handle related records)
  await context.entities.User.delete({
    where: { id: userId }
  });

  return { success: true };
};

// ============================================================================
// SYNC MONITOR
// ============================================================================

export const getActiveSyncs: GetActiveSyncs = async (_args, context) => {
  requireAdmin(context);

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const syncs = await context.entities.SyncLog.findMany({
    where: {
      startedAt: { gte: fiveMinutesAgo },
      completedAt: null
    },
    include: {
      syncConfig: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true
            }
          }
        }
      }
    },
    orderBy: { startedAt: 'desc' }
  });

  return syncs;
};

export const getFailedSyncs: GetFailedSyncs = async ({ hours = 24 }, context) => {
  requireAdmin(context);

  const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

  const syncs = await context.entities.SyncLog.findMany({
    where: {
      startedAt: { gte: cutoffTime },
      status: 'FAILED'
    },
    include: {
      syncConfig: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true
            }
          }
        }
      }
    },
    orderBy: { startedAt: 'desc' }
  });

  return syncs;
};

export const getSyncMonitor: GetSyncMonitor = async (_args, context) => {
  requireAdmin(context);

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [active, recentCompleted, failed] = await Promise.all([
    context.entities.SyncLog.findMany({
      where: {
        completedAt: null
      },
      include: {
        syncConfig: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true
              }
            }
          }
        }
      },
      orderBy: { startedAt: 'desc' },
      take: 50
    }),
    context.entities.SyncLog.findMany({
      where: {
        completedAt: { gte: oneHourAgo },
        status: 'SUCCESS'
      },
      include: {
        syncConfig: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true
              }
            }
          }
        }
      },
      orderBy: { completedAt: 'desc' },
      take: 50
    }),
    context.entities.SyncLog.findMany({
      where: {
        startedAt: { gte: oneDayAgo },
        status: 'FAILED'
      },
      include: {
        syncConfig: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true
              }
            }
          }
        }
      },
      orderBy: { startedAt: 'desc' },
      take: 100
    })
  ]);

  return {
    active,
    recentCompleted,
    failed
  };
};

// ============================================================================
// SYNC ACTIONS
// ============================================================================

export const pauseResumeSync: PauseResumeSync = async ({ syncConfigId, isActive }, context) => {
  requireAdmin(context);

  const updated = await context.entities.SyncConfig.update({
    where: { id: syncConfigId },
    data: { isActive }
  });

  return updated;
};

export const triggerManualSyncAdmin: TriggerManualSyncAdmin = async ({ syncConfigId }, context) => {
  requireAdmin(context);

  // Import the sync function
  const { performManualSync } = await import('../sync/operations');

  // Get the sync config to find the user
  const syncConfig = await context.entities.SyncConfig.findUnique({
    where: { id: syncConfigId },
    include: { user: true }
  });

  if (!syncConfig) {
    throw new HttpError(404, 'Sync configuration not found');
  }

  // Call the manual sync with admin override
  const result = await performManualSync({ syncConfigId }, { ...context, user: syncConfig.user });

  return result;
};

// ============================================================================
// OAUTH ACTIONS
// ============================================================================

export const forceRefreshUserToken: ForceRefreshUserToken = async ({ userId, service }, context) => {
  requireAdmin(context);

  if (service === 'airtable') {
    const connection = await context.entities.AirtableConnection.findUnique({
      where: { userId }
    });

    if (!connection) {
      throw new HttpError(404, 'Airtable connection not found');
    }

    // Import token refresh function
    const { refreshAirtableToken } = await import('../airtable/auth');

    try {
      await refreshAirtableToken(connection, context);
      return { success: true, message: 'Airtable token refreshed successfully' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  } else if (service === 'google') {
    const connection = await context.entities.GoogleSheetsConnection.findUnique({
      where: { userId }
    });

    if (!connection) {
      throw new HttpError(404, 'Google Sheets connection not found');
    }

    // Import token refresh function
    const { refreshGoogleToken } = await import('../google/auth');

    try {
      await refreshGoogleToken(connection, context);
      return { success: true, message: 'Google token refreshed successfully' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  } else {
    throw new HttpError(400, 'Invalid service type');
  }
};
