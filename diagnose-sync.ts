/**
 * Diagnostic script to check sync status and connection health
 * Run with: npx ts-node diagnose-sync.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnoseSyncIssues() {
  console.log('='.repeat(80));
  console.log('SYNC DIAGNOSTICS');
  console.log('='.repeat(80));
  console.log('');

  // 1. Check all users with sync configs
  const users = await prisma.user.findMany({
    include: {
      syncConfigs: true,
      airtableConnections: true,
      googleSheetsConnections: true,
    },
  });

  for (const user of users) {
    console.log(`User: ${user.email || user.username || user.id}`);
    console.log(`  Sync Configs: ${user.syncConfigs.length}`);
    console.log(`  Airtable Connections: ${user.airtableConnections.length}`);
    console.log(`  Google Connections: ${user.googleSheetsConnections.length}`);
    console.log('');

    // Check Airtable connection status
    if (user.airtableConnections.length > 0) {
      const at = user.airtableConnections[0];
      console.log('  Airtable Connection:');
      console.log(`    Needs Reauth: ${at.needsReauth}`);
      console.log(`    Token Expiry: ${at.tokenExpiry}`);
      console.log(`    Last Refresh Attempt: ${at.lastRefreshAttempt}`);
      console.log(`    Last Refresh Error: ${at.lastRefreshError}`);
      console.log('');
    }

    // Check Google connection status
    if (user.googleSheetsConnections.length > 0) {
      const gs = user.googleSheetsConnections[0];
      console.log('  Google Sheets Connection:');
      console.log(`    Needs Reauth: ${gs.needsReauth}`);
      console.log(`    Token Expiry: ${gs.tokenExpiry}`);
      console.log(`    Last Refresh Attempt: ${gs.lastRefreshAttempt}`);
      console.log(`    Last Refresh Error: ${gs.lastRefreshError}`);
      console.log('');
    }

    // Check sync configs
    for (const config of user.syncConfigs) {
      console.log(`  Sync Config: ${config.name}`);
      console.log(`    ID: ${config.id}`);
      console.log(`    Direction: ${config.syncDirection}`);
      console.log(`    Active: ${config.isActive}`);
      console.log(`    Last Sync: ${config.lastSyncAt}`);
      console.log(`    Last Status: ${config.lastSyncStatus}`);
      console.log('');

      // Get recent sync logs
      const logs = await prisma.syncLog.findMany({
        where: { syncConfigId: config.id },
        orderBy: { startedAt: 'desc' },
        take: 3,
      });

      if (logs.length > 0) {
        console.log('    Recent Sync Logs:');
        for (const log of logs) {
          console.log(`      - ${log.startedAt.toISOString()}: ${log.status}`);
          console.log(`        Records: ${log.recordsSynced}, Failed: ${log.recordsFailed}`);
          if (log.errors) {
            console.log(`        Errors: ${log.errors}`);
          }
        }
        console.log('');
      }
    }
    console.log('-'.repeat(80));
  }

  await prisma.$disconnect();
}

diagnoseSyncIssues().catch(console.error);
