import type { JSONValue, JSONObject } from 'wasp/core/serialization';
import { type JobFn } from 'wasp/server/jobs/core/pgBoss';
declare const entities: {
    User: import(".prisma/client").Prisma.UserDelegate<import("@prisma/client/runtime/library.js").DefaultArgs>;
    AirtableConnection: import(".prisma/client").Prisma.AirtableConnectionDelegate<import("@prisma/client/runtime/library.js").DefaultArgs>;
    GoogleSheetsConnection: import(".prisma/client").Prisma.GoogleSheetsConnectionDelegate<import("@prisma/client/runtime/library.js").DefaultArgs>;
    SyncConfig: import(".prisma/client").Prisma.SyncConfigDelegate<import("@prisma/client/runtime/library.js").DefaultArgs>;
    SyncLog: import(".prisma/client").Prisma.SyncLogDelegate<import("@prisma/client/runtime/library.js").DefaultArgs>;
};
export type SyncJob<Input extends JSONObject, Output extends JSONValue | void> = JobFn<Input, Output, typeof entities>;
export declare const syncJob: import("./core/pgBoss/pgBossJob").PgBossJob<JSONObject, void | JSONValue, {
    User: import(".prisma/client").Prisma.UserDelegate<import("@prisma/client/runtime/library.js").DefaultArgs>;
    AirtableConnection: import(".prisma/client").Prisma.AirtableConnectionDelegate<import("@prisma/client/runtime/library.js").DefaultArgs>;
    GoogleSheetsConnection: import(".prisma/client").Prisma.GoogleSheetsConnectionDelegate<import("@prisma/client/runtime/library.js").DefaultArgs>;
    SyncConfig: import(".prisma/client").Prisma.SyncConfigDelegate<import("@prisma/client/runtime/library.js").DefaultArgs>;
    SyncLog: import(".prisma/client").Prisma.SyncLogDelegate<import("@prisma/client/runtime/library.js").DefaultArgs>;
}>;
export {};
//# sourceMappingURL=syncJob.d.ts.map