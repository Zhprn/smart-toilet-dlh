CREATE TYPE "GateOpenSource" AS ENUM ('PAYMENT', 'MANUAL');

CREATE TYPE "GateOpenStatus" AS ENUM (
    'PENDING',
    'SUCCESS',
    'FAILED',
    'DEVICE_NOT_FOUND',
    'DEVICE_OFFLINE',
    'SERVER_UNAVAILABLE'
);

CREATE TABLE "GateOpenLog" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "deviceCode" TEXT NOT NULL,
    "source" "GateOpenSource" NOT NULL,
    "status" "GateOpenStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    CONSTRAINT "GateOpenLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GateOpenLog_createdAt_idx" ON "GateOpenLog"("createdAt");
CREATE INDEX "GateOpenLog_deviceCode_createdAt_idx" ON "GateOpenLog"("deviceCode", "createdAt");
CREATE INDEX "GateOpenLog_transactionId_idx" ON "GateOpenLog"("transactionId");