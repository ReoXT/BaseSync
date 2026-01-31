/**
 * Typed Airtable API Client
 * Handles API requests to Airtable with rate limiting and proper error handling
 * API Documentation: https://airtable.com/developers/web/api/introduction
 */

// ============================================================================
// Types - Airtable Field Types
// ============================================================================

export type AirtableFieldType =
  | 'singleLineText'
  | 'multilineText'
  | 'richText'
  | 'email'
  | 'emailAddress' // Alternative email field type name
  | 'url'
  | 'phoneNumber'
  | 'phone' // Alternative phone field type name
  | 'number'
  | 'currency'
  | 'percent'
  | 'duration'
  | 'rating'
  | 'checkbox'
  | 'date'
  | 'dateTime'
  | 'singleSelect'
  | 'multipleSelects'
  | 'singleCollaborator'
  | 'multipleCollaborators'
  | 'multipleRecordLinks'
  | 'barcode'
  | 'button'
  | 'count'
  | 'createdBy'
  | 'createdTime'
  | 'lastModifiedBy'
  | 'lastModifiedTime'
  | 'multipleAttachments'
  | 'autoNumber'
  | 'formula'
  | 'rollup'
  | 'multipleLookupValues';

export interface AirtableAttachment {
  id: string;
  url: string;
  filename: string;
  size: number;
  type: string;
  width?: number;
  height?: number;
  thumbnails?: {
    small?: { url: string; width: number; height: number };
    large?: { url: string; width: number; height: number };
    full?: { url: string; width: number; height: number };
  };
}

export interface AirtableCollaborator {
  id: string;
  email: string;
  name?: string;
}

export type AirtableFieldValue =
  | string
  | number
  | boolean
  | string[] // multipleSelects
  | AirtableAttachment[]
  | AirtableCollaborator[]
  | { id: string }[] // linked records
  | Date
  | null;

export interface AirtableRecord {
  id: string;
  createdTime: string;
  fields: Record<string, AirtableFieldValue>;
}

export interface AirtableField {
  id: string;
  name: string;
  type: AirtableFieldType;
  description?: string;
  options?: {
    choices?: Array<{ id: string; name: string; color?: string }>;
    linkedTableId?: string;
    isReversed?: boolean;
    prefersSingleRecordLink?: boolean;
    inverseLinkFieldId?: string;
    result?: { type: string; options?: unknown };
    [key: string]: unknown;
  };
}

export interface AirtableTable {
  id: string;
  name: string;
  description?: string;
  primaryFieldId: string;
  fields: AirtableField[];
}

export interface AirtableBase {
  id: string;
  name: string;
  permissionLevel: 'none' | 'read' | 'comment' | 'edit' | 'create';
}

export interface AirtableBaseSchema {
  tables: AirtableTable[];
}

// ============================================================================
// API Response Types
// ============================================================================

interface ListBasesResponse {
  bases: AirtableBase[];
  offset?: string;
}

interface ListRecordsResponse {
  records: AirtableRecord[];
  offset?: string;
}

interface CreateRecordsResponse {
  records: AirtableRecord[];
  createdTime?: string;
}

interface UpdateRecordsResponse {
  records: AirtableRecord[];
}

interface DeleteRecordsResponse {
  records: Array<{
    id: string;
    deleted: boolean;
  }>;
}

// ============================================================================
// Options Types
// ============================================================================

export interface ListRecordsOptions {
  fields?: string[]; // Specific fields to return
  filterByFormula?: string; // Airtable formula to filter records
  maxRecords?: number; // Maximum total records to return
  pageSize?: number; // Number of records per page (max 100)
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  view?: string; // Name or ID of a view
  cellFormat?: 'json' | 'string'; // Default: json
  timeZone?: string; // e.g., 'America/Los_Angeles'
  userLocale?: string; // e.g., 'en-us'
  offset?: string; // For pagination
}

export interface CreateRecordData {
  fields: Record<string, AirtableFieldValue>;
}

export interface UpdateRecordData {
  id: string;
  fields: Record<string, AirtableFieldValue>;
}

