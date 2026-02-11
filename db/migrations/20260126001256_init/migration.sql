-- AlterTable
ALTER TABLE "SyncConfig" ADD COLUMN     "lastErrorAt" TIMESTAMP(3),
ADD COLUMN     "lastErrorMessage" TEXT;
