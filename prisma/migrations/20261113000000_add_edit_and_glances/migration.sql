-- AlterTable
ALTER TABLE "Post" ADD COLUMN "editedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Glance" (
    "id" SERIAL NOT NULL,
    "postId" INTEGER NOT NULL,
    "userId" INTEGER,
    "readerKey" TEXT NOT NULL,
    "readCount" INTEGER NOT NULL DEFAULT 1,
    "firstReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Glance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Glance_postId_idx" ON "Glance"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "Glance_postId_readerKey_key" ON "Glance"("postId", "readerKey");

-- AddForeignKey
ALTER TABLE "Glance" ADD CONSTRAINT "Glance_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Glance" ADD CONSTRAINT "Glance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
