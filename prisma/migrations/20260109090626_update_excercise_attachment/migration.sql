/*
  Warnings:

  - You are about to drop the column `attempId` on the `excercise_attachments` table. All the data in the column will be lost.
  - Added the required column `attemptId` to the `excercise_attachments` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "excercise_attachments" DROP CONSTRAINT "excercise_attachments_attempId_fkey";

-- AlterTable
ALTER TABLE "excercise_attachments" DROP COLUMN "attempId",
ADD COLUMN     "attemptId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "excercise_attachments" ADD CONSTRAINT "excercise_attachments_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "excercise_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
