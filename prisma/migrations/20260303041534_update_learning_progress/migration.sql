/*
  Warnings:

  - You are about to drop the column `excerciseId` on the `learning_progress` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[studentId,exerciseId]` on the table `learning_progress` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "learning_progress" DROP CONSTRAINT "learning_progress_excerciseId_fkey";

-- DropIndex
DROP INDEX "learning_progress_studentId_excerciseId_key";

-- AlterTable
ALTER TABLE "learning_progress" DROP COLUMN "excerciseId",
ADD COLUMN     "exerciseId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "learning_progress_studentId_exerciseId_key" ON "learning_progress"("studentId", "exerciseId");

-- AddForeignKey
ALTER TABLE "learning_progress" ADD CONSTRAINT "learning_progress_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "excercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;
