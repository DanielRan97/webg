-- AlterTable
ALTER TABLE "BusinessProfile" ADD COLUMN     "deliveryAreas" TEXT,
ADD COLUMN     "deliveryAvailable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deliveryFee" TEXT,
ADD COLUMN     "deliveryFreeOver" TEXT,
ADD COLUMN     "deliveryMinOrder" TEXT,
ADD COLUMN     "deliveryNote" TEXT,
ADD COLUMN     "deliveryTime" TEXT;
