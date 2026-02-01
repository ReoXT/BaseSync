/**
 * Test script to verify dropdown validation is working
 * Run this with: npx tsx test-dropdown-validation.ts
 */

import { batchSetDropdownValidations, type DropdownValidationOptions } from './src/server/google/client';

async function testDropdownValidation() {
  console.log('🧪 Testing Dropdown Validation Feature\n');

  // YOU NEED TO PROVIDE THESE VALUES:
  const SHEETS_ACCESS_TOKEN = 'YOUR_ACCESS_TOKEN_HERE'; // Get from OAuth flow
  const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // From the Sheets URL
  const SHEET_NAME = 'Sheet1'; // Or sheet ID number

  if (SHEETS_ACCESS_TOKEN === 'YOUR_ACCESS_TOKEN_HERE') {
    console.error('❌ Please set your access token and spreadsheet ID in the script first!');
    console.log('\nHow to get these values:');
    console.log('1. Access token: Complete OAuth flow and copy the token');
    console.log('2. Spreadsheet ID: From the URL: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit');
    process.exit(1);
  }

  // Test validation configuration
  const validations: DropdownValidationOptions[] = [
    {
      columnIndex: 1, // Column B (0 = A, 1 = B, etc.)
      choices: ['Todo', 'In Progress', 'Done'],
      startRow: 2, // Start at row 2 (skip header)
      showDropdown: true,
      strict: true, // Single select - must be one of the choices
    },
    {
      columnIndex: 2, // Column C
      choices: ['Bug', 'Feature', 'Enhancement'],
      startRow: 2,
      showDropdown: true,
      strict: false, // Multi select - allows comma-separated
    },
  ];

  console.log('📋 Test Configuration:');
  console.log(`  Spreadsheet ID: ${SPREADSHEET_ID}`);
  console.log(`  Sheet: ${SHEET_NAME}`);
  console.log(`  Validations to apply: ${validations.length}`);
  console.log('');

  validations.forEach((v, i) => {
    const columnLetter = String.fromCharCode(65 + v.columnIndex);
    console.log(`  ${i + 1}. Column ${columnLetter}:`);
    console.log(`     Choices: ${v.choices.join(', ')}`);
    console.log(`     Type: ${v.strict ? 'Single Select' : 'Multi Select'}`);
  });

  console.log('\n🚀 Applying validations...\n');

  try {
    await batchSetDropdownValidations(
      SHEETS_ACCESS_TOKEN,
      SPREADSHEET_ID,
      SHEET_NAME,
      validations
    );

    console.log('✅ SUCCESS! Dropdown validations applied.\n');
    console.log('📝 Next steps:');
    console.log('1. Open your Google Sheet');
    console.log('2. Click on a cell in column B (Status)');
    console.log('3. You should see a dropdown menu with: Todo, In Progress, Done');
    console.log('4. Try typing an invalid value - it should be rejected');
    console.log('5. Check column C for the multi-select dropdown');
  } catch (error) {
    console.error('❌ ERROR:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
  }
}

// Run the test
testDropdownValidation().catch(console.error);
