-- CreateTable
CREATE TABLE "game_result" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "game" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "placement" INTEGER,
    "matchId" TEXT,
    "data" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "game_result_userId_game_createdAt_idx" ON "game_result"("userId", "game", "createdAt");

-- CreateIndex
CREATE INDEX "game_result_matchId_idx" ON "game_result"("matchId");

-- CreateIndex
CREATE INDEX "achievement_userId_unlockedAt_idx" ON "achievement"("userId", "unlockedAt");

-- CreateIndex
CREATE UNIQUE INDEX "achievement_userId_code_key" ON "achievement"("userId", "code");

-- AddForeignKey
ALTER TABLE "game_result" ADD CONSTRAINT "game_result_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievement" ADD CONSTRAINT "achievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

