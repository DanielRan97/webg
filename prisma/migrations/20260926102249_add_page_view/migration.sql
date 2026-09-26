-- CreateTable
CREATE TABLE "PageView" (
    "id" TEXT NOT NULL,
    "websiteId" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PageView_websiteId_idx" ON "PageView"("websiteId");

-- CreateIndex
CREATE UNIQUE INDEX "PageView_websiteId_day_key" ON "PageView"("websiteId", "day");

-- AddForeignKey
ALTER TABLE "PageView" ADD CONSTRAINT "PageView_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;
