-- AlterTable
ALTER TABLE "user" ADD COLUMN     "chips" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "loginStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastLoginDay" TEXT;

-- CreateTable
CREATE TABLE "chip_transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chip_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chip_transaction_userId_createdAt_idx" ON "chip_transaction"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "chip_transaction_userId_reason_ref_key" ON "chip_transaction"("userId", "reason", "ref");

-- AddForeignKey
ALTER TABLE "chip_transaction" ADD CONSTRAINT "chip_transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
