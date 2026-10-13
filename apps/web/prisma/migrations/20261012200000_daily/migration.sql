
-- AlterTable
ALTER TABLE "game_result" ADD COLUMN     "daily" TEXT;

-- CreateTable
CREATE TABLE "daily_challenge" (
    "game" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_challenge_pkey" PRIMARY KEY ("game","day")
);

-- CreateIndex
CREATE UNIQUE INDEX "game_result_userId_game_daily_key" ON "game_result"("userId", "game", "daily");

