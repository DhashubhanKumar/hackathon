-- CreateEnum
CREATE TYPE "PricingMode" AS ENUM ('AUTOMATIC', 'MANUAL');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "autoPricingEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "lastPriceUpdate" TIMESTAMP(3),
ADD COLUMN     "priceUpdateReason" TEXT,
ADD COLUMN     "pricingMode" "PricingMode" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "category" DROP NOT NULL,
ALTER COLUMN "city" DROP NOT NULL;