// ============================================================================
// Rate Limiter
// ============================================================================

class RateLimiter {
  private queue: Array<() => Promise<void>> = [];
  private processing = false;
  private readonly requestsPerSecond: number;
  private readonly minDelayMs: number;
  private lastRequestTime = 0;

  constructor(requestsPerSecond: number = 5) {
    this.requestsPerSecond = requestsPerSecond;
    this.minDelayMs = 1000 / requestsPerSecond;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;

      if (timeSinceLastRequest < this.minDelayMs) {
        await this.sleep(this.minDelayMs - timeSinceLastRequest);
      }

      const task = this.queue.shift();
      if (task) {
        this.lastRequestTime = Date.now();
        await task();
      }
    }

    this.processing = false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Global rate limiter instance (5 requests per second per Airtable limits)
const rateLimiter = new RateLimiter(5);

// ============================================================================
// Error Handling
// ============================================================================

export class AirtableError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'AirtableError';
  }
}

async function handleAirtableResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    const errorMessage =
      (errorData as { error?: { message?: string } })?.error?.message ||
      `Airtable API error: ${response.status} ${response.statusText}`;

    throw new AirtableError(errorMessage, response.status, errorData);
  }

  return (await response.json()) as T;
}

// ============================================================================
// Exponential Backoff for Retries
// ============================================================================

