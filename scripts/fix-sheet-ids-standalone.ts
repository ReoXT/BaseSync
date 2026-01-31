/**
 * Data Migration Script: Fix Google Sheet IDs (Standalone)
 *
 * Problem: Existing SyncConfigs have numeric gids (e.g., "0") stored in googleSheetId
 * Solution: Fetch the actual sheet name from Google Sheets API and update the database
 *
 * Usage:
 *   1. Make sure .env.server is loaded
 *   2. Run: npx tsx scripts/fix-sheet-ids-standalone.ts
 */

import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.server') });

const prisma = new PrismaClient();

// Decrypt token using the same method as tokenManager
function decryptToken(encryptedToken: string): string {
  const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY not set in environment');
  }

  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const parts = encryptedToken.split(':');

  if (parts.length !== 2) {
    throw new Error('Invalid encrypted token format');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = Buffer.from(parts[1], 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
}

// Fetch spreadsheet metadata from Google Sheets API
async function getSpreadsheet(accessToken: string, spreadsheetId: string) {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google API error: ${response.status} - ${error}`);
  }

  return response.json();
}

async function fixSheetIds() {
  console.log('🔧 Starting Google Sheet ID migration...\n');

  try {
    // Fetch all sync configs
    const syncConfigs = await prisma.syncConfig.findMany({
      include: {
        user: {
          include: {
            googleSheetsConnections: true,
          },
        },
      },
    });

    console.log(`📊 Found ${syncConfigs.length} sync configuration(s)\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const config of syncConfigs) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`Processing: ${config.name} (${config.id})`);
      console.log(`Current googleSheetId: "${config.googleSheetId}"`);

      // Check if it's already a valid sheet name (contains letters)
      if (/[a-zA-Z]/.test(config.googleSheetId)) {
        console.log(`✓ Already looks like a sheet name, skipping`);
        skipped++;
        continue;
      }

      // Check if user has Google connection
      const googleConnection = config.user.googleSheetsConnections?.[0];
      if (!googleConnection) {
        console.log(`⚠️  No Google Sheets connection found for user, skipping`);
        skipped++;
        continue;
      }

      try {
        // Decrypt the access token
        const accessToken = decryptToken(googleConnection.accessToken);

        // Fetch spreadsheet metadata to get sheet name
        const spreadsheet = await getSpreadsheet(accessToken, config.googleSpreadsheetId);

        // Try to find the sheet by gid
        const numericSheetId = parseInt(config.googleSheetId, 10);
        const sheet = spreadsheet.sheets.find((s: any) => s.properties.sheetId === numericSheetId);

        if (!sheet) {
          console.log(`❌ Could not find sheet with gid ${numericSheetId} in spreadsheet`);
          console.log(`   Available sheets:`, spreadsheet.sheets.map((s: any) => `${s.properties.title} (gid: ${s.properties.sheetId})`));

          // Try using the first sheet as fallback
          if (spreadsheet.sheets.length > 0) {
            const firstSheet = spreadsheet.sheets[0];
            const sheetName = firstSheet.properties.title;
            console.log(`   Using first sheet as fallback: "${sheetName}"`);

            await prisma.syncConfig.update({
              where: { id: config.id },
              data: { googleSheetId: sheetName },
            });

            console.log(`✓ Updated googleSheetId to: "${sheetName}"`);
            updated++;
          } else {
            errors++;
          }
          continue;
        }

        const sheetName = sheet.properties.title;
        console.log(`✓ Found sheet name: "${sheetName}"`);

        // Update the database
        await prisma.syncConfig.update({
          where: { id: config.id },
          data: { googleSheetId: sheetName },
        });

        console.log(`✓ Updated googleSheetId to: "${sheetName}"`);
        updated++;

      } catch (error) {
        console.error(`❌ Error processing config:`, error instanceof Error ? error.message : error);
        errors++;
      }
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log('\n📊 Migration Summary:');
    console.log(`   ✓ Updated: ${updated}`);
    console.log(`   ⊘ Skipped: ${skipped}`);
    console.log(`   ✗ Errors: ${errors}`);
    console.log(`   📋 Total: ${syncConfigs.length}`);
    console.log('');

    if (errors > 0) {
      console.log('⚠️  Some configurations failed to migrate. Review the errors above.');
    } else if (updated > 0) {
      console.log('✓ Migration completed successfully!');
    } else {
      console.log('✓ No updates needed - all configurations already use sheet names.');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
fixSheetIds()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
