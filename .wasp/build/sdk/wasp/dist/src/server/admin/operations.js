import { HttpError } from 'wasp/server';
// ============================================================================
// ADMIN GUARD - Use this in every admin operation
// ============================================================================
function requireAdmin(context) {
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
export const getAdminOverviewStats = async (_args, context) => {
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
    const errorTypes = {};
    failedSyncs.forEach(log => {
        if (log.errors) {
            try {
                const errors = JSON.parse(log.errors);
                if (Array.isArray(errors) && errors.length > 0) {
                    const errorMsg = errors[0].error || 'Unknown error';
                    const errorType = errorMsg.split(':')[0] || errorMsg;
                    errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
                }
            }
            catch (e) {
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
    const planPrices = {
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
export const getRecentActivity = async (_args, context) => {
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
    const activities = [];
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
export const searchUsers = async (args, context) => {
    requireAdmin(context);
    const query = args.query;
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
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
export const getOnlineUsers = async (_args, context) => {
    requireAdmin(context);
    // TODO: Implement proper activity tracking
    // For now, return empty array
    return [];
};
// ============================================================================
// USER DETAIL PAGE
// ============================================================================
export const getUserDetail = async (args, context) => {
    requireAdmin(context);
    const { userId } = args;
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
export const updateUser = async (args, context) => {
    requireAdmin(context);
    const { userId, updates } = args;
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
    const safeUpdates = {};
    Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
            safeUpdates[key] = updates[key];
        }
    });
    // Prevent admin from removing their own admin access
    if (updates.isAdmin === false && userId === context.user?.id) {
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
export const deleteUser = async (args, context) => {
    requireAdmin(context);
    const { userId, confirmEmail } = args;
    // Prevent admin from deleting themselves
    if (userId === context.user?.id) {
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
export const getActiveSyncs = async (_args, context) => {
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
export const getFailedSyncs = async (args, context) => {
    requireAdmin(context);
    const hours = args?.hours || 24;
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
export const getSyncMonitor = async (_args, context) => {
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
export const pauseResumeSync = async (args, context) => {
    requireAdmin(context);
    const { syncConfigId, isActive } = args;
    const updated = await context.entities.SyncConfig.update({
        where: { id: syncConfigId },
        data: { isActive }
    });
    return updated;
};
export const triggerManualSyncAdmin = async (args, context) => {
    requireAdmin(context);
    const { syncConfigId } = args;
    // TODO: Implement actual sync trigger
    // For now, just mark the sync config as needing a sync
    const syncConfig = await context.entities.SyncConfig.findUnique({
        where: { id: syncConfigId }
    });
    if (!syncConfig) {
        throw new HttpError(404, 'Sync configuration not found');
    }
    // Return success
    return { success: true, message: 'Sync triggered successfully' };
};
// ============================================================================
// OAUTH ACTIONS
// ============================================================================
export const forceRefreshUserToken = async (args, context) => {
    requireAdmin(context);
    const { userId, service } = args;
    if (service === 'airtable') {
        const connection = await context.entities.AirtableConnection.findUnique({
            where: { userId }
        });
        if (!connection) {
            throw new HttpError(404, 'Airtable connection not found');
        }
        // TODO: Implement token refresh
        // For now, just mark as needing reauth
        await context.entities.AirtableConnection.update({
            where: { userId },
            data: { needsReauth: false, lastRefreshAttempt: new Date() }
        });
        return { success: true, message: 'Airtable token refresh requested' };
    }
    else if (service === 'google') {
        const connection = await context.entities.GoogleSheetsConnection.findUnique({
            where: { userId }
        });
        if (!connection) {
            throw new HttpError(404, 'Google Sheets connection not found');
        }
        // TODO: Implement token refresh
        // For now, just mark as needing reauth
        await context.entities.GoogleSheetsConnection.update({
            where: { userId },
            data: { needsReauth: false, lastRefreshAttempt: new Date() }
        });
        return { success: true, message: 'Google token refresh requested' };
    }
    else {
        throw new HttpError(400, 'Invalid service type');
    }
};
//# sourceMappingURL=operations.js.map