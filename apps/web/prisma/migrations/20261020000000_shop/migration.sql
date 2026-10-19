-- AlterTable
ALTER TABLE "user" ADD COLUMN     "equippedFrame" TEXT,
ADD COLUMN     "equippedDeck" TEXT;

-- AlterTable
ALTER TABLE "chip_transaction" ADD COLUMN     "byId" TEXT,
ADD COLUMN     "note" TEXT;

-- CreateTable
CREATE TABLE "user_item" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "price" INTEGER,
    "grantedById" TEXT,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" TIMESTAMP(3),
    "removedById" TEXT,

    CONSTRAINT "user_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_item_userId_acquiredAt_idx" ON "user_item"("userId", "acquiredAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_item_userId_itemId_key" ON "user_item"("userId", "itemId");

-- AddForeignKey
ALTER TABLE "user_item" ADD CONSTRAINT "user_item_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
