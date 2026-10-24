-- AlterTable
ALTER TABLE "BusinessProfile" ADD COLUMN     "itemKind" TEXT NOT NULL DEFAULT 'DISHES';

-- CreateTable
CREATE TABLE "HolidayHour" (
    "id" TEXT NOT NULL,
    "websiteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TEXT,
    "isOpen" BOOLEAN NOT NULL DEFAULT false,
    "openTime" TEXT,
    "closeTime" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "HolidayHour_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HolidayHour_websiteId_idx" ON "HolidayHour"("websiteId");

-- AddForeignKey
ALTER TABLE "HolidayHour" ADD CONSTRAINT "HolidayHour_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;

