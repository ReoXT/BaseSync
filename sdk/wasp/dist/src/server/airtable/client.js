/**
 * Typed Airtable API Client
 * Handles API requests to Airtable with rate limiting and proper error handling
 * API Documentation: https://airtable.com/developers/web/api/introduction
 */
// ============================================================================
// Rate Limiter
// ============================================================================
class RateLimiter {
    queue = [];
    processing = false;
    requestsPerSecond;
    minDelayMs;
    lastRequestTime = 0;
    constructor(requestsPerSecond = 5) {
        this.requestsPerSecond = requestsPerSecond;
        this.minDelayMs = 1000 / requestsPerSecond;
    }
    async execute(fn) {
        return new Promise((resolve, reject) => {
            this.queue.push(async () => {
                try {
                    const result = await fn();
                    resolve(result);
                }
                catch (error) {
                    reject(error);
                }
            });
            if (!this.processing) {
                this.processQueue();
            }
        });
    }
    async processQueue() {
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
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
// Global rate limiter instance (5 requests per second per Airtable limits)
const rateLimiter = new RateLimiter(5);
// ============================================================================
// Error Handling
// ============================================================================
export class AirtableError extends Error {
    statusCode;
    response;
    constructor(message, statusCode, response) {
        super(message);
        this.statusCode = statusCode;
        this.response = response;
        this.name = 'AirtableError';
    }
}
async function handleAirtableResponse(response) {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.error?.message ||
            `Airtable API error: ${response.status} ${response.statusText}`;
        throw new AirtableError(errorMessage, response.status, errorData);
    }
    return (await response.json());
}
// ============================================================================
// Exponential Backoff for Retries
// ============================================================================
async function fetchWithRetry(fn, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            // Don't retry on client errors (4xx except 429)
            if (error instanceof AirtableError &&
                error.statusCode &&
                error.statusCode >= 400 &&
                error.statusCode < 500 &&
                error.statusCode !== 429) {
                throw error;
            }
            // Don't retry on last attempt
            if (attempt === maxRetries) {
                break;
            }
            // Exponential backoff with jitter
            const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
            console.warn(`Airtable API request failed (attempt ${attempt + 1}/${maxRetries + 1}), ` +
                `retrying in ${Math.round(delay)}ms...`, lastError.message);
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
export async function listBases(accessToken) {
    return rateLimiter.execute(async () => {
        return fetchWithRetry(async () => {
            const response = await fetch(`${AIRTABLE_META_API_BASE}/bases`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
            const data = await handleAirtableResponse(response);
            // Handle pagination if there are more bases
            let allBases = data.bases;
            let offset = data.offset;
            while (offset) {
                const nextResponse = await fetch(`${AIRTABLE_META_API_BASE}/bases?offset=${offset}`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                });
                const nextData = await handleAirtableResponse(nextResponse);
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
export async function getBaseSchema(accessToken, baseId) {
    return rateLimiter.execute(async () => {
        return fetchWithRetry(async () => {
            const response = await fetch(`${AIRTABLE_META_API_BASE}/bases/${baseId}/tables`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
            return handleAirtableResponse(response);
        });
    });
}
/**
 * Lists records from a table with optional filtering and pagination
 * Requires: data.records:read scope
 */
export async function listRecords(accessToken, baseId, tableId, options = {}) {
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
            const data = await handleAirtableResponse(response);
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
export async function createRecords(accessToken, baseId, tableId, records) {
    // Validate batch size
    if (records.length === 0) {
        return [];
    }
    if (records.length > 10) {
        throw new AirtableError('Cannot create more than 10 records at once. Please batch your requests.');
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
            const data = await handleAirtableResponse(response);
            return data.records;
        });
    });
}
/**
 * Updates records in a table (max 10 per request per Airtable limits)
 * Requires: data.records:write scope
 */
export async function updateRecords(accessToken, baseId, tableId, records) {
    // Validate batch size
    if (records.length === 0) {
        return [];
    }
    if (records.length > 10) {
        throw new AirtableError('Cannot update more than 10 records at once. Please batch your requests.');
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
            const data = await handleAirtableResponse(response);
            return data.records;
        });
    });
}
/**
 * Deletes records from a table (max 10 per request per Airtable limits)
 * Requires: data.records:write scope
 */
export async function deleteRecords(accessToken, baseId, tableId, recordIds) {
    // Validate batch size
    if (recordIds.length === 0) {
        return [];
    }
    if (recordIds.length > 10) {
        throw new AirtableError('Cannot delete more than 10 records at once. Please batch your requests.');
    }
    return rateLimiter.execute(async () => {
        return fetchWithRetry(async () => {
            const params = new URLSearchParams();
            recordIds.forEach((id) => params.append('records[]', id));
            const response = await fetch(`${AIRTABLE_API_BASE}/${baseId}/${tableId}?${params.toString()}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
            const data = await handleAirtableResponse(response);
            return data.records.map((record) => record.id);
        });
    });
}
/**
 * Helper function to batch operations (create/update/delete) into chunks of 10
 */
export function batchOperations(items, batchSize = 10) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
        batches.push(items.slice(i, i + batchSize));
    }
    return batches;
}
//# sourceMappingURL=client.js.map