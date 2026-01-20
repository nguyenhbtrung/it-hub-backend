/*
  Warnings:

  - A unique constraint covering the columns `[fileId]` on the table `FileUsage` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "FileUsage_fileId_stepId_key";

-- CreateIndex
CREATE UNIQUE INDEX "FileUsage_fileId_key" ON "FileUsage"("fileId");
