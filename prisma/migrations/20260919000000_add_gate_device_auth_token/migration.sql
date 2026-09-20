-- Add a unique device identity and credential for authenticated realtime connections.
ALTER TABLE "GateDevices" ADD COLUMN "authToken" TEXT;
UPDATE "GateDevices" SET "authToken" = gen_random_uuid()::text WHERE "authToken" IS NULL;
ALTER TABLE "GateDevices" ALTER COLUMN "authToken" SET NOT NULL;
ALTER TABLE "GateDevices" ADD CONSTRAINT "GateDevices_deviceCode_key" UNIQUE ("deviceCode");
ALTER TABLE "GateDevices" ADD CONSTRAINT "GateDevices_authToken_key" UNIQUE ("authToken");
