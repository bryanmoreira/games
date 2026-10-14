-- CreateTable
CREATE TABLE "game_invite" (
    "id" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "game" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_invite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "game_invite_toId_createdAt_idx" ON "game_invite"("toId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "game_invite_fromId_toId_code_key" ON "game_invite"("fromId", "toId", "code");

-- AddForeignKey
ALTER TABLE "game_invite" ADD CONSTRAINT "game_invite_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_invite" ADD CONSTRAINT "game_invite_toId_fkey" FOREIGN KEY ("toId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
