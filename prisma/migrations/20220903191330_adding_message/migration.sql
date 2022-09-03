-- CreateTable
CREATE TABLE "PositiveMsg" (
    "id" TEXT NOT NULL,
    "msg" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PositiveMsg_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PositiveMsg_slug_key" ON "PositiveMsg"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PositiveMsg_hash_key" ON "PositiveMsg"("hash");
