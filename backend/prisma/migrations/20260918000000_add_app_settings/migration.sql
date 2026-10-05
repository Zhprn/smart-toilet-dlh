CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);

INSERT INTO "AppSetting" ("key", "value", "updatedAt")
VALUES ('QR_AMOUNT', 2000.00, CURRENT_TIMESTAMP);