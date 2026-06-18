/*
  Warnings:

  - You are about to drop the column `exerciseId` on the `learning_progress` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[studentId,excerciseId]` on the table `learning_progress` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "learning_progress" DROP CONSTRAINT "learning_progress_exerciseId_fkey";

-- DropIndex
DROP INDEX "learning_progress_studentId_exerciseId_key";

-- AlterTable
ALTER TABLE "learning_progress" DROP COLUMN "exerciseId",
ADD COLUMN     "excerciseId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "learning_progress_studentId_excerciseId_key" ON "learning_progress"("studentId", "excerciseId");

-- AddForeignKey
ALTER TABLE "learning_progress" ADD CONSTRAINT "learning_progress_excerciseId_fkey" FOREIGN KEY ("excerciseId") REFERENCES "excercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;
