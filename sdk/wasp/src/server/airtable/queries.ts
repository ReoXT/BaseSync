/**
 * Wasp queries for Airtable data access
 * These functions fetch data from Airtable on behalf of authenticated users
 */

import type { User, AirtableConnection } from 'wasp/entities';
import type {
  ListUserAirtableBases,
  GetAirtableTableSchema,
  GetAirtableBaseTables,
} from 'wasp/server/operations';
import { getAirtableAccessToken } from './auth';
import * as airtableClient from './client';

// ============================================================================
// Types
// ============================================================================

type ListUserAirtableBasesInput = void;
type ListUserAirtableBasesOutput = Array<{
  id: string;
  name: string;
  permissionLevel: string;
}>;

type GetAirtableTableSchemaInput = {
  baseId: string;
  tableId: string;
};
type GetAirtableTableSchemaOutput = {
  id: string;
  name: string;
  description?: string;
  primaryFieldId: string;
  fields: Array<{
    id: string;
    name: string;
    type: string;
    description?: string;
    options?: Record<string, any>;
  }>;
};

type GetAirtableBaseTablesInput = {
  baseId: string;
};
type GetAirtableBaseTablesOutput = Array<{
  id: string;
  name: string;
  description?: string;
  primaryFieldId: string;
}>;

// ============================================================================
// Query: List User's Airtable Bases
// ============================================================================

/**
 * Lists all Airtable bases accessible to the authenticated user
 * Automatically refreshes token if expired
 */
export const listUserAirtableBases: ListUserAirtableBases<
  ListUserAirtableBasesInput,
  ListUserAirtableBasesOutput
> = async (_args, context) => {
  if (!context.user) {
    throw new Error('User must be authenticated');
  }

  // Check if user has Airtable connection
  const connection = await context.entities.AirtableConnection.findUnique({
    where: { userId: context.user.id },
  });

  if (!connection) {
    throw new Error(
      'Airtable account not connected. Please connect your Airtable account first.'
    );
  }

  try {
    // Get access token (automatically refreshes if expired)
    const accessToken = await getAirtableAccessToken(
      context.user.id,
      context.entities.AirtableConnection as any
    );

    // Fetch bases from Airtable
    const bases = await airtableClient.listBases(accessToken);

    // Return simplified base data
    return bases.map((base) => ({
      id: base.id,
      name: base.name,
      permissionLevel: base.permissionLevel,
    }));
  } catch (error) {
    console.error('Failed to list Airtable bases:', error);

    // Provide user-friendly error messages
    if (error instanceof Error) {
      if (error.message.includes('refresh') || error.message.includes('token')) {
        throw new Error(
          'Your Airtable connection has expired. Please reconnect your Airtable account.'
        );
      }
      if (error.message.includes('AIRTABLE_CLIENT_ID')) {
        throw new Error('Airtable integration is not configured. Please contact support.');
      }
      throw new Error(`Failed to fetch Airtable bases: ${error.message}`);
    }

    throw new Error('Failed to fetch Airtable bases. Please try again.');
  }
};

// ============================================================================
// Query: Get Airtable Table Schema
// ============================================================================

/**
 * Gets the schema (fields) for a specific Airtable table
 * Automatically refreshes token if expired
 */
export const getAirtableTableSchema: GetAirtableTableSchema<
  GetAirtableTableSchemaInput,
  GetAirtableTableSchemaOutput
> = async (args, context) => {
  if (!context.user) {
    throw new Error('User must be authenticated');
  }

  const { baseId, tableId } = args;

  if (!baseId || !tableId) {
    throw new Error('Base ID and Table ID are required');
  }

  // Check if user has Airtable connection
  const connection = await context.entities.AirtableConnection.findUnique({
    where: { userId: context.user.id },
  });

  if (!connection) {
    throw new Error(
      'Airtable account not connected. Please connect your Airtable account first.'
    );
  }

  try {
    // Get access token (automatically refreshes if expired)
    const accessToken = await getAirtableAccessToken(
      context.user.id,
      context.entities.AirtableConnection as any
    );

    // Fetch base schema from Airtable
    const baseSchema = await airtableClient.getBaseSchema(accessToken, baseId);

    // Find the specific table
    const table = baseSchema.tables.find((t) => t.id === tableId);

    if (!table) {
      throw new Error(`Table with ID "${tableId}" not found in base "${baseId}"`);
    }

    // Return the table schema
    return {
      id: table.id,
      name: table.name,
      description: table.description,
      primaryFieldId: table.primaryFieldId,
      fields: table.fields.map((field) => ({
        id: field.id,
        name: field.name,
        type: field.type,
        description: field.description,
        options: field.options,
      })),
    };
  } catch (error) {
    console.error('Failed to get Airtable table schema:', error);

    // Provide user-friendly error messages
    if (error instanceof Error) {
      if (error.message.includes('refresh') || error.message.includes('token')) {
        throw new Error(
          'Your Airtable connection has expired. Please reconnect your Airtable account.'
        );
      }
      if (error.message.includes('not found')) {
        throw error; // Re-throw "not found" errors as-is
      }
      if (error.message.includes('AIRTABLE_CLIENT_ID')) {
        throw new Error('Airtable integration is not configured. Please contact support.');
      }
      throw new Error(`Failed to fetch table schema: ${error.message}`);
    }

    throw new Error('Failed to fetch table schema. Please try again.');
  }
};

// ============================================================================
// Query: Get Airtable Base Tables
// ============================================================================

/**
 * Gets the list of tables in a specific Airtable base
 * Automatically refreshes token if expired
 */
export const getAirtableBaseTables: GetAirtableBaseTables<
  GetAirtableBaseTablesInput,
  GetAirtableBaseTablesOutput
> = async (args, context) => {
  if (!context.user) {
    throw new Error('User must be authenticated');
  }

  const { baseId } = args;

  if (!baseId) {
    throw new Error('Base ID is required');
  }

  // Check if user has Airtable connection
  const connection = await context.entities.AirtableConnection.findUnique({
    where: { userId: context.user.id },
  });

  if (!connection) {
    throw new Error(
      'Airtable account not connected. Please connect your Airtable account first.'
    );
  }

  try {
    // Get access token (automatically refreshes if expired)
    const accessToken = await getAirtableAccessToken(
      context.user.id,
      context.entities.AirtableConnection as any
    );

    // Fetch base schema from Airtable
    const baseSchema = await airtableClient.getBaseSchema(accessToken, baseId);

    // Return simplified table data (without full field details)
    return baseSchema.tables.map((table) => ({
      id: table.id,
      name: table.name,
      description: table.description,
      primaryFieldId: table.primaryFieldId,
    }));
  } catch (error) {
    console.error('Failed to get Airtable base tables:', error);

    // Provide user-friendly error messages
    if (error instanceof Error) {
      if (error.message.includes('refresh') || error.message.includes('token')) {
        throw new Error(
          'Your Airtable connection has expired. Please reconnect your Airtable account.'
        );
      }
      if (error.message.includes('AIRTABLE_CLIENT_ID')) {
        throw new Error('Airtable integration is not configured. Please contact support.');
      }
      throw new Error(`Failed to fetch base tables: ${error.message}`);
    }

    throw new Error('Failed to fetch base tables. Please try again.');
  }
};
