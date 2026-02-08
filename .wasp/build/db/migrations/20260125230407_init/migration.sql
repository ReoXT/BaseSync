-- AlterTable
ALTER TABLE "AirtableConnection" ADD COLUMN     "lastRefreshAttempt" TIMESTAMP(3),
ADD COLUMN     "lastRefreshError" TEXT,
ADD COLUMN     "needsReauth" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "GoogleSheetsConnection" ADD COLUMN     "lastRefreshAttempt" TIMESTAMP(3),
ADD COLUMN     "lastRefreshError" TEXT,
ADD COLUMN     "needsReauth" BOOLEAN NOT NULL DEFAULT false;
