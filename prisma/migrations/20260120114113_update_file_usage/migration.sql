/*
  Warnings:

  - You are about to drop the `FileUsage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "FileUsage" DROP CONSTRAINT "FileUsage_fileId_fkey";

-- DropForeignKey
ALTER TABLE "FileUsage" DROP CONSTRAINT "FileUsage_stepId_fkey";

-- DropTable
DROP TABLE "FileUsage";

-- CreateTable
CREATE TABLE "file_usages" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "stepId" TEXT,

    CONSTRAINT "file_usages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "file_usages_fileId_key" ON "file_usages"("fileId");

-- AddForeignKey
ALTER TABLE "file_usages" ADD CONSTRAINT "file_usages_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_usages" ADD CONSTRAINT "file_usages_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "steps"("id") ON DELETE SET NULL ON UPDATE CASCADE;
