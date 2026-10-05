ALTER TABLE "Transaction" ADD COLUMN "gateDeviceId" TEXT;

CREATE INDEX "Transaction_gateDeviceId_idx" ON "Transaction"("gateDeviceId");

ALTER TABLE "Transaction"
ADD CONSTRAINT "Transaction_gateDeviceId_fkey"
FOREIGN KEY ("gateDeviceId") REFERENCES "GateDevices"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;