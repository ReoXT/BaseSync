-- CreateTable
CREATE TABLE "UsageStats" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "recordsSynced" INTEGER NOT NULL DEFAULT 0,
    "syncConfigsCreated" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UsageStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UsageStats_userId_idx" ON "UsageStats"("userId");

-- CreateIndex
CREATE INDEX "UsageStats_month_idx" ON "UsageStats"("month");

-- CreateIndex
CREATE UNIQUE INDEX "UsageStats_userId_month_key" ON "UsageStats"("userId", "month");

-- AddForeignKey
ALTER TABLE "UsageStats" ADD CONSTRAINT "UsageStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