async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on client errors (4xx except 429)
      if (
        error instanceof AirtableError &&
        error.statusCode &&
        error.statusCode >= 400 &&
        error.statusCode < 500 &&
        error.statusCode !== 429
      ) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      console.warn(
        `Airtable API request failed (attempt ${attempt + 1}/${maxRetries + 1}), ` +
        `retrying in ${Math.round(delay)}ms...`,
        lastError.message
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// ============================================================================
// API Client Methods
// ============================================================================

const AIRTABLE_API_BASE = 'https://api.airtable.com/v0';
const AIRTABLE_META_API_BASE = 'https://api.airtable.com/v0/meta';

/**
 * Lists all bases the user has access to
 * Requires: data.records:read or schema.bases:read scope
 */
export async function listBases(accessToken: string): Promise<AirtableBase[]> {
  return rateLimiter.execute(async () => {
    return fetchWithRetry(async () => {
      const response = await fetch(`${AIRTABLE_META_API_BASE}/bases`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await handleAirtableResponse<ListBasesResponse>(response);

      // Handle pagination if there are more bases
      let allBases = data.bases;
      let offset = data.offset;

      while (offset) {
        const nextResponse = await fetch(
          `${AIRTABLE_META_API_BASE}/bases?offset=${offset}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const nextData = await handleAirtableResponse<ListBasesResponse>(nextResponse);
        allBases = allBases.concat(nextData.bases);
        offset = nextData.offset;
      }

      return allBases;
    });
  });
}

/**
 * Gets the schema (tables and fields) for a specific base
 * Requires: schema.bases:read scope
 */
export async function getBaseSchema(
  accessToken: string,
  baseId: string
): Promise<AirtableBaseSchema> {
  return rateLimiter.execute(async () => {
    return fetchWithRetry(async () => {
      const response = await fetch(
        `${AIRTABLE_META_API_BASE}/bases/${baseId}/tables`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return handleAirtableResponse<AirtableBaseSchema>(response);
    });
  });
}

/**
 * Lists records from a table with optional filtering and pagination
 * Requires: data.records:read scope
 */
export async function listRecords(
  accessToken: string,
  baseId: string,
  tableId: string,
  options: ListRecordsOptions = {}
): Promise<AirtableRecord[]> {
  return rateLimiter.execute(async () => {
    return fetchWithRetry(async () => {
      const params = new URLSearchParams();

      if (options.fields) {
        options.fields.forEach((field) => params.append('fields[]', field));
      }
      if (options.filterByFormula) {
        params.append('filterByFormula', options.filterByFormula);
      }
      if (options.maxRecords) {
        params.append('maxRecords', options.maxRecords.toString());
      }
      if (options.pageSize) {
        params.append('pageSize', Math.min(options.pageSize, 100).toString());
      }
      if (options.sort) {
        options.sort.forEach((sort, index) => {
          params.append(`sort[${index}][field]`, sort.field);
          params.append(`sort[${index}][direction]`, sort.direction);
        });
      }
      if (options.view) {
        params.append('view', options.view);
      }
      if (options.cellFormat) {
        params.append('cellFormat', options.cellFormat);
      }
      if (options.timeZone) {
        params.append('timeZone', options.timeZone);
      }
      if (options.userLocale) {
        params.append('userLocale', options.userLocale);
      }
      if (options.offset) {
        params.append('offset', options.offset);
      }

      const url = `${AIRTABLE_API_BASE}/${baseId}/${tableId}?${params.toString()}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await handleAirtableResponse<ListRecordsResponse>(response);

      // Handle pagination automatically
      let allRecords = data.records;
      let offset = data.offset;

      while (offset && (!options.maxRecords || allRecords.length < options.maxRecords)) {
        const nextOptions = { ...options, offset };
        const nextRecords = await listRecords(accessToken, baseId, tableId, nextOptions);
        allRecords = allRecords.concat(nextRecords);

        // Break if we've fetched enough records
        if (options.maxRecords && allRecords.length >= options.maxRecords) {
          allRecords = allRecords.slice(0, options.maxRecords);
          break;
        }

        offset = undefined; // Pagination is handled recursively
      }

      return allRecords;
    });
  });
}

/**
 * Creates records in a table (max 10 per request per Airtable limits)
 * Requires: data.records:write scope
 */
export async function createRecords(
  accessToken: string,
  baseId: string,
  tableId: string,
  records: CreateRecordData[]
): Promise<AirtableRecord[]> {
  // Validate batch size
  if (records.length === 0) {
    return [];
  }

  if (records.length > 10) {
    throw new AirtableError(
      'Cannot create more than 10 records at once. Please batch your requests.'
    );
  }

  return rateLimiter.execute(async () => {
    return fetchWithRetry(async () => {
      const response = await fetch(`${AIRTABLE_API_BASE}/${baseId}/${tableId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ records }),
      });

      const data = await handleAirtableResponse<CreateRecordsResponse>(response);
      return data.records;
    });
  });
}

/**
 * Updates records in a table (max 10 per request per Airtable limits)
 * Requires: data.records:write scope
 */
export async function updateRecords(
  accessToken: string,
  baseId: string,
  tableId: string,
  records: UpdateRecordData[]
): Promise<AirtableRecord[]> {
  // Validate batch size
  if (records.length === 0) {
    return [];
  }

  if (records.length > 10) {
    throw new AirtableError(
      'Cannot update more than 10 records at once. Please batch your requests.'
    );
  }

  return rateLimiter.execute(async () => {
    return fetchWithRetry(async () => {
      const response = await fetch(`${AIRTABLE_API_BASE}/${baseId}/${tableId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ records }),
      });

      const data = await handleAirtableResponse<UpdateRecordsResponse>(response);
      return data.records;
    });
  });
}

/**
 * Deletes records from a table (max 10 per request per Airtable limits)
 * Requires: data.records:write scope
 */
export async function deleteRecords(
  accessToken: string,
  baseId: string,
  tableId: string,
  recordIds: string[]
): Promise<string[]> {
  // Validate batch size
  if (recordIds.length === 0) {
    return [];
  }

  if (recordIds.length > 10) {
    throw new AirtableError(
      'Cannot delete more than 10 records at once. Please batch your requests.'
    );
  }

  return rateLimiter.execute(async () => {
    return fetchWithRetry(async () => {
      const params = new URLSearchParams();
      recordIds.forEach((id) => params.append('records[]', id));

      const response = await fetch(
        `${AIRTABLE_API_BASE}/${baseId}/${tableId}?${params.toString()}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await handleAirtableResponse<DeleteRecordsResponse>(response);
      return data.records.map((record) => record.id);
    });
  });
}

/**
 * Helper function to batch operations (create/update/delete) into chunks of 10
 */
export function batchOperations<T>(items: T[], batchSize: number = 10): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  return batches;
}
