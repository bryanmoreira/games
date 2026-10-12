-- AlterTable
ALTER TABLE "user" ADD COLUMN     "displayUsername" TEXT,
ADD COLUMN     "username" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");


-- Contas que já existiam ganham um username a partir do e-mail (com sufixo se repetir)
WITH base AS (
  SELECT id,
         left(regexp_replace(lower(split_part(email, '@', 1)), '[^a-z0-9_]', '', 'g'), 16) AS b,
         row_number() OVER (PARTITION BY left(regexp_replace(lower(split_part(email, '@', 1)), '[^a-z0-9_]', '', 'g'), 16) ORDER BY "createdAt") AS n
  FROM "user"
  WHERE "username" IS NULL
)
UPDATE "user" u
SET "username" = CASE WHEN length(base.b) < 3 THEN 'jogador' || substr(md5(u.id), 1, 6)
                      WHEN base.n = 1 THEN base.b
                      ELSE base.b || base.n END,
    "displayUsername" = NULL
FROM base
WHERE u.id = base.id;
