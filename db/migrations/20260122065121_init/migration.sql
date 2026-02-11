-- CreateEnum
CREATE TYPE "SyncDirection" AS ENUM ('AIRTABLE_TO_SHEETS', 'SHEETS_TO_AIRTABLE', 'BIDIRECTIONAL');

-- CreateEnum
CREATE TYPE "ConflictResolution" AS ENUM ('AIRTABLE_WINS', 'SHEETS_WINS', 'NEWEST_WINS');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('SUCCESS', 'FAILED', 'PARTIAL');

-- CreateTable
CREATE TABLE "AirtableConnection" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "accountId" TEXT,

    CONSTRAINT "AirtableConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleSheetsConnection" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "googleAccountEmail" TEXT,

    CONSTRAINT "GoogleSheetsConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncConfig" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "airtableBaseId" TEXT NOT NULL,
    "airtableTableId" TEXT NOT NULL,
    "airtableTableName" TEXT,
    "googleSpreadsheetId" TEXT NOT NULL,
    "googleSheetId" TEXT NOT NULL,
    "googleSheetName" TEXT,
    "fieldMappings" TEXT NOT NULL,
    "syncDirection" "SyncDirection" NOT NULL DEFAULT 'BIDIRECTIONAL',
    "conflictResolution" "ConflictResolution" NOT NULL DEFAULT 'NEWEST_WINS',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncStatus" TEXT,

    CONSTRAINT "SyncConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncConfigId" TEXT NOT NULL,
    "status" "SyncStatus" NOT NULL,
    "recordsSynced" INTEGER NOT NULL DEFAULT 0,
    "recordsFailed" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "triggeredBy" TEXT,
    "direction" TEXT,

    CONSTRAINT "SyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AirtableConnection_userId_idx" ON "AirtableConnection"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AirtableConnection_userId_key" ON "AirtableConnection"("userId");

-- CreateIndex
CREATE INDEX "GoogleSheetsConnection_userId_idx" ON "GoogleSheetsConnection"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleSheetsConnection_userId_key" ON "GoogleSheetsConnection"("userId");

-- CreateIndex
CREATE INDEX "SyncConfig_userId_idx" ON "SyncConfig"("userId");

-- CreateIndex
CREATE INDEX "SyncConfig_isActive_idx" ON "SyncConfig"("isActive");

-- CreateIndex
CREATE INDEX "SyncConfig_lastSyncAt_idx" ON "SyncConfig"("lastSyncAt");

-- CreateIndex
CREATE INDEX "SyncLog_syncConfigId_idx" ON "SyncLog"("syncConfigId");

-- CreateIndex
CREATE INDEX "SyncLog_status_idx" ON "SyncLog"("status");

-- CreateIndex
CREATE INDEX "SyncLog_startedAt_idx" ON "SyncLog"("startedAt");

-- AddForeignKey
ALTER TABLE "AirtableConnection" ADD CONSTRAINT "AirtableConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoogleSheetsConnection" ADD CONSTRAINT "GoogleSheetsConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncConfig" ADD CONSTRAINT "SyncConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncLog" ADD CONSTRAINT "SyncLog_syncConfigId_fkey" FOREIGN KEY ("syncConfigId") REFERENCES "SyncConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
